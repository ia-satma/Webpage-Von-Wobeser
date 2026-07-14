import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmChangesDialog, fmtValue, type Change } from "@/components/admin/ConfirmChangesDialog";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { Save, Settings, Loader2 } from "lucide-react";

// Friendly definitions for the editable site-config keys (grouped).
const GROUPS: Array<{
  title: string;
  fields: Array<{ key: string; label: string; help?: string; bilingual?: boolean; media?: "image" | "video"; multiline?: boolean }>;
}> = [
  {
    title: "Portada (home)",
    fields: [
      { key: "hero_video", label: "Video del hero", media: "video", help: "Sube el video desde tu computadora o pega una URL/ruta (mp4)." },
      { key: "hero_practice_link", label: "Enlace del hero", help: "A dónde lleva al hacer clic en el video del hero." },
      { key: "banner_title", label: "Banner — título", help: "Texto grande del banner rojo.", bilingual: true },
      { key: "banner_subtitle", label: "Banner — subtítulo", bilingual: true },
    ],
  },
  {
    title: "Pie de página (todas las páginas)",
    fields: [
      { key: "footer_firm", label: "Nombre de la firma", help: "Aparece en el pie de página del sitio." },
      { key: "footer_address", label: "Dirección", help: "Una línea por renglón.", multiline: true },
      { key: "footer_phone", label: "Teléfono" },
      { key: "footer_website", label: "Sitio web / correo" },
      { key: "footer_facebook", label: "Facebook (URL)" },
      { key: "footer_twitter", label: "Twitter / X (URL)" },
      { key: "footer_linkedin", label: "LinkedIn (URL)" },
    ],
  },
  {
    title: "Páginas del sitio (texto editable)",
    fields: [
      { key: "page_firm_intro", label: "Nuestra Firma — introducción", help: "Si lo dejas vacío, se muestra el texto original.", bilingual: true, multiline: true },
      { key: "page_firm_body", label: "Nuestra Firma — cuerpo", bilingual: true, multiline: true },
      { key: "page_contact_intro", label: "Contacto — introducción", bilingual: true, multiline: true },
      { key: "page_contact_body", label: "Contacto — dirección / texto", bilingual: true, multiline: true },
      { key: "page_careers_intro", label: "Carrera en VWyS — introducción", bilingual: true, multiline: true },
      { key: "page_careers_body", label: "Carrera en VWyS — cuerpo", bilingual: true, multiline: true },
      { key: "page_probono_intro", label: "Pro Bono — introducción", help: "Si lo dejas vacío, se muestra el texto original.", bilingual: true, multiline: true },
      { key: "page_probono_body", label: "Pro Bono — cuerpo", bilingual: true, multiline: true },
      { key: "page_diversity_intro", label: "Diversidad e Inclusión — introducción", help: "Si lo dejas vacío, se muestra el texto original.", bilingual: true, multiline: true },
      { key: "page_diversity_body", label: "Diversidad e Inclusión — texto adicional", help: "Se muestra ARRIBA de la galería de video, sin borrarla. Déjalo vacío si no quieres agregar nada.", bilingual: true, multiline: true },
      { key: "page_capabilities_body", label: "Capacidades — introducción", help: "Si lo dejas vacío, se muestra el texto original.", bilingual: true, multiline: true },
    ],
  },
  {
    title: "Diversidad e Inclusión — galería de video",
    fields: [
      { key: "page_diversity_video_main", label: "Video principal", media: "video", help: "El video que se reproduce por defecto al entrar a la página." },
      { key: "page_diversity_video_1", label: "Video — miniatura 1", media: "video" },
      { key: "page_diversity_video_2", label: "Video — miniatura 2", media: "video" },
      { key: "page_diversity_video_3", label: "Video — miniatura 3", media: "video" },
      { key: "page_diversity_video_4", label: "Video — miniatura 4", media: "video" },
      { key: "page_diversity_video_5", label: "Video — miniatura 5", media: "video" },
      { key: "page_diversity_video_6", label: "Video — miniatura 6", media: "video" },
      { key: "page_diversity_video_7", label: "Video — miniatura 7", media: "video" },
    ],
  },
];

type ConfigMap = Record<string, { value: string; valueEs: string; type: string }>;

export default function AdminSiteConfig() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, { value: string; valueEs: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ key: string; changes: Change[] } | null>(null);

  useEffect(() => {
    // Only redirect once auth has finished loading (avoids a flash-redirect).
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading, refetch } = useQuery<ConfigMap>({
    queryKey: ["/api/admin/site-config"],
    queryFn: async () => (await adminApiRequest("GET", "/api/admin/site-config")).json(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (data) {
      const next: Record<string, { value: string; valueEs: string }> = {};
      for (const [k, v] of Object.entries(data)) next[k] = { value: v.value || "", valueEs: v.valueEs || "" };
      setDraft(next);
    }
  }, [data]);

  const set = (key: string, field: "value" | "valueEs", val: string) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] || { value: "", valueEs: "" }), [field]: val } }));

  const save = async (key: string) => {
    setSaving(key);
    try {
      const d = draft[key] || { value: "", valueEs: "" };
      const res = await adminApiRequest("PUT", `/api/admin/site-config/${key}`, { value: d.value, valueEs: d.valueEs });
      if (res.ok) {
        toast({ title: "Guardado", description: "El cambio ya está reflejado en el sitio." });
        refetch();
      } else {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    } finally {
      setSaving(null);
    }
  };

  const requestSave = (f: { key: string; label: string; bilingual?: boolean }) => {
    const orig = (data && data[f.key]) || { value: "", valueEs: "" };
    const d = draft[f.key] || { value: "", valueEs: "" };
    const changes: Change[] = [];
    if (fmtValue(orig.value) !== fmtValue(d.value))
      changes.push({ label: f.bilingual ? `${f.label} (inglés)` : f.label, before: fmtValue(orig.value), after: fmtValue(d.value) });
    if (f.bilingual && fmtValue(orig.valueEs) !== fmtValue(d.valueEs))
      changes.push({ label: `${f.label} (español)`, before: fmtValue(orig.valueEs), after: fmtValue(d.valueEs) });
    setConfirm({ key: f.key, changes });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <AdminPageHeader title="Configuración del sitio" icon={Settings} />

        <AdminPageHelp pageId="configuracion" manualSectionId="configuracion">Personaliza la portada del sitio público: los textos, el video del inicio y el banner.</AdminPageHelp>

        <p className="text-muted-foreground text-sm">
          Edita los textos y el video de la portada. Los cambios se reflejan en el sitio al instante.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
        ) : (
          GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-base">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.fields.map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label className="font-medium">{f.label}</Label>
                    {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                    {f.media ? (
                      <ImageUpload
                        value={draft[f.key]?.value ?? ""}
                        onChange={(v) => set(f.key, "value", v)}
                        kind={f.media}
                      />
                    ) : f.multiline ? (
                      <Textarea
                        rows={3}
                        value={draft[f.key]?.value ?? ""}
                        onChange={(e) => set(f.key, "value", e.target.value)}
                        data-testid={`input-${f.key}`}
                      />
                    ) : (
                      <Input
                        value={draft[f.key]?.value ?? ""}
                        onChange={(e) => set(f.key, "value", e.target.value)}
                        placeholder={f.bilingual ? "Texto en inglés" : ""}
                        data-testid={`input-${f.key}`}
                      />
                    )}
                    {f.bilingual && (
                      f.multiline ? (
                        <Textarea
                          rows={3}
                          value={draft[f.key]?.valueEs ?? ""}
                          onChange={(e) => set(f.key, "valueEs", e.target.value)}
                          placeholder="Texto en español"
                          data-testid={`input-${f.key}-es`}
                        />
                      ) : (
                        <Input
                          value={draft[f.key]?.valueEs ?? ""}
                          onChange={(e) => set(f.key, "valueEs", e.target.value)}
                          placeholder="Texto en español"
                          data-testid={`input-${f.key}-es`}
                        />
                      )
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => requestSave(f)} disabled={saving === f.key} data-testid={`save-${f.key}`}>
                        {saving === f.key ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Guardar
                      </Button>
                      {f.bilingual && (
                        <TranslateButton
                          getSource={() => ({ value: draft[f.key]?.valueEs ?? "" })}
                          onApply={(t) => { if (t.value != null) set(f.key, "value", t.value); }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <ConfirmChangesDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        changes={confirm?.changes || []}
        loading={saving === confirm?.key}
        onConfirm={async () => {
          if (confirm) await save(confirm.key);
          setConfirm(null);
        }}
      />
    </div>
  );
}
