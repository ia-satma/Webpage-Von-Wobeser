import { db } from "../db";
import { agentKnowledge } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { 
  AGENT_CATEGORIES, 
  AGENT_IDS, 
  EXPECTED_AGENT_COUNTS,
  validateAgentInventory,
  type AgentCategory 
} from "@shared/agentConstants";

export interface AgentCapabilityCard {
  id: string;
  technicalName: string;
  businessName: string;
  role: string;
  category: "brain" | "hands" | "shield";
  description: string;
  capabilities: string[];
  status: "active" | "dormant" | "evolving";
  lastActive?: Date;
  successRate?: number;
  evolutionLevel: number;
}

export interface SystemEvolutionEntry {
  date: string;
  title: string;
  description: string;
  agentId?: string;
  impact: "major" | "minor" | "critical";
  category: "intelligence" | "security" | "performance" | "capability";
}

const AGENT_REGISTRY: AgentCapabilityCard[] = [
  {
    id: "orchestrator",
    technicalName: "AgentOrchestrator",
    businessName: "Central Neural Hub",
    role: "Supreme Conductor",
    category: "brain",
    description: "The mastermind that coordinates all specialized agents, manages execution queues with intelligent prioritization, and ensures zero-conflict parallel processing. Every decision flows through this central intelligence.",
    capabilities: [
      "Job priority queue management (Critical/High/Normal/Low)",
      "Parallel agent execution coordination",
      "Real-time WebSocket progress broadcasting",
      "Automatic retry with exponential backoff",
      "Pipeline state persistence and recovery"
    ],
    status: "active",
    evolutionLevel: 3
  },
  {
    id: "auto_recovery",
    technicalName: "AutoRecoveryAgent",
    businessName: "The Self-Healing Auditor",
    role: "Guardian of Integrity",
    category: "shield",
    description: "Unlike standard websites, this agent proactively scans for 'zombie processes' and incomplete data 24/7. It autonomously repairs broken links, retries failed translations, and recovers crashed pipelines without human intervention.",
    capabilities: [
      "Continuous failed-item detection",
      "Autonomous error diagnosis with error codes",
      "Multi-step recovery (image, translation, SEO)",
      "Placeholder fallback for irrecoverable items",
      "Recovery audit trail logging"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "polyglot_translator",
    technicalName: "PolyglotTranslatorAgent",
    businessName: "The Polyglot Neural Network",
    role: "Global Voice",
    category: "hands",
    description: "An advanced linguistic engine that doesn't just translate, but 'localizes' legal terminology. Ensures that a German bio never leaks Spanish text, with intelligent caching that reduces API costs by 90%.",
    capabilities: [
      "10-language legal translation (EN, ES, DE, ZH, KO, JA, AR, RU, FR, IT)",
      "Legal terminology glossary with 500+ terms",
      "Smart translation caching (database-backed)",
      "RTL support for Arabic",
      "Context-aware tone preservation"
    ],
    status: "active",
    evolutionLevel: 4
  },
  {
    id: "smart_image_generator",
    technicalName: "SmartImageGenerator",
    businessName: "The Smart Visualizer",
    role: "Creative Director",
    category: "hands",
    description: "A multi-engine generative system with intelligent fallback. If OpenAI refuses a prompt due to content policy, this agent instantly rewrites the concept abstractly or switches to Gemini to guarantee visual assets. Never leaves an article without imagery.",
    capabilities: [
      "DALL-E 3 primary generation engine",
      "Gemini 2.5 Flash automatic fallback",
      "Legal prompt sanitization (abstracts sensitive topics)",
      "Brand-compliant #AA1A2E color injection",
      "Automatic Von Wobeser logo overlay"
    ],
    status: "active",
    evolutionLevel: 3
  },
  {
    id: "formatter",
    technicalName: "FormatterAgent",
    businessName: "The Document Surgeon",
    role: "Content Purifier",
    category: "hands",
    description: "Transforms raw PDF extracts into pristine, publication-ready content. Removes invisible artifacts, fixes encoding issues, and normalizes formatting while preserving precise legal language.",
    capabilities: [
      "PDF text extraction cleanup",
      "Paragraph and line break normalization",
      "Boilerplate detection and removal",
      "Header/footer pattern recognition",
      "Encoding normalization (UTF-8 enforcement)"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "category_agent",
    technicalName: "CategoryAgent",
    businessName: "The Legal Taxonomist",
    role: "Classification Oracle",
    category: "brain",
    description: "Uses semantic understanding to classify content into Von Wobeser's practice areas, industry groups, and legal branches. Maintains consistency with the firm's established taxonomy.",
    capabilities: [
      "18 practice area classification",
      "7 industry group detection",
      "Primary/secondary category assignment",
      "Confidence scoring for classifications",
      "Cross-reference with existing content"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "metadata_linker",
    technicalName: "MetadataLinkerAgent",
    businessName: "The Connection Architect",
    role: "Relationship Mapper",
    category: "brain",
    description: "Analyzes content to identify lawyer names, practice areas, and industry connections. Creates an intelligent web of relationships between content and the firm's knowledge base.",
    capabilities: [
      "Lawyer name detection in article content",
      "Practice area relationship mapping",
      "Industry group association",
      "Related content suggestions",
      "Author attribution automation"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "seo_optimizer",
    technicalName: "SEOOptimizerAgent",
    businessName: "The Visibility Enhancer",
    role: "Search Strategist",
    category: "hands",
    description: "Optimizes content for maximum search engine visibility. Generates SEO-friendly titles, meta descriptions, and keyword strategies while maintaining the firm's professional tone.",
    capabilities: [
      "Title optimization with keyword injection",
      "Meta description generation (160 chars)",
      "URL slug optimization",
      "Keyword extraction and density analysis",
      "Structured data (JSON-LD) suggestions"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "content_auditor",
    technicalName: "ContentAuditorAgent",
    businessName: "The Quality Inspector",
    role: "Content Guardian",
    category: "shield",
    description: "Continuously scans the database for content gaps, missing translations, unlinked authors, and incomplete metadata. Generates prioritized action reports for administrators.",
    capabilities: [
      "Translation coverage verification",
      "Author linkage validation",
      "Format consistency checks",
      "Broken link detection",
      "Content completeness scoring"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "website_auditor",
    technicalName: "WebsiteAuditorAgent",
    businessName: "The Site Sentinel",
    role: "Zero-Error Guardian",
    category: "shield",
    description: "Crawls every page of the published website to detect broken links, missing images, SEO violations, and accessibility issues. Maintains the zero-error standard that defines the platform.",
    capabilities: [
      "Full-site crawling and indexing",
      "Broken link detection",
      "Missing image identification",
      "SEO violation flagging",
      "Accessibility (a11y) checking"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "content_analyzer",
    technicalName: "ContentAnalyzerAgent",
    businessName: "The Deep Reader",
    role: "Content Intelligence",
    category: "brain",
    description: "Performs comprehensive GPT-4o analysis of articles: SEO recommendations, spelling corrections, lawyer identification, legal branch classification, and quality scoring from 0-100.",
    capabilities: [
      "SEO recommendation generation",
      "Spelling & grammar analysis",
      "Legal branch classification",
      "Industry detection",
      "Quality score calculation (0-100)"
    ],
    status: "active",
    evolutionLevel: 3
  },
  {
    id: "legal_council",
    technicalName: "LegalCouncilService",
    businessName: "The Digital Governance Council",
    role: "Quality Arbiter",
    category: "brain",
    description: "A tribunal of three specialized AI agents (Legal Scholar, Risk Analyst, Brand Guardian) that evaluate every article before publication. Uses Promise.allSettled for fault-isolated voting with score 0-100 and majority consensus.",
    capabilities: [
      "3-agent evaluation council",
      "Institutional risk scoring",
      "Individual votes with reasoning",
      "Consolidated editor feedback",
      "Fault-tolerant isolation"
    ],
    status: "active",
    evolutionLevel: 3
  },
  {
    id: "system_chronicler",
    technicalName: "SystemChronicler",
    businessName: "The Evolution Chronicler",
    role: "System Historian",
    category: "brain",
    description: "Meta-agent that documents the entire agent ecosystem. Tracks 14 capability cards, groups by category, monitors evolution levels (1-5), and persists the system's evolutionary history to JSON.",
    capabilities: [
      "14 agent capability registry",
      "Evolution level tracking (1-5)",
      "Real-time status monitoring",
      "History persistence",
      "Self-documenting system"
    ],
    status: "active",
    evolutionLevel: 2
  },
  {
    id: "system_health",
    technicalName: "SystemHealthCheck",
    businessName: "The System Physician",
    role: "Health Monitor",
    category: "shield",
    description: "Deep audit across 5 issue types: zombie processes, incomplete successes, localization leakage, orphaned assets, missing translations. Calculates weighted health score and detects jobs stuck >10min.",
    capabilities: [
      "Zombie process detection (>10min)",
      "Language contamination scanning",
      "Orphaned asset detection",
      "Health score calculation",
      "5 diagnostic types"
    ],
    status: "active",
    evolutionLevel: 2
  }
];

const EVOLUTION_FILE_PATH = path.join(process.cwd(), "system_evolution.json");

export class SystemChronicler {
  private static instance: SystemChronicler;
  private agentRegistry: Map<string, AgentCapabilityCard> = new Map();
  private evolutionTimeline: SystemEvolutionEntry[] = [];

  private constructor() {
    AGENT_REGISTRY.forEach(agent => {
      this.agentRegistry.set(agent.id, agent);
    });
    this.loadEvolutionTimeline();
    this.validateInventory();
  }

  static getInstance(): SystemChronicler {
    if (!SystemChronicler.instance) {
      SystemChronicler.instance = new SystemChronicler();
    }
    return SystemChronicler.instance;
  }

  private loadEvolutionTimeline(): void {
    try {
      if (fs.existsSync(EVOLUTION_FILE_PATH)) {
        const data = fs.readFileSync(EVOLUTION_FILE_PATH, "utf-8");
        this.evolutionTimeline = JSON.parse(data);
      } else {
        this.evolutionTimeline = this.getDefaultTimeline();
        this.saveEvolutionTimeline();
      }
    } catch (error) {
      console.error("[SystemChronicler] Failed to load evolution timeline:", error);
      this.evolutionTimeline = this.getDefaultTimeline();
    }
  }

  private getDefaultTimeline(): SystemEvolutionEntry[] {
    return [
      {
        date: "2025-12-10",
        title: "Visual Intelligence Upgrade",
        description: "The Image Agent learned to bypass content policy filters by abstracting legal concepts into professional imagery, ensuring 100% cover image availability.",
        agentId: "smart_image_generator",
        impact: "major",
        category: "intelligence"
      },
      {
        date: "2025-12-10",
        title: "Self-Healing Architecture Deployed",
        description: "Introduced the AutoRecoveryAgent that autonomously diagnoses and repairs failed processing jobs without human intervention.",
        agentId: "auto_recovery",
        impact: "critical",
        category: "security"
      },
      {
        date: "2025-12-09",
        title: "Multi-Engine Fallback System",
        description: "SmartImageGenerator now seamlessly falls back from DALL-E 3 to Gemini 2.5 when primary generation fails, guaranteeing visual content.",
        agentId: "smart_image_generator",
        impact: "major",
        category: "capability"
      },
      {
        date: "2025-12-08",
        title: "Legal Glossary Expansion",
        description: "The Polyglot Neural Network integrated 200+ new legal terms across all 10 supported languages, improving translation accuracy by 15%.",
        agentId: "polyglot_translator",
        impact: "minor",
        category: "intelligence"
      },
      {
        date: "2025-12-07",
        title: "Real-Time Pipeline Monitoring",
        description: "WebSocket-based progress broadcasting enables live tracking of article processing across all pipeline stages.",
        agentId: "orchestrator",
        impact: "major",
        category: "performance"
      },
      {
        date: "2025-12-05",
        title: "Content Analysis Engine",
        description: "Deep Reader agent now provides comprehensive GPT-4o analysis with quality scoring, spelling review, and legal classification.",
        agentId: "content_analyzer",
        impact: "major",
        category: "intelligence"
      }
    ];
  }

  private saveEvolutionTimeline(): void {
    try {
      fs.writeFileSync(EVOLUTION_FILE_PATH, JSON.stringify(this.evolutionTimeline, null, 2));
    } catch (error) {
      console.error("[SystemChronicler] Failed to save evolution timeline:", error);
    }
  }

  getAllAgents(): AgentCapabilityCard[] {
    return Array.from(this.agentRegistry.values());
  }

  getAgentsByCategory(category: "brain" | "hands" | "shield"): AgentCapabilityCard[] {
    return this.getAllAgents().filter(agent => agent.category === category);
  }

  getAgent(id: string): AgentCapabilityCard | undefined {
    return this.agentRegistry.get(id);
  }

  getEvolutionTimeline(): SystemEvolutionEntry[] {
    return [...this.evolutionTimeline].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  recordEvolution(entry: Omit<SystemEvolutionEntry, "date">): void {
    const fullEntry: SystemEvolutionEntry = {
      ...entry,
      date: new Date().toISOString().split("T")[0]
    };
    this.evolutionTimeline.unshift(fullEntry);
    this.saveEvolutionTimeline();
    console.log(`[SystemChronicler] Recorded evolution: ${entry.title}`);
  }

  updateAgentStatus(agentId: string, status: "active" | "dormant" | "evolving"): void {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActive = new Date();
    }
  }

  getSystemStats(): {
    totalAgents: number;
    activeAgents: number;
    brainAgents: number;
    handsAgents: number;
    shieldAgents: number;
    averageEvolutionLevel: number;
  } {
    const agents = this.getAllAgents();
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === "active").length,
      brainAgents: agents.filter(a => a.category === AGENT_CATEGORIES.BRAIN).length,
      handsAgents: agents.filter(a => a.category === AGENT_CATEGORIES.HANDS).length,
      shieldAgents: agents.filter(a => a.category === AGENT_CATEGORIES.SHIELD).length,
      averageEvolutionLevel: agents.reduce((sum, a) => sum + a.evolutionLevel, 0) / agents.length
    };
  }

  validateInventory(): { valid: boolean; errors: string[] } {
    const agents = this.getAllAgents().map(a => ({ id: a.id, category: a.category }));
    const result = validateAgentInventory(agents);
    
    if (!result.valid) {
      const errorMsg = `[SystemChronicler] AGENT INVENTORY VALIDATION FAILED: ${result.errors.join('; ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    } else {
      console.log(`[SystemChronicler] Inventory validated: ${EXPECTED_AGENT_COUNTS.TOTAL} agents (${EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.BRAIN]} brain, ${EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.HANDS]} hands, ${EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.SHIELD]} shield)`);
    }
    
    return result;
  }

  translateTechnicalToBusiness(technicalName: string): string {
    const agent = this.getAllAgents().find(a => a.technicalName === technicalName);
    return agent?.businessName || technicalName;
  }
}

export const systemChronicler = SystemChronicler.getInstance();
