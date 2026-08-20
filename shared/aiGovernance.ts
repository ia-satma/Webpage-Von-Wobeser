export const AI_GOVERNANCE_POLICY_VERSION = "2.0.0";

export const AI_DATA_CLASSIFICATIONS = [
  "public",
  "internal",
  "personal",
  "confidential",
  "privileged",
] as const;

export type AiDataClassification = (typeof AI_DATA_CLASSIFICATIONS)[number];

export const AI_ALLOWED_EXTERNAL_CLASSIFICATIONS = ["public", "internal"] as const;
export const AI_BLOCKED_EXTERNAL_CLASSIFICATIONS = [
  "personal",
  "confidential",
  "privileged",
] as const;

export function isAiDataClassification(value: unknown): value is AiDataClassification {
  return typeof value === "string" && (AI_DATA_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function isAiExternalClassificationAllowed(
  value: AiDataClassification,
): value is (typeof AI_ALLOWED_EXTERNAL_CLASSIFICATIONS)[number] {
  return (AI_ALLOWED_EXTERNAL_CLASSIFICATIONS as readonly string[]).includes(value);
}
