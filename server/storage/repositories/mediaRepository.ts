import { eq, desc, asc } from "drizzle-orm";
import { type OfficeImage, type InsertOfficeImage, type GeneratedImage, type InsertGeneratedImage, type GeneratedAudio, type InsertGeneratedAudio, type GeneratedPresentation, type InsertGeneratedPresentation, type MediaItem, type InsertMediaItem, news, officeImages, generatedImages, generatedAudio, generatedPresentations, mediaItems } from "@shared/schema";
import type { StorageDatabase } from "../types";

export function createMediaRepository(db: StorageDatabase) {
  class MediaRepository {
    async getOfficeImages(): Promise<OfficeImage[]> {
      return db.select().from(officeImages).orderBy(asc(officeImages.order));
    }

    async createOfficeImage(image: InsertOfficeImage): Promise<OfficeImage> {
      const [created] = await db.insert(officeImages).values(image).returning();
      return created;
    }

    async updateOfficeImage(id: string, data: Partial<InsertOfficeImage>): Promise<OfficeImage | undefined> {
      const [updated] = await db.update(officeImages).set(data).where(eq(officeImages.id, id)).returning();
      return updated;
    }

    async reorderOfficeImages(ids: string[]): Promise<{ ok: boolean; images: OfficeImage[] }> {
      return db.transaction(async (tx) => {
        const current = await tx
          .select({ id: officeImages.id })
          .from(officeImages)
          .orderBy(asc(officeImages.order));
        const currentIds = current.map((image) => image.id);
        const requestedIds = Array.from(new Set(ids));

        // No aplicar un orden parcial o desactualizado evita posiciones duplicadas
        // cuando alguien modifica la galería mientras otro usuario la reordena.
        if (
          requestedIds.length !== ids.length
          || requestedIds.length !== currentIds.length
          || requestedIds.some((id) => !currentIds.includes(id))
        ) {
          return { ok: false, images: await tx.select().from(officeImages).orderBy(asc(officeImages.order)) };
        }

        for (let order = 0; order < ids.length; order += 1) {
          await tx.update(officeImages).set({ order }).where(eq(officeImages.id, ids[order]));
        }

        return { ok: true, images: await tx.select().from(officeImages).orderBy(asc(officeImages.order)) };
      });
    }

    async getGeneratedImages(): Promise<(GeneratedImage & { articleTitle: string | null; articleSlug: string | null })[]> {
      const rows = await db
        .select({
          id: generatedImages.id,
          imageUrl: generatedImages.imageUrl,
          prompt: generatedImages.prompt,
          sanitizedPrompt: generatedImages.sanitizedPrompt,
          engine: generatedImages.engine,
          articleId: generatedImages.articleId,
          createdAt: generatedImages.createdAt,
          articleTitle: news.titleEs,
          articleSlug: news.slug,
        })
        .from(generatedImages)
        .leftJoin(news, eq(generatedImages.articleId, news.id))
        .orderBy(desc(generatedImages.createdAt));
      return rows;
    }

    async createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage> {
      const [created] = await db.insert(generatedImages).values(image).returning();
      return created;
    }

    async deleteGeneratedImage(id: string): Promise<boolean> {
      const result = await db.delete(generatedImages).where(eq(generatedImages.id, id)).returning();
      return result.length > 0;
    }

    async getGeneratedAudio(): Promise<(GeneratedAudio & { articleTitle: string | null; articleSlug: string | null })[]> {
      const rows = await db
        .select({
          id: generatedAudio.id,
          audioUrl: generatedAudio.audioUrl,
          sourceText: generatedAudio.sourceText,
          voiceId: generatedAudio.voiceId,
          engine: generatedAudio.engine,
          sourceType: generatedAudio.sourceType,
          articleId: generatedAudio.articleId,
          createdAt: generatedAudio.createdAt,
          articleTitle: news.titleEs,
          articleSlug: news.slug,
        })
        .from(generatedAudio)
        .leftJoin(news, eq(generatedAudio.articleId, news.id))
        .orderBy(desc(generatedAudio.createdAt));
      return rows;
    }

    async createGeneratedAudio(audio: InsertGeneratedAudio): Promise<GeneratedAudio> {
      const [created] = await db.insert(generatedAudio).values(audio).returning();
      return created;
    }

    async deleteGeneratedAudio(id: string): Promise<boolean> {
      const result = await db.delete(generatedAudio).where(eq(generatedAudio.id, id)).returning();
      return result.length > 0;
    }

    async getGeneratedPresentations(): Promise<GeneratedPresentation[]> {
      return await db
        .select()
        .from(generatedPresentations)
        .orderBy(desc(generatedPresentations.createdAt));
    }

    async getGeneratedPresentationById(id: string): Promise<GeneratedPresentation | undefined> {
      const [presentation] = await db
        .select()
        .from(generatedPresentations)
        .where(eq(generatedPresentations.id, id));
      return presentation;
    }

    async createGeneratedPresentation(presentation: InsertGeneratedPresentation): Promise<GeneratedPresentation> {
      const [created] = await db.insert(generatedPresentations).values(presentation).returning();
      return created;
    }

    async deleteGeneratedPresentation(id: string): Promise<boolean> {
      const result = await db.delete(generatedPresentations).where(eq(generatedPresentations.id, id)).returning();
      return result.length > 0;
    }

    async deleteOfficeImage(id: string): Promise<boolean> {
      const result = await db.delete(officeImages).where(eq(officeImages.id, id)).returning();
      return result.length > 0;
    }

    // Media Items CRUD
    async getMediaItems(): Promise<MediaItem[]> {
      return db.select().from(mediaItems).orderBy(desc(mediaItems.createdAt));
    }

    async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
      const [mediaItem] = await db.insert(mediaItems).values(item).returning();
      return mediaItem;
    }

    async deleteMediaItem(id: string): Promise<boolean> {
      const result = await db.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
      return result.length > 0;
    }
  }

  return new MediaRepository();
}
