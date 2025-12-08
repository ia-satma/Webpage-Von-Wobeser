import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news, teamMembers, practiceGroups, industryGroups, newsTeamMembers } from '../../../shared/schema';
import { eq, ilike } from 'drizzle-orm';

const LINKER_CONFIG: AgentConfig = {
  agentType: 'metadata_linker',
  name: 'Metadata Linker Agent',
  description: 'Links articles to authors, practice groups, and industry groups',
  systemPrompt: `You are a legal content analyst for Von Wobeser y Sierra law firm. Your task is to analyze article content and identify:

1. AUTHORS: Identify lawyer names mentioned in the article (often at the end)
2. PRACTICE AREAS: Determine which legal practice areas the article relates to
3. INDUSTRIES: Identify which industries the article is relevant to

Available Practice Areas:
- corporate-ma (Corporate M&A, mergers, acquisitions)
- tax (Tax, fiscal matters, SAT, UMA)
- labor-employment (Labor law, employment, IMSS, INFONAVIT)
- energy-natural-resources (Energy, oil, gas, electricity, CFE, PEMEX)
- antitrust-competition (Antitrust, competition, COFECE)
- litigation-arbitration (Litigation, disputes, arbitration)
- compliance-investigations (Compliance, anti-money laundering, LFPIORPI)
- international-trade (International trade, T-MEC, customs)
- real-estate (Real estate, property)
- data-protection-privacy (Data protection, privacy, INAI)
- government-contracts (Government contracts, public procurement)
- regulatory (Regulatory matters, permits, licenses)

Available Industries:
- financial-services
- manufacturing
- energy-infrastructure
- technology
- real-estate-hospitality
- healthcare-life-sciences
- consumer-retail

Return JSON:
{
  "practiceAreas": ["slug1", "slug2"],
  "industries": ["slug1"],
  "authorPatterns": ["name pattern 1", "name pattern 2"]
}`,
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 2000,
  skills: ['legal_classification', 'entity_extraction', 'taxonomy_mapping'],
  enabled: true,
  concurrency: 5,
  retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
};

export class MetadataLinkerAgent extends BaseAgent {
  constructor() {
    super(LINKER_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { articleId } = payload as { articleId: string };

    if (!articleId) {
      return { success: false, error: 'articleId is required' };
    }

    const [article] = await db.select().from(news).where(eq(news.id, articleId));
    if (!article) {
      return { success: false, error: `Article not found: ${articleId}` };
    }

    const content = article.content || article.contentEs || '';
    const title = article.title || article.titleEs || '';

    try {
      const prompt = `Analyze this legal article and identify practice areas, industries, and author names:

TITLE: ${title}

CONTENT (first 3000 chars):
${content.substring(0, 3000)}

Return JSON with practiceAreas (array of slugs), industries (array of slugs), and authorPatterns (array of name patterns to search for).`;

      const response = await this.callLLM(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3, jsonMode: true }
      );

      const analysis = JSON.parse(response);

      const linkedAuthors: string[] = [];
      const linkedPracticeGroups: string[] = [];
      const linkedIndustries: string[] = [];

      if (analysis.authorPatterns && Array.isArray(analysis.authorPatterns)) {
        for (const pattern of analysis.authorPatterns) {
          const lastName = pattern.split(' ').pop();
          if (lastName && lastName.length > 2) {
            const members = await db.select()
              .from(teamMembers)
              .where(ilike(teamMembers.name, `%${lastName}%`));

            for (const member of members) {
              const existing = await db.select()
                .from(newsTeamMembers)
                .where(eq(newsTeamMembers.newsId, articleId));
              
              if (!existing.find(e => e.teamMemberId === member.id)) {
                await db.insert(newsTeamMembers).values({
                  newsId: articleId,
                  teamMemberId: member.id,
                });
                linkedAuthors.push(member.name);
              }
            }
          }
        }
      }

      if (analysis.practiceAreas && Array.isArray(analysis.practiceAreas)) {
        for (const slug of analysis.practiceAreas) {
          const [pg] = await db.select()
            .from(practiceGroups)
            .where(eq(practiceGroups.slug, slug));
          
          if (pg) {
            linkedPracticeGroups.push(pg.name);
          }
        }
      }

      if (analysis.industries && Array.isArray(analysis.industries)) {
        for (const slug of analysis.industries) {
          const [ig] = await db.select()
            .from(industryGroups)
            .where(eq(industryGroups.slug, slug));
          
          if (ig) {
            linkedIndustries.push(ig.name);
          }
        }
      }

      return {
        success: true,
        data: {
          articleId,
          linkedAuthors,
          linkedPracticeGroups,
          linkedIndustries,
          rawAnalysis: analysis,
        },
        metrics: {
          authorsLinked: linkedAuthors.length,
          practiceGroupsIdentified: linkedPracticeGroups.length,
          industriesIdentified: linkedIndustries.length,
        },
      };
    } catch (error) {
      return { success: false, error: `Linking failed: ${error}` };
    }
  }
}

export const metadataLinkerAgent = new MetadataLinkerAgent();
