import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("Autoscale recibe una respuesta sana mientras terminan las rutas públicas", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "server", "index.ts"), "utf8");

  assert.match(source, /app\.get\("\/", respondDuringStartup\)/);
  assert.match(source, /app\.get\("\/healthz", respondDuringStartup\)/);
  assert.match(source, /return res\.status\(200\)\.type\("text\/plain"\)\.send\("Starting"\)/);
  assert.match(source, /applicationReady = true/);
  assert.match(source, /applicationStartupError = true/);
  assert.match(source, /void startBackgroundServices\(\)/);

  const listenAt = source.indexOf("httpServer.listen(");
  const bootstrapAt = source.indexOf("void bootstrapApplication()");
  assert.ok(listenAt >= 0 && bootstrapAt > listenAt, "el socket debe abrirse antes del bootstrap costoso");
});
