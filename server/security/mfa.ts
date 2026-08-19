import crypto from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const PRIVILEGED_MFA_ROLES = new Set(["super_admin", "admin"]);

function encryptionKey(): Buffer {
  const configured = process.env.MFA_ENCRYPTION_KEY?.trim();
  if (!configured) throw new Error("MFA_ENCRYPTION_KEY is required");
  const decoded = /^[a-f0-9]{64}$/i.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64");
  if (decoded.length !== 32) {
    throw new Error("MFA_ENCRYPTION_KEY must encode exactly 32 random bytes");
  }
  return decoded;
}

export function isMfaConfigured(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * MFA se activa por configuración de despliegue, no por la mera existencia de
 * una clave. Esto permite preparar una migración sin bloquear el Repl actual.
 * En la cuenta que recibe el proyecto debe configurarse explícitamente como
 * `true`; cualquier otro valor se interpreta de forma segura como no activado.
 */
export function isMfaRequiredForRole(role: string): boolean {
  return process.env.MFA_REQUIRED_FOR_PRIVILEGED === "true" && PRIVILEGED_MFA_ROLES.has(role);
}

export function base32Encode(input: Buffer): string {
  let bits = "";
  for (let index = 0; index < input.length; index += 1) {
    bits += input[index].toString(2).padStart(8, "0");
  }
  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    output += BASE32[Number.parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  }
  return output;
}

function base32Decode(value: string): Buffer {
  const normalized = value.toUpperCase().replace(/[\s=-]/g, "");
  let bits = "";
  for (const character of normalized) {
    const index = BASE32.indexOf(character);
    if (index < 0) throw new Error("Invalid base32 value");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function encryptTotpSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string): string {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Invalid MFA secret");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function totpAt(secret: string, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, "0");
}

export function verifyTotp(secret: string, suppliedCode: unknown, now = Date.now()): boolean {
  const code = String(suppliedCode ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);
  for (const drift of [-1, 0, 1]) {
    const expected = totpAt(secret, counter + drift);
    if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expected))) return true;
  }
  return false;
}

export function totpAuthUrl(email: string, secret: string): string {
  const issuer = "Von Wobeser";
  const label = `${issuer}:${email}`;
  const query = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`;
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase(), "utf8").digest("hex");
}

export function generateRecoveryCodes(count = 10): { plain: string[]; hashes: string[] } {
  const plain = Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(8).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
  });
  return { plain, hashes: plain.map(hashRecoveryCode) };
}

export function consumeRecoveryCode(storedHashes: string[], suppliedCode: unknown): string[] | null {
  const candidate = hashRecoveryCode(String(suppliedCode ?? ""));
  const candidateBuffer = Buffer.from(candidate, "hex");
  const index = storedHashes.findIndex((stored) => {
    if (!/^[a-f0-9]{64}$/i.test(stored)) return false;
    const storedBuffer = Buffer.from(stored, "hex");
    return storedBuffer.length === candidateBuffer.length && crypto.timingSafeEqual(storedBuffer, candidateBuffer);
  });
  if (index < 0) return null;
  return storedHashes.filter((_, storedIndex) => storedIndex !== index);
}
