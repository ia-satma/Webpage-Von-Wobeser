import fs from "fs";
import path from "path";
import { getMirrorDir } from "./config";
import { db } from "../db";
import { teamMembers, practiceGroups, industryGroups } from "@shared/schema";

// Maps the original mirror numeric IDs to our DB slugs, so the original
// /index.php/...-l-{id}.html URLs can serve dynamic pages (preserves SEO and
// makes the mirror's existing internal links hit our backend-powered pages).

const decode = (s: string) =>
  String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"');

const norm = (s: string) =>
  decode(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-.,]/g, " ").replace(/\s+/g, " ").trim();

const PRACTICE_ALIASES: Record<string, string> = {
  "labor executive compensations & benefits": "labor & employment",
  "international trade & customs": "international trade",
  "tax (consultancy controversy & litigation)": "tax",
  "esg (environmental social and governance)": "esg (environmental social & corporate governance)",
  "competition & antitrust": "antitrust & competition",
  "administrative and regulatory": "administrative law",
  "industrial & intellectual property": "intellectual property",
};

export type IdMaps = {
  attorney: Map<string, string>;
  practice: Map<string, string>;
  industry: Map<string, string>;
};

function safeReaddir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

export async function buildIdMaps(): Promise<IdMaps> {
  const dir = getMirrorDir();
  const [members, pgs, igs] = await Promise.all([
    db.select({ slug: teamMembers.slug, name: teamMembers.name }).from(teamMembers),
    db.select({ slug: practiceGroups.slug, name: practiceGroups.name }).from(practiceGroups),
    db.select({ slug: industryGroups.slug, name: industryGroups.name }).from(industryGroups),
  ]);
  const memberByName = new Map(members.map((m) => [norm(m.name), m.slug]));
  const pgByName = new Map(pgs.map((p) => [norm(p.name), p.slug]));
  const igByName = new Map(igs.map((i) => [norm(i.name), i.slug]));

  const attorney = new Map<string, string>();
  const practice = new Map<string, string>();
  const industry = new Map<string, string>();

  // Attorneys: meta name="Attorney"
  const lawyerDir = path.join(dir, "index.php", "lawyer");
  for (const f of safeReaddir(lawyerDir)) {
    const m = f.match(/^l-(\d+)\.html$/);
    if (!m) continue;
    const html = fs.readFileSync(path.join(lawyerDir, f), "utf8");
    const name = (html.match(/name="Attorney" content="([^"]*)"/) || [])[1];
    const slug = name && memberByName.get(norm(name));
    if (slug) attorney.set(m[1], slug);
  }

  // Practices: .single__meta--name
  const practiceDir = path.join(dir, "index.php", "practice");
  for (const f of safeReaddir(practiceDir)) {
    const m = f.match(/^p-(\d+)\.html$/);
    if (!m) continue;
    const html = fs.readFileSync(path.join(practiceDir, f), "utf8");
    const t = (html.match(/single__meta--name[^>]*>([^<]+)</) || [])[1];
    const key = t && (PRACTICE_ALIASES[norm(t)] || norm(t));
    const slug = key && pgByName.get(key);
    if (slug) practice.set(m[1], slug);
  }

  // Industries: .single__meta--name
  const industryDir = path.join(dir, "index.php", "industry");
  for (const f of safeReaddir(industryDir)) {
    const m = f.match(/^p-(\d+)\.html$/);
    if (!m) continue;
    const html = fs.readFileSync(path.join(industryDir, f), "utf8");
    const t = (html.match(/single__meta--name[^>]*>([^<]+)</) || [])[1];
    const slug = t && igByName.get(norm(t));
    if (slug) industry.set(m[1], slug);
  }

  return { attorney, practice, industry };
}
