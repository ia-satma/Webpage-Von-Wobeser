import pg from "pg";
import { getPostgresConnectionConfig } from "../../shared/postgres-config.mjs";

export function compileSqlTemplate(strings, values) {
  let text = strings[0];
  for (let index = 0; index < values.length; index += 1) {
    text += `$${index + 1}${strings[index + 1]}`;
  }
  return { text, values };
}

/**
 * Compatibilidad mínima con los tags SQL históricos, respaldada por node-postgres.
 * Acepta tanto sql`select ... ${value}` como sql("sentencia interna confiable").
 */
export function createSqlClient(connectionString, options = {}) {
  const pool = new pg.Pool({
    ...getPostgresConnectionConfig(connectionString, options),
    allowExitOnIdle: true,
    max: options.max ?? 4,
  });

  async function sql(stringsOrText, ...values) {
    const query = Array.isArray(stringsOrText) && Object.hasOwn(stringsOrText, "raw")
      ? compileSqlTemplate(stringsOrText, values)
      : { text: String(stringsOrText), values };
    const result = await pool.query(query);
    return result.rows;
  }

  sql.end = () => pool.end();
  sql.pool = pool;
  return sql;
}
