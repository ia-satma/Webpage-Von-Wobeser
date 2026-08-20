/**
 * Escape for HTML text nodes. Attribute values must use
 * `escapeHtmlAttribute`, which also encodes both quote characters.
 */
export function escapeHtmlText(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape an untrusted value placed inside a quoted HTML attribute. */
export function escapeHtmlAttribute(value: unknown): string {
  return escapeHtmlText(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
