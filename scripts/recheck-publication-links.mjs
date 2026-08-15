#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const argValue = (name, fallback = "") => {
  const prefix = `--${name}=`;
  const match = argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAMP = argValue("stamp", "2026-08-14");
const AUDIT_DIR = path.resolve(ROOT, argValue("output", `output/audits/publicaciones-${STAMP}`));
const BASE = `VWYS_Auditoria_Publicaciones_${STAMP}`;
const SNAPSHOT_PATH = path.join(AUDIT_DIR, `${BASE}.snapshot.json`);
const CONCURRENCY = Math.max(1, Number(argValue("concurrency", "8")) || 8);
const ROUNDS = Math.max(1, Number(argValue("rounds", "3")) || 3);
const TIMEOUT_MS = Math.max(5000, Number(argValue("timeout-ms", "25000")) || 25000);
const USER_AGENT = "VWYS-Publications-Audit-Recheck/1.0 (+https://webpage-von-wobeser-2026.replit.app/)";
const BAD = new Set(["roto", "error", "inaccesible", "bloqueado", "contenido-invalido"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (rows, headers) => `${headers.map(csvCell).join(",")}\n${rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")).join("\n")}\n`;
const unique = (values) => [...new Set(values.filter(Boolean))];

function classify(result, kind) {
  if (result.error || result.status === 0) return "inaccesible";
  if ([401, 403, 429].includes(result.status)) return "bloqueado";
  if ([404, 410].includes(result.status)) return "roto";
  if (result.status >= 500) return "error";
  if (result.status >= 300 && result.status < 400) return "redireccion";
  if (result.status >= 200 && result.status < 300) {
    if (kind === "pdf") {
      const mime = String(result.mime ?? "").toLowerCase();
      if (!result.signature.startsWith("%PDF-") && !mime.includes("pdf")) return "contenido-invalido";
    }
    return result.redirected ? "redireccion-valida" : "correcto";
  }
  return "inaccesible";
}

async function probe(url, kind) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: kind === "pdf" ? "application/pdf,*/*;q=0.8" : "text/html,application/xhtml+xml,image/*,*/*;q=0.7",
        range: "bytes=0-1023",
      },
    });
    let body = Buffer.alloc(0);
    if (response.body) {
      const reader = response.body.getReader();
      const first = await reader.read();
      body = Buffer.from(first.value ?? new Uint8Array());
      await reader.cancel();
    }
    return {
      status: response.status,
      finalUrl: response.url,
      redirected: response.redirected,
      mime: response.headers.get("content-type") ?? "",
      bytesRead: body.length,
      signature: body.subarray(0, 16).toString("latin1"),
      elapsedMs: Date.now() - startedAt,
      error: "",
    };
  } catch (error) {
    return {
      status: 0,
      finalUrl: "",
      redirected: false,
      mime: "",
      bytesRead: 0,
      signature: "",
      elapsedMs: Date.now() - startedAt,
      error: error?.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : String(error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  let completed = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      completed += 1;
      if (completed % 20 === 0 || completed === items.length) process.stdout.write(`\r[recheck] ${completed}/${items.length}`);
    }
  });
  await Promise.all(runners);
  if (items.length) process.stdout.write("\n");
  return results;
}

function inventoryRows(snapshot) {
  return snapshot.canonicals.map((canonical) => {
    const projectSlugs = (canonical.projectMatches ?? []).map((row) => row.slug);
    const linkIssues = snapshot.links.filter((link) => link.owner === canonical.canonicalId && !["correcto", "redireccion-valida"].includes(link.classification));
    return {
      canonicalId: canonical.canonicalId,
      type: canonical.type,
      severity: canonical.severity,
      auditStatus: canonical.auditStatus,
      pairing: canonical.pairing,
      pairingReview: canonical.pairingReview,
      dateEs: canonical.es?.date.normalized ?? "",
      dateEn: canonical.en?.date.normalized ?? "",
      pidEs: canonical.es?.pid ?? "",
      pidEn: canonical.en?.pid ?? "",
      titleEs: canonical.es?.title ?? "",
      titleEn: canonical.en?.title ?? "",
      officialUrlEs: canonical.es?.detailUrl ?? "",
      officialUrlEn: canonical.en?.detailUrl ?? "",
      pdfEs: canonical.es?.pdfUrls ?? [],
      pdfEn: canonical.en?.pdfUrls ?? [],
      officialAuthors: unique([...(canonical.es?.authors ?? []), ...(canonical.en?.authors ?? [])].map((entry) => entry.email)),
      matchedProfiles: (canonical.authorAudit ?? []).filter((entry) => entry.matchedProfileId).map((entry) => `${entry.matchedProfileName} (${entry.matchedProfileSlug})`),
      projectCount: canonical.projectMatches?.length ?? 0,
      projectSlugs,
      projectIds: (canonical.projectMatches ?? []).map((row) => row.id),
      projectLegacyIds: (canonical.projectMatches ?? []).map((row) => row.legacyId ?? ""),
      findingCodes: canonical.findings.map((finding) => finding.code),
      findings: canonical.findings.map((finding) => finding.message),
      linkIssueCount: linkIssues.length,
      linkIssues: linkIssues.map((link) => `${link.classification}: ${link.url}`),
    };
  });
}

async function main() {
  const snapshot = JSON.parse(await fs.readFile(SNAPSHOT_PATH, "utf8"));
  const originalBad = snapshot.links.filter((link) => BAD.has(link.classification));
  console.log(`[recheck] Enlaces a repetir: ${originalBad.length}; rondas máximas: ${ROUNDS}`);
  const resolved = new Map();
  const histories = new Map(originalBad.map((link) => [`${link.kind}:${link.url}`, []]));
  let pending = originalBad;

  for (let round = 1; round <= ROUNDS && pending.length; round += 1) {
    console.log(`[recheck] Ronda ${round}: ${pending.length} destinos`);
    const tested = await mapConcurrent(pending, async (link) => {
      const result = await probe(link.url, link.kind);
      const classification = classify(result, link.kind);
      return { link, result, classification, round };
    });
    const next = [];
    for (const test of tested) {
      const key = `${test.link.kind}:${test.link.url}`;
      histories.get(key).push({ round: test.round, ...test.result, classification: test.classification });
      resolved.set(key, test);
      if (["inaccesible", "error"].includes(test.classification) && round < ROUNDS) next.push(test.link);
    }
    pending = next;
    if (pending.length) await sleep(1000 * round);
  }

  const recheckedAt = new Date().toISOString();
  snapshot.links = snapshot.links.map((link) => {
    const key = `${link.kind}:${link.url}`;
    const test = resolved.get(key);
    if (!test) return link;
    return {
      ...link,
      status: test.result.status,
      classification: test.classification,
      finalUrl: test.result.finalUrl,
      redirected: test.result.redirected,
      mime: test.result.mime,
      bytesRead: test.result.bytesRead,
      signature: test.result.signature.slice(0, 8),
      elapsedMs: test.result.elapsedMs,
      error: test.result.error,
      recheckedAt,
      recheckHistory: histories.get(key),
    };
  });

  const counts = snapshot.summary.counts;
  counts.linkTargets = snapshot.links.length;
  counts.brokenLinks = snapshot.links.filter((link) => link.classification === "roto").length;
  counts.serverErrorLinks = snapshot.links.filter((link) => link.classification === "error").length;
  counts.inaccessibleLinks = snapshot.links.filter((link) => link.classification === "inaccesible").length;
  counts.blockedLinks = snapshot.links.filter((link) => link.classification === "bloqueado").length;
  counts.invalidContentLinks = snapshot.links.filter((link) => link.classification === "contenido-invalido").length;
  snapshot.summary.linkClassificationCounts = Object.fromEntries(unique(snapshot.links.map((link) => link.classification)).sort().map((classification) => [classification, snapshot.links.filter((link) => link.classification === classification).length]));
  snapshot.summary.linkRecheck = { recheckedAt, rounds: ROUNDS, timeoutMs: TIMEOUT_MS, initialTargets: originalBad.length };

  const inventory = inventoryRows(snapshot);
  const inventoryHeaders = ["canonicalId", "type", "severity", "auditStatus", "pairing", "pairingReview", "dateEs", "dateEn", "pidEs", "pidEn", "titleEs", "titleEn", "officialUrlEs", "officialUrlEn", "pdfEs", "pdfEn", "officialAuthors", "matchedProfiles", "projectCount", "projectSlugs", "projectIds", "projectLegacyIds", "findingCodes", "findings", "linkIssueCount", "linkIssues"];
  const linkHeaders = ["owner", "source", "kind", "language", "url", "status", "classification", "finalUrl", "redirected", "mime", "bytesRead", "signature", "elapsedMs", "error", "recheckedAt"];
  const confirmedBroken = snapshot.links.filter((link) => ["roto", "contenido-invalido"].includes(link.classification));

  await fs.mkdir(path.resolve(ROOT, "output/csv"), { recursive: true });
  await fs.mkdir(path.resolve(ROOT, "output/json"), { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  await fs.writeFile(path.join(AUDIT_DIR, `${BASE}.resumen.json`), `${JSON.stringify(snapshot.summary, null, 2)}\n`);
  await fs.writeFile(path.join(AUDIT_DIR, `${BASE}.inventario.csv`), toCsv(inventory, inventoryHeaders));
  await fs.writeFile(path.join(AUDIT_DIR, `${BASE}.enlaces.csv`), toCsv(snapshot.links, linkHeaders));
  await fs.writeFile(path.join(AUDIT_DIR, `${BASE}.enlaces-rotos.csv`), toCsv(confirmedBroken, linkHeaders));
  await fs.writeFile(path.join(AUDIT_DIR, `${BASE}.faltantes.csv`), toCsv(inventory.filter((row) => row.findingCodes.includes("PROJECT_MISSING")), inventoryHeaders));
  await fs.copyFile(path.join(AUDIT_DIR, `${BASE}.inventario.csv`), path.resolve(ROOT, "output/csv", `${BASE}_inventario.csv`));
  await fs.copyFile(path.join(AUDIT_DIR, `${BASE}.enlaces-rotos.csv`), path.resolve(ROOT, "output/csv", `${BASE}_enlaces_rotos.csv`));
  await fs.copyFile(SNAPSHOT_PATH, path.resolve(ROOT, "output/json", `${BASE}_snapshot.json`));
  console.log(JSON.stringify(snapshot.summary.counts, null, 2));
}

main().catch((error) => {
  console.error(`[recheck] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
