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

test("el primer factor conserva contraseña Argon2id y deriva a MFA cuando la política lo exige", () => {
  const loginStart = routes.indexOf('app.post("/api/admin/login"');
  const loginEnd = routes.indexOf("const MFA_CODE_POLICY", loginStart);
  const loginRoute = routes.slice(loginStart, loginEnd);

  assert.ok(loginStart > 0);
  assert.match(loginRoute, /comparePassword\(password, user\.passwordHash\)/);
  assert.match(loginRoute, /isMfaRequiredForRole\(user\.role\)/);
  assert.match(loginRoute, /isMfaConfigured\(\)/);
  assert.match(loginRoute, /issueMfaChallenge\(res, user\.id, purpose\)/);
  assert.match(loginRoute, /MFA_CONFIGURATION_REQUIRED/);
  assert.match(loginRoute, /mfaRequired:\s*true/);
});

test("la sesión administrativa conserva sus controles y registra si completó MFA", () => {
  assert.match(routes, /mfaVerified,/);
  assert.match(auth, /Invalid CSRF token/);
  assert.match(auth, /SESSION_COOKIE/);
  assert.match(auth, /Two-step verification required/);
  assert.match(auth, /isMfaRequiredForRole\(user\.role\) && !session\.mfaVerified/);
});

test("MFA usa desafío opaco, TOTP cifrado, límites compartidos y recuperación de un solo uso", () => {
  assert.match(routes, /resolveMfaChallenge/);
  assert.match(routes, /MFA_CODE_POLICY/);
  assert.match(routes, /checkSharedRateLimit\("mfa"/);
  assert.match(routes, /recordSharedRateLimitAttempt\("mfa"/);
  assert.match(routes, /"\/api\/admin\/mfa\/enroll"/);
  assert.match(routes, /"\/api\/admin\/mfa\/verify"/);
  assert.match(routes, /"\/api\/admin\/mfa\/recovery"/);
  assert.match(routes, /decryptTotpSecret/);
  assert.match(routes, /consumeRecoveryCode/);

  assert.match(schema, /admin_mfa_credentials/);
  assert.match(schema, /admin_auth_challenges/);
  assert.doesNotMatch(recovery, /delete\(adminMfaCredentials\)/);
});

test("el cliente pide y confirma el segundo factor sin exponer la cookie de sesión", () => {
  assert.match(login, /Correo electrónico o usuario/);
  assert.match(login, /Email or username/);
  assert.match(login, /mfaRequired/);
  assert.match(login, /\/api\/admin\/mfa\/enroll/);
  assert.match(login, /\/api\/admin\/mfa\/verify/);
  assert.match(login, /\/api\/admin\/mfa\/recovery/);
  assert.match(login, /códigos de recuperación/);
});

test("la configuración de Replit exige preparar MFA antes de la entrega", () => {
  assert.match(replitConfig, /MFA_ENCRYPTION_KEY/);
  assert.match(replitConfig, /MFA_REQUIRED_FOR_PRIVILEGED=true/);
  assert.match(replitConfig, /ADMIN_EMAIL y ADMIN_BOOTSTRAP_PASSWORD/);
});
