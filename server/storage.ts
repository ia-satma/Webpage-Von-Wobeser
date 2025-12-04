import { eq, desc, asc, and, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type News,
  type InsertNews,
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
  users,
  news,
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
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getNews(): Promise<News[]>;
  getNewsById(id: string): Promise<News | undefined>;
  getNewsBySlug(slug: string): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  getOfficeImages(): Promise<OfficeImage[]>;
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
  getRepresentativeMatters(): Promise<RepresentativeMatterDb[]>;
  createRepresentativeMatter(matter: InsertRepresentativeMatter): Promise<RepresentativeMatterDb>;
  
  // Admin User CRUD
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
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

  async getOfficeImages(): Promise<OfficeImage[]> {
    return db.select().from(officeImages).orderBy(asc(officeImages.order));
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
    const [item] = await db.insert(teamMembers).values(member).returning();
    return item;
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

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [item] = await db.insert(adminUsers).values(user).returning();
    return item;
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
}

export const storage = new DatabaseStorage();
