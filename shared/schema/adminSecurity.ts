import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// BLOG ADMIN MODULE
// ============================================

// Admin Users with roles
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("editor"), // super_admin, admin, editor, marketing, sistemas
  // Permisos EXTRA por usuario (aditivos sobre los del rol). Solo claves de GRANTABLE (server/auth.ts).
  permissions: jsonb("permissions").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  // Campo heredado conservado por compatibilidad. El flujo actual genera
  // contraseñas definitivas y mantiene este valor en false.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  passwordChangedAt: timestamp("password_changed_at"),
});

// `permissions` se omite del insert (default '[]' en DB; las concesiones extra se aplican con updateAdminUser).
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, lastLogin: true, permissions: true });
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Historial persistente de inicios de sesión (éxitos y fallos). Nunca almacena contraseñas.
export const adminLoginEvents = pgTable(
  "admin_login_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id"), // null si el intento fue sobre un usuario inexistente
    email: text("email").notNull(), // nombre histórico: contiene SHA-256, nunca correo/usuario
    success: boolean("success").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("idx_admin_login_events_created_at").on(table.createdAt),
  }),
);

export const insertAdminLoginEventSchema = createInsertSchema(adminLoginEvents).omit({ id: true, createdAt: true });
export type InsertAdminLoginEvent = z.infer<typeof insertAdminLoginEventSchema>;
export type AdminLoginEvent = typeof adminLoginEvents.$inferSelect;

// Admin sessions for token-based auth
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  // La columna histórica se llama `token`, pero desde este endurecimiento guarda
  // exclusivamente SHA-256(token). El valor crudo solo vive en la cookie HttpOnly.
  tokenHash: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  absoluteExpiresAt: timestamp("absolute_expires_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  csrfTokenHash: text("csrf_token_hash").notNull(),
  // Columna histórica conservada para compatibilidad. El acceso actual usa
  // exclusivamente usuario/contraseña y no condiciona la sesión a este valor.
  mfaVerified: boolean("mfa_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({ id: true, createdAt: true });
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

// Credenciales TOTP. El secreto se cifra con AES-256-GCM antes de persistirse;
// `enabledAt` solo se establece después de comprobar un código válido.
export const adminMfaCredentials = pgTable("admin_mfa_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => adminUsers.id, { onDelete: "cascade" }),
  encryptedSecret: text("encrypted_secret").notNull(),
  recoveryCodeHashes: jsonb("recovery_code_hashes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  enabledAt: timestamp("enabled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminMfaCredentialSchema = createInsertSchema(adminMfaCredentials).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdminMfaCredential = typeof adminMfaCredentials.$inferInsert;
export type AdminMfaCredential = typeof adminMfaCredentials.$inferSelect;

// Desafíos efímeros de MFA. La base conserva exclusivamente el hash SHA-256 del
// token; el valor crudo vive en una cookie HttpOnly, SameSite=Strict y de vida corta.
export const adminAuthChallenges = pgTable("admin_auth_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  purpose: text("purpose").notNull(), // mfa | enroll
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminAuthChallengeSchema = createInsertSchema(adminAuthChallenges).omit({ id: true, createdAt: true });
export type InsertAdminAuthChallenge = z.infer<typeof insertAdminAuthChallengeSchema>;
export type AdminAuthChallenge = typeof adminAuthChallenges.$inferSelect;

// Rate limit compartido entre todas las instancias autoscale de Replit.
export const securityRateLimits = pgTable("security_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at").notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SecurityRateLimit = typeof securityRateLimits.$inferSelect;

// Admin login schema for validation (accepts email or username)
export const adminLoginSchema = z.object({
  username: z.string()
    .trim()
    .min(1, "Email or username is required")
    .max(254)
    // Las altas administrativas guardan el correo en minúsculas. El acceso debe
    // aplicar la misma normalización para que una mayúscula accidental no haga
    // parecer que una cuenta válida no existe. Los nombres de usuario se conservan.
    .transform((value) => value.includes("@") ? value.toLowerCase() : value),
  // El login debe aceptar hashes bcrypt y longitudes heredadas. El rango de
  // 12–16 caracteres se aplica al crear o cambiar credenciales nuevas.
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;

// Blog post creation schema with validation
export const blogPostFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  titleEs: z.string().min(1, "Spanish title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(250),
  content: z.string().optional(),
  contentEs: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  excerptEs: z.string().max(500).optional(),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "published", "trash"]).default("draft"),
  publishedAt: z.date().optional().nullable(),
  metaTitle: z.string().max(70).optional(),
  metaTitleEs: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaDescriptionEs: z.string().max(160).optional(),
  tagIds: z.array(z.string()).optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostFormSchema>;
