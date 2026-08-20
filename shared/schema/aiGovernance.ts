import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Evidencia durable sin contenido: conserva solamente clasificación, decisión,
// códigos y huella del material revisado antes de abrir una conexión de IA.
export const aiGovernanceEvents = pgTable("ai_governance_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  operation: text("operation").notNull(),
  purpose: text("purpose").notNull(),
  agentType: text("agent_type"),
  classification: text("classification").notNull(),
  decision: text("decision").notNull(),
  reasonCodes: jsonb("reason_codes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  contentSha256: varchar("content_sha256", { length: 64 }).notNull(),
  contentBytes: integer("content_bytes").notNull(),
  policyVersion: text("policy_version").notNull(),
  actorId: varchar("actor_id"),
  jobId: varchar("job_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  createdIdx: index("ai_governance_events_created_idx").on(table.createdAt),
  decisionCreatedIdx: index("ai_governance_events_decision_created_idx").on(table.decision, table.createdAt),
}));

export type AiGovernanceEvent = typeof aiGovernanceEvents.$inferSelect;

// Copia cifrada aditiva de campos sensibles. No sustituye ni elimina columnas
// históricas; esa transición requiere respaldo, restauración y autorización.
export const protectedFieldEnvelopes = pgTable("protected_field_envelopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  fieldName: text("field_name").notNull(),
  ciphertext: text("ciphertext").notNull(),
  keyId: text("key_id").notNull(),
  encryptionVersion: integer("encryption_version").notNull().default(1),
  contentSha256: varchar("content_sha256", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  resourceIdx: index("protected_field_envelopes_resource_idx").on(table.resourceType, table.resourceId),
  versionUnique: uniqueIndex("protected_field_envelopes_version_idx").on(
    table.resourceType,
    table.resourceId,
    table.fieldName,
    table.encryptionVersion,
  ),
}));

export type ProtectedFieldEnvelope = typeof protectedFieldEnvelopes.$inferSelect;
