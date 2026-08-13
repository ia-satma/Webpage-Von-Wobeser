import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readRouteSources } from "./routeTestSources";
import { readSchemaSources } from "./schemaTestSources";

const routes = readRouteSources();
const auth = readFileSync(new URL("../auth.ts", import.meta.url), "utf8");
const login = readFileSync(
  new URL("../../client/src/pages/admin/AdminLogin.tsx", import.meta.url),
  "utf8",
);
const schema = readSchemaSources();
const recovery = readFileSync(
  new URL("../../scripts/recover-admin.ts", import.meta.url),
  "utf8",
);
const replitConfig = readFileSync(new URL("../../.replit", import.meta.url), "utf8");

test("Dueño y Administrador completan el login con usuario y contraseña", () => {
  const loginStart = routes.indexOf('app.post("/api/admin/login"');
  const loginEnd = routes.indexOf("const retiredMfaApi", loginStart);
  const loginRoute = routes.slice(loginStart, loginEnd);

  assert.ok(loginStart > 0);
  assert.match(loginRoute, /comparePassword\(password, user\.passwordHash\)/);
  assert.match(loginRoute, /deleteAdminAuthChallengesByUserId\(user\.id\)/);
  assert.match(loginRoute, /createAuthenticatedSession\(res, user, ip, userAgent\)/);
  assert.match(loginRoute, /authenticated:\s*true/);
  assert.doesNotMatch(loginRoute, /privilegedRole|mfaRequired|setupRequired|isMfaConfigured/);
});

test("la sesión administrativa y WebSocket ya no dependen de mfa_verified", () => {
  assert.doesNotMatch(auth, /MFA_REQUIRED|Multi-factor authentication required/);
  assert.doesNotMatch(routes, /ws\.close\(1008,\s*"MFA required"\)/);
  assert.match(routes, /mfaVerified:\s*true/);
  assert.match(auth, /Invalid CSRF token/);
  assert.match(auth, /SESSION_COOKIE/);
});

test("los endpoints MFA están retirados y la infraestructura cifrada se conserva", () => {
  assert.match(routes, /const retiredMfaApi/);
  assert.match(routes, /status\(410\)/);
  assert.match(routes, /MFA_RETIRED/);
  assert.match(routes, /"\/api\/admin\/mfa\/enroll"/);
  assert.match(routes, /"\/api\/admin\/mfa\/verify"/);
  assert.match(routes, /"\/api\/admin\/mfa\/recovery"/);
  assert.doesNotMatch(routes, /from "\.\/security\/mfa"/);

  assert.match(schema, /admin_mfa_credentials/);
  assert.match(schema, /admin_auth_challenges/);
  assert.doesNotMatch(recovery, /delete\(adminMfaCredentials\)/);
});

test("el cliente muestra únicamente correo o usuario y contraseña", () => {
  assert.match(login, /Correo electrónico o usuario/);
  assert.match(login, /Email or username/);
  assert.doesNotMatch(login, /mfaStep|mfaRequired|\/api\/admin\/mfa|one-time-code/);
  assert.doesNotMatch(login, /MFA_ENCRYPTION_KEY|códigos de recuperación|Two-step verification/);
});

test("Replit ya no requiere un secreto MFA para operar", () => {
  assert.doesNotMatch(replitConfig, /MFA_ENCRYPTION_KEY/);
  assert.match(replitConfig, /ADMIN_EMAIL y ADMIN_BOOTSTRAP_PASSWORD/);
});
