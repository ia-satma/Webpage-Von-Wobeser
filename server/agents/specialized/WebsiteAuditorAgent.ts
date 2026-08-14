import { BaseAgent } from '../core/BaseAgent';
import { AgentResult, ExecutionContext, AgentType } from '../core/types';
import { orchestrator } from '../core/AgentOrchestrator';
import { storage } from '../../storage';
import { getConfigMap } from '../../mirror/siteConfig';
import { fetchStatusWithPolicy } from '../../security/network';
import type { InsertWebsiteAuditFinding, WebsiteAuditFinding, TeamMember, PracticeGroup, IndustryGroup, News } from '@shared/schema';
import { publicImageAssetExists } from './websiteAuditMedia';
import {
  industryGroupContentIssues,
  isPublishedEntity,
  isPublicNews,
  newsSeoIssues,
  practiceGroupContentIssues,
  teamMemberContentIssues,
} from './websiteAuditPolicy';

const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'];

// Lee `active_languages` de site_config (default "es,en") — solo se piden/reportan hallazgos
// de traducción faltante para los idiomas realmente en uso, no los 10 soportados por el
// traductor. Ver [[vonwobeser-cobertura-idioma]]: sin este filtro, el auditor re-encolaba
// miles de trabajos de polyglot_translator para idiomas que el cliente no usa.
async function getActiveLanguages(): Promise<string[]> {
  const config = await getConfigMap();
  const raw = config.active_languages?.value || 'es,en';
  const active = raw.split(',').map((s) => s.trim()).filter((c) => SUPPORTED_LANGUAGES.includes(c));
  return active.length > 0 ? active : ['es', 'en'];
}

// Fallback usado en toda la app cuando una imagen no carga (server/agents/AutoRecoveryAgent.ts,
// SmartImageGenerator.ts) — mismo asset, así el auto-fix no introduce un placeholder distinto.
const FALLBACK_IMAGE = '/placeholder-article.svg';

// polyglot_translator / seo_optimizer / metadata_linker SOLO operan sobre `news` (esperan
// `{articleId}` y hacen `db.select().from(news)`). Los findings de team_member/practice_group/
// industry_group traen el mismo `ownerAgent` mnemónico pero esos agentes NO los pueden procesar
// hoy — encolarlos fallaría en silencio. Por eso el auto-encolado se limita a entityType 'news'.
const AUTO_ENQUEUE_ENTITY_TYPE = 'news';

interface AuditConfig {
  runType: 'full' | 'delta' | 'links_only' | 'translations_only' | 'seo_only' | 'content_only';
  skipModules?: string[];
  applyChanges?: boolean;
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
  /** Cuando el auto-fix ya se aplicó al detectar (p.ej. imagen rota -> fallback). */
  status?: 'open' | 'resolved';
  resolvedBy?: string;
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
  private allowChanges = false;

  constructor() {
    super({
      agentType: 'website_auditor',
      name: 'Website Auditor Agent',
      description: 'Comprehensive website quality auditor - checks links, translations, content completeness, SEO, and performance',
      systemPrompt: `You are a website quality auditor for a corporate law firm website.
Your role is to identify issues that affect user experience, SEO, and content quality.
Focus on: broken links, missing translations, incomplete lawyer profiles, SEO gaps, and content issues.
Be thorough but prioritize critical issues that directly impact users.`,
      model: 'structural-no-llm',
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
      applyChanges: payload.applyChanges === true,
    };
    this.allowChanges = config.applyChanges === true;

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
      const completedModules: string[] = [];
      console.log(`[WebsiteAuditor] Running modules: ${modulesToRun.join(', ')}`);

      for (const module of modulesToRun) {
        try {
          await this.runModule(module);
          completedModules.push(module);
        } catch (error) {
          console.error(`[WebsiteAuditor] Module ${module} failed:`, error);
          this.addFinding({
            category: 'system',
            issueType: 'module_error',
            severity: 'medium',
            details: { module, error: "Module execution failed" },
            recommendation: `Review ${module} module for errors`,
          });
        }
      }

      this.metrics.endTime = Date.now();
      this.metrics.executionTimeMs = this.metrics.endTime - this.metrics.startTime;

      const savedFindings = await this.saveFindings();
      const supersededCount = await storage.supersedeOpenWebsiteAuditFindings(
        this.auditId,
        completedModules,
      );
      if (supersededCount > 0) {
        console.log(`[WebsiteAuditor] Superseded ${supersededCount} findings from earlier audits.`);
      }
      // Un diagnóstico debe limitarse a registrar hallazgos. Encolar agentes consume
      // recursos y crea trabajo persistente, por lo que solo está permitido cuando la
      // ejecución recibió autorización explícita para aplicar cambios.
      if (this.allowChanges) {
        await this.autoEnqueueNewsFixers(savedFindings);
      }

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
        error: "Website audit failed",
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
    
    const [allTeamMembers, allPracticeGroups, allIndustryGroups, allNewsItems] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
      storage.getNews(),
    ]);
    const teamMembers = allTeamMembers.filter(isPublishedEntity);
    const practiceGroups = allPracticeGroups.filter(isPublishedEntity);
    const industryGroups = allIndustryGroups.filter(isPublishedEntity);
    const newsItems = allNewsItems.filter((item) => isPublicNews(item));

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

    const activeLanguages = await getActiveLanguages();
    for (const news of newsItems) {
      this.metrics.translationsChecked++;
      await this.checkNewsTranslations(news, activeLanguages);
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
      { en: 'fullDescription', es: 'fullDescriptionEs' },
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
      { en: 'fullDescription', es: 'fullDescriptionEs' },
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

  private async checkNewsTranslations(newsItem: News, activeLanguages: string[]): Promise<void> {
    const translations = await storage.getNewsTranslations(newsItem.id);
    const translatedLanguages = new Set(translations.map(t => t.language));

    const missingLanguages = activeLanguages.filter(
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
          totalRequired: activeLanguages.length,
        },
        recommendation: `Translate news article "${newsItem.title}" to: ${missingLanguages.join(', ')}`,
        ownerAgent: 'polyglot_translator',
      });
    }
  }

  private async auditContent(): Promise<void> {
    console.log('[WebsiteAuditor] Auditing content completeness...');
    
    const [allTeamMembers, allPracticeGroups, allIndustryGroups] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
    ]);
    const teamMembers = allTeamMembers.filter(isPublishedEntity);
    const practiceGroups = allPracticeGroups.filter(isPublishedEntity);
    const industryGroups = allIndustryGroups.filter(isPublishedEntity);

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
    const issues = teamMemberContentIssues(member);

    if (issues.length > 0) {
      const severity = issues.length >= 3 ? 'high' : 'medium';
      
      this.addFinding({
        category: 'content',
        issueType: 'incomplete_profile',
        severity,
        entityType: 'team_member',
        entityId: member.id,
        url: `/abogado/${member.slug}`,
        details: {
          name: member.name,
          role: member.role,
          issues,
          completionScore: Math.max(0, Math.round((1 - issues.length / 5) * 100)),
        },
        recommendation: `Complete profile for ${member.name}: ${issues.join(', ')}`,
        ownerAgent: 'metadata_linker',
      });
    }
  }

  private async checkPracticeGroupContent(pg: PracticeGroup): Promise<void> {
    const issues = practiceGroupContentIssues(pg);

    if (issues.length > 0) {
      this.addFinding({
        category: 'content',
        issueType: 'empty_section',
        severity: 'high',
        entityType: 'practice_group',
        entityId: pg.id,
        url: `/practice/${pg.slug}`,
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
    const issues = industryGroupContentIssues(ig);

    if (issues.length > 0) {
      this.addFinding({
        category: 'content',
        issueType: 'empty_section',
        severity: 'high',
        entityType: 'industry_group',
        entityId: ig.id,
        url: `/industry/${ig.slug}`,
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
    
    const newsItems = (await storage.getNews()).filter((item) => isPublicNews(item));

    for (const news of newsItems) {
      this.metrics.pagesScanned++;
      await this.checkNewsSEO(news);
    }

    const teamMembers = (await storage.getTeamMembers()).filter(isPublishedEntity);
    for (const member of teamMembers) {
      this.metrics.pagesScanned++;
      await this.checkTeamMemberSEO(member);
    }

    console.log(`[WebsiteAuditor] Scanned ${this.metrics.pagesScanned} pages for SEO`);
  }

  private async checkNewsSEO(news: News): Promise<void> {
    for (const seoIssue of newsSeoIssues(news)) {
      this.addFinding({
        category: 'seo',
        issueType: seoIssue.issueType,
        severity: seoIssue.severity,
        entityType: 'news',
        entityId: news.id,
        url: `/news/${news.slug}`,
        details: {
          title: news.title,
          issues: [seoIssue.issue],
          titleLength: news.title?.length || 0,
          excerptLength: news.excerpt?.length || 0,
        },
        recommendation: seoIssue.recommendation,
        ownerAgent: seoIssue.ownerAgent,
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
        url: `/abogado/${member.slug}`,
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
    
    const teamMembers = (await storage.getTeamMembers()).filter(isPublishedEntity);

    for (const member of teamMembers) {
      if (member.imageUrl) {
        this.metrics.linksChecked++;
        const isValid = await this.checkImageUrl(member.imageUrl);

        if (!isValid) {
          const autoFixed = await this.tryApplyImageFallback('team_member', member.id, member.imageUrl);
          this.addFinding({
            category: 'links',
            issueType: 'broken_link',
            severity: 'critical',
            entityType: 'team_member',
            entityId: member.id,
            url: `/abogado/${member.slug}`,
            details: {
              name: member.name,
              imageUrl: member.imageUrl,
              type: 'profile_photo',
              autoFixed,
              ...(autoFixed ? { appliedFallback: FALLBACK_IMAGE } : {}),
            },
            recommendation: autoFixed
              ? `Foto de perfil rota reemplazada automáticamente por el placeholder para ${member.name}; sube una foto real cuando puedas.`
              : `Fix broken profile photo for ${member.name}`,
            ...(autoFixed ? { status: 'resolved', resolvedBy: 'auto' } : {}),
          });
        }
      }
    }

    const newsItems = (await storage.getNews()).filter((item) => isPublicNews(item));
    for (const news of newsItems) {
      if (news.imageUrl) {
        this.metrics.linksChecked++;
        const isValid = await this.checkImageUrl(news.imageUrl);

        if (!isValid) {
          const autoFixed = await this.tryApplyImageFallback('news', news.id, news.imageUrl);
          this.addFinding({
            category: 'links',
            issueType: 'broken_link',
            severity: 'high',
            entityType: 'news',
            entityId: news.id,
            url: `/news/${news.slug}`,
            details: {
              title: news.title,
              imageUrl: news.imageUrl,
              type: 'featured_image',
              autoFixed,
              ...(autoFixed ? { appliedFallback: FALLBACK_IMAGE } : {}),
            },
            recommendation: autoFixed
              ? `Imagen destacada rota reemplazada automáticamente por el placeholder en "${news.title}"; sube una imagen real cuando puedas.`
              : `Fix broken featured image for article "${news.title}"`,
            ...(autoFixed ? { status: 'resolved', resolvedBy: 'auto' } : {}),
          });
        }
      }
    }

    console.log(`[WebsiteAuditor] Checked ${this.metrics.linksChecked} links`);
  }

  private async checkImageUrl(url: string): Promise<boolean> {
    try {
      if (url.startsWith('/')) {
        return publicImageAssetExists(url);
      }
      const status = await fetchStatusWithPolicy({
        url,
        // Las imágenes editoriales pueden vivir en distintos CDN públicos. La
        // política común valida DNS/IP antes de cada destino y redirección.
        isAllowedHostname: () => true,
        timeoutMs: 5_000,
        maxRedirects: 2,
      });
      return (status >= 200 && status < 400);
    } catch {
      return false;
    }
  }

  private addFinding(finding: FindingData): void {
    this.findings.push(finding);
  }

  /**
   * Auto-fix seguro #1: reemplaza una imagen caída (team_member/news) por el placeholder
   * estándar de la app. Es reversible (el editor solo tiene que subir la foto real) y no
   * requiere ningún juicio editorial, a diferencia de reescribir un enlace roto. Devuelve
   * true si el reemplazo se aplicó.
   */
  private async tryApplyImageFallback(
    entityType: 'team_member' | 'news',
    entityId: string,
    brokenUrl: string,
  ): Promise<boolean> {
    if (!this.allowChanges) return false;
    if (brokenUrl === FALLBACK_IMAGE) return false; // ya es el placeholder, nada que hacer
    try {
      if (entityType === 'team_member') {
        await storage.updateTeamMember(entityId, { imageUrl: FALLBACK_IMAGE });
      } else {
        await storage.updateNews(entityId, { imageUrl: FALLBACK_IMAGE });
      }
      return true;
    } catch (e) {
      console.warn('[WebsiteAuditor] No se pudo aplicar el fallback de imagen', entityType, entityId, e);
      return false;
    }
  }

  private async saveFindings(): Promise<WebsiteAuditFinding[]> {
    if (this.findings.length === 0) return [];

    const now = new Date();
    const insertFindings: InsertWebsiteAuditFinding[] = this.findings.map(f => ({
      auditId: this.auditId,
      category: f.category,
      issueType: f.issueType,
      severity: f.severity,
      status: f.status || 'open',
      entityType: f.entityType,
      entityId: f.entityId,
      language: f.language,
      url: f.url,
      details: f.details,
      recommendation: f.recommendation,
      ownerAgent: f.ownerAgent,
      ...(f.status === 'resolved' ? { resolvedAt: now, resolvedBy: f.resolvedBy } : {}),
    }));

    // Insertar por lotes: con miles de hallazgos, un solo insert excede el límite de Neon.
    const saved: WebsiteAuditFinding[] = [];
    for (let i = 0; i < insertFindings.length; i += 200) {
      saved.push(...(await storage.createWebsiteAuditFindings(insertFindings.slice(i, i + 200))));
    }
    return saved;
  }

  /**
   * Auto-fix seguro #2: para findings de noticias que ya nombran al agente responsable
   * (polyglot_translator/seo_optimizer), los encola en el orquestador existente y guarda el
   * job id en `remediationJobId`. Se limita a entityType 'news' porque esos 3 agentes solo
   * saben procesar noticias (esperan {articleId} y hacen SELECT sobre la tabla news) — encolar
   * para team_member/practice_group/industry_group fallaría en silencio (no encontrarían la
   * fila), así que esos quedan como findings manuales, igual que antes.
   */
  private async autoEnqueueNewsFixers(saved: WebsiteAuditFinding[]): Promise<void> {
    const candidates = saved.filter(
      (f) => f.entityType === AUTO_ENQUEUE_ENTITY_TYPE && f.ownerAgent && f.status === 'open' && f.entityId,
    );
    if (!candidates.length) return;

    const jobIdByKey = new Map<string, string>();
    for (const finding of candidates) {
      const key = `${finding.ownerAgent}:${finding.entityId}`;
      try {
        let jobId = jobIdByKey.get(key);
        if (!jobId) {
          const job = await orchestrator.enqueueJob(finding.ownerAgent as AgentType, { articleId: finding.entityId });
          jobId = job.id;
          jobIdByKey.set(key, jobId);
        }
        await storage.updateWebsiteAuditFinding(finding.id, { remediationJobId: jobId, status: 'in_progress' });
      } catch (e) {
        console.warn('[WebsiteAuditor] No se pudo encolar el agente dueño', finding.ownerAgent, finding.entityId, e);
      }
    }
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
