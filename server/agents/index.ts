export * from './core/types';
export * from './core/BaseAgent';
export { knowledgeStore } from './core/AgentKnowledge';
export { evolutionTracker } from './core/AgentEvolution';
export { orchestrator } from './core/AgentOrchestrator';
export { pcloudStorage } from './storage/PCloudStorage';
export { dbPersistence } from './storage/DatabasePersistence';

export { formatterAgent } from './specialized/FormatterAgent';
export { metadataLinkerAgent } from './specialized/MetadataLinkerAgent';
export { polyglotTranslatorAgent } from './specialized/PolyglotTranslatorAgent';
export { contentAuditorAgent } from './specialized/ContentAuditorAgent';
export { seoOptimizerAgent } from './specialized/SEOOptimizerAgent';
export { imageSuggestionAgent } from './specialized/ImageSuggestionAgent';
export { categoryAgent } from './specialized/CategoryAgent';
export { websiteAuditorAgent } from './specialized/WebsiteAuditorAgent';
export { contentAnalyzerAgent } from './specialized/ContentAnalyzerAgent';
export { socialMediaAgent } from './specialized/SocialMediaAgent';
export { newsletterAgent } from './specialized/NewsletterAgent';
export { legalAlertsAgent } from './specialized/LegalAlertsAgent';
export { voiceAgent } from './specialized/VoiceAgent';
export { presentationGeneratorAgent } from './specialized/PresentationGeneratorAgent';

import { orchestrator } from './core/AgentOrchestrator';
import { formatterAgent } from './specialized/FormatterAgent';
import { metadataLinkerAgent } from './specialized/MetadataLinkerAgent';
import { polyglotTranslatorAgent } from './specialized/PolyglotTranslatorAgent';
import { contentAuditorAgent } from './specialized/ContentAuditorAgent';
import { seoOptimizerAgent } from './specialized/SEOOptimizerAgent';
import { imageSuggestionAgent } from './specialized/ImageSuggestionAgent';
import { categoryAgent } from './specialized/CategoryAgent';
import { websiteAuditorAgent } from './specialized/WebsiteAuditorAgent';
import { contentAnalyzerAgent } from './specialized/ContentAnalyzerAgent';
import { socialMediaAgent } from './specialized/SocialMediaAgent';
import { newsletterAgent } from './specialized/NewsletterAgent';
import { legalAlertsAgent } from './specialized/LegalAlertsAgent';
import { voiceAgent } from './specialized/VoiceAgent';
import { presentationGeneratorAgent } from './specialized/PresentationGeneratorAgent';
import { ALL_AGENT_IDS, type AgentId } from '@shared/agentConstants';

const RUNTIME_AGENTS = [
  formatterAgent,
  metadataLinkerAgent,
  polyglotTranslatorAgent,
  contentAuditorAgent,
  seoOptimizerAgent,
  imageSuggestionAgent,
  categoryAgent,
  websiteAuditorAgent,
  contentAnalyzerAgent,
  socialMediaAgent,
  newsletterAgent,
  legalAlertsAgent,
  voiceAgent,
  presentationGeneratorAgent,
] as const;

let initializationPromise: Promise<void> | null = null;

export async function initializeAgents(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    console.log('[Agents] Initializing agent system...');

    const runtimeIds = RUNTIME_AGENTS.map((agent) => agent.agentType as AgentId);
    const missing = ALL_AGENT_IDS.filter((id) => !runtimeIds.includes(id));
    const unknown = runtimeIds.filter((id) => !ALL_AGENT_IDS.includes(id));
    const duplicates = runtimeIds.filter((id, index) => runtimeIds.indexOf(id) !== index);

    if (missing.length || unknown.length || duplicates.length) {
      throw new Error(
        `[Agents] Runtime inventory mismatch: missing=${missing.join(',') || 'none'} ` +
        `unknown=${unknown.join(',') || 'none'} duplicates=${duplicates.join(',') || 'none'}`,
      );
    }

    for (const agent of RUNTIME_AGENTS) {
      if (!orchestrator.getAgent(agent.agentType)) orchestrator.registerAgent(agent);
    }
    await orchestrator.initialize();

    console.log(`[Agents] All ${RUNTIME_AGENTS.length} canonical runtime agents registered and ready`);
  })();

  try {
    await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}
