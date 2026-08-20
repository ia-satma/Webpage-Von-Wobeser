import {
  AGENT_IDS,
  ALL_AGENT_IDS,
  type AgentId,
} from "@shared/agentConstants";
import type { AiDataClassification } from "@shared/aiGovernance";

export type AiAgentRuntimePolicy = {
  usesExternalProvider: boolean;
  allowedClassifications: readonly AiDataClassification[];
  humanReviewRequired: boolean;
  purpose: string;
};

const EXTERNAL_ALLOWED = ["public", "internal"] as const;
const NO_EXTERNAL_DATA: readonly AiDataClassification[] = [];

/**
 * Política ejecutable para los 14 agentes canónicos. Los agentes deterministas
 * también aparecen para impedir que la documentación vuelva a quedar desfasada.
 */
export const AI_AGENT_RUNTIME_POLICY: Record<AgentId, AiAgentRuntimePolicy> = {
  [AGENT_IDS.CONTENT_ANALYZER]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "editorial_analysis",
  },
  [AGENT_IDS.CATEGORY_AGENT]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "legal_taxonomy",
  },
  [AGENT_IDS.METADATA_LINKER]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "editorial_metadata",
  },
  [AGENT_IDS.LEGAL_ALERTS]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "official_source_draft",
  },
  [AGENT_IDS.FORMATTER]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "editorial_formatting",
  },
  [AGENT_IDS.POLYGLOT_TRANSLATOR]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "legal_translation",
  },
  [AGENT_IDS.SEO_OPTIMIZER]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "seo_draft",
  },
  [AGENT_IDS.IMAGE_SUGGESTION]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "editorial_image",
  },
  [AGENT_IDS.SOCIAL_MEDIA]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "social_draft",
  },
  [AGENT_IDS.NEWSLETTER]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "newsletter_draft",
  },
  [AGENT_IDS.VOICE_AGENT]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "text_to_speech",
  },
  [AGENT_IDS.PRESENTATION_GENERATOR]: {
    usesExternalProvider: true,
    allowedClassifications: EXTERNAL_ALLOWED,
    humanReviewRequired: true,
    purpose: "presentation_draft",
  },
  [AGENT_IDS.CONTENT_AUDITOR]: {
    usesExternalProvider: false,
    allowedClassifications: NO_EXTERNAL_DATA,
    humanReviewRequired: true,
    purpose: "deterministic_content_audit",
  },
  [AGENT_IDS.WEBSITE_AUDITOR]: {
    usesExternalProvider: false,
    allowedClassifications: NO_EXTERNAL_DATA,
    humanReviewRequired: true,
    purpose: "deterministic_website_audit",
  },
};

export function assertCompleteAiAgentPolicy(): void {
  const configured = Object.keys(AI_AGENT_RUNTIME_POLICY).sort();
  const canonical = [...ALL_AGENT_IDS].sort();
  if (configured.length !== canonical.length || configured.some((id, index) => id !== canonical[index])) {
    throw new Error("AI agent runtime policy does not match the canonical inventory");
  }
}

assertCompleteAiAgentPolicy();
