import crypto from "node:crypto";
import { z } from "zod";
import {
  ATTORNEY_ORDER_CATEGORY_IDS,
  attorneyOrderCategoryById,
  type AttorneyOrderCategoryId,
} from "@shared/attorneyOrder";

export const attorneyOrderCategorySchema = z.enum(ATTORNEY_ORDER_CATEGORY_IDS);

export const attorneyOrderRequestSchema = z.object({
  category: attorneyOrderCategorySchema,
  version: z.string().regex(/^[a-f0-9]{64}$/),
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(400)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Duplicate attorney identifiers are not allowed",
    }),
}).strict();

export function getAttorneyOrderCategory(id: AttorneyOrderCategoryId) {
  const category = attorneyOrderCategoryById(id);
  if (!category) throw new Error(`Unknown attorney order category: ${id}`);
  return category;
}

export function hasExactAttorneySet(currentIds: string[], requestedIds: string[]): boolean {
  if (currentIds.length !== requestedIds.length) return false;
  const current = new Set(currentIds);
  const requested = new Set(requestedIds);
  return requested.size === requestedIds.length && requested.size === current.size && requestedIds.every((id) => current.has(id));
}

/**
 * Optimistic-concurrency token for one category. It deliberately includes the
 * ordered sequence, not merely its IDs, so a second reordering becomes a 409
 * instead of silently overwriting the first administrator's work.
 */
export function attorneyOrderVersion(members: Array<{ id: string; order: number | null }>): string {
  return crypto
    .createHash("sha256")
    .update(members.map((member) => `${member.id}:${member.order ?? 0}`).join("|"))
    .digest("hex");
}
