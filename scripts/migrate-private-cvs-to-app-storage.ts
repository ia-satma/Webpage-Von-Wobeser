#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";

process.env.VWB_PERSISTENT_MEDIA_REQUIRED = "true";

const [{ storage }, { db }, schema, uploads, privateDocuments] = await Promise.all([
  import("../server/storage"),
  import("../server/db"),
  import("../shared/schema"),
  import("../server/security/uploads"),
  import("../server/media/privateDocuments"),
]);

async function fileExists(filename: string): Promise<boolean> {
  try {
    return (await fs.stat(filename)).isFile();
  } catch {
    return false;
  }
}

async function protectLocalCv(absolutePath: string, storagePath: string): Promise<void> {
  const result = await privateDocuments.persistPrivateCvFile(absolutePath, storagePath);
  if (!result.persisted) throw new Error("App Storage no confirmó la persistencia del CV.");
}

async function migrate(): Promise<void> {
  await uploads.ensurePrivateUploadDirectories();
  const status = await privateDocuments.privateDocumentStorageStatus();
  if (!status.available || status.provider !== "replit_app_storage") {
    throw new Error("App Storage privado no está disponible en este Repl.");
  }

  const applications = await storage.getCareerApplications();
  const referencedPrivate = new Set<string>();
  const missingIds: string[] = [];
  let alreadyProtected = 0;
  let migratedPrivate = 0;
  let migratedLegacy = 0;

  for (const application of applications) {
    const privatePath = uploads.resolvePrivateCvStoragePath(application.cvPath);
    if (privatePath) {
      referencedPrivate.add(application.cvPath);
      if (await privateDocuments.persistentPrivateCvExists(application.cvPath)) {
        alreadyProtected += 1;
        await uploads.removeUploadQuietly(privatePath);
      } else if (await fileExists(privatePath)) {
        await protectLocalCv(privatePath, application.cvPath);
        await uploads.removeUploadQuietly(privatePath);
        migratedPrivate += 1;
      } else {
        missingIds.push(application.id);
      }
      continue;
    }

    if (!application.cvPath.startsWith("/uploads/")) {
      missingIds.push(application.id);
      continue;
    }

    const legacyName = path.basename(application.cvPath);
    const extension = path.extname(legacyName).toLowerCase();
    if (!new Set([".pdf", ".doc", ".docx"]).has(extension)) {
      missingIds.push(application.id);
      continue;
    }
    const legacyAbsolute = path.resolve(process.cwd(), "uploads", legacyName);
    if (path.dirname(legacyAbsolute) !== path.resolve(process.cwd(), "uploads") || !await fileExists(legacyAbsolute)) {
      missingIds.push(application.id);
      continue;
    }

    const physicalName = uploads.securePhysicalFilename(extension);
    const newStoragePath = `private:cvs/${physicalName}`;
    const stagedAbsolute = path.join(uploads.privateCvDir, physicalName);
    await fs.copyFile(legacyAbsolute, stagedAbsolute);
    await fs.chmod(stagedAbsolute, 0o600).catch(() => undefined);
    try {
      await protectLocalCv(stagedAbsolute, newStoragePath);
      await db.update(schema.careerApplications)
        .set({ cvPath: newStoragePath })
        .where(eq(schema.careerApplications.id, application.id));
      referencedPrivate.add(newStoragePath);
      await Promise.all([
        uploads.removeUploadQuietly(stagedAbsolute),
        uploads.removeUploadQuietly(legacyAbsolute),
      ]);
      migratedLegacy += 1;
    } catch (error) {
      await uploads.removeUploadQuietly(stagedAbsolute);
      await privateDocuments.deletePersistentPrivateCv(newStoragePath).catch(() => undefined);
      throw error;
    }
  }

  let protectedOrphans = 0;
  const localEntries = await fs.readdir(uploads.privateCvDir, { withFileTypes: true }).catch(() => []);
  for (const entry of localEntries) {
    if (!entry.isFile() || !/^[a-f0-9]{32}\.(pdf|doc|docx)$/.test(entry.name)) continue;
    const storagePath = `private:cvs/${entry.name}`;
    if (referencedPrivate.has(storagePath)) continue;
    const absolutePath = path.join(uploads.privateCvDir, entry.name);
    if (!await privateDocuments.persistentPrivateCvExists(storagePath)) {
      await protectLocalCv(absolutePath, storagePath);
    }
    await uploads.removeUploadQuietly(absolutePath);
    protectedOrphans += 1;
  }

  console.log("[private-cv-migration] Migración terminada.");
  console.log(JSON.stringify({
    records: applications.length,
    alreadyProtected,
    migratedPrivate,
    migratedLegacy,
    protectedOrphans,
    missingRecords: missingIds.length,
    missingRecordIds: missingIds,
  }, null, 2));

  if (missingIds.length) {
    throw new Error("Hay registros cuyo archivo no existe ni en disco ni en App Storage; no se modificaron.");
  }
}

migrate().catch((error) => {
  console.error(`[private-cv-migration] ${error instanceof Error ? error.message : "Error desconocido"}`);
  process.exitCode = 1;
});
