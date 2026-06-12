import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { execFileSync } from "child_process";

// server deps to bundle to reduce openat(2) syscalls (helps cold start times).
// Solo se listan paquetes que el server REALMENTE importa. Se quitaron entradas muertas
// (axios, jsonwebtoken, nodemailer, stripe, uuid, xlsx, passport*, express-session,
// connect-pg-simple, memorystore — 0 imports) y se corrigió el nombre del SDK de Google
// (@google/generative-ai → @google/genai, el paquete que de verdad usa SmartImageGenerator).
const allowlist = [
  "@google/genai",
  "@neondatabase/serverless",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "multer",
  "nanoid",
  "openai",
  "ws",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // Gate de typecheck: no se buildea con errores de TypeScript.
  // execFileSync (sin shell) con comando fijo: sin riesgo de inyección.
  console.log("typechecking...");
  execFileSync("npx", ["tsc"], { stdio: "inherit" });

  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
