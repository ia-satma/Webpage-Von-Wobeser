import type {
  AdminAuthChallenge,
  AdminLoginEvent,
  AdminMfaCredential,
  AdminSession,
  AdminUser,
  Alliance,
  Award,
  CareerApplication,
  ContactSubmission,
  Event,
  FirmRanking,
  GeneratedAudio,
  GeneratedImage,
  GeneratedPresentation,
  MediaDeletionRequest,
  IndustryGroup,
  InsertAdminAuthChallenge,
  InsertAdminLoginEvent,
  InsertAdminMfaCredential,
  InsertAdminSession,
  InsertAdminUser,
  InsertAlliance,
  InsertAward,
  InsertCareerApplication,
  InsertContactSubmission,
  InsertEvent,
  InsertGeneratedAudio,
  InsertGeneratedImage,
  InsertGeneratedPresentation,
  InsertMediaDeletionRequest,
  InsertIndustryGroup,
  InsertJobOpening,
  InsertMediaItem,
  InsertNews,
  InsertNewsExternalLink,
  InsertNewsTranslation,
  InsertNewsletterSubscriber,
  InsertOffice,
  InsertOfficeImage,
  InsertPracticeGroup,
  InsertProcessedOfficialSource,
  InsertRanking,
  InsertRepresentativeClient,
  InsertRepresentativeMatter,
  InsertSpecializedDesk,
  InsertTeamMember,
  InsertTestimonial,
  InsertTranslationCache,
  InsertWebsiteAudit,
  InsertWebsiteAuditFinding,
  JobOpening,
  MediaItem,
  News,
  NewsExternalLink,
  NewsTranslation,
  NewsletterSubscriber,
  Office,
  OfficeImage,
  PracticeGroup,
  ProcessedOfficialSource,
  RepresentativeClient,
  RepresentativeMatterDb,
  SiteContent,
  SpecializedDesk,
  Stat,
  TeamMember,
  AuthorVerificationStatus,
  Testimonial,
  TranslationCache,
  WebsiteAudit,
  WebsiteAuditFinding,
  news,
  rankings,
} from "@shared/schema";
import type { AttorneyOrderCategoryId } from "@shared/attorneyOrder";

export type AdminLoginEventWithIdentity = AdminLoginEvent & {
  userEmail: string | null;
  username: string | null;
  userRole: string | null;
  userExists: boolean;
};

export type NewsTeamMemberRelation = {
  member: TeamMember;
  verificationStatus: AuthorVerificationStatus;
};

export interface IStorage {
  getNews(): Promise<News[]>;
  getRecentNews(limit: number): Promise<News[]>;
  getRecentPublishedNews(limit: number): Promise<News[]>;
  getFeaturedNews(limit: number): Promise<News[]>;
  getNewsPage(limit: number, offset: number): Promise<News[]>;
  getNewsCount(): Promise<number>;
  getPublishedNewsPage(limit: number, offset: number, category?: string): Promise<News[]>;
  getPublishedNewsCount(category?: string): Promise<number>;
  searchPublishedNewsPage(opts: {
    query: string;
    limit: number;
    offset: number;
    category?: string;
  }): Promise<{ rows: News[]; total: number }>;
  getPublishedNewsByTeamMemberIdPage(opts: {
    teamMemberId: string;
    limit: number;
    offset: number;
    query?: string;
    category?: string;
    language?: "en" | "es";
  }): Promise<{ rows: News[]; total: number }>;
  getRelatedPublishedNewsForTeamMembers(opts: {
    teamMemberIds: string[];
    excludeNewsId?: string;
    limit: number;
    language?: "en" | "es";
  }): Promise<News[]>;
  getEditorialRecommendations(opts: {
    excludeNewsId: string;
    teamMemberIds?: string[];
    tags?: string[];
    category?: string | null;
    limit: number;
  }): Promise<News[]>;
  getNewsWithoutTeamMembersPage(opts: { limit: number; offset: number }): Promise<{ rows: News[]; total: number }>;
  getAdminNewsPage(opts: { limit: number; offset: number; search?: string; category?: string }): Promise<{ rows: News[]; total: number }>;
  getTranslationStats(): Promise<{ total: number; byLanguage: Record<string, number>; articlesWithTranslations: number }>;
  getBaseLanguageCoverage(): Promise<{ total: number; missingEnglish: number }>;
  searchNews(q: string, limit: number): Promise<News[]>;
  getNewsById(id: string): Promise<News | undefined>;
  getNewsBySlug(slug: string): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  createNewsWithTeamMembers(news: InsertNews, teamMemberIds: string[]): Promise<News>;
  createNewsProcessingDraft(newsId: string): Promise<News | undefined>;
  updateNews(id: string, data: Partial<InsertNews>): Promise<News | undefined>;
  updateNewsWithTeamMembers(id: string, data: Partial<InsertNews>, teamMemberIds?: string[]): Promise<News | undefined>;
  getNewsExternalLinks(newsId: string): Promise<NewsExternalLink[]>;
  getDisabledNewsExternalUrls(newsId: string): Promise<string[]>;
  getDisabledNewsExternalUrlsByNewsIds(newsIds: string[]): Promise<Map<string, string[]>>;
  upsertNewsExternalLink(data: InsertNewsExternalLink): Promise<NewsExternalLink>;
  deleteNews(id: string): Promise<boolean>;
  getOfficeImages(): Promise<OfficeImage[]>;
  createOfficeImage(image: InsertOfficeImage): Promise<OfficeImage>;
  updateOfficeImage(id: string, data: Partial<InsertOfficeImage>): Promise<OfficeImage | undefined>;
  reorderOfficeImages(ids: string[]): Promise<{ ok: boolean; images: OfficeImage[] }>;
  deleteOfficeImage(id: string): Promise<boolean>;
  getGeneratedImages(): Promise<(GeneratedImage & { articleTitle: string | null; articleSlug: string | null })[]>;
  createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage>;
  deleteGeneratedImage(id: string): Promise<boolean>;
  getGeneratedAudio(): Promise<(GeneratedAudio & { articleTitle: string | null; articleSlug: string | null })[]>;
  createGeneratedAudio(audio: InsertGeneratedAudio): Promise<GeneratedAudio>;
  deleteGeneratedAudio(id: string): Promise<boolean>;
  getGeneratedPresentations(): Promise<GeneratedPresentation[]>;
  getGeneratedPresentationById(id: string): Promise<GeneratedPresentation | undefined>;
  createGeneratedPresentation(presentation: InsertGeneratedPresentation & { id?: string }): Promise<GeneratedPresentation>;
  deleteGeneratedPresentation(id: string): Promise<boolean>;
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
  getTeamMembersForOrder(category: AttorneyOrderCategoryId): Promise<TeamMember[]>;
  reorderTeamMembers(category: AttorneyOrderCategoryId, ids: string[], expectedVersion: string): Promise<
    | { ok: true; members: TeamMember[] }
    | { ok: false; reason: "stale" }
  >;
  getTeamMemberPracticeGroupIds(teamMemberId: string): Promise<string[]>;
  getTeamMemberIndustryGroupIds(teamMemberId: string): Promise<string[]>;
  setTeamMemberPracticeGroups(teamMemberId: string, practiceGroupIds: string[]): Promise<void>;
  setTeamMemberIndustryGroups(teamMemberId: string, industryGroupIds: string[]): Promise<void>;
  searchTeamMembers(filters: { q?: string; title?: string; practiceGroupId?: string }): Promise<TeamMember[]>;
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
  countAdminUsers(): Promise<number>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserLogin(id: string): Promise<AdminUser | undefined>;
  getAdminUsers(): Promise<Omit<AdminUser, "passwordHash">[]>;
  updateAdminUser(id: string, data: Partial<Pick<AdminUser, "role" | "isActive" | "permissions" | "mustChangePassword" | "passwordChangedAt">>): Promise<AdminUser | undefined>;
  setAdminUserPassword(id: string, passwordHash: string, mustChangePassword?: boolean): Promise<boolean>;
  deleteAdminUser(id: string): Promise<boolean>;
  recordLoginEvent(data: InsertAdminLoginEvent): Promise<void>;
  getLoginEvents(limit?: number): Promise<AdminLoginEventWithIdentity[]>;
  cleanExpiredSecurityRecords(): Promise<{ loginEvents: number; challenges: number; rateLimits: number }>;

  // Media Items CRUD
  getMediaItems(): Promise<MediaItem[]>;
  getMediaItemById(id: string): Promise<MediaItem | undefined>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  deleteMediaItem(id: string): Promise<boolean>;
  queueMediaDeletion(request: InsertMediaDeletionRequest): Promise<MediaDeletionRequest>;

  // Admin Sessions
  createAdminSession(session: InsertAdminSession, maximumActiveSessions: 1 | 2): Promise<AdminSession>;
  getAdminSession(tokenHash: string): Promise<AdminSession | undefined>;
  touchAdminSession(id: string, expiresAt: Date): Promise<void>;
  rotateAdminSessionCsrf(id: string, csrfTokenHash: string): Promise<void>;
  deleteAdminSession(tokenHash: string): Promise<boolean>;
  deleteAdminSessionsByUserId(userId: string): Promise<number>;
  getActiveAdminSessionsByUserId(userId: string): Promise<AdminSession[]>;
  deleteOtherAdminSessionsByUserId(userId: string, currentSessionId: string): Promise<number>;
  deleteAdminSessionByIdForUser(sessionId: string, userId: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<number>;
  getAdminMfaCredential(userId: string): Promise<AdminMfaCredential | undefined>;
  upsertAdminMfaCredential(data: InsertAdminMfaCredential): Promise<AdminMfaCredential>;
  updateAdminMfaCredential(userId: string, data: Partial<Pick<AdminMfaCredential, "encryptedSecret" | "recoveryCodeHashes" | "enabledAt">>): Promise<AdminMfaCredential | undefined>;
  createAdminAuthChallenge(data: InsertAdminAuthChallenge): Promise<AdminAuthChallenge>;
  getAdminAuthChallenge(tokenHash: string): Promise<AdminAuthChallenge | undefined>;
  updateAdminAuthChallengeAttempts(id: string, attempts: number): Promise<void>;
  deleteAdminAuthChallenge(tokenHash: string): Promise<void>;
  deleteAdminAuthChallengesByUserId(userId: string): Promise<void>;

  // News Team Members (many-to-many relationship)
  getNewsByTeamMemberId(teamMemberId: string): Promise<News[]>;
  getTeamMembersByNewsId(newsId: string): Promise<TeamMember[]>;
  getVerifiedTeamMembersByNewsId(newsId: string): Promise<TeamMember[]>;
  getNewsTeamMemberRelations(newsId: string): Promise<NewsTeamMemberRelation[]>;
  setTeamMembersForNews(newsId: string, teamMemberIds: string[]): Promise<void>;
  addTeamMemberToNews(newsId: string, teamMemberId: string): Promise<void>;
  removeTeamMemberFromNews(newsId: string, teamMemberId: string): Promise<void>;

  // Events CRUD
  getEvents(): Promise<Event[]>;
  getAdminEvents(): Promise<Event[]>;
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
  reorderRankings(ids: string[]): Promise<
    | { ok: true; rankings: FirmRanking[] }
    | { ok: false; reason: "stale" }
  >;

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
  getDeskTeamMemberIds(deskId: string): Promise<string[]>;
  getTeamMembersByDesk(deskId: string): Promise<TeamMember[]>;
  setDeskTeamMembers(deskId: string, teamMemberIds: string[]): Promise<void>;

  // Translation Cache
  getTranslation(contentType: string, entityId: string, field: string, targetLanguage: string): Promise<TranslationCache | undefined>;
  getTranslations(contentType: string, entityId: string, targetLanguage: string): Promise<TranslationCache[]>;
  saveTranslation(translation: InsertTranslationCache): Promise<TranslationCache>;

  // News translations
  getNewsTranslations(newsId: string): Promise<NewsTranslation[]>;
  getNewsTranslation(newsId: string, language: string): Promise<NewsTranslation | undefined>;
  getNewsTranslationCounts(): Promise<Record<string, number>>;
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
  getWebsiteAuditFindingsPage(options: {
    auditId?: string;
    status?: string;
    category?: string;
    severity?: string;
    limit: number;
    offset: number;
  }): Promise<{ findings: WebsiteAuditFinding[]; total: number }>;
  supersedeOpenWebsiteAuditFindings(auditId: string, categories: string[]): Promise<number>;
  updateWebsiteAuditFinding(id: string, data: Partial<InsertWebsiteAuditFinding>): Promise<WebsiteAuditFinding | undefined>;
  resolveWebsiteAuditFinding(id: string, resolvedBy: string): Promise<WebsiteAuditFinding | undefined>;

  // Contact Submissions
  createContactSubmission(data: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  markContactSubmissionRead(id: string): Promise<boolean>;
  deleteExpiredContactSubmissions(): Promise<number>;

  // Newsletter (el Desk retirado no altera ni borra sus datos históricos).
  getNewsletterSubscribers(filters?: { search?: string; active?: boolean }): Promise<NewsletterSubscriber[]>;
  getNewsletterSubscriberById(id: string): Promise<NewsletterSubscriber | undefined>;
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  updateNewsletterSubscriber(id: string, data: Partial<InsertNewsletterSubscriber>): Promise<NewsletterSubscriber | undefined>;

  // Career Applications (Pasantes)
  createCareerApplication(data: InsertCareerApplication): Promise<CareerApplication>;
  getCareerApplications(): Promise<CareerApplication[]>;
  getCareerApplication(id: string): Promise<CareerApplication | undefined>;
  getCareerApplicationByCvPath(cvPath: string): Promise<CareerApplication | undefined>;
  markCareerApplicationRead(id: string): Promise<boolean>;
  getExpiredCareerApplications(): Promise<CareerApplication[]>;
  deleteCareerApplications(ids: string[]): Promise<number>;

  // LegalAlertsAgent automático — deduplicación de fuentes oficiales
  isSourceProcessed(sourceUrl: string): Promise<boolean>;
  markSourceProcessed(data: InsertProcessedOfficialSource): Promise<ProcessedOfficialSource>;
}
