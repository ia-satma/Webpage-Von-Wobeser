import type { UseFormReturn } from "react-hook-form";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EventCopy, EventFormData } from "./contracts";

interface EventEditorialFieldsProps {
  form: UseFormReturn<EventFormData>;
  t: EventCopy;
  eventId?: string;
}

export function EventEditorialFields({ form, t, eventId }: EventEditorialFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.descriptionEn}</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder={t.descriptionEnPlaceholder}
                recommendedFamily="inter"
                data-testid="textarea-description"
              />
            </FormControl>
            <TypographyFieldControl
              entityType="event"
              entityId={eventId}
              field="description"
              language="en"
              role="body"
              compact
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="descriptionEs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.descriptionEs}</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder={t.descriptionEsPlaceholder}
                recommendedFamily="inter"
                data-testid="textarea-description-es"
              />
            </FormControl>
            <TypographyFieldControl
              entityType="event"
              entityId={eventId}
              field="descriptionEs"
              language="es"
              role="body"
              compact
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="externalUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.registrationUrl}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t.registrationUrlPlaceholder}
                className="rounded-none"
                data-testid="input-registration-url"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
