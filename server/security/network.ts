import dns from "node:dns/promises";
import net from "node:net";

function privateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 0 || b === 168))
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224;
}

function ipv6Words(address: string): number[] | null {
  let input = address.toLowerCase().split("%")[0];
  const dotted = input.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (dotted) {
    const octets = dotted.split(".").map(Number);
    if (octets.length !== 4 || octets.some((value) => value < 0 || value > 255)) return null;
    const highWord = ((octets[0] << 8) | octets[1]).toString(16);
    const lowWord = ((octets[2] << 8) | octets[3]).toString(16);
    input = input.slice(0, -dotted.length)
      + highWord
      + ":"
      + lowWord;
  }
  const halves = input.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const words = [...left, ...Array(missing).fill("0"), ...right];
  if (words.length !== 8 || words.some((word) => !/^[a-f0-9]{1,4}$/i.test(word))) return null;
  return words.map((word) => Number.parseInt(word, 16));
}

export function isPrivateOrReservedIp(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  const family = net.isIP(normalized);
  if (family === 4) return privateIpv4(normalized);
  if (family !== 6) return true;
  const words = ipv6Words(normalized);
  if (!words) return true;
  const [first, second, third, fourth, fifth, sixth, seventh, eighth] = words;
  if (words.every((word) => word === 0) || words.slice(0, 7).every((word) => word === 0) && eighth === 1) return true;
  if ((first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00) return true;
  // IPv4 compatible/mapped: validar también el IPv4 embebido, incluso si viene en hexadecimal.
  if (first === 0 && second === 0 && third === 0 && fourth === 0 && fifth === 0 && (sixth === 0 || sixth === 0xffff)) {
    const embedded = [
      seventh >> 8,
      seventh & 0xff,
      eighth >> 8,
      eighth & 0xff,
    ].join(".");
    return privateIpv4(embedded);
  }
  // NAT64, Teredo, 6to4, documentación y otros bloques especiales no son destinos
  // válidos para los conectores externos del proyecto.
  if (first === 0x0064 && second === 0xff9b) return true;
  if (first === 0x2001 && [0x0000, 0x0001, 0x0002, 0x0003, 0x0010, 0x0020, 0x0db8].includes(second)) return true;
  if (first === 0x2002) return true;
  // Actualmente la asignación global unicast pública está dentro de 2000::/3.
  return first < 0x2000 || first > 0x3fff;
}

export async function assertExternalUrl(
  rawUrl: string,
  isAllowedHostname: (hostname: string) => boolean,
): Promise<URL> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported protocol");
  if (url.username || url.password) throw new Error("URL credentials are not allowed");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!isAllowedHostname(hostname)) throw new Error("Hostname is not allowed");
  if (hostname === "localhost" || hostname.endsWith(".local") || net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new Error("Private destination blocked");
  }
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new Error("Destination resolved to a private or reserved address");
  }
  return url;
}

export async function fetchTextWithPolicy(options: {
  url: string;
  isAllowedHostname: (hostname: string) => boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}): Promise<string> {
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 8_000, 500), 30_000);
  const maxBytes = Math.min(Math.max(options.maxBytes ?? 1_000_000, 1_024), 5_000_000);
  const maxRedirects = Math.min(Math.max(options.maxRedirects ?? 3, 0), 5);
  let current = options.url;

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const validated = await assertExternalUrl(current, options.isAllowedHostname);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(validated, {
        redirect: "manual",
        signal: controller.signal,
        headers: options.headers,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === maxRedirects) throw new Error("Redirect limit reached");
        current = new URL(location, validated).toString();
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const declaredLength = Number(response.headers.get("content-length") || 0);
      if (declaredLength > maxBytes) throw new Error("Response is too large");
      if (!response.body) return "";

      const chunks: Buffer[] = [];
      let total = 0;
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error("Response is too large");
        }
        chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks).toString("utf8");
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Redirect limit reached");
}

export async function fetchStatusWithPolicy(options: {
  url: string;
  isAllowedHostname: (hostname: string) => boolean;
  timeoutMs?: number;
  maxRedirects?: number;
}): Promise<number> {
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 5_000, 500), 30_000);
  const maxRedirects = Math.min(Math.max(options.maxRedirects ?? 2, 0), 5);
  let current = options.url;

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const validated = await assertExternalUrl(current, options.isAllowedHostname);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(validated, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === maxRedirects) return response.status;
        current = new URL(location, validated).toString();
        continue;
      }
      return response.status;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Redirect limit reached");
}
