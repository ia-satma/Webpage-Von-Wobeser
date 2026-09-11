import { LEGACY_PUBLICATION_PDF_PATHS } from "@shared/legacyPublicationAssets";
import {
  persistentMediaIsRequired,
  persistentMediaStorageStatus,
  persistentPublicMediaExists,
} from "./persistentMedia";

export const LEGACY_ARCHIVE_MANIFEST_CONFIG_KEY = "legacy_platform_archive_manifest_sha256";

/**
 * En producción los PDFs migrados no pueden depender de un disco de Deployment
 * ni de la plataforma retirada. La marca se escribe sólo después de verificar
 * todos los objetos, por lo que este control detiene el arranque ante una
 * restauración incompleta en vez de publicar enlaces que fallarán después.
 */
export async function assertLegacyPublicationArchiveReady(config: Record<string, { value?: string } | undefined>): Promise<void> {
  if (!persistentMediaIsRequired()) return;
  const manifestHash = String(config[LEGACY_ARCHIVE_MANIFEST_CONFIG_KEY]?.value || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(manifestHash)) {
    throw new Error("Legacy publication archive manifest is not verified in Database");
  }
  const status = await persistentMediaStorageStatus();
  if (!status.available || status.provider !== "replit_app_storage") {
    throw new Error("Replit App Storage is required for migrated legacy publications");
  }
  const missing = (await Promise.all(Object.values(LEGACY_PUBLICATION_PDF_PATHS).map(async (publicPath) => ({
    publicPath,
    exists: await persistentPublicMediaExists(publicPath),
  })))).filter((entry) => !entry.exists);
  if (missing.length) throw new Error(`Migrated legacy publication objects missing: ${missing.length}`);
}
