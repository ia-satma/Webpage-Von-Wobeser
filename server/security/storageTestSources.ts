import fs from "node:fs";
import path from "node:path";

const STORAGE_SOURCE_ORDER = [
  "storage/contracts.ts",
  "storage/repositories/newsRepository.ts",
  "storage/repositories/peopleRepository.ts",
  "storage/repositories/securityRepository.ts",
  "storage/repositories/mediaRepository.ts",
  "storage/repositories/catalogRepository.ts",
  "storage/repositories/translationRepository.ts",
  "storage/repositories/auditRepository.ts",
  "storage/repositories/submissionRepository.ts",
  "storage/repositories/publicContentRepository.ts",
  "storage.ts",
] as const;

/**
 * Security tests historically inspected the monolithic server/storage.ts.
 * Storage operations now live in repositories, so assertions inspect the
 * complete data-access surface instead of one physical source file.
 */
export function readStorageSources(): string {
  const serverDirectory = path.join(process.cwd(), "server");
  return STORAGE_SOURCE_ORDER
    .map((relativePath) => fs.readFileSync(path.join(serverDirectory, relativePath), "utf8"))
    .join("\n");
}
