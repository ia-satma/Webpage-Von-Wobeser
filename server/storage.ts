import { eq, desc, asc } from "drizzle-orm";
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
  users,
  news,
  officeImages,
  practiceGroups,
  industryGroups,
  teamMembers,
  representativeMatters,
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
}

const siteContent: SiteContent = {
  heroTitle: "WE GO WHERE CLIENTS NEED US",
  heroSubtitle: "New offices of Von Wobeser y Sierra",
  visionTitle: "A vision of the future, collaboration, and excellence",
  visionText: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos El\u00edseos area in Polanco.",
  locationTitle: "New office address",
  locationText: "Torre SOMA Chapultepec Piso 18. Campos El\u00edseos 204, Polanco",
  statsTitle: "Collaboration, technology and well-being",
  quoteText: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity.",
  quoteAuthor: "Fernando Carre\u00f1o",
  quoteRole: "Partner and member of the Executive Committee",
  address: "Torre SOMA Chapultepec Piso 18. Campos El\u00edseos 204, Polanco, C.P. 11560, Ciudad de M\u00e9xico",
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
}

export const storage = new DatabaseStorage();
