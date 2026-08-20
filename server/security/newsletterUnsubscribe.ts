import crypto from "node:crypto";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_VERSION = 1;
const TOKEN_BYTES = 1 + 16 + 32;

function signingKey(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.NEWSLETTER_UNSUBSCRIBE_SECRET?.trim() || env.SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

function uuidBytes(id: string): Buffer | null {
  if (!UUID_PATTERN.test(id)) return null;
  return Buffer.from(id.replace(/-/g, ""), "hex");
}

function uuidFromBytes(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createNewsletterUnsubscribeToken(
  subscriberId: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const id = uuidBytes(subscriberId);
  const key = signingKey(env);
  if (!id || !key) return null;
  const body = Buffer.concat([Buffer.from([TOKEN_VERSION]), id]);
  const signature = crypto.createHmac("sha256", key)
    .update("newsletter-unsubscribe-v1\0")
    .update(body)
    .digest();
  return Buffer.concat([body, signature]).toString("base64url");
}

export function verifyNewsletterUnsubscribeToken(
  token: unknown,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{60,80}$/.test(token)) return null;
  const key = signingKey(env);
  if (!key) return null;
  let decoded: Buffer;
  try {
    decoded = Buffer.from(token, "base64url");
  } catch {
    return null;
  }
  if (decoded.length !== TOKEN_BYTES || decoded[0] !== TOKEN_VERSION) return null;
  const body = decoded.subarray(0, 17);
  const supplied = decoded.subarray(17);
  const expected = crypto.createHmac("sha256", key)
    .update("newsletter-unsubscribe-v1\0")
    .update(body)
    .digest();
  if (!crypto.timingSafeEqual(supplied, expected)) return null;
  const id = uuidFromBytes(decoded.subarray(1, 17));
  return UUID_PATTERN.test(id) ? id : null;
}

export function buildNewsletterUnsubscribeUrl(
  siteUrl: string,
  subscriberId: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const token = createNewsletterUnsubscribeToken(subscriberId, env);
  if (!token) return null;
  try {
    const url = new URL("/newsletter/unsubscribe", siteUrl);
    if (url.protocol !== "https:" && env.NODE_ENV === "production") return null;
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return null;
  }
}
