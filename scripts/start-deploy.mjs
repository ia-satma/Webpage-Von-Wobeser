#!/usr/bin/env node
import { spawn } from "node:child_process";
import { inspectDatabase } from "./client-handoff.mjs";

function run(command, argumentsList) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} terminó con código ${String(code)}.`)));
  });
}

const status = await inspectDatabase();
if (["empty", "partial", "unavailable"].includes(status.state)) {
  console.warn(`[start-deploy] Handoff pendiente (${status.state}). Se inicia únicamente la pantalla segura de instalación.`);
  await run(process.execPath, ["scripts/handoff-bootstrap-server.mjs"]);
} else {
  await run("npm", ["run", "verify:video-runtime"]);
  await run("npm", ["run", "db:migrate"]);
  // La curación editorial es idempotente y debe ejecutarse después de que
  // source_url exista también en la base del deployment (Preview/producción).
  await run("npm", ["run", "content:apply-article-curation"]);
  await run("npm", ["run", "start"]);
}
