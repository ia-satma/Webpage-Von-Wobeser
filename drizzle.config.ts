import { defineConfig } from "drizzle-kit";

const migrationDatabaseUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!migrationDatabaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL must be provisioned");
}
if (process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true" && !process.env.DATABASE_MIGRATION_URL) {
  throw new Error("DATABASE_MIGRATION_URL is required when separate database roles are enforced");
}
if (
  process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true"
  && process.env.DATABASE_APP_URL
  && process.env.DATABASE_APP_URL === process.env.DATABASE_MIGRATION_URL
) {
  throw new Error("Application and migration database credentials must be different");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema/**/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationDatabaseUrl,
  },
});
