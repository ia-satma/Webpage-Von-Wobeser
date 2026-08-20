import crypto from "node:crypto";
import type { Request } from "express";
import type { IncomingMessage, Server } from "node:http";
import type { Socket } from "node:net";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { z } from "zod";
import { effectivePermissions, resolveAdminSession } from "../auth";
import { storage } from "../storage";
import { isMfaRequiredForRole } from "./mfa";

export type PipelineProgress = {
  step: string;
  status: "running" | "completed" | "error";
  language?: string;
  progress?: number;
  message?: string;
  data?: unknown;
};

type PipelineClient = {
  ws: WebSocket;
  userId: string;
  sessionTokenHash: string;
  subscriptions: Set<string>;
  awaitingPong: boolean;
};

const pipelineClients = new Map<string, PipelineClient>();
const articleIdSchema = z.string().uuid();
const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscribe"), articleId: articleIdSchema }).strict(),
  z.object({ type: z.literal("unsubscribe"), articleId: articleIdSchema }).strict(),
]);

const MAX_CONNECTIONS_PER_USER = 3;
const MAX_SUBSCRIPTIONS_PER_CONNECTION = 8;
const MAX_CLIENT_MESSAGE_BYTES = 2_048;

export function isAllowedPipelineOrigin(origin: unknown, host: unknown): boolean {
  if (typeof origin !== "string" || typeof host !== "string" || !origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "https:" || parsed.protocol === "http:")
      && parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function parsePipelineClientMessage(value: string) {
  if (Buffer.byteLength(value, "utf8") > MAX_CLIENT_MESSAGE_BYTES) return null;
  try {
    const parsed = clientMessageSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function hasPipelineAccess(user: { role: string; permissions: unknown }): boolean {
  return effectivePermissions(user as Parameters<typeof effectivePermissions>[0]).has("agents");
}

function rejectUpgrade(socket: Socket, status: 400 | 401 | 403 | 429 | 500): void {
  const reason = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    429: "Too Many Requests",
    500: "Internal Server Error",
  }[status];
  const body = `${reason}\n`;
  socket.write(
    `HTTP/1.1 ${status} ${reason}\r\n`
      + "Connection: close\r\n"
      + "Content-Type: text/plain; charset=utf-8\r\n"
      + "Cache-Control: no-store\r\n"
      + `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`
      + body,
  );
  socket.destroy();
}

function safeSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    ws.terminate();
  }
}

async function revalidateClient(client: PipelineClient): Promise<boolean> {
  const session = await storage.getAdminSession(client.sessionTokenHash);
  if (!session || session.userId !== client.userId) return false;
  const now = new Date();
  const absoluteExpiry = session.absoluteExpiresAt || session.expiresAt;
  if (now > session.expiresAt || now > absoluteExpiry) return false;

  const user = await storage.getAdminUser(client.userId);
  if (!user?.isActive || !hasPipelineAccess(user)) return false;
  return !isMfaRequiredForRole(user.role) || session.mfaVerified;
}

function removeClient(clientId: string): void {
  pipelineClients.delete(clientId);
}

function attachAuthorizedClient(
  ws: WebSocket,
  authorization: { userId: string; sessionTokenHash: string },
): void {
  const clientId = crypto.randomBytes(16).toString("hex");
  const client: PipelineClient = {
    ws,
    userId: authorization.userId,
    sessionTokenHash: authorization.sessionTokenHash,
    subscriptions: new Set(),
    awaitingPong: false,
  };
  pipelineClients.set(clientId, client);

  ws.on("pong", () => {
    client.awaitingPong = false;
  });
  ws.on("close", () => removeClient(clientId));
  ws.on("error", () => removeClient(clientId));
  ws.on("message", (raw: RawData, isBinary: boolean) => {
    if (isBinary) {
      ws.close(1008, "Invalid message");
      return;
    }
    const message = parsePipelineClientMessage(raw.toString());
    if (!message) {
      ws.close(1008, "Invalid message");
      return;
    }

    if (message.type === "subscribe") {
      if (
        !client.subscriptions.has(message.articleId)
        && client.subscriptions.size >= MAX_SUBSCRIPTIONS_PER_CONNECTION
      ) {
        ws.close(1008, "Subscription limit reached");
        return;
      }
      client.subscriptions.add(message.articleId);
    } else {
      client.subscriptions.delete(message.articleId);
    }

    safeSend(ws, { type: message.type === "subscribe" ? "subscribed" : "unsubscribed", articleId: message.articleId });
  });

  safeSend(ws, { type: "connected" });
}

export function setupPipelineWebSocket(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_CLIENT_MESSAGE_BYTES,
    perMessageDeflate: false,
  });

  httpServer.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    let pathname = "";
    try {
      pathname = new URL(req.url || "", "http://websocket.invalid").pathname;
    } catch {
      return;
    }
    if (pathname !== "/ws/pipeline") return;

    void (async () => {
      try {
        if (!isAllowedPipelineOrigin(req.headers.origin, req.headers.host)) {
          rejectUpgrade(socket, 403);
          return;
        }

        const resolved = await resolveAdminSession(req as unknown as Request);
        if (!resolved) {
          rejectUpgrade(socket, 401);
          return;
        }
        if (!hasPipelineAccess(resolved.user)) {
          rejectUpgrade(socket, 403);
          return;
        }
        if (isMfaRequiredForRole(resolved.user.role) && !resolved.session.mfaVerified) {
          rejectUpgrade(socket, 401);
          return;
        }

        const currentConnections = Array.from(pipelineClients.values())
          .filter((client) => client.userId === resolved.user.id).length;
        if (currentConnections >= MAX_CONNECTIONS_PER_USER) {
          rejectUpgrade(socket, 429);
          return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
          attachAuthorizedClient(ws, {
            userId: resolved.user.id,
            sessionTokenHash: resolved.session.tokenHash,
          });
        });
      } catch {
        rejectUpgrade(socket, 500);
      }
    })();
  });

  let heartbeatRunning = false;
  const heartbeat = setInterval(() => {
    if (heartbeatRunning) return;
    heartbeatRunning = true;
    void Promise.all(Array.from(pipelineClients.entries()).map(async ([clientId, client]) => {
      if (client.ws.readyState !== WebSocket.OPEN || client.awaitingPong) {
        client.ws.terminate();
        removeClient(clientId);
        return;
      }
      try {
        if (!await revalidateClient(client)) {
          client.ws.close(1008, "Authorization expired");
          removeClient(clientId);
          return;
        }
        client.awaitingPong = true;
        client.ws.ping();
      } catch {
        client.ws.close(1011, "Authorization unavailable");
        removeClient(clientId);
      }
    })).finally(() => {
      heartbeatRunning = false;
    });
  }, 30_000);
  heartbeat.unref?.();

  httpServer.once("close", () => {
    clearInterval(heartbeat);
    for (const client of Array.from(pipelineClients.values())) client.ws.terminate();
    pipelineClients.clear();
    wss.close();
  });

  return wss;
}

export function broadcastPipelineProgress(articleId: string, data: PipelineProgress): void {
  const parsedArticleId = articleIdSchema.safeParse(articleId);
  if (!parsedArticleId.success) return;
  const payload = {
    articleId: parsedArticleId.data,
    ...data,
    timestamp: new Date().toISOString(),
  };

  for (const client of Array.from(pipelineClients.values())) {
    if (client.subscriptions.has(parsedArticleId.data)) safeSend(client.ws, payload);
  }
}
