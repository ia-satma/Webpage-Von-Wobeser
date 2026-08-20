/**
 * node-postgres emits `error` on the pool when an idle PostgreSQL connection
 * is closed by the database or its network. EventEmitter treats an unhandled
 * `error` event as fatal, which would otherwise terminate the public server.
 */
export interface DatabasePoolEventSource {
  on(event: "error", listener: (error: unknown) => void): unknown;
}

type DatabasePoolReporter = (message: string) => void;

function safePoolErrorMessage(error: unknown): string {
  const message = error instanceof Error && error.message
    ? error.message
    : "Unknown PostgreSQL pool error";

  // A driver error should not normally contain a URL, but logs must never
  // expose credentials if a provider includes one in its diagnostic text.
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[database-url-redacted]")
    .replace(/password\s*=\s*[^\s,;]+/gi, "password=[redacted]")
    .slice(0, 500);
}

/**
 * Keeps the process alive if an idle pool client disappears. Active requests
 * still receive their regular database error handling; later requests let pg
 * open a fresh connection as designed.
 */
export function attachDatabasePoolErrorHandler(
  pool: DatabasePoolEventSource,
  report: DatabasePoolReporter = (message) => console.error(message),
): void {
  pool.on("error", (error) => {
    report(`[database] idle pool connection error; the client will be replaced: ${safePoolErrorMessage(error)}`);
  });
}
