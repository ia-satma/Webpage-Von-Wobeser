import { z } from "zod";
import { practiceContentLimits } from "@shared/contentLimits";

export function createPracticeGroupSchema(t: {
  validationNameEnRequired: string;
  validationNameEsRequired: string;
  validationSlugRequired: string;
  validationSlugFormat: string;
  validationDescriptionEnRequired: string;
  validationDescriptionEsRequired: string;
}) {
  return z.object({
    name: z.string().min(1, t.validationNameEnRequired).max(200),
    nameEs: z.string().min(1, t.validationNameEsRequired).max(200),
    slug: z.string().min(1, t.validationSlugRequired).max(100)
      .regex(/^[a-z0-9-]+$/, t.validationSlugFormat),
    description: z.string().min(1, t.validationDescriptionEnRequired)
      .max(practiceContentLimits.introduction),
    descriptionEs: z.string().min(1, t.validationDescriptionEsRequired)
      .max(practiceContentLimits.introduction),
    fullDescription: z.string().max(practiceContentLimits.body).optional(),
    fullDescriptionEs: z.string().max(practiceContentLimits.body).optional(),
    iconName: z.string().max(50).optional(),
    order: z.number().int().min(0).default(0),
    published: z.boolean().default(true),
    imageUrl: z.string().max(500).optional(),
  });
}
