import crypto from "node:crypto";
import type { Request } from "express";

function privacyKey(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.PRIVACY_HASH_KEY?.trim() || env.SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function requestNetworkAddress(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return (first || req.ip || req.socket.remoteAddress || "").trim().slice(0, 256) || null;
}

/**
 * Pseudónimo estable para correlación antifraude sin conservar la dirección en claro.
 * Si falta una clave suficientemente fuerte, se devuelve null: nunca se degrada a texto claro.
 */
export function pseudonymizeNetworkAddress(
  address: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const normalized = String(address || "").trim().toLowerCase().slice(0, 256);
  const key = privacyKey(env);
  if (!normalized || !key) return null;
  const digest = crypto.createHmac("sha256", key)
    .update(`network-address-v1:${normalized}`, "utf8")
    .digest("hex");
  return `hmac-sha256:${digest}`;
}

export function requestNetworkPseudonym(req: Request): string | null {
  return pseudonymizeNetworkAddress(requestNetworkAddress(req));
}
