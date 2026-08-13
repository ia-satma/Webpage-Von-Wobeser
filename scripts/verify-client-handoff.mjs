#!/usr/bin/env node
import "dotenv/config";
import pg from "pg";
import { Client as AppStorageClient } from "@replit/object-storage";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

const PUBLIC_PREFIX = "von-wobeser/public/";
const PRIVATE_PREFIX = "von-wobeser/private/cvs/";

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function storageClient() {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  return new AppStorageClient(bucketId ? { bucketId } : undefined);
}

async function listObjectNames(client, prefix) {
  const result = await client.list({ prefix });
  if (!result.ok) throw new Error(`No se pudo consultar App Storage (${prefix}).`);
  return new Set(result.value.map((item) => item.name));
}

async function verify() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio.");
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!databaseName || option("confirm-database") !== databaseName) {
    throw new Error(`Confirma la base con --confirm-database=${databaseName || "NOMBRE"}.`);
  }

  const database = new pg.Client(getPostgresConnectionConfig(databaseUrl, { readOnly: true }));
  await database.connect();
  let summary;
  try {
    const ownerEmail = normalizedEmail(option("owner-email"));
    const [tables, users, config, applications, practices, industries, attorneys, owner] = await Promise.all([
      database.query("select count(*)::int as count from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'"),
      database.query("select count(*)::int as count from admin_users"),
      database.query("select count(*)::int as count from site_config"),
      database.query("select id, cv_path from career_applications"),
      database.query("select count(*)::int as count from practice_groups"),
      database.query("select count(*)::int as count from industry_groups"),
      database.query("select count(*)::int as count from team_members"),
      ownerEmail
        ? database.query("select exists(select 1 from admin_users where lower(email) = $1) as present", [ownerEmail])
        : Promise.resolve({ rows: [{ present: null }] }),
    ]);
    const appStorage = storageClient();
    const [publicObjects, privateObjects] = await Promise.all([
      listObjectNames(appStorage, PUBLIC_PREFIX),
      listObjectNames(appStorage, PRIVATE_PREFIX),
    ]);
    const privateReferences = applications.rows.filter((row) => String(row.cv_path).startsWith("private:cvs/"));
    const legacyReferences = applications.rows.filter((row) => !String(row.cv_path).startsWith("private:cvs/"));
    const missingPrivateIds = privateReferences
      .filter((row) => !privateObjects.has(`${PRIVATE_PREFIX}${String(row.cv_path).slice("private:cvs/".length)}`))
      .map((row) => row.id);

    summary = {
      database: {
        host: parsed.hostname === "helium" ? "helium" : "managed-external-host",
        name: databaseName,
        tables: tables.rows[0].count,
        adminUsers: users.rows[0].count,
        siteConfigEntries: config.rows[0].count,
        careerApplications: applications.rows.length,
        practiceGroups: practices.rows[0].count,
        industryGroups: industries.rows[0].count,
        teamMembers: attorneys.rows[0].count,
        clientOwnerPresent: owner.rows[0].present,
      },
      appStorage: {
        publicObjects: publicObjects.size,
        privateCvObjects: privateObjects.size,
        privateCvReferences: privateReferences.length,
        legacyCvReferences: legacyReferences.length,
        missingPrivateCvRecords: missingPrivateIds.length,
        missingPrivateCvRecordIds: missingPrivateIds,
      },
    };
  } finally {
    await database.end();
  }

  console.log("[handoff-readiness] Resultado sin credenciales ni datos personales:");
  console.log(JSON.stringify(summary, null, 2));
  if (
    summary.database.tables < 1
    || summary.database.adminUsers < 1
    || summary.database.siteConfigEntries < 1
    || summary.database.practiceGroups < 18
    || summary.database.industryGroups < 7
    || summary.database.teamMembers < 142
    || (option("owner-email") && !summary.database.clientOwnerPresent)
    || summary.appStorage.publicObjects < 1
    || summary.appStorage.legacyCvReferences > 0
    || summary.appStorage.missingPrivateCvRecords > 0
  ) {
    throw new Error("La instalación todavía no cumple los criterios de entrega.");
  }
  console.log("[handoff-readiness] Instalación apta para la validación funcional final.");
}

verify().catch((error) => {
  console.error(`[handoff-readiness] ${error instanceof Error ? error.message : "Error desconocido"}`);
  process.exitCode = 1;
});
