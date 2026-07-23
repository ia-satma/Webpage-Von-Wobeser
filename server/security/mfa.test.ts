import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  verifyTotp,
} from "./mfa";

process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

test("TOTP secrets are encrypted with authenticated encryption", () => {
  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(decryptTotpSecret(encrypted), secret);
  const parts = encrypted.split(".");
  parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
  assert.throws(() => decryptTotpSecret(parts.join(".")));
});

test("recovery codes are one-time values stored only as hashes", () => {
  const { plain: codes, hashes } = generateRecoveryCodes(8);
  assert.equal(codes.length, 8);
  assert.equal(hashes.length, 8);
  assert.ok(codes.every((code) => !hashes.includes(code)));
  const remaining = consumeRecoveryCode(hashes, codes[0]);
  assert.ok(remaining);
  assert.equal(remaining.length, 7);
  assert.equal(consumeRecoveryCode(remaining, codes[0]), null);
});

test("TOTP rejects malformed codes without throwing", () => {
  assert.equal(verifyTotp(generateTotpSecret(), "not-a-code"), false);
});
