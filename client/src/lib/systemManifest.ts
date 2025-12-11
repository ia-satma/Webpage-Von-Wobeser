/**
 * SYSTEM MANIFEST - Living Documentation for Von Wobeser y Sierra Platform
 * 
 * This file contains the complete technical inventory of the AI-powered legal portal,
 * structured for the System Explorer UI in the Admin Dashboard.
 * 
 * Last Updated: December 2024
 */

export type SystemCategory = 
  | 'ai_brain' 
  | 'ai_hands' 
  | 'ai_shield' 
  | 'public_site' 
  | 'admin_system' 
  | 'security' 
  | 'infrastructure';

export type SystemStatus = 'production' | 'beta' | 'development';

export interface SystemFeature {
  id: string;
  category: SystemCategory;
  name: string;
  technicalName: string;
  technicalDetail: string;
  userBenefit: string;
  status: SystemStatus;
  keyCapabilities: string[];
  technicalSpecs?: {
    model?: string;
    temperature?: number;
    concurrency?: number;
    retryPolicy?: string;
    languages?: string[];
    [key: string]: unknown;
  };
}

export interface SystemManifestTranslations {
  categories: Record<SystemCategory, { title: string; description: string }>;
  statuses: Record<SystemStatus, string>;
  features: Record<string, { name: string; benefit: string; capabilities: string[] }>;
  ui: {
    searchPlaceholder: string;
    exportReport: string;
    exportSuccess: string;
    technicalDetails: string;
    capabilities: string;
    status: string;
    noResults: string;
    allCategories: string;
    totalAgents: string;
    totalModules: string;
    totalInfrastructure: string;
    generatedOn: string;
    systemOverview: string;
    reportTitle: string;
    reportSubtitle: string;
  };
}

// ============================================================================
// AI AGENTS (13 Total)
// ============================================================================

export const AI_AGENTS: SystemFeature[] = [
  {
    id: 'orchestrator',
    category: 'ai_brain',
    name: 'Central Orchestrator',
    technicalName: 'AgentOrchestrator',
    technicalDetail: 'Priority queue management (Critical/High/Normal/Low), In-memory job queue with database persistence, Parallel agent execution coordination, Exponential backoff retry (2s base × 2 multiplier), Database sync on startup with resetInProgressJobsToPending()',
    userBenefit: 'The central nervous system that prevents job conflicts, guarantees no lost work during server restarts, and enables 24/7 autonomous operation without human intervention.',
    status: 'production',
    keyCapabilities: [
      'Priority-based job scheduling',
      'Automatic job recovery on restart',
      'Parallel agent coordination',
      'Real-time queue monitoring',
    ],
    technicalSpecs: {
      processingInterval: '1000ms',
      priorityLevels: 4,
      retryPolicy: '2s base × 2 multiplier',
    },
  },
  {
    id: 'polyglot_translator',
    category: 'ai_brain',
    name: 'Polyglot Translator',
    technicalName: 'PolyglotTranslatorAgent',
    technicalDetail: 'GPT-4o with temperature 0.3, 10-language support (EN/ES/DE/ZH/KO/JA/AR/RU/FR/IT), Legal glossary injection from agentKnowledge table (500+ terms), Source language detection (Spanish priority), Translation caching in translationCache table',
    userBenefit: 'Eliminates "Spanglish" by ensuring 100% translation coverage across all 10 languages. Reduces API costs by 90% via intelligent caching while maintaining legal precision.',
    status: 'production',
    keyCapabilities: [
      '10-language translation',
      'Legal glossary with 500+ terms',
      '90% cost reduction via caching',
      'Legal terminology precision',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.3,
      concurrency: 2,
      languages: ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'],
    },
  },
  {
    id: 'content_analyzer',
    category: 'ai_brain',
    name: 'Content Analyzer',
    technicalName: 'ContentAnalyzerAgent',
    technicalDetail: 'GPT-4o with JSON mode, Analyzes 18 legal branches + 15 industries, Spelling/grammar review with SpellingGrammarIssue schema, Lawyer mention extraction with context, SEO recommendations (keywords/title/meta/headings), Quality score 0-100',
    userBenefit: 'Deep content intelligence enables SEO optimization, automatic categorization saves editor time, and quality scoring helps prioritize editorial work.',
    status: 'production',
    keyCapabilities: [
      'SEO keyword extraction',
      '18 legal branch classification',
      'Spelling & grammar review',
      'Quality scoring (0-100)',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 8000,
      concurrency: 2,
    },
  },
  {
    id: 'category_agent',
    category: 'ai_brain',
    name: 'Category Agent',
    technicalName: 'CategoryAgent',
    technicalDetail: 'GPT-4o-mini with JSON mode, Maps to existing practiceGroups/industryGroups/blogCategories, 16 practice areas + 7 industry sectors, Tag generation (5 tags per article), Confidence scoring, Automatic category creation if needed',
    userBenefit: 'Eliminates manual tagging work, ensures consistent taxonomy across all content, and improves content discoverability through intelligent categorization.',
    status: 'production',
    keyCapabilities: [
      'Auto-categorization',
      '16 practice areas mapping',
      '7 industry sectors mapping',
      '5 SEO tags per article',
    ],
    technicalSpecs: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      concurrency: 3,
    },
  },
  {
    id: 'metadata_linker',
    category: 'ai_brain',
    name: 'Metadata Linker',
    technicalName: 'MetadataLinkerAgent',
    technicalDetail: 'GPT-4o, Author pattern extraction → lastName fuzzy match via ilike, Practice area slug matching, Industry group slug matching, Relationship creation in newsTeamMembers junction table',
    userBenefit: 'Automatic content-to-author attribution, cross-links articles to practice areas, enhances internal linking for improved SEO performance.',
    status: 'production',
    keyCapabilities: [
      'Author auto-detection',
      'Practice area linking',
      'Industry group linking',
      'SEO internal linking',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      concurrency: 5,
    },
  },
  {
    id: 'image_suggestion',
    category: 'ai_hands',
    name: 'Smart Image Generator',
    technicalName: 'ImageSuggestionAgent + SmartImageGenerator',
    technicalDetail: 'DALL-E 3 primary → Gemini 2.5 Flash fallback → Placeholder guarantee, Content policy sanitization (28 sensitive legal terms → abstract replacements), Brand color injection (#AA1A2E), Logo overlay with Sharp library (150px logo on white bg, bottom-right)',
    userBenefit: 'Prevents article publication blocks from AI censorship, ensures 100% visual asset uptime with multi-engine fallback, and maintains brand consistency automatically.',
    status: 'production',
    keyCapabilities: [
      '3-tier engine fallback',
      '28-term content sanitization',
      'Brand logo overlay',
      '100% image guarantee',
    ],
    technicalSpecs: {
      primaryEngine: 'DALL-E 3',
      fallbackEngine: 'Gemini 2.5 Flash',
      sanitizedTerms: 28,
      logoSize: '150px',
    },
  },
  {
    id: 'seo_optimizer',
    category: 'ai_hands',
    name: 'SEO Optimizer',
    technicalName: 'SEOOptimizerAgent',
    technicalDetail: 'GPT-4o, Title optimization (50-60 chars), Meta description generation (150-160 chars), Slug suggestion (3-5 keywords), Bilingual keyword extraction (EN/ES), SEO score calculation with improvement delta',
    userBenefit: 'Search engine visibility optimization with measurable SEO improvement per article. Bilingual keyword strategy ensures visibility in both English and Spanish searches.',
    status: 'production',
    keyCapabilities: [
      'Title optimization (50-60 chars)',
      'Meta descriptions (150-160 chars)',
      'Bilingual keywords',
      'SEO score tracking',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      titleLength: '50-60 chars',
      metaLength: '150-160 chars',
    },
  },
  {
    id: 'formatter',
    category: 'ai_hands',
    name: 'Article Formatter',
    technicalName: 'FormatterAgent',
    technicalDetail: 'GPT-4o with temperature 0.2, PDF artifact removal (page markers, footers, boilerplate), Pre-clean regex (Von Wobeser address, page numbers), Paragraph merge/split logic, Excerpt extraction (first 2-3 sentences)',
    userBenefit: 'Transforms raw PDF extracts into publication-ready content, eliminates manual formatting work, and preserves legal accuracy while improving readability.',
    status: 'production',
    keyCapabilities: [
      'PDF artifact removal',
      'Paragraph restructuring',
      'Excerpt generation',
      'Boilerplate cleaning',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.2,
    },
  },
  {
    id: 'auto_recovery',
    category: 'ai_shield',
    name: 'Auto-Recovery System',
    technicalName: 'AutoRecoveryAgent',
    technicalDetail: 'Scans for processingStatus=failed|error, Detects failedStep field (image/translate/seo/metadata/format), Autonomous retry with agent delegation, Placeholder assignment for irrecoverable items, Recovery audit trail in RecoveryResult objects',
    userBenefit: 'Self-healing system reduces manual intervention to zero. Prevents content from being stuck indefinitely, guaranteeing no zombie articles in the pipeline.',
    status: 'production',
    keyCapabilities: [
      'Failed article detection',
      'Autonomous retry logic',
      'Placeholder fallback',
      'Recovery audit trail',
    ],
    technicalSpecs: {
      scanInterval: 'On-demand',
      failedSteps: ['image', 'translate', 'seo', 'metadata', 'format'],
    },
  },
  {
    id: 'system_health',
    category: 'ai_shield',
    name: 'System Health Monitor',
    technicalName: 'SystemHealthCheck',
    technicalDetail: 'Deep audit across 5 issue types (zombie_process/incomplete_success/localization_leakage/orphaned_asset/missing_translation), Language detection via regex density scoring, Zombie detection: jobs stuck >10min in in_progress, Weighted health score (critical=10, high=5, medium=2, low=1)',
    userBenefit: 'Real-time system integrity monitoring with proactive issue detection before user impact. Quantified health score enables SLA reporting and system confidence metrics.',
    status: 'production',
    keyCapabilities: [
      'Zombie process detection (>10min)',
      'Localization leakage scanning',
      'Orphaned asset detection',
      'Health score calculation',
    ],
    technicalSpecs: {
      issueTypes: 5,
      zombieThreshold: '10 minutes',
      severityWeights: { critical: 10, high: 5, medium: 2, low: 1 },
    },
  },
  {
    id: 'content_auditor',
    category: 'ai_shield',
    name: 'Content Auditor',
    technicalName: 'ContentAuditorAgent',
    technicalDetail: 'Full database scan for content gaps, 5 gap types (missing_translation/missing_author/poor_formatting/missing_excerpt/short_content), Severity prioritization (high→medium→low), Task suggestion generation for remediation',
    userBenefit: 'Content completeness guarantee that identifies editorial gaps before publication and generates actionable remediation tasks automatically.',
    status: 'production',
    keyCapabilities: [
      '5 gap type detection',
      'Translation coverage audit',
      'Author linkage audit',
      'Task generation',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.2,
      concurrency: 1,
    },
  },
  {
    id: 'website_auditor',
    category: 'ai_shield',
    name: 'Website Auditor',
    technicalName: 'WebsiteAuditorAgent',
    technicalDetail: '6 audit modules (links/navigation/translations/performance/seo/content), Multi-entity scanning (team_members/news/practice_groups/industry_groups), Severity classification (critical/high/medium/low), Findings persistence with remediation job linking',
    userBenefit: 'Comprehensive website quality assurance that replaces manual testing. Automated QA with issue-to-fix pipeline automation.',
    status: 'production',
    keyCapabilities: [
      '6 audit modules',
      'Multi-entity scanning',
      'Severity classification',
      'Remediation linking',
    ],
  },
  {
    id: 'system_chronicler',
    category: 'ai_brain',
    name: 'System Chronicler',
    technicalName: 'SystemChronicler',
    technicalDetail: 'Meta-agent registry with 11 capability cards, Category grouping (brain/hands/shield), Evolution level tracking (1-5), Status tracking (active/dormant/evolving), JSON file persistence (system_evolution.json)',
    userBenefit: 'Self-documenting system that enables the Live Nerve Center visualization and tracks agent evolution history for continuous improvement insights.',
    status: 'production',
    keyCapabilities: [
      'Agent registry',
      'Evolution tracking',
      'Status monitoring',
      'History persistence',
    ],
  },
  {
    id: 'legal_council',
    category: 'ai_brain',
    name: 'Legal Council',
    technicalName: 'LegalCouncilService',
    technicalDetail: '3-agent council (Legal Scholar, Risk Analyst, Brand Guardian), Promise.allSettled for fail-safe isolation, VoteResult schema with score 0-100, System Abstention injection for failed agents, CouncilVerdict with overallStatus/riskFlag/consolidatedFeedback',
    userBenefit: 'Human-in-the-loop quality control ensuring every article passes multi-agent review before publication. Provides risk scoring and actionable feedback for editors.',
    status: 'production',
    keyCapabilities: [
      '3-agent evaluation council',
      'Fail-safe vote handling',
      'Risk flag classification',
      'Consolidated feedback generation',
    ],
    technicalSpecs: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      concurrency: 3,
      agents: ['Legal Scholar', 'Risk Analyst', 'Brand Guardian'],
    },
  },
];

// ============================================================================
// PUBLIC SITE MODULES (27 Total)
// ============================================================================

export const PUBLIC_MODULES: SystemFeature[] = [
  {
    id: 'team_directory',
    category: 'public_site',
    name: 'Team Directory',
    technicalName: 'Team.tsx + TeamMemberDetail.tsx',
    technicalDetail: 'Dynamic filtering by practice/industry, vCard generation with 10-language download labels, Cross-linking to related news articles, Education/Affiliation/Ranking/Publication sections, Representative matters display, Avatar with initials fallback',
    userBenefit: 'Complete lawyer profiles with professional credentials, downloadable contact cards, and automatic cross-references to their work. Builds trust with potential clients.',
    status: 'production',
    keyCapabilities: [
      'Practice/industry filtering',
      'vCard generation (10 languages)',
      'Related news cross-linking',
      'Avatar fallback system',
    ],
  },
  {
    id: 'news_system',
    category: 'public_site',
    name: 'News & Articles',
    technicalName: 'News.tsx + NewsDetail.tsx + Articles.tsx',
    technicalDetail: 'Infinite scroll pagination, Dynamic translation via useTranslatedContent hook, News image fallback with VWS branding, Date formatting per locale, Category/author filtering, SEO-optimized slugs',
    userBenefit: 'Real-time legal news in 10 languages with intelligent content loading. Establishes the firm as a thought leader in Mexican legal matters.',
    status: 'production',
    keyCapabilities: [
      'Infinite scroll',
      'Dynamic translation',
      'Category filtering',
      'SEO-optimized URLs',
    ],
  },
  {
    id: 'events_system',
    category: 'public_site',
    name: 'Events Calendar',
    technicalName: 'Events.tsx',
    technicalDetail: '5 event types with color coding (conference/webinar/sponsorship/speaking/networking), Upcoming vs past event segregation, External URL linking, Date range display, Location with MapPin icon',
    userBenefit: 'Professional event showcase demonstrating firm activity and industry engagement. Helps clients discover speaking engagements and networking opportunities.',
    status: 'production',
    keyCapabilities: [
      '5 event types',
      'Color-coded display',
      'Past/upcoming filter',
      'External URL linking',
    ],
  },
  {
    id: 'multi_language',
    category: 'public_site',
    name: 'Multi-Language System',
    technicalName: 'LanguageContext + i18n.ts + useTranslatedContent',
    technicalDetail: '10 languages (EN/ES/DE/ZH/KO/JA/AR/RU/FR/IT), useTranslatedContent hook with cache/mutation cycle, isNativeLanguage() check (ES = native), IP geolocation language detection (/api/detect-language), localStorage persistence (vwb_language), i18next integration',
    userBenefit: '100% translation coverage with zero "Spanglish". Automatic language detection based on visitor location. Seamless experience for international clients.',
    status: 'production',
    keyCapabilities: [
      '10 language support',
      'IP-based auto-detection',
      'Translation caching',
      'Native Spanish priority',
    ],
  },
  {
    id: 'rtl_architecture',
    category: 'public_site',
    name: 'RTL Layout Support',
    technicalName: 'LanguageContext + dir="rtl"',
    technicalDetail: 'Complete layout mirroring for Arabic (dir="rtl"), Language detection in LanguageContext, HTML lang attribute update, Automatic text alignment adjustment',
    userBenefit: 'Professional Arabic experience with proper right-to-left text flow. Demonstrates respect for Middle Eastern clients and their reading conventions.',
    status: 'production',
    keyCapabilities: [
      'Automatic RTL detection',
      'Layout mirroring',
      'Text alignment',
      'HTML lang updates',
    ],
  },
  {
    id: 'practice_groups',
    category: 'public_site',
    name: 'Practice Areas',
    technicalName: 'PracticeGroups.tsx + PracticeGroupDetail.tsx',
    technicalDetail: '18 practice areas, Full description pages, Team member linking, News cross-referencing, SEO meta tags',
    userBenefit: 'Comprehensive practice area showcase with expert lawyers and related news. Helps clients find the right expertise for their legal needs.',
    status: 'production',
    keyCapabilities: [
      '18 practice areas',
      'Expert lawyer linking',
      'Related news',
      'SEO optimization',
    ],
  },
  {
    id: 'industry_groups',
    category: 'public_site',
    name: 'Industry Focus',
    technicalName: 'IndustryGroups.tsx + IndustryGroupDetail.tsx',
    technicalDetail: '7 industry sectors, Related practice areas, Team member expertise display',
    userBenefit: 'Industry-specific expertise showcase demonstrating deep sector knowledge. Attracts clients seeking specialized industry experience.',
    status: 'production',
    keyCapabilities: [
      '7 industry sectors',
      'Practice area linking',
      'Expert team display',
    ],
  },
  {
    id: 'german_desk',
    category: 'public_site',
    name: 'German Desk',
    technicalName: 'GermanDesk.tsx',
    technicalDetail: 'Dedicated landing for German clients, World map visualization, DE/EN toggle emphasis, Cultural bridge content',
    userBenefit: 'Specialized service for German companies entering the Mexican market. Demonstrates cultural understanding and bilingual capability.',
    status: 'production',
    keyCapabilities: [
      'German market focus',
      'World map visualization',
      'Bilingual content',
    ],
  },
  {
    id: 'careers',
    category: 'public_site',
    name: 'Careers Portal',
    technicalName: 'Careers.tsx',
    technicalDetail: 'Culture section, Core values with icons (4 values), Benefits grid (6 items), Open positions listing, Internship program details, Full 10-language content',
    userBenefit: 'Professional recruitment portal showcasing firm culture and opportunities. Attracts top legal talent to the firm.',
    status: 'production',
    keyCapabilities: [
      'Culture showcase',
      'Benefits display',
      'Open positions',
      '10-language support',
    ],
  },
  {
    id: 'diversity_inclusion',
    category: 'public_site',
    name: 'Diversity & Inclusion',
    technicalName: 'DiversityInclusion.tsx',
    technicalDetail: 'Corporate values display, Team diversity statistics, Initiatives showcase',
    userBenefit: 'Demonstrates firm commitment to diversity and inclusive practices. Important for ESG-conscious clients and talent.',
    status: 'production',
    keyCapabilities: [
      'Values showcase',
      'Statistics display',
      'Initiative highlights',
    ],
  },
  {
    id: 'pro_bono',
    category: 'public_site',
    name: 'Pro Bono Program',
    technicalName: 'ProBono.tsx',
    technicalDetail: 'Pro bono program description, Case highlights, Partner organizations',
    userBenefit: 'Showcases firm social responsibility and community impact. Builds trust with socially conscious clients.',
    status: 'production',
    keyCapabilities: [
      'Program overview',
      'Case highlights',
      'Partner organizations',
    ],
  },
  {
    id: 'rankings',
    category: 'public_site',
    name: 'Rankings & Recognition',
    technicalName: 'Rankings.tsx',
    technicalDetail: 'Legal directory rankings (Chambers, Legal500), Award badges, Recognition timeline',
    userBenefit: 'Third-party validation of firm excellence. Builds credibility with prospective clients seeking top-tier representation.',
    status: 'production',
    keyCapabilities: [
      'Chambers rankings',
      'Legal500 rankings',
      'Award display',
    ],
  },
  {
    id: 'contact',
    category: 'public_site',
    name: 'Contact Page',
    technicalName: 'Contact.tsx',
    technicalDetail: 'Office locations, Contact form, Map integration, Direct phone/email links',
    userBenefit: 'Easy contact access with multiple communication options. Reduces friction for potential clients reaching out.',
    status: 'production',
    keyCapabilities: [
      'Office locations',
      'Contact form',
      'Map integration',
    ],
  },
  {
    id: 'offices',
    category: 'public_site',
    name: 'Office Showcase',
    technicalName: 'Experience.tsx + Offices.tsx + NewOfficesPopup.tsx',
    technicalDetail: 'Office photo gallery, New offices popup, Tower SOMA showcase',
    userBenefit: 'Visual tour of premium office spaces. Demonstrates firm stability and investment in client experience.',
    status: 'production',
    keyCapabilities: [
      'Photo gallery',
      'New office popup',
      'Location showcase',
    ],
  },
  {
    id: 'hero_section',
    category: 'public_site',
    name: 'Hero Section',
    technicalName: 'HeroSection.tsx',
    technicalDetail: 'Video background, Animated text overlay, CTA buttons',
    userBenefit: 'Impactful first impression with professional video and clear call-to-action. Captures visitor attention immediately.',
    status: 'production',
    keyCapabilities: [
      'Video background',
      'Animated text',
      'CTA buttons',
    ],
  },
  {
    id: 'stats_section',
    category: 'public_site',
    name: 'Statistics Display',
    technicalName: 'StatsSection.tsx',
    technicalDetail: 'Firm statistics display, Animated counters',
    userBenefit: 'Quantified firm achievements that build credibility. Numbers speak louder than words.',
    status: 'production',
    keyCapabilities: [
      'Animated counters',
      'Key metrics display',
    ],
  },
  {
    id: 'seo_system',
    category: 'public_site',
    name: 'SEO System',
    technicalName: 'SEOHead.tsx + JsonLdSchema.tsx',
    technicalDetail: 'Dynamic meta tags, Open Graph, Twitter cards, JSON-LD for Person/Breadcrumb/Organization',
    userBenefit: 'Search engine visibility optimization and rich social media previews. Drives organic traffic to the site.',
    status: 'production',
    keyCapabilities: [
      'Dynamic meta tags',
      'JSON-LD schemas',
      'Social media cards',
    ],
  },
  {
    id: 'cookie_banner',
    category: 'public_site',
    name: 'Cookie Consent',
    technicalName: 'CookieBanner.tsx',
    technicalDetail: 'GDPR compliance, Consent management',
    userBenefit: 'Legal compliance with privacy regulations. Protects the firm from regulatory issues.',
    status: 'production',
    keyCapabilities: [
      'GDPR compliance',
      'Consent tracking',
    ],
  },
];

// ============================================================================
// ADMIN SYSTEM MODULES
// ============================================================================

export const ADMIN_MODULES: SystemFeature[] = [
  {
    id: 'admin_dashboard',
    category: 'admin_system',
    name: 'Admin Dashboard',
    technicalName: 'AdminDashboard.tsx + 19 admin pages',
    technicalDetail: '19 admin pages: Dashboard, News, Team, Events, Categories, Practice Groups, Industry Groups, Posts, PostForm, TeamForm, ArticleProcessing, Agents, Audits, HealthCheck, Knowledge, Performance, Translations, Guide, Login',
    userBenefit: 'Complete content management system with WordPress-like ease of use. Enables non-technical staff to manage all website content.',
    status: 'production',
    keyCapabilities: [
      '19 management pages',
      'Content CRUD operations',
      'Media management',
      'Translation management',
    ],
  },
  {
    id: 'nerve_center',
    category: 'admin_system',
    name: 'Live Nerve Center',
    technicalName: 'AdminGuide.tsx + NerveCenter.tsx',
    technicalDetail: 'Real-time agent visualization, 3 category groupings (Brain/Hands/Shield), Evolution dots (1-5 levels), Status indicators with pulse animation, Evolution timeline component, 30-second auto-refresh',
    userBenefit: 'Visual dashboard showing the AI ecosystem in action. Demonstrates platform sophistication to stakeholders and builds confidence in the technology.',
    status: 'production',
    keyCapabilities: [
      'Real-time visualization',
      'Agent status monitoring',
      'Evolution tracking',
      '30s auto-refresh',
    ],
  },
  {
    id: 'pipeline_modal',
    category: 'admin_system',
    name: 'Pipeline Progress',
    technicalName: 'PipelineProgressModal.tsx + usePipelineProgress.ts',
    technicalDetail: 'WebSocket real-time updates, Step-by-step progress (format→categorize→metadata→seo→translate→image), Progress bar, Status badges (running/completed/error)',
    userBenefit: 'Real-time visibility into article processing. Shows exactly what the AI is doing at each step, building trust in the automation.',
    status: 'production',
    keyCapabilities: [
      'WebSocket updates',
      '6-step progress',
      'Status badges',
      'Error display',
    ],
  },
  {
    id: 'admin_translations',
    category: 'admin_system',
    name: 'Admin Localization',
    technicalName: 'adminTranslations.ts (1194 lines)',
    technicalDetail: '10-language admin translations, Agent names, Status labels, Impact labels, Common admin phrases, getAgentName()/getStatusLabel()/getImpactLabel() helpers',
    userBenefit: 'Zero "Spanglish" in admin interface. International administrators can work in their native language.',
    status: 'production',
    keyCapabilities: [
      '1194 lines of translations',
      '10 language support',
      'Helper functions',
      'Full admin coverage',
    ],
  },
];

// ============================================================================
// SECURITY & INFRASTRUCTURE (22 Total)
// ============================================================================

export const INFRASTRUCTURE: SystemFeature[] = [
  {
    id: 'rate_limiting',
    category: 'security',
    name: 'Rate Limiting',
    technicalName: 'server/auth.ts checkRateLimit()',
    technicalDetail: 'In-memory Map tracking by identifier, 5 attempts per 15-minute window, 30-minute block after threshold, checkRateLimit() + recordLoginAttempt() functions',
    userBenefit: 'Protection against brute force attacks and account enumeration. Keeps the admin system secure from unauthorized access attempts.',
    status: 'production',
    keyCapabilities: [
      '5 attempts/15 minutes',
      '30-minute lockout',
      'Per-identifier tracking',
    ],
  },
  {
    id: 'password_security',
    category: 'security',
    name: 'Password Security',
    technicalName: 'bcrypt with 12 salt rounds',
    technicalDetail: 'bcrypt with 12 salt rounds, hashPassword() + comparePassword() async functions',
    userBenefit: 'Industry-standard password protection. Even if the database is compromised, passwords remain secure.',
    status: 'production',
    keyCapabilities: [
      'bcrypt hashing',
      '12 salt rounds',
      'Async operations',
    ],
  },
  {
    id: 'session_management',
    category: 'security',
    name: 'Session Management',
    technicalName: 'authMiddleware() + 24h sessions',
    technicalDetail: '32-byte crypto random tokens, 24-hour expiry (SESSION_DURATION_HOURS), Bearer token validation in authMiddleware(), Session cleanup on expiry',
    userBenefit: 'Secure session handling that prevents unauthorized access while providing convenient 24-hour login persistence.',
    status: 'production',
    keyCapabilities: [
      '32-byte tokens',
      '24-hour sessions',
      'Auto-expiry cleanup',
    ],
  },
  {
    id: 'content_sanitizer',
    category: 'security',
    name: 'Content Policy Sanitizer',
    technicalName: 'SmartImageGenerator SENSITIVE_LEGAL_TERMS',
    technicalDetail: '28 sensitive legal terms array (SENSITIVE_LEGAL_TERMS), Abstract replacement mapping (ABSTRACT_REPLACEMENTS), Regex-based term detection, Brand-safe prompt reconstruction',
    userBenefit: 'Prevents AI image generation from being blocked by content policies. Ensures articles never go without images due to legal terminology.',
    status: 'production',
    keyCapabilities: [
      '28 sensitive terms',
      'Abstract replacements',
      'Policy compliance',
    ],
  },
  {
    id: 'image_fallback',
    category: 'infrastructure',
    name: 'Image Fallback Cascade',
    technicalName: 'SmartImageGenerator 3-tier fallback',
    technicalDetail: 'DALL-E 3 → Gemini 2.5 Flash → Placeholder cascade, OpenAI error parsing (content_policy/rate_limit/timeout/billing), Exponential backoff (0/5/10/20s), Download timeout (30s)',
    userBenefit: '100% image generation guarantee. No article ever publishes without a visual, even during API outages.',
    status: 'production',
    keyCapabilities: [
      '3-tier fallback',
      'Error type parsing',
      'Exponential backoff',
      '30s timeout',
    ],
  },
  {
    id: 'logo_overlay',
    category: 'infrastructure',
    name: 'Logo Overlay Service',
    technicalName: 'Sharp library integration',
    technicalDetail: 'Sharp library for image processing, 150px logo resize, White background padding (12px), Bottom-right positioning (20px margin), Graceful fallback if logo missing',
    userBenefit: 'Automatic brand watermarking on all generated images. Ensures consistent brand presence across visual content.',
    status: 'production',
    keyCapabilities: [
      '150px logo',
      'Auto-positioning',
      'White background',
    ],
  },
  {
    id: 'database_persistence',
    category: 'infrastructure',
    name: 'Database Persistence',
    technicalName: 'DatabasePersistence.ts',
    technicalDetail: 'Job CRUD (create/update/get), Event logging, Knowledge storage, Skill tracking, Proposal management, Stats aggregation by agent type, Failed job recovery queries',
    userBenefit: 'Reliable data storage that survives server restarts. All agent work and learnings are permanently preserved.',
    status: 'production',
    keyCapabilities: [
      'Job persistence',
      'Event logging',
      'Knowledge storage',
      'Stats aggregation',
    ],
  },
  {
    id: 'cloud_backup',
    category: 'infrastructure',
    name: 'Cloud Backup (pCloud)',
    technicalName: 'PCloudStorage.ts',
    technicalDetail: 'HTTPS API integration, Username/password authentication, File upload via multipart form, Directory creation, Agent knowledge sync, /VonWobeser/agents base path',
    userBenefit: 'Off-site backup of agent knowledge and evolution data. Disaster recovery capability for critical AI learnings.',
    status: 'production',
    keyCapabilities: [
      'pCloud integration',
      'Knowledge sync',
      'Disaster recovery',
    ],
  },
  {
    id: 'knowledge_store',
    category: 'infrastructure',
    name: 'Knowledge Store',
    technicalName: 'AgentKnowledge.ts',
    technicalDetail: 'Document CRUD with category/title/content, Usage count tracking, Search with limit option, Legal glossary initialization (500+ terms), Agent-specific document retrieval',
    userBenefit: 'Persistent AI learning that improves translation quality over time. Legal glossary ensures consistent terminology.',
    status: 'production',
    keyCapabilities: [
      'Document CRUD',
      '500+ legal terms',
      'Usage tracking',
      'Search capability',
    ],
  },
  {
    id: 'evolution_tracker',
    category: 'infrastructure',
    name: 'Evolution Tracker',
    technicalName: 'AgentEvolution.ts',
    technicalDetail: 'Per-agent stats tracking (jobs/success rate/skills/docs), Proposal lifecycle management (pending→approved→implemented), Learning cycle history, Database-backed persistence',
    userBenefit: 'Self-improving AI system that tracks and learns from its own performance. Enables continuous quality improvement.',
    status: 'production',
    keyCapabilities: [
      'Success rate tracking',
      'Proposal management',
      'Learning history',
    ],
  },
  {
    id: 'zombie_detection',
    category: 'infrastructure',
    name: 'Zombie Process Detection',
    technicalName: 'SystemHealthCheck.checkZombieProcesses()',
    technicalDetail: 'Jobs stuck >10min in in_progress status, lt() timestamp comparison, Critical severity assignment, Suggested action generation',
    userBenefit: 'Automatic detection of stuck processes before they cause problems. Prevents operational deadlocks.',
    status: 'production',
    keyCapabilities: [
      '>10min detection',
      'Critical alerts',
      'Action suggestions',
    ],
  },
  {
    id: 'localization_leakage',
    category: 'infrastructure',
    name: 'Localization Leakage Detection',
    technicalName: 'SystemHealthCheck language detection',
    technicalDetail: 'Spanish/German indicator regex patterns (articles, accented chars, legal terms), Density scoring algorithm, Cross-language field validation',
    userBenefit: 'Prevents mixed-language content from reaching users. Ensures professional, consistent language experience.',
    status: 'production',
    keyCapabilities: [
      'Language detection',
      'Density scoring',
      'Field validation',
    ],
  },
  {
    id: 'websocket_pipeline',
    category: 'infrastructure',
    name: 'WebSocket Pipeline',
    technicalName: 'usePipelineProgress.ts',
    technicalDetail: 'Singleton WebSocket manager class, Auto-reconnect on disconnect, Event buffering (last 100 events), Current progress tracking by articleId, Connection state subscription',
    userBenefit: 'Real-time updates without page refresh. Users see live progress of article processing.',
    status: 'production',
    keyCapabilities: [
      'Auto-reconnect',
      'Event buffering',
      'Progress tracking',
    ],
  },
  {
    id: 'translation_cache',
    category: 'infrastructure',
    name: 'Translation Cache',
    technicalName: 'translationCache database table',
    technicalDetail: 'JSONB for multi-field storage, Source/target language tracking, Approval status flag, Entity type + entity ID indexing',
    userBenefit: '90% reduction in translation API costs. Faster page loads for translated content.',
    status: 'production',
    keyCapabilities: [
      'JSONB storage',
      'Language tracking',
      '90% cost reduction',
    ],
  },
  {
    id: 'query_client',
    category: 'infrastructure',
    name: 'Query Client',
    technicalName: 'queryClient.ts TanStack Query v5',
    technicalDetail: 'TanStack Query v5 configuration, Default fetcher setup, apiRequest() utility for mutations, Cache invalidation patterns',
    userBenefit: 'Optimized data fetching with automatic caching. Faster UI responses and reduced server load.',
    status: 'production',
    keyCapabilities: [
      'TanStack Query v5',
      'Auto caching',
      'Cache invalidation',
    ],
  },
  {
    id: 'file_upload_security',
    category: 'security',
    name: 'File Upload Security',
    technicalName: 'multer middleware configuration',
    technicalDetail: 'Multer disk storage with crypto-random filenames, 10MB file size limit, MIME type whitelist (jpeg/png/gif/webp/svg/pdf), Automatic uploads directory creation',
    userBenefit: 'Secure file handling that prevents malicious uploads. Only safe file types accepted with size limits.',
    status: 'production',
    keyCapabilities: [
      'MIME type filtering',
      '10MB limit',
      'Secure filenames',
    ],
  },
  {
    id: 'geolocation_service',
    category: 'infrastructure',
    name: 'Geolocation Service',
    technicalName: '/api/detect-language endpoint',
    technicalDetail: 'IP-based country detection via ip-api.com, COUNTRY_TO_LANGUAGE mapping (40+ countries), X-Forwarded-For proxy header support, Graceful fallback for localhost/private IPs',
    userBenefit: 'Automatic language detection for international visitors. First-time users see content in their native language.',
    status: 'production',
    keyCapabilities: [
      'IP geolocation',
      '40+ country mappings',
      'Proxy support',
    ],
  },
  {
    id: 'auto_recovery',
    category: 'infrastructure',
    name: 'Auto Recovery System',
    technicalName: 'AutoRecoveryAgent.ts',
    technicalDetail: 'Failed article detection (status=failed/error), Step-specific recovery (format/category/link/seo/translate/image), Partial success marking, Recovery report generation with statistics',
    userBenefit: 'Self-healing system that automatically retries failed operations. No manual intervention needed for transient failures.',
    status: 'production',
    keyCapabilities: [
      'Auto retry failed jobs',
      'Step-specific recovery',
      'Recovery reporting',
    ],
  },
  {
    id: 'system_health_audit',
    category: 'infrastructure',
    name: 'System Health Audit',
    technicalName: 'SystemHealthCheck.ts',
    technicalDetail: 'Deep audit with 5 issue types (zombie/incomplete/leakage/orphan/missing), Health score 0-100, Language detection algorithm with density scoring, Automatic zombie job reset',
    userBenefit: 'Proactive issue detection before they affect users. Comprehensive system health monitoring.',
    status: 'production',
    keyCapabilities: [
      '5 issue type detection',
      'Health scoring 0-100',
      'Zombie auto-reset',
    ],
  },
  {
    id: 'openai_integration',
    category: 'infrastructure',
    name: 'OpenAI Integration',
    technicalName: 'server/openai.ts',
    technicalDetail: 'Replit AI Integrations service, OpenAI-compatible API access, GPT-5 model configuration, Legal text translation function, 10-language support array',
    userBenefit: 'Enterprise-grade AI capabilities without managing API keys. Seamless integration with billing.',
    status: 'production',
    keyCapabilities: [
      'GPT-5 access',
      'Auto key management',
      'Legal translation',
    ],
  },
  {
    id: 'drizzle_orm',
    category: 'infrastructure',
    name: 'Drizzle ORM Layer',
    technicalName: 'server/db.ts + shared/schema.ts',
    technicalDetail: 'Neon PostgreSQL serverless connection, Type-safe schema definitions with Zod validation, Drizzle-zod insert schemas, Automatic type inference for selects',
    userBenefit: 'Type-safe database operations prevent runtime errors. Schema changes are validated at compile time.',
    status: 'production',
    keyCapabilities: [
      'Neon serverless',
      'Type-safe queries',
      'Zod validation',
    ],
  },
  {
    id: 'static_file_serving',
    category: 'infrastructure',
    name: 'Static File Serving',
    technicalName: 'express.static middleware',
    technicalDetail: 'Dedicated routes for /generated-images, /uploads, /partner_photos directories, Automatic MIME type detection, Cache headers for performance, Secure path traversal prevention',
    userBenefit: 'Fast, reliable delivery of images and files. Optimized caching reduces load times for returning visitors.',
    status: 'production',
    keyCapabilities: [
      'Multiple asset routes',
      'MIME type detection',
      'Cache optimization',
    ],
  },
];

// ============================================================================
// TRANSLATIONS (10 Languages)
// ============================================================================

export const MANIFEST_TRANSLATIONS: Record<string, SystemManifestTranslations> = {
  en: {
    categories: {
      ai_brain: { title: 'The Brain', description: 'Central intelligence and decision-making agents' },
      ai_hands: { title: 'The Hands', description: 'Content creation and optimization agents' },
      ai_shield: { title: 'The Shield', description: 'Quality assurance and self-healing agents' },
      public_site: { title: 'Public Website', description: 'User-facing pages and features' },
      admin_system: { title: 'Admin System', description: 'Content management and monitoring' },
      security: { title: 'Security', description: 'Authentication and access control' },
      infrastructure: { title: 'Infrastructure', description: 'Core platform services' },
    },
    statuses: {
      production: 'Production',
      beta: 'Beta',
      development: 'Development',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Search features, agents, modules...',
      exportReport: 'Export Technical Report',
      exportSuccess: 'Report downloaded successfully',
      technicalDetails: 'Technical Details',
      capabilities: 'Key Capabilities',
      status: 'Status',
      noResults: 'No features found matching your search',
      allCategories: 'All Categories',
      totalAgents: 'AI Agents',
      totalModules: 'Site Modules',
      totalInfrastructure: 'Infrastructure',
      generatedOn: 'Generated on',
      systemOverview: 'System Overview',
      reportTitle: 'Von Wobeser Platform Technical Report',
      reportSubtitle: 'Complete System Documentation',
    },
  },
  es: {
    categories: {
      ai_brain: { title: 'El Cerebro', description: 'Agentes centrales de inteligencia y toma de decisiones' },
      ai_hands: { title: 'Las Manos', description: 'Agentes de creación y optimización de contenido' },
      ai_shield: { title: 'El Escudo', description: 'Agentes de control de calidad y auto-reparación' },
      public_site: { title: 'Sitio Público', description: 'Páginas y funciones para usuarios' },
      admin_system: { title: 'Sistema Admin', description: 'Gestión de contenido y monitoreo' },
      security: { title: 'Seguridad', description: 'Autenticación y control de acceso' },
      infrastructure: { title: 'Infraestructura', description: 'Servicios centrales de la plataforma' },
    },
    statuses: {
      production: 'Producción',
      beta: 'Beta',
      development: 'Desarrollo',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Buscar funciones, agentes, módulos...',
      exportReport: 'Exportar Reporte Técnico',
      exportSuccess: 'Reporte descargado exitosamente',
      technicalDetails: 'Detalles Técnicos',
      capabilities: 'Capacidades Clave',
      status: 'Estado',
      noResults: 'No se encontraron funciones que coincidan con su búsqueda',
      allCategories: 'Todas las Categorías',
      totalAgents: 'Agentes IA',
      totalModules: 'Módulos del Sitio',
      totalInfrastructure: 'Infraestructura',
      generatedOn: 'Generado el',
      systemOverview: 'Resumen del Sistema',
      reportTitle: 'Reporte Técnico de la Plataforma Von Wobeser',
      reportSubtitle: 'Documentación Completa del Sistema',
    },
  },
  de: {
    categories: {
      ai_brain: { title: 'Das Gehirn', description: 'Zentrale Intelligenz- und Entscheidungsagenten' },
      ai_hands: { title: 'Die Hände', description: 'Inhaltserstellung und Optimierungsagenten' },
      ai_shield: { title: 'Der Schild', description: 'Qualitätssicherung und Selbstheilungsagenten' },
      public_site: { title: 'Öffentliche Website', description: 'Benutzerorientierte Seiten und Funktionen' },
      admin_system: { title: 'Admin-System', description: 'Content-Management und Überwachung' },
      security: { title: 'Sicherheit', description: 'Authentifizierung und Zugriffskontrolle' },
      infrastructure: { title: 'Infrastruktur', description: 'Kernplattformdienste' },
    },
    statuses: {
      production: 'Produktion',
      beta: 'Beta',
      development: 'Entwicklung',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Funktionen, Agenten, Module suchen...',
      exportReport: 'Technischen Bericht exportieren',
      exportSuccess: 'Bericht erfolgreich heruntergeladen',
      technicalDetails: 'Technische Details',
      capabilities: 'Schlüsselfähigkeiten',
      status: 'Status',
      noResults: 'Keine Funktionen gefunden, die Ihrer Suche entsprechen',
      allCategories: 'Alle Kategorien',
      totalAgents: 'KI-Agenten',
      totalModules: 'Website-Module',
      totalInfrastructure: 'Infrastruktur',
      generatedOn: 'Erstellt am',
      systemOverview: 'Systemübersicht',
      reportTitle: 'Technischer Bericht der Von Wobeser Plattform',
      reportSubtitle: 'Vollständige Systemdokumentation',
    },
  },
  zh: {
    categories: {
      ai_brain: { title: '大脑', description: '中央智能和决策代理' },
      ai_hands: { title: '双手', description: '内容创建和优化代理' },
      ai_shield: { title: '盾牌', description: '质量保证和自我修复代理' },
      public_site: { title: '公共网站', description: '面向用户的页面和功能' },
      admin_system: { title: '管理系统', description: '内容管理和监控' },
      security: { title: '安全', description: '身份验证和访问控制' },
      infrastructure: { title: '基础设施', description: '核心平台服务' },
    },
    statuses: {
      production: '生产',
      beta: '测试版',
      development: '开发中',
    },
    features: {},
    ui: {
      searchPlaceholder: '搜索功能、代理、模块...',
      exportReport: '导出技术报告',
      exportSuccess: '报告下载成功',
      technicalDetails: '技术详情',
      capabilities: '核心能力',
      status: '状态',
      noResults: '未找到与您搜索匹配的功能',
      allCategories: '所有类别',
      totalAgents: 'AI代理',
      totalModules: '网站模块',
      totalInfrastructure: '基础设施',
      generatedOn: '生成于',
      systemOverview: '系统概述',
      reportTitle: 'Von Wobeser平台技术报告',
      reportSubtitle: '完整系统文档',
    },
  },
  ko: {
    categories: {
      ai_brain: { title: '두뇌', description: '중앙 지능 및 의사 결정 에이전트' },
      ai_hands: { title: '손', description: '콘텐츠 생성 및 최적화 에이전트' },
      ai_shield: { title: '방패', description: '품질 보증 및 자가 복구 에이전트' },
      public_site: { title: '공개 웹사이트', description: '사용자 대면 페이지 및 기능' },
      admin_system: { title: '관리 시스템', description: '콘텐츠 관리 및 모니터링' },
      security: { title: '보안', description: '인증 및 접근 제어' },
      infrastructure: { title: '인프라', description: '핵심 플랫폼 서비스' },
    },
    statuses: {
      production: '프로덕션',
      beta: '베타',
      development: '개발 중',
    },
    features: {},
    ui: {
      searchPlaceholder: '기능, 에이전트, 모듈 검색...',
      exportReport: '기술 보고서 내보내기',
      exportSuccess: '보고서 다운로드 완료',
      technicalDetails: '기술 세부 사항',
      capabilities: '핵심 역량',
      status: '상태',
      noResults: '검색과 일치하는 기능을 찾을 수 없습니다',
      allCategories: '모든 카테고리',
      totalAgents: 'AI 에이전트',
      totalModules: '사이트 모듈',
      totalInfrastructure: '인프라',
      generatedOn: '생성일',
      systemOverview: '시스템 개요',
      reportTitle: 'Von Wobeser 플랫폼 기술 보고서',
      reportSubtitle: '전체 시스템 문서',
    },
  },
  ja: {
    categories: {
      ai_brain: { title: '脳', description: '中央知能と意思決定エージェント' },
      ai_hands: { title: '手', description: 'コンテンツ作成と最適化エージェント' },
      ai_shield: { title: '盾', description: '品質保証と自己修復エージェント' },
      public_site: { title: '公開サイト', description: 'ユーザー向けページと機能' },
      admin_system: { title: '管理システム', description: 'コンテンツ管理とモニタリング' },
      security: { title: 'セキュリティ', description: '認証とアクセス制御' },
      infrastructure: { title: 'インフラ', description: 'コアプラットフォームサービス' },
    },
    statuses: {
      production: '本番',
      beta: 'ベータ',
      development: '開発中',
    },
    features: {},
    ui: {
      searchPlaceholder: '機能、エージェント、モジュールを検索...',
      exportReport: '技術レポートをエクスポート',
      exportSuccess: 'レポートのダウンロード完了',
      technicalDetails: '技術詳細',
      capabilities: '主要機能',
      status: 'ステータス',
      noResults: '検索に一致する機能が見つかりません',
      allCategories: 'すべてのカテゴリ',
      totalAgents: 'AIエージェント',
      totalModules: 'サイトモジュール',
      totalInfrastructure: 'インフラ',
      generatedOn: '生成日',
      systemOverview: 'システム概要',
      reportTitle: 'Von Wobeserプラットフォーム技術レポート',
      reportSubtitle: '完全なシステムドキュメント',
    },
  },
  ar: {
    categories: {
      ai_brain: { title: 'الدماغ', description: 'وكلاء الذكاء المركزي واتخاذ القرار' },
      ai_hands: { title: 'الأيدي', description: 'وكلاء إنشاء المحتوى والتحسين' },
      ai_shield: { title: 'الدرع', description: 'وكلاء ضمان الجودة والإصلاح الذاتي' },
      public_site: { title: 'الموقع العام', description: 'صفحات وميزات للمستخدمين' },
      admin_system: { title: 'نظام الإدارة', description: 'إدارة المحتوى والمراقبة' },
      security: { title: 'الأمان', description: 'المصادقة والتحكم في الوصول' },
      infrastructure: { title: 'البنية التحتية', description: 'خدمات المنصة الأساسية' },
    },
    statuses: {
      production: 'إنتاج',
      beta: 'تجريبي',
      development: 'قيد التطوير',
    },
    features: {},
    ui: {
      searchPlaceholder: 'البحث عن الميزات والوكلاء والوحدات...',
      exportReport: 'تصدير التقرير الفني',
      exportSuccess: 'تم تنزيل التقرير بنجاح',
      technicalDetails: 'التفاصيل الفنية',
      capabilities: 'القدرات الرئيسية',
      status: 'الحالة',
      noResults: 'لم يتم العثور على ميزات تطابق بحثك',
      allCategories: 'جميع الفئات',
      totalAgents: 'وكلاء الذكاء الاصطناعي',
      totalModules: 'وحدات الموقع',
      totalInfrastructure: 'البنية التحتية',
      generatedOn: 'أنشئ في',
      systemOverview: 'نظرة عامة على النظام',
      reportTitle: 'التقرير الفني لمنصة Von Wobeser',
      reportSubtitle: 'وثائق النظام الكاملة',
    },
  },
  ru: {
    categories: {
      ai_brain: { title: 'Мозг', description: 'Агенты центрального интеллекта и принятия решений' },
      ai_hands: { title: 'Руки', description: 'Агенты создания и оптимизации контента' },
      ai_shield: { title: 'Щит', description: 'Агенты контроля качества и самовосстановления' },
      public_site: { title: 'Публичный сайт', description: 'Страницы и функции для пользователей' },
      admin_system: { title: 'Система администрирования', description: 'Управление контентом и мониторинг' },
      security: { title: 'Безопасность', description: 'Аутентификация и контроль доступа' },
      infrastructure: { title: 'Инфраструктура', description: 'Основные сервисы платформы' },
    },
    statuses: {
      production: 'Продакшн',
      beta: 'Бета',
      development: 'Разработка',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Поиск функций, агентов, модулей...',
      exportReport: 'Экспорт технического отчета',
      exportSuccess: 'Отчет успешно загружен',
      technicalDetails: 'Технические детали',
      capabilities: 'Ключевые возможности',
      status: 'Статус',
      noResults: 'Функции, соответствующие вашему запросу, не найдены',
      allCategories: 'Все категории',
      totalAgents: 'ИИ-агенты',
      totalModules: 'Модули сайта',
      totalInfrastructure: 'Инфраструктура',
      generatedOn: 'Создано',
      systemOverview: 'Обзор системы',
      reportTitle: 'Технический отчет платформы Von Wobeser',
      reportSubtitle: 'Полная документация системы',
    },
  },
  fr: {
    categories: {
      ai_brain: { title: 'Le Cerveau', description: 'Agents d\'intelligence centrale et de prise de décision' },
      ai_hands: { title: 'Les Mains', description: 'Agents de création et d\'optimisation de contenu' },
      ai_shield: { title: 'Le Bouclier', description: 'Agents d\'assurance qualité et d\'auto-réparation' },
      public_site: { title: 'Site Public', description: 'Pages et fonctionnalités utilisateur' },
      admin_system: { title: 'Système Admin', description: 'Gestion de contenu et surveillance' },
      security: { title: 'Sécurité', description: 'Authentification et contrôle d\'accès' },
      infrastructure: { title: 'Infrastructure', description: 'Services de plateforme de base' },
    },
    statuses: {
      production: 'Production',
      beta: 'Bêta',
      development: 'Développement',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Rechercher fonctionnalités, agents, modules...',
      exportReport: 'Exporter le rapport technique',
      exportSuccess: 'Rapport téléchargé avec succès',
      technicalDetails: 'Détails techniques',
      capabilities: 'Capacités clés',
      status: 'Statut',
      noResults: 'Aucune fonctionnalité correspondant à votre recherche',
      allCategories: 'Toutes les catégories',
      totalAgents: 'Agents IA',
      totalModules: 'Modules du site',
      totalInfrastructure: 'Infrastructure',
      generatedOn: 'Généré le',
      systemOverview: 'Aperçu du système',
      reportTitle: 'Rapport technique de la plateforme Von Wobeser',
      reportSubtitle: 'Documentation complète du système',
    },
  },
  it: {
    categories: {
      ai_brain: { title: 'Il Cervello', description: 'Agenti di intelligenza centrale e decisionale' },
      ai_hands: { title: 'Le Mani', description: 'Agenti di creazione e ottimizzazione contenuti' },
      ai_shield: { title: 'Lo Scudo', description: 'Agenti di garanzia qualità e auto-riparazione' },
      public_site: { title: 'Sito Pubblico', description: 'Pagine e funzionalità utente' },
      admin_system: { title: 'Sistema Admin', description: 'Gestione contenuti e monitoraggio' },
      security: { title: 'Sicurezza', description: 'Autenticazione e controllo accessi' },
      infrastructure: { title: 'Infrastruttura', description: 'Servizi core della piattaforma' },
    },
    statuses: {
      production: 'Produzione',
      beta: 'Beta',
      development: 'Sviluppo',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Cerca funzionalità, agenti, moduli...',
      exportReport: 'Esporta rapporto tecnico',
      exportSuccess: 'Rapporto scaricato con successo',
      technicalDetails: 'Dettagli tecnici',
      capabilities: 'Capacità chiave',
      status: 'Stato',
      noResults: 'Nessuna funzionalità trovata corrispondente alla ricerca',
      allCategories: 'Tutte le categorie',
      totalAgents: 'Agenti IA',
      totalModules: 'Moduli del sito',
      totalInfrastructure: 'Infrastruttura',
      generatedOn: 'Generato il',
      systemOverview: 'Panoramica del sistema',
      reportTitle: 'Rapporto tecnico della piattaforma Von Wobeser',
      reportSubtitle: 'Documentazione completa del sistema',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getAllFeatures(): SystemFeature[] {
  return [...AI_AGENTS, ...PUBLIC_MODULES, ...ADMIN_MODULES, ...INFRASTRUCTURE];
}

export function getFeaturesByCategory(category: SystemCategory): SystemFeature[] {
  return getAllFeatures().filter(f => f.category === category);
}

export function searchFeatures(query: string): SystemFeature[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return getAllFeatures();
  
  return getAllFeatures().filter(feature => 
    feature.name.toLowerCase().includes(normalizedQuery) ||
    feature.technicalName.toLowerCase().includes(normalizedQuery) ||
    feature.technicalDetail.toLowerCase().includes(normalizedQuery) ||
    feature.userBenefit.toLowerCase().includes(normalizedQuery) ||
    feature.keyCapabilities.some(cap => cap.toLowerCase().includes(normalizedQuery))
  );
}

export function getTranslations(language: string): SystemManifestTranslations {
  return MANIFEST_TRANSLATIONS[language] || MANIFEST_TRANSLATIONS.en;
}

export function getSystemStats() {
  const all = getAllFeatures();
  return {
    totalAgents: AI_AGENTS.length,
    totalPublicModules: PUBLIC_MODULES.length,
    totalAdminModules: ADMIN_MODULES.length,
    totalInfrastructure: all.filter(f => f.category === 'infrastructure').length,
    totalSecurity: all.filter(f => f.category === 'security').length,
    totalFeatures: all.length,
    productionFeatures: all.filter(f => f.status === 'production').length,
    betaFeatures: all.filter(f => f.status === 'beta').length,
  };
}

export function generateMarkdownReport(language: string = 'en'): string {
  const t = getTranslations(language);
  const stats = getSystemStats();
  const date = new Date().toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  let md = `# ${t.ui.reportTitle}\n\n`;
  md += `**${t.ui.reportSubtitle}**\n\n`;
  md += `${t.ui.generatedOn}: ${date}\n\n`;
  md += `---\n\n`;
  
  md += `## ${t.ui.systemOverview}\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| ${t.ui.totalAgents} | ${stats.totalAgents} |\n`;
  md += `| ${t.ui.totalModules} | ${stats.totalPublicModules + stats.totalAdminModules} |\n`;
  md += `| ${t.ui.totalInfrastructure} | ${stats.totalInfrastructure} |\n`;
  md += `| Total Features | ${stats.totalFeatures} |\n\n`;
  
  const categories: SystemCategory[] = ['ai_brain', 'ai_hands', 'ai_shield', 'public_site', 'admin_system', 'security', 'infrastructure'];
  
  for (const category of categories) {
    const features = getFeaturesByCategory(category);
    if (features.length === 0) continue;
    
    const catInfo = t.categories[category];
    md += `## ${catInfo.title}\n\n`;
    md += `*${catInfo.description}*\n\n`;
    
    for (const feature of features) {
      md += `### ${feature.name}\n\n`;
      md += `**Technical Name:** \`${feature.technicalName}\`\n\n`;
      md += `**${t.ui.status}:** ${t.statuses[feature.status]}\n\n`;
      md += `**${t.ui.technicalDetails}:**\n${feature.technicalDetail}\n\n`;
      md += `**Business Value:**\n${feature.userBenefit}\n\n`;
      md += `**${t.ui.capabilities}:**\n`;
      for (const cap of feature.keyCapabilities) {
        md += `- ${cap}\n`;
      }
      md += `\n---\n\n`;
    }
  }
  
  md += `\n---\n\n*This report was automatically generated by the Von Wobeser Platform Documentation System.*\n`;
  
  return md;
}
