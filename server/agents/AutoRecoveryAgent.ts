import { db } from '../db';
import { news } from '@shared/schema';
import { eq, or, isNull, and } from 'drizzle-orm';
import { 
  formatterAgent, 
  categoryAgent, 
  metadataLinkerAgent, 
  seoOptimizerAgent, 
  polyglotTranslatorAgent,
  imageSuggestionAgent 
} from './index';

export interface RecoveryResult {
  articleId: string;
  title: string;
  previousStatus: string;
  previousError: string | null;
  failedStep: string | null;
  recoveryAttempted: boolean;
  recoverySuccess: boolean;
  newStatus: string;
  message: string;
}

export interface RecoveryReport {
  timestamp: Date;
  totalFailed: number;
  totalRecovered: number;
  totalStillFailed: number;
  results: RecoveryResult[];
}

const createContext = (agentType: string) => ({
  jobId: `recovery-${agentType}-${Date.now()}`,
  agentType: agentType as any,
  startTime: new Date(),
  metadata: { recoveryMode: true }
});

export async function recoverFailedItems(): Promise<RecoveryReport> {
  console.log('[AutoRecovery] Starting recovery scan...');
  
  const failedArticles = await db
    .select()
    .from(news)
    .where(
      or(
        eq(news.processingStatus, 'failed'),
        eq(news.processingStatus, 'error')
      )
    );
  
  console.log(`[AutoRecovery] Found ${failedArticles.length} failed articles`);
  
  const results: RecoveryResult[] = [];
  
  for (const article of failedArticles) {
    const result: RecoveryResult = {
      articleId: article.id,
      title: article.title.substring(0, 50) + (article.title.length > 50 ? '...' : ''),
      previousStatus: article.processingStatus || 'unknown',
      previousError: article.lastError,
      failedStep: article.failedStep,
      recoveryAttempted: false,
      recoverySuccess: false,
      newStatus: article.processingStatus || 'unknown',
      message: ''
    };
    
    try {
      const failedStep = article.failedStep || 'unknown';
      
      if (failedStep === 'image' || failedStep === 'unknown') {
        result.recoveryAttempted = true;
        
        const hasContent = article.content && article.content.length > 100;
        const hasTranslations = true;
        
        if (hasContent) {
          if (!article.imageUrl) {
            try {
              console.log(`[AutoRecovery] Retrying image generation for ${article.id}`);
              const imageResult = await imageSuggestionAgent.execute(
                createContext('image_suggestion'),
                { articleId: article.id }
              );
              
              if (imageResult.success) {
                await db.update(news).set({
                  processingStatus: 'ready',
                  lastError: null,
                  failedStep: null,
                  lastProcessedAt: new Date()
                }).where(eq(news.id, article.id));
                
                result.recoverySuccess = true;
                result.newStatus = 'ready';
                result.message = 'Image generated successfully';
              } else {
                await db.update(news).set({
                  processingStatus: 'partial_success',
                  imageUrl: '/placeholder-article.svg',
                  lastError: `Image retry failed: ${imageResult.error}`,
                  lastProcessedAt: new Date()
                }).where(eq(news.id, article.id));
                
                result.recoverySuccess = true;
                result.newStatus = 'partial_success';
                result.message = 'Assigned placeholder image - content is ready';
              }
            } catch (imgErr: any) {
              await db.update(news).set({
                processingStatus: 'partial_success',
                imageUrl: '/placeholder-article.svg',
                lastError: `Image error: ${imgErr.message}`,
                lastProcessedAt: new Date()
              }).where(eq(news.id, article.id));
              
              result.recoverySuccess = true;
              result.newStatus = 'partial_success';
              result.message = 'Assigned placeholder - image service unavailable';
            }
          } else {
            await db.update(news).set({
              processingStatus: 'ready',
              lastError: null,
              failedStep: null,
              lastProcessedAt: new Date()
            }).where(eq(news.id, article.id));
            
            result.recoverySuccess = true;
            result.newStatus = 'ready';
            result.message = 'Already has image - status corrected';
          }
        } else {
          result.message = 'No content to process';
        }
      } else if (failedStep === 'translate') {
        result.recoveryAttempted = true;
        console.log(`[AutoRecovery] Retrying translation for ${article.id}`);
        
        try {
          const translateResult = await polyglotTranslatorAgent.execute(
            createContext('polyglot_translator'),
            { articleId: article.id }
          );
          
          if (translateResult.success) {
            await db.update(news).set({
              processingStatus: 'ready',
              lastError: null,
              failedStep: null,
              lastProcessedAt: new Date()
            }).where(eq(news.id, article.id));
            
            result.recoverySuccess = true;
            result.newStatus = 'ready';
            result.message = 'Translation completed successfully';
          } else {
            result.message = `Translation retry failed: ${translateResult.error}`;
          }
        } catch (err: any) {
          result.message = `Translation error: ${err.message}`;
        }
      } else if (failedStep === 'seo') {
        result.recoveryAttempted = true;
        console.log(`[AutoRecovery] Retrying SEO for ${article.id}`);
        
        try {
          const seoResult = await seoOptimizerAgent.execute(
            createContext('seo_optimizer'),
            { articleId: article.id }
          );
          
          if (seoResult.success) {
            await db.update(news).set({
              processingStatus: 'ready',
              lastError: null,
              failedStep: null,
              lastProcessedAt: new Date()
            }).where(eq(news.id, article.id));
            
            result.recoverySuccess = true;
            result.newStatus = 'ready';
            result.message = 'SEO optimization completed';
          } else {
            result.message = `SEO retry failed: ${seoResult.error}`;
          }
        } catch (err: any) {
          result.message = `SEO error: ${err.message}`;
        }
      } else {
        result.message = `Unknown failed step: ${failedStep}`;
      }
      
    } catch (err: any) {
      result.message = `Recovery error: ${err.message}`;
      console.error(`[AutoRecovery] Error recovering ${article.id}:`, err.message);
    }
    
    results.push(result);
  }
  
  const report: RecoveryReport = {
    timestamp: new Date(),
    totalFailed: failedArticles.length,
    totalRecovered: results.filter(r => r.recoverySuccess).length,
    totalStillFailed: results.filter(r => !r.recoverySuccess && r.recoveryAttempted).length,
    results
  };
  
  console.log(`[AutoRecovery] Complete: ${report.totalRecovered}/${report.totalFailed} recovered`);
  
  return report;
}

export async function markAsPartialSuccess(articleIds?: string[]): Promise<number> {
  console.log('[AutoRecovery] Running bulk partial-success update...');
  
  let query = db.update(news).set({
    processingStatus: 'partial_success',
    imageUrl: '/placeholder-article.svg',
    lastProcessedAt: new Date()
  });
  
  if (articleIds && articleIds.length > 0) {
    let updated = 0;
    for (const id of articleIds) {
      await db.update(news).set({
        processingStatus: 'partial_success',
        imageUrl: '/placeholder-article.svg',
        lastProcessedAt: new Date()
      }).where(eq(news.id, id));
      updated++;
    }
    return updated;
  }
  
  const result = await db.update(news).set({
    processingStatus: 'partial_success',
    imageUrl: '/placeholder-article.svg',
    lastProcessedAt: new Date()
  }).where(
    and(
      or(
        eq(news.processingStatus, 'failed'),
        eq(news.processingStatus, 'error')
      ),
      or(
        eq(news.failedStep, 'image'),
        isNull(news.failedStep)
      )
    )
  );
  
  console.log(`[AutoRecovery] Bulk update completed`);
  return 0;
}

export async function getFailedArticlesSummary(): Promise<{
  total: number;
  byStep: Record<string, number>;
  byError: Record<string, number>;
}> {
  const failedArticles = await db
    .select()
    .from(news)
    .where(
      or(
        eq(news.processingStatus, 'failed'),
        eq(news.processingStatus, 'error')
      )
    );
  
  const byStep: Record<string, number> = {};
  const byError: Record<string, number> = {};
  
  for (const article of failedArticles) {
    const step = article.failedStep || 'unknown';
    byStep[step] = (byStep[step] || 0) + 1;
    
    if (article.lastError) {
      const errorKey = article.lastError.substring(0, 50);
      byError[errorKey] = (byError[errorKey] || 0) + 1;
    }
  }
  
  return {
    total: failedArticles.length,
    byStep,
    byError
  };
}
