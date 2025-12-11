/**
 * SHARED AGENT CONSTANTS - Single Source of Truth
 * 
 * This file defines the canonical agent inventory and categories
 * consumed by both frontend (systemManifest.ts) and backend (SystemChronicler.ts)
 * to prevent drift between sources.
 */

export const AGENT_CATEGORIES = {
  BRAIN: 'brain',
  HANDS: 'hands', 
  SHIELD: 'shield',
} as const;

export type AgentCategory = typeof AGENT_CATEGORIES[keyof typeof AGENT_CATEGORIES];

export const AGENT_IDS = {
  // Brain (6 agents)
  ORCHESTRATOR: 'orchestrator',
  LEGAL_COUNCIL: 'legal_council',
  CONTENT_ANALYZER: 'content_analyzer',
  CATEGORY_AGENT: 'category_agent',
  METADATA_LINKER: 'metadata_linker',
  SYSTEM_CHRONICLER: 'system_chronicler',
  
  // Hands (4 agents)
  POLYGLOT_TRANSLATOR: 'polyglot_translator',
  SMART_IMAGE_GENERATOR: 'smart_image_generator',
  SEO_OPTIMIZER: 'seo_optimizer',
  FORMATTER: 'formatter',
  
  // Shield (4 agents)
  AUTO_RECOVERY: 'auto_recovery',
  SYSTEM_HEALTH: 'system_health',
  CONTENT_AUDITOR: 'content_auditor',
  WEBSITE_AUDITOR: 'website_auditor',
} as const;

export type AgentId = typeof AGENT_IDS[keyof typeof AGENT_IDS];

export const AGENT_CATEGORY_MAP: Record<AgentId, AgentCategory> = {
  // Brain
  [AGENT_IDS.ORCHESTRATOR]: AGENT_CATEGORIES.BRAIN,
  [AGENT_IDS.LEGAL_COUNCIL]: AGENT_CATEGORIES.BRAIN,
  [AGENT_IDS.CONTENT_ANALYZER]: AGENT_CATEGORIES.BRAIN,
  [AGENT_IDS.CATEGORY_AGENT]: AGENT_CATEGORIES.BRAIN,
  [AGENT_IDS.METADATA_LINKER]: AGENT_CATEGORIES.BRAIN,
  [AGENT_IDS.SYSTEM_CHRONICLER]: AGENT_CATEGORIES.BRAIN,
  
  // Hands
  [AGENT_IDS.POLYGLOT_TRANSLATOR]: AGENT_CATEGORIES.HANDS,
  [AGENT_IDS.SMART_IMAGE_GENERATOR]: AGENT_CATEGORIES.HANDS,
  [AGENT_IDS.SEO_OPTIMIZER]: AGENT_CATEGORIES.HANDS,
  [AGENT_IDS.FORMATTER]: AGENT_CATEGORIES.HANDS,
  
  // Shield
  [AGENT_IDS.AUTO_RECOVERY]: AGENT_CATEGORIES.SHIELD,
  [AGENT_IDS.SYSTEM_HEALTH]: AGENT_CATEGORIES.SHIELD,
  [AGENT_IDS.CONTENT_AUDITOR]: AGENT_CATEGORIES.SHIELD,
  [AGENT_IDS.WEBSITE_AUDITOR]: AGENT_CATEGORIES.SHIELD,
};

export const EXPECTED_AGENT_COUNTS = {
  [AGENT_CATEGORIES.BRAIN]: 6,
  [AGENT_CATEGORIES.HANDS]: 4,
  [AGENT_CATEGORIES.SHIELD]: 4,
  TOTAL: 14,
} as const;

export const ALL_AGENT_IDS = Object.values(AGENT_IDS);

// Derived arrays - computed from AGENT_CATEGORY_MAP (not manually maintained)
export const BRAIN_AGENT_IDS = Object.entries(AGENT_CATEGORY_MAP)
  .filter(([_, cat]) => cat === AGENT_CATEGORIES.BRAIN)
  .map(([id]) => id as AgentId);

export const HANDS_AGENT_IDS = Object.entries(AGENT_CATEGORY_MAP)
  .filter(([_, cat]) => cat === AGENT_CATEGORIES.HANDS)
  .map(([id]) => id as AgentId);

export const SHIELD_AGENT_IDS = Object.entries(AGENT_CATEGORY_MAP)
  .filter(([_, cat]) => cat === AGENT_CATEGORIES.SHIELD)
  .map(([id]) => id as AgentId);

export function validateAgentInventory(agents: { id: string; category: string }[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (agents.length !== EXPECTED_AGENT_COUNTS.TOTAL) {
    errors.push(`Expected ${EXPECTED_AGENT_COUNTS.TOTAL} agents, got ${agents.length}`);
  }
  
  const brainCount = agents.filter(a => a.category === AGENT_CATEGORIES.BRAIN).length;
  const handsCount = agents.filter(a => a.category === AGENT_CATEGORIES.HANDS).length;
  const shieldCount = agents.filter(a => a.category === AGENT_CATEGORIES.SHIELD).length;
  
  if (brainCount !== EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.BRAIN]) {
    errors.push(`Brain: expected ${EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.BRAIN]}, got ${brainCount}`);
  }
  if (handsCount !== EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.HANDS]) {
    errors.push(`Hands: expected ${EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.HANDS]}, got ${handsCount}`);
  }
  if (shieldCount !== EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.SHIELD]) {
    errors.push(`Shield: expected ${EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.SHIELD]}, got ${shieldCount}`);
  }
  
  for (const expectedId of ALL_AGENT_IDS) {
    if (!agents.find(a => a.id === expectedId)) {
      errors.push(`Missing agent: ${expectedId}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
