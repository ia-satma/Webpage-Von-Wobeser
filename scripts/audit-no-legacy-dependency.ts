import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";
import { LEGACY_PUBLICATION_PDF_PATHS } from "@shared/legacyPublicationAssets";

const ROOT = process.cwd();
const OLD_RESOURCE = /https?:\/\/(?:www\.)?vonwobeser\.com\/(?:index\.php|images\/(?:PDF|PDF_news|vid_|Socios|Bernardo))/i;
const LEGACY_PAGE = /(?:https?:\/\/(?:www\.)?vonwobeser\.com)?\/index\.php\/(?:publication|publicacion)(?:\/p_id-\d+\.html|\/?\?p_id=\d+)/i;
const RENDERED_LEGACY_LINK = /(?:href|src)=["'](?:https?:\/\/(?:www\.)?vonwobeser\.com\/index\.php|\/index\.php)/i;
const SOURCE_DIRECTORIES = ["client", "server", "shared"];
const SOURCE_EXCEPTIONS = new Set([
  "server/mirror/routes/legacyRedirectRoutes.ts",
  "server/mirror/legacyHtml.ts",
  "server/mirror/htmlPipeline.ts",
  "server/content/canonicalAttorneys.ts",
  "server/seed.ts",
  "server/mirror/runtime.ts",
]);

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(filename));
    else files.push(filename);
  }
  return files;
}

async function auditSource(): Promise<string[]> {
  const failures: string[] = [];
  const files = (await Promise.all(SOURCE_DIRECTORIES.map((directory) => walk(path.join(ROOT, directory))))).flat();
  for (const filename of files) {
    if (!/\.(?:ts|tsx|js|mjs|html)$/i.test(filename)) continue;
    const relative = path.relative(ROOT, filename).split(path.sep).join("/");
    if (SOURCE_EXCEPTIONS.has(relative) || /\.test\.(?:ts|tsx|js|mjs)$/.test(relative)) continue;
    const source = await fs.readFile(filename, "utf8");
    if (OLD_RESOURCE.test(source)) failures.push(`source:${relative}`);
  }
  return failures;
}

async function auditDatabase(): Promise<string[]> {
  const databaseUrl = process.env.DATABASE_APP_URL || process.env.DATABASE_URL;
  if (!databaseUrl) return ["database:not-configured"];
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl, { readOnly: true }));
  await client.connect();
  try {
    const checks = [];
    checks.push(await client.query(`select count(*)::int as count from news where source_url ~* 'vonwobeser\\.com/(index\\.php|images/(PDF|PDF_news|vid_|Socios|Bernardo))' or coalesce(excerpt, '') ~* 'index\\.php/(publication|publicacion)' or coalesce(excerpt_es, '') ~* 'index\\.php/(publication|publicacion)' or coalesce(content, '') ~* 'index\\.php/(publication|publicacion)' or coalesce(content_es, '') ~* 'index\\.php/(publication|publicacion)'`));
    checks.push(await client.query(`select count(*)::int as count from news_translations where coalesce(excerpt, '') ~* 'index\\.php/(publication|publicacion)' or coalesce(content, '') ~* 'index\\.php/(publication|publicacion)'`));
    checks.push(await client.query(`select count(*)::int as count from news_external_links where url ~* 'vonwobeser\\.com/index\\.php/(publication|publicacion)' or normalized_url ~* 'vonwobeser\\.com/index\\.php/(publication|publicacion)'`));
    checks.push(await client.query(`select count(*)::int as count from site_config where value ~* 'vonwobeser\\.com/(index\\.php|images/(PDF|PDF_news|vid_|Socios|Bernardo))' or coalesce(value_es, '') ~* 'vonwobeser\\.com/(index\\.php|images/(PDF|PDF_news|vid_|Socios|Bernardo))'`));
    return checks.flatMap((result, index) => result.rows[0].count > 0 ? [`database:check-${index + 1}:${result.rows[0].count}`] : []);
  } finally {
    await client.end();
  }
}

async function auditRenderedSite(): Promise<string[]> {
  const base = (process.env.LEGACY_DEPENDENCY_AUDIT_URL || "http://127.0.0.1:5050").replace(/\/$/, "");
  const failures: string[] = [];
  const pages = ["/", "/news", "/articles", "/nuestra-firma/diversidad", "/nuevas-oficinas/"];
  for (const page of pages) {
    try {
      const response = await fetch(`${base}${page}`, { signal: AbortSignal.timeout(15_000) });
      const html = await response.text();
      if (!response.ok) failures.push(`render:${page}:HTTP-${response.status}`);
      else if (OLD_RESOURCE.test(html) || RENDERED_LEGACY_LINK.test(html) || LEGACY_PAGE.test(html)) failures.push(`render:${page}:legacy-link`);
    } catch {
      failures.push(`render:${page}:unavailable`);
    }
  }
  for (const publicPath of Object.values(LEGACY_PUBLICATION_PDF_PATHS)) {
    try {
      const response = await fetch(`${base}${publicPath}`, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
      if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("application/pdf")) {
        failures.push(`document:${publicPath}:unavailable`);
      }
    } catch {
      failures.push(`document:${publicPath}:unavailable`);
    }
  }
  return failures;
}

async function main(): Promise<void> {
  const [source, database, rendered] = await Promise.all([auditSource(), auditDatabase(), auditRenderedSite()]);
  const failures = [...source, ...database, ...rendered];
  console.log(JSON.stringify({ checked: { source: true, database: true, renderedRoutes: 5, migratedPdfRoutes: 9 }, failures }, null, 2));
  if (failures.length) throw new Error(`La auditoría encontró ${failures.length} dependencia(s) de la plataforma anterior.`);
}

main().catch((error) => {
  console.error(`[legacy-dependency-audit] ${error instanceof Error ? error.message : "Error desconocido"}`);
  process.exitCode = 1;
});
