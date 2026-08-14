const TYPOGRAPHY_TABLE = "editorial_typography";

/**
 * Detecta exclusivamente la ausencia de la tabla tipográfica. No considera
 * errores de conexión, permisos ni consultas inválidas como recuperables.
 */
export function isMissingEditorialTypographyTable(error: unknown): boolean {
  let current: unknown = error;
  const visited = new Set<unknown>();

  for (let depth = 0; current && depth < 6 && !visited.has(current); depth += 1) {
    visited.add(current);
    if (typeof current !== "object") break;

    const candidate = current as { code?: unknown; message?: unknown; cause?: unknown };
    const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
    const mentionsTable = message.includes(TYPOGRAPHY_TABLE);
    const missingRelation = candidate.code === "42P01" || /relation .* does not exist/.test(message);

    if (mentionsTable && missingRelation) return true;
    current = candidate.cause;
  }

  return false;
}

export function shouldUseAutomaticTypographyFallback(
  error: unknown,
  readOnlySmoke = process.env.SECURITY_READ_ONLY_SMOKE === "true",
): boolean {
  return readOnlySmoke && isMissingEditorialTypographyTable(error);
}
