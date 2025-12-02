import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  excerpt: text("excerpt").notNull(),
  excerptEs: text("excerpt_es").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  date: timestamp("date").defaultNow(),
});

export const insertNewsSchema = createInsertSchema(news).omit({ id: true, date: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

export const officeImages = pgTable("office_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  alt: text("alt").notNull(),
  altEs: text("alt_es").notNull(),
  order: integer("order").default(0),
});

export const insertOfficeImageSchema = createInsertSchema(officeImages).omit({ id: true });
export type InsertOfficeImage = z.infer<typeof insertOfficeImageSchema>;
export type OfficeImage = typeof officeImages.$inferSelect;

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  visionTitle: string;
  visionText: string;
  locationTitle: string;
  locationText: string;
  statsTitle: string;
  quoteText: string;
  quoteAuthor: string;
  quoteRole: string;
  address: string;
  phone: string;
  email: string;
}

export interface Stat {
  value: string;
  label: string;
  labelEs: string;
}

export interface MenuItem {
  label: string;
  labelEs: string;
  href: string;
}
