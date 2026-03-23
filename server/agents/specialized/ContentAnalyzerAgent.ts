import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news, blogPosts, teamMembers, practiceGroups, industryGroups, contentAnalysis } from '../../../shared/schema';
import type { ContentAnalysisResult, SEORecommendation, SpellingGrammarIssue, LawyerMention } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const ANALYZER_CONFIG: AgentConfig = {
  agentType: 'content_analyzer',
  name: 'Content Analyzer Agent',
  description: 'Analyzes legal articles for SEO, categorization, spelling/grammar, lawyer mentions, legal branches, and industries',
  systemPrompt: `You are a specialized content analyst for Von Wobeser y Sierra, a prestigious Mexican law firm. Your task is to analyze legal articles and provide comprehensive reports including:

1. SEO Optimization: Keywords, title suggestions, meta descriptions, heading improvements
2. Article Categorization: Primary and secondary categories
3. Spelling/Grammar Review: Errors, corrections, legal terminology issues
4. Lawyers Mentioned: Names and their context in the article
5. Legal Branches: Primary and secondary areas of law
6. Industry Identification: Primary and secondary industries

Be thorough but concise. Focus on actionable insights.`,
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 8000,
  skills: ['content_analysis', 'seo_optimization', 'legal_categorization', 'grammar_review'],
  enabled: true,
  concurrency: 2,
  retryPolicy: { maxRetries: 3, backoffMs: 2000, backoffMultiplier: 2 },
};

const ARTICLE_CATEGORIES = [
  'Legal News',
  'Case Study',
  'Legal Guide',
  'Regulatory Update',
  'Market Analysis',
  'Client Alert',
  'Press Release',
  'Opinion',
  'Interview',
  'Award/Recognition',
];

const LEGAL_BRANCHES = [
  'Corporate Law',
  'Mergers & Acquisitions',
  'Banking & Finance',
  'Capital Markets',
  'Antitrust & Competition',
  'Intellectual Property',
  'Labor & Employment',
  'Tax',
  'Real Estate',
  'Energy & Natural Resources',
  'Environmental',
  'Litigation & Arbitration',
  'International Trade',
  'Data Privacy & Cybersecurity',
  'Regulatory & Government Affairs',
  'Restructuring & Insolvency',
  'Private Equity',
  'Infrastructure & Projects',
];

const INDUSTRIES = [
  'Financial Services',
  'Energy & Power',
  'Technology',
  'Healthcare & Life Sciences',
  'Real Estate & Construction',
  'Manufacturing',
  'Retail & Consumer',
  'Telecommunications',
  'Automotive',
  'Mining & Metals',
  'Infrastructure',
  'Aerospace & Defense',
  'Media & Entertainment',
  'Hospitality & Tourism',
  'Agriculture',
];

export class ContentAnalyzerAgent extends BaseAgent {
  constructor() {
    super(ANALYZER_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { articleId } = payload as { articleId: string };

    if (!articleId) {
      return { success: false, error: 'articleId is required' };
    }

    // Try blog_posts first, then news table
    let article: any;
    let source = '';
    
    console.log(`[ContentAnalyzerAgent] Looking up articleId: ${articleId}`);
    
    const [blogPost] = await db.select().from(blogPosts).where(eq(blogPosts.id, articleId));
    console.log(`[ContentAnalyzerAgent] blog_posts result:`, blogPost ? 'FOUND' : 'NOT FOUND');
    
    if (blogPost) {
      article = blogPost;
      source = 'blog_posts';
    } else {
      const [newsArticle] = await db.select().from(news).where(eq(news.id, articleId));
      console.log(`[ContentAnalyzerAgent] news result:`, newsArticle ? 'FOUND' : 'NOT FOUND');
      if (newsArticle) {
        article = newsArticle;
        source = 'news';
      }
    }
    
    if (!article) {
      console.error(`[ContentAnalyzerAgent] Article not found in either table: ${articleId}`);
      return { success: false, error: `Article not found: ${articleId}` };
    }
    
    console.log(`[ContentAnalyzerAgent] Found article in ${source}: ${article.title || article.titleEs}`)

    const allLawyers = await db.select().from(teamMembers);
    const allPracticeGroups = await db.select().from(practiceGroups);
    const allIndustryGroups = await db.select().from(industryGroups);

    const lawyerNames = allLawyers.map(l => l.name);
    const practiceNames = allPracticeGroups.map(p => ({ en: p.name, es: p.nameEs }));
    const industryNames = allIndustryGroups.map(i => ({ en: i.name, es: i.nameEs }));

    const articleContent = `
TITLE: ${article.title || ''}
TITLE (ES): ${article.titleEs || ''}

EXCERPT: ${article.excerpt || ''}
EXCERPT (ES): ${article.excerptEs || ''}

CONTENT: ${article.content || ''}
CONTENT (ES): ${article.contentEs || ''}
`.trim();

    try {
      const analysisResult = await this.analyzeArticle(
        articleContent,
        lawyerNames,
        practiceNames,
        industryNames
      );

      await this.saveAnalysis(articleId, analysisResult);

      return {
        success: true,
        data: {
          articleId,
          analysis: analysisResult,
          qualityScore: analysisResult.qualityScore,
        },
        metrics: {
          issuesFound: analysisResult.spellingGrammar.length,
          lawyersMentioned: analysisResult.lawyersMentioned.length,
          legalBranches: analysisResult.legalBranches.primary.length + analysisResult.legalBranches.secondary.length,
          qualityScore: analysisResult.qualityScore,
        },
      };
    } catch (error) {
      console.error('[ContentAnalyzerAgent] Analysis failed:', error);
      return { success: false, error: String(error) };
    }
  }

  private async analyzeArticle(
    articleContent: string,
    lawyerNames: string[],
    practiceNames: { en: string; es: string }[],
    industryNames: { en: string; es: string }[]
  ): Promise<ContentAnalysisResult> {
    const prompt = `Analyze this legal article and provide a comprehensive report.

ARTICLE:
${articleContent.substring(0, 8000)}

KNOWN LAWYERS AT THE FIRM:
${lawyerNames.join(', ')}

PRACTICE AREAS:
${practiceNames.map(p => `${p.en} / ${p.es}`).join(', ')}

INDUSTRY GROUPS:
${industryNames.map(i => `${i.en} / ${i.es}`).join(', ')}

AVAILABLE CATEGORIES: ${ARTICLE_CATEGORIES.join(', ')}
LEGAL BRANCHES: ${LEGAL_BRANCHES.join(', ')}
INDUSTRIES: ${INDUSTRIES.join(', ')}

Provide analysis in JSON format:
{
  "seoRecommendations": {
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "titleSuggestion": "improved title for SEO",
    "metaDescription": "150-160 character meta description",
    "headingImprovements": ["H2: suggested heading", "H3: another heading"],
    "contentGaps": ["topic that could be added"],
    "internalLinkOpportunities": ["related topic to link"]
  },
  "categories": {
    "primary": "main category",
    "secondary": ["secondary category 1"]
  },
  "spellingGrammar": [
    {
      "original": "incorrect text",
      "correction": "corrected text",
      "type": "spelling|grammar|terminology|style",
      "explanation": "why this is an issue"
    }
  ],
  "lawyersMentioned": [
    {
      "name": "Lawyer Name",
      "role": "role in article context",
      "context": "brief context"
    }
  ],
  "legalBranches": {
    "primary": ["main legal area"],
    "secondary": ["related legal area"]
  },
  "industries": {
    "primary": "main industry",
    "secondary": ["related industry"]
  },
  "qualityScore": 85
}

Quality score (0-100) based on:
- Content completeness (25 points)
- SEO readiness (25 points)
- Grammar/spelling (25 points)
- Proper categorization (25 points)`;

    const response = await this.callLLM(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, jsonMode: true }
    );

    const parsed = JSON.parse(response);
    
    return {
      seoRecommendations: this.validateSEO(parsed.seoRecommendations),
      categories: {
        primary: parsed.categories?.primary || 'Legal News',
        secondary: parsed.categories?.secondary || [],
      },
      spellingGrammar: this.validateSpellingGrammar(parsed.spellingGrammar || []),
      lawyersMentioned: this.validateLawyerMentions(parsed.lawyersMentioned || []),
      legalBranches: {
        primary: parsed.legalBranches?.primary || [],
        secondary: parsed.legalBranches?.secondary || [],
      },
      industries: {
        primary: parsed.industries?.primary || 'General',
        secondary: parsed.industries?.secondary || [],
      },
      qualityScore: Math.min(100, Math.max(0, parsed.qualityScore || 50)),
      analysisTimestamp: new Date().toISOString(),
    };
  }

  private validateSEO(seo: any): SEORecommendation {
    return {
      keywords: Array.isArray(seo?.keywords) ? seo.keywords.slice(0, 5) : [],
      titleSuggestion: seo?.titleSuggestion || '',
      metaDescription: seo?.metaDescription || '',
      headingImprovements: Array.isArray(seo?.headingImprovements) ? seo.headingImprovements : [],
      contentGaps: Array.isArray(seo?.contentGaps) ? seo.contentGaps : [],
      internalLinkOpportunities: Array.isArray(seo?.internalLinkOpportunities) ? seo.internalLinkOpportunities : [],
    };
  }

  private validateSpellingGrammar(issues: any[]): SpellingGrammarIssue[] {
    return issues.map(issue => ({
      original: issue.original || '',
      correction: issue.correction || '',
      type: ['spelling', 'grammar', 'terminology', 'style'].includes(issue.type) 
        ? issue.type 
        : 'grammar',
      explanation: issue.explanation || '',
    }));
  }

  private validateLawyerMentions(mentions: any[]): LawyerMention[] {
    return mentions.map(m => ({
      name: m.name || '',
      role: m.role || '',
      context: m.context || '',
    }));
  }

  private async saveAnalysis(articleId: string, result: ContentAnalysisResult): Promise<void> {
    const existing = await db.select()
      .from(contentAnalysis)
      .where(eq(contentAnalysis.articleId, articleId));

    if (existing.length > 0) {
      await db.update(contentAnalysis)
        .set({
          analysisResult: result,
          qualityScore: result.qualityScore,
          issuesCount: result.spellingGrammar.length,
          updatedAt: new Date(),
        })
        .where(eq(contentAnalysis.articleId, articleId));
    } else {
      await db.insert(contentAnalysis).values({
        articleId,
        analysisResult: result,
        qualityScore: result.qualityScore,
        issuesCount: result.spellingGrammar.length,
      });
    }
  }

  async getAnalysis(articleId: string): Promise<ContentAnalysisResult | null> {
    const [existing] = await db.select()
      .from(contentAnalysis)
      .where(eq(contentAnalysis.articleId, articleId));

    return existing?.analysisResult || null;
  }
}

export const contentAnalyzerAgent = new ContentAnalyzerAgent();
