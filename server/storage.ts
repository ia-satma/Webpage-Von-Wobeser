import { eq, desc, asc, and, isNull, gte, sql, inArray, type SQL } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type News,
  type InsertNews,
  type NewsTranslation,
  type InsertNewsTranslation,
  type OfficeImage,
  type InsertOfficeImage,
  type PracticeGroup,
  type InsertPracticeGroup,
  type IndustryGroup,
  type InsertIndustryGroup,
  type TeamMember,
  type InsertTeamMember,
  type SiteContent,
  type Stat,
  type RepresentativeMatterDb,
  type InsertRepresentativeMatter,
  type AdminUser,
  type InsertAdminUser,
  type BlogPost,
  type InsertBlogPost,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogTag,
  type InsertBlogTag,
  type MediaItem,
  type InsertMediaItem,
  type AdminSession,
  type InsertAdminSession,
  type Event,
  type InsertEvent,
  type TranslationCache,
  type InsertTranslationCache,
  type WebsiteAudit,
  type InsertWebsiteAudit,
  type WebsiteAuditFinding,
  type InsertWebsiteAuditFinding,
  type FirmRanking,
  type InsertRanking,
  type Award,
  type InsertAward,
  type RepresentativeClient,
  type InsertRepresentativeClient,
  type Testimonial,
  type InsertTestimonial,
  type JobOpening,
  type InsertJobOpening,
  type Office,
  type InsertOffice,
  type Alliance,
  type InsertAlliance,
  type SpecializedDesk,
  type InsertSpecializedDesk,
  type ContactSubmission,
  type InsertContactSubmission,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type Faq,
  type InsertFaq,
  type ProBonoProject,
  type InsertProBonoProject,
  type DiversityInitiative,
  type InsertDiversityInitiative,
  contactSubmissions,
  users,
  news,
  newsTranslations,
  officeImages,
  practiceGroups,
  industryGroups,
  teamMembers,
  representativeMatters,
  adminUsers,
  blogPosts,
  blogCategories,
  blogTags,
  mediaItems,
  adminSessions,
  blogPostTags,
  newsTeamMembers,
  events,
  translationCache,
  websiteAudits,
  websiteAuditFindings,
  rankings,
  awards,
  representativeClients,
  testimonials,
  jobOpenings,
  offices,
  alliances,
  specializedDesks,
  newsletterSubscribers,
  faqs,
  proBonoProjects,
  diversityInitiatives,
} from "@shared/schema";

// Proyección "tarjeta" de una noticia: omite las columnas pesadas content/contentEs.
// Se usa en los listados paginados del admin, donde devolver el cuerpo completo de
// las ~843 noticias en cada página era innecesario y costoso.
export type NewsCard = Omit<News, "content" | "contentEs">;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getNews(): Promise<News[]>;
  getPublishedNews(): Promise<News[]>;
  getNewsPage(opts: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
  }): Promise<{ news: NewsCard[]; total: number }>;
  getNewsTranslationAggregates(): Promise<{
    totalTranslations: number;
    translationsByLanguage: Record<string, number>;
    articlesWithTranslations: number;
  }>;
  getNewsById(id: string): Promise<News | undefined>;
  getNewsBySlug(slug: string): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: string, data: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: string): Promise<boolean>;
  getOfficeImages(): Promise<OfficeImage[]>;
  createOfficeImage(image: InsertOfficeImage): Promise<OfficeImage>;
  updateOfficeImage(id: string, data: Partial<InsertOfficeImage>): Promise<OfficeImage | undefined>;
  deleteOfficeImage(id: string): Promise<boolean>;
  getSiteContent(): SiteContent;
  getStats(): Stat[];
  getPracticeGroups(): Promise<PracticeGroup[]>;
  getPracticeGroupById(id: string): Promise<PracticeGroup | undefined>;
  getPracticeGroupBySlug(slug: string): Promise<PracticeGroup | undefined>;
  createPracticeGroup(group: InsertPracticeGroup): Promise<PracticeGroup>;
  getIndustryGroups(): Promise<IndustryGroup[]>;
  getIndustryGroupById(id: string): Promise<IndustryGroup | undefined>;
  getIndustryGroupBySlug(slug: string): Promise<IndustryGroup | undefined>;
  createIndustryGroup(group: InsertIndustryGroup): Promise<IndustryGroup>;
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMemberById(id: string): Promise<TeamMember | undefined>;
  getTeamMemberBySlug(slug: string): Promise<TeamMember | undefined>;
  getPartners(): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;
  updatePracticeGroup(id: string, group: Partial<InsertPracticeGroup>): Promise<PracticeGroup | undefined>;
  deletePracticeGroup(id: string): Promise<boolean>;
  updateIndustryGroup(id: string, group: Partial<InsertIndustryGroup>): Promise<IndustryGroup | undefined>;
  deleteIndustryGroup(id: string): Promise<boolean>;
  getRepresentativeMatters(): Promise<RepresentativeMatterDb[]>;
  createRepresentativeMatter(matter: InsertRepresentativeMatter): Promise<RepresentativeMatterDb>;
  
  // Admin User CRUD
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  hasAnyAdminUser(): Promise<boolean>;
  updateAdminUserLogin(id: string): Promise<AdminUser | undefined>;
  
  // Blog Posts CRUD
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
  
  // Blog Categories CRUD
  getBlogCategories(): Promise<BlogCategory[]>;
  getBlogCategoryById(id: string): Promise<BlogCategory | undefined>;
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(id: string, category: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined>;
  deleteBlogCategory(id: string): Promise<boolean>;
  
  // Blog Tags CRUD
  getBlogTags(): Promise<BlogTag[]>;
  createBlogTag(tag: InsertBlogTag): Promise<BlogTag>;
  deleteBlogTag(id: string): Promise<boolean>;
  
  // Media Items CRUD
  getMediaItems(): Promise<MediaItem[]>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  deleteMediaItem(id: string): Promise<boolean>;
  
  // Admin Sessions
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<number>;
  
  // News Team Members (many-to-many relationship)
  getNewsByTeamMemberId(teamMemberId: string): Promise<News[]>;
  getTeamMembersByNewsId(newsId: string): Promise<TeamMember[]>;
  addTeamMemberToNews(newsId: string, teamMemberId: string): Promise<void>;
  removeTeamMemberFromNews(newsId: string, teamMemberId: string): Promise<void>;
  
  // Events CRUD
  getEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Rankings CRUD
  getRankings(): Promise<FirmRanking[]>;
  getRankingById(id: string): Promise<FirmRanking | undefined>;
  createRanking(ranking: InsertRanking): Promise<FirmRanking>;
  updateRanking(id: string, ranking: Partial<InsertRanking>): Promise<FirmRanking | undefined>;
  deleteRanking(id: string): Promise<boolean>;
  
  // Awards CRUD
  getAwards(): Promise<Award[]>;
  getAwardById(id: string): Promise<Award | undefined>;
  createAward(award: InsertAward): Promise<Award>;
  updateAward(id: string, award: Partial<InsertAward>): Promise<Award | undefined>;
  deleteAward(id: string): Promise<boolean>;
  
  // Representative Clients CRUD
  getRepresentativeClients(): Promise<RepresentativeClient[]>;
  getRepresentativeClientById(id: string): Promise<RepresentativeClient | undefined>;
  createRepresentativeClient(client: InsertRepresentativeClient): Promise<RepresentativeClient>;
  updateRepresentativeClient(id: string, client: Partial<InsertRepresentativeClient>): Promise<RepresentativeClient | undefined>;
  deleteRepresentativeClient(id: string): Promise<boolean>;
  
  // Testimonials CRUD
  getTestimonials(): Promise<Testimonial[]>;
  getTestimonialById(id: string): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;
  
  // Job Openings CRUD
  getJobOpenings(): Promise<JobOpening[]>;
  getJobOpeningById(id: string): Promise<JobOpening | undefined>;
  createJobOpening(job: InsertJobOpening): Promise<JobOpening>;
  updateJobOpening(id: string, job: Partial<InsertJobOpening>): Promise<JobOpening | undefined>;
  deleteJobOpening(id: string): Promise<boolean>;
  
  // Offices CRUD
  getOffices(): Promise<Office[]>;
  getOfficeById(id: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined>;
  deleteOffice(id: string): Promise<boolean>;
  
  // Alliances CRUD
  getAlliances(): Promise<Alliance[]>;
  getAllianceById(id: string): Promise<Alliance | undefined>;
  createAlliance(alliance: InsertAlliance): Promise<Alliance>;
  updateAlliance(id: string, alliance: Partial<InsertAlliance>): Promise<Alliance | undefined>;
  deleteAlliance(id: string): Promise<boolean>;
  
  // Specialized Desks CRUD
  getSpecializedDesks(): Promise<SpecializedDesk[]>;
  getSpecializedDeskById(id: string): Promise<SpecializedDesk | undefined>;
  createSpecializedDesk(desk: InsertSpecializedDesk): Promise<SpecializedDesk>;
  updateSpecializedDesk(id: string, desk: Partial<InsertSpecializedDesk>): Promise<SpecializedDesk | undefined>;
  deleteSpecializedDesk(id: string): Promise<boolean>;
  
  // Translation Cache
  getTranslation(contentType: string, entityId: string, field: string, targetLanguage: string): Promise<TranslationCache | undefined>;
  getTranslations(contentType: string, entityId: string, targetLanguage: string): Promise<TranslationCache[]>;
  saveTranslation(translation: InsertTranslationCache): Promise<TranslationCache>;
  
  // News translations
  getNewsTranslations(newsId: string): Promise<NewsTranslation[]>;
  getNewsTranslation(newsId: string, language: string): Promise<NewsTranslation | undefined>;
  getNewsTranslationCounts(): Promise<Record<string, number>>;
  getNewsTranslationStatus(): Promise<Array<{
    articleId: string;
    title: string;
    slug: string;
    category: string;
    translatedLanguages: string[];
    missingLanguages: string[];
  }>>;
  upsertNewsTranslation(data: InsertNewsTranslation): Promise<NewsTranslation>;
  deleteNewsTranslations(newsId: string): Promise<boolean>;
  getNewsWithTranslations(newsId: string): Promise<{ news: News; translations: NewsTranslation[] } | undefined>;
  
  // Website Audits
  createWebsiteAudit(audit: InsertWebsiteAudit): Promise<WebsiteAudit>;
  getWebsiteAudit(id: string): Promise<WebsiteAudit | undefined>;
  getWebsiteAudits(limit?: number): Promise<WebsiteAudit[]>;
  getLatestWebsiteAudit(): Promise<WebsiteAudit | undefined>;
  updateWebsiteAudit(id: string, data: Partial<InsertWebsiteAudit>): Promise<WebsiteAudit | undefined>;
  
  // Website Audit Findings
  createWebsiteAuditFinding(finding: InsertWebsiteAuditFinding): Promise<WebsiteAuditFinding>;
  createWebsiteAuditFindings(findings: InsertWebsiteAuditFinding[]): Promise<WebsiteAuditFinding[]>;
  getWebsiteAuditFindings(auditId: string): Promise<WebsiteAuditFinding[]>;
  getWebsiteAuditFindingsByCategory(auditId: string, category: string): Promise<WebsiteAuditFinding[]>;
  getWebsiteAuditFindingsBySeverity(auditId: string, severity: string): Promise<WebsiteAuditFinding[]>;
  getOpenFindings(): Promise<WebsiteAuditFinding[]>;
  updateWebsiteAuditFinding(id: string, data: Partial<InsertWebsiteAuditFinding>): Promise<WebsiteAuditFinding | undefined>;
  resolveWebsiteAuditFinding(id: string, resolvedBy: string): Promise<WebsiteAuditFinding | undefined>;

  // Contact Submissions
  createContactSubmission(data: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  markContactSubmissionRead(id: string): Promise<boolean>;

  // Newsletter Subscribers
  createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<{ subscriber: NewsletterSubscriber; created: boolean }>;
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;

  // FAQs
  getFaqs(): Promise<Faq[]>;
  getAllFaqs(): Promise<Faq[]>;
  getFaqById(id: string): Promise<Faq | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, data: Partial<InsertFaq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;

  // Pro Bono Projects
  getProBonoProjects(): Promise<ProBonoProject[]>;
  getAllProBonoProjects(): Promise<ProBonoProject[]>;
  getProBonoProjectById(id: string): Promise<ProBonoProject | undefined>;
  createProBonoProject(project: InsertProBonoProject): Promise<ProBonoProject>;
  updateProBonoProject(id: string, data: Partial<InsertProBonoProject>): Promise<ProBonoProject | undefined>;
  deleteProBonoProject(id: string): Promise<boolean>;

  // Diversity Initiatives
  getDiversityInitiatives(): Promise<DiversityInitiative[]>;
  getAllDiversityInitiatives(): Promise<DiversityInitiative[]>;
  getDiversityInitiativeById(id: string): Promise<DiversityInitiative | undefined>;
  createDiversityInitiative(initiative: InsertDiversityInitiative): Promise<DiversityInitiative>;
  updateDiversityInitiative(id: string, data: Partial<InsertDiversityInitiative>): Promise<DiversityInitiative | undefined>;
  deleteDiversityInitiative(id: string): Promise<boolean>;
}

const siteContent: SiteContent = {
  heroTitle: "WE GO WHERE CLIENTS NEED US",
  heroSubtitle: "New offices of Von Wobeser y Sierra",
  visionTitle: "A vision of the future, collaboration, and excellence",
  visionText: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco.",
  locationTitle: "New office address",
  locationText: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco",
  statsTitle: "Collaboration, technology and well-being",
  quoteText: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity.",
  quoteAuthor: "Fernando Carreño",
  quoteRole: "Partner and member of the Executive Committee",
  address: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco, C.P. 11560, Ciudad de México",
  phone: "+52 55 5258 1000",
  email: "info@vonwobeser.com",
};

const stats: Stat[] = [
  { value: "5,300", label: "square meters", labelEs: "metros cuadrados" },
  { value: "300+", label: "workstations", labelEs: "estaciones de trabajo" },
  { value: "16", label: "meeting rooms", labelEs: "salas de juntas" },
  { value: "6", label: "levels", labelEs: "niveles" },
];

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getNews(): Promise<News[]> {
    return db.select().from(news).orderBy(desc(news.date));
  }

  // Solo noticias publicadas, filtradas en SQL (WHERE published = true) en vez de
  // cargar toda la tabla y filtrar en memoria. Las rutas públicas no deben exponer
  // borradores/no-publicados.
  async getPublishedNews(): Promise<News[]> {
    return db
      .select()
      .from(news)
      .where(eq(news.published, true))
      .orderBy(desc(news.date));
  }

  // Listado paginado del admin: empuja LIMIT/OFFSET, búsqueda y filtro de categoría a
  // SQL, devuelve count(*) total y proyecta SOLO columnas de tarjeta (sin content/contentEs).
  // Antes se releía toda la tabla con el cuerpo completo en cada página y se filtraba/paginaba
  // en memoria.
  async getNewsPage(opts: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
  }): Promise<{ news: NewsCard[]; total: number }> {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, Math.min(100, opts.limit || 20));
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];
    const search = (opts.search || "").trim();
    if (search) {
      // ILIKE = case-insensitive; cubre los 4 campos de tarjeta como el filtro previo en memoria.
      const pattern = `%${search}%`;
      filters.push(
        sql`(${news.title} ILIKE ${pattern} OR ${news.titleEs} ILIKE ${pattern} OR ${news.excerpt} ILIKE ${pattern} OR ${news.excerptEs} ILIKE ${pattern})`,
      );
    }
    if (opts.category && opts.category !== "all") {
      filters.push(eq(news.category, opts.category));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const cardColumns = {
      id: news.id,
      title: news.title,
      titleEs: news.titleEs,
      excerpt: news.excerpt,
      excerptEs: news.excerptEs,
      slug: news.slug,
      imageUrl: news.imageUrl,
      pdfUrl: news.pdfUrl,
      date: news.date,
      published: news.published,
      category: news.category,
      categoryEs: news.categoryEs,
      authorId: news.authorId,
      processingStatus: news.processingStatus,
      lastError: news.lastError,
      lastProcessedAt: news.lastProcessedAt,
      failedStep: news.failedStep,
      publishAt: news.publishAt,
      councilVerdict: news.councilVerdict,
    } as const;

    const rowsQuery = db.select(cardColumns).from(news);
    const countQuery = db.select({ count: sql<number>`count(*)::int` }).from(news);

    const rows = await (whereClause
      ? rowsQuery.where(whereClause)
      : rowsQuery
    )
      .orderBy(desc(news.date))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await (whereClause ? countQuery.where(whereClause) : countQuery);

    // content/contentEs no se seleccionan; el resto encaja con NewsCard.
    return { news: rows as unknown as NewsCard[], total: count };
  }

  // Agregados de traducciones en UNA query (en vez de N+1: una por noticia).
  // Construye los conteos por idioma y el nº de artículos con alguna traducción en memoria.
  async getNewsTranslationAggregates(): Promise<{
    totalTranslations: number;
    translationsByLanguage: Record<string, number>;
    articlesWithTranslations: number;
  }> {
    const rows = await db
      .select({ newsId: newsTranslations.newsId, language: newsTranslations.language })
      .from(newsTranslations);

    const translationsByLanguage: Record<string, number> = {};
    const articlesWith = new Set<string>();
    for (const r of rows) {
      translationsByLanguage[r.language] = (translationsByLanguage[r.language] || 0) + 1;
      articlesWith.add(r.newsId);
    }

    return {
      totalTranslations: rows.length,
      translationsByLanguage,
      articlesWithTranslations: articlesWith.size,
    };
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
    const [item] = await db.insert(news).values(insertNews).returning();
    return item;
  }

  async updateNews(id: string, data: Partial<InsertNews>): Promise<News | undefined> {
    const [item] = await db
      .update(news)
      .set(data)
      .where(eq(news.id, id))
      .returning();
    return item;
  }

  async deleteNews(id: string): Promise<boolean> {
    // First delete related newsTeamMembers entries
    await db.delete(newsTeamMembers).where(eq(newsTeamMembers.newsId, id));
    // Then delete the news item
    const result = await db.delete(news).where(eq(news.id, id)).returning();
    return result.length > 0;
  }

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

  async deleteOfficeImage(id: string): Promise<boolean> {
    const result = await db.delete(officeImages).where(eq(officeImages.id, id)).returning();
    return result.length > 0;
  }

  getSiteContent(): SiteContent {
    return siteContent;
  }

  getStats(): Stat[] {
    return stats;
  }

  async getPracticeGroups(): Promise<PracticeGroup[]> {
    return db.select().from(practiceGroups).orderBy(asc(practiceGroups.order));
  }

  async getPracticeGroupById(id: string): Promise<PracticeGroup | undefined> {
    const [group] = await db.select().from(practiceGroups).where(eq(practiceGroups.id, id));
    return group;
  }

  async getPracticeGroupBySlug(slug: string): Promise<PracticeGroup | undefined> {
    const [group] = await db.select().from(practiceGroups).where(eq(practiceGroups.slug, slug));
    return group;
  }

  async createPracticeGroup(group: InsertPracticeGroup): Promise<PracticeGroup> {
    const [item] = await db.insert(practiceGroups).values(group).returning();
    return item;
  }

  async getIndustryGroups(): Promise<IndustryGroup[]> {
    return db.select().from(industryGroups).orderBy(asc(industryGroups.order));
  }

  async getIndustryGroupById(id: string): Promise<IndustryGroup | undefined> {
    const [group] = await db.select().from(industryGroups).where(eq(industryGroups.id, id));
    return group;
  }

  async getIndustryGroupBySlug(slug: string): Promise<IndustryGroup | undefined> {
    const [group] = await db.select().from(industryGroups).where(eq(industryGroups.slug, slug));
    return group;
  }

  async createIndustryGroup(group: InsertIndustryGroup): Promise<IndustryGroup> {
    const [item] = await db.insert(industryGroups).values(group).returning();
    return item;
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers).orderBy(asc(teamMembers.order));
  }

  async getTeamMemberById(id: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async getTeamMemberBySlug(slug: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.slug, slug));
    return member;
  }

  async getPartners(): Promise<TeamMember[]> {
    return db.select().from(teamMembers).where(eq(teamMembers.isPartner, true)).orderBy(asc(teamMembers.order));
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    // cast: el tipo Zod-inferido y el tipo de columna JSONB ($type) de Drizzle difieren
    // estructuralmente en rankings/experience/education aunque el dato es válido en runtime.
    const [item] = await db.insert(teamMembers).values(member as any).returning();
    return item;
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [item] = await db
      .update(teamMembers)
      .set(member as any)
      .where(eq(teamMembers.id, id))
      .returning();
    return item;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id))
      .returning();
    return result.length > 0;
  }

  // Practice Group update/delete
  async updatePracticeGroup(id: string, group: Partial<InsertPracticeGroup>): Promise<PracticeGroup | undefined> {
    const [item] = await db
      .update(practiceGroups)
      .set(group)
      .where(eq(practiceGroups.id, id))
      .returning();
    return item;
  }

  async deletePracticeGroup(id: string): Promise<boolean> {
    const result = await db
      .delete(practiceGroups)
      .where(eq(practiceGroups.id, id))
      .returning();
    return result.length > 0;
  }

  // Industry Group update/delete
  async updateIndustryGroup(id: string, group: Partial<InsertIndustryGroup>): Promise<IndustryGroup | undefined> {
    const [item] = await db
      .update(industryGroups)
      .set(group)
      .where(eq(industryGroups.id, id))
      .returning();
    return item;
  }

  async deleteIndustryGroup(id: string): Promise<boolean> {
    const result = await db
      .delete(industryGroups)
      .where(eq(industryGroups.id, id))
      .returning();
    return result.length > 0;
  }

  async getRepresentativeMatters(): Promise<RepresentativeMatterDb[]> {
    return db.select().from(representativeMatters).orderBy(desc(representativeMatters.year), asc(representativeMatters.order));
  }

  async createRepresentativeMatter(matter: InsertRepresentativeMatter): Promise<RepresentativeMatterDb> {
    const [item] = await db.insert(representativeMatters).values(matter).returning();
    return item;
  }

  // Admin User CRUD
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [item] = await db.insert(adminUsers).values(user).returning();
    return item;
  }

  async hasAnyAdminUser(): Promise<boolean> {
    const [user] = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
    return !!user;
  }

  async updateAdminUserLogin(id: string): Promise<AdminUser | undefined> {
    const [user] = await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return user;
  }

  // Blog Posts CRUD
  async getBlogPosts(): Promise<BlogPost[]> {
    return db
      .select()
      .from(blogPosts)
      .where(isNull(blogPosts.deletedAt))
      .orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.id, id), isNull(blogPosts.deletedAt)));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [item] = await db.insert(blogPosts).values(post).returning();
    return item;
  }

  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [item] = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return item;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const [item] = await db
      .update(blogPosts)
      .set({ deletedAt: new Date(), status: "trash" })
      .where(eq(blogPosts.id, id))
      .returning();
    return !!item;
  }

  // Blog Categories CRUD
  async getBlogCategories(): Promise<BlogCategory[]> {
    return db.select().from(blogCategories).orderBy(asc(blogCategories.order));
  }

  async getBlogCategoryById(id: string): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
    return category;
  }

  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const [item] = await db.insert(blogCategories).values(category).returning();
    return item;
  }

  async updateBlogCategory(id: string, category: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    const [item] = await db
      .update(blogCategories)
      .set(category)
      .where(eq(blogCategories.id, id))
      .returning();
    return item;
  }

  async deleteBlogCategory(id: string): Promise<boolean> {
    const result = await db.delete(blogCategories).where(eq(blogCategories.id, id)).returning();
    return result.length > 0;
  }

  // Blog Tags CRUD
  async getBlogTags(): Promise<BlogTag[]> {
    return db.select().from(blogTags).orderBy(asc(blogTags.name));
  }

  async createBlogTag(tag: InsertBlogTag): Promise<BlogTag> {
    const [item] = await db.insert(blogTags).values(tag).returning();
    return item;
  }

  async deleteBlogTag(id: string): Promise<boolean> {
    await db.delete(blogPostTags).where(eq(blogPostTags.tagId, id));
    const result = await db.delete(blogTags).where(eq(blogTags.id, id)).returning();
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

  // Admin Sessions
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const [item] = await db.insert(adminSessions).values(session).returning();
    return item;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const [session] = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
    return session;
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    const result = await db.delete(adminSessions).where(eq(adminSessions.token, token)).returning();
    return result.length > 0;
  }

  async cleanExpiredSessions(): Promise<number> {
    const result = await db
      .delete(adminSessions)
      .where(sql`${adminSessions.expiresAt} < NOW()`)
      .returning();
    return result.length;
  }

  // News Team Members (many-to-many relationship)
  async getNewsByTeamMemberId(teamMemberId: string): Promise<News[]> {
    const pivotRows = await db
      .select()
      .from(newsTeamMembers)
      .where(eq(newsTeamMembers.teamMemberId, teamMemberId));
    
    if (pivotRows.length === 0) {
      return [];
    }
    
    // Una sola query con inArray en vez de un SELECT por noticia (antes N+1).
    const newsIds = pivotRows.map(row => row.newsId);
    return db
      .select()
      .from(news)
      .where(inArray(news.id, newsIds))
      .orderBy(desc(news.date));
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
    const result: TeamMember[] = [];
    
    for (const teamMemberId of teamMemberIds) {
      const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, teamMemberId));
      if (member) {
        result.push(member);
      }
    }
    
    return result;
  }

  async addTeamMemberToNews(newsId: string, teamMemberId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(newsTeamMembers)
      .where(and(eq(newsTeamMembers.newsId, newsId), eq(newsTeamMembers.teamMemberId, teamMemberId)));
    
    if (!existing) {
      await db.insert(newsTeamMembers).values({ newsId, teamMemberId });
    }
  }

  async removeTeamMemberFromNews(newsId: string, teamMemberId: string): Promise<void> {
    await db
      .delete(newsTeamMembers)
      .where(and(eq(newsTeamMembers.newsId, newsId), eq(newsTeamMembers.teamMemberId, teamMemberId)));
  }

  // Events CRUD
  async getEvents(): Promise<Event[]> {
    return db.select().from(events).where(eq(events.published, true)).orderBy(desc(events.date));
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getUpcomingEvents(limit: number = 4): Promise<Event[]> {
    const now = new Date();
    return db
      .select()
      .from(events)
      .where(and(eq(events.published, true), gte(events.date, now)))
      .orderBy(asc(events.date))
      .limit(limit);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [item] = await db.insert(events).values(event).returning();
    return item;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(eventData).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Rankings CRUD
  async getRankings(): Promise<FirmRanking[]> {
    return db.select().from(rankings).orderBy(desc(rankings.year), asc(rankings.order));
  }

  async getRankingById(id: string): Promise<FirmRanking | undefined> {
    const [ranking] = await db.select().from(rankings).where(eq(rankings.id, id));
    return ranking;
  }

  async createRanking(ranking: InsertRanking): Promise<FirmRanking> {
    const [item] = await db.insert(rankings).values(ranking).returning();
    return item;
  }

  async updateRanking(id: string, rankingData: Partial<InsertRanking>): Promise<FirmRanking | undefined> {
    const [updated] = await db.update(rankings).set(rankingData).where(eq(rankings.id, id)).returning();
    return updated;
  }

  async deleteRanking(id: string): Promise<boolean> {
    const result = await db.delete(rankings).where(eq(rankings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Awards CRUD
  async getAwards(): Promise<Award[]> {
    return db.select().from(awards).orderBy(desc(awards.year), asc(awards.order));
  }

  async getAwardById(id: string): Promise<Award | undefined> {
    const [award] = await db.select().from(awards).where(eq(awards.id, id));
    return award;
  }

  async createAward(award: InsertAward): Promise<Award> {
    const [item] = await db.insert(awards).values(award).returning();
    return item;
  }

  async updateAward(id: string, awardData: Partial<InsertAward>): Promise<Award | undefined> {
    const [updated] = await db.update(awards).set(awardData).where(eq(awards.id, id)).returning();
    return updated;
  }

  async deleteAward(id: string): Promise<boolean> {
    const result = await db.delete(awards).where(eq(awards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Representative Clients CRUD
  async getRepresentativeClients(): Promise<RepresentativeClient[]> {
    return db.select().from(representativeClients).orderBy(asc(representativeClients.order));
  }

  async getRepresentativeClientById(id: string): Promise<RepresentativeClient | undefined> {
    const [client] = await db.select().from(representativeClients).where(eq(representativeClients.id, id));
    return client;
  }

  async createRepresentativeClient(client: InsertRepresentativeClient): Promise<RepresentativeClient> {
    const [item] = await db.insert(representativeClients).values(client).returning();
    return item;
  }

  async updateRepresentativeClient(id: string, clientData: Partial<InsertRepresentativeClient>): Promise<RepresentativeClient | undefined> {
    const [updated] = await db.update(representativeClients).set(clientData).where(eq(representativeClients.id, id)).returning();
    return updated;
  }

  async deleteRepresentativeClient(id: string): Promise<boolean> {
    const result = await db.delete(representativeClients).where(eq(representativeClients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Testimonials CRUD
  async getTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).orderBy(asc(testimonials.order));
  }

  async getTestimonialById(id: string): Promise<Testimonial | undefined> {
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return testimonial;
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [item] = await db.insert(testimonials).values(testimonial).returning();
    return item;
  }

  async updateTestimonial(id: string, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [updated] = await db.update(testimonials).set(testimonialData).where(eq(testimonials.id, id)).returning();
    return updated;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    const result = await db.delete(testimonials).where(eq(testimonials.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Job Openings CRUD
  async getJobOpenings(): Promise<JobOpening[]> {
    return db.select().from(jobOpenings).orderBy(desc(jobOpenings.createdAt));
  }

  async getJobOpeningById(id: string): Promise<JobOpening | undefined> {
    const [job] = await db.select().from(jobOpenings).where(eq(jobOpenings.id, id));
    return job;
  }

  async createJobOpening(job: InsertJobOpening): Promise<JobOpening> {
    const [item] = await db.insert(jobOpenings).values(job).returning();
    return item;
  }

  async updateJobOpening(id: string, jobData: Partial<InsertJobOpening>): Promise<JobOpening | undefined> {
    const [updated] = await db.update(jobOpenings).set(jobData).where(eq(jobOpenings.id, id)).returning();
    return updated;
  }

  async deleteJobOpening(id: string): Promise<boolean> {
    const result = await db.delete(jobOpenings).where(eq(jobOpenings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Offices CRUD
  async getOffices(): Promise<Office[]> {
    return db.select().from(offices).orderBy(asc(offices.order));
  }

  async getOfficeById(id: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.id, id));
    return office;
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const [item] = await db.insert(offices).values(office).returning();
    return item;
  }

  async updateOffice(id: string, officeData: Partial<InsertOffice>): Promise<Office | undefined> {
    const [updated] = await db.update(offices).set(officeData).where(eq(offices.id, id)).returning();
    return updated;
  }

  async deleteOffice(id: string): Promise<boolean> {
    const result = await db.delete(offices).where(eq(offices.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Alliances CRUD
  async getAlliances(): Promise<Alliance[]> {
    return db.select().from(alliances).orderBy(asc(alliances.order));
  }

  async getAllianceById(id: string): Promise<Alliance | undefined> {
    const [alliance] = await db.select().from(alliances).where(eq(alliances.id, id));
    return alliance;
  }

  async createAlliance(alliance: InsertAlliance): Promise<Alliance> {
    const [item] = await db.insert(alliances).values(alliance).returning();
    return item;
  }

  async updateAlliance(id: string, allianceData: Partial<InsertAlliance>): Promise<Alliance | undefined> {
    const [updated] = await db.update(alliances).set(allianceData).where(eq(alliances.id, id)).returning();
    return updated;
  }

  async deleteAlliance(id: string): Promise<boolean> {
    const result = await db.delete(alliances).where(eq(alliances.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Specialized Desks CRUD
  async getSpecializedDesks(): Promise<SpecializedDesk[]> {
    return db.select().from(specializedDesks).orderBy(asc(specializedDesks.order));
  }

  async getSpecializedDeskById(id: string): Promise<SpecializedDesk | undefined> {
    const [desk] = await db.select().from(specializedDesks).where(eq(specializedDesks.id, id));
    return desk;
  }

  async createSpecializedDesk(desk: InsertSpecializedDesk): Promise<SpecializedDesk> {
    const [item] = await db.insert(specializedDesks).values(desk).returning();
    return item;
  }

  async updateSpecializedDesk(id: string, deskData: Partial<InsertSpecializedDesk>): Promise<SpecializedDesk | undefined> {
    const [updated] = await db.update(specializedDesks).set(deskData).where(eq(specializedDesks.id, id)).returning();
    return updated;
  }

  async deleteSpecializedDesk(id: string): Promise<boolean> {
    const result = await db.delete(specializedDesks).where(eq(specializedDesks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

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
    const allTranslations = await db.select().from(newsTranslations);
    const counts: Record<string, number> = {};
    for (const translation of allTranslations) {
      counts[translation.newsId] = (counts[translation.newsId] || 0) + 1;
    }
    return counts;
  }

  // Estado de traducción por artículo, en el shape que consume el panel admin
  // (AdminTranslations). El sitio es BILINGÜE NATIVO EN/ES: cada noticia tiene
  // sus campos en inglés (title/excerpt/content) y español (titleEs/excerptEs/
  // contentEs, notNull), así que en/es cuentan siempre como traducidos y no hay
  // idiomas adicionales que gestionar → missingLanguages es siempre vacío y el
  // panel refleja cobertura bilingüe (no un flujo de traducción a más idiomas).
  async getNewsTranslationStatus(): Promise<Array<{
    articleId: string;
    title: string;
    slug: string;
    category: string;
    translatedLanguages: string[];
    missingLanguages: string[];
  }>> {
    const SUPPORTED = ["en", "es"];

    const allNews = await db.select().from(news);

    return allNews.map((n) => ({
      articleId: n.id,
      title: n.title,
      slug: n.slug,
      category: n.category ?? "press",
      translatedLanguages: [...SUPPORTED],
      missingLanguages: [],
    }));
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

  // Website Audits
  async createWebsiteAudit(audit: InsertWebsiteAudit): Promise<WebsiteAudit> {
    const [item] = await db.insert(websiteAudits).values(audit).returning();
    return item;
  }

  async getWebsiteAudit(id: string): Promise<WebsiteAudit | undefined> {
    const [audit] = await db.select().from(websiteAudits).where(eq(websiteAudits.id, id));
    return audit;
  }

  async getWebsiteAudits(limit: number = 20): Promise<WebsiteAudit[]> {
    return db.select().from(websiteAudits).orderBy(desc(websiteAudits.startedAt)).limit(limit);
  }

  async getLatestWebsiteAudit(): Promise<WebsiteAudit | undefined> {
    const [audit] = await db.select().from(websiteAudits).orderBy(desc(websiteAudits.startedAt)).limit(1);
    return audit;
  }

  async updateWebsiteAudit(id: string, data: Partial<InsertWebsiteAudit>): Promise<WebsiteAudit | undefined> {
    const [item] = await db.update(websiteAudits).set(data).where(eq(websiteAudits.id, id)).returning();
    return item;
  }

  // Website Audit Findings
  async createWebsiteAuditFinding(finding: InsertWebsiteAuditFinding): Promise<WebsiteAuditFinding> {
    const [item] = await db.insert(websiteAuditFindings).values(finding).returning();
    return item;
  }

  async createWebsiteAuditFindings(findings: InsertWebsiteAuditFinding[]): Promise<WebsiteAuditFinding[]> {
    if (findings.length === 0) return [];
    return db.insert(websiteAuditFindings).values(findings).returning();
  }

  async getWebsiteAuditFindings(auditId: string): Promise<WebsiteAuditFinding[]> {
    return db.select().from(websiteAuditFindings).where(eq(websiteAuditFindings.auditId, auditId)).orderBy(desc(websiteAuditFindings.reportedAt));
  }

  async getWebsiteAuditFindingsByCategory(auditId: string, category: string): Promise<WebsiteAuditFinding[]> {
    return db.select().from(websiteAuditFindings).where(
      and(
        eq(websiteAuditFindings.auditId, auditId),
        eq(websiteAuditFindings.category, category)
      )
    ).orderBy(desc(websiteAuditFindings.reportedAt));
  }

  async getWebsiteAuditFindingsBySeverity(auditId: string, severity: string): Promise<WebsiteAuditFinding[]> {
    return db.select().from(websiteAuditFindings).where(
      and(
        eq(websiteAuditFindings.auditId, auditId),
        eq(websiteAuditFindings.severity, severity)
      )
    ).orderBy(desc(websiteAuditFindings.reportedAt));
  }

  async getOpenFindings(): Promise<WebsiteAuditFinding[]> {
    return db.select().from(websiteAuditFindings).where(
      eq(websiteAuditFindings.status, 'open')
    ).orderBy(desc(websiteAuditFindings.reportedAt));
  }

  async updateWebsiteAuditFinding(id: string, data: Partial<InsertWebsiteAuditFinding>): Promise<WebsiteAuditFinding | undefined> {
    const [item] = await db.update(websiteAuditFindings).set(data).where(eq(websiteAuditFindings.id, id)).returning();
    return item;
  }

  async resolveWebsiteAuditFinding(id: string, resolvedBy: string): Promise<WebsiteAuditFinding | undefined> {
    const [item] = await db.update(websiteAuditFindings).set({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy
    }).where(eq(websiteAuditFindings.id, id)).returning();
    return item;
  }

  async createContactSubmission(data: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(data).returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.submittedAt));
  }

  async markContactSubmissionRead(id: string): Promise<boolean> {
    const result = await db.update(contactSubmissions).set({ read: true }).where(eq(contactSubmissions.id, id)).returning({ id: contactSubmissions.id });
    return result.length > 0;
  }

  // Newsletter Subscribers
  async createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<{ subscriber: NewsletterSubscriber; created: boolean }> {
    // Insert; if the email already exists (unique constraint) do nothing and
    // return the existing record so the caller can report a friendly "already subscribed".
    const [inserted] = await db
      .insert(newsletterSubscribers)
      .values(data)
      .onConflictDoNothing({ target: newsletterSubscribers.email })
      .returning();

    if (inserted) {
      return { subscriber: inserted, created: true };
    }

    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, data.email));
    return { subscriber: existing, created: false };
  }

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  // FAQs
  async getFaqs(): Promise<Faq[]> {
    return db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.order));
  }

  async getAllFaqs(): Promise<Faq[]> {
    return db.select().from(faqs).orderBy(asc(faqs.order));
  }

  async getFaqById(id: string): Promise<Faq | undefined> {
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq;
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [item] = await db.insert(faqs).values(faq).returning();
    return item;
  }

  async updateFaq(id: string, data: Partial<InsertFaq>): Promise<Faq | undefined> {
    const [updated] = await db.update(faqs).set(data).where(eq(faqs.id, id)).returning();
    return updated;
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db.delete(faqs).where(eq(faqs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Pro Bono Projects
  async getProBonoProjects(): Promise<ProBonoProject[]> {
    return db.select().from(proBonoProjects).where(eq(proBonoProjects.published, true)).orderBy(asc(proBonoProjects.order));
  }

  async getAllProBonoProjects(): Promise<ProBonoProject[]> {
    return db.select().from(proBonoProjects).orderBy(asc(proBonoProjects.order));
  }

  async getProBonoProjectById(id: string): Promise<ProBonoProject | undefined> {
    const [project] = await db.select().from(proBonoProjects).where(eq(proBonoProjects.id, id));
    return project;
  }

  async createProBonoProject(project: InsertProBonoProject): Promise<ProBonoProject> {
    const [item] = await db.insert(proBonoProjects).values(project).returning();
    return item;
  }

  async updateProBonoProject(id: string, data: Partial<InsertProBonoProject>): Promise<ProBonoProject | undefined> {
    const [updated] = await db.update(proBonoProjects).set(data).where(eq(proBonoProjects.id, id)).returning();
    return updated;
  }

  async deleteProBonoProject(id: string): Promise<boolean> {
    const result = await db.delete(proBonoProjects).where(eq(proBonoProjects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Diversity Initiatives
  async getDiversityInitiatives(): Promise<DiversityInitiative[]> {
    return db.select().from(diversityInitiatives).where(eq(diversityInitiatives.published, true)).orderBy(asc(diversityInitiatives.order));
  }

  async getAllDiversityInitiatives(): Promise<DiversityInitiative[]> {
    return db.select().from(diversityInitiatives).orderBy(asc(diversityInitiatives.order));
  }

  async getDiversityInitiativeById(id: string): Promise<DiversityInitiative | undefined> {
    const [initiative] = await db.select().from(diversityInitiatives).where(eq(diversityInitiatives.id, id));
    return initiative;
  }

  async createDiversityInitiative(initiative: InsertDiversityInitiative): Promise<DiversityInitiative> {
    const [item] = await db.insert(diversityInitiatives).values(initiative).returning();
    return item;
  }

  async updateDiversityInitiative(id: string, data: Partial<InsertDiversityInitiative>): Promise<DiversityInitiative | undefined> {
    const [updated] = await db.update(diversityInitiatives).set(data).where(eq(diversityInitiatives.id, id)).returning();
    return updated;
  }

  async deleteDiversityInitiative(id: string): Promise<boolean> {
    const result = await db.delete(diversityInitiatives).where(eq(diversityInitiatives.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
