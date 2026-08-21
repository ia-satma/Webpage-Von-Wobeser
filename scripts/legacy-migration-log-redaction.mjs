const LEGACY_DROPBOX_NEWS_MIGRATION = "20260814_0002_dropbox_news_2026.mjs";
const LEGACY_SOURCE_CREDIT_WARNING = /^\[migrations\]\s+[^:]+:\s+authors without a CMS profile were preserved as source credits only:\s*(.*)$/i;

function countDelimitedValues(value) {
  return value.split(/,\s*/).map((item) => item.trim()).filter(Boolean).length;
}

/**
 * Applied migrations are immutable once a deployment records their SHA-256.
 * This adapter preserves the historical migration verbatim while preventing its
 * legacy operational warning from emitting source-credit names or email addresses.
 */
export function redactLegacyMigrationWarning(name, values) {
  if (name !== LEGACY_DROPBOX_NEWS_MIGRATION) return values;

  const message = values.map((value) => String(value)).join(" ");
  const match = message.match(LEGACY_SOURCE_CREDIT_WARNING);
  if (!match) return values;

  const affectedRecords = countDelimitedValues(match[1]);
  return [
    `[data-quality] code=UNRESOLVED_SOURCE_AUTHOR_CREDITS source=dropbox-2026 ` +
    `affected_records=${affectedRecords} details=redacted`,
  ];
}

export async function runMigrationWithRedactedLegacyWarnings(name, migration, client) {
  if (name !== LEGACY_DROPBOX_NEWS_MIGRATION) return migration(client);

  const originalWarn = console.warn;
  console.warn = (...values) => originalWarn(...redactLegacyMigrationWarning(name, values));
  try {
    return await migration(client);
  } finally {
    console.warn = originalWarn;
  }
}
