import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { news } from "@shared/schema";
import { getMirrorDir } from "../mirror/config";
import snapshotJson from "./canonicalDropboxNews2026.json";

export const CANONICAL_DROPBOX_NEWS_SNAPSHOT_DATE = "2026-08-14";
export const CANONICAL_DROPBOX_NEWS_COUNT = 11;

export type CanonicalDropboxNewsAuthor = {
  name: string;
  email: string;
};

export type CanonicalDropboxNewsPdf = {
  path: string;
  sha256: string;
  size: number;
};

export type CanonicalDropboxNewsItem = {
  key: string;
  sourceFolder: string;
  date: string;
  slug: string;
  title: string;
  titleEs: string;
  excerpt: string;
  excerptEs: string;
  content: string;
  contentEs: string;
  category: "news";
  categoryEs: "Noticias";
  tags: string[];
  published: true;
  featuredHome: false;
  pdf: CanonicalDropboxNewsPdf;
  pdfEs: CanonicalDropboxNewsPdf;
  authors: CanonicalDropboxNewsAuthor[];
  sourceFiles: Array<{ language: "en" | "es"; name: string; sha256: string }>;
  contentSha256: string;
};

type CanonicalDropboxNewsSnapshot = {
  snapshotDate: string;
  source: string;
  items: CanonicalDropboxNewsItem[];
  snapshotSha256: string;
};

type TeamMemberIdentity = {
  id: string;
  name: string;
  email?: string | null;
};

const allowedTags = new Set([
  "a", "em", "h2", "p", "strong", "table", "tbody", "td", "th", "thead", "tr", "u",
]);
const sha256Pattern = /^[a-f0-9]{64}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requiredText(value: unknown, label: string): string {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`Missing canonical Dropbox news field: ${label}`);
  return text;
}

function assertSafeRichText(value: string, label: string): void {
  const $ = cheerio.load(`<main id="canonical-dropbox-content">${value}</main>`);
  const root = $("#canonical-dropbox-content");
  if (!root.children().length || /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i.test(value)) {
    throw new Error(`Unsafe canonical Dropbox news HTML: ${label}`);
  }
  root.find("*").each((_, element) => {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) throw new Error(`Unsupported HTML tag in ${label}: ${tag}`);
    const attributes = Object.keys(element.attribs || {});
    if (tag !== "a" && attributes.length) throw new Error(`Unsupported HTML attribute in ${label}: ${tag}`);
    if (tag === "a") {
      if (attributes.some((attribute) => !["href", "target", "rel"].includes(attribute))) {
        throw new Error(`Unsupported link attribute in ${label}`);
      }
      const href = String(element.attribs?.href || "");
      if (!href.startsWith("/images/PDF_news/2026/") && !href.startsWith("https://")) {
        throw new Error(`Unsafe canonical Dropbox news link in ${label}: ${href}`);
      }
      if (element.attribs?.target === "_blank" && !String(element.attribs?.rel || "").split(/\s+/).includes("noopener")) {
        throw new Error(`External canonical link is missing noopener: ${label}`);
      }
    }
  });
}

function assertPdf(pdf: CanonicalDropboxNewsPdf, mirrorDir: string, label: string): void {
  if (!pdf.path.startsWith("/images/PDF_news/2026/") || !sha256Pattern.test(pdf.sha256) || !Number.isSafeInteger(pdf.size) || pdf.size <= 0) {
    throw new Error(`Invalid canonical Dropbox PDF metadata: ${label}`);
  }
  const publicPath = path.join(mirrorDir, pdf.path.replace(/^\//, ""));
  const bytes = fs.readFileSync(publicPath);
  if (bytes.length !== pdf.size || !bytes.subarray(0, 5).equals(Buffer.from("%PDF-")) || !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))) {
    throw new Error(`Invalid canonical Dropbox PDF file: ${label}`);
  }
  if (sha256(bytes) !== pdf.sha256) throw new Error(`Canonical Dropbox PDF checksum changed: ${label}`);
}

function validateItem(item: CanonicalDropboxNewsItem, mirrorDir: string, verifyAssets: boolean): void {
  for (const [field, value] of Object.entries({
    key: item.key,
    sourceFolder: item.sourceFolder,
    date: item.date,
    slug: item.slug,
    title: item.title,
    titleEs: item.titleEs,
    excerpt: item.excerpt,
    excerptEs: item.excerptEs,
    content: item.content,
    contentEs: item.contentEs,
  })) requiredText(value, `${item.slug || "unknown"}.${field}`);

  if (!/^2026-\d{2}-\d{2}$/.test(item.date) || Number.isNaN(Date.parse(`${item.date}T12:00:00.000Z`))) {
    throw new Error(`Invalid canonical Dropbox news date: ${item.slug}`);
  }
  if (!slugPattern.test(item.slug) || item.category !== "news" || item.categoryEs !== "Noticias") {
    throw new Error(`Invalid canonical Dropbox news identity: ${item.slug}`);
  }
  if (item.published !== true || item.featuredHome !== false || !Array.isArray(item.tags) || item.tags.some((tag) => !slugPattern.test(tag))) {
    throw new Error(`Invalid canonical Dropbox news metadata: ${item.slug}`);
  }
  if (item.excerpt.length > 500 || item.excerptEs.length > 500) {
    throw new Error(`Canonical Dropbox news excerpt exceeds the CMS limit: ${item.slug}`);
  }
  for (const [field, html] of Object.entries({ excerpt: item.excerpt, excerptEs: item.excerptEs, content: item.content, contentEs: item.contentEs })) {
    assertSafeRichText(html, `${item.slug}.${field}`);
  }
  for (const author of item.authors) {
    requiredText(author.name, `${item.slug}.author.name`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author.email)) throw new Error(`Invalid author email in ${item.slug}`);
  }
  const itemWithoutHash = { ...item } as Partial<CanonicalDropboxNewsItem>;
  delete itemWithoutHash.contentSha256;
  if (!sha256Pattern.test(item.contentSha256) || sha256(stableStringify(itemWithoutHash)) !== item.contentSha256) {
    throw new Error(`Canonical Dropbox news checksum changed: ${item.slug}`);
  }
  if (verifyAssets) {
    assertPdf(item.pdf, mirrorDir, `${item.slug}.en`);
    assertPdf(item.pdfEs, mirrorDir, `${item.slug}.es`);
  }
}

/** Reads and validates the checked-in editorial snapshot without network or database access. */
export function loadCanonicalDropboxNews2026(options: { mirrorDir?: string; verifyAssets?: boolean } = {}): CanonicalDropboxNewsItem[] {
  const snapshot = structuredClone(snapshotJson) as CanonicalDropboxNewsSnapshot;
  if (snapshot.snapshotDate !== CANONICAL_DROPBOX_NEWS_SNAPSHOT_DATE || snapshot.items.length !== CANONICAL_DROPBOX_NEWS_COUNT) {
    throw new Error("Unexpected canonical Dropbox news snapshot inventory");
  }
  const snapshotWithoutHash = { ...snapshot } as Partial<CanonicalDropboxNewsSnapshot>;
  delete snapshotWithoutHash.snapshotSha256;
  if (!sha256Pattern.test(snapshot.snapshotSha256) || sha256(stableStringify(snapshotWithoutHash)) !== snapshot.snapshotSha256) {
    throw new Error("Canonical Dropbox news snapshot checksum changed");
  }
  const mirrorDir = options.mirrorDir || getMirrorDir();
  const verifyAssets = options.verifyAssets !== false;
  const slugs = new Set<string>();
  for (const item of snapshot.items) {
    validateItem(item, mirrorDir, verifyAssets);
    if (slugs.has(item.slug)) throw new Error(`Duplicate canonical Dropbox news slug: ${item.slug}`);
    slugs.add(item.slug);
  }
  return snapshot.items;
}

export function canonicalDropboxNewsSeedRows(options: { mirrorDir?: string; verifyAssets?: boolean } = {}): Array<typeof news.$inferInsert> {
  return loadCanonicalDropboxNews2026(options).map((item) => ({
    title: item.title,
    titleEs: item.titleEs,
    excerpt: item.excerpt,
    excerptEs: item.excerptEs,
    content: item.content,
    contentEs: item.contentEs,
    slug: item.slug,
    date: new Date(`${item.date}T12:00:00.000Z`),
    published: item.published,
    featuredHome: item.featuredHome,
    category: item.category,
    categoryEs: item.categoryEs,
    tags: [...item.tags],
    processingStatus: "ready",
  }));
}

/** Adds missing canonical notes and refreshes only their editorial seed fields. */
export function applyCanonicalDropboxNews2026<T extends { slug: string }>(existing: readonly T[]): Array<T | typeof news.$inferInsert> {
  const canonical = canonicalDropboxNewsSeedRows();
  const canonicalBySlug = new Map(canonical.map((item) => [item.slug, item]));
  const merged = existing.map((item) => {
    const source = canonicalBySlug.get(item.slug);
    if (!source) return item;
    canonicalBySlug.delete(item.slug);
    return { ...item, ...source };
  });
  return [...merged, ...Array.from(canonicalBySlug.values())];
}

export function normalizeCanonicalDropboxIdentity(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function resolveCanonicalDropboxAuthorIds(
  authors: readonly CanonicalDropboxNewsAuthor[],
  members: readonly TeamMemberIdentity[],
): { resolvedIds: string[]; unresolved: CanonicalDropboxNewsAuthor[] } {
  const byEmail = new Map<string, TeamMemberIdentity[]>();
  const byName = new Map<string, TeamMemberIdentity[]>();
  for (const member of members) {
    const name = normalizeCanonicalDropboxIdentity(member.name);
    byName.set(name, [...(byName.get(name) || []), member]);
    if (member.email) {
      const email = normalizeCanonicalDropboxIdentity(member.email);
      byEmail.set(email, [...(byEmail.get(email) || []), member]);
    }
  }
  const resolvedIds: string[] = [];
  const unresolved: CanonicalDropboxNewsAuthor[] = [];
  for (const author of authors) {
    const emailMatches = byEmail.get(normalizeCanonicalDropboxIdentity(author.email)) || [];
    const nameMatches = byName.get(normalizeCanonicalDropboxIdentity(author.name)) || [];
    const match = emailMatches.length === 1 ? emailMatches[0] : nameMatches.length === 1 ? nameMatches[0] : undefined;
    if (!match) unresolved.push(author);
    else if (!resolvedIds.includes(match.id)) resolvedIds.push(match.id);
  }
  return { resolvedIds, unresolved };
}
