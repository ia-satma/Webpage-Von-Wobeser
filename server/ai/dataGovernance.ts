import crypto from "node:crypto";
import {
  AI_GOVERNANCE_POLICY_VERSION,
  isAiDataClassification,
  isAiExternalClassificationAllowed,
  type AiDataClassification,
} from "@shared/aiGovernance";
import type { AgentId } from "@shared/agentConstants";
import { AI_AGENT_RUNTIME_POLICY } from "./policy";

export type AiProvider = "openai" | "gemini" | "cloudflare";
export type AiOperation = "chat" | "image" | "speech" | "web_search";

export type AiGovernanceContext = {
  classification: AiDataClassification;
  purpose: string;
  source: "agent" | "translation" | "official_source" | "presentation" | "knowledge" | "admin_tool";
  agentId?: AgentId;
  actorId?: string | null;
  jobId?: string | null;
};

export type AiGovernanceDecision = {
  allowed: boolean;
  classification: AiDataClassification | "invalid";
  reasonCodes: string[];
  contentSha256: string;
  contentBytes: number;
  policyVersion: string;
};

type Detector = {
  code: string;
  pattern: RegExp;
};

const MAX_INSPECTION_STRINGS = 2_000;
const MAX_INSPECTION_CHARACTERS = 500_000;

type InspectionProjection = {
  strings: string[];
  truncated: boolean;
};

const BLOCKING_DETECTORS: readonly Detector[] = [
  {
    code: "credential_material",
    pattern: /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:bearer|authorization)\s*[:=]?\s*[a-z0-9._~-]{20,}\b|\bsk-[a-z0-9_-]{20,}\b)/i,
  },
  {
    code: "personal_email",
    pattern: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  },
  {
    code: "personal_phone",
    pattern: /(?:^|\D)(?:\+?52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}(?:\D|$)/,
  },
  {
    code: "government_identifier",
    pattern: /\b[A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM][A-Z]{5}[A-Z0-9]\d\b/i,
  },
  {
    code: "financial_identifier",
    pattern: /(?:^|\D)\d{18}(?:\D|$)/,
  },
  {
    code: "express_confidentiality",
    pattern: /\b(?:confidencial|confidential|strictly confidential|uso interno exclusivo|for internal use only|no divulgar|non[- ]disclosure)\b/i,
  },
  {
    code: "legal_privilege",
    pattern: /\b(?:attorney[- ]client privileged|legal privilege|privileged and confidential|secreto profesional|comunicaci[oó]n abogado[- ]cliente|estrategia procesal reservada)\b/i,
  },
  {
    code: "sensitive_record",
    pattern: /\b(?:historia cl[ií]nica|medical record|expediente m[eé]dico|n[uú]mero de seguridad social|social security number)\b/i,
  },
];

function collectStrings(value: unknown, projection: InspectionProjection, depth = 0): void {
  if (depth > 8) {
    if (value !== undefined && value !== null) projection.truncated = true;
    return;
  }
  if (typeof value === "string") {
    if (projection.strings.length >= MAX_INSPECTION_STRINGS) {
      projection.truncated = true;
      return;
    }
    projection.strings.push(value);
    return;
  }
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    if (projection.strings.length >= MAX_INSPECTION_STRINGS) {
      projection.truncated = true;
      return;
    }
    projection.strings.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_INSPECTION_STRINGS) projection.truncated = true;
    for (const item of value.slice(0, MAX_INSPECTION_STRINGS)) {
      collectStrings(item, projection, depth + 1);
    }
    return;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_INSPECTION_STRINGS) projection.truncated = true;
    for (const [key, item] of entries.slice(0, MAX_INSPECTION_STRINGS)) {
      collectStrings(key, projection, depth + 1);
      collectStrings(item, projection, depth + 1);
    }
  }
}

function canonicalContent(value: unknown): { content: string; truncated: boolean } {
  const projection: InspectionProjection = { strings: [], truncated: false };
  collectStrings(value, projection);
  const completeContent = projection.strings.join("\n");
  if (completeContent.length > MAX_INSPECTION_CHARACTERS) projection.truncated = true;
  return {
    content: completeContent.slice(0, MAX_INSPECTION_CHARACTERS),
    truncated: projection.truncated,
  };
}

export function inspectAiData(
  context: AiGovernanceContext,
  payload: unknown,
): AiGovernanceDecision {
  const projection = canonicalContent(payload);
  const content = projection.content;
  const reasonCodes = new Set<string>();
  const classification = isAiDataClassification(context.classification)
    ? context.classification
    : "invalid";

  if (classification === "invalid") {
    reasonCodes.add("classification_required");
  } else if (!isAiExternalClassificationAllowed(classification)) {
    reasonCodes.add(`classification_${classification}_blocked`);
  }

  if (!context.purpose.trim()) reasonCodes.add("purpose_required");
  // Nunca se envía al proveedor material que el clasificador no alcanzó a
  // inspeccionar por completo. Los límites son un gate, no una truncación silenciosa.
  if (projection.truncated) reasonCodes.add("inspection_truncated");

  if (context.agentId) {
    const policy = AI_AGENT_RUNTIME_POLICY[context.agentId];
    if (!policy?.usesExternalProvider) reasonCodes.add("agent_external_provider_not_allowed");
    if (
      classification !== "invalid"
      && !policy?.allowedClassifications.includes(classification)
    ) {
      reasonCodes.add("agent_classification_not_allowed");
    }
  }

  for (const detector of BLOCKING_DETECTORS) {
    detector.pattern.lastIndex = 0;
    if (detector.pattern.test(content)) reasonCodes.add(detector.code);
  }

  return {
    allowed: reasonCodes.size === 0,
    classification,
    reasonCodes: Array.from(reasonCodes).sort(),
    contentSha256: crypto.createHash("sha256").update(content).digest("hex"),
    contentBytes: Buffer.byteLength(content),
    policyVersion: AI_GOVERNANCE_POLICY_VERSION,
  };
}

export class AiGovernanceBlockedError extends Error {
  readonly code = "AI_DATA_GOVERNANCE_BLOCKED";
  readonly reasonCodes: readonly string[];

  constructor(decision: AiGovernanceDecision) {
    super("La política de datos impidió enviar este contenido a un proveedor de IA.");
    this.name = "AiGovernanceBlockedError";
    this.reasonCodes = decision.reasonCodes;
  }
}

export function assertAiDataAllowed(
  context: AiGovernanceContext,
  payload: unknown,
): AiGovernanceDecision {
  const decision = inspectAiData(context, payload);
  if (!decision.allowed) throw new AiGovernanceBlockedError(decision);
  return decision;
}
