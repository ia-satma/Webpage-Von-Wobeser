import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmChangesDialog, fmtValue, type Change } from "@/components/admin/ConfirmChangesDialog";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { Save, Settings, Loader2, ArrowLeft, Landmark, HeartHandshake, Sparkles, Lock, Briefcase, GraduationCap, Mail, LineChart, type LucideIcon } from "lucide-react";

type Field = { key: string; label: string; help?: string; bilingual?: boolean; media?: "image" | "video"; multiline?: boolean; rows?: number; pattern?: RegExp; patternError?: string };
type FieldGroup = { title?: string; fields: Field[] };
type SiteConfigPage = { title: string; description: string; icon: LucideIcon; groups: FieldGroup[] };

/**
 * Cada sección de "Configuración del sitio" es su propia pantalla (ruta
 * /admin/site-config/:section), enlazada directo desde el grupo del sidebar al que
 * pertenece (Nuestra Firma/Capacidades/Carrera/Contacto/etc — ver client/src/lib/adminNav.ts).
 * "portada" (sin :section) es la única de alcance realmente global — hero/banner/pie de
 * página — y sigue siendo el destino del ítem "Portada y pie de página" en Configuración.
 */
const PAGES: Record<string, SiteConfigPage> = {
  portada: {
    title: "Portada y pie de página",
    description: "Elementos globales que aparecen en todo el sitio: el video/banner del inicio y el pie de página.",
    icon: Settings,
    groups: [
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
        title: "Voz corporativa (OpenAI TTS)",
        fields: [
          { key: "tts_voice", label: "Voz de marca", help: "Voces válidas: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse. Vacío = usa \"alloy\" por defecto." },
        ],
      },
    ],
  },
  seo: {
    title: "SEO — Analytics y verificación",
    description: "Conecta Google Analytics (GA4) y Google Search Console. Vacío = no se instala nada todavía.",
    icon: LineChart,
    groups: [
      {
        fields: [
          { key: "ga4_measurement_id", label: "Google Analytics (GA4) — Measurement ID", help: "Formato G-XXXXXXX, lo da Google Analytics al crear la propiedad. Vacío = no se instala GA4 todavía. Requiere reiniciar el servidor para tomar efecto.", pattern: /^G-[A-Z0-9]+$/i, patternError: "El Measurement ID debe tener el formato G-XXXXXXX (lo copias de Google Analytics, no lo inventes)." },
          { key: "google_site_verification", label: "Google Search Console — código de verificación", help: "El valor de content=\"...\" que da Google al verificar por meta tag. No hace falta si ya verificaste por DNS en GoDaddy. Requiere reiniciar el servidor para tomar efecto." },
        ],
      },
    ],
  },
  firma: {
    title: "Nuestra Firma — textos",
    description: "Si dejas un campo vacío, se muestra el texto original de la página.",
    icon: Landmark,
    groups: [
      {
        fields: [
          { key: "page_firm_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_firm_body", label: "Cuerpo", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  probono: {
    title: "Pro Bono",
    description: "Si dejas un campo vacío, se muestra el texto original de la página.",
    icon: HeartHandshake,
    groups: [
      {
        fields: [
          { key: "page_probono_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_probono_body", label: "Cuerpo", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  diversidad: {
    title: "Diversidad e Inclusión",
    description: "Textos y galería de video de la página. Si dejas un campo de texto vacío, se muestra el original.",
    icon: Sparkles,
    groups: [
      {
        fields: [
          { key: "page_diversity_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_diversity_body", label: "Texto adicional", help: "Se muestra ARRIBA de la galería de video, sin borrarla. Déjalo vacío si no quieres agregar nada.", bilingual: true, multiline: true },
        ],
      },
      {
        title: "Galería de video",
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
    ],
  },
  privacidad: {
    title: "Aviso de Privacidad",
    description: "Documento legal (LFPDPPP). Si lo dejas vacío, se muestra el texto original.",
    icon: Lock,
    groups: [
      {
        fields: [
          { key: "page_privacy_body", label: "Texto completo", help: "Edítalo si cambia el domicilio, el responsable de los datos u otro dato de cumplimiento.", bilingual: true, multiline: true, rows: 14 },
        ],
      },
    ],
  },
  capacidades: {
    title: "Capacidades — textos",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: Briefcase,
    groups: [
      {
        fields: [
          { key: "page_capabilities_body", label: "Introducción", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  carrera: {
    title: "Carrera en VWyS — textos",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: GraduationCap,
    groups: [
      {
        fields: [
          { key: "page_careers_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_careers_body", label: "Cuerpo", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  contacto: {
    title: "Contacto — textos",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: Mail,
    groups: [
      {
        fields: [
          { key: "page_contact_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_contact_body", label: "Dirección / texto", bilingual: true, multiline: true },
        ],
      },
    ],
  },
};

type ConfigMap = Record<string, { value: string; valueEs: string; type: string }>;

export default function AdminSiteConfig() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { section: rawSection } = useParams<{ section?: string }>();
  const section = rawSection && PAGES[rawSection] ? rawSection : "portada";
  const page = PAGES[section];
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
        {section !== "portada" && (
          <Link href="/admin/site-config" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-site-config">
            <ArrowLeft className="h-3.5 w-3.5" /> Configuración
          </Link>
        )}

        <AdminPageHeader title={page.title} description={page.description} icon={page.icon} />

        <AdminPageHelp pageId={section === "seo" ? "seo" : "configuracion"} manualSectionId={section === "seo" ? "seo" : "configuracion"}>
          {section === "seo"
            ? "A diferencia del resto del panel, estos dos campos NO se reflejan al instante: necesitas reiniciar el servidor después de guardarlos para que aparezcan en el sitio."
            : "Los cambios se reflejan en el sitio al instante."}
        </AdminPageHelp>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
        ) : (
          page.groups.map((group, i) => (
            <Card key={group.title ?? i}>
              {group.title && (
                <CardHeader>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
              )}
              <CardContent className="space-y-6">
                {group.fields.map((f) => {
                  const currentValue = draft[f.key]?.value ?? "";
                  const invalid = !!f.pattern && !!currentValue && !f.pattern.test(currentValue);
                  return (
                  <div key={f.key} className="space-y-2">
                    <Label className="font-medium">{f.label}</Label>
                    {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                    {invalid && <p className="text-xs text-destructive" data-testid={`error-${f.key}`}>{f.patternError || "Formato inválido."}</p>}
                    {f.key === "image_engine" ? (
                      <select
                        value={draft[f.key]?.value ?? "openai"}
                        onChange={(e) => set(f.key, "value", e.target.value)}
                        data-testid={`input-${f.key}`}
                        className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="openai">OpenAI · DALL-E 3 (principal — usa tu API, ~$0.04/imagen)</option>
                        <option value="cloudflare">Cloudflare (gratis — requiere credenciales de Cloudflare)</option>
                      </select>
                    ) : f.media ? (
                      <ImageUpload
                        value={draft[f.key]?.value ?? ""}
                        onChange={(v) => set(f.key, "value", v)}
                        kind={f.media}
                      />
                    ) : f.multiline && f.key.startsWith("page_") ? (
                      <RichTextEditor
                        rows={f.rows ?? 3}
                        value={draft[f.key]?.value ?? ""}
                        onChange={(html) => set(f.key, "value", html)}
                        data-testid={`input-${f.key}`}
                      />
                    ) : f.multiline ? (
                      <Textarea
                        rows={f.rows ?? 3}
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
                      f.multiline && f.key.startsWith("page_") ? (
                        <RichTextEditor
                          rows={f.rows ?? 3}
                          value={draft[f.key]?.valueEs ?? ""}
                          onChange={(html) => set(f.key, "valueEs", html)}
                          placeholder="Texto en español"
                          data-testid={`input-${f.key}-es`}
                        />
                      ) : f.multiline ? (
                        <Textarea
                          rows={f.rows ?? 3}
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
                      <Button size="sm" onClick={() => requestSave(f)} disabled={saving === f.key || invalid} data-testid={`save-${f.key}`}>
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
                  );
                })}
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
