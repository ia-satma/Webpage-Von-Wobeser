const INTERNAL_HOSTS = new Set(["helium", "localhost", "127.0.0.1", "postgres"]);
const SSL_QUERY_KEYS = ["sslmode", "sslcert", "sslkey", "sslrootcert"];

export function isReplitInternalHost(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();
  return INTERNAL_HOSTS.has(normalized);
}

export function getPostgresConnectionConfig(connectionString, options = {}) {
  if (!connectionString) throw new Error("DATABASE_URL is required");

  let parsed;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol");
  }

  const internal = isReplitInternalHost(parsed.hostname);
  // Solo Helium y hosts locales explícitos operan sin TLS. Un dominio público
  // de Replit no implica que PostgreSQL esté dentro de la red privada.
  // Una URL externa siempre valida el certificado, incluso si intenta incluir
  // `sslmode=disable` en su cadena.
  const useSsl = !internal;

  // `pg` también interpreta los parámetros SSL incluidos en la URL. Se
  // eliminan siempre para que no puedan contradecir la política calculada:
  // Helium/local sin TLS y cualquier destino externo con certificado válido.
  for (const key of SSL_QUERY_KEYS) parsed.searchParams.delete(key);

  return {
    connectionString: parsed.toString(),
    ssl: useSsl ? { rejectUnauthorized: true } : false,
    ...(options.readOnly ? { options: "-c default_transaction_read_only=on" } : {}),
  };
}

export function redactedDatabaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    internal: isReplitInternalHost(parsed.hostname),
  };
}
