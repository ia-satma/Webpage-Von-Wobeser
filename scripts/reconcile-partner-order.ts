import "dotenv/config";
import pg from "pg";
import { OFFICIAL_PARTNER_ORDER } from "@shared/attorneyOrder";

const confirmation = process.env.CONFIRM_PARTNER_ORDER_RECONCILIATION;
if (confirmation !== "1") {
  throw new Error("Set CONFIRM_PARTNER_ORDER_RECONCILIATION=1 to apply the verified partner order.");
}

const databaseUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL is required");

const { getPostgresConnectionConfig } = await import("../shared/postgres-config.mjs");
const client = new pg.Client({ ...getPostgresConnectionConfig(databaseUrl) });

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-MX");
}

await client.connect();
try {
  await client.query("BEGIN");
  await client.query("LOCK TABLE team_members IN SHARE ROW EXCLUSIVE MODE");
  const result = await client.query<{ id: string; name: string }>(
    "SELECT id, name FROM team_members WHERE title = 'Partner' FOR UPDATE",
  );
  const idsByName = new Map<string, string>();
  for (const member of result.rows) {
    const key = normalize(member.name);
    if (idsByName.has(key)) throw new Error(`Duplicate Partner name: ${member.name}`);
    idsByName.set(key, member.id);
  }

  const missing = OFFICIAL_PARTNER_ORDER.filter((name) => !idsByName.has(normalize(name)));
  if (missing.length) throw new Error(`Missing verified Partners: ${missing.join(", ")}`);

  for (let index = 0; index < OFFICIAL_PARTNER_ORDER.length; index += 1) {
    const name = OFFICIAL_PARTNER_ORDER[index];
    await client.query(
      'UPDATE team_members SET "order" = $1 WHERE id = $2',
      [index + 1, idsByName.get(normalize(name))],
    );
  }

  await client.query("COMMIT");
  console.log(`Reconciled ${OFFICIAL_PARTNER_ORDER.length} verified Partners in official order.`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
