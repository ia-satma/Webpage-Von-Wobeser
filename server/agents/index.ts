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

import { orchestrator } from './core/AgentOrchestrator';
import { formatterAgent } from './specialized/FormatterAgent';
import { metadataLinkerAgent } from './specialized/MetadataLinkerAgent';
import { polyglotTranslatorAgent } from './specialized/PolyglotTranslatorAgent';
import { contentAuditorAgent } from './specialized/ContentAuditorAgent';
import { seoOptimizerAgent } from './specialized/SEOOptimizerAgent';
import { imageSuggestionAgent } from './specialized/ImageSuggestionAgent';

export async function initializeAgents(): Promise<void> {
  console.log('[Agents] Initializing agent system...');
  
  await orchestrator.initialize();
  
  orchestrator.registerAgent(formatterAgent);
  orchestrator.registerAgent(metadataLinkerAgent);
  orchestrator.registerAgent(polyglotTranslatorAgent);
  orchestrator.registerAgent(contentAuditorAgent);
  orchestrator.registerAgent(seoOptimizerAgent);
  orchestrator.registerAgent(imageSuggestionAgent);
  
  console.log('[Agents] All agents registered and ready');
}
