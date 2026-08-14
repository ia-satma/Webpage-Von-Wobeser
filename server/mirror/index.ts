import type { Express } from "express";
import { createMirrorRuntime } from "./runtime";
import { registerMirrorAdminRoutes } from "./routes/adminRoutes";
import { registerMirrorAssetAndFallbackRoutes } from "./routes/assetFallbackRoutes";
import { registerMirrorInstitutionalRoutes } from "./routes/institutionalRoutes";
import { registerMirrorLegacyRedirectRoutes } from "./routes/legacyRedirectRoutes";
import { registerMirrorOriginalRoutes } from "./routes/originalRoutes";
import { registerMirrorPublicRoutes } from "./routes/publicRoutes";

export {
  LANG_TOGGLE_SCRIPT,
  SEARCH_FORMS_SCRIPT,
  hardenLegacyClientScripts,
  injectFooterString,
  navigationLabelsScript,
  optimizeLegacyAssets,
  optimizePublicImageTags,
} from "./htmlPipeline";

export async function setupMirror(app: Express): Promise<void> {
  const runtime = await createMirrorRuntime();
  if (!runtime) return;

  registerMirrorPublicRoutes(app, runtime);
  registerMirrorLegacyRedirectRoutes(app, runtime);
  registerMirrorInstitutionalRoutes(app, runtime);
  registerMirrorOriginalRoutes(app, runtime);
  registerMirrorAdminRoutes(app, runtime);
  registerMirrorAssetAndFallbackRoutes(app, runtime);
}
