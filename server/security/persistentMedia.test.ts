import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  managedMediaMimeType,
  managedMediaObjectName,
  persistentMediaIsRequired,
  publicPathFromManagedObjectName,
} from "../media/persistentMedia";
import { readRouteSources } from "./routeTestSources";
import { readPresentationGeneratorModule } from "./presentationGeneratorTestSources";

test("las rutas administradas se convierten en objetos sin permitir traversal", () => {
  assert.equal(
    managedMediaObjectName("/uploads/hero/video-principal.mp4"),
    "von-wobeser/public/uploads/hero/video-principal.mp4",
  );
  assert.equal(
    managedMediaObjectName("/generated-images/article-123.png?download=1"),
    "von-wobeser/public/generated-images/article-123.png",
  );
  assert.equal(
    managedMediaObjectName("/generated-presentations/pres-123.pptx?download=1"),
    "von-wobeser/public/generated-presentations/pres-123.pptx",
  );
  assert.equal(
    managedMediaObjectName("/generated-audio/newsletter-123.mp3?download=1"),
    "von-wobeser/public/generated-audio/newsletter-123.mp3",
  );
  assert.equal(managedMediaObjectName("/uploads/../private/file.pdf"), null);
  assert.equal(managedMediaObjectName("/uploads/%2e%2e/private/file.png"), null);
  assert.equal(managedMediaObjectName("/uploads/folder\\file.png"), null);
  assert.equal(managedMediaObjectName("/images/static.png"), null);
  assert.equal(
    publicPathFromManagedObjectName("von-wobeser/public/uploads/hero/poster.webp"),
    "/uploads/hero/poster.webp",
  );
  assert.equal(
    publicPathFromManagedObjectName("von-wobeser/public/generated-presentations/pres-123.pdf"),
    "/generated-presentations/pres-123.pdf",
  );
});

test("el almacenamiento persistente es obligatorio en producción y Replit", () => {
  assert.equal(persistentMediaIsRequired({ NODE_ENV: "production" }), true);
  assert.equal(persistentMediaIsRequired({ NODE_ENV: "development", REPL_ID: "repl" }), true);
  assert.equal(persistentMediaIsRequired({ NODE_ENV: "test" }), false);
  assert.equal(managedMediaMimeType("/uploads/logo.webp"), "image/webp");
  assert.equal(managedMediaMimeType("/uploads/hero/video.mp4"), "video/mp4");
  assert.equal(managedMediaMimeType("/generated-audio/newsletter-123.mp3"), "audio/mpeg");
  assert.equal(managedMediaMimeType("/generated-presentations/pres-123.pdf"), "application/pdf");
  assert.equal(
    managedMediaMimeType("/generated-presentations/pres-123.pptx"),
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  );
});

test("el upload persiste originales y derivados antes de guardar su registro", () => {
  const routes = readRouteSources();
  const persistenceCall = routes.indexOf("const persistence = await persistPublicMediaFiles([");
  const databaseCall = routes.indexOf("const mediaItem = await storage.createMediaItem({");

  assert.ok(persistenceCall > 0);
  assert.ok(databaseCall > persistenceCall);
  assert.match(routes, /App Storage no está disponible\. El archivo no se guardó/);
  assert.match(routes, /res\.status\(404\)\.json\(\{ error: "Media not found" \}\)/);
});

test("el hero inicial se archiva de forma atómica en App Storage sin reemplazar elecciones administrativas", () => {
  const siteConfigSource = readFileSync(
    new URL("../mirror/siteConfig.ts", import.meta.url),
    "utf8",
  );

  assert.match(siteConfigSource, /hero_video_app_storage_archive_v1/);
  assert.match(siteConfigSource, /hero-master-dron-20260825\.mp4/);
  assert.match(siteConfigSource, /hero-master-previous-20260810\.mp4/);
  assert.match(siteConfigSource, /await persistPublicMediaFiles\(files\)/);
  assert.match(siteConfigSource, /Solo escribe site_config después de que App Storage confirma el lote completo/);
  assert.match(siteConfigSource, /if \(!activeIsStatic && !activeIsManaged\) return false/);
  assert.match(siteConfigSource, /if \(!previousIsStatic && !previousIsManaged\) return false/);
  assert.match(siteConfigSource, /Hero media persistence pending: App Storage transfer failed/);
});

test("imágenes y audios conservan archivos; presentaciones usan almacenamiento privado", () => {
  const generator = readPresentationGeneratorModule("outputPipeline.ts");
  const voiceGenerator = readFileSync(new URL("../services/VoiceGenerator.ts", import.meta.url), "utf8");
  const imageGenerator = readFileSync(new URL("../services/SmartImageGenerator.ts", import.meta.url), "utf8");
  const routes = readRouteSources();
  const migration = readFileSync(
    new URL("../../scripts/migrate-media-to-app-storage.ts", import.meta.url),
    "utf8",
  );
  const admin = readFileSync(
    new URL("../../client/src/pages/admin/AdminPresentations.tsx", import.meta.url),
    "utf8",
  );
  const adminAudio = readFileSync(
    new URL("../../client/src/pages/admin/AdminGeneratedAudio.tsx", import.meta.url),
    "utf8",
  );
  const adminImages = readFileSync(
    new URL("../../client/src/pages/admin/AdminGeneratedImages.tsx", import.meta.url),
    "utf8",
  );

  const persistenceCall = generator.indexOf("await deps.persistFiles(generatedFiles)");
  const historyCall = generator.indexOf("await deps.createHistory({");
  assert.ok(persistenceCall > 0);
  assert.ok(historyCall > persistenceCall);
  assert.match(generator, /deps\.deletePersistentObjects\(persistedObjectNames\)/);

  assert.match(routes, /servePersistentManagedMedia\(req, res, publicPath\)/);
  assert.match(routes, /const persistentPaths = await listPersistentPublicMediaPaths\(\)/);
  assert.match(routes, /availability:\s*\{\s*pptx:/);
  assert.match(routes, /available:\s*await generatedAssetAvailable\(item\.audioUrl/);
  assert.equal(
    (routes.match(/code:\s*"HISTORY_IMMUTABLE"/g) || []).length,
    3,
  );
  assert.equal(
    (routes.match(/app\.delete\("\/api\/admin\/generated-(?:images|audio|presentations)\/:id"/g) || []).length,
    3,
  );

  assert.doesNotMatch(migration, /publicPrefix:\s*"\/generated-presentations"/);
  assert.match(migration, /"generated-audio"/);
  assert.match(migration, /"\.mp3"/);
  assert.doesNotMatch(migration, /"\.pptx"/);

  const audioPersistenceCall = voiceGenerator.indexOf("await persistPublicMediaFiles([{ absolutePath: outputPath, publicPath }])");
  const audioHistoryCall = voiceGenerator.indexOf("await storage.createGeneratedAudio({");
  assert.ok(audioPersistenceCall > 0);
  assert.ok(audioHistoryCall > audioPersistenceCall);
  assert.match(voiceGenerator, /deletePersistentMediaObjects\(persistedObjects\)/);
  assert.ok(
    imageGenerator.indexOf("await persistPublicMediaFiles([{")
      < imageGenerator.indexOf("await storage.createGeneratedImage(row)"),
  );
  assert.match(imageGenerator, /errorCode = 'history_save_failed'/);
  assert.match(imageGenerator, /deletePersistentMediaObjects\(persistedObjectNames\)/);

  assert.match(admin, /p\.availability\?\.pptx/);
  assert.match(admin, /El historial permanece en la base/);
  assert.doesNotMatch(admin, /button-delete-presentation|deleteMutation|Trash2/);
  assert.match(adminAudio, /El registro permanece, pero el archivo no está disponible/);
  assert.doesNotMatch(adminAudio, /button-delete-audio|deleteMutation|Trash2/);
  assert.match(adminImages, /Archivo no disponible/);
  assert.doesNotMatch(adminImages, /button-delete-image|deleteMutation|Trash2/);
});

test("los nueve reconocimientos recuperados son WebP válidos y livianos", async () => {
  const directory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../frontend-mirror/images/recognitions/2026",
  );
  const filenames = [
    "chambers-global-2026.webp",
    "chambers-latin-america-2026.webp",
    "ip-stars.webp",
    "iflr-1000.webp",
    "legal-500-latin-america-2026.webp",
    "latin-lawyer-250-2026.webp",
    "gcr-100-2026.webp",
    "gar-100-2025.webp",
    "itr-world-tax-2026.webp",
  ];

  for (const filename of filenames) {
    const metadata = await sharp(path.join(directory, filename)).metadata();
    assert.equal(metadata.format, "webp");
    assert.ok((metadata.width || 0) >= 700);
    assert.ok((metadata.height || 0) >= 700);
  }
});
