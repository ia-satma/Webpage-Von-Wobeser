import { eq, ne, and, isNull, isNotNull, lte, sql, inArray, ilike, or, arrayOverlaps, notInArray, type SQL } from "drizzle-orm";
import crypto from "node:crypto";
import { sanitizeNewsFields } from "../../mirror/sanitize";
import {
  type News,
  type InsertNews,
  type TeamMember,
  publicAuthorVerificationStatuses,
  news,
  newsTranslations,
  teamMembers,
  newsTeamMembers,
} from "@shared/schema";
import type { StorageDatabase } from "../types";
import {
  loadCanonicalPublicationAuthorEvidence,
  publicationFamilyKeys,
  publicationSourceLanguageByLegacyId,
  type PublicationSourceLanguage,
} from "../../content/canonicalPublicationAuthorEvidence2026";

// Postgres pone los NULL PRIMERO en "ORDER BY ... DESC" por defecto. 616 de 1792 noticias
// (contenido legacy migrado sin fecha) tienen date=NULL, así que dominaban la primera página
// de "Noticias" en vez de mostrarse ahí el contenido genuinamente reciente — una noticia
// recién creada con fecha real quedaba enterrada detrás de esos 616 registros. Se usa en
// todo lugar donde antes se ordenaba con `desc(news.date)`. Los registros sin
// fecha NO se ocultan: quedan después de los fechados y usan el p_id histórico
// como desempate estable. Para fechas de precisión mensual (guardadas el día 1),
// el p_id numérico aproxima el orden histórico sin inventar una fecha editorial.
// El segundo orden textual mantiene compatibilidad si apareciera un ID no numérico.
const newsDateDescNullsLast = sql`${news.date} desc nulls last, case when ${news.legacyId} ~ '^[0-9]+$' then cast(${news.legacyId} as bigint) end desc nulls last, ${news.legacyId} desc nulls last, ${news.id} desc`;
const verifiedAuthorRelation = inArray(newsTeamMembers.verificationStatus, publicAuthorVerificationStatuses);
const isPublicAuthorVerificationStatus = (status: string) =>
  status === "verified_historic" || status === "verified_editorial_2026" || status === "verified_manual";

type AuthorArchiveLanguage = PublicationSourceLanguage;

let authorArchiveEvidence: {
  familyByLegacyId: ReadonlyMap<string, string>;
  sourceLanguageByLegacyId: ReadonlyMap<string, PublicationSourceLanguage>;
} | undefined;

function getAuthorArchiveEvidence() {
  if (!authorArchiveEvidence) {
    const evidence = loadCanonicalPublicationAuthorEvidence();
    authorArchiveEvidence = {
      familyByLegacyId: publicationFamilyKeys(evidence),
      sourceLanguageByLegacyId: publicationSourceLanguageByLegacyId(evidence),
    };
  }
  return authorArchiveEvidence;
}

/** Shows one card per bilingual historic publication, choosing the requested source locale. */
export function dedupeAuthorArchivePublications(rows: News[], language?: AuthorArchiveLanguage): News[] {
  const { familyByLegacyId, sourceLanguageByLegacyId } = getAuthorArchiveEvidence();
  const families = new Map<string, News[]>();
  for (const item of rows) {
    const legacyId = String(item.legacyId || "");
    const family = familyByLegacyId.get(legacyId) || `news:${item.id}`;
    families.set(family, [...(families.get(family) || []), item]);
  }
  return Array.from(families.values()).map((items) => {
    if (!language) return items[0];
    return items.find((item) => sourceLanguageByLegacyId.get(String(item.legacyId || "")) === language) || items[0];
  });
}

export function createNewsRepository(db: StorageDatabase) {
  class NewsRepository {
    async getNews(): Promise<News[]> {
      return db.select().from(news).orderBy(newsDateDescNullsLast);
    }

    /** Solo las N noticias más recientes (para el home): evita traer ~1.792 filas. */
    async getRecentNews(limit: number): Promise<News[]> {
      return db.select().from(news).orderBy(newsDateDescNullsLast).limit(limit);
    }

    /** Las N noticias más recientes PUBLICADAS (relleno del hero de la home). */
    async getRecentPublishedNews(limit: number): Promise<News[]> {
      return db
        .select()
        .from(news)
        .where(this.publishedNewsConditions())
        .orderBy(newsDateDescNullsLast)
        .limit(limit);
    }

    /** Noticias marcadas como destacadas en el hero (y publicadas), más recientes primero. */
    async getFeaturedNews(limit: number): Promise<News[]> {
      return db
        .select()
        .from(news)
        .where(and(eq(news.featuredHome, true), this.publishedNewsConditions()))
        .orderBy(newsDateDescNullsLast)
        .limit(limit);
    }

    /** Una página de noticias ordenadas por fecha desc (para el listado paginado). */
    async getNewsPage(limit: number, offset: number): Promise<News[]> {
      return db.select().from(news).orderBy(newsDateDescNullsLast).limit(limit).offset(offset);
    }

    /** Conteo total de noticias (para calcular el nº de páginas sin traer filas). */
    async getNewsCount(): Promise<number> {
      const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(news);
      return row?.count ?? 0;
    }

    // getNewsPage/getNewsCount (arriba) NO filtran published/publishAt — se usan también para
    // stats de admin, donde SÍ se quiere el total incluyendo borradores. Estas dos son las que
    // deben usar las rutas PÚBLICAS del espejo (listado de Noticias/Artículos + detalle), para
    // que un borrador (published=false) o un artículo programado a futuro (publishAt) no se
    // filtre al sitio público antes de tiempo.
    private publishedNewsConditions(category?: string) {
      const now = new Date();
      const conds = [eq(news.published, true), or(isNull(news.publishAt), lte(news.publishAt, now))];
      if (category) conds.push(eq(news.category, category));
      return and(...conds);
    }

    async getPublishedNewsPage(limit: number, offset: number, category?: string): Promise<News[]> {
      return db.select().from(news).where(this.publishedNewsConditions(category)).orderBy(newsDateDescNullsLast).limit(limit).offset(offset);
    }

    async getPublishedNewsCount(category?: string): Promise<number> {
      const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(news).where(this.publishedNewsConditions(category));
      return row?.count ?? 0;
    }

    /**
     * Búsqueda pública paginada. La consulta se mantiene parametrizada mediante Drizzle,
     * escapa comodines de ILIKE y reutiliza exactamente los filtros de publicación del
     * listado público para no filtrar borradores ni contenido programado.
     */
    async searchPublishedNewsPage(opts: {
      query: string;
      limit: number;
      offset: number;
      category?: string;
    }): Promise<{ rows: News[]; total: number }> {
      const like = `%${opts.query.replace(/[%_\\]/g, "\\$&")}%`;
      const where = and(
        this.publishedNewsConditions(opts.category),
        or(
          ilike(news.title, like),
          ilike(news.titleEs, like),
          ilike(news.excerpt, like),
          ilike(news.excerptEs, like),
          ilike(news.content, like),
          ilike(news.contentEs, like),
        ),
      );
      const [rows, countRows] = await Promise.all([
        db
          .select()
          .from(news)
          .where(where)
          .orderBy(newsDateDescNullsLast)
          .limit(opts.limit)
          .offset(opts.offset),
        db.select({ count: sql<number>`count(*)::int` }).from(news).where(where),
      ]);
      return { rows, total: countRows[0]?.count ?? 0 };
    }

    /** Archivo público de una persona: una sola consulta paginada sobre la relación editorial. */
    async getPublishedNewsByTeamMemberIdPage(opts: {
      teamMemberId: string;
      limit: number;
      offset: number;
      query?: string;
      category?: string;
      language?: AuthorArchiveLanguage;
    }): Promise<{ rows: News[]; total: number }> {
      const conditions: SQL[] = [
        eq(newsTeamMembers.teamMemberId, opts.teamMemberId),
        verifiedAuthorRelation,
        // Una ficha de abogado nunca debe mostrar una tarjeta editorial sin
        // fecha verificable. El archivo general conserva esos registros.
        isNotNull(news.date),
        eq(news.published, true),
        or(isNull(news.publishAt), lte(news.publishAt, new Date())) as SQL,
      ];
      if (opts.category) conditions.push(eq(news.category, opts.category));
      if (opts.query) {
        const like = `%${opts.query.replace(/[%_\\]/g, "\\$&")}%`;
        conditions.push(or(
          ilike(news.title, like),
          ilike(news.titleEs, like),
          ilike(news.excerpt, like),
          ilike(news.excerptEs, like),
          ilike(news.content, like),
          ilike(news.contentEs, like),
        ) as SQL);
      }
      const where = and(...conditions);
      // Las versiones históricas ES/EN son filas distintas, pero una sola
      // publicación editorial. La deduplicación debe ocurrir ANTES de paginar
      // para que el total y cada página no contengan tarjetas repetidas.
      const rows = await db
        .select({ item: news })
        .from(newsTeamMembers)
        .innerJoin(news, eq(newsTeamMembers.newsId, news.id))
        .where(where)
        .orderBy(newsDateDescNullsLast);
      const items = dedupeAuthorArchivePublications(rows.map((row) => row.item), opts.language);
      return { rows: items.slice(opts.offset, opts.offset + opts.limit), total: items.length };
    }

    /**
     * Recomendaciones para un detalle editorial: otras publicaciones públicas firmadas por al
     * menos una de las mismas personas. La deduplicación ocurre después de la consulta para
     * conservar el orden editorial; PostgreSQL no permite ordenar un SELECT DISTINCT por los
     * desempates de fecha/legacy que no pertenecen a su lista explícita de selección.
     */
    async getRelatedPublishedNewsForTeamMembers(opts: {
      teamMemberIds: string[];
      excludeNewsId?: string;
      limit: number;
      language?: AuthorArchiveLanguage;
    }): Promise<News[]> {
      const ids = Array.from(new Set(opts.teamMemberIds.filter(Boolean)));
      if (!ids.length || opts.limit < 1) return [];
      const conditions: SQL[] = [
        inArray(newsTeamMembers.teamMemberId, ids),
        verifiedAuthorRelation,
        isNotNull(news.date),
        this.publishedNewsConditions() as SQL,
      ];
      if (opts.excludeNewsId) conditions.push(ne(news.id, opts.excludeNewsId));
      const rows = await db
        .select({ item: news })
        .from(newsTeamMembers)
        .innerJoin(news, eq(newsTeamMembers.newsId, news.id))
        .where(and(...conditions))
        .orderBy(newsDateDescNullsLast);
      return dedupeAuthorArchivePublications(rows.map((row) => row.item), opts.language).slice(0, opts.limit);
    }

    /**
     * Red editorial de una publicación. Prioriza etiquetas explícitas, después coautoría y,
     * como último respaldo, categoría. Todos los candidatos se filtran como contenido público.
     */
    async getEditorialRecommendations(opts: {
      excludeNewsId: string;
      teamMemberIds?: string[];
      tags?: string[];
      category?: string | null;
      limit: number;
    }): Promise<News[]> {
      const limit = Math.max(1, Math.min(opts.limit, 12));
      const candidateLimit = Math.max(limit * 3, 12);
      const teamMemberIds = Array.from(new Set((opts.teamMemberIds || []).filter(Boolean)));
      const tags = Array.from(new Set((opts.tags || []).filter(Boolean)));
      // Las tarjetas de "Contenido relacionado" también muestran fecha; los
      // legados sin fecha siguen en el archivo pero no en Insights.
      const baseConditions = [ne(news.id, opts.excludeNewsId), isNotNull(news.date), this.publishedNewsConditions()];

      const [byAuthor, byTag, byCategory] = await Promise.all([
        teamMemberIds.length
          ? this.getRelatedPublishedNewsForTeamMembers({
              teamMemberIds,
              excludeNewsId: opts.excludeNewsId,
              limit: candidateLimit,
            })
          : Promise.resolve([]),
        tags.length
          ? db.select().from(news)
              .where(and(...baseConditions, arrayOverlaps(news.tags, tags)))
              .orderBy(newsDateDescNullsLast)
              .limit(candidateLimit)
          : Promise.resolve([]),
        opts.category
          ? db.select().from(news)
              .where(and(...baseConditions, eq(news.category, opts.category)))
              .orderBy(newsDateDescNullsLast)
              .limit(candidateLimit)
          : Promise.resolve([]),
      ]);

      const ranked = new Map<string, { item: News; score: number }>();
      const add = (rows: News[], score: number) => {
        for (const item of rows) {
          const existing = ranked.get(item.id);
          if (existing) existing.score += score;
          else ranked.set(item.id, { item, score });
        }
      };
      add(byTag, 6);
      add(byAuthor, 3);
      add(byCategory, 1);

      return Array.from(ranked.values())
        .sort((a, b) => b.score - a.score || Number(new Date(b.item.date || 0)) - Number(new Date(a.item.date || 0)))
        .slice(0, limit)
        .map(({ item }) => item);
    }

    /** Cola administrativa: contenido sin una autoría verificada, más reciente primero. */
    async getNewsWithoutTeamMembersPage(opts: { limit: number; offset: number }): Promise<{ rows: News[]; total: number }> {
      const withoutVerifiedRelations = sql`not exists (
        select 1 from ${newsTeamMembers}
        where ${newsTeamMembers.newsId} = ${news.id}
          and ${newsTeamMembers.verificationStatus} in ('verified_historic', 'verified_editorial_2026', 'verified_manual')
      )`;
      const [rows, countRows] = await Promise.all([
        db.select().from(news).where(withoutVerifiedRelations).orderBy(newsDateDescNullsLast).limit(opts.limit).offset(opts.offset),
        db.select({ count: sql<number>`count(*)::int` }).from(news).where(withoutVerifiedRelations),
      ]);
      return { rows, total: countRows[0]?.count ?? 0 };
    }

    /** Página de noticias para el admin (filtro+paginado EN SQL, no trae toda la tabla). */
    async getAdminNewsPage(opts: { limit: number; offset: number; search?: string; category?: string }): Promise<{ rows: News[]; total: number }> {
      const conds = [] as any[];
      const s = opts.search?.trim();
      if (s) {
        const like = `%${s.replace(/[%_\\]/g, "\\$&")}%`;
        conds.push(or(ilike(news.title, like), ilike(news.titleEs, like), ilike(news.excerpt, like), ilike(news.excerptEs, like)));
      }
      if (opts.category && opts.category !== "all") conds.push(eq(news.category, opts.category));
      const where = conds.length ? and(...conds) : undefined;
      const [rows, countRows] = await Promise.all([
        db.select().from(news).where(where).orderBy(newsDateDescNullsLast).limit(opts.limit).offset(opts.offset),
        db.select({ count: sql<number>`count(*)::int` }).from(news).where(where),
      ]);
      return { rows, total: countRows[0]?.count ?? 0 };
    }

    /** Estadísticas de traducciones en SQL (agregado), en vez de N+1 por artículo. */
    async getTranslationStats(): Promise<{ total: number; byLanguage: Record<string, number>; articlesWithTranslations: number }> {
      const [byLang, distinct] = await Promise.all([
        db.select({ language: newsTranslations.language, count: sql<number>`count(*)::int` }).from(newsTranslations).groupBy(newsTranslations.language),
        db.select({ count: sql<number>`count(distinct ${newsTranslations.newsId})::int` }).from(newsTranslations),
      ]);
      const byLanguage: Record<string, number> = {};
      let total = 0;
      for (const r of byLang) { byLanguage[r.language] = r.count; total += r.count; }
      return { total, byLanguage, articlesWithTranslations: distinct[0]?.count ?? 0 };
    }

    /**
     * Cobertura REAL de español/inglés en las columnas base de `news` (title/content vs
     * title_es/content_es — las que de verdad usa el sitio público), no la caché de
     * traducción a 10 idiomas de `news_translations` (esa es una feature aparte, ver
     * `getTranslationStats`). Un campo "sin inglés" es aquel cuyo lado en español SÍ tiene
     * texto pero el inglés está vacío o es idéntico (copiado sin traducir) — si el español
     * también está vacío (ej. publicaciones que solo referencian un PDF externo, sin cuerpo en
     * ningún idioma) no cuenta como hueco, porque no hay nada que traducir. Mismo criterio que
     * `scripts/fix-missing-news-english.mjs`.
     */
    async getBaseLanguageCoverage(): Promise<{ total: number; missingEnglish: number }> {
      const [row] = await db
        .select({
          total: sql<number>`count(*)::int`,
          missingEnglish: sql<number>`count(*) filter (
            where (trim(${news.titleEs}) <> '' and (${news.title} is null or ${news.title} = ${news.titleEs}))
               or (trim(${news.excerptEs}) <> '' and (${news.excerpt} is null or ${news.excerpt} = ${news.excerptEs}))
               or (trim(${news.contentEs}) <> '' and (${news.content} is null or trim(${news.content}) = '' or ${news.content} = ${news.contentEs}))
          )::int`,
        })
        .from(news);
      return { total: row?.total ?? 0, missingEnglish: row?.missingEnglish ?? 0 };
    }

    /** Conteos de noticias por estado (publicadas/no) en SQL, sin traer filas. */
    async getNewsStatusCounts(): Promise<{ total: number; published: number; unpublished: number }> {
      const rows = await db.select({ published: news.published, count: sql<number>`count(*)::int` }).from(news).groupBy(news.published);
      let total = 0, published = 0;
      for (const r of rows) { total += r.count; if (r.published) published += r.count; }
      return { total, published, unpublished: total - published };
    }

    /** Búsqueda de noticias en SQL (ILIKE + LIMIT), para el buscador global. */
    async searchNews(q: string, limit: number): Promise<News[]> {
      const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
      return db
        .select()
        .from(news)
        .where(
          and(
            this.publishedNewsConditions(),
            or(
            ilike(news.title, like),
            ilike(news.titleEs, like),
            ilike(news.excerpt, like),
            ilike(news.excerptEs, like),
            ilike(news.content, like),
            ilike(news.contentEs, like),
            ),
          ),
        )
        .orderBy(newsDateDescNullsLast)
        .limit(limit);
    }

    async getNewsById(id: string): Promise<News | undefined> {
      const [item] = await db.select().from(news).where(eq(news.id, id));
      return item;
    }

    async getNewsBySlug(slug: string): Promise<News | undefined> {
      const [item] = await db.select().from(news).where(eq(news.slug, slug));
      return item;
    }

    async createNews(insertNews: InsertNews): Promise<News> {
      // Última barrera común para panel, agentes e integraciones: la BD nunca recibe
      // familias tipográficas pegadas ni HTML activo en los campos enriquecidos.
      const safeNews = sanitizeNewsFields({ ...insertNews });
      const [item] = await db.insert(news).values(safeNews).returning();
      return item;
    }

    async createNewsWithTeamMembers(insertNews: InsertNews, teamMemberIds: string[]): Promise<News> {
      const safeNews = sanitizeNewsFields({ ...insertNews });
      const ids = Array.from(new Set(teamMemberIds));
      return db.transaction(async (tx) => {
        const [item] = await tx.insert(news).values(safeNews).returning();
        if (ids.length) {
          await tx.insert(newsTeamMembers).values(ids.map((teamMemberId) => ({
            newsId: item.id,
            teamMemberId,
            verificationStatus: "verified_manual" as const,
          })));
        }
        return item;
      });
    }

    /**
     * Crea una copia de trabajo de una publicación sin modificar el artículo que
     * ya está visible. El pipeline solo puede aplicar cambios a borradores, por
     * lo que esta es la transición segura desde contenido publicado.
     */
    async createNewsProcessingDraft(newsId: string): Promise<News | undefined> {
      return db.transaction(async (tx) => {
        const [source] = await tx.select().from(news).where(eq(news.id, newsId));
        // El pipeline puede trabajar exclusivamente con published=false. Si ya
        // es borrador, no creamos una copia adicional innecesaria.
        if (!source || source.published === false) return undefined;

        const [translations, authorLinks] = await Promise.all([
          tx.select().from(newsTranslations).where(eq(newsTranslations.newsId, source.id)),
          tx.select().from(newsTeamMembers).where(eq(newsTeamMembers.newsId, source.id)),
        ]);
        const draftSlug = `${source.slug}-draft-${crypto.randomBytes(4).toString("hex")}`;
        const draftValues = sanitizeNewsFields({
          title: source.title,
          titleEs: source.titleEs,
          excerpt: source.excerpt,
          excerptEs: source.excerptEs,
          content: source.content,
          contentEs: source.contentEs,
          slug: draftSlug,
          imageUrl: source.imageUrl,
          published: false,
          featuredHome: false,
          category: source.category,
          categoryEs: source.categoryEs,
          tags: source.tags || [],
          authorId: source.authorId,
          processingStatus: "pending",
          lastError: null,
          lastProcessedAt: null,
          failedStep: null,
          publishAt: null,
          // El identificador de Joomla no se duplica: debe seguir identificando
          // únicamente la publicación histórica de origen.
          legacyId: null,
          councilVerdict: null,
        });
        const [draft] = await tx.insert(news).values(draftValues).returning();

        if (authorLinks.length) {
          await tx.insert(newsTeamMembers).values(authorLinks.map((link) => ({
            newsId: draft.id,
            teamMemberId: link.teamMemberId,
            verificationStatus: link.verificationStatus,
          })));
        }
        if (translations.length) {
          await tx.insert(newsTranslations).values(translations.map((translation) => ({
            newsId: draft.id,
            language: translation.language,
            title: translation.title,
            excerpt: translation.excerpt,
            content: translation.content,
            category: translation.category,
            seoTitle: translation.seoTitle,
            seoDescription: translation.seoDescription,
            seoKeywords: translation.seoKeywords,
            translatedBy: translation.translatedBy,
          })));
        }

        return draft;
      });
    }

    async updateNews(id: string, data: Partial<InsertNews>): Promise<News | undefined> {
      const safeData = sanitizeNewsFields({ ...data });
      const [item] = await db
        .update(news)
        .set(safeData)
        .where(eq(news.id, id))
        .returning();
      return item;
    }

    async updateNewsWithTeamMembers(
      id: string,
      data: Partial<InsertNews>,
      teamMemberIds?: string[],
    ): Promise<News | undefined> {
      const safeData = sanitizeNewsFields({ ...data });
      const ids = teamMemberIds === undefined ? undefined : Array.from(new Set(teamMemberIds));
      return db.transaction(async (tx) => {
        const [item] = await tx.update(news).set(safeData).where(eq(news.id, id)).returning();
        if (!item || ids === undefined) return item;
        const existing = await tx.select().from(newsTeamMembers).where(eq(newsTeamMembers.newsId, id));
        const existingIds = new Set(existing.map((relation) => relation.teamMemberId));
        const manualRemoval = ids.length
          ? and(
              eq(newsTeamMembers.newsId, id),
              eq(newsTeamMembers.verificationStatus, "verified_manual"),
              notInArray(newsTeamMembers.teamMemberId, ids),
            )
          : and(eq(newsTeamMembers.newsId, id), eq(newsTeamMembers.verificationStatus, "verified_manual"));
        await tx.delete(newsTeamMembers).where(manualRemoval);
        const confirmedLegacyIds = existing
          .filter((relation) => relation.verificationStatus === "legacy_unverified" && ids.includes(relation.teamMemberId))
          .map((relation) => relation.teamMemberId);
        if (confirmedLegacyIds.length) {
          await tx.update(newsTeamMembers)
            .set({ verificationStatus: "verified_manual" })
            .where(and(eq(newsTeamMembers.newsId, id), inArray(newsTeamMembers.teamMemberId, confirmedLegacyIds)));
        }
        const additions = ids.filter((teamMemberId) => !existingIds.has(teamMemberId));
        if (additions.length) {
          await tx.insert(newsTeamMembers).values(additions.map((teamMemberId) => ({
            newsId: id,
            teamMemberId,
            verificationStatus: "verified_manual" as const,
          })));
        }
        return item;
      });
    }

    async deleteNews(id: string): Promise<boolean> {
      // First delete related newsTeamMembers entries
      await db.delete(newsTeamMembers).where(eq(newsTeamMembers.newsId, id));
      // Then delete the news item
      const result = await db.delete(news).where(eq(news.id, id)).returning();
      return result.length > 0;
    }

    // News Team Members (many-to-many relationship)
    async getNewsByTeamMemberId(teamMemberId: string): Promise<News[]> {
      const pivotRows = await db
        .select()
        .from(newsTeamMembers)
        .where(and(eq(newsTeamMembers.teamMemberId, teamMemberId), verifiedAuthorRelation));

      if (pivotRows.length === 0) {
        return [];
      }

      const newsIds = pivotRows.map(row => row.newsId);
      // Una sola query con IN(...) en vez de N queries (una por id).
      const rows = await db.select().from(news).where(inArray(news.id, newsIds));
      const byId = new Map(rows.map((r) => [r.id, r]));
      return newsIds.map((id) => byId.get(id)).filter((n): n is News => !!n);
    }

    async getTeamMembersByNewsId(newsId: string): Promise<TeamMember[]> {
      const pivotRows = await db
        .select()
        .from(newsTeamMembers)
        .where(eq(newsTeamMembers.newsId, newsId));

      if (pivotRows.length === 0) {
        return [];
      }

      const teamMemberIds = pivotRows.map(row => row.teamMemberId);
      // Una sola query con IN(...) en vez de N queries (una por id).
      const rows = await db.select().from(teamMembers).where(inArray(teamMembers.id, teamMemberIds));
      const byId = new Map(rows.map((r) => [r.id, r]));
      return teamMemberIds.map((id) => byId.get(id)).filter((m): m is TeamMember => !!m);
    }

    async getVerifiedTeamMembersByNewsId(newsId: string): Promise<TeamMember[]> {
      const relations = await this.getNewsTeamMemberRelations(newsId);
      return relations
        .filter((relation) => isPublicAuthorVerificationStatus(relation.verificationStatus))
        .map((relation) => relation.member);
    }

    async getNewsTeamMemberRelations(newsId: string) {
      const rows = await db
        .select({ member: teamMembers, verificationStatus: newsTeamMembers.verificationStatus })
        .from(newsTeamMembers)
        .innerJoin(teamMembers, eq(teamMembers.id, newsTeamMembers.teamMemberId))
        .where(eq(newsTeamMembers.newsId, newsId));
      return rows;
    }

    async setTeamMembersForNews(newsId: string, teamMemberIds: string[]): Promise<void> {
      const ids = Array.from(new Set(teamMemberIds));
      await db.transaction(async (tx) => {
        const existing = await tx.select().from(newsTeamMembers).where(eq(newsTeamMembers.newsId, newsId));
        const existingIds = new Set(existing.map((relation) => relation.teamMemberId));
        const manualRemoval = ids.length
          ? and(
              eq(newsTeamMembers.newsId, newsId),
              eq(newsTeamMembers.verificationStatus, "verified_manual"),
              notInArray(newsTeamMembers.teamMemberId, ids),
            )
          : and(eq(newsTeamMembers.newsId, newsId), eq(newsTeamMembers.verificationStatus, "verified_manual"));
        await tx.delete(newsTeamMembers).where(manualRemoval);
        const confirmedLegacyIds = existing
          .filter((relation) => relation.verificationStatus === "legacy_unverified" && ids.includes(relation.teamMemberId))
          .map((relation) => relation.teamMemberId);
        if (confirmedLegacyIds.length) {
          await tx.update(newsTeamMembers)
            .set({ verificationStatus: "verified_manual" })
            .where(and(eq(newsTeamMembers.newsId, newsId), inArray(newsTeamMembers.teamMemberId, confirmedLegacyIds)));
        }
        const additions = ids.filter((teamMemberId) => !existingIds.has(teamMemberId));
        if (additions.length) {
          await tx.insert(newsTeamMembers).values(additions.map((teamMemberId) => ({
            newsId,
            teamMemberId,
            verificationStatus: "verified_manual" as const,
          })));
        }
      });
    }

    async addTeamMemberToNews(newsId: string, teamMemberId: string): Promise<void> {
      const [existing] = await db
        .select()
        .from(newsTeamMembers)
        .where(and(eq(newsTeamMembers.newsId, newsId), eq(newsTeamMembers.teamMemberId, teamMemberId)));

      if (!existing) {
        await db.insert(newsTeamMembers).values({ newsId, teamMemberId, verificationStatus: "verified_manual" });
      }
    }

    async removeTeamMemberFromNews(newsId: string, teamMemberId: string): Promise<void> {
      await db
        .delete(newsTeamMembers)
        .where(and(
          eq(newsTeamMembers.newsId, newsId),
          eq(newsTeamMembers.teamMemberId, teamMemberId),
          eq(newsTeamMembers.verificationStatus, "verified_manual"),
        ));
    }
  }

  return new NewsRepository();
}
