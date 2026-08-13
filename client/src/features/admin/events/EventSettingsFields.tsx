import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { EventCopy, EventFormData } from "./contracts";

interface EventSettingsFieldsProps {
  form: UseFormReturn<EventFormData>;
  t: EventCopy;
}

export function EventSettingsFields({ form, t }: EventSettingsFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="isHighlight"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between p-4 border rounded-none">
            <div className="space-y-0.5">
              <FormLabel className="text-base">{t.featured}</FormLabel>
              <FormDescription>{t.featuredDescription}</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="switch-featured"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="published"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between p-4 border rounded-none">
            <div className="space-y-0.5">
              <FormLabel className="text-base">{t.published}</FormLabel>
              <FormDescription>{t.publishedDescription}</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="switch-published"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
