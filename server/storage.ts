import { type User, type InsertUser, type News, type InsertNews, type OfficeImage, type InsertOfficeImage, type SiteContent, type Stat } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getNews(): Promise<News[]>;
  getNewsById(id: string): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  getOfficeImages(): Promise<OfficeImage[]>;
  getSiteContent(): SiteContent;
  getStats(): Stat[];
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

const defaultNews: News[] = [
  {
    id: "1",
    title: "Von Wobeser y Sierra completes transition to new offices: a strategic investment in the firm's future",
    titleEs: "Von Wobeser y Sierra completa la transici\u00f3n a nuevas oficinas: una inversi\u00f3n estrat\u00e9gica en el futuro de la firma",
    excerpt: "The firm has completed the move to its new location in Polanco.",
    excerptEs: "La firma ha completado la mudanza a su nueva ubicaci\u00f3n en Polanco.",
    slug: "new-offices-transition",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: new Date("2025-11-15"),
  },
  {
    id: "2",
    title: "Von Wobeser y Sierra has been ranked by Chambers and Partners Latin America 2026",
    titleEs: "Von Wobeser y Sierra ha sido clasificada por Chambers and Partners Latin America 2026",
    excerpt: "The firm continues to be recognized as a leading practice in Mexico.",
    excerptEs: "La firma contin\u00faa siendo reconocida como una pr\u00e1ctica l\u00edder en M\u00e9xico.",
    slug: "chambers-ranking-2026",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: new Date("2025-11-10"),
  },
  {
    id: "3",
    title: "Leading practice groups recognized in international rankings",
    titleEs: "Grupos de pr\u00e1ctica l\u00edderes reconocidos en rankings internacionales",
    excerpt: "Multiple practice areas receive top-tier recognition.",
    excerptEs: "M\u00faltiples \u00e1reas de pr\u00e1ctica reciben reconocimiento de primer nivel.",
    slug: "international-rankings",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: new Date("2025-11-05"),
  },
];

const defaultImages: OfficeImage[] = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", alt: "Modern office collaborative workspace", altEs: "Espacio de trabajo colaborativo moderno", order: 1 },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Office meeting room with city views", altEs: "Sala de juntas con vistas a la ciudad", order: 2 },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Modern reception area", altEs: "\u00c1rea de recepci\u00f3n moderna", order: 3 },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private news: Map<string, News>;
  private officeImages: Map<string, OfficeImage>;

  constructor() {
    this.users = new Map();
    this.news = new Map();
    this.officeImages = new Map();

    defaultNews.forEach((n) => this.news.set(n.id, n));
    defaultImages.forEach((img) => this.officeImages.set(img.id, img));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getNews(): Promise<News[]> {
    return Array.from(this.news.values()).sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }

  async getNewsById(id: string): Promise<News | undefined> {
    return this.news.get(id);
  }

  async createNews(insertNews: InsertNews): Promise<News> {
    const id = randomUUID();
    const newsItem: News = { ...insertNews, id, date: new Date() };
    this.news.set(id, newsItem);
    return newsItem;
  }

  async getOfficeImages(): Promise<OfficeImage[]> {
    return Array.from(this.officeImages.values()).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  }

  getSiteContent(): SiteContent {
    return siteContent;
  }

  getStats(): Stat[] {
    return stats;
  }
}

export const storage = new MemStorage();
