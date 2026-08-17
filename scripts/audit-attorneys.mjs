#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as cheerio from "cheerio";

const AUDIT_DATE = "2026-08-14";
const OFFICIAL_BASE = "https://www.vonwobeser.com";
const PROJECT_BASE = "https://webpage-von-wobeser-2026.replit.app";
const DEFAULT_OUTPUT = path.resolve(process.cwd(), `output/audits/abogados-${AUDIT_DATE}`);

const CATEGORY_PAGES = [
  { key: "partners", es: "/index.php/abogados/socios", en: "/index.php/attorneys/partners" },
  { key: "of-counsel", es: "/index.php/abogados/of-counsel-sp", en: "/index.php/attorneys/of-counsel" },
  { key: "counsel", es: "/index.php/abogados/counsel-sp", en: "/index.php/attorneys/counsel" },
  { key: "associates", es: "/index.php/abogados/asociados", en: "/index.php/attorneys/associates" },
];

const normalize = (value = "") => String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const normalizeKey = (value = "") => normalize(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();
const normalizePhone = (value = "") => String(value).replace(/\D/g, "");
const normalizeRole = (value = "") => normalizeKey(value)
  .replace(/^socia$/, "partner")
  .replace(/^socio$/, "partner")
  .replace(/^partner$/, "partner")
  .replace(/^asociada$/, "associate")
  .replace(/^asociado$/, "associate")
  .replace(/^associate$/, "associate")
  .replace(/^consejera$/, "counsel")
  .replace(/^consejero$/, "counsel")
  .replace(/^counsel$/, "counsel")
  .replace(/^of\s+consejo$/, "of-counsel")
  .replace(/^of\s+counsel$/, "of-counsel");

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name, fallback) => {
    const token = args.find((arg) => arg.startsWith(`--${name}=`));
    return token ? token.slice(name.length + 3) : fallback;
  };
  return {
    officialBase: value("official-base", OFFICIAL_BASE).replace(/\/$/, ""),
    projectBase: value("project-base", PROJECT_BASE).replace(/\/$/, ""),
    outputDir: path.resolve(value("output-dir", DEFAULT_OUTPUT)),
    concurrency: Math.max(1, Math.min(12, Number(value("concurrency", "8")) || 8)),
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function csvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(file, rows, columns) {
  const content = [
    columns.map(([header]) => csvValue(header)).join(","),
    ...rows.map((row) => columns.map(([, key]) => csvValue(row[key])).join(",")),
  ].join("\n") + "\n";
  fs.writeFileSync(file, content);
}

async function fetchText(url, { attempts = 2, timeoutMs = 25_000 } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "VWYS-Audit/2026-08-14 (+content-integrity; respectful-concurrency)",
          accept: "text/html,application/json;q=0.9,*/*;q=0.7",
        },
      });
      const body = await response.text();
      clearTimeout(timeout);
      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        continue;
      }
      return {
        url,
        finalUrl: response.url,
        status: response.status,
        contentType: response.headers.get("content-type") || "",
        body,
        bytes: Buffer.byteLength(body),
        durationMs: Date.now() - startedAt,
        error: "",
      };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  return {
    url,
    finalUrl: url,
    status: 0,
    contentType: "",
    body: "",
    bytes: 0,
    durationMs: 0,
    error: lastError instanceof Error ? lastError.message : String(lastError || "Unknown error"),
  };
}

async function mapConcurrent(items, concurrency, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  let completed = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
      completed += 1;
      if (completed % 25 === 0 || completed === items.length) {
        process.stdout.write(`[attorney-audit] enlaces verificados ${completed}/${items.length}\n`);
      }
    }
  });
  await Promise.all(workers);
  return output;
}

function listEntries($, labels) {
  const normalizedLabels = labels.map(normalizeKey);
  const target = $(".attorney__meta--list > li").filter((_, element) => {
    const clone = $(element).clone();
    clone.children("ul").remove();
    const label = normalizeKey(clone.text());
    return normalizedLabels.some((candidate) => label.includes(candidate));
  }).first();
  if (!target.length) return [];
  return target.find(":scope > ul > li").map((_, item) => normalize($(item).text())).get()
    .filter((entry) => entry && !["see more", "ver mas"].includes(normalizeKey(entry)));
}

function parseProfile(html) {
  const $ = cheerio.load(html || "");
  const name = normalize($(".attorney__meta--name").first().text());
  const role = normalize($(".attorney__meta--role").first().text());
  const contact = $(".attorney__meta--txt").first();
  const email = normalize(contact.find('a[href^="mailto:"]').first().text()).toLowerCase();
  const phone = normalize(contact.text()).match(/\+?[0-9][0-9()\s-]{6,}/)?.[0]?.trim() || "";
  const introText = normalize($(".attorney__content--intro").first().text());
  const bodyText = normalize($(".attorney__content--txt").first().text());
  return {
    name,
    role,
    email,
    phone,
    introText,
    bodyText,
    practices: listEntries($, ["Practices", "Prácticas"]),
    industries: listEntries($, ["Industry Groups", "Grupos de Industria"]),
    education: listEntries($, ["Education & Experience", "Educación y Experiencia"]),
    affiliations: listEntries($, ["Affiliations & Academic Activities", "Afiliaciones y Actividades Académicas"]),
    rankings: listEntries($, ["Recognitions", "Reconocimientos"]),
    news: listEntries($, ["News", "Noticias"]),
    articles: listEntries($, ["Articles", "Artículos"]),
    languages: listEntries($, ["Languages", "Idiomas"]),
    title: normalize($("title").first().text()),
    noindex: /(?:^|,)\s*noindex\b/i.test($("meta[name=robots]").attr("content") || ""),
  };
}

function parseDirectory(html, language, category, sourceUrl) {
  const $ = cheerio.load(html);
  return $("a.attorneys__list--item").map((_, element) => {
    const item = $(element).attr("data-item") || "";
    const meta = $(`.attorneys__meta--item[data-item="${item}"]`).first();
    const href = $(element).attr("href") || "";
    const legacyId = new URL(href, sourceUrl).searchParams.get("l") || "";
    return {
      legacyId,
      name: normalize($(element).find(".name").text()),
      role: normalize($(element).find(".role").text()),
      email: normalize(meta.find('a[href^="mailto:"]').first().text()).toLowerCase(),
      phone: normalize(meta.text()).match(/\+?[0-9][0-9()\s-]{6,}/)?.[0]?.trim() || "",
      imageUrl: (meta.find(".img").attr("style") || "").match(/url\(([^)]+)\)/)?.[1] || "",
      href: new URL(href, sourceUrl).toString(),
      language,
      category,
    };
  }).get().filter((entry) => entry.legacyId && entry.name);
}

function stripHtml(value) {
  const $ = cheerio.load(`<div id="audit-html">${value || ""}</div>`);
  const root = $("#audit-html");
  const blocks = root.find("p, li, h1, h2, h3, h4, h5, h6").map((_, element) => normalize($(element).text())).get().filter(Boolean);
  return normalize(blocks.length ? blocks.join(" ") : root.text());
}

function textMatches(left, right) {
  return normalizeKey(left) === normalizeKey(right);
}

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function linkClassification(result, expectedName) {
  if (result.error) return "Inaccesible";
  if (result.status >= 500) return "Error 5xx";
  if (result.status === 404 || result.status === 410) return "Roto";
  if (result.status === 401 || result.status === 403 || result.status === 429) return "Bloqueado";
  if (result.status >= 300 && result.status < 400) return "Redirección";
  if (result.status < 200 || result.status >= 300) return `HTTP ${result.status}`;
  const parsed = parseProfile(result.body);
  if (!parsed.name || !textMatches(parsed.name, expectedName)) return "Contenido inesperado";
  return "Correcto";
}

async function main() {
  const options = parseArgs();
  fs.mkdirSync(options.outputDir, { recursive: true });

  const categoryResponses = await Promise.all(CATEGORY_PAGES.flatMap((category) => [
    fetchText(`${options.officialBase}${category.es}`),
    fetchText(`${options.officialBase}${category.en}`),
  ]));
  const categorySources = [];
  const esRows = [];
  const enRows = [];
  let categoryIndex = 0;
  for (const category of CATEGORY_PAGES) {
    const esResponse = categoryResponses[categoryIndex++];
    const enResponse = categoryResponses[categoryIndex++];
    if (esResponse.status !== 200 || enResponse.status !== 200) {
      throw new Error(`No fue posible leer las listas oficiales de ${category.key}`);
    }
    const parsedEs = parseDirectory(esResponse.body, "es", category.key, esResponse.finalUrl);
    const parsedEn = parseDirectory(enResponse.body, "en", category.key, enResponse.finalUrl);
    esRows.push(...parsedEs);
    enRows.push(...parsedEn);
    categorySources.push({
      category: category.key,
      es: { url: esResponse.finalUrl, status: esResponse.status, count: parsedEs.length, sha256: sha256(esResponse.body) },
      en: { url: enResponse.finalUrl, status: enResponse.status, count: parsedEn.length, sha256: sha256(enResponse.body) },
    });
  }

  const projectResponse = await fetchText(`${options.projectBase}/api/team`);
  if (projectResponse.status !== 200) throw new Error(`API del proyecto no disponible: HTTP ${projectResponse.status}`);
  const projectMembers = JSON.parse(projectResponse.body);
  if (!Array.isArray(projectMembers)) throw new Error("La API del proyecto no devolvió una lista de abogados");

  const enById = new Map(enRows.map((row) => [row.legacyId, row]));
  const official = esRows.map((es) => ({ es, en: enById.get(es.legacyId) || null }));
  const duplicateOfficialIds = official.filter((row, index) => official.findIndex((candidate) => candidate.es.legacyId === row.es.legacyId) !== index);
  if (duplicateOfficialIds.length) throw new Error(`IDs oficiales duplicados: ${duplicateOfficialIds.map((row) => row.es.legacyId).join(", ")}`);

  const projectByEmail = new Map(projectMembers
    .filter((member) => normalize(member.email))
    .map((member) => [normalize(member.email).toLowerCase(), member]));
  const usedProjectIds = new Set();
  for (const row of official) {
    let member = projectByEmail.get(row.es.email);
    if (!member) {
      member = projectMembers.find((candidate) =>
        !usedProjectIds.has(candidate.id)
        && textMatches(candidate.name, row.es.name)
        && normalizeRole(candidate.titleEs || candidate.roleEs) === normalizeRole(row.es.role));
    }
    row.project = member || null;
    if (member) usedProjectIds.add(member.id);
  }
  const projectOnly = projectMembers.filter((member) => !usedProjectIds.has(member.id));

  const linkTargets = [];
  for (const row of official) {
    linkTargets.push({ owner: row, kind: "officialEs", url: row.es.href, expectedName: row.es.name });
    if (row.en) linkTargets.push({ owner: row, kind: "officialEn", url: row.en.href, expectedName: row.es.name });
    if (row.project) {
      linkTargets.push({ owner: row, kind: "projectEs", url: `${options.projectBase}/abogado/${row.project.slug}`, expectedName: row.project.name });
      linkTargets.push({ owner: row, kind: "projectEn", url: `${options.projectBase}/lawyer/${row.project.slug}?lang=en`, expectedName: row.project.name });
    }
  }
  for (const member of projectOnly) {
    linkTargets.push({ owner: member, kind: "projectEs", url: `${options.projectBase}/abogado/${member.slug}`, expectedName: member.name, projectOnly: true });
    linkTargets.push({ owner: member, kind: "projectEn", url: `${options.projectBase}/lawyer/${member.slug}?lang=en`, expectedName: member.name, projectOnly: true });
  }

  const linkResponses = await mapConcurrent(linkTargets, options.concurrency, async (target) => {
    const response = await fetchText(target.url);
    const parsed = response.status === 200 ? parseProfile(response.body) : null;
    return {
      ...target,
      response,
      parsed,
      classification: linkClassification(response, target.expectedName),
    };
  });
  const responseByOwner = new Map();
  for (const result of linkResponses) {
    const current = responseByOwner.get(result.owner) || {};
    current[result.kind] = result;
    responseByOwner.set(result.owner, current);
  }

  const matrix = official.map((row) => {
    const links = responseByOwner.get(row) || {};
    const project = row.project;
    const officialEs = links.officialEs?.parsed || {};
    const officialEn = links.officialEn?.parsed || {};
    const projectEs = links.projectEs?.parsed || {};
    const projectEn = links.projectEn?.parsed || {};
    const checks = project ? {
      name: textMatches(row.es.name, project.name),
      roleEs: normalizeRole(row.es.role) === normalizeRole(project.titleEs || project.roleEs),
      roleEn: !row.en || normalizeRole(row.en.role) === normalizeRole(project.title || project.role),
      email: normalize(row.es.email).toLowerCase() === normalize(project.email).toLowerCase(),
      phone: normalizePhone(row.es.phone) === normalizePhone(project.phone),
      introEs: textMatches(officialEs.introText, stripHtml(project.bioIntroEs)),
      introEn: textMatches(officialEn.introText, stripHtml(project.bioIntro)),
      bodyEs: textMatches(officialEs.bodyText, stripHtml(project.bioEs)),
      bodyEn: textMatches(officialEn.bodyText, stripHtml(project.bio)),
      education: countArray(project.education) === (officialEs.education?.length || 0),
      affiliations: countArray(project.affiliations) === (officialEs.affiliations?.length || 0),
      rankings: countArray(project.rankings) === (officialEs.rankings?.length || 0),
      languages: countArray(project.languagesEs) > 0 && countArray(project.languages) > 0,
      projectPageEs: links.projectEs?.classification === "Correcto",
      projectPageEn: links.projectEn?.classification === "Correcto",
      officialPageEs: links.officialEs?.classification === "Correcto",
      officialPageEn: links.officialEn?.classification === "Correcto",
      renderedNameEs: textMatches(projectEs.name, project.name),
      renderedNameEn: textMatches(projectEn.name, project.name),
    } : {};
    const failedChecks = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
    const status = !project
      ? "Faltante en proyecto"
      : failedChecks.length
        ? "Revisar diferencias"
        : "Coincide";
    return {
      legacyId: row.es.legacyId,
      name: row.es.name,
      officialRoleEs: row.es.role,
      officialRoleEn: row.en?.role || "",
      projectRoleEs: project?.titleEs || project?.roleEs || "",
      projectRoleEn: project?.title || project?.role || "",
      email: row.es.email,
      officialEsUrl: row.es.href,
      officialEnUrl: row.en?.href || "",
      projectEsUrl: project ? `${options.projectBase}/abogado/${project.slug}` : "",
      projectEnUrl: project ? `${options.projectBase}/lawyer/${project.slug}?lang=en` : "",
      officialEsLinkStatus: links.officialEs?.classification || "Sin enlace",
      officialEnLinkStatus: links.officialEn?.classification || "Sin enlace",
      projectEsLinkStatus: links.projectEs?.classification || "Sin ficha",
      projectEnLinkStatus: links.projectEn?.classification || "Sin ficha",
      projectPresent: Boolean(project),
      projectPublished: project?.published === true,
      projectSlug: project?.slug || "",
      checks,
      failedChecks,
      status,
      notes: failedChecks.length ? failedChecks.join(" | ") : "",
    };
  });

  const projectOnlyRows = projectOnly.map((member) => {
    const links = responseByOwner.get(member) || {};
    return {
      legacyId: "",
      name: member.name,
      officialRoleEs: "",
      officialRoleEn: "",
      projectRoleEs: member.titleEs || member.roleEs || "",
      projectRoleEn: member.title || member.role || "",
      email: member.email || "",
      officialEsUrl: "",
      officialEnUrl: "",
      projectEsUrl: `${options.projectBase}/abogado/${member.slug}`,
      projectEnUrl: `${options.projectBase}/lawyer/${member.slug}?lang=en`,
      officialEsLinkStatus: "No aplica",
      officialEnLinkStatus: "No aplica",
      projectEsLinkStatus: links.projectEs?.classification || "Sin ficha",
      projectEnLinkStatus: links.projectEn?.classification || "Sin ficha",
      projectPresent: true,
      projectPublished: member.published === true,
      projectSlug: member.slug,
      checks: {},
      failedChecks: [],
      status: "Solo en proyecto",
      notes: "Perfil adicional preservado; no figura en el directorio oficial actual",
    };
  });

  const fullMatrix = [...matrix, ...projectOnlyRows];
  const linkRows = linkResponses.map((result) => ({
    name: result.expectedName,
    source: result.kind.startsWith("official") ? "Oficial" : "Replit",
    language: result.kind.endsWith("En") ? "EN" : "ES",
    url: result.url,
    finalUrl: result.response.finalUrl,
    httpStatus: result.response.status,
    classification: result.classification,
    contentType: result.response.contentType,
    bytes: result.response.bytes,
    error: result.response.error,
  }));
  const problematicLinks = linkRows.filter((row) => row.classification !== "Correcto");
  const summary = {
    auditDate: AUDIT_DATE,
    generatedAt: new Date().toISOString(),
    officialBase: options.officialBase,
    projectBase: options.projectBase,
    officialDirectoryCountEs: esRows.length,
    officialDirectoryCountEn: enRows.length,
    officialCanonicalCount: official.length,
    projectPublishedCount: projectMembers.filter((member) => member.published === true).length,
    projectTotalApiCount: projectMembers.length,
    matchedCount: matrix.filter((row) => row.projectPresent).length,
    missingInProjectCount: matrix.filter((row) => !row.projectPresent).length,
    projectOnlyCount: projectOnlyRows.length,
    exactMatchCount: matrix.filter((row) => row.status === "Coincide").length,
    reviewCount: matrix.filter((row) => row.status === "Revisar diferencias").length,
    linksChecked: linkRows.length,
    correctLinks: linkRows.filter((row) => row.classification === "Correcto").length,
    problematicLinks: problematicLinks.length,
    officialLinkProblems: problematicLinks.filter((row) => row.source === "Oficial").length,
    projectLinkProblems: problematicLinks.filter((row) => row.source === "Replit").length,
    categorySources,
    projectApi: {
      url: projectResponse.finalUrl,
      status: projectResponse.status,
      sha256: sha256(projectResponse.body),
    },
  };
  const snapshot = { summary, matrix: fullMatrix, links: linkRows };

  fs.writeFileSync(
    path.join(options.outputDir, `VWYS_Auditoria_Abogados_${AUDIT_DATE}_snapshot.json`),
    JSON.stringify(snapshot, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(options.outputDir, `VWYS_Auditoria_Abogados_${AUDIT_DATE}_resumen.json`),
    JSON.stringify(summary, null, 2) + "\n",
  );
  writeCsv(
    path.join(options.outputDir, `VWYS_Auditoria_Abogados_${AUDIT_DATE}_matriz.csv`),
    fullMatrix,
    [
      ["ID oficial", "legacyId"], ["Abogado", "name"], ["Cargo oficial ES", "officialRoleEs"],
      ["Cargo Replit ES", "projectRoleEs"], ["Estado", "status"], ["Hallazgos", "notes"],
      ["Oficial ES", "officialEsUrl"], ["Estado oficial ES", "officialEsLinkStatus"],
      ["Oficial EN", "officialEnUrl"], ["Estado oficial EN", "officialEnLinkStatus"],
      ["Replit ES", "projectEsUrl"], ["Estado Replit ES", "projectEsLinkStatus"],
      ["Replit EN", "projectEnUrl"], ["Estado Replit EN", "projectEnLinkStatus"],
    ],
  );
  writeCsv(
    path.join(options.outputDir, `VWYS_Auditoria_Abogados_${AUDIT_DATE}_enlaces.csv`),
    linkRows,
    [
      ["Abogado", "name"], ["Fuente", "source"], ["Idioma", "language"], ["URL", "url"],
      ["URL final", "finalUrl"], ["HTTP", "httpStatus"], ["Clasificación", "classification"],
      ["Content-Type", "contentType"], ["Bytes", "bytes"], ["Error", "error"],
    ],
  );
  writeCsv(
    path.join(options.outputDir, `VWYS_Auditoria_Abogados_${AUDIT_DATE}_enlaces_problematicos.csv`),
    problematicLinks,
    [
      ["Abogado", "name"], ["Fuente", "source"], ["Idioma", "language"], ["URL", "url"],
      ["URL final", "finalUrl"], ["HTTP", "httpStatus"], ["Clasificación", "classification"], ["Error", "error"],
    ],
  );

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error("[attorney-audit]", error);
  process.exitCode = 1;
});
