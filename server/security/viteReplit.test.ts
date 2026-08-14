import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Server } from "node:http";
import { createViteWebSocketOptions } from "../viteWebSocket";

const server = {} as Server;

test("Vite conserva el WebSocket local sobre el servidor Express", () => {
  assert.deepEqual(createViteWebSocketOptions(server, {}), {
    server,
    path: "/vite-hmr",
  });
});

test("el compositor de desarrollo usa la API server.ws de Vite 8", () => {
  const source = readFileSync(new URL("../vite.ts", import.meta.url), "utf8");
  assert.match(source, /ws:\s*createViteWebSocketOptions\(server\)/);
  assert.doesNotMatch(source, /hmr:\s*\{\s*server,/);
});

test("la entrada del panel permanece estable y el HTML no se almacena", () => {
  const source = readFileSync(new URL("../vite.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /main\.tsx\?(?:v|entry)=/);
  assert.doesNotMatch(source, /nanoid/);
  assert.match(source, /"Cache-Control":\s*"private, no-store, max-age=0"/);
});

test("Replit fuerza un prebundle completo desde index.html", () => {
  const source = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
  assert.match(source, /optimizeDeps:\s*\{/);
  assert.match(source, /entries:\s*\["index\.html"\]/);
  assert.match(source, /force:\s*process\.env\.REPL_ID\s*!==\s*undefined/);
});

test("Vite usa WSS y el origen público del preview de Replit", () => {
  assert.deepEqual(createViteWebSocketOptions(server, {
    REPL_ID: "repl-id",
    REPLIT_DEV_DOMAIN: "preview-name.spock.replit.dev",
  }), {
    server,
    path: "/vite-hmr",
    protocol: "wss",
    clientPort: 443,
    host: "preview-name.spock.replit.dev",
  });
});

test("Vite normaliza una URL de Replit y descarta hosts inválidos", () => {
  assert.equal(
    createViteWebSocketOptions(server, {
      REPLIT_ENVIRONMENT: "development",
      REPLIT_DEV_DOMAIN: "https://preview-name.spock.replit.dev/path",
    }).host,
    "preview-name.spock.replit.dev",
  );

  const invalid = createViteWebSocketOptions(server, {
    REPL_ID: "repl-id",
    REPLIT_DEV_DOMAIN: "://invalid host",
  });
  assert.equal(invalid.host, undefined);
  assert.equal(invalid.protocol, "wss");
  assert.equal(invalid.clientPort, 443);
});
