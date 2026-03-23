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

export async function initializeAgents(): Promise<void> {
  console.log('[Agents] Initializing agent system...');
  
  await orchestrator.initialize();
  
  orchestrator.registerAgent(formatterAgent);
  orchestrator.registerAgent(metadataLinkerAgent);
  orchestrator.registerAgent(polyglotTranslatorAgent);
  orchestrator.registerAgent(contentAuditorAgent);
  orchestrator.registerAgent(seoOptimizerAgent);
  orchestrator.registerAgent(imageSuggestionAgent);
  orchestrator.registerAgent(categoryAgent);
  orchestrator.registerAgent(websiteAuditorAgent);
  orchestrator.registerAgent(contentAnalyzerAgent);
  
  console.log('[Agents] All 9 agents registered and ready');
}
