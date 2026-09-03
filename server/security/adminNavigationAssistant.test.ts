import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAdminPageContext, getAssistedAdminActions } from "../../client/src/lib/adminNavigationAssistant";

test("el buscador asistido conserva sólo acciones permitidas y reconoce vocabulario editorial", () => {
  const actions = getAssistedAdminActions((item) => item.href === "/admin/news" || item.href === "/admin/team");
  assert.deepEqual(actions.map((action) => action.href), ["/admin/team", "/admin/news"]);
  const news = actions.find((action) => action.href === "/admin/news");
  assert.match(news?.searchValue || "", /publicar/);
  assert.match(news?.searchValue || "", /borrador/);
});

test("las migas distinguen formularios editoriales y configuración global", () => {
  assert.deepEqual(getAdminPageContext("/admin/news/123/edit"), {
    groupLabel: "Contenido del sitio",
    sectionLabel: "Noticias y publicaciones",
    detailLabel: "Editar publicación",
    impact: "content",
  });
  assert.equal(getAdminPageContext("/admin/site-config/seo").impact, "site");
});

test("los indicadores y vistas previas administrativas se mantienen privados y sin datos personales", () => {
  const navigationRoutes = readFileSync(new URL("../routes/adminNavigationRoutes.ts", import.meta.url), "utf8");
  const previewRoutes = readFileSync(new URL("../routes/adminPreviewRoutes.ts", import.meta.url), "utf8");
  assert.match(navigationRoutes, /"\/api\/admin\/navigation-status", authMiddleware/);
  assert.match(navigationRoutes, /effectivePermissions\(req\.adminUser!/);
  assert.match(navigationRoutes, /count\(\*\)::int/);
  assert.doesNotMatch(navigationRoutes, /\.email|\.message|cvPath/);
  assert.match(previewRoutes, /"\/api\/admin\/preview\/news\/:id", privatePreviewAccess/);
  assert.match(previewRoutes, /"\/api\/admin\/preview\/team\/:id", privatePreviewAccess/);
  assert.match(previewRoutes, /res\.sendStatus\(404\)/);
  assert.match(previewRoutes, /effectivePermissions\(resolved\.user\)\.has\("content"\)/);
  assert.match(previewRoutes, /X-Robots-Tag", "noindex, nofollow, noarchive"/);
  assert.match(previewRoutes, /Cache-Control", "private, no-store"/);
});
