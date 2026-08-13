import { eq, and, sql } from "drizzle-orm";
import { type News, type NewsTranslation, type InsertNewsTranslation, type TranslationCache, type InsertTranslationCache, news, newsTranslations, translationCache } from "@shared/schema";
import type { StorageDatabase } from "../types";
import type { IStorage } from "../contracts";

export function createTranslationRepository(db: StorageDatabase) {
  class TranslationRepository {
    declare getNewsById: IStorage["getNewsById"];

    // Translation Cache
    async getTranslation(
      contentType: string,
      entityId: string,
      field: string,
      targetLanguage: string
    ): Promise<TranslationCache | undefined> {
      const [translation] = await db
        .select()
        .from(translationCache)
        .where(
          and(
            eq(translationCache.contentType, contentType),
            eq(translationCache.entityId, entityId),
            eq(translationCache.field, field),
            eq(translationCache.targetLanguage, targetLanguage)
          )
        );
      return translation;
    }

    async getTranslations(
      contentType: string,
      entityId: string,
      targetLanguage: string
    ): Promise<TranslationCache[]> {
      return db
        .select()
        .from(translationCache)
        .where(
          and(
            eq(translationCache.contentType, contentType),
            eq(translationCache.entityId, entityId),
            eq(translationCache.targetLanguage, targetLanguage)
          )
        );
    }

    async saveTranslation(translation: InsertTranslationCache): Promise<TranslationCache> {
      if (!translation.field) {
        throw new Error("Field is required for translation");
      }
      const existing = await this.getTranslation(
        translation.contentType,
        translation.entityId,
        translation.field,
        translation.targetLanguage
      );

      if (existing) {
        const [updated] = await db
          .update(translationCache)
          .set({
            translatedText: translation.translatedText,
            sourceText: translation.sourceText,
            sourceLanguage: translation.sourceLanguage,
            updatedAt: new Date(),
          })
          .where(eq(translationCache.id, existing.id))
          .returning();
        return updated;
      }

      const [item] = await db.insert(translationCache).values(translation).returning();
      return item;
    }

    // News Translations
    async getNewsTranslations(newsId: string): Promise<NewsTranslation[]> {
      return db
        .select()
        .from(newsTranslations)
        .where(eq(newsTranslations.newsId, newsId));
    }

    async getNewsTranslationCounts(): Promise<Record<string, number>> {
      // COUNT(*) + GROUP BY en SQL en vez de traer todas las filas y contar en JS.
      const rows = await db
        .select({ newsId: newsTranslations.newsId, count: sql<number>`count(*)::int` })
        .from(newsTranslations)
        .groupBy(newsTranslations.newsId);
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.newsId] = r.count;
      return counts;
    }

    async getNewsTranslation(newsId: string, language: string): Promise<NewsTranslation | undefined> {
      const [translation] = await db
        .select()
        .from(newsTranslations)
        .where(
          and(
            eq(newsTranslations.newsId, newsId),
            eq(newsTranslations.language, language)
          )
        );
      return translation;
    }

    async upsertNewsTranslation(data: InsertNewsTranslation): Promise<NewsTranslation> {
      const existing = await this.getNewsTranslation(data.newsId, data.language);

      if (existing) {
        const [updated] = await db
          .update(newsTranslations)
          .set({
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            category: data.category,
            seoTitle: data.seoTitle,
            seoDescription: data.seoDescription,
            seoKeywords: data.seoKeywords,
            translatedBy: data.translatedBy,
            translatedAt: new Date(),
          })
          .where(eq(newsTranslations.id, existing.id))
          .returning();
        return updated;
      }

      const [item] = await db.insert(newsTranslations).values(data).returning();
      return item;
    }

    async deleteNewsTranslations(newsId: string): Promise<boolean> {
      const result = await db
        .delete(newsTranslations)
        .where(eq(newsTranslations.newsId, newsId))
        .returning();
      return result.length > 0;
    }

    async getNewsWithTranslations(newsId: string): Promise<{ news: News; translations: NewsTranslation[] } | undefined> {
      const newsItem = await this.getNewsById(newsId);
      if (!newsItem) {
        return undefined;
      }

      const translations = await this.getNewsTranslations(newsId);
      return { news: newsItem, translations };
    }
  }

  return new TranslationRepository();
}
