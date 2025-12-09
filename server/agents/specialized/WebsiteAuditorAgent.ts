import { BaseAgent } from '../core/BaseAgent';
import { AgentResult, ExecutionContext } from '../core/types';
import { storage } from '../../storage';
import type { InsertWebsiteAuditFinding, TeamMember, PracticeGroup, IndustryGroup, News } from '@shared/schema';

const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'];

interface AuditConfig {
  runType: 'full' | 'delta' | 'links_only' | 'translations_only' | 'seo_only' | 'content_only';
  skipModules?: string[];
}

interface AuditMetrics {
  startTime: number;
  endTime?: number;
  pagesScanned: number;
  linksChecked: number;
  translationsChecked: number;
  contentItemsChecked: number;
  executionTimeMs?: number;
}

interface FindingData {
  category: string;
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  entityType?: string;
  entityId?: string;
  language?: string;
  url?: string;
  details: Record<string, unknown>;
  recommendation?: string;
  ownerAgent?: string;
}

export class WebsiteAuditorAgent extends BaseAgent {
  private auditId: string = '';
  private metrics: AuditMetrics = {
    startTime: 0,
    pagesScanned: 0,
    linksChecked: 0,
    translationsChecked: 0,
    contentItemsChecked: 0,
  };
  private findings: FindingData[] = [];

  constructor() {
    super({
      agentType: 'website_auditor',
      name: 'Website Auditor Agent',
      description: 'Comprehensive website quality auditor - checks links, translations, content completeness, SEO, and performance',
      systemPrompt: `You are a website quality auditor for a corporate law firm website.
Your role is to identify issues that affect user experience, SEO, and content quality.
Focus on: broken links, missing translations, incomplete lawyer profiles, SEO gaps, and content issues.
Be thorough but prioritize critical issues that directly impact users.`,
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 4096,
      skills: ['link_checking', 'translation_validation', 'content_analysis', 'seo_audit', 'performance_monitoring'],
      enabled: true,
      concurrency: 1,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 2000,
        backoffMultiplier: 2,
      },
    });
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const config: AuditConfig = {
      runType: (payload.runType as AuditConfig['runType']) || 'full',
      skipModules: payload.skipModules as string[] | undefined,
    };

    console.log(`[WebsiteAuditor] Starting ${config.runType} audit...`);
    this.metrics = {
      startTime: Date.now(),
      pagesScanned: 0,
      linksChecked: 0,
      translationsChecked: 0,
      contentItemsChecked: 0,
    };
    this.findings = [];

    try {
      const audit = await storage.createWebsiteAudit({
        runType: config.runType,
        status: 'running',
        triggeredBy: (payload.triggeredBy as string) || 'manual',
      });
      this.auditId = audit.id;
      console.log(`[WebsiteAuditor] Created audit record: ${this.auditId}`);

      const modulesToRun = this.getModulesToRun(config);
      console.log(`[WebsiteAuditor] Running modules: ${modulesToRun.join(', ')}`);

      for (const module of modulesToRun) {
        try {
          await this.runModule(module);
        } catch (error) {
          console.error(`[WebsiteAuditor] Module ${module} failed:`, error);
          this.addFinding({
            category: 'system',
            issueType: 'module_error',
            severity: 'medium',
            details: { module, error: String(error) },
            recommendation: `Review ${module} module for errors`,
          });
        }
      }

      this.metrics.endTime = Date.now();
      this.metrics.executionTimeMs = this.metrics.endTime - this.metrics.startTime;

      const savedFindings = await this.saveFindings();

      const severityCounts = this.countBySeverity();
      await storage.updateWebsiteAudit(this.auditId, {
        status: 'completed',
        completedAt: new Date(),
        pagesScanned: this.metrics.pagesScanned,
        linksChecked: this.metrics.linksChecked,
        translationsChecked: this.metrics.translationsChecked,
        issuesFound: this.findings.length,
        criticalCount: severityCounts.critical,
        highCount: severityCounts.high,
        mediumCount: severityCounts.medium,
        lowCount: severityCounts.low,
        metrics: this.metrics as any,
      });

      console.log(`[WebsiteAuditor] Audit completed. Found ${this.findings.length} issues.`);

      return {
        success: true,
        data: {
          auditId: this.auditId,
          findings: savedFindings.length,
          severityCounts,
          metrics: this.metrics,
        },
      };
    } catch (error) {
      console.error(`[WebsiteAuditor] Audit failed:`, error);
      
      if (this.auditId) {
        await storage.updateWebsiteAudit(this.auditId, {
          status: 'failed',
          completedAt: new Date(),
        });
      }

      return {
        success: false,
        error: String(error),
      };
    }
  }

  private getModulesToRun(config: AuditConfig): string[] {
    const allModules = ['translations', 'content', 'seo', 'links'];
    const skipModules = config.skipModules || [];

    switch (config.runType) {
      case 'links_only':
        return ['links'];
      case 'translations_only':
        return ['translations'];
      case 'seo_only':
        return ['seo'];
      case 'content_only':
        return ['content'];
      case 'delta':
      case 'full':
      default:
        return allModules.filter(m => !skipModules.includes(m));
    }
  }

  private async runModule(module: string): Promise<void> {
    console.log(`[WebsiteAuditor] Running ${module} module...`);
    
    switch (module) {
      case 'translations':
        await this.auditTranslations();
        break;
      case 'content':
        await this.auditContent();
        break;
      case 'seo':
        await this.auditSEO();
        break;
      case 'links':
        await this.auditLinks();
        break;
      default:
        console.warn(`[WebsiteAuditor] Unknown module: ${module}`);
    }
  }

  private async auditTranslations(): Promise<void> {
    console.log('[WebsiteAuditor] Auditing translations...');
    
    const [teamMembers, practiceGroups, industryGroups, newsItems] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
      storage.getNews(),
    ]);

    for (const member of teamMembers) {
      this.metrics.translationsChecked++;
      await this.checkTeamMemberTranslations(member);
    }

    for (const pg of practiceGroups) {
      this.metrics.translationsChecked++;
      await this.checkPracticeGroupTranslations(pg);
    }

    for (const ig of industryGroups) {
      this.metrics.translationsChecked++;
      await this.checkIndustryGroupTranslations(ig);
    }

    for (const news of newsItems) {
      this.metrics.translationsChecked++;
      await this.checkNewsTranslations(news);
    }

    console.log(`[WebsiteAuditor] Checked ${this.metrics.translationsChecked} items for translations`);
  }

  private async checkTeamMemberTranslations(member: TeamMember): Promise<void> {
    const requiredFields = ['bio', 'title', 'role'];
    
    for (const field of requiredFields) {
      const esField = `${field}Es` as keyof TeamMember;
      const enValue = member[field as keyof TeamMember];
      const esValue = member[esField];

      if (enValue && !esValue) {
        this.addFinding({
          category: 'translations',
          issueType: 'missing_translation',
          severity: 'high',
          entityType: 'team_member',
          entityId: member.id,
          language: 'es',
          details: {
            field,
            name: member.name,
            englishValue: String(enValue).substring(0, 100),
          },
          recommendation: `Add Spanish translation for ${field} of ${member.name}`,
          ownerAgent: 'polyglot_translator',
        });
      }

      if (esValue && !enValue) {
        this.addFinding({
          category: 'translations',
          issueType: 'missing_translation',
          severity: 'high',
          entityType: 'team_member',
          entityId: member.id,
          language: 'en',
          details: {
            field: esField,
            name: member.name,
            spanishValue: String(esValue).substring(0, 100),
          },
          recommendation: `Add English translation for ${field} of ${member.name}`,
          ownerAgent: 'polyglot_translator',
        });
      }
    }
  }

  private async checkPracticeGroupTranslations(pg: PracticeGroup): Promise<void> {
    const fields = [
      { en: 'name', es: 'nameEs' },
      { en: 'description', es: 'descriptionEs' },
    ];

    for (const { en, es } of fields) {
      const enValue = pg[en as keyof PracticeGroup];
      const esValue = pg[es as keyof PracticeGroup];

      if (enValue && !esValue) {
        this.addFinding({
          category: 'translations',
          issueType: 'missing_translation',
          severity: 'high',
          entityType: 'practice_group',
          entityId: pg.id,
          language: 'es',
          details: { field: en, groupName: pg.name },
          recommendation: `Add Spanish translation for ${en} of practice group "${pg.name}"`,
          ownerAgent: 'polyglot_translator',
        });
      }
    }
  }

  private async checkIndustryGroupTranslations(ig: IndustryGroup): Promise<void> {
    const fields = [
      { en: 'name', es: 'nameEs' },
      { en: 'description', es: 'descriptionEs' },
    ];

    for (const { en, es } of fields) {
      const enValue = ig[en as keyof IndustryGroup];
      const esValue = ig[es as keyof IndustryGroup];

      if (enValue && !esValue) {
        this.addFinding({
          category: 'translations',
          issueType: 'missing_translation',
          severity: 'high',
          entityType: 'industry_group',
          entityId: ig.id,
          language: 'es',
          details: { field: en, groupName: ig.name },
          recommendation: `Add Spanish translation for ${en} of industry group "${ig.name}"`,
          ownerAgent: 'polyglot_translator',
        });
      }
    }
  }

  private async checkNewsTranslations(newsItem: News): Promise<void> {
    const translations = await storage.getNewsTranslations(newsItem.id);
    const translatedLanguages = new Set(translations.map(t => t.language));
    
    const missingLanguages = SUPPORTED_LANGUAGES.filter(
      lang => lang !== 'es' && !translatedLanguages.has(lang)
    );

    if (missingLanguages.length > 0) {
      const severity = missingLanguages.length >= 5 ? 'high' : 'medium';
      
      this.addFinding({
        category: 'translations',
        issueType: 'missing_translation',
        severity,
        entityType: 'news',
        entityId: newsItem.id,
        details: {
          title: newsItem.title,
          slug: newsItem.slug,
          missingLanguages,
          translatedCount: translatedLanguages.size,
          totalRequired: SUPPORTED_LANGUAGES.length,
        },
        recommendation: `Translate news article "${newsItem.title}" to: ${missingLanguages.join(', ')}`,
        ownerAgent: 'polyglot_translator',
      });
    }
  }

  private async auditContent(): Promise<void> {
    console.log('[WebsiteAuditor] Auditing content completeness...');
    
    const [teamMembers, practiceGroups, industryGroups] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
    ]);

    for (const member of teamMembers) {
      this.metrics.contentItemsChecked++;
      await this.checkTeamMemberContent(member);
    }

    for (const pg of practiceGroups) {
      this.metrics.contentItemsChecked++;
      await this.checkPracticeGroupContent(pg);
    }

    for (const ig of industryGroups) {
      this.metrics.contentItemsChecked++;
      await this.checkIndustryGroupContent(ig);
    }

    console.log(`[WebsiteAuditor] Checked ${this.metrics.contentItemsChecked} items for content completeness`);
  }

  private async checkTeamMemberContent(member: TeamMember): Promise<void> {
    const issues: string[] = [];

    if (!member.bio || member.bio.length < 50) {
      issues.push('Missing or short biography');
    }

    if (!member.imageUrl) {
      issues.push('Missing profile photo');
    }

    if (!member.email) {
      issues.push('Missing email');
    }

    if (!member.phone) {
      issues.push('Missing phone number');
    }


    if (!member.education || (member.education as any[]).length === 0) {
      issues.push('No education listed');
    }

    if (!member.barAdmissions || (member.barAdmissions as any[]).length === 0) {
      issues.push('No bar admissions listed');
    }

    if (issues.length > 0) {
      const severity = issues.length >= 3 ? 'high' : 'medium';
      
      this.addFinding({
        category: 'content',
        issueType: 'incomplete_profile',
        severity,
        entityType: 'team_member',
        entityId: member.id,
        url: `/equipo/${member.slug}`,
        details: {
          name: member.name,
          role: member.role,
          issues,
          completionScore: Math.round((1 - issues.length / 7) * 100),
        },
        recommendation: `Complete profile for ${member.name}: ${issues.join(', ')}`,
        ownerAgent: 'metadata_linker',
      });
    }
  }

  private async checkPracticeGroupContent(pg: PracticeGroup): Promise<void> {
    const issues: string[] = [];

    if (!pg.description || pg.description.length < 100) {
      issues.push('Missing or short description');
    }

    if (issues.length > 0) {
      this.addFinding({
        category: 'content',
        issueType: 'empty_section',
        severity: 'high',
        entityType: 'practice_group',
        entityId: pg.id,
        url: `/practica/${pg.slug}`,
        details: {
          name: pg.name,
          issues,
        },
        recommendation: `Complete practice group "${pg.name}": ${issues.join(', ')}`,
        ownerAgent: 'metadata_linker',
      });
    }
  }

  private async checkIndustryGroupContent(ig: IndustryGroup): Promise<void> {
    const issues: string[] = [];

    if (!ig.description || ig.description.length < 100) {
      issues.push('Missing or short description');
    }

    if (issues.length > 0) {
      this.addFinding({
        category: 'content',
        issueType: 'empty_section',
        severity: 'high',
        entityType: 'industry_group',
        entityId: ig.id,
        url: `/industria/${ig.slug}`,
        details: {
          name: ig.name,
          issues,
        },
        recommendation: `Complete industry group "${ig.name}": ${issues.join(', ')}`,
        ownerAgent: 'metadata_linker',
      });
    }
  }

  private async auditSEO(): Promise<void> {
    console.log('[WebsiteAuditor] Auditing SEO...');
    
    const newsItems = await storage.getNews();

    for (const news of newsItems) {
      this.metrics.pagesScanned++;
      await this.checkNewsSEO(news);
    }

    const teamMembers = await storage.getTeamMembers();
    for (const member of teamMembers) {
      this.metrics.pagesScanned++;
      await this.checkTeamMemberSEO(member);
    }

    console.log(`[WebsiteAuditor] Scanned ${this.metrics.pagesScanned} pages for SEO`);
  }

  private async checkNewsSEO(news: News): Promise<void> {
    const issues: string[] = [];

    if (!news.title || news.title.length < 20) {
      issues.push('Title too short for SEO');
    }

    if (!news.excerpt || news.excerpt.length < 50) {
      issues.push('Excerpt/meta description too short');
    }

    if (!news.slug) {
      issues.push('Missing SEO-friendly slug');
    }

    if (!news.imageUrl) {
      issues.push('Missing featured image');
    }

    if (issues.length > 0) {
      this.addFinding({
        category: 'seo',
        issueType: 'missing_description',
        severity: 'medium',
        entityType: 'news',
        entityId: news.id,
        url: `/noticias/${news.slug}`,
        details: {
          title: news.title,
          issues,
          titleLength: news.title?.length || 0,
          excerptLength: news.excerpt?.length || 0,
        },
        recommendation: `Improve SEO for article "${news.title}": ${issues.join(', ')}`,
        ownerAgent: 'seo_optimizer',
      });
    }
  }

  private async checkTeamMemberSEO(member: TeamMember): Promise<void> {
    const issues: string[] = [];

    if (!member.slug) {
      issues.push('Missing SEO-friendly slug');
    }

    if (!member.bio || member.bio.length < 100) {
      issues.push('Bio too short for proper meta description');
    }

    if (issues.length > 0) {
      this.addFinding({
        category: 'seo',
        issueType: 'missing_description',
        severity: 'low',
        entityType: 'team_member',
        entityId: member.id,
        url: `/equipo/${member.slug}`,
        details: {
          name: member.name,
          issues,
        },
        recommendation: `Improve SEO for ${member.name}: ${issues.join(', ')}`,
        ownerAgent: 'seo_optimizer',
      });
    }
  }

  private async auditLinks(): Promise<void> {
    console.log('[WebsiteAuditor] Auditing links...');
    
    const teamMembers = await storage.getTeamMembers();

    for (const member of teamMembers) {
      if (member.imageUrl) {
        this.metrics.linksChecked++;
        const isValid = await this.checkImageUrl(member.imageUrl);
        
        if (!isValid) {
          this.addFinding({
            category: 'links',
            issueType: 'broken_link',
            severity: 'critical',
            entityType: 'team_member',
            entityId: member.id,
            url: member.imageUrl,
            details: {
              name: member.name,
              imageUrl: member.imageUrl,
              type: 'profile_photo',
            },
            recommendation: `Fix broken profile photo for ${member.name}`,
          });
        }
      }
    }

    const newsItems = await storage.getNews();
    for (const news of newsItems) {
      if (news.imageUrl) {
        this.metrics.linksChecked++;
        const isValid = await this.checkImageUrl(news.imageUrl);
        
        if (!isValid) {
          this.addFinding({
            category: 'links',
            issueType: 'broken_link',
            severity: 'high',
            entityType: 'news',
            entityId: news.id,
            url: news.imageUrl,
            details: {
              title: news.title,
              imageUrl: news.imageUrl,
              type: 'featured_image',
            },
            recommendation: `Fix broken featured image for article "${news.title}"`,
          });
        }
      }
    }

    console.log(`[WebsiteAuditor] Checked ${this.metrics.linksChecked} links`);
  }

  private async checkImageUrl(url: string): Promise<boolean> {
    try {
      if (url.startsWith('/')) {
        return true;
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private addFinding(finding: FindingData): void {
    this.findings.push(finding);
  }

  private async saveFindings(): Promise<InsertWebsiteAuditFinding[]> {
    if (this.findings.length === 0) return [];

    const insertFindings: InsertWebsiteAuditFinding[] = this.findings.map(f => ({
      auditId: this.auditId,
      category: f.category,
      issueType: f.issueType,
      severity: f.severity,
      status: 'open',
      entityType: f.entityType,
      entityId: f.entityId,
      language: f.language,
      url: f.url,
      details: f.details,
      recommendation: f.recommendation,
      ownerAgent: f.ownerAgent,
    }));

    await storage.createWebsiteAuditFindings(insertFindings);
    return insertFindings;
  }

  private countBySeverity(): { critical: number; high: number; medium: number; low: number } {
    return {
      critical: this.findings.filter(f => f.severity === 'critical').length,
      high: this.findings.filter(f => f.severity === 'high').length,
      medium: this.findings.filter(f => f.severity === 'medium').length,
      low: this.findings.filter(f => f.severity === 'low').length,
    };
  }
}

export const websiteAuditorAgent = new WebsiteAuditorAgent();
