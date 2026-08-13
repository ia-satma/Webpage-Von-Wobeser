import { z } from "zod";
import { eventTranslations } from "./translations";

export const eventTypeOptions = [
  { value: "seminar", labelKey: "seminar" as const },
  { value: "conference", labelKey: "conference" as const },
  { value: "webinar", labelKey: "webinar" as const },
  { value: "workshop", labelKey: "workshop" as const },
] as const;

export const eventSchema = z.object({
  title: z.string().min(1, "English title is required").max(200),
  titleEs: z.string().min(1, "Spanish title is required").max(200),
  eventType: z.string().min(1, "Event type is required"),
  date: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional().nullable(),
  location: z.string().max(200).optional(),
  locationEs: z.string().max(200).optional(),
  description: z.string().min(1, "English description is required").max(5000),
  descriptionEs: z.string().min(1, "Spanish description is required").max(5000),
  externalUrl: z.string().url().optional().or(z.literal("")),
  isHighlight: z.boolean().default(false),
  published: z.boolean().default(true),
});

export type EventFormData = z.infer<typeof eventSchema>;
export type EventCopy = Record<keyof typeof eventTranslations.en, string>;

export interface EventFilters {
  type: string;
  startDate?: Date;
  endDate?: Date;
}

export function createEventFormDefaults(): EventFormData {
  return {
    title: "",
    titleEs: "",
    eventType: "conference",
    date: new Date(),
    endDate: null,
    location: "",
    locationEs: "",
    description: "",
    descriptionEs: "",
    externalUrl: "",
    isHighlight: false,
    published: true,
  };
}
