import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AgentButton } from "@/components/admin/AgentButton";
import { AgentProgress } from "@/components/admin/AgentTools";
import { DocumentUpload, type UploadedDoc } from "@/components/admin/DocumentUpload";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest, getAuthHeaders, loadAdminSession } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Presentation, Loader2, FileDown, FileText, Image as ImageIcon, Wand2, Eye } from "lucide-react";

interface PresentationRow {
  id: string;
  title: string;
  topic: string | null;
  template: string;
  branding: string;
  lang: string;
  slideCount: number | null;
  pptxUrl: string | null;
  pdfUrl: string | null;
  pngUrls: string[] | null;
  sourceDocs: string[] | null;
  engine: string;
  createdAt: string | null;
  availability?: {
    pptx: boolean;
    pdf: boolean;
    png: boolean[];
  };
}

type Format = "pptx" | "pdf" | "png";

const TEMPLATE_LABELS: Record<string, string> = {
  vonwobeser: "Corporativa VW",
  minimal: "Minimal",
  dark: "Oscura",
};

export default function AdminPresentations() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  useEffect(() => { requireAuth(); }, [requireAuth]);
  const { toast } = useToast();

  // --- Estado del generador ---
  const [topic, setTopic] = useState("");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [slideCount, setSlideCount] = useState(8);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [template, setTemplate] = useState<"vonwobeser" | "minimal" | "dark">("vonwobeser");
  const [branding, setBranding] = useState<"vonwobeser" | "custom">("vonwobeser");
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [customColor, setCustomColor] = useState("#AA1A2E");
  const [formats, setFormats] = useState<Record<Format, boolean>>({ pptx: true, pdf: true, png: true });
  const [visuals, setVisuals] = useState(true);
  const [illustrate, setIllustrate] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [supportImages, setSupportImages] = useState<string[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);

  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: presentations = [], isLoading } = useQuery<PresentationRow[]>({
    queryKey: ["/api/admin/generated-presentations"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/generated-presentations");
      if (!res.ok) throw new Error("No se pudo cargar el historial de presentaciones.");
      return res.json();
    },
  });

  const toggleFormat = (f: Format) => setFormats((prev) => ({ ...prev, [f]: !prev[f] }));

  const uploadSupportImages = async (files: FileList) => {
    setUploadingImg(true);
    const next = [...supportImages];
    try {
      await loadAdminSession(true);
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/media/upload", { method: "POST", headers: { ...getAuthHeaders() }, body: fd, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const url = data.path || data.url;
          if (url) next.push(url);
        }
      }
      setSupportImages(next);
    } finally {
      setUploadingImg(false);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const selectedFormats = (Object.keys(formats) as Format[]).filter((f) => formats[f]);
      const res = await adminApiRequest("POST", "/api/admin/presentations/generate", {
        topic,
        docs,
        slideCount,
        lang,
        template,
        branding,
        customLogoUrl: branding === "custom" ? customLogoUrl || null : null,
        customPrimaryColor: branding === "custom" ? customColor || null : null,
        formats: selectedFormats,
        visuals,
        illustrate: visuals && illustrate,
        supportImages: visuals ? supportImages : [],
        webSearch,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "No se pudo generar la presentación.");
      return data;
    },
    onSuccess: (data: any) => {
      setNotes([...(Array.isArray(data?.docNotes) ? data.docNotes : []), ...(Array.isArray(data?.visualNotes) ? data.visualNotes : [])]);
      setUsedFallback(!!data?.usedFallback);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generated-presentations"] });
      toast({
        title: "Presentación generada",
        description: data?.usedFallback
          ? "Se usó un esquema automático (sin IA). Revísala y edítala."
          : "Descárgala desde el historial de abajo.",
      });
    },
    onError: (err: any) => {
      toast({ title: "No se pudo generar", description: String(err?.message || err), variant: "destructive" });
    },
  });

  const canGenerate =
    !generateMutation.isPending &&
    (topic.trim().length > 0 || docs.length > 0) &&
    (formats.pptx || formats.pdf || formats.png) &&
    (branding !== "custom" || /^#[0-9a-f]{6}$/i.test(customColor));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-40" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <AdminPageHeader
          title="PRESENTACIONES IA"
          description="Genera presentaciones con el branding de Von Wobeser a partir de un tema escrito y/o documentos subidos. Descárgalas en PowerPoint (PPTX), PDF e imágenes (PNG por diapositiva)."
          icon={Presentation}
        />

        <AdminPageHelp pageId="presentations">
          Escribe un tema (o súbele documentos .pdf/.docx/.pptx/.tex), elige plantilla y formato, y presiona
          "Generar presentación". La IA arma las diapositivas y el sistema las exporta con el logo y los colores de la
          firma. Si aún no hay créditos de IA disponibles, se genera un borrador con un esquema automático para que
          puedas probar la descarga. El historial es permanente y ningún usuario puede borrarlo. Los archivos .doc/.ppt antiguos deben convertirse a .docx/.pptx.
        </AdminPageHelp>

        {/* --- Generador --- */}
        <Card className="mb-10">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pres-topic">Tema / instrucciones</Label>
                <Textarea
                  id="pres-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej. Panorama de la reforma en competencia económica en México 2026, para clientes corporativos…"
                  rows={5}
                  data-testid="input-topic"
                />
                <p className="text-xs text-muted-foreground">Puedes dejarlo vacío si subes documentos.</p>
              </div>

              <div className="space-y-2">
                <Label>Documentos de insumo (opcional)</Label>
                <DocumentUpload docs={docs} onChange={setDocs} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pres-slides"># de diapositivas</Label>
                <Input
                  id="pres-slides"
                  type="number"
                  min={3}
                  max={20}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Math.max(3, Math.min(20, parseInt(e.target.value || "8", 10) || 8)))}
                  data-testid="input-slide-count"
                />
              </div>

              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={lang} onValueChange={(v) => setLang(v as "es" | "en")}>
                  <SelectTrigger data-testid="select-lang"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">Inglés</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plantilla</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as any)}>
                  <SelectTrigger data-testid="select-template"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vonwobeser">Corporativa VW</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="dark">Oscura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Branding</Label>
                <Select value={branding} onValueChange={(v) => setBranding(v as any)}>
                  <SelectTrigger data-testid="select-branding"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vonwobeser">Von Wobeser (logo y colores de la firma)</SelectItem>
                    <SelectItem value="custom">Marca propia (subir logo + color)</SelectItem>
                  </SelectContent>
                </Select>

                {branding === "custom" && (
                  <div className="mt-3 space-y-3 border rounded-md p-3 bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-xs">Logo de la marca</Label>
                      <ImageUpload value={customLogoUrl} onChange={setCustomLogoUrl} kind="image" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Color principal</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="h-9 w-12 border rounded cursor-pointer bg-transparent"
                          data-testid="input-custom-color"
                        />
                        <Input value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="max-w-[140px]" />
                      </div>
                      {!/^#[0-9a-f]{6}$/i.test(customColor) && (
                        <p className="text-xs text-destructive">Usa un color hexadecimal completo, por ejemplo #AA1A2E.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Formatos de descarga</Label>
                <div className="flex flex-col gap-2 pt-1">
                  {([
                    ["pptx", "PowerPoint (.pptx) — editable"],
                    ["pdf", "PDF"],
                    ["png", "Imágenes (.png por diapositiva)"],
                  ] as [Format, string][]).map(([f, label]) => (
                    <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={formats[f]} onCheckedChange={() => toggleFormat(f)} data-testid={`checkbox-format-${f}`} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Elementos visuales */}
            <div className="border-t pt-5 space-y-4">
              <Label className="text-sm">Elementos visuales</Label>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">Incluir gráficas, diagramas e imágenes</p>
                  <p className="text-xs text-muted-foreground">La IA los propone cuando el contenido lo amerita (las gráficas y diagramas no gastan créditos).</p>
                </div>
                <Switch checked={visuals} onCheckedChange={setVisuals} data-testid="switch-visuals" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">Ilustrar con imágenes generadas por IA</p>
                  <p className="text-xs text-muted-foreground">Genera hasta 4 imágenes por presentación con GPT Image 2 (o el motor alterno configurado). <span className="text-amber-600">Usa créditos de OpenAI.</span></p>
                </div>
                <Switch checked={illustrate} onCheckedChange={setIllustrate} disabled={!visuals} data-testid="switch-illustrate" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">Buscar información en la web</p>
                  <p className="text-xs text-muted-foreground">La IA busca datos actuales en internet (OpenAI) para enriquecer la presentación. Si está apagado, usa solo lo que compartes. <span className="text-amber-600">Usa créditos de OpenAI.</span></p>
                </div>
                <Switch checked={webSearch} onCheckedChange={setWebSearch} data-testid="switch-websearch" />
              </div>

              {visuals && (
                <div className="space-y-2">
                  <Label className="text-xs">Imágenes de apoyo (opcional) — se usan en las diapositivas de imagen antes que la IA</Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted/50">
                      {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      Subir imágenes
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && e.target.files.length > 0 && uploadSupportImages(e.target.files)}
                        data-testid="input-support-images"
                      />
                    </label>
                    {supportImages.map((url, i) => (
                      <div key={url + i} className="relative">
                        <img src={url} alt="" className="h-14 w-20 object-cover border rounded" />
                        <button
                          type="button"
                          onClick={() => setSupportImages((prev) => prev.filter((u) => u !== url))}
                          className="absolute -top-2 -right-2 bg-background border rounded-full w-5 h-5 text-xs leading-none text-red-600"
                          aria-label="Quitar imagen"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <AgentButton
                onClick={() => generateMutation.mutate()}
                disabled={!canGenerate}
                icon={generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1.5" />}
                data-testid="button-generate-presentation"
              >
                {generateMutation.isPending ? "Generando…" : "Generar presentación"}
              </AgentButton>
              <span className="text-xs text-muted-foreground">
                El texto suele tardar menos de un minuto; las imágenes pueden requerir más tiempo.
              </span>
            </div>

            {generateMutation.isPending && (
              <AgentProgress
                title="El sistema sigue trabajando y guardará los archivos en el historial permanente"
                stages={[
                  { afterSeconds: 0, label: "Enviando y validando el material" },
                  { afterSeconds: 5, label: "Analizando los documentos" },
                  { afterSeconds: 14, label: "Creando la estructura de diapositivas" },
                  { afterSeconds: 30, label: illustrate ? "Preparando imágenes de apoyo" : "Aplicando el diseño editorial" },
                  { afterSeconds: 55, label: "Renderizando PowerPoint, PDF e imágenes" },
                  { afterSeconds: 90, label: "Ya casi está lista; guardando el historial" },
                ]}
              />
            )}

            {usedFallback && (
              <p className="text-xs text-amber-600" data-testid="text-fallback-note">
                Nota: se generó con un esquema automático (sin IA, probablemente por falta de créditos). Revisa y edita el contenido.
              </p>
            )}
            {notes.length > 0 && (
              <ul className="text-xs text-amber-600 list-disc pl-5 space-y-0.5" data-testid="list-doc-notes">
                {notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* --- Historial --- */}
        <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground mb-4">
          Presentaciones generadas ({presentations.length})
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}
          </div>
        )}

        {!isLoading && presentations.length === 0 && (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Presentation className="w-8 h-8 opacity-30" />
              <p className="text-sm">Aún no se ha generado ninguna presentación.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && presentations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentations.map((p) => {
              const pngUrls = Array.isArray(p.pngUrls) ? p.pngUrls : [];
              const pngAvailable = pngUrls.map((_, index) => p.availability?.png[index] ?? true);
              const hasPreview = pngAvailable.some(Boolean);
              const hasPptx = Boolean(p.pptxUrl && (p.availability?.pptx ?? true));
              const hasPdf = Boolean(p.pdfUrl && (p.availability?.pdf ?? true));
              const hasStoredPaths = Boolean(p.pptxUrl || p.pdfUrl || pngUrls.length);
              const hasAvailableFile = hasPptx || hasPdf || hasPreview;
              const hasMissingFile = Boolean(
                (p.pptxUrl && !hasPptx)
                || (p.pdfUrl && !hasPdf)
                || pngAvailable.some((available) => !available),
              );
              return (
              <Card key={p.id} data-testid={`presentation-card-${p.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{TEMPLATE_LABELS[p.template] || p.template}</Badge>
                    <Badge variant="outline">{(p.lang || "es").toUpperCase()}</Badge>
                  </div>

                  <p className="font-medium text-sm text-foreground line-clamp-2" title={p.title}>{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.slideCount || 0} diapositivas
                    {p.createdAt ? ` · ${new Date(p.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}` : ""}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {hasPreview && (
                      <Button size="sm" variant="outline" onClick={() => setPreviewId(p.id)} data-testid={`preview-${p.id}`}>
                        <Eye className="w-3 h-3 mr-1" />Previsualizar
                      </Button>
                    )}
                    {hasPptx && p.pptxUrl && (
                      <a href={`${p.pptxUrl}?download=1`} className="inline-flex" data-testid={`download-pptx-${p.id}`}>
                        <Button size="sm" variant="outline"><FileDown className="w-3 h-3 mr-1" />PPTX</Button>
                      </a>
                    )}
                    {hasPdf && p.pdfUrl && (
                      <a href={`${p.pdfUrl}?download=1`} className="inline-flex" data-testid={`download-pdf-${p.id}`}>
                        <Button size="sm" variant="outline"><FileText className="w-3 h-3 mr-1" />PDF</Button>
                      </a>
                    )}
                    {hasPreview && pngUrls[0] && pngAvailable[0] && (
                      <a href={`${pngUrls[0]}?download=1`} className="inline-flex" data-testid={`download-png-${p.id}`}>
                        <Button size="sm" variant="outline"><ImageIcon className="w-3 h-3 mr-1" />PNG portada</Button>
                      </a>
                    )}
                  </div>

                  {p.availability && hasStoredPaths && hasMissingFile && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2" role="status">
                      {hasAvailableFile
                        ? "Parte de los archivos históricos ya no está disponible. Las descargas conservadas siguen activas."
                        : "El historial permanece en la base, pero sus archivos ya no están disponibles. Vuelve a generar la presentación para restaurar sus descargas."}
                    </p>
                  )}

                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Vista previa in-panel: muestra las PNG por diapositiva (índice 0 = portada). */}
      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa de la presentación</DialogTitle>
          </DialogHeader>
          {(() => {
            const pre = presentations.find((p) => p.id === previewId);
            const pngs = pre?.pngUrls || [];
            const availablePngs = pngs
              .map((url, index) => ({
                url,
                index,
                available: pre?.availability?.png[index] ?? true,
              }))
              .filter((entry) => entry.available);
            if (!availablePngs.length) {
              return (
                <p className="text-sm text-muted-foreground py-2">
                  Esta presentación no conserva imágenes disponibles para previsualizar.
                </p>
              );
            }
            return (
              <div className="space-y-4 py-1">
                {availablePngs.map(({ url, index }) => (
                  <div key={url} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {index === 0 ? "Portada" : `Diapositiva ${index}`}
                    </p>
                    <img src={url} alt={index === 0 ? "Portada" : `Diapositiva ${index}`} className="w-full rounded-md border" loading="lazy" />
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
