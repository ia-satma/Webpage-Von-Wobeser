import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";

// Importar auth no abre una conexión hasta ejecutar una consulta. Esta URL nunca
// se usa; evita depender de secretos reales en las pruebas criptográficas.
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused?sslmode=disable";
const {
  comparePassword,
  deriveCsrfToken,
  generateTemporaryPassword,
  hashPassword,
  passwordNeedsRehash,
  validateNewPassword,
} = await import("../auth");

test("new passwords use Argon2id and verify without persisting plaintext", async () => {
  const password = "Correct-Horse-Battery-2026!";
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
});

test("password policy and temporary credentials enforce the required length", () => {
  assert.equal(validateNewPassword("short").valid, false);
  assert.equal(validateNewPassword("passwordpassword").valid, false);
  const temporary = generateTemporaryPassword();
  assert.equal(temporary.length, 20);
  assert.equal(validateNewPassword(temporary).valid, true);
});

test("CSRF tokens are stable per session and do not expose the session token", () => {
  const raw = "A".repeat(43);
  const first = deriveCsrfToken(raw);
  assert.equal(first, deriveCsrfToken(raw));
  assert.notEqual(first, deriveCsrfToken("B".repeat(43)));
  assert.equal(first.includes(raw), false);
});
