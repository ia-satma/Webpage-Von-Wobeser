import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { OfficeGalleryManager } from "@/pages/admin/GalleryAdmin";
import { useAdminAuth, adminApiRequest, getAuthHeaders } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, FileText, Film, Images, Loader2, MapPin, Save, Search, Upload } from "lucide-react";
import type { Office, OfficeImage } from "@shared/schema";

type ConfigEntry = { value: string; valueEs: string; type: string };
type OfficeShowcaseResponse = {
  config: Record<string, ConfigEntry>;
  office: Office | null;
  gallery: OfficeImage[];
};

type BilingualField = { key: string; label: string; multiline?: boolean; help?: string };

const CONTENT_GROUPS: Array<{ title: string; description: string; fields: BilingualField[] }> = [
  {
    title: "Portada",
    description: "Usa saltos de línea en los títulos para controlar exactamente su composición.",
    fields: [
      { key: "office_hero_title", label: "Título principal", multiline: true },
      { key: "office_hero_subtitle", label: "Subtítulo" },
      { key: "office_scroll_label", label: "Indicador de desplazamiento" },
      { key: "office_home_label", label: "Texto del acceso al inicio" },
    ],
  },
  {
    title: "Visión",
    description: "Primer bloque editorial después de los videos.",
    fields: [
      { key: "office_vision_title", label: "Título", multiline: true },
      { key: "office_vision_body", label: "Texto", multiline: true },
    ],
  },
  {
    title: "Ubicación y cercanía",
    description: "Texto que acompaña el mapa.",
    fields: [
      { key: "office_location_title", label: "Título", multiline: true },
      { key: "office_location_body", label: "Texto", multiline: true },
    ],
  },
  {
    title: "Colaboración, tecnología y bienestar",
    description: "Bloque que acompaña la composición fotográfica.",
    fields: [
      { key: "office_collaboration_title", label: "Título", multiline: true },
      { key: "office_collaboration_intro", label: "Primer párrafo", multiline: true },
      { key: "office_collaboration_highlight", label: "Párrafo destacado", multiline: true },
      { key: "office_collaboration_body", label: "Párrafo final", multiline: true },
    ],
  },
  {
    title: "Cita",
    description: "Testimonio institucional mostrado antes de la dirección.",
    fields: [
      { key: "office_quote", label: "Cita", multiline: true },
      { key: "office_quote_author", label: "Autor" },
      { key: "office_quote_role", label: "Cargo" },
      { key: "office_address_title", label: "Título de la dirección" },
    ],
  },
];

function BilingualConfigField({ field, draft, setValue }: {
  field: BilingualField;
  draft: Record<string, ConfigEntry>;
  setValue: (key: string, language: "value" | "valueEs", value: string) => void;
}) {
  const entry = draft[field.key] || { value: "", valueEs: "", type: "text" };
  const Control = field.multiline ? Textarea : Input;
  return (
    <div className="space-y-2">
      <div>
        <Label>{field.label}</Label>
        {field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Inglés</span>
          <Control value={entry.value} rows={field.multiline ? 4 : undefined} onChange={(event) => setValue(field.key, "value", event.target.value)} />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Español</span>
          <Control value={entry.valueEs} rows={field.multiline ? 4 : undefined} onChange={(event) => setValue(field.key, "valueEs", event.target.value)} />
        </div>
      </div>
    </div>
  );
}

function PdfUpload({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/media/upload", { method: "POST", headers: getAuthHeaders(), body: form, credentials: "include" });
      if (!response.ok) throw new Error("upload");
      const media = await response.json();
      onChange(media.path || "");
    } catch {
      toast({ title: "No se pudo subir el PDF", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/comunicado.pdf" />
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) upload(file);
        event.target.value = "";
      }} />
      <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {uploading ? "Subiendo…" : "Subir PDF"}
      </Button>
    </div>
  );
}

export default function AdminOffices() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, ConfigEntry>>({});
  const [office, setOffice] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { requireAuth(); }, [requireAuth]);
  const { data, isLoading, refetch } = useQuery<OfficeShowcaseResponse>({
    queryKey: ["/api/admin/office-showcase"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/office-showcase");
      if (!response.ok) throw new Error("No se pudo cargar Oficinas");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!data) return;
    setDraft(data.config);
    setOffice(data.office);
  }, [data]);

  const setConfig = (key: string, language: "value" | "valueEs", newValue: string) => {
    setDraft((current) => ({
      ...current,
      [key]: { ...(current[key] || { value: "", valueEs: "", type: "text" }), [language]: newValue },
    }));
  };
  const setSingleConfig = (key: string, newValue: string) => {
    setDraft((current) => ({
      ...current,
      [key]: { ...(current[key] || { value: "", valueEs: "", type: "url" }), value: newValue, valueEs: newValue },
    }));
  };
  const setOfficeValue = (key: keyof Office, value: string | boolean | number | null) => {
    setOffice((current) => current ? ({ ...current, [key]: value } as Office) : current);
  };

  const save = async () => {
    if (!office) return;
    setSaving(true);
    try {
      const config = Object.fromEntries(Object.entries(draft).map(([key, entry]) => [key, { value: entry.value || "", valueEs: entry.valueEs || "" }]));
      const response = await adminApiRequest("PUT", "/api/admin/office-showcase", { config, office });
      if (!response.ok) throw new Error("save");
      toast({ title: "Oficinas actualizado", description: "Los cambios ya están disponibles en las páginas en español e inglés." });
      await refetch();
    } catch {
      toast({ title: "No se pudieron guardar los cambios", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const statFields = useMemo(() => Array.from({ length: 3 }, (_, index) => index + 1), []);
  const initialTab = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "gallery"
    ? "gallery"
    : "content";

  if (authLoading || isLoading) return <div className="p-10"><Skeleton className="h-44 w-full" /></div>;
  if (!isAuthenticated || !office) return null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <AdminPageHeader title="Oficinas" description="Administra el micrositio bilingüe de las nuevas oficinas sin alterar su diseño." icon={MapPin} />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/nuevas-oficinas/?preview=admin" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Vista ES</a></Button>
          <Button asChild variant="outline"><a href="/new-offices/?preview=admin" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Vista EN</a></Button>
          <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Guardando…" : "Guardar cambios"}</Button>
        </div>
      </div>

      <AdminPageHelp pageId="oficinas" manualSectionId="configuracion">
        Los textos y rutas se guardan en la base de datos de Replit. Las fotografías conservan nueve posiciones para proteger la composición del espejo.
      </AdminPageHelp>

      <Card className="border-l-4 border-l-[#AA1A2E]">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Publicación del micrositio</p>
            <p className="text-sm text-muted-foreground">Al desactivarlo, las dos rutas públicas responderán como no disponibles.</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#AA1A2E]" checked={draft.office_published?.value !== "false" && office.published !== false} onChange={(event) => {
              setSingleConfig("office_published", String(event.target.checked));
              setOfficeValue("published", event.target.checked);
            }} />
            <span className="text-sm">Publicado</span>
          </label>
        </CardContent>
      </Card>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="location">Ubicación</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="gallery">Galería</TabsTrigger>
          <TabsTrigger value="publishing">Comunicado y SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {CONTENT_GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader><CardTitle>{group.title}</CardTitle><CardDescription>{group.description}</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {group.fields.map((field) => <BilingualConfigField key={field.key} field={field} draft={draft} setValue={setConfig} />)}
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader><CardTitle>Cifras rotativas</CardTitle><CardDescription>Las tres cifras cambian automáticamente cada cinco segundos.</CardDescription></CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-3">
              {statFields.map((number) => (
                <div key={number} className="space-y-4 border-l-2 border-[#AA1A2E] pl-4">
                  <div className="space-y-1"><Label>Valor {number}</Label><Input value={draft[`office_stat_${number}_value`]?.value || ""} onChange={(event) => setSingleConfig(`office_stat_${number}_value`, event.target.value)} /></div>
                  <BilingualConfigField field={{ key: `office_stat_${number}_label`, label: "Etiqueta" }} draft={draft} setValue={setConfig} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Datos de la sede</CardTitle><CardDescription>Esta información se guarda en la tabla de oficinas y alimenta la dirección pública.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1"><Label>Nombre (EN)</Label><Input value={office.name} onChange={(e) => setOfficeValue("name", e.target.value)} /></div>
                <div className="space-y-1"><Label>Nombre (ES)</Label><Input value={office.nameEs} onChange={(e) => setOfficeValue("nameEs", e.target.value)} /></div>
                <div className="space-y-1"><Label>Ciudad</Label><Input value={office.city} onChange={(e) => setOfficeValue("city", e.target.value)} /></div>
                <div className="space-y-1"><Label>País</Label><Input value={office.countryEs || office.country} onChange={(e) => setOfficeValue("countryEs", e.target.value)} /></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1"><Label>Dirección (EN)</Label><Textarea rows={5} value={office.address} onChange={(e) => setOfficeValue("address", e.target.value)} /></div>
                <div className="space-y-1"><Label>Dirección (ES)</Label><Textarea rows={5} value={office.addressEs || ""} onChange={(e) => setOfficeValue("addressEs", e.target.value)} /></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1"><Label>Teléfono</Label><Input value={office.phone || ""} onChange={(e) => setOfficeValue("phone", e.target.value)} /></div>
                <div className="space-y-1"><Label>Correo</Label><Input type="email" value={office.email || ""} onChange={(e) => setOfficeValue("email", e.target.value)} /></div>
                <div className="space-y-1"><Label>Latitud</Label><Input value={office.latitude || ""} onChange={(e) => setOfficeValue("latitude", e.target.value)} /></div>
                <div className="space-y-1"><Label>Longitud</Label><Input value={office.longitude || ""} onChange={(e) => setOfficeValue("longitude", e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>URL del mapa incrustado</Label><Textarea rows={3} value={draft.office_map_embed?.value || ""} onChange={(e) => setSingleConfig("office_map_embed", e.target.value)} /></div>
              <div className="space-y-1"><Label>URL para obtener indicaciones</Label><Input value={draft.office_map_directions?.value || ""} onChange={(e) => setSingleConfig("office_map_directions", e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5 text-[#AA1A2E]" />Recorrido audiovisual</CardTitle><CardDescription>Seis videos con sus miniaturas. Cada archivo puede subirse o sustituirse por una URL.</CardDescription></CardHeader>
            <CardContent className="space-y-8">
              {Array.from({ length: 6 }, (_, index) => index + 1).map((number) => (
                <section key={number} className="grid gap-5 border-b pb-8 last:border-b-0 lg:grid-cols-[1.3fr_1fr]">
                  <div className="space-y-2"><Label>Video {number}</Label><ImageUpload kind="video" value={draft[`office_video_${number}`]?.value || ""} onChange={(value) => setSingleConfig(`office_video_${number}`, value)} /></div>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Miniatura {number}</Label><ImageUpload value={draft[`office_video_thumb_${number}`]?.value || ""} onChange={(value) => setSingleConfig(`office_video_thumb_${number}`, value)} /></div>
                    <BilingualConfigField field={{ key: `office_video_alt_${number}`, label: "Texto alternativo" }} draft={draft} setValue={setConfig} />
                  </div>
                </section>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Images className="h-5 w-5 text-[#AA1A2E]" />Galería de oficinas</CardTitle><CardDescription>Las primeras nueve imágenes forman la composición y el carrusel ampliado.</CardDescription></CardHeader>
            <CardContent><OfficeGalleryManager embedded /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishing" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#AA1A2E]" />Comunicado de prensa</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <BilingualConfigField field={{ key: "office_press_label", label: "Texto del enlace" }} draft={draft} setValue={setConfig} />
              <div className="grid gap-5 lg:grid-cols-2">
                <PdfUpload label="PDF en inglés" value={draft.office_press_pdf?.value || ""} onChange={(value) => setConfig("office_press_pdf", "value", value)} />
                <PdfUpload label="PDF en español" value={draft.office_press_pdf?.valueEs || ""} onChange={(value) => setConfig("office_press_pdf", "valueEs", value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recursos y redes</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2"><Label>Logo del encabezado</Label><ImageUpload value={draft.office_header_logo?.value || ""} onChange={(value) => setSingleConfig("office_header_logo", value)} /></div>
                <div className="space-y-2"><Label>Logo blanco del pie</Label><ImageUpload value={draft.office_footer_logo?.value || ""} onChange={(value) => setSingleConfig("office_footer_logo", value)} /></div>
                <div className="space-y-2"><Label>Imagen del banner</Label><ImageUpload value={draft.office_banner_image?.value || ""} onChange={(value) => setSingleConfig("office_banner_image", value)} /></div>
                <div className="space-y-2"><Label>Imagen para compartir</Label><ImageUpload value={draft.office_seo_image?.value || ""} onChange={(value) => setSingleConfig("office_seo_image", value)} /></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1"><Label>LinkedIn</Label><Input value={draft.office_linkedin?.value || ""} onChange={(e) => setSingleConfig("office_linkedin", e.target.value)} /></div>
                <div className="space-y-1"><Label>X</Label><Input value={draft.office_x?.value || ""} onChange={(e) => setSingleConfig("office_x", e.target.value)} /></div>
              </div>
              <BilingualConfigField field={{ key: "office_follow_label", label: "Etiqueta de redes" }} draft={draft} setValue={setConfig} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-[#AA1A2E]" />SEO</CardTitle><CardDescription>Títulos y descripciones para buscadores y redes sociales.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <BilingualConfigField field={{ key: "office_seo_title", label: "Título SEO" }} draft={draft} setValue={setConfig} />
              <BilingualConfigField field={{ key: "office_seo_description", label: "Descripción SEO", multiline: true }} draft={draft} setValue={setConfig} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 z-20 flex justify-end pointer-events-none">
        <Button className="pointer-events-auto shadow-lg" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </main>
  );
}
