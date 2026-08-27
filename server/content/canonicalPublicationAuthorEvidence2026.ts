import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { getMirrorDir } from "../mirror/config";

/**
 * Attribution snapshot extracted from the checked-in, bilingual historic
 * publication mirror. Unlike text matching, the original “Lawyers involved”
 * links identify a concrete attorney legacy id and are therefore suitable as
 * editorial evidence for the public author archive.
 */
export const CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_SNAPSHOT_DATE = "2026-08-26";
export const CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_COUNT = 1765;
export const CANONICAL_PUBLICATION_AUTHOR_REFERENCE_COUNT = 1006;
export const CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_SHA256 =
  "d855633efca57da80434f53024fc108c1501a53842fa10b06639e472bb42b549";

export type PublicationSourceLanguage = "en" | "es";

export type CanonicalPublicationAuthorEvidence = {
  legacyPublicationId: string;
  sourceLanguage: PublicationSourceLanguage;
  attorneyLegacyIds: string[];
  alternateLegacyPublicationId: string | null;
};

export type CanonicalHistoricAttorneyIdentity = {
  legacyId: string;
  name: string;
  title: string;
};

const publicationFileName = /^p_id-(\d+)\.html$/;
const attorneyHref = /(?:lawyer|abogado)\/l-(\d+)\.html/i;
const publicationHref = /(?:publication|publicacion)\/p_id-(\d+)\.html/i;
const digestPattern = /^[a-f0-9]{64}$/;

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const numericSort = (left: string, right: string) => Number(left) - Number(right);

function readSourceFile(
  filePath: string,
  sourceLanguage: PublicationSourceLanguage,
): CanonicalPublicationAuthorEvidence {
  const match = path.basename(filePath).match(publicationFileName);
  if (!match) throw new Error(`Invalid historic publication source file: ${filePath}`);

  const $ = cheerio.load(fs.readFileSync(filePath, "utf8"));
  const attorneyLegacyIds = Array.from(new Set(
    $("a[href]").toArray().flatMap((element) => {
      const legacyMatch = String($(element).attr("href") || "").match(attorneyHref);
      return legacyMatch ? [legacyMatch[1]] : [];
    }),
  )).sort(numericSort);
  const alternateLegacyPublicationId = $(".header__lang--item[href]").toArray()
    .map((element) => String($(element).attr("href") || "").match(publicationHref)?.[1])
    .find((value): value is string => Boolean(value)) || null;

  return {
    legacyPublicationId: match[1],
    sourceLanguage,
    attorneyLegacyIds,
    alternateLegacyPublicationId,
  };
}

/** Reads the immutable historic source corpus. No database or network access is used. */
export function loadCanonicalPublicationAuthorEvidence(
  mirrorDir = getMirrorDir(),
): CanonicalPublicationAuthorEvidence[] {
  const sourceDirectories: Array<{ directory: string; sourceLanguage: PublicationSourceLanguage }> = [
    { directory: "publication", sourceLanguage: "en" },
    { directory: "publicacion", sourceLanguage: "es" },
  ];
  const entries: CanonicalPublicationAuthorEvidence[] = [];

  for (const source of sourceDirectories) {
    const directory = path.join(mirrorDir, "index.php", source.directory);
    for (const fileName of fs.readdirSync(directory)
      .filter((fileName) => publicationFileName.test(fileName))
      .sort((left, right) => numericSort(left.match(publicationFileName)![1], right.match(publicationFileName)![1]))) {
      entries.push(readSourceFile(path.join(directory, fileName), source.sourceLanguage));
    }
  }

  if (entries.length !== CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_COUNT) {
    throw new Error(`Unexpected historic publication source inventory: ${entries.length}`);
  }
  if (new Set(entries.map((entry) => entry.legacyPublicationId)).size !== entries.length) {
    throw new Error("Historic publication source contains duplicate legacy ids");
  }
  if (entries.reduce((total, entry) => total + entry.attorneyLegacyIds.length, 0) !== CANONICAL_PUBLICATION_AUTHOR_REFERENCE_COUNT) {
    throw new Error("Unexpected historic publication attorney reference count");
  }
  const digest = crypto.createHash("sha256").update(stableStringify(entries)).digest("hex");
  if (!digestPattern.test(CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_SHA256) || digest !== CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_SHA256) {
    throw new Error("Historic publication author evidence digest changed");
  }
  return entries;
}

/**
 * Resolves the historic attorney ids used by the publication source to the
 * same name/title identity stored in the public profile snapshots. The source
 * page is deliberately used here instead of a current editorial title, so an
 * attribution remains reproducible even if a role label is later revised.
 */
export function loadCanonicalHistoricAttorneyIdentities(
  evidence = loadCanonicalPublicationAuthorEvidence(),
  mirrorDir = getMirrorDir(),
): ReadonlyMap<string, CanonicalHistoricAttorneyIdentity> {
  const identities = new Map<string, CanonicalHistoricAttorneyIdentity>();
  const legacyIds = Array.from(new Set(evidence.flatMap((entry) => entry.attorneyLegacyIds))).sort(numericSort);

  for (const legacyId of legacyIds) {
    const source = path.join(mirrorDir, "index.php", "lawyer", `l-${legacyId}.html`);
    if (!fs.existsSync(source)) continue;
    const $ = cheerio.load(fs.readFileSync(source, "utf8"));
    const name = $(".attorney__meta--name").first().text().replace(/\s+/g, " ").trim();
    const title = $(".attorney__meta--role").first().text().replace(/\s+/g, " ").trim();
    if (!name || !title) continue;
    identities.set(legacyId, { legacyId, name, title });
  }

  return identities;
}

/**
 * Groups alternate English/Spanish historic pages. A group key is stable across
 * deploys and lets public cards display one item per editorial publication.
 */
export function publicationFamilyKeys(
  evidence: readonly CanonicalPublicationAuthorEvidence[],
): ReadonlyMap<string, string> {
  const parent = new Map(evidence.map((entry) => [entry.legacyPublicationId, entry.legacyPublicationId]));
  const find = (id: string): string => {
    const current = parent.get(id) || id;
    if (current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };
  const join = (left: string, right: string) => {
    if (!parent.has(left) || !parent.has(right)) return;
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    if (numericSort(leftRoot, rightRoot) <= 0) parent.set(rightRoot, leftRoot);
    else parent.set(leftRoot, rightRoot);
  };

  for (const entry of evidence) {
    if (entry.alternateLegacyPublicationId) join(entry.legacyPublicationId, entry.alternateLegacyPublicationId);
  }

  const result = new Map<string, string>();
  for (const entry of evidence) result.set(entry.legacyPublicationId, `legacy:${find(entry.legacyPublicationId)}`);
  return result;
}

export function publicationSourceLanguageByLegacyId(
  evidence: readonly CanonicalPublicationAuthorEvidence[],
): ReadonlyMap<string, PublicationSourceLanguage> {
  return new Map(evidence.map((entry) => [entry.legacyPublicationId, entry.sourceLanguage]));
}
