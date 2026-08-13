import { z } from "zod";

export const industryGroupSchema = z.object({
  name: z.string().min(1, "English name is required").max(200),
  nameEs: z.string().min(1, "Spanish name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "English description is required").max(500),
  descriptionEs: z.string().min(1, "Spanish description is required").max(500),
  fullDescription: z.string().max(5000).optional(),
  fullDescriptionEs: z.string().max(5000).optional(),
  iconName: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  imageUrl: z.string().max(500).optional(),
});
