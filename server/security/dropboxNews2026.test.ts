import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  CANONICAL_DROPBOX_NEWS_COUNT,
  CANONICAL_DROPBOX_NEWS_SNAPSHOT_DATE,
  applyCanonicalDropboxNews2026,
  canonicalDropboxNewsSeedRows,
  loadCanonicalDropboxNews2026,
  resolveCanonicalDropboxAuthorIds,
} from "../content/canonicalDropboxNews2026";
import { renderRichText } from "../mirror/sanitize";
import { runMigrationWithRedactedLegacyWarnings } from "../../scripts/legacy-migration-log-redaction.mjs";

const mirrorDir = path.resolve(process.cwd(), "frontend-mirror");

test("el snapshot Dropbox contiene las 11 notas faltantes, bilingües y con HTML editorial seguro", () => {
  const items = loadCanonicalDropboxNews2026({ mirrorDir });

  assert.equal(CANONICAL_DROPBOX_NEWS_SNAPSHOT_DATE, "2026-08-14");
  assert.equal(items.length, CANONICAL_DROPBOX_NEWS_COUNT);
  assert.equal(new Set(items.map((item) => item.slug)).size, CANONICAL_DROPBOX_NEWS_COUNT);

  for (const item of items) {
    assert.match(item.date, /^2026-\d{2}-\d{2}$/);
    assert.equal(item.category, "news");
    assert.equal(item.categoryEs, "Noticias");
    assert.equal(item.published, true);
    assert.equal(item.featuredHome, false);
    assert.ok(item.excerpt.length <= 500);
    assert.ok(item.excerptEs.length <= 500);
    assert.match(item.excerpt, /^<p>/);
    assert.match(item.excerptEs, /^<p>/);
    assert.match(item.content, /<p>/);
    assert.match(item.contentEs, /<p>/);
    assert.match(item.content, new RegExp(item.pdf.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(item.contentEs, new RegExp(item.pdfEs.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    for (const html of [item.excerpt, item.excerptEs, item.content, item.contentEs]) {
      assert.doesNotMatch(html, /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|javascript\s*:/i);
      assert.doesNotMatch(renderRichText(html), /<script|\bon\w+\s*=|javascript\s*:/i);
      const $ = cheerio.load(html);
      assert.equal($("script, iframe, object, embed").length, 0);
    }
  }
});

test("los 22 PDF bilingües están versionados, íntegros y listos para descarga pública", () => {
  const items = loadCanonicalDropboxNews2026({ mirrorDir });
  const pdfs = items.flatMap((item) => [item.pdf, item.pdfEs]);

  assert.equal(pdfs.length, 22);
  assert.equal(new Set(pdfs.map((pdf) => pdf.path)).size, 22);
  for (const pdf of pdfs) {
    const file = path.join(mirrorDir, pdf.path.replace(/^\//, ""));
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.length, pdf.size);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.ok(bytes.subarray(-2048).includes(Buffer.from("%%EOF")));
  }
});

test("la semilla agrega las 11 notas y conserva metadatos visuales preexistentes", () => {
  const source = loadCanonicalDropboxNews2026({ mirrorDir })[0];
  const existing = [{
    slug: source.slug,
    title: "stale",
    titleEs: "desactualizado",
    excerpt: "stale",
    excerptEs: "desactualizado",
    imageUrl: "/uploads/curated-image.jpg",
    authorId: "legacy-author",
  }];
  const merged = applyCanonicalDropboxNews2026(existing);
  const updated = merged.find((item) => item.slug === source.slug)!;

  assert.equal(merged.length, 11);
  assert.equal(updated.title, source.title);
  assert.equal(updated.titleEs, source.titleEs);
  assert.equal(updated.imageUrl, "/uploads/curated-image.jpg");
  assert.equal(updated.authorId, "legacy-author");
  assert.equal(canonicalDropboxNewsSeedRows({ mirrorDir }).length, 11);
});

test("la semilla canónica no conserva etiquetas editoriales en el título de Comunicaciones", () => {
  const item = loadCanonicalDropboxNews2026({ mirrorDir }).find(
    (entry) => entry.slug === "reforma-reglas-ley-antilavado-2026",
  );

  assert.ok(item);
  assert.equal(item.title, "Amendment to the General Rules of the Anti-Money Laundering Law (LFPIORPI)");
  assert.equal(item.titleEs, "Reforma a las Reglas de Carácter General de la Ley Antilavado (LFPIORPI)");
  assert.doesNotMatch(`${item.title} ${item.titleEs}`, /^(?:alerta\s+(?:legal|a\s+clientes)|client\s+alert|legal\s+alert)\s*:/i);
});

test("los créditos se resuelven contra abogados existentes y Mauricio Puebla queda explícitamente pendiente", async () => {
  process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";
  const { canonicalTeamMembersData } = await import("../seed");
  const items = loadCanonicalDropboxNews2026({ mirrorDir });
  const unresolved = new Map<string, string>();
  let resolvedCount = 0;

  for (const item of items) {
    const result = resolveCanonicalDropboxAuthorIds(
      item.authors,
      canonicalTeamMembersData.map((member, index) => ({
        id: `member-${index}`,
        name: String(member.name),
        email: member.email ? String(member.email) : null,
      })),
    );
    resolvedCount += result.resolvedIds.length;
    for (const author of result.unresolved) unresolved.set(author.email, author.name);
  }

  assert.equal(resolvedCount, 46);
  assert.deepEqual(Array.from(unresolved.entries()), [["mpuebla@vwys.com.mx", "Mauricio Puebla"]]);
});

test("la migración inserta o actualiza 11 notas sin DDL y sincroniza autores de forma parametrizada", async () => {
  process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";
  const { canonicalTeamMembersData } = await import("../seed");
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => warnings.push(values.map(String).join(" "));
  const migration = await import("../../migrations/20260814_0002_dropbox_news_2026.mjs");

  try {
    await runMigrationWithRedactedLegacyWarnings("20260814_0002_dropbox_news_2026.mjs", migration.default, {
      query: async (sql: string, values: unknown[] = []) => {
        calls.push({ sql, values });
        if (/SELECT id, name, email FROM team_members/i.test(sql)) {
          return {
            rows: canonicalTeamMembersData.map((member, index) => ({
              id: `member-${index}`,
              name: member.name,
              email: member.email,
            })),
          };
        }
        if (/INSERT INTO news\s*\(/i.test(sql)) return { rows: [{ id: `news-${String(values[6])}` }] };
        return { rows: [] };
      },
    });
  } finally {
    console.warn = originalWarn;
  }

  const upserts = calls.filter((call) => /INSERT INTO news\s*\(/i.test(call.sql));
  const relationDeletes = calls.filter((call) => /DELETE FROM news_team_members/i.test(call.sql));
  const relationInserts = calls.filter((call) => /INSERT INTO news_team_members/i.test(call.sql));
  assert.equal(upserts.length, 11);
  assert.equal(relationDeletes.length, 11);
  assert.equal(relationInserts.length, 46);
  assert.ok(upserts.every((call) => call.values.length === 13));
  assert.ok(upserts.every((call) => /ON CONFLICT \(slug\) DO UPDATE/i.test(call.sql)));
  assert.ok(relationInserts.every((call) => /ON CONFLICT \(news_id, team_member_id\) DO NOTHING/i.test(call.sql)));
  assert.ok(warnings.some((warning) => /\[data-quality\] code=UNRESOLVED_SOURCE_AUTHOR_CREDITS source=dropbox-2026 affected_records=1 details=redacted/.test(warning)));
  assert.ok(warnings.every((warning) => !/Mauricio Puebla|mpuebla@vwys\.com\.mx/i.test(warning)));
  const migrationSql = calls.map((call) => call.sql).join("\n");
  assert.doesNotMatch(migrationSql, /\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|COLUMN|INDEX)\b/i);
  assert.doesNotMatch(migrationSql, /DELETE FROM news\b/i);
});
