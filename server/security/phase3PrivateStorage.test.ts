import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import {
  privatePresentationLocalPath,
  privatePresentationMimeType,
  privatePresentationObjectName,
  privatePresentationPathBelongsTo,
  privatePresentationStoragePath,
} from "../media/privatePresentations";
import {
  buildNewsletterUnsubscribeUrl,
  createNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from "./newsletterUnsubscribe";
import { pseudonymizeNetworkAddress } from "./privacy";
import {
  assertLegacyPresentationObjectName,
  buildPresentationInventoryState,
  legacyObjectNameFromDatabaseReference,
  quarantinePresentationObjectName,
  validatePresentationInventory,
} from "../../scripts/presentation-storage-safety.mjs";

const PRESENTATION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

test("new presentations map only to their UUID-scoped private object prefix", () => {
  const pptx = privatePresentationStoragePath(PRESENTATION_ID, "pptx");
  const pdf = privatePresentationStoragePath(PRESENTATION_ID, "pdf");
  const png = privatePresentationStoragePath(PRESENTATION_ID, "png", 1);
  assert.equal(pptx, `private:generated-presentations/${PRESENTATION_ID}/presentation.pptx`);
  assert.equal(pdf, `private:generated-presentations/${PRESENTATION_ID}/presentation.pdf`);
  assert.equal(png, `private:generated-presentations/${PRESENTATION_ID}/slides/1.png`);
  assert.equal(
    privatePresentationObjectName(png!),
    `von-wobeser/private/generated-presentations/${PRESENTATION_ID}/slides/1.png`,
  );
  assert.equal(privatePresentationPathBelongsTo(pptx, PRESENTATION_ID), true);
  assert.equal(privatePresentationPathBelongsTo(pptx, OTHER_ID), false);
  assert.equal(privatePresentationMimeType(pptx!), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  assert.ok(privatePresentationLocalPath(png!)?.includes(`/private/generated-presentations/${PRESENTATION_ID}/slides/1.png`));
});

test("private presentation parsing rejects public paths, traversal and unknown formats", () => {
  for (const value of [
    "/generated-presentations/example.pdf",
    `private:generated-presentations/${PRESENTATION_ID}/../presentation.pdf`,
    `private:generated-presentations/${PRESENTATION_ID}/presentation.html`,
    `private:generated-presentations/${PRESENTATION_ID}/slides/0.png`,
    `private:generated-presentations/${PRESENTATION_ID}/slides/1.svg`,
    `private:generated-presentations/not-a-uuid/presentation.pdf`,
  ]) {
    assert.equal(privatePresentationObjectName(value), null, value);
  }
  assert.equal(privatePresentationStoragePath(PRESENTATION_ID, "png", 0), null);
  assert.equal(privatePresentationStoragePath(PRESENTATION_ID, "png", 1000), null);
});

test("legacy inventory accepts only the exact presentation prefix and three extensions", () => {
  const valid = "von-wobeser/public/generated-presentations/pres-1.pdf";
  assert.equal(assertLegacyPresentationObjectName(valid), valid);
  assert.equal(
    legacyObjectNameFromDatabaseReference("/generated-presentations/pres-1.pdf"),
    valid,
  );
  assert.equal(
    legacyObjectNameFromDatabaseReference(`private:generated-presentations/${PRESENTATION_ID}/presentation.pdf`),
    null,
  );
  for (const invalid of [
    "von-wobeser/public/uploads/pres-1.pdf",
    "von-wobeser/public/generated-images/pres-1.png",
    "von-wobeser/public/generated-audio/pres-1.pdf",
    "von-wobeser/private/generated-presentations/pres-1.pdf",
    "von-wobeser/public/generated-presentations/subdir/pres-1.pdf",
    "von-wobeser/public/generated-presentations/pres-1.exe",
    "von-wobeser/public/generated-presentations/../pres-1.pdf",
  ]) {
    assert.throws(() => assertLegacyPresentationObjectName(invalid), undefined, invalid);
  }
  assert.throws(() => legacyObjectNameFromDatabaseReference("/uploads/pres-1.pdf"));
});

test("quarantine destinations cannot escape their date-scoped prefix", () => {
  const source = "von-wobeser/public/generated-presentations/pres-1.pptx";
  assert.equal(
    quarantinePresentationObjectName(source, "2026-08-20T120000Z"),
    "von-wobeser/quarantine/generated-presentations/2026-08-20T120000Z/pres-1.pptx",
  );
  assert.throws(() => quarantinePresentationObjectName(source, "../../uploads"));
  assert.throws(() => quarantinePresentationObjectName("von-wobeser/public/uploads/file.pdf", "2026-08-20T120000Z"));
});

test("presentation inventory digest covers counts, references, bytes and checksums", () => {
  const state = buildPresentationInventoryState([
    { id: PRESENTATION_ID, createdAt: "2026-08-20T00:00:00.000Z", status: "active", legacyObjects: ["von-wobeser/public/generated-presentations/pres-1.pdf"] },
  ], [
    { name: "von-wobeser/public/generated-presentations/pres-1.pdf", bytes: 4, sha256: "a".repeat(64), referencedBy: [PRESENTATION_ID] },
  ]);
  const digestSha256 = crypto.createHash("sha256").update(JSON.stringify(state)).digest("hex");
  assert.deepEqual(validatePresentationInventory({ capturedAt: "2026-08-20T00:00:00.000Z", digestSha256, state }).state, state);
  assert.throws(() => validatePresentationInventory({ capturedAt: "2026-08-20T00:00:00.000Z", digestSha256: "0".repeat(64), state }));
});

test("inventory is read-only by default and no permanent purge mode exists", () => {
  const source = fs.readFileSync(new URL("../../scripts/presentation-storage-safety.mjs", import.meta.url), "utf8");
  assert.match(source, /option\("mode"\) \|\| "inventory"/);
  assert.match(source, /default_transaction_read_only=on|readDatabaseRows\(true\)/);
  assert.match(source, /client\.copy\(source, destination\)/);
  assert.match(source, /confirm-scope/);
  assert.match(source, /confirm-sha256/);
  assert.match(source, /permanentDeletion: "NOT_IMPLEMENTED"/);
  assert.doesNotMatch(source, /mode === "purge"/);
});

test("phase 3 migration is additive and cannot delete business data", () => {
  const migration = fs.readFileSync(
    new URL("../../migrations/20260820_0001_private_presentations.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS status/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS archived_at/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS media_deletion_requests/i);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE|UPDATE)\b/i);
  for (const protectedTable of ["team_members", "news", "career_applications", "contact_submissions", "admin_users"]) {
    assert.doesNotMatch(migration, new RegExp(`\\b${protectedTable}\\b`, "i"));
  }
});

test("public presentation routes are retired while admin streams require agents", () => {
  const publicRoutes = fs.readFileSync(new URL("../routes/publicAssetRoutes.ts", import.meta.url), "utf8");
  const adminRoutes = fs.readFileSync(new URL("../routes/agentAssetHistoryRoutes.ts", import.meta.url), "utf8");
  assert.match(publicRoutes, /app\.use\('\/generated-presentations'/);
  assert.match(publicRoutes, /status\(404\)/);
  assert.doesNotMatch(publicRoutes, /express\.static\(generatedPresentationsDir/);
  assert.match(adminRoutes, /generated-presentations\/:id\/files\/:format.*authMiddleware.*requirePermission\("agents"\)/s);
  assert.match(adminRoutes, /generated-presentations\/:id\/slides\/:index.*authMiddleware.*requirePermission\("agents"\)/s);
  assert.match(adminRoutes, /Cache-Control", "private, no-store"/);
  assert.match(adminRoutes, /privatePresentationPathBelongsTo/);
});

test("future media deletion requests are durable and do not delete immediately", () => {
  const routes = fs.readFileSync(new URL("../routes/adminMediaRoutes.ts", import.meta.url), "utf8");
  const route = routes.slice(routes.indexOf('app.delete("/api/admin/media/:id"'));
  assert.match(route, /queueMediaDeletion/);
  assert.match(route, /res\.status\(202\)/);
  assert.doesNotMatch(route, /storage\.deleteMediaItem/);
});

test("new network identifiers use keyed pseudonyms and never fall back to clear text", () => {
  const env = { SESSION_SECRET: "s".repeat(32) } as NodeJS.ProcessEnv;
  const first = pseudonymizeNetworkAddress("203.0.113.42", env);
  assert.match(first || "", /^hmac-sha256:[a-f0-9]{64}$/);
  assert.equal(first, pseudonymizeNetworkAddress("203.0.113.42", env));
  assert.notEqual(first, pseudonymizeNetworkAddress("203.0.113.43", env));
  assert.equal(pseudonymizeNetworkAddress("203.0.113.42", {} as NodeJS.ProcessEnv), null);
  assert.doesNotMatch(first || "", /203\.0\.113\.42/);
});

test("newsletter unsubscribe tokens are opaque, authenticated and usable only with the same key", () => {
  const env = { SESSION_SECRET: "n".repeat(32), NODE_ENV: "production" } as NodeJS.ProcessEnv;
  const token = createNewsletterUnsubscribeToken(PRESENTATION_ID, env);
  assert.match(token || "", /^[A-Za-z0-9_-]{60,80}$/);
  assert.doesNotMatch(token || "", /11111111/);
  assert.equal(verifyNewsletterUnsubscribeToken(token, env), PRESENTATION_ID);
  assert.equal(verifyNewsletterUnsubscribeToken(`${token!.slice(0, -1)}A`, env), null);
  assert.equal(verifyNewsletterUnsubscribeToken(token, { SESSION_SECRET: "x".repeat(32) } as NodeJS.ProcessEnv), null);
  assert.match(buildNewsletterUnsubscribeUrl("https://www.vonwobeser.com", PRESENTATION_ID, env) || "", /^https:\/\/www\.vonwobeser\.com\/newsletter\/unsubscribe\?token=/);
  assert.equal(buildNewsletterUnsubscribeUrl("http://example.test", PRESENTATION_ID, env), null);
});
