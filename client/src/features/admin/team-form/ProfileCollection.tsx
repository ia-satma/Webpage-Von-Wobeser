import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type StructuredField = {
  key: string;
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
};

interface ProfileCollectionProps {
  title: string;
  description: string;
  items: Array<Record<string, unknown>>;
  fields: StructuredField[];
  create: () => Record<string, unknown>;
  onChange: (items: Array<Record<string, unknown>>) => void;
}

export function ProfileCollection({
  title,
  description,
  items,
  fields,
  create,
  onChange,
}: ProfileCollectionProps) {
  return (
    <section className="border border-[#D9D8D7] p-4 space-y-3" aria-label={title}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-[#1D1D1B]">{title}</h3>
          <p className="text-xs text-[#878A8E]">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          onClick={() => onChange([...items, create()])}
        >
          Agregar
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-[#E8E7E6] pt-3">
          {fields.map((field) => {
            const updateValue = (value: string) => {
              const next = items.map((current, itemIndex) =>
                itemIndex === index ? { ...current, [field.key]: value } : current,
              );
              onChange(next);
            };
            return field.options ? (
              <select
                key={field.key}
                value={String(item[field.key] ?? "")}
                aria-label={`${title}: ${field.label} ${index + 1}`}
                className="h-10 w-full rounded-none border border-[#D9D8D7] bg-background px-3 text-sm"
                onChange={(event) => updateValue(event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <Input
                key={field.key}
                value={String(item[field.key] ?? "")}
                placeholder={field.placeholder || field.label}
                aria-label={`${title}: ${field.label} ${index + 1}`}
                className="rounded-none border-[#D9D8D7]"
                onChange={(event) => updateValue(event.target.value)}
              />
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start text-[#AA1A2E]"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            Quitar
          </Button>
        </div>
      ))}
      {!items.length && <p className="text-xs text-[#878A8E]">Sin registros todavía.</p>}
    </section>
  );
}
