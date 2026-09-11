import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { Client as AppStorageClient } from "@replit/object-storage";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";
import { LEGACY_PUBLICATION_PDF_PATHS } from "@shared/legacyPublicationAssets";
import { managedMediaObjectName, persistentMediaStorageStatus } from "../server/media/persistentMedia";
import { PRIVATE_LEGACY_ARCHIVE_PREFIX, assertPrivateLegacyArchiveObjectName } from "./handoff-legacy-archive.mjs";

type LegacyDocument = {
  originalUrl: string;
  publicPath: string;
};
type NewsRow = {
  id: string;
  legacy_id: string | null;
  slug: string;
  source_url: string | null;
  excerpt: string;
  excerpt_es: string;
  content: string | null;
  content_es: string | null;
};
type TranslationRow = {
  id: string;
  news_id: string;
  language: string;
  excerpt: string;
  content: string | null;
};
type ArchiveFile = {
  originalUrl: string;
  kind: "pdf" | "html";
  consumers: Array<Record<string, string>>;
  localPath: string;
  objectName: string;
  publicPath?: string;
  bytes: number;
  sha256: string;
};
type ArchiveManifest = {
  version: 1;
  generatedAt: string;
  purpose: string;
  publicDocuments: ArchiveFile[];
  privateHtml: ArchiveFile[];
  routeMappings: Array<{ originalUrl: string; legacyId: string; language: "en" | "es"; destination: string }>;
};

const ROOT = path.resolve(process.cwd());
const ARCHIVE_DIR = path.join(ROOT, "legacy-archive");
const MANIFEST_NAME = "manifest.json";
const LEGACY_ORIGIN = "https://www.vonwobeser.com";
const FETCH_TIMEOUT_MS = 45_000;
const EXPECTED_PUBLIC_DOCUMENTS: readonly LegacyDocument[] = [
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF/2022/Preparate_Para_el_Proximo_Cisne1.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.nextBlackSwan },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2015/IBAMexicoChapterInternationalArbitrationGuide2013.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.arbitrationGuide },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2015/MexicoOutsourcingNov2013.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.outsourcing },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2021/21_10_12_MINERIA_ESG_ING.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.miningEsgPartOneAndTwo },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2021/21_11_12_ARBITRAJE_ESG_ING.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.arbitrationEsg },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2022/22_08_11_ESG_En-la-Industria-Minera-Mexicana-3_ENG.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.miningEsgPartThree },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2023/ESG4/23_05_22_MINERIA_ESG_ENG-Pt4-OK.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.miningEsgPartFour },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/2023/vision_combate.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.antiCorruption },
  { originalUrl: `${LEGACY_ORIGIN}/images/PDF_news/PDF_articles/2013/45-MexicoInvestmentTreaty.pdf`, publicPath: LEGACY_PUBLICATION_PDF_PATHS.investmentTreaty },
];
const LEGACY_PUBLICATION_REFERENCE = /(?:(?:https?:)?\/\/(?:www\.)?vonwobeser\.com)?\/index\.php\/(publication|publicacion)(?:\/p_id-(\d+)\.html|\/?\?p_id=(\d+))/gi;

function sha256(value: Buffer | string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function relativeToRoot(filename: string): string {
  return path.relative(ROOT, filename).split(path.sep).join("/");
}

function canonicalLegacyUrl(value: string): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw, LEGACY_ORIGIN);
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== "vonwobeser.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function publicationReference(value: string): { originalUrl: string; legacyId: string; language: "en" | "es" } | null {
  const absolute = canonicalLegacyUrl(value);
  if (!absolute) return null;
  const url = new URL(absolute);
  const match = url.pathname.match(/^\/index\.php\/(publication|publicacion)\/p_id-(\d+)\.html$/i);
  const kind = match?.[1] || (/^\/index\.php\/(publication|publicacion)\/?$/i.test(url.pathname) ? url.pathname.split("/").at(-1) : "");
  const legacyId = match?.[2] || url.searchParams.get("p_id") || "";
  if (!legacyId || !/^\d+$/.test(legacyId) || !kind) return null;
  return {
    originalUrl: absolute,
    legacyId,
    language: String(kind).toLowerCase() === "publication" ? "en" : "es",
  };
}

function referencesIn(value: string | null | undefined): string[] {
  const refs = new Set<string>();
  const text = String(value || "");
  for (const match of text.matchAll(LEGACY_PUBLICATION_REFERENCE)) {
    const language = match[1].toLowerCase() === "publication" ? "en" : "es";
    const legacyId = match[2] || match[3];
    if (legacyId) refs.add(`${LEGACY_ORIGIN}/index.php/${language === "en" ? "publication" : "publicacion"}?p_id=${legacyId}`);
  }
  return [...refs];
}

function destinationFor(reference: { legacyId: string; language: "en" | "es" }, byLegacyId: Map<string, NewsRow>): string {
  const target = byLegacyId.get(reference.legacyId);
  if (!target?.slug) throw new Error(`La ficha histórica p_id=${reference.legacyId} no tiene una ficha nueva equivalente.`);
  return `/news/${target.slug}${reference.language === "en" ? "?lang=en" : ""}`;
}

function replaceLegacyReferences(value: string | null | undefined, byLegacyId: Map<string, NewsRow>): string | null {
  if (value === null || value === undefined) return value ?? null;
  return String(value).replace(LEGACY_PUBLICATION_REFERENCE, (_full, section: string, idFromPath: string, idFromQuery: string) => {
    const language = section.toLowerCase() === "publication" ? "en" : "es";
    return destinationFor({ legacyId: idFromPath || idFromQuery, language }, byLegacyId);
  });
}

function validateManifest(value: unknown): ArchiveManifest {
  const manifest = value as ArchiveManifest;
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.publicDocuments) || !Array.isArray(manifest.privateHtml) || !Array.isArray(manifest.routeMappings)) {
    throw new Error("El manifiesto local de migración no tiene el formato esperado.");
  }
  if (manifest.publicDocuments.length !== EXPECTED_PUBLIC_DOCUMENTS.length || manifest.privateHtml.length !== 108) {
    throw new Error("El manifiesto local no contiene los 9 PDFs y las 108 fichas históricas esperadas.");
  }
  for (const entry of [...manifest.publicDocuments, ...manifest.privateHtml]) {
    if (!/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || !entry.localPath || !entry.objectName) {
      throw new Error("El manifiesto local contiene metadatos no verificables.");
    }
  }
  return manifest;
}

async function assertManifestFiles(manifest: ArchiveManifest): Promise<void> {
  for (const entry of [...manifest.publicDocuments, ...manifest.privateHtml]) {
    const file = path.resolve(ROOT, entry.localPath);
    if (!file.startsWith(`${ARCHIVE_DIR}${path.sep}`)) throw new Error("El archivo de archivo histórico sale del directorio autorizado.");
    const bytes = await fs.readFile(file);
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`Checksum local inválido: ${entry.localPath}`);
  }
}

async function existingManifest(): Promise<ArchiveManifest | null> {
  try {
    const manifest = validateManifest(JSON.parse(await fs.readFile(path.join(ARCHIVE_DIR, MANIFEST_NAME), "utf8")));
    await assertManifestFiles(manifest);
    return manifest;
  } catch (error: any) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function fetchLegacyFile(originalUrl: string, kind: "pdf" | "html"): Promise<Buffer> {
  const response = await fetch(originalUrl, {
    redirect: "follow",
    headers: { "user-agent": "VonWobeserMigrationArchive/1.0" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Descarga fallida (${response.status}): ${originalUrl}`);
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (kind === "pdf" && !contentType.includes("application/pdf")) throw new Error(`MIME inesperado para PDF: ${originalUrl}`);
  if (kind === "html" && !contentType.includes("text/html")) throw new Error(`MIME inesperado para HTML: ${originalUrl}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || (kind === "pdf" && !bytes.subarray(0, 4).equals(Buffer.from("%PDF")))) {
    throw new Error(`Contenido inválido: ${originalUrl}`);
  }
  return bytes;
}

async function createLocalArchive(newsRows: NewsRow[], translations: TranslationRow[]): Promise<ArchiveManifest> {
  const existing = await existingManifest();
  if (existing) return existing;
  const byLegacyId = new Map(newsRows.filter((row) => row.legacy_id).map((row) => [String(row.legacy_id), row]));
  const sourceReferences = new Set<string>();
  const consumersByUrl = new Map<string, Array<Record<string, string>>>();
  const addReference = (value: string | null | undefined, consumer: Record<string, string>) => {
    for (const candidate of referencesIn(value)) {
      const parsed = publicationReference(candidate);
      if (!parsed) continue;
      sourceReferences.add(parsed.originalUrl);
      const consumers = consumersByUrl.get(parsed.originalUrl) || [];
      consumers.push(consumer);
      consumersByUrl.set(parsed.originalUrl, consumers);
    }
  };
  for (const row of newsRows) {
    const consumer = { table: "news", id: row.id, slug: row.slug };
    addReference(row.source_url, consumer);
    addReference(row.excerpt, consumer);
    addReference(row.excerpt_es, consumer);
    addReference(row.content, consumer);
    addReference(row.content_es, consumer);
  }
  for (const row of translations) {
    const consumer = { table: "news_translations", id: row.id, newsId: row.news_id, language: row.language };
    addReference(row.excerpt, consumer);
    addReference(row.content, consumer);
  }
  if (sourceReferences.size !== 108) throw new Error(`Se esperaban 108 fichas HTML históricas, se detectaron ${sourceReferences.size}.`);
  for (const originalUrl of sourceReferences) {
    const reference = publicationReference(originalUrl);
    if (!reference) throw new Error("Referencia histórica inválida.");
    destinationFor(reference, byLegacyId);
  }

  const pdfConsumers = new Map<string, Array<Record<string, string>>>();
  for (const row of newsRows) {
    const source = canonicalLegacyUrl(row.source_url || "");
    if (source?.toLowerCase().endsWith(".pdf")) {
      const consumers = pdfConsumers.get(source) || [];
      consumers.push({ table: "news", id: row.id, slug: row.slug, field: "source_url" });
      pdfConsumers.set(source, consumers);
    }
  }
  const expectedUrls = new Set(EXPECTED_PUBLIC_DOCUMENTS.map((entry) => entry.originalUrl));
  if (pdfConsumers.size !== expectedUrls.size || [...pdfConsumers.keys()].some((url) => !expectedUrls.has(url))) {
    throw new Error("Las referencias PDF de la base no coinciden con los 9 documentos aprobados.");
  }

  const staging = path.join(ROOT, `.legacy-archive-staging-${crypto.randomUUID()}`);
  await fs.mkdir(path.join(staging, "publications"), { recursive: true, mode: 0o750 });
  await fs.mkdir(path.join(staging, "html"), { recursive: true, mode: 0o750 });
  try {
    const publicDocuments: ArchiveFile[] = [];
    for (const [index, document] of EXPECTED_PUBLIC_DOCUMENTS.entries()) {
      const contents = await fetchLegacyFile(document.originalUrl, "pdf");
      const filename = path.basename(document.publicPath);
      const local = path.join(staging, "publications", filename);
      await fs.writeFile(local, contents, { mode: 0o640 });
      const objectName = managedMediaObjectName(document.publicPath);
      if (!objectName) throw new Error("Ruta pública de PDF no administrada.");
      publicDocuments.push({
        originalUrl: document.originalUrl,
        kind: "pdf",
        consumers: pdfConsumers.get(document.originalUrl) || [],
        localPath: `legacy-archive/publications/${filename}`,
        publicPath: document.publicPath,
        objectName,
        bytes: contents.length,
        sha256: sha256(contents),
      });
      console.log(`[legacy-migration] PDF ${index + 1}/${EXPECTED_PUBLIC_DOCUMENTS.length} descargado.`);
    }

    const privateHtml: ArchiveFile[] = [];
    const routeMappings: ArchiveManifest["routeMappings"] = [];
    for (const [index, originalUrl] of [...sourceReferences].sort().entries()) {
      const reference = publicationReference(originalUrl);
      if (!reference) throw new Error("Referencia histórica inválida.");
      const contents = await fetchLegacyFile(originalUrl, "html");
      const digest = sha256(originalUrl);
      const relativeObject = `pages/${digest}.html`;
      const objectName = assertPrivateLegacyArchiveObjectName(`${PRIVATE_LEGACY_ARCHIVE_PREFIX}/${relativeObject}`);
      const local = path.join(staging, "html", `${digest}.html`);
      await fs.writeFile(local, contents, { mode: 0o640 });
      privateHtml.push({
        originalUrl,
        kind: "html",
        consumers: consumersByUrl.get(originalUrl) || [],
        localPath: `legacy-archive/html/${digest}.html`,
        objectName,
        bytes: contents.length,
        sha256: sha256(contents),
      });
      routeMappings.push({ originalUrl, legacyId: reference.legacyId, language: reference.language, destination: destinationFor(reference, byLegacyId) });
      console.log(`[legacy-migration] HTML ${index + 1}/${sourceReferences.size} descargado.`);
    }
    const manifest: ArchiveManifest = {
      version: 1,
      generatedAt: new Date().toISOString(),
      purpose: "Respaldo privado del sitio retirado y migración verificable de recursos públicos.",
      publicDocuments,
      privateHtml,
      routeMappings,
    };
    await fs.writeFile(path.join(staging, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o640 });
    await fs.writeFile(path.join(staging, "README.md"), "# Archivo histórico privado\n\nNo publicar este directorio. El manifiesto registra procedencia, consumidor, objeto de App Storage y SHA-256.\n", { mode: 0o640 });
    await fs.rename(staging, ARCHIVE_DIR);
    await assertManifestFiles(manifest);
    return manifest;
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
}

function storageClient(): AppStorageClient {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  return new AppStorageClient(bucketId ? { bucketId } : undefined);
}

async function verifyRemoteFile(storage: AppStorageClient, objectName: string, expected: ArchiveFile | { bytes: number; sha256: string }): Promise<void> {
  const result = await storage.downloadAsBytes(objectName, { decompress: false });
  if (!result.ok) throw new Error(`No se pudo verificar ${objectName} en App Storage.`);
  const bytes = Buffer.from(result.value[0]);
  if (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256) throw new Error(`Checksum remoto inválido: ${objectName}`);
}

async function uploadVerifiedBatch(storage: AppStorageClient, files: Array<{ localPath: string; objectName: string; bytes: number; sha256: string }>): Promise<void> {
  const uploaded: string[] = [];
  try {
    for (const [index, entry] of files.entries()) {
      const result = await storage.uploadFromFilename(entry.objectName, path.resolve(ROOT, entry.localPath), { compress: false });
      if (!result.ok) throw new Error(`No se pudo cargar ${entry.objectName}.`);
      uploaded.push(entry.objectName);
      await verifyRemoteFile(storage, entry.objectName, entry);
      console.log(`[legacy-migration] App Storage ${index + 1}/${files.length} verificado.`);
    }
  } catch (error) {
    await Promise.all(uploaded.map((objectName) => storage.delete(objectName, { ignoreNotFound: true }).catch(() => undefined)));
    throw error;
  }
}

async function publishAndApply(manifest: ArchiveManifest, newsRows: NewsRow[], translations: TranslationRow[]): Promise<void> {
  const status = await persistentMediaStorageStatus();
  if (!status.available || status.provider !== "replit_app_storage") {
    throw new Error("App Storage de Replit debe estar vinculado y disponible antes de cambiar la base de datos.");
  }
  const storage = storageClient();
  const privateManifest = await fs.readFile(path.join(ARCHIVE_DIR, MANIFEST_NAME));
  const manifestObject = `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/manifest.json`;
  const files = [
    ...manifest.publicDocuments,
    ...manifest.privateHtml,
    {
      localPath: "legacy-archive/manifest.json",
      objectName: manifestObject,
      bytes: privateManifest.length,
      sha256: sha256(privateManifest),
    },
  ];
  await uploadVerifiedBatch(storage, files);

  const byLegacyId = new Map(newsRows.filter((row) => row.legacy_id).map((row) => [String(row.legacy_id), row]));
  const pdfPaths = new Map(manifest.publicDocuments.map((entry) => [entry.originalUrl, entry.publicPath!]));
  const databaseUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL is required to apply the verified migration.");
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl));
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const row of newsRows) {
      const oldSource = canonicalLegacyUrl(row.source_url || "");
      const replacementSource = oldSource && pdfPaths.has(oldSource)
        ? pdfPaths.get(oldSource)!
        : publicationReference(row.source_url || "") ? null : row.source_url;
      const excerpt = replaceLegacyReferences(row.excerpt, byLegacyId) || "";
      const excerptEs = replaceLegacyReferences(row.excerpt_es, byLegacyId) || "";
      const content = replaceLegacyReferences(row.content, byLegacyId);
      const contentEs = replaceLegacyReferences(row.content_es, byLegacyId);
      if (replacementSource !== row.source_url || excerpt !== row.excerpt || excerptEs !== row.excerpt_es || content !== row.content || contentEs !== row.content_es) {
        await client.query(
          "UPDATE news SET source_url = $1, excerpt = $2, excerpt_es = $3, content = $4, content_es = $5 WHERE id = $6",
          [replacementSource, excerpt, excerptEs, content, contentEs, row.id],
        );
      }
    }
    for (const row of translations) {
      const excerpt = replaceLegacyReferences(row.excerpt, byLegacyId) || "";
      const content = replaceLegacyReferences(row.content, byLegacyId);
      if (excerpt !== row.excerpt || content !== row.content) {
        await client.query("UPDATE news_translations SET excerpt = $1, content = $2 WHERE id = $3", [excerpt, content, row.id]);
      }
    }
    await client.query(
      "DELETE FROM news_external_links WHERE url ~* 'vonwobeser\\.com/index\\.php/(publication|publicacion)' OR normalized_url ~* 'vonwobeser\\.com/index\\.php/(publication|publicacion)'",
    );
    const digest = sha256(await fs.readFile(path.join(ARCHIVE_DIR, MANIFEST_NAME)));
    await client.query(
      `INSERT INTO site_config (key, value, value_es, type, category, description, updated_at)
       VALUES ('legacy_platform_archive_manifest_sha256', $1, $1, 'text', 'internal', 'Checksum del manifiesto privado de migración del sitio retirado.', now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, value_es = EXCLUDED.value_es, updated_at = now()`,
      [digest],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function loadDatabaseSnapshot(): Promise<{ newsRows: NewsRow[]; translations: TranslationRow[] }> {
  const databaseUrl = process.env.DATABASE_APP_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_APP_URL or DATABASE_URL is required.");
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl, { readOnly: true }));
  await client.connect();
  try {
    const [news, translations] = await Promise.all([
      client.query<NewsRow>("SELECT id, legacy_id, slug, source_url, excerpt, excerpt_es, content, content_es FROM news"),
      client.query<TranslationRow>("SELECT id, news_id, language, excerpt, content FROM news_translations"),
    ]);
    return { newsRows: news.rows, translations: translations.rows };
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const publish = process.argv.includes("--publish");
  if (publish && process.env.CONFIRM_LEGACY_PLATFORM_MIGRATION !== "1") {
    throw new Error("Set CONFIRM_LEGACY_PLATFORM_MIGRATION=1 only after reviewing the local archive and its hashes.");
  }
  const { newsRows, translations } = await loadDatabaseSnapshot();
  const manifest = await createLocalArchive(newsRows, translations);
  if (!publish) {
    console.log(JSON.stringify({ mode: "staged", publicDocuments: manifest.publicDocuments.length, privateHtml: manifest.privateHtml.length, manifest: relativeToRoot(path.join(ARCHIVE_DIR, MANIFEST_NAME)) }, null, 2));
    return;
  }
  await publishAndApply(manifest, newsRows, translations);
  console.log(JSON.stringify({ mode: "published-and-applied", publicDocuments: manifest.publicDocuments.length, privateHtml: manifest.privateHtml.length }, null, 2));
}

main().catch((error) => {
  console.error(`[legacy-migration] ${error instanceof Error ? error.message : "Error desconocido"}`);
  process.exitCode = 1;
});
