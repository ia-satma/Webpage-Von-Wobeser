import { Loader2, Save } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ConfigDraft, SiteConfigField } from "./contracts";
import { isPublicTextField, typographyRoleFor } from "./typography";

interface SiteConfigFieldControlProps {
  field: SiteConfigField;
  draft: ConfigDraft;
  saving: string | null;
  setValue: (key: string, field: "value" | "valueEs", value: string) => void;
  requestSave: (field: SiteConfigField) => void;
}

export function SiteConfigFieldControl({
  field,
  draft,
  saving,
  setValue,
  requestSave,
}: SiteConfigFieldControlProps) {
  const currentValue = draft[field.key]?.value ?? "";
  const switchFallback = field.defaultValue === false ? "false" : "true";
  const invalid = !!field.pattern && !!currentValue && !field.pattern.test(currentValue);
  const publicText = isPublicTextField(field);
  const typographyRole = typographyRoleFor(field);
  const recommendedFamily = typographyRole === "editorial" ? "gelasio" : "inter";

  return (
    <div className="space-y-2">
      <Label className="font-medium">{field.label}</Label>
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      {invalid && (
        <p className="text-xs text-destructive" data-testid={`error-${field.key}`}>
          {field.patternError || "Formato inválido."}
        </p>
      )}
      {field.control === "switch" ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
          <Switch
            checked={(draft[field.key]?.value || switchFallback).toLowerCase() !== "false"}
            onCheckedChange={(checked) => {
              const next = checked ? "true" : "false";
              setValue(field.key, "value", next);
              setValue(field.key, "valueEs", next);
            }}
            data-testid={`input-${field.key}`}
          />
          <span className="text-sm text-muted-foreground">
            {(draft[field.key]?.value || switchFallback).toLowerCase() !== "false"
              ? "Visible en la página"
              : "Oculta, pero conserva su contenido"}
          </span>
        </div>
      ) : field.control === "number" ? (
        <Input
          type="number"
          min={field.min ?? 0}
          max={field.max}
          step={1}
          value={draft[field.key]?.value ?? ""}
          onChange={(event) => {
            setValue(field.key, "value", event.target.value);
            setValue(field.key, "valueEs", event.target.value);
          }}
          className="max-w-32"
          data-testid={`input-${field.key}`}
        />
      ) : field.control === "select" ? (
        <select
          value={draft[field.key]?.value ?? field.options?.[0]?.value ?? ""}
          onChange={(event) => {
            setValue(field.key, "value", event.target.value);
            setValue(field.key, "valueEs", event.target.value);
          }}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          data-testid={`input-${field.key}`}
        >
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : field.key === "image_engine" ? (
        <select
          value={draft[field.key]?.value ?? "openai"}
          onChange={(event) => setValue(field.key, "value", event.target.value)}
          data-testid={`input-${field.key}`}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        >
          <option value="openai">OpenAI · DALL-E 3 (principal — usa tu API, ~$0.04/imagen)</option>
          <option value="cloudflare">Cloudflare (gratis — requiere credenciales de Cloudflare)</option>
        </select>
      ) : field.key === "image_aspect" ? (
        <select
          value={draft[field.key]?.value ?? "1:1"}
          onChange={(event) => setValue(field.key, "value", event.target.value)}
          data-testid={`input-${field.key}`}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        >
          <option value="1:1">Cuadrada · 1:1 (1024×1024)</option>
          <option value="16:9">Horizontal · 16:9 (1792×1024) — portadas</option>
          <option value="9:16">Vertical · 9:16 (1024×1792) — historias</option>
        </select>
      ) : field.media ? (
        <div className="space-y-1">
          {field.bilingual && <p className="text-xs font-medium text-muted-foreground">Medio en inglés</p>}
          <ImageUpload
            value={draft[field.key]?.value ?? ""}
            onChange={(value) => setValue(field.key, "value", value)}
            kind={field.media}
          />
        </div>
      ) : field.multiline && publicText ? (
        <RichTextEditor
          rows={field.rows ?? 3}
          value={draft[field.key]?.value ?? ""}
          onChange={(html) => setValue(field.key, "value", html)}
          recommendedFamily={recommendedFamily}
          data-testid={`input-${field.key}`}
        />
      ) : field.multiline ? (
        <Textarea
          rows={field.rows ?? 3}
          value={draft[field.key]?.value ?? ""}
          onChange={(event) => setValue(field.key, "value", event.target.value)}
          data-testid={`input-${field.key}`}
        />
      ) : (
        <Input
          value={draft[field.key]?.value ?? ""}
          onChange={(event) => setValue(field.key, "value", event.target.value)}
          placeholder={field.bilingual ? "Texto en inglés" : ""}
          data-testid={`input-${field.key}`}
        />
      )}
      {publicText && (
        <TypographyFieldControl
          entityType="site_config"
          entityId={field.key}
          field="value"
          language="en"
          role={typographyRole}
          endpoint={`/api/admin/site-config/${encodeURIComponent(field.key)}/typography`}
          compact
        />
      )}
      {field.bilingual && (
        field.media ? (
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Medio en español</p>
            <ImageUpload
              value={draft[field.key]?.valueEs ?? ""}
              onChange={(value) => setValue(field.key, "valueEs", value)}
              kind={field.media}
            />
          </div>
        ) : field.multiline && publicText ? (
          <RichTextEditor
            rows={field.rows ?? 3}
            value={draft[field.key]?.valueEs ?? ""}
            onChange={(html) => setValue(field.key, "valueEs", html)}
            placeholder="Texto en español"
            recommendedFamily={recommendedFamily}
            data-testid={`input-${field.key}-es`}
          />
        ) : field.multiline ? (
          <Textarea
            rows={field.rows ?? 3}
            value={draft[field.key]?.valueEs ?? ""}
            onChange={(event) => setValue(field.key, "valueEs", event.target.value)}
            placeholder="Texto en español"
            data-testid={`input-${field.key}-es`}
          />
        ) : (
          <Input
            value={draft[field.key]?.valueEs ?? ""}
            onChange={(event) => setValue(field.key, "valueEs", event.target.value)}
            placeholder="Texto en español"
            data-testid={`input-${field.key}-es`}
          />
        )
      )}
      {field.bilingual && publicText && (
        <TypographyFieldControl
          entityType="site_config"
          entityId={field.key}
          field="valueEs"
          language="es"
          role={typographyRole}
          endpoint={`/api/admin/site-config/${encodeURIComponent(field.key)}/typography`}
          compact
        />
      )}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => requestSave(field)}
          disabled={saving === field.key || invalid}
          data-testid={`save-${field.key}`}
        >
          {saving === field.key
            ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            : <Save className="h-4 w-4 mr-1" />}
          {saving === field.key
            ? (field.key === "hero_video_master" ? "Generando versiones…" : "Guardando…")
            : (field.key === "hero_video_master" ? "Generar / regenerar Full HD" : "Guardar")}
        </Button>
        {field.bilingual && field.allowAutoTranslation !== false && (
          <TranslateButton
            getSource={() => ({ value: draft[field.key]?.valueEs ?? "" })}
            onApply={(translation) => {
              if (translation.value != null) setValue(field.key, "value", translation.value);
            }}
          />
        )}
      </div>
    </div>
  );
}
