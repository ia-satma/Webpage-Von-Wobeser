import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const HISTORIC_ENTRY_COUNT = 1765;
const HISTORIC_REFERENCE_COUNT = 1006;
const HISTORIC_EVIDENCE_SHA256 = "d855633efca57da80434f53024fc108c1501a53842fa10b06639e472bb42b549";
const DROPBOX_SNAPSHOT_PATH = path.resolve(process.cwd(), "server", "content", "canonicalDropboxNews2026.json");

const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();
const relationKey = (newsId, teamMemberId) => `${newsId}\u0000${teamMemberId}`;
const memberIdentity = (member) => `${normalize(member.name)}|${normalize(member.title)}`;
const numericSort = (left, right) => Number(left) - Number(right);
const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

function mirrorDir() {
  const candidates = [
    process.env.MIRROR_DIR,
    path.resolve(process.cwd(), "frontend-mirror"),
    path.resolve(process.cwd(), "dist", "frontend-mirror"),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) || candidates[0];
}

function loadHistoricEvidence(root) {
  const entries = [];
  for (const source of [{ directory: "publication", sourceLanguage: "en" }, { directory: "publicacion", sourceLanguage: "es" }]) {
    const directory = path.join(root, "index.php", source.directory);
    for (const fileName of fs.readdirSync(directory)
      .filter((name) => /^p_id-\d+\.html$/.test(name))
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
  const references = entries.reduce((total, entry) => total + entry.attorneyLegacyIds.length, 0);
  if (entries.length !== HISTORIC_ENTRY_COUNT || references !== HISTORIC_REFERENCE_COUNT || digest(stableStringify(entries)) !== HISTORIC_EVIDENCE_SHA256) {
    throw new Error("Historic author evidence inventory or digest changed");
  }
  return entries;
}

function loadHistoricAttorneyIdentity(root, legacyId, cache) {
  if (cache.has(legacyId)) return cache.get(legacyId);
  const profilePath = path.join(root, "index.php", "lawyer", `l-${legacyId}.html`);
  if (!fs.existsSync(profilePath)) return null;
  const $ = cheerio.load(fs.readFileSync(profilePath, "utf8"));
  const name = $(".attorney__meta--name").first().text().replace(/\s+/g, " ").trim();
  const title = $(".attorney__meta--role").first().text().replace(/\s+/g, " ").trim();
  const identity = name && title ? `${normalize(name)}|${normalize(title)}` : null;
  cache.set(legacyId, identity);
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

/** Marks only source-backed relationships; all other historical links stay pending. */
export default async function backfillAuthorVerificationStatus(client) {
  const root = mirrorDir();
  const [historicEvidence, newsResult, membersResult] = await Promise.all([
    Promise.resolve(loadHistoricEvidence(root)),
    client.query("SELECT id, legacy_id, slug FROM news WHERE published IS TRUE"),
    client.query("SELECT id, name, title, email FROM team_members WHERE published IS TRUE"),
  ]);
  const membersByIdentity = new Map();
  const membersByName = new Map();
  const membersByEmail = new Map();
  for (const member of membersResult.rows) {
    const identity = memberIdentity(member);
    membersByIdentity.set(identity, [...(membersByIdentity.get(identity) || []), member]);
    membersByName.set(normalize(member.name), [...(membersByName.get(normalize(member.name)) || []), member]);
    if (member.email) membersByEmail.set(normalize(member.email), [...(membersByEmail.get(normalize(member.email)) || []), member]);
  }
  const newsByLegacyId = new Map(newsResult.rows.filter((item) => item.legacy_id).map((item) => [String(item.legacy_id), item]));
  const newsBySlug = new Map(newsResult.rows.map((item) => [item.slug, item]));
  const expected = new Map();
  const profileCache = new Map();

  for (const entry of historicEvidence) {
    const item = newsByLegacyId.get(entry.legacyPublicationId);
    if (!item) continue;
    for (const attorneyLegacyId of entry.attorneyLegacyIds) {
      const identity = loadHistoricAttorneyIdentity(root, attorneyLegacyId, profileCache);
      const member = identity ? uniqueMatch(membersByIdentity, identity) : undefined;
      if (member) expected.set(relationKey(item.id, member.id), { newsId: item.id, teamMemberId: member.id, status: "verified_historic" });
    }
  }
  for (const item of loadDropboxSnapshot()) {
    const news = newsBySlug.get(item.slug);
    if (!news) continue;
    for (const author of item.authors) {
      const member = uniqueMatch(membersByEmail, normalize(author.email)) || uniqueMatch(membersByName, normalize(author.name));
      if (member && !expected.has(relationKey(news.id, member.id))) {
        expected.set(relationKey(news.id, member.id), { newsId: news.id, teamMemberId: member.id, status: "verified_editorial_2026" });
      }
    }
  }

  let historic = 0;
  let editorial2026 = 0;
  for (const relation of expected.values()) {
    const result = await client.query(
      "UPDATE news_team_members SET verification_status = $3 WHERE news_id = $1 AND team_member_id = $2 AND verification_status = 'legacy_unverified'",
      [relation.newsId, relation.teamMemberId, relation.status],
    );
    if (!result.rowCount) continue;
    if (relation.status === "verified_historic") historic += 1;
    else editorial2026 += 1;
  }
  console.log(`[migrations] author verification source_backed=${historic + editorial2026} historic=${historic} editorial_2026=${editorial2026}`);
}
