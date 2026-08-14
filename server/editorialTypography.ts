import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { editorialTypography } from "@shared/schema";
import {
  isTypographyFamily,
  type TypographyFamily,
  type TypographyLanguage,
  type TypographyStyles,
} from "@shared/editorialTypography";
import { shouldUseAutomaticTypographyFallback } from "./editorialTypographyFallback";

const keyOf = (field: string, language: TypographyLanguage) => `${field}:${language}`;
let warnedAboutMissingTypographyTable = false;

function warnAboutLocalTypographyFallback(): void {
  if (warnedAboutMissingTypographyTable) return;
  warnedAboutMissingTypographyTable = true;
  console.warn(
    "[typography] editorial_typography no existe en la base local; la vista de solo lectura usará la jerarquía automática.",
  );
}

/** Carga sólo las preferencias de una entidad; ausencia significa `auto`. */
export async function getEditorialTypography(entityType: string, entityId: string): Promise<TypographyStyles> {
  let rows;
  try {
    rows = await db
      .select({ field: editorialTypography.field, language: editorialTypography.language, family: editorialTypography.family })
      .from(editorialTypography)
      .where(and(eq(editorialTypography.entityType, entityType), eq(editorialTypography.entityId, entityId)));
  } catch (error) {
    if (!shouldUseAutomaticTypographyFallback(error)) throw error;
    warnAboutLocalTypographyFallback();
    return {};
  }
  return Object.fromEntries(
    rows
      .filter((row) => isTypographyFamily(row.family))
      .map((row) => [keyOf(row.field, row.language as TypographyLanguage), row.family as TypographyFamily]),
  );
}

/** Evita N+1 cuando una página pública muestra una colección. */
export async function getEditorialTypographyForEntities(entityType: string, entityIds: string[]): Promise<Map<string, TypographyStyles>> {
  const result = new Map<string, TypographyStyles>();
  if (!entityIds.length) return result;
  let rows;
  try {
    rows = await db
      .select({ entityId: editorialTypography.entityId, field: editorialTypography.field, language: editorialTypography.language, family: editorialTypography.family })
      .from(editorialTypography)
      .where(and(eq(editorialTypography.entityType, entityType), inArray(editorialTypography.entityId, entityIds)));
  } catch (error) {
    if (!shouldUseAutomaticTypographyFallback(error)) throw error;
    warnAboutLocalTypographyFallback();
    return result;
  }
  for (const row of rows) {
    if (!isTypographyFamily(row.family)) continue;
    const styles = result.get(row.entityId) || {};
    styles[keyOf(row.field, row.language as TypographyLanguage)] = row.family;
    result.set(row.entityId, styles);
  }
  return result;
}

export async function replaceEditorialTypography(
  entityType: string,
  entityId: string,
  styles: Array<{ field: string; language: TypographyLanguage; family: TypographyFamily }>,
): Promise<TypographyStyles> {
  await db.transaction(async (tx) => {
    for (const style of styles) {
      const where = and(
        eq(editorialTypography.entityType, entityType),
        eq(editorialTypography.entityId, entityId),
        eq(editorialTypography.field, style.field),
        eq(editorialTypography.language, style.language),
      );
      if (style.family === "auto") {
        await tx.delete(editorialTypography).where(where);
      } else {
        await tx
          .insert(editorialTypography)
          .values({ entityType, entityId, field: style.field, language: style.language, family: style.family, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: [editorialTypography.entityType, editorialTypography.entityId, editorialTypography.field, editorialTypography.language],
            set: { family: style.family, updatedAt: new Date() },
          });
      }
    }
  });
  return getEditorialTypography(entityType, entityId);
}
