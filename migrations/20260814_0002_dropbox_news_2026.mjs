import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SNAPSHOT_PATH = path.resolve(process.cwd(), "server", "content", "canonicalDropboxNews2026.json");
const EXPECTED_ITEMS = 11;
const SHA256 = /^[a-f0-9]{64}$/;
const unsafeHtml = /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i;

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function mirrorDir() {
  const candidates = [
    process.env.MIRROR_DIR,
    path.resolve(process.cwd(), "frontend-mirror"),
    path.resolve(process.cwd(), "dist", "frontend-mirror"),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) || candidates[0];
}

function validatePdf(pdf, root, label) {
  if (!pdf?.path?.startsWith("/images/PDF_news/2026/") || !SHA256.test(pdf.sha256) || !Number.isSafeInteger(pdf.size)) {
    throw new Error(`Invalid Dropbox PDF metadata: ${label}`);
  }
  const file = path.join(root, pdf.path.replace(/^\//, ""));
  const bytes = fs.readFileSync(file);
  if (bytes.length !== pdf.size || bytes.subarray(0, 5).toString() !== "%PDF-" || !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))) {
    throw new Error(`Invalid Dropbox PDF asset: ${label}`);
  }
  if (digest(bytes) !== pdf.sha256) throw new Error(`Dropbox PDF checksum changed: ${label}`);
}

function loadSnapshot() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  const { snapshotSha256, ...withoutSnapshotHash } = snapshot;
  if (snapshot.snapshotDate !== "2026-08-14" || snapshot.items?.length !== EXPECTED_ITEMS) {
    throw new Error("Unexpected Dropbox 2026 news inventory");
  }
  if (!SHA256.test(snapshotSha256) || digest(stableStringify(withoutSnapshotHash)) !== snapshotSha256) {
    throw new Error("Dropbox 2026 news snapshot checksum changed");
  }
  const root = mirrorDir();
  const slugs = new Set();
  for (const item of snapshot.items) {
    const { contentSha256, ...withoutContentHash } = item;
    if (!item.slug || slugs.has(item.slug) || !/^2026-\d{2}-\d{2}$/.test(item.date)) {
      throw new Error(`Invalid or duplicate Dropbox news item: ${item.slug}`);
    }
    slugs.add(item.slug);
    if (!SHA256.test(contentSha256) || digest(stableStringify(withoutContentHash)) !== contentSha256) {
      throw new Error(`Dropbox news checksum changed: ${item.slug}`);
    }
    for (const html of [item.excerpt, item.excerptEs, item.content, item.contentEs]) {
      if (!String(html || "").trim() || unsafeHtml.test(html)) throw new Error(`Unsafe Dropbox news content: ${item.slug}`);
    }
    if (item.excerpt.length > 500 || item.excerptEs.length > 500 || item.category !== "news" || item.published !== true) {
      throw new Error(`Invalid Dropbox news CMS fields: ${item.slug}`);
    }
    validatePdf(item.pdf, root, `${item.slug}.en`);
    validatePdf(item.pdfEs, root, `${item.slug}.es`);
  }
  return snapshot.items;
}

function uniqueMatch(index, key) {
  const matches = index.get(key) || [];
  return matches.length === 1 ? matches[0] : undefined;
}

export default async function migrateDropboxNews2026(client) {
  const items = loadSnapshot();
  const membersResult = await client.query("SELECT id, name, email FROM team_members");
  const membersByEmail = new Map();
  const membersByName = new Map();
  for (const member of membersResult.rows) {
    const name = normalize(member.name);
    membersByName.set(name, [...(membersByName.get(name) || []), member]);
    if (member.email) {
      const email = normalize(member.email);
      membersByEmail.set(email, [...(membersByEmail.get(email) || []), member]);
    }
  }

  // Se preservan los créditos en el snapshot editorial, pero los mensajes operativos
  // no deben contener nombres ni correos de personas. Sólo se conserva una clave local
  // para contar créditos distintos durante la migración.
  const unresolvedSourceCreditKeys = new Set();

  for (const item of items) {
    const upserted = await client.query(`
      INSERT INTO news (
        title, title_es, excerpt, excerpt_es, content, content_es, slug, date,
        published, featured_home, category, category_es, tags, processing_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamp, $9, $10, $11, $12, $13::text[], 'ready')
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        title_es = EXCLUDED.title_es,
        excerpt = EXCLUDED.excerpt,
        excerpt_es = EXCLUDED.excerpt_es,
        content = EXCLUDED.content,
        content_es = EXCLUDED.content_es,
        date = EXCLUDED.date,
        published = EXCLUDED.published,
        featured_home = EXCLUDED.featured_home,
        category = EXCLUDED.category,
        category_es = EXCLUDED.category_es,
        tags = EXCLUDED.tags,
        processing_status = EXCLUDED.processing_status,
        last_error = NULL,
        failed_step = NULL
      RETURNING id
    `, [
      item.title,
      item.titleEs,
      item.excerpt,
      item.excerptEs,
      item.content,
      item.contentEs,
      item.slug,
      `${item.date}T12:00:00.000Z`,
      item.published,
      item.featuredHome,
      item.category,
      item.categoryEs,
      item.tags,
    ]);
    const newsId = upserted.rows[0]?.id;
    if (!newsId) throw new Error(`Unable to upsert canonical Dropbox note: ${item.slug}`);

    await client.query("DELETE FROM news_team_members WHERE news_id = $1", [newsId]);
    const memberIds = new Set();
    for (const author of item.authors) {
      const member = uniqueMatch(membersByEmail, normalize(author.email)) || uniqueMatch(membersByName, normalize(author.name));
      if (!member) unresolvedSourceCreditKeys.add(`${normalize(author.name)}\u0000${normalize(author.email)}`);
      else memberIds.add(member.id);
    }
    for (const memberId of memberIds) {
      await client.query(`
        INSERT INTO news_team_members (news_id, team_member_id)
        VALUES ($1, $2)
        ON CONFLICT (news_id, team_member_id) DO NOTHING
      `, [newsId, memberId]);
    }
  }

  if (unresolvedSourceCreditKeys.size) {
    console.warn(
      `[data-quality] code=UNRESOLVED_SOURCE_AUTHOR_CREDITS source=dropbox-2026 ` +
      `affected_records=${unresolvedSourceCreditKeys.size} details=redacted`,
    );
  }
}
