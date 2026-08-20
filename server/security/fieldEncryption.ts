import crypto from "node:crypto";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const VERSION = 1;

export type ProtectedFieldEnvelopeInsert = {
  resourceType: string;
  resourceId: string;
  fieldName: string;
  ciphertext: string;
  keyId: string;
  encryptionVersion: number;
  contentSha256: string;
};

function decodeEncryptionKey(value: string): Buffer {
  const trimmed = value.trim();
  const key = /^[a-f0-9]{64}$/i.test(trimmed)
    ? Buffer.from(trimmed, "hex")
    : Buffer.from(trimmed, "base64url");
  if (key.length !== KEY_BYTES) {
    throw new Error("APP_FIELD_ENCRYPTION_KEY must encode exactly 32 bytes");
  }
  return key;
}

export function isFieldEncryptionDualWriteEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.APP_FIELD_ENCRYPTION_DUAL_WRITE === "true";
}

function keyConfiguration(env: NodeJS.ProcessEnv): { key: Buffer; keyId: string } {
  const rawKey = env.APP_FIELD_ENCRYPTION_KEY?.trim();
  const keyId = env.APP_FIELD_ENCRYPTION_KEY_ID?.trim();
  if (!rawKey || !keyId || !/^[A-Za-z0-9._-]{1,80}$/.test(keyId)) {
    throw new Error("Field encryption requires a valid key and key identifier");
  }
  return { key: decodeEncryptionKey(rawKey), keyId };
}

export function buildProtectedFieldEnvelopes(
  resourceType: "contact_submission" | "career_application",
  resourceId: string,
  fields: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
): ProtectedFieldEnvelopeInsert[] {
  if (!isFieldEncryptionDualWriteEnabled(env)) return [];
  if (!/^[0-9a-f-]{36}$/i.test(resourceId)) throw new Error("Invalid protected resource identifier");
  const { key, keyId } = keyConfiguration(env);

  return Object.entries(fields).flatMap(([fieldName, rawValue]) => {
    if (typeof rawValue !== "string" || rawValue.length === 0) return [];
    if (!/^[a-z][a-z0-9_]{0,79}$/i.test(fieldName)) throw new Error("Invalid protected field name");
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
    cipher.setAAD(Buffer.from(`${resourceType}:${resourceId}:${fieldName}:v${VERSION}`, "utf8"));
    const encrypted = Buffer.concat([cipher.update(rawValue, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const ciphertext = `v${VERSION}.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
    return [{
      resourceType,
      resourceId,
      fieldName,
      ciphertext,
      keyId,
      encryptionVersion: VERSION,
      // La huella se calcula sobre el sobre cifrado, nunca sobre el valor personal
      // original. Así no permite probar diccionarios de correos o teléfonos.
      contentSha256: crypto.createHash("sha256").update(ciphertext, "utf8").digest("hex"),
    }];
  });
}

export function decryptProtectedFieldForRecovery(
  envelope: Pick<ProtectedFieldEnvelopeInsert, "resourceType" | "resourceId" | "fieldName" | "ciphertext">,
  encodedKey: string,
): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...unexpected] = envelope.ciphertext.split(".");
  if (version !== `v${VERSION}` || unexpected.length > 0) throw new Error("Unsupported encrypted field envelope");
  const iv = Buffer.from(encodedIv || "", "base64url");
  const tag = Buffer.from(encodedTag || "", "base64url");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error("Invalid encrypted field envelope");
  const decipher = crypto.createDecipheriv("aes-256-gcm", decodeEncryptionKey(encodedKey), iv, {
    authTagLength: TAG_BYTES,
  });
  decipher.setAAD(Buffer.from(
    `${envelope.resourceType}:${envelope.resourceId}:${envelope.fieldName}:v${VERSION}`,
    "utf8",
  ));
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext || "", "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
