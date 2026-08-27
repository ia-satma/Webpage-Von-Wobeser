import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const EVIDENCE_COUNT = 1765;
const EVIDENCE_REFERENCE_COUNT = 1006;
const EVIDENCE_SHA256 = "d855633efca57da80434f53024fc108c1501a53842fa10b06639e472bb42b549";
const DROPBOX_SNAPSHOT_PATH = path.resolve(process.cwd(), "server", "content", "canonicalDropboxNews2026.json");

const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
const numericSort = (left, right) => Number(left) - Number(right);
const memberIdentity = (member) => `${normalize(member.name)}|${normalize(member.title)}`;
const relationKey = (newsId, teamMemberId) => `${newsId}\u0000${teamMemberId}`;

function mirrorDir() {
  const candidates = [
    process.env.MIRROR_DIR,
    path.resolve(process.cwd(), "frontend-mirror"),
    path.resolve(process.cwd(), "dist", "frontend-mirror"),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) || candidates[0];
}

function loadHistoricEvidence(root) {
  const sources = [
    { directory: "publication", sourceLanguage: "en" },
    { directory: "publicacion", sourceLanguage: "es" },
  ];
  const entries = [];
  for (const source of sources) {
    const directory = path.join(root, "index.php", source.directory);
    for (const fileName of fs.readdirSync(directory)
      .filter((fileName) => /^p_id-\d+\.html$/.test(fileName))
      .sort((left, right) => numericSort(left.match(/\d+/)[0], right.match(/\d+/)[0]))) {
      const legacyPublicationId = fileName.match(/^p_id-(\d+)\.html$/)[1];
      const $ = cheerio.load(fs.readFileSync(path.join(directory, fileName), "utf8"));
      const attorneyLegacyIds = Array.from(new Set(
        $("a[href]").toArray().flatMap((element) => {
          const match = String($(element).attr("href") || "").match(/(?:lawyer|abogado)\/l-(\d+)\.html/i);
          return match ? [match[1]] : [];
        }),
      )).sort(numericSort);
      const alternateLegacyPublicationId = $(".header__lang--item[href]").toArray()
        .map((element) => String($(element).attr("href") || "").match(/(?:publication|publicacion)\/p_id-(\d+)\.html/i)?.[1])
        .find(Boolean) || null;
      entries.push({ legacyPublicationId, sourceLanguage: source.sourceLanguage, attorneyLegacyIds, alternateLegacyPublicationId });
    }
  }
  if (entries.length !== EVIDENCE_COUNT || entries.reduce((total, entry) => total + entry.attorneyLegacyIds.length, 0) !== EVIDENCE_REFERENCE_COUNT) {
    throw new Error("Unexpected historic publication evidence inventory");
  }
  if (digest(stableStringify(entries)) !== EVIDENCE_SHA256) {
    throw new Error("Historic publication evidence digest changed");
  }
  return entries;
}

function profileIdentity(root, legacyAttorneyId, cache) {
  if (cache.has(legacyAttorneyId)) return cache.get(legacyAttorneyId);
  const profilePath = path.join(root, "index.php", "lawyer", `l-${legacyAttorneyId}.html`);
  if (!fs.existsSync(profilePath)) {
    cache.set(legacyAttorneyId, null);
    return null;
  }
  const $ = cheerio.load(fs.readFileSync(profilePath, "utf8"));
  const name = $(".attorney__meta--name").first().text().replace(/\s+/g, " ").trim();
  const title = $(".attorney__meta--role").first().text().replace(/\s+/g, " ").trim();
  const identity = name && title ? `${normalize(name)}|${normalize(title)}` : null;
  cache.set(legacyAttorneyId, identity);
  return identity;
}

function loadDropboxSnapshot() {
  const snapshot = JSON.parse(fs.readFileSync(DROPBOX_SNAPSHOT_PATH, "utf8"));
  const { snapshotSha256, ...withoutDigest } = snapshot;
  if (snapshot.snapshotDate !== "2026-08-14" || !Array.isArray(snapshot.items) || snapshot.items.length !== 11) {
    throw new Error("Unexpected Dropbox 2026 author source inventory");
  }
  if (!/^[a-f0-9]{64}$/.test(snapshotSha256 || "") || digest(stableStringify(withoutDigest)) !== snapshotSha256) {
    throw new Error("Dropbox 2026 author source digest changed");
  }
  return snapshot.items;
}

function uniqueMatch(index, key) {
  const matches = index.get(key) || [];
  return matches.length === 1 ? matches[0] : undefined;
}

export default async function reconcilePublicationAuthors(client) {
  const root = mirrorDir();
  const [historicEvidence, newsResult, membersResult, linksResult] = await Promise.all([
    Promise.resolve(loadHistoricEvidence(root)),
    client.query("SELECT id, legacy_id, slug FROM news WHERE published IS TRUE"),
    client.query("SELECT id, name, title, email FROM team_members WHERE published IS TRUE"),
    client.query(`
      SELECT ntm.news_id, ntm.team_member_id, n.legacy_id
      FROM news_team_members ntm
      INNER JOIN news n ON n.id = ntm.news_id
      INNER JOIN team_members m ON m.id = ntm.team_member_id
      WHERE n.published IS TRUE AND m.published IS TRUE
    `),
  ]);
  const membersByIdentity = new Map();
  const membersByEmail = new Map();
  const membersByName = new Map();
  for (const member of membersResult.rows) {
    const identity = memberIdentity(member);
    membersByIdentity.set(identity, [...(membersByIdentity.get(identity) || []), member]);
    membersByName.set(normalize(member.name), [...(membersByName.get(normalize(member.name)) || []), member]);
    if (member.email) membersByEmail.set(normalize(member.email), [...(membersByEmail.get(normalize(member.email)) || []), member]);
  }
  const newsByLegacyId = new Map(newsResult.rows.filter((item) => item.legacy_id).map((item) => [String(item.legacy_id), item]));
  const newsBySlug = new Map(newsResult.rows.map((item) => [item.slug, item]));
  const evidenceByLegacyId = new Map(historicEvidence.map((entry) => [entry.legacyPublicationId, entry]));
  const profileCache = new Map();
  const expected = new Map();

  for (const entry of historicEvidence) {
    const news = newsByLegacyId.get(entry.legacyPublicationId);
    if (!news) continue;
    for (const attorneyLegacyId of entry.attorneyLegacyIds) {
      const identity = profileIdentity(root, attorneyLegacyId, profileCache);
      const member = identity ? uniqueMatch(membersByIdentity, identity) : undefined;
      if (member) expected.set(relationKey(news.id, member.id), { newsId: news.id, teamMemberId: member.id });
    }
  }

  for (const item of loadDropboxSnapshot()) {
    const news = newsBySlug.get(item.slug);
    if (!news) continue;
    for (const author of item.authors) {
      const member = uniqueMatch(membersByEmail, normalize(author.email)) || uniqueMatch(membersByName, normalize(author.name));
      if (member) expected.set(relationKey(news.id, member.id), { newsId: news.id, teamMemberId: member.id });
    }
  }

  const existing = new Map(linksResult.rows.map((link) => [relationKey(link.news_id, link.team_member_id), link]));
  const missing = [...expected.values()].filter((link) => !existing.has(relationKey(link.newsId, link.teamMemberId)));
  const contradictions = linksResult.rows.filter((link) => {
    if (expected.has(relationKey(link.news_id, link.team_member_id))) return false;
    const evidence = link.legacy_id ? evidenceByLegacyId.get(String(link.legacy_id)) : undefined;
    return Boolean(evidence?.attorneyLegacyIds.length);
  });

  for (const link of missing) {
    await client.query(`
      INSERT INTO news_team_members (news_id, team_member_id)
      VALUES ($1, $2)
      ON CONFLICT (news_id, team_member_id) DO NOTHING
    `, [link.newsId, link.teamMemberId]);
  }
  for (const link of contradictions) {
    await client.query(
      "DELETE FROM news_team_members WHERE news_id = $1 AND team_member_id = $2",
      [link.news_id, link.team_member_id],
    );
  }

  console.log(
    `[migrations] publication-author reconciliation expected=${expected.size} inserted=${missing.length} ` +
    `removed_contradictions=${contradictions.length} retained_without_historic_source=${linksResult.rows.length - contradictions.length - (expected.size - missing.length)}`,
  );
}
