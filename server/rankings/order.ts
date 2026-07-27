import { z } from "zod";

export const rankingOrderRequestSchema = z.object({
  ids: z
    .array(z.string().min(1).max(100))
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Duplicate ranking identifiers are not allowed",
    }),
}).strict();

export function hasExactRankingSet(currentIds: string[], requestedIds: string[]): boolean {
  if (currentIds.length !== requestedIds.length) return false;
  const current = new Set(currentIds);
  return requestedIds.every((id) => current.has(id));
}
