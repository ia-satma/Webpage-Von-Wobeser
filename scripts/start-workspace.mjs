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
  console.warn(`[start-workspace] Handoff pendiente (${status.state}). Se inicia únicamente la pantalla segura de instalación.`);
  await run(process.execPath, ["scripts/handoff-bootstrap-server.mjs"]);
} else {
  await run("npm", ["run", "dev"]);
}
