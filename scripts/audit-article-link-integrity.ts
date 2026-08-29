import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { auditAllArticleExternalLinks } from "../server/articleExternalLinkIntegrity";
import { closeDatabasePool } from "../server/db";

const root = process.cwd();
const stamp = new Date().toISOString().slice(0, 10);
const apply = process.argv.includes("--apply");
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
const output = path.resolve(root, outputArg ? outputArg.slice("--output=".length) : `output/audits/articulos-enlaces-${stamp}`);

if (apply && process.env.CONFIRM_ARTICLE_LINK_INTEGRITY !== "1") {
  throw new Error("Para aplicar cambios usa CONFIRM_ARTICLE_LINK_INTEGRITY=1 junto con --apply.");
}

function csv(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

try {
  const result = await auditAllArticleExternalLinks({ apply });
  await fs.mkdir(output, { recursive: true });
  const rows = result.results.flatMap((article) => article.verifications.map((link) => ({
    articleId: article.id,
    slug: article.slug,
    published: article.published,
    kind: link.kind,
    url: link.url,
    status: link.status ?? "",
    valid: link.valid,
    finalUrl: link.finalUrl ?? "",
    failureCode: link.failureCode ?? "",
    redirectChain: link.redirectChain.join(" | "),
    contentType: link.contentType,
    action: link.failureCode === "LEGACY_FIRM_PAGE" ? "unpublish_article_legacy_firm_page" : !link.valid && link.kind === "source" ? "unpublish_article" : !link.valid ? "disable_inline_link" : "keep_active",
  })));
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: apply ? "applied" : "read-only",
    totalArticles: result.totalArticles,
    totalLinks: result.totalLinks,
    sourceDisabled: result.sourceDisabled,
    disabledContentLinks: result.disabledContentLinks,
    legacyFirmPageDetected: result.legacyFirmPageDetected,
    publicLegacyFirmPageDetected: result.publicLegacyFirmPageDetected,
  };
  await fs.writeFile(path.join(output, "VWYS_Auditoria_Integridad_Articulos.resumen.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(output, "VWYS_Auditoria_Integridad_Articulos.inventario.json"), `${JSON.stringify(rows, null, 2)}\n`);
  const headers = ["articleId", "slug", "published", "kind", "url", "status", "valid", "finalUrl", "failureCode", "redirectChain", "contentType", "action"];
  await fs.writeFile(path.join(output, "VWYS_Auditoria_Integridad_Articulos.inventario.csv"), `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csv(row[header as keyof typeof row])).join(",")).join("\n")}\n`);
  console.log(JSON.stringify({ ...summary, output }));
} finally {
  await closeDatabasePool().catch(() => undefined);
}
