import { BarChart3, BookOpen, Clock, FileText, Languages } from "lucide-react";

export const KNOWLEDGE_CATEGORIES = [
  { value: "legal_glossary", labelKey: "legalGlossary", icon: BookOpen },
  { value: "translation_pattern", labelKey: "translationPattern", icon: Languages },
  { value: "content_template", labelKey: "contentTemplate", icon: FileText },
  { value: "seo_rule", labelKey: "seoRule", icon: BarChart3 },
  { value: "workflow", labelKey: "workflow", icon: Clock },
] as const;

export const AGENT_TYPES = [
  { value: "formatter", labelKey: "articleFormatter" },
  { value: "metadata_linker", labelKey: "metadataLinker" },
  { value: "polyglot_translator", labelKey: "polyglotTranslator" },
  { value: "content_auditor", labelKey: "contentAuditor" },
  { value: "content_analyzer", labelKey: "contentAnalyzer" },
  { value: "seo_optimizer", labelKey: "seoOptimizer" },
  { value: "website_auditor", labelKey: "websiteAuditor" },
  { value: "image_suggestion", labelKey: "imageSuggestion" },
  { value: "category_agent", labelKey: "categoryAgent" },
  // Agentes de difusión / generación (antes faltaban aquí, no se les podía dirigir conocimiento).
  { value: "social_media", labelKey: "socialMedia", label: "Redes sociales" },
  { value: "newsletter", labelKey: "newsletter", label: "Boletín" },
  { value: "legal_alerts", labelKey: "legalAlerts", label: "Alertas legales" },
  { value: "voice_agent", labelKey: "voiceAgent", label: "Voz corporativa" },
  { value: "presentation_generator", labelKey: "presentationGenerator", label: "Presentaciones" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "es", labelKey: "spanish" },
  { value: "en", labelKey: "english" },
  { value: "de", labelKey: "german" },
  { value: "zh", labelKey: "chinese" },
  { value: "ko", labelKey: "korean" },
  { value: "ja", labelKey: "japanese" },
  { value: "fr", labelKey: "french" },
  { value: "it", labelKey: "italian" },
  { value: "pt", labelKey: "portuguese" },
  { value: "ru", labelKey: "russian" },
] as const;
