import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { attachDatabasePoolErrorHandler } from "../database/poolSafety";

test("un error de una conexión ociosa de PostgreSQL no derriba el proceso", () => {
  const pool = new EventEmitter();
  const reports: string[] = [];
  attachDatabasePoolErrorHandler(pool, (message) => reports.push(message));

  assert.doesNotThrow(() => pool.emit("error", new Error("Connection terminated unexpectedly")));
  assert.deepEqual(reports, [
    "[database] idle pool connection error; the client will be replaced: Connection terminated unexpectedly",
  ]);
});

test("el diagnóstico del pool nunca escribe URLs ni contraseñas en los logs", () => {
  const pool = new EventEmitter();
  const reports: string[] = [];
  attachDatabasePoolErrorHandler(pool, (message) => reports.push(message));

  pool.emit("error", new Error("failed postgresql://app:secret@example.test:5432/vwys password=secret"));

  assert.match(reports[0], /database-url-redacted/);
  assert.match(reports[0], /password=\[redacted\]/);
  assert.doesNotMatch(reports[0], /secret|example\.test/);
});
