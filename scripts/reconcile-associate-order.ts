import "dotenv/config";
import pg from "pg";
import { CURRENT_ASSOCIATE_ORDER, MIRROR_ONLY_ASSOCIATE_NAMES } from "@shared/attorneyOrder";

const confirmation = process.env.CONFIRM_ASSOCIATE_ORDER_RECONCILIATION;
if (confirmation !== "1") {
  throw new Error("Set CONFIRM_ASSOCIATE_ORDER_RECONCILIATION=1 to apply the approved Associate order.");
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
    "SELECT id, name FROM team_members WHERE title = 'Associate' FOR UPDATE",
  );

  const idsByName = new Map<string, string>();
  for (const member of result.rows) {
    const key = normalize(member.name);
    if (idsByName.has(key)) throw new Error(`Duplicate Associate name: ${member.name}`);
    idsByName.set(key, member.id);
  }

  const approvedKeys = new Set(CURRENT_ASSOCIATE_ORDER.map(normalize));
  const mirrorOnlyKeys = new Set(MIRROR_ONLY_ASSOCIATE_NAMES.map(normalize));
  const missing = CURRENT_ASSOCIATE_ORDER.filter((name) => !idsByName.has(normalize(name)));
  const unexpected = result.rows
    .map((member) => member.name)
    .filter((name) => !approvedKeys.has(normalize(name)));
  if (missing.length || unexpected.length || result.rows.length !== CURRENT_ASSOCIATE_ORDER.length) {
    throw new Error([
      `Expected exactly ${CURRENT_ASSOCIATE_ORDER.length} Associates, found ${result.rows.length}.`,
      missing.length ? `Missing: ${missing.join(", ")}.` : "",
      unexpected.length ? `Unexpected: ${unexpected.join(", ")}.` : "",
    ].filter(Boolean).join(" "));
  }

  for (let index = 0; index < CURRENT_ASSOCIATE_ORDER.length; index += 1) {
    const name = CURRENT_ASSOCIATE_ORDER[index];
    const memberId = idsByName.get(normalize(name));
    if (mirrorOnlyKeys.has(normalize(name))) {
      await client.query(
        'UPDATE team_members SET "order" = $1, published = false WHERE id = $2',
        [index + 1, memberId],
      );
    } else {
      await client.query(
        'UPDATE team_members SET "order" = $1 WHERE id = $2',
        [index + 1, memberId],
      );
    }
  }

  await client.query("COMMIT");
  console.log(`Reconciled ${CURRENT_ASSOCIATE_ORDER.length} Associates and hid ${MIRROR_ONLY_ASSOCIATE_NAMES.length} mirror-only profiles.`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
