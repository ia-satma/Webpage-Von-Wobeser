#!/usr/bin/env node
import http from "node:http";

const port = Number(process.env.PORT || 5000);
const body = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Instalación pendiente</title><style>body{margin:0;background:#f5f3ef;color:#1b1b1b;font:16px Inter,system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}main{max-width:620px;padding:3rem;background:#fff;border:1px solid #d9d4cc}h1{font:500 2.25rem Gelasio,Georgia,serif;margin-top:0}code{background:#eee8df;padding:.2rem .35rem}</style></head><body><main><h1>Instalación del cliente pendiente</h1><p>Este Repl aún no contiene la base ni los medios transferidos. El sitio público no se expone hasta completar la entrega segura.</p><p>En Shell ejecuta <code>npm run handoff:status -- --directory=.handoff</code> y sigue el diagnóstico. Los correos y contraseñas se configuran únicamente en <strong>Tools → Secrets</strong>.</p></main></body></html>`;

http.createServer((request, response) => {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.statusCode = request.method === "GET" || request.method === "HEAD" ? 200 : 405;
  response.end(request.method === "HEAD" ? undefined : body);
}).listen(port, "0.0.0.0", () => {
  console.log(`[handoff-bootstrap] Instalación pendiente en puerto ${port}. Ejecuta npm run handoff:status -- --directory=.handoff`);
});
