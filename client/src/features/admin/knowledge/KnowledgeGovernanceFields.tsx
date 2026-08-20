import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  Control,
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";

type GovernanceValues = FieldValues & {
  dataClassification: "public" | "internal";
  aiUseConfirmed: boolean;
};

type KnowledgeGovernanceFieldsProps<T extends GovernanceValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  testIdPrefix: "add" | "edit" | "bulk";
  label: string;
  confirmation: string;
};

export function KnowledgeGovernanceFields<T extends GovernanceValues>({
  control,
  setValue,
  testIdPrefix,
  label,
  confirmation,
}: KnowledgeGovernanceFieldsProps<T>) {
  const classificationPath = "dataClassification" as Path<T>;
  const confirmationPath = "aiUseConfirmed" as Path<T>;
  const resetConfirmation = () => {
    setValue(
      confirmationPath,
      false as PathValue<T, Path<T>>,
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <div className="space-y-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-4 dark:bg-amber-950/20">
      <FormField
        control={control}
        name={classificationPath}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                resetConfirmation();
              }}
              value={String(field.value || "")}
            >
              <FormControl>
                <SelectTrigger data-testid={`select-${testIdPrefix}-knowledge-classification`}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="public">Pública y aprobada para difusión</SelectItem>
                <SelectItem value="internal">Interna, sin datos personales ni secretos</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={confirmationPath}
        render={({ field }) => (
          <FormItem>
            <label className="flex items-start gap-3 text-sm">
              <FormControl>
                <Checkbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(value) => field.onChange(value === true)}
                  data-testid={`checkbox-${testIdPrefix}-knowledge-confirmation`}
                />
              </FormControl>
              <span>{confirmation}</span>
            </label>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
