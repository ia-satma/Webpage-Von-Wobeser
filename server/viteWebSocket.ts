import type { Server } from "node:http";
import type { WsOptions } from "vite";

type ViteWebSocketEnvironment = {
  REPL_ID?: string;
  REPLIT_ENVIRONMENT?: string;
  REPLIT_DEV_DOMAIN?: string;
};

function normalizeReplitDevHost(value: string | undefined): string | undefined {
  const candidate = String(value || "").trim();
  if (!candidate) return undefined;

  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Vite 8 separates the browser WebSocket configuration into `server.ws`.
 * Replit exposes the Express port through an HTTPS reverse proxy, so the HMR
 * client must connect to the public origin over WSS/443 instead of falling
 * back to Vite's internal localhost:5173 address.
 */
export function createViteWebSocketOptions(
  server: Server,
  env: ViteWebSocketEnvironment = process.env,
): WsOptions {
  const replitHost = normalizeReplitDevHost(env.REPLIT_DEV_DOMAIN);
  const isReplit = Boolean(env.REPL_ID || env.REPLIT_ENVIRONMENT || replitHost);

  return {
    server,
    path: "/vite-hmr",
    ...(isReplit
      ? {
          protocol: "wss",
          clientPort: 443,
          ...(replitHost ? { host: replitHost } : {}),
        }
      : {}),
  };
}
