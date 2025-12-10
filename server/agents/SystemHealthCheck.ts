import { db } from '../db';
import { 
  news, 
  newsTranslations, 
  teamMembers, 
  agentJobs, 
  mediaItems,
  translationCache 
} from '@shared/schema';
import { eq, lt, and, isNull, or, sql } from 'drizzle-orm';

export interface HealthIssue {
  id: string;
  type: 'zombie_process' | 'incomplete_success' | 'localization_leakage' | 'orphaned_asset' | 'missing_translation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  entityType: 'article' | 'team_member' | 'agent_job' | 'media';
  entityId: string;
  title: string;
  details: string;
  suggestedAction: string;
  detectedAt: Date;
}

export interface AuditReport {
  runId: string;
  runAt: Date;
  durationMs: number;
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    zombieProcesses: number;
    incompleteSuccess: number;
    localizationLeakage: number;
    orphanedAssets: number;
    missingTranslations: number;
  };
  issues: HealthIssue[];
  healthScore: number;
}

const SPANISH_INDICATORS = [
  /\b(el|la|los|las|de|del|en|con|por|para|que|una?|este?|esta)\b/gi,
  /\b(también|además|según|así|más|año|años)\b/gi,
  /\b(derecho|abogado|licenciado|socio|firma|empresa)\b/gi,
  /[áéíóúñü]/gi,
];

const GERMAN_INDICATORS = [
  /\b(der|die|das|und|ist|von|mit|für|auf|bei|nach)\b/gi,
  /\b(Recht|Rechtsanwalt|Partner|Gesellschaft|Unternehmen)\b/gi,
  /[äöüß]/gi,
];

function detectLanguage(text: string): 'es' | 'de' | 'en' | 'unknown' {
  if (!text || text.trim().length < 20) return 'unknown';
  
  const lowerText = text.toLowerCase();
  
  let spanishScore = 0;
  let germanScore = 0;
  
  for (const pattern of SPANISH_INDICATORS) {
    const matches = lowerText.match(pattern);
    if (matches) spanishScore += matches.length;
  }
  
  for (const pattern of GERMAN_INDICATORS) {
    const matches = lowerText.match(pattern);
    if (matches) germanScore += matches.length;
  }
  
  const textLength = text.length;
  const spanishDensity = spanishScore / (textLength / 100);
  const germanDensity = germanScore / (textLength / 100);
  
  if (spanishDensity > 2 && spanishDensity > germanDensity * 1.5) return 'es';
  if (germanDensity > 1 && germanDensity > spanishDensity * 1.5) return 'de';
  
  return 'en';
}

export class SystemHealthCheck {
  private issues: HealthIssue[] = [];

  async runDeepAudit(): Promise<AuditReport> {
    const startTime = Date.now();
    const runId = `audit-${Date.now()}`;
    this.issues = [];

    console.log('[SystemHealthCheck] Starting deep audit...');

    await Promise.all([
      this.checkZombieProcesses(),
      this.checkIncompleteSuccess(),
      this.checkLocalizationLeakage(),
      this.checkOrphanedAssets(),
      this.checkMissingTranslations(),
    ]);

    const durationMs = Date.now() - startTime;

    const summary = {
      totalIssues: this.issues.length,
      criticalCount: this.issues.filter(i => i.severity === 'critical').length,
      highCount: this.issues.filter(i => i.severity === 'high').length,
      mediumCount: this.issues.filter(i => i.severity === 'medium').length,
      lowCount: this.issues.filter(i => i.severity === 'low').length,
      zombieProcesses: this.issues.filter(i => i.type === 'zombie_process').length,
      incompleteSuccess: this.issues.filter(i => i.type === 'incomplete_success').length,
      localizationLeakage: this.issues.filter(i => i.type === 'localization_leakage').length,
      orphanedAssets: this.issues.filter(i => i.type === 'orphaned_asset').length,
      missingTranslations: this.issues.filter(i => i.type === 'missing_translation').length,
    };

    const maxPossibleIssues = 100;
    const weightedIssues = 
      summary.criticalCount * 10 + 
      summary.highCount * 5 + 
      summary.mediumCount * 2 + 
      summary.lowCount * 1;
    const healthScore = Math.max(0, Math.round(100 - (weightedIssues / maxPossibleIssues) * 100));

    const report: AuditReport = {
      runId,
      runAt: new Date(),
      durationMs,
      summary,
      issues: this.issues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      healthScore,
    };

    console.log(`[SystemHealthCheck] Audit complete. Found ${summary.totalIssues} issues. Health score: ${healthScore}%`);
    console.log(`[SystemHealthCheck] Zombies: ${summary.zombieProcesses}, Incomplete: ${summary.incompleteSuccess}, Leakage: ${summary.localizationLeakage}, Orphans: ${summary.orphanedAssets}`);

    return report;
  }

  private async checkZombieProcesses(): Promise<void> {
    console.log('[SystemHealthCheck] Checking for zombie processes...');
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    try {
      const stuckJobs = await db.select()
        .from(agentJobs)
        .where(
          and(
            eq(agentJobs.status, 'in_progress'),
            lt(agentJobs.startedAt, tenMinutesAgo)
          )
        );

      for (const job of stuckJobs) {
        const stuckMinutes = job.startedAt 
          ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / 60000)
          : 'unknown';
        
        this.issues.push({
          id: `zombie-${job.id}`,
          type: 'zombie_process',
          severity: 'critical',
          entityType: 'agent_job',
          entityId: job.id,
          title: `Stuck ${job.agentType} job`,
          details: `Job has been "in_progress" for ${stuckMinutes} minutes. Payload: ${JSON.stringify(job.payload).substring(0, 100)}...`,
          suggestedAction: `Cancel job ${job.id} and restart if needed`,
          detectedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('[SystemHealthCheck] Error checking zombie processes:', error);
    }
  }

  private async checkIncompleteSuccess(): Promise<void> {
    console.log('[SystemHealthCheck] Checking for incomplete success states...');
    
    try {
      const articles = await db.select().from(news);
      
      for (const article of articles) {
        const issues: string[] = [];
        
        if (!article.imageUrl || article.imageUrl.trim() === '') {
          issues.push('missing imageUrl');
        }
        
        if (!article.content || article.content.trim() === '') {
          issues.push('missing English content');
        }
        
        if (!article.title || article.title.trim() === '') {
          issues.push('missing English title');
        }
        
        if (issues.length > 0) {
          this.issues.push({
            id: `incomplete-${article.id}`,
            type: 'incomplete_success',
            severity: issues.includes('missing English content') ? 'high' : 'medium',
            entityType: 'article',
            entityId: article.id,
            title: article.title || article.titleEs || 'Unknown article',
            details: `Article marked as ready but has: ${issues.join(', ')}`,
            suggestedAction: issues.includes('missing imageUrl') 
              ? 'Run ImageSuggestionAgent to generate image'
              : 'Review article content and fill missing fields',
            detectedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('[SystemHealthCheck] Error checking incomplete success:', error);
    }
  }

  private async checkLocalizationLeakage(): Promise<void> {
    console.log('[SystemHealthCheck] Checking for localization leakage...');
    
    try {
      const members = await db.select().from(teamMembers);
      
      for (const member of members) {
        if (member.bio) {
          const detectedLang = detectLanguage(member.bio);
          
          if (detectedLang === 'es') {
            this.issues.push({
              id: `leakage-bio-${member.id}`,
              type: 'localization_leakage',
              severity: 'high',
              entityType: 'team_member',
              entityId: member.id,
              title: `${member.name}: English bio contains Spanish`,
              details: `Bio field (English) appears to contain Spanish content. Snippet: "${member.bio.substring(0, 100)}..."`,
              suggestedAction: 'Swap bio and bioEs fields or translate bio to English',
              detectedAt: new Date(),
            });
          }
        }
        
        if (member.bioEs) {
          const detectedLang = detectLanguage(member.bioEs);
          
          if (detectedLang === 'en') {
            this.issues.push({
              id: `leakage-bioEs-${member.id}`,
              type: 'localization_leakage',
              severity: 'high',
              entityType: 'team_member',
              entityId: member.id,
              title: `${member.name}: Spanish bio contains English`,
              details: `BioEs field (Spanish) appears to contain English content. Snippet: "${member.bioEs.substring(0, 100)}..."`,
              suggestedAction: 'Swap bioEs and bio fields or translate bioEs to Spanish',
              detectedAt: new Date(),
            });
          }
        }

        if (!member.bio && !member.bioEs) {
          this.issues.push({
            id: `empty-bio-${member.id}`,
            type: 'incomplete_success',
            severity: 'medium',
            entityType: 'team_member',
            entityId: member.id,
            title: `${member.name}: Missing biography`,
            details: 'Team member has no bio in either English or Spanish',
            suggestedAction: 'Add biography content for this team member',
            detectedAt: new Date(),
          });
        }
      }

      const cachedTranslations = await db.select().from(translationCache);
      
      for (const cache of cachedTranslations) {
        if (cache.targetLanguage === 'de' && cache.translatedText) {
          const detectedLang = detectLanguage(cache.translatedText);
          
          if (detectedLang === 'es') {
            this.issues.push({
              id: `cache-leakage-${cache.id}`,
              type: 'localization_leakage',
              severity: 'high',
              entityType: 'article',
              entityId: cache.entityId,
              title: `German translation contains Spanish`,
              details: `Translation cache for ${cache.contentType} (${cache.field || 'content'}) marked as German but contains Spanish. Snippet: "${cache.translatedText.substring(0, 80)}..."`,
              suggestedAction: 'Delete cached translation and re-run PolyglotTranslatorAgent',
              detectedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('[SystemHealthCheck] Error checking localization leakage:', error);
    }
  }

  private async checkOrphanedAssets(): Promise<void> {
    console.log('[SystemHealthCheck] Checking for orphaned assets...');
    
    try {
      const allMedia = await db.select().from(mediaItems);
      const allArticles = await db.select({
        imageUrl: news.imageUrl,
      }).from(news);
      
      const usedUrls = new Set(
        allArticles
          .map(a => a.imageUrl)
          .filter(Boolean)
      );
      
      for (const media of allMedia) {
        const isUsed = usedUrls.has(media.path) || 
                       usedUrls.has(`/uploads/${media.filename}`) ||
                       usedUrls.has(media.filename);
        
        if (!isUsed) {
          const ageHours = media.createdAt 
            ? Math.round((Date.now() - new Date(media.createdAt).getTime()) / 3600000)
            : 0;
          
          if (ageHours > 24) {
            this.issues.push({
              id: `orphan-${media.id}`,
              type: 'orphaned_asset',
              severity: 'low',
              entityType: 'media',
              entityId: media.id,
              title: `Orphaned media: ${media.originalName}`,
              details: `File uploaded ${ageHours} hours ago but not linked to any article. Path: ${media.path}`,
              suggestedAction: 'Review and delete if not needed',
              detectedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('[SystemHealthCheck] Error checking orphaned assets:', error);
    }
  }

  private async checkMissingTranslations(): Promise<void> {
    console.log('[SystemHealthCheck] Checking for missing translations...');
    
    const REQUIRED_LANGUAGES = ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'];
    
    try {
      const articles = await db.select().from(news);
      const translations = await db.select().from(newsTranslations);
      
      const translationMap = new Map<string, Set<string>>();
      for (const t of translations) {
        if (!translationMap.has(t.newsId)) {
          translationMap.set(t.newsId, new Set());
        }
        translationMap.get(t.newsId)!.add(t.language);
      }
      
      for (const article of articles) {
        const articleTranslations = translationMap.get(article.id) || new Set();
        
        const missingLangs = REQUIRED_LANGUAGES.filter(lang => {
          if (lang === 'en') return !article.content || article.content.trim() === '';
          if (lang === 'es') return !article.contentEs || article.contentEs.trim() === '';
          return !articleTranslations.has(lang);
        });
        
        if (missingLangs.length > 3) {
          this.issues.push({
            id: `translation-${article.id}`,
            type: 'missing_translation',
            severity: missingLangs.includes('en') || missingLangs.includes('es') ? 'high' : 'medium',
            entityType: 'article',
            entityId: article.id,
            title: article.title || article.titleEs || 'Unknown article',
            details: `Missing translations for: ${missingLangs.join(', ')} (${missingLangs.length}/${REQUIRED_LANGUAGES.length})`,
            suggestedAction: 'Run pipeline to generate missing translations',
            detectedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('[SystemHealthCheck] Error checking missing translations:', error);
    }
  }

  async resetZombieJobs(): Promise<number> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const result = await db.update(agentJobs)
      .set({ 
        status: 'failed',
        error: 'Auto-cancelled: stuck in processing for >10 minutes',
        completedAt: new Date(),
      })
      .where(
        and(
          eq(agentJobs.status, 'in_progress'),
          lt(agentJobs.startedAt, tenMinutesAgo)
        )
      )
      .returning({ id: agentJobs.id });
    
    console.log(`[SystemHealthCheck] Reset ${result.length} zombie jobs`);
    return result.length;
  }

  generateHumanReport(report: AuditReport): string {
    const lines: string[] = [];
    
    lines.push(`\n${'='.repeat(60)}`);
    lines.push(`SYSTEM HEALTH AUDIT REPORT`);
    lines.push(`Run ID: ${report.runId}`);
    lines.push(`Time: ${report.runAt.toISOString()}`);
    lines.push(`Duration: ${report.durationMs}ms`);
    lines.push(`${'='.repeat(60)}\n`);
    
    lines.push(`HEALTH SCORE: ${report.healthScore}% ${report.healthScore >= 80 ? '✓' : report.healthScore >= 50 ? '⚠' : '✗'}\n`);
    
    lines.push(`SUMMARY:`);
    lines.push(`  Total Issues: ${report.summary.totalIssues}`);
    lines.push(`  - Critical: ${report.summary.criticalCount}`);
    lines.push(`  - High: ${report.summary.highCount}`);
    lines.push(`  - Medium: ${report.summary.mediumCount}`);
    lines.push(`  - Low: ${report.summary.lowCount}`);
    lines.push('');
    lines.push(`ISSUE BREAKDOWN:`);
    lines.push(`  - Zombie Processes: ${report.summary.zombieProcesses}`);
    lines.push(`  - Incomplete Success: ${report.summary.incompleteSuccess}`);
    lines.push(`  - Localization Leakage: ${report.summary.localizationLeakage}`);
    lines.push(`  - Orphaned Assets: ${report.summary.orphanedAssets}`);
    lines.push(`  - Missing Translations: ${report.summary.missingTranslations}`);
    lines.push('');
    
    if (report.issues.length > 0) {
      lines.push(`DETAILED ISSUES (showing first 20):`);
      lines.push(`${'-'.repeat(60)}`);
      
      for (const issue of report.issues.slice(0, 20)) {
        const severityEmoji = {
          critical: '[CRITICAL]',
          high: '[HIGH]',
          medium: '[MEDIUM]',
          low: '[LOW]',
        }[issue.severity];
        
        lines.push(`${severityEmoji} ${issue.title}`);
        lines.push(`   Type: ${issue.type} | Entity: ${issue.entityType}`);
        lines.push(`   ${issue.details}`);
        lines.push(`   Action: ${issue.suggestedAction}`);
        lines.push('');
      }
      
      if (report.issues.length > 20) {
        lines.push(`... and ${report.issues.length - 20} more issues`);
      }
    } else {
      lines.push(`No issues found! System is healthy.`);
    }
    
    lines.push(`\n${'='.repeat(60)}`);
    
    return lines.join('\n');
  }
}

export const systemHealthCheck = new SystemHealthCheck();
