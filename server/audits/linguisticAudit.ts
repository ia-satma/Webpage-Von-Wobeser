import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { db } from "../db";
import { storage } from "../storage";
import { getMirrorDir } from "../mirror/config";
import {
  alliances,
  awards,
  banners,
  diversityInitiatives,
  events,
  faqs,
  generatedAudio,
  generatedImages,
  generatedPresentations,
  industryGroups,
  jobOpenings,
  legalDocuments,
  news,
  officeImages,
  offices,
  practiceGroups,
  proBonoProjects,
  rankings,
  representativeClients,
  siteConfig,
  specializedDesks,
  teamMembers,
  testimonials,
  type InsertWebsiteAuditFinding,
} from "@shared/schema";

export type LinguisticIssueType = "missing_accent" | "spelling" | "proper_name_variant" | "punctuation" | "mojibake" | "tone_mismatch" | "language_mismatch";

export type LinguisticSuggestion = {
  issueType: LinguisticIssueType;
  original: string;
  suggestion: string;
  confidence: "high" | "medium" | "low";
  reason: string;
};

const ACCENTS: Array<[RegExp, string]> = [
  [/\binformacion\b/gi, "información"], [/\bpublicacion\b/gi, "publicación"],
  [/\bpublicaciones juridicas\b/gi, "publicaciones jurídicas"], [/\bpractica\b/gi, "práctica"],
  [/\bpracticas\b/gi, "prácticas"], [/\banalisis\b/gi, "análisis"],
  [/\bMexico\b/g, "México"], [/\bpagina\b/gi, "página"], [/\bbusqueda\b/gi, "búsqueda"],
  [/\btelefono\b/gi, "teléfono"], [/\bpolitica\b/gi, "política"],
  [/\bjuridico\b/gi, "jurídico"], [/\bjuridica\b/gi, "jurídica"], [/\bjuridicos\b/gi, "jurídicos"], [/\bjuridicas\b/gi, "jurídicas"],
  [/\binclusion\b/gi, "inclusión"], [/\badministracion\b/gi, "administración"],
];
const SPELLING: Array<[RegExp, string]> = [
  [/\badminitraci[oó]n\b/gi, "administración"],
  [/\breconocimeinto\b/gi, "reconocimiento"],
  [/\bprevisualisaci[oó]n\b/gi, "previsualización"],
  [/\bsusripci[oó]n\b/gi, "suscripción"],
];
const MOJIBAKE = /(?:Ã.|Â.|â€|â€™|â€œ|â€”|�)/g;
const FORMAL_TONE: Array<[RegExp, string]> = [
  [/\bManténgase informado\b/g, "Mantente informado"],
  [/\bReciba (?:en )?su correo\b/g, "Recibe en tu correo"],
  [/\bIngrese\b/g, "Ingresa"], [/\bSeleccione\b/g, "Selecciona"], [/\bHaga clic\b/g, "Haz clic"],
];
const ENGLISH_MARKERS = /\b(?:click here|learn more|read more|privacy policy|contact us|search results)\b/i;
const SPANISH_MARKERS = /\b(?:haz clic|leer más|aviso de privacidad|resultados de búsqueda|contáctanos)\b/i;

function preserveCase(source: string, replacement: string): string {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

function allMatches(input: string, pattern: RegExp): RegExpExecArray[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(input)) !== null) {
    matches.push(match);
    if (match[0] === "") matcher.lastIndex += 1;
  }
  return matches;
}

export function analyzeLinguisticText(text: unknown, lang: "es" | "en" = "es"): LinguisticSuggestion[] {
  const input = String(text ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!input) return [];
  const findings: LinguisticSuggestion[] = [];
  for (const match of allMatches(input, MOJIBAKE)) findings.push({ issueType: "mojibake", original: match[0], suggestion: "Revisar y restaurar el carácter original", confidence: "high", reason: "Secuencia típica de codificación UTF-8 dañada." });
  if (/\s+[,.!?;:]/.test(input)) findings.push({ issueType: "punctuation", original: input.match(/\s+[,.!?;:]/)?.[0] || "", suggestion: "Eliminar el espacio anterior al signo", confidence: "high", reason: "Espaciado tipográfico incorrecto." });
  if (lang === "es") {
    for (const [pattern, replacement] of ACCENTS) for (const match of allMatches(input, pattern)) findings.push({ issueType: "missing_accent", original: match[0], suggestion: preserveCase(match[0], replacement), confidence: "medium", reason: "Posible tilde ausente; validar el término en contexto jurídico." });
    for (const [pattern, replacement] of SPELLING) for (const match of allMatches(input, pattern)) findings.push({ issueType: "spelling", original: match[0], suggestion: preserveCase(match[0], replacement), confidence: "high", reason: "Posible error ortográfico detectado con el glosario local." });
    for (const [pattern, replacement] of FORMAL_TONE) for (const match of allMatches(input, pattern)) findings.push({ issueType: "tone_mismatch", original: match[0], suggestion: preserveCase(match[0], replacement), confidence: "high", reason: "La voz institucional confirmada utiliza tuteo." });
    const mismatch = input.match(ENGLISH_MARKERS); if (mismatch) findings.push({ issueType: "language_mismatch", original: mismatch[0], suggestion: "Traducir o validar como nombre propio", confidence: "medium", reason: "Fragmento en inglés dentro de contenido español." });
  } else {
    const mismatch = input.match(SPANISH_MARKERS); if (mismatch) findings.push({ issueType: "language_mismatch", original: mismatch[0], suggestion: "Translate or validate as a proper name", confidence: "medium", reason: "Spanish fragment inside English content." });
  }
  return findings.slice(0, 30);
}

type SourceRecord = { entityType: string; entityId: string; url?: string; fields: Array<{ field: string; language: "es" | "en"; value: unknown }> };

const editUrlFor = (entityType: string, entityId: string, key?: string) => {
  switch (entityType) {
    case "news": return `/admin/news/${entityId}/edit`;
    case "team_member": return `/admin/team/${entityId}/edit`;
    case "practice_group": return "/admin/practice-groups";
    case "industry_group": return "/admin/industry-groups";
    case "ranking":
    case "award": return "/admin/recognitions";
    case "testimonial": return "/admin/testimonials";
    case "office":
    case "office_image": return "/admin/offices";
    case "event": return "/admin/events";
    case "generated_image": return "/admin/generated-images";
    case "generated_audio": return "/admin/generated-audio";
    case "generated_presentation": return "/admin/presentations";
    case "legal_document": return key === "cookie_policy" ? "/admin/cookie-consent" : "/admin/site-config";
    case "site_config": return key?.startsWith("cookie_") || key === "ga4_enabled" ? "/admin/cookie-consent" : "/admin/site-config";
    default: return undefined;
  }
};

const bilingualFields = (row: Record<string, unknown>, pairs: Array<[string, string]>) => pairs.flatMap(([en, es]) => [
  { field: en, language: "en" as const, value: row[en] }, { field: es, language: "es" as const, value: row[es] },
]);

async function dynamicSources(): Promise<{ records: SourceRecord[]; canonicalNames: string[] }> {
  const [newsRows, teamRows, practices, industries, rankingRows, awardRows, testimonialRows, officeRows, officeImageRows, eventRows, configRows, legalRows, allianceRows, clientRows, jobRows, proBonoRows, diversityRows, faqRows, bannerRows, deskRows, generatedImageRows, generatedAudioRows, generatedPresentationRows] = await Promise.all([
    db.select().from(news), db.select().from(teamMembers), db.select().from(practiceGroups), db.select().from(industryGroups),
    db.select().from(rankings), db.select().from(awards), db.select().from(testimonials), db.select().from(offices),
    db.select().from(officeImages), db.select().from(events),
    db.select().from(siteConfig), db.select().from(legalDocuments), db.select().from(alliances), db.select().from(representativeClients),
    db.select().from(jobOpenings), db.select().from(proBonoProjects), db.select().from(diversityInitiatives), db.select().from(faqs),
    db.select().from(banners), db.select().from(specializedDesks), db.select().from(generatedImages),
    db.select().from(generatedAudio), db.select().from(generatedPresentations),
  ]);
  const records: SourceRecord[] = [];
  const add = (entityType: string, rows: Array<Record<string, unknown>>, pairs: Array<[string, string]>) => rows.forEach((row) => {
    const entityId = String(row.id ?? row.key);
    records.push({ entityType, entityId, url: editUrlFor(entityType, entityId, String(row.type ?? row.key ?? "")), fields: bilingualFields(row, pairs) });
  });
  add("news", newsRows, [["title", "titleEs"], ["excerpt", "excerptEs"], ["content", "contentEs"]]);
  add("team_member", teamRows, [["title", "titleEs"], ["role", "roleEs"], ["bio", "bioEs"]]);
  add("practice_group", practices, [["name", "nameEs"], ["description", "descriptionEs"], ["fullDescription", "fullDescriptionEs"]]);
  add("industry_group", industries, [["name", "nameEs"], ["description", "descriptionEs"], ["fullDescription", "fullDescriptionEs"]]);
  add("ranking", rankingRows, [["name", "nameEs"], ["publication", "publicationEs"], ["description", "descriptionEs"]]);
  add("award", awardRows, [["name", "nameEs"], ["organization", "organizationEs"], ["description", "descriptionEs"]]);
  add("testimonial", testimonialRows, [["quote", "quoteEs"], ["authorTitle", "authorTitleEs"], ["source", "sourceEs"]]);
  add("office", officeRows, [["name", "nameEs"], ["country", "countryEs"], ["address", "addressEs"], ["description", "descriptionEs"]]);
  add("event", eventRows, [["title", "titleEs"], ["description", "descriptionEs"], ["location", "locationEs"], ["eventType", "eventTypeEs"]]);
  add("legal_document", legalRows, [["title", "titleEs"], ["content", "contentEs"]]);
  add("alliance", allianceRows, [["name", "nameEs"], ["description", "descriptionEs"], ["country", "countryEs"]]);
  add("representative_client", clientRows, [["industry", "industryEs"], ["description", "descriptionEs"]]);
  add("job_opening", jobRows, [["title", "titleEs"], ["description", "descriptionEs"], ["requirements", "requirementsEs"], ["benefits", "benefitsEs"]]);
  add("pro_bono", proBonoRows, [["title", "titleEs"], ["description", "descriptionEs"], ["impact", "impactEs"]]);
  add("diversity", diversityRows, [["title", "titleEs"], ["description", "descriptionEs"], ["impact", "impactEs"]]);
  add("faq", faqRows, [["question", "questionEs"], ["answer", "answerEs"]]);
  add("banner", bannerRows, [["title", "titleEs"], ["subtitle", "subtitleEs"], ["linkText", "linkTextEs"]]);
  add("specialized_desk", deskRows, [["name", "nameEs"], ["description", "descriptionEs"], ["fullDescription", "fullDescriptionEs"]]);
  officeImageRows.forEach((row) => records.push({
    entityType: "office_image",
    entityId: row.id,
    url: editUrlFor("office_image", row.id),
    fields: [{ field: "alt", language: "en", value: row.alt }, { field: "altEs", language: "es", value: row.altEs }],
  }));
  generatedImageRows.forEach((row) => records.push({
    entityType: "generated_image",
    entityId: row.id,
    url: editUrlFor("generated_image", row.id),
    fields: [
      { field: "prompt", language: "es", value: row.prompt },
      { field: "sanitizedPrompt", language: "es", value: row.sanitizedPrompt },
    ],
  }));
  generatedAudioRows.forEach((row) => records.push({
    entityType: "generated_audio",
    entityId: row.id,
    url: editUrlFor("generated_audio", row.id),
    fields: [{ field: "sourceText", language: "es", value: row.sourceText }],
  }));
  generatedPresentationRows.forEach((row) => {
    const language: "es" | "en" = row.lang === "en" ? "en" : "es";
    records.push({
      entityType: "generated_presentation",
      entityId: row.id,
      url: editUrlFor("generated_presentation", row.id),
      fields: [
        { field: "title", language, value: row.title },
        { field: "topic", language, value: row.topic },
      ],
    });
  });
  configRows.forEach((row) => records.push({ entityType: "site_config", entityId: row.key, url: editUrlFor("site_config", row.key, row.key), fields: [{ field: "value", language: "en", value: row.value }, { field: "valueEs", language: "es", value: row.valueEs }] }));
  return { records, canonicalNames: teamRows.map((member) => member.name).filter(Boolean) };
}

async function walk(root: string, extensions: Set<string>, limit = 20_000): Promise<string[]> {
  const found: string[] = [];
  const visit = async (dir: string) => {
    if (found.length >= limit) return;
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (extensions.has(path.extname(entry.name))) found.push(full);
    }
  };
  await visit(root);
  return found;
}

function properNameIssues(text: string, names: string[]): LinguisticSuggestion[] {
  const issues: LinguisticSuggestion[] = [];
  for (const canonical of names) {
    const plain = canonical.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (plain === canonical || plain.length < 5) continue;
    const pattern = new RegExp(`\\b${plain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const match = text.match(pattern);
    if (match && match[0] !== canonical) issues.push({ issueType: "proper_name_variant", original: match[0], suggestion: canonical, confidence: "high", reason: "Variante sin diacríticos frente al registro canónico de abogados." });
  }
  return issues.slice(0, 10);
}

function extractInterfaceCopy(source: string): string[] {
  const values: string[] = [];
  const add = (value: string) => {
    const normalized = value.replace(/\\[nrt]/g, " ").replace(/\$\{[^}]+\}/g, " ").replace(/\s+/g, " ").trim();
    if (normalized.length >= 4 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalized) && !/^(?:https?:|\/|@|[.#][A-Za-z0-9_-]+$)/.test(normalized)) values.push(normalized);
  };
  for (const match of Array.from(source.matchAll(/>([^<>{}]{4,})</g))) add(match[1]);
  for (const match of Array.from(source.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S]){4,}?)\1/g))) add(match[2]);
  return Array.from(new Set(values)).slice(0, 4_000);
}

function interfaceLanguage(value: string): "es" | "en" {
  const spanishScore = (value.match(/\b(?:el|la|los|las|de|del|para|con|sin|guardar|editar|configuraci[oó]n|administraci[oó]n|espa[nñ]ol|ingl[eé]s|usuario|contrase[nñ]a)\b/gi) || []).length;
  const englishScore = (value.match(/\b(?:the|and|for|with|without|save|edit|settings|user|password|english|spanish|search)\b/gi) || []).length;
  return englishScore > spanishScore ? "en" : "es";
}

export async function runLinguisticAudit(triggeredBy = "manual") {
  const audit = await storage.createWebsiteAudit({ runType: "linguistic", status: "running", triggeredBy });
  const findings: InsertWebsiteAuditFinding[] = [];
  let pagesScanned = 0;
  try {
    const { records, canonicalNames } = await dynamicSources();
    for (const record of records) for (const field of record.fields) {
      const text = String(field.value ?? "");
      const suggestions = [...analyzeLinguisticText(text, field.language), ...properNameIssues(text, canonicalNames)];
      for (const suggestion of suggestions) findings.push({ auditId: audit.id, category: "linguistic", issueType: suggestion.issueType, severity: suggestion.issueType === "mojibake" || suggestion.issueType === "proper_name_variant" ? "high" : "medium", entityType: record.entityType, entityId: record.entityId, language: field.language, url: record.url, details: { field: field.field, original: suggestion.original, suggestion: suggestion.suggestion, confidence: suggestion.confidence, reason: suggestion.reason, validationSource: suggestion.issueType === "proper_name_variant" ? "team_members.name" : "local_glossary" }, recommendation: suggestion.suggestion, ownerAgent: "content_auditor" });
    }
    pagesScanned += records.length;

    const mirrorRoot = getMirrorDir();
    const htmlFiles = await walk(mirrorRoot, new Set([".html"]));
    for (const file of htmlFiles) {
      const raw = await fs.readFile(file, "utf8");
      const $ = cheerio.load(raw); $("script,style,noscript").remove();
      const declaredLang = $("html").attr("lang")?.toLowerCase();
      const normalizedPath = file.replaceAll("\\", "/");
      const lang: "es" | "en" = declaredLang?.startsWith("es") || /\/index\.php\/(?:home|abogado|publicacion|practica|industria|aviso|contacto|nuestra-firma|capacidades)/.test(normalizedPath) ? "es" : "en";
      const text = $("body").text().replace(/\s+/g, " ");
      for (const suggestion of [...analyzeLinguisticText(text, lang), ...properNameIssues(text, canonicalNames)]) findings.push({ auditId: audit.id, category: "linguistic", issueType: suggestion.issueType, severity: suggestion.issueType === "mojibake" ? "high" : "medium", entityType: "legacy_page", entityId: path.relative(mirrorRoot, file), language: lang, url: `/${path.relative(mirrorRoot, file).replaceAll(path.sep, "/")}`, details: { field: "rendered_text", original: suggestion.original, suggestion: suggestion.suggestion, confidence: suggestion.confidence, reason: suggestion.reason, validationSource: suggestion.issueType === "proper_name_variant" ? "team_members.name" : "local_glossary" }, recommendation: suggestion.suggestion });
    }
    pagesScanned += htmlFiles.length;

    const adminFiles = await walk(path.resolve(process.cwd(), "client/src"), new Set([".ts", ".tsx"]));
    for (const file of adminFiles) {
      const raw = await fs.readFile(file, "utf8");
      for (const copy of extractInterfaceCopy(raw)) {
        const language = interfaceLanguage(copy);
        for (const suggestion of [...analyzeLinguisticText(copy, language), ...properNameIssues(copy, canonicalNames)]) findings.push({ auditId: audit.id, category: "linguistic", issueType: suggestion.issueType, severity: suggestion.issueType === "mojibake" || suggestion.issueType === "proper_name_variant" ? "high" : "medium", entityType: "admin_source", entityId: path.relative(process.cwd(), file), language, url: "/admin/audits", details: { field: "interface_copy", original: suggestion.original, suggestion: suggestion.suggestion, confidence: suggestion.confidence, reason: suggestion.reason, validationSource: suggestion.issueType === "proper_name_variant" ? "team_members.name" : "local_glossary" }, recommendation: suggestion.suggestion });
      }
    }
    pagesScanned += adminFiles.length;

    const unique = Array.from(new Map(findings.map((finding) => [`${finding.entityType}|${finding.entityId}|${finding.language}|${finding.issueType}|${JSON.stringify(finding.details)}`, finding])).values()).slice(0, 10_000);
    for (let index = 0; index < unique.length; index += 500) await storage.createWebsiteAuditFindings(unique.slice(index, index + 500));
    const counts = { high: unique.filter((f) => f.severity === "high").length, medium: unique.filter((f) => f.severity === "medium").length, low: unique.filter((f) => f.severity === "low").length };
    await storage.updateWebsiteAudit(audit.id, { status: "completed", completedAt: new Date(), pagesScanned, translationsChecked: records.length, issuesFound: unique.length, highCount: counts.high, mediumCount: counts.medium, lowCount: counts.low, metrics: { dynamicEntities: records.length, historicalHtml: htmlFiles.length, adminSources: adminFiles.length, correctionsPublished: 0 } });
    return { auditId: audit.id, pagesScanned, issuesFound: unique.length };
  } catch (error) {
    await storage.updateWebsiteAudit(audit.id, { status: "failed", completedAt: new Date(), metrics: { error: error instanceof Error ? error.message : "unknown" } });
    throw error;
  }
}
