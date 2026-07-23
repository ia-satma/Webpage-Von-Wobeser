import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";

// Importar auth no abre una conexión hasta ejecutar una consulta. Esta URL nunca
// se usa; evita depender de secretos reales en las pruebas criptográficas.
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused?sslmode=disable";
const {
  comparePassword,
  adminSessionUserPayload,
  deriveCsrfToken,
  effectivePermissions,
  generateAdminPassword,
  hashPassword,
  passwordNeedsRehash,
  rehashVerifiedPassword,
  validateNewPassword,
} = await import("../auth");
const { adminLoginSchema } = await import("../../shared/schema");

test("new passwords use Argon2id and verify without persisting plaintext", async () => {
  const password = "Secure-2026-Key!";
  const encoded = await hashPassword(password);
  assert.match(encoded, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.equal(encoded.includes(password), false);
  assert.equal(await comparePassword(password, encoded), true);
  assert.equal(await comparePassword(`${password}x`, encoded), false);
  assert.equal(passwordNeedsRehash(encoded), false);
});

test("legacy bcrypt remains verifiable and is marked for lazy migration", async () => {
  const password = "Legacy-password-2026!";
  const encoded = await bcrypt.hash(password, 12);
  assert.equal(await comparePassword(password, encoded), true);
  assert.equal(passwordNeedsRehash(encoded), true);
  const migrated = await rehashVerifiedPassword(password);
  assert.equal(await comparePassword(password, migrated), true);
  assert.equal(passwordNeedsRehash(migrated), false);
});

test("password policy accepts 12–16 characters and generated credentials are definitive", () => {
  assert.equal(validateNewPassword("A1-safe-key!").valid, true);
  assert.equal(validateNewPassword("A1-safe-key!2026").valid, true);
  assert.equal(validateNewPassword("short-key!1").valid, false);
  assert.equal(validateNewPassword("A1-safe-key!2026x").valid, false);
  assert.equal(validateNewPassword("passwordpassword").valid, false);
  assert.equal(validateNewPassword("VonWobeser-Key!").valid, true);
  const generated = generateAdminPassword();
  assert.equal(generated.length, 16);
  assert.equal(validateNewPassword(generated).valid, true);
});

test("admin login normalizes email case without changing usernames", () => {
  const emailLogin = adminLoginSchema.parse({
    username: "  AlejandroMtzICC@GMAIL.com  ",
    password: "Secure-2026-Key!",
  });
  assert.equal(emailLogin.username, "alejandromtzicc@gmail.com");

  const usernameLogin = adminLoginSchema.parse({
    username: "CaseSensitiveUsername",
    password: "Secure-2026-Key!",
  });
  assert.equal(usernameLogin.username, "CaseSensitiveUsername");
});

test("CSRF tokens are stable per session and do not expose the session token", () => {
  const raw = "A".repeat(43);
  const first = deriveCsrfToken(raw);
  assert.equal(first, deriveCsrfToken(raw));
  assert.notEqual(first, deriveCsrfToken("B".repeat(43)));
  assert.equal(first.includes(raw), false);
});

test("authenticated admin payloads always include effective configuration permissions", () => {
  const owner = {
    id: "owner-id",
    username: "owner",
    email: "owner@example.com",
    role: "super_admin",
    permissions: [],
  };
  const payload = adminSessionUserPayload(owner);
  assert.equal(payload.mustChangePassword, false);
  assert.equal(payload.permissions.includes("config"), true);
  assert.deepEqual(new Set(payload.permissions), effectivePermissions(owner));
});
