import "dotenv/config";
import pg from "pg";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

function confirmationEmail(): string {
  return process.argv.find((argument) => argument.startsWith("--confirm="))?.slice("--confirm=".length).trim().toLowerCase() || "";
}

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!email || !password || !databaseUrl) {
    throw new Error("Configura ADMIN_EMAIL, ADMIN_BOOTSTRAP_PASSWORD y DATABASE_URL en Replit Secrets.");
  }
  if (confirmationEmail() !== email) {
    throw new Error("Confirma el correo del Dueño con --confirm=<correo>.");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL no es válido.");
  }

  const { hashPassword, validateNewPassword } = await import("../server/auth");
  const policy = validateNewPassword(password);
  if (!policy.valid) throw new Error(policy.error);

  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl));
  await client.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "select email from admin_users where lower(email) = $1 or lower(username) = $1 for update",
      [email],
    );
    if (existing.rowCount && String(existing.rows[0].email).toLowerCase() !== email) {
      throw new Error("El correo del Dueño colisiona con un nombre de usuario existente.");
    }
    if (!existing.rowCount) {
      const passwordHash = await hashPassword(password);
      await client.query(
        `insert into admin_users (username, email, password_hash, role, is_active, must_change_password, password_changed_at)
         values ($1, $1, $2, 'super_admin', true, false, now())`,
        [email, passwordHash],
      );
      console.log("[handoff-owner] Dueño del cliente creado sin modificar las demás cuentas.");
    } else {
      console.log("[handoff-owner] El Dueño del cliente ya existe; no se modificó su contraseña.");
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error && (
    error.message.startsWith("Configura ")
    || error.message.startsWith("Confirma ")
    || error.message.startsWith("ADMIN_EMAIL")
    || error.message.startsWith("La contraseña")
    || error.message.startsWith("Elige ")
    || error.message.startsWith("El correo")
  ) ? error.message : "No se pudo preparar la cuenta Dueño. Verifica la Database y los Secrets.";
  console.error(`[handoff-owner] ${message}`);
  process.exit(1);
});
