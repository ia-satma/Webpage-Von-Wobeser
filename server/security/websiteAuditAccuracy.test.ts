import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IndustryGroup, News, PracticeGroup, TeamMember } from "@shared/schema";
import { publicImageAssetExists } from "../agents/specialized/websiteAuditMedia";
import {
  industryGroupContentIssues,
  isPublicNews,
  newsSeoIssues,
  practiceGroupContentIssues,
  teamMemberContentIssues,
  visibleTextLength,
} from "../agents/specialized/websiteAuditPolicy";
import {
  buildAuditFindingCleanupPlan,
  parseAuditFindingCleanupArguments,
} from "../../scripts/cleanup-open-audit-findings";

const root = process.cwd();

test("el auditor resuelve imágenes desde las mismas raíces públicas y bloquea traversal", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "vwys-audit-media-"));
  const mirrorDir = path.join(cwd, "mirror");
  const persistentCalls: string[] = [];
  const persistentExists = async (publicPath: string) => {
    persistentCalls.push(publicPath);
    return publicPath === "/generated-images/remote.png";
  };

  try {
    fs.mkdirSync(path.join(cwd, "attached_assets", "partner_photos"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "attached_assets", "counsel_photos"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "public"), { recursive: true });
    fs.mkdirSync(path.join(mirrorDir, "images"), { recursive: true });
    fs.writeFileSync(path.join(cwd, "attached_assets", "partner_photos", "partner.jpg"), "photo");
    fs.writeFileSync(path.join(cwd, "attached_assets", "counsel_photos", "counsel.png"), "photo");
    fs.writeFileSync(path.join(cwd, "public", "placeholder-article.svg"), "<svg/>");
    fs.writeFileSync(path.join(mirrorDir, "images", "legacy.jpg"), "legacy");

    assert.equal(await publicImageAssetExists("/partner_photos/partner.jpg?v=1", { cwd, mirrorDir, persistentExists }), true);
    assert.equal(await publicImageAssetExists("/counsel_photos/counsel.png", { cwd, mirrorDir, persistentExists }), true);
    assert.equal(await publicImageAssetExists("/placeholder-article.svg", { cwd, mirrorDir, persistentExists }), true);
    assert.equal(await publicImageAssetExists("/images/legacy.jpg", { cwd, mirrorDir, persistentExists }), true);
    assert.equal(await publicImageAssetExists("/generated-images/remote.png", { cwd, mirrorDir, persistentExists }), true);
    assert.equal(await publicImageAssetExists("/generated-images/missing.png", { cwd, mirrorDir, persistentExists }), false);
    const callsBeforeTraversal = persistentCalls.length;
    assert.equal(await publicImageAssetExists("/%2e%2e/secret.txt", { cwd, mirrorDir, persistentExists }), false);
    assert.equal(await publicImageAssetExists("/../secret.txt", { cwd, mirrorDir, persistentExists }), false);
    assert.equal(persistentCalls.length, callsBeforeTraversal);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("las reglas de contenido miden texto visible y no exigen colegiación universal", () => {
  assert.equal(visibleTextLength("<p>Uno&nbsp; &amp; dos</p>"), 9);

  const member = {
    bio: `<p>${"Experiencia jurídica internacional ".repeat(3)}</p>`,
    imageUrl: "/partner_photos/person.jpg",
    email: "person@example.com",
    phone: "+52 55 0000 0000",
    education: ["Universidad"],
    barAdmissions: [],
  } as unknown as TeamMember;
  assert.deepEqual(teamMemberContentIssues(member), []);

  const longBody = `<p>${"Contenido editorial completo y verificable. ".repeat(4)}</p>`;
  const practice = { description: "", fullDescription: longBody } as PracticeGroup;
  const industry = { description: "Corta", fullDescription: longBody } as IndustryGroup;
  assert.deepEqual(practiceGroupContentIssues(practice), []);
  assert.deepEqual(industryGroupContentIssues(industry), []);
  assert.deepEqual(
    practiceGroupContentIssues({ description: "", fullDescription: "" } as PracticeGroup),
    ["Missing or short introduction and body"],
  );
});

test("el auditor excluye borradores y publicaciones programadas", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");
  assert.equal(isPublicNews({ published: false } as News, now), false);
  assert.equal(isPublicNews({ published: true, publishAt: new Date("2026-08-14T12:00:00.000Z") } as News, now), false);
  assert.equal(isPublicNews({ published: true, publishAt: new Date("2026-08-12T12:00:00.000Z") } as News, now), true);
  assert.equal(isPublicNews({ published: true, publishAt: null } as News, now), true);
});

test("SEO separa hallazgos y mantiene la imagen ausente como recomendación baja", () => {
  const issues = newsSeoIssues({
    slug: "nota",
    title: "Título corto",
    excerpt: "Breve",
    imageUrl: null,
  } as News);
  assert.deepEqual(
    issues.map(({ issueType, severity, ownerAgent }) => ({ issueType, severity, ownerAgent })),
    [
      { issueType: "short_title", severity: "low", ownerAgent: "seo_optimizer" },
      { issueType: "short_meta_description", severity: "medium", ownerAgent: "seo_optimizer" },
      { issueType: "missing_featured_image", severity: "low", ownerAgent: "image_suggestion" },
    ],
  );
});

test("el placeholder es un SVG estático seguro y tiene una ruta anterior al catch-all", () => {
  const svg = fs.readFileSync(path.join(root, "public", "placeholder-article.svg"), "utf8");
  const routes = fs.readFileSync(path.join(root, "server", "routes", "publicAssetRoutes.ts"), "utf8");
  assert.match(svg, /^<svg\b/);
  assert.doesNotMatch(svg, /<script\b|onload\s*=|javascript:/i);
  assert.match(routes, /app\.get\('\/placeholder-article\.svg'/);
  assert.ok(routes.indexOf("/placeholder-article.svg") < routes.indexOf("app.use('/partner_photos'"));
  assert.match(routes, /max-age=31536000, immutable/);
});

test("una imagen generada histórica ausente conserva la evidencia administrativa y no rompe el sitio público", () => {
  const routes = fs.readFileSync(path.join(root, "server", "routes", "publicAssetRoutes.ts"), "utf8");
  const persistentAttempt = routes.indexOf("await servePersistentManagedMedia(req, res, publicPath)");
  const fallback = routes.indexOf("X-VWB-Media-Fallback', 'missing-generated-image'");

  assert.ok(persistentAttempt >= 0 && fallback > persistentAttempt);
  assert.match(routes, /res\.setHeader\('Cache-Control', 'no-store'\)/);
  assert.match(routes, /return res\.sendFile\(placeholderArticlePath\)/);
});

test("API y panel paginan hallazgos sin quitar la exportación completa", () => {
  const routeSource = fs.readFileSync(path.join(root, "server", "routes", "systemAuditRoutes.ts"), "utf8");
  const storageSource = fs.readFileSync(path.join(root, "server", "storage", "repositories", "auditRepository.ts"), "utf8");
  const controllerSource = fs.readFileSync(path.join(root, "client", "src", "features", "admin", "audits", "useAdminAudits.ts"), "utf8");
  assert.match(routeSource, /max\(100\)\.default\(50\)/);
  assert.match(routeSource, /\/api\/audits\/:id\/findings/);
  assert.match(routeSource, /\/api\/audits\/findings\/open/);
  assert.match(routeSource, /shouldIncludeFindings\(req\.query\.includeFindings\)/);
  assert.match(routeSource, /export\.csv/);
  assert.match(storageSource, /count\(\*\)::int/);
  assert.match(storageSource, /\.limit\(options\.limit\)/);
  assert.match(storageSource, /\.offset\(options\.offset\)/);
  assert.match(controllerSource, /FINDINGS_PAGE_SIZE = 50/);
  assert.match(controllerSource, /includeFindings=false/);
  assert.match(controllerSource, /\/api\/audits\/findings/);
});

test("la limpieza histórica es dry-run por defecto y exige confirmación exacta", async () => {
  const id = "56444c97-0253-41c6-80dd-320a5d1a8dfc";
  assert.deepEqual(parseAuditFindingCleanupArguments([]), {
    auditId: null,
    apply: false,
    confirmation: null,
  });
  assert.deepEqual(parseAuditFindingCleanupArguments([`--audit-id=${id}`]), {
    auditId: id,
    apply: false,
    confirmation: null,
  });
  assert.throws(() => parseAuditFindingCleanupArguments(["--apply"]), /dry-run/i);
  assert.throws(
    () => parseAuditFindingCleanupArguments([`--audit-id=${id}`, "--apply", "--confirm=00000000-0000-4000-8000-000000000000"]),
    /no coincide/i,
  );

  const plan = await buildAuditFindingCleanupPlan({
    query: async () => ({
      rows: [
        { category: "links", count: 12 },
        { category: "seo", count: 34 },
      ],
      rowCount: 2,
    }),
  }, id);
  assert.equal(plan.total, 46);
  assert.deepEqual(plan.byCategory, { translations: 0, content: 0, seo: 34, links: 12 });

  const source = fs.readFileSync(path.join(root, "scripts", "cleanup-open-audit-findings.ts"), "utf8");
  assert.match(source, /BEGIN TRANSACTION READ ONLY/);
  assert.match(source, /audit_id <> \$1/);
  assert.match(source, /status = 'open'/);
  assert.match(source, /FOR UPDATE/);
  assert.doesNotMatch(source, /\bDELETE\s+FROM\b/i);
});
