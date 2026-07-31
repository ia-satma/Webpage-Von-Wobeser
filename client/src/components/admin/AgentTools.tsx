import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { adminApiRequest } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { AgentButton } from "@/components/admin/AgentButton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, Bell, Loader2, Copy, Volume2, Download, Clock3 } from "lucide-react";
import { downloadHref } from "./ImageUpload";

/** Llama a un agente y devuelve su AgentResult (o un error legible). */
async function runAgent(agentType: string, payload: Record<string, unknown>): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await adminApiRequest("POST", `/api/agents/run/${agentType}`, payload);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.error || `Error ${res.status}` };
    if (body?.success === false) return { ok: false, error: body?.error || "El agente no pudo completar la tarea." };
    return { ok: true, data: body?.data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "No se pudo ejecutar el agente." };
  }
}

export type AgentProgressStage = {
  afterSeconds: number;
  label: string;
  detail?: string;
};

const DEFAULT_PROGRESS_STAGES: AgentProgressStage[] = [
  { afterSeconds: 0, label: "Preparando la solicitud" },
  { afterSeconds: 4, label: "Analizando el contenido" },
  { afterSeconds: 12, label: "Generando el resultado" },
  { afterSeconds: 30, label: "Afinando la respuesta" },
  { afterSeconds: 55, label: "Ya casi está listo" },
];

/**
 * Estado honesto para operaciones de IA que no ofrecen progreso porcentual. La etapa se
 * calcula por tiempo transcurrido y se presenta explícitamente como aproximada; el reloj
 * confirma que la solicitud continúa activa sin inventar porcentajes ni respuestas.
 */
export function AgentProgress({
  title = "La solicitud sigue activa",
  stages = DEFAULT_PROGRESS_STAGES,
}: {
  title?: string;
  stages?: AgentProgressStage[];
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const stage = stages.reduce(
    (current, candidate) => elapsedSeconds >= candidate.afterSeconds ? candidate : current,
    stages[0] || DEFAULT_PROGRESS_STAGES[0],
  );

  return (
    <div
      className="border border-primary/25 bg-primary/[0.035] px-4 py-4"
      role="status"
      aria-live="polite"
      data-testid="agent-progress"
    >
      <div className="flex items-start gap-3">
        <span className="relative mt-1 flex h-3 w-3 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/45 motion-reduce:hidden" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{stage.label}</p>
            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {elapsedSeconds} s
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {stage.detail || title}. La etapa es aproximada; no cierres esta ventana mientras termina.
          </p>
        </div>
      </div>
    </div>
  );
}

function CopyBox({ label, text }: { label: string; text: string }) {
  const { toast } = useToast();
  if (!text) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(text); toast({ title: "Copiado" }); }}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
        </Button>
      </div>
      <Textarea readOnly value={text} rows={Math.min(10, Math.max(3, Math.ceil(text.length / 80)))} className="text-sm" />
    </div>
  );
}

/**
 * Botón "Generar audio" — convierte texto YA generado por otro agente (newsletter/
 * social_media/legal_alerts) a voz vía OpenAI TTS (voice_agent, el 13° agente del contrato).
 */
export function VoiceButton({
  text,
  sourceType,
  articleId,
  label = "Generar audio",
}: {
  text: string;
  sourceType: "newsletter" | "social_media" | "legal_alerts";
  articleId?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState("onyx"); // voz masculina por defecto (OpenAI TTS)

  const generate = async () => {
    if (!text || !text.trim()) { setError("No hay texto para convertir a audio."); return; }
    setLoading(true); setError(null); setAudioUrl(null);
    const r = await runAgent("voice_agent", { text, sourceType, articleId, voiceId });
    setLoading(false);
    if (!r.ok) { setError(r.error || "No se pudo generar el audio."); return; }
    setAudioUrl(r.data?.audioUrl || null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Voz:</label>
        <select
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          disabled={loading}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          data-testid="select-voice"
        >
          <optgroup label="Hombre">
            <option value="onyx">Hombre (grave)</option>
            <option value="echo">Hombre (claro)</option>
          </optgroup>
          <optgroup label="Mujer">
            <option value="nova">Mujer (cálida)</option>
            <option value="shimmer">Mujer (suave)</option>
          </optgroup>
        </select>
      </div>
      <AgentButton type="button" size="sm" onClick={generate} disabled={loading || !text?.trim()} icon={loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Volume2 className="h-4 w-4 mr-1.5" />} data-testid="button-voice">
        {label}
      </AgentButton>
      {loading && (
        <AgentProgress
          title="OpenAI está preparando y guardando el audio"
          stages={[
            { afterSeconds: 0, label: "Preparando la locución" },
            { afterSeconds: 4, label: "Generando el audio" },
            { afterSeconds: 18, label: "Guardando el archivo en el historial" },
          ]}
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {audioUrl && <audio controls src={audioUrl} className="w-full" data-testid="audio-generated" />}
    </div>
  );
}

const SOCIAL_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

/** Botón "Generar post de redes" para un artículo (usar en el editor de noticias). */
export function SocialPostButton({ articleId }: { articleId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; data?: any; error?: string } | null>(null);
  const [selected, setSelected] = useState<string[]>(["linkedin", "twitter"]);
  const [aspect, setAspect] = useState("1:1");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const generate = async () => {
    if (!selected.length) return;
    setLoading(true); setRes(null);
    const r = await runAgent("social_media", { articleId, platforms: selected, aspect });
    setRes(r); setLoading(false);
  };

  const posts: Record<string, { text?: string; hashtags?: string[] }> = res?.data?.posts || {};
  const firstText = Object.values(posts).find((p) => p?.text)?.text || "";

  return (
    <>
      <AgentButton type="button" onClick={() => { setOpen(true); setRes(null); }} data-testid="button-social">
        Generar post de redes
      </AgentButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publicaciones para redes</DialogTitle>
            <DialogDescription>Elige las redes y genera copys de alta calidad con IA.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={selected.includes(p.id) ? "default" : "outline"}
                onClick={() => toggle(p.id)}
                data-testid={`toggle-${p.id}`}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-muted-foreground">Formato de imagen:</Label>
            <select
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              className="h-9 rounded-none border border-input bg-background px-2 text-sm"
              data-testid="select-social-aspect"
            >
              <option value="1:1">Cuadrada 1:1</option>
              <option value="16:9">Horizontal 16:9</option>
              <option value="9:16">Vertical 9:16</option>
            </select>
          </div>
          <AgentButton
            type="button"
            onClick={generate}
            disabled={loading || !selected.length}
            icon={loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : undefined}
            data-testid="button-social-generate"
          >
            Generar publicaciones
          </AgentButton>

          {loading ? (
            <AgentProgress
              title="El texto y la imagen se están preparando en paralelo cuando es posible"
              stages={[
                { afterSeconds: 0, label: "Analizando la noticia" },
                { afterSeconds: 5, label: "Creando textos e imagen" },
                { afterSeconds: 22, label: "Afinando cada red social" },
                { afterSeconds: 50, label: "Guardando la imagen en el historial" },
                { afterSeconds: 85, label: "Ya casi está listo" },
              ]}
            />
          ) : res && !res.ok ? (
            <p className="text-sm text-destructive py-4">{res.error}</p>
          ) : res?.data ? (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto">
              {res.data.imageUrl ? (
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Imagen para el post</Label>
                  <img src={res.data.imageUrl} alt="Imagen generada para redes" className="w-full max-h-64 object-cover rounded-none border" />
                  <a
                    href={downloadHref(res.data.imageUrl)}
                    download={String(res.data.imageUrl).split("?")[0].split("/").pop() || "imagen.png"}
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                    data-testid="link-download-social-image"
                  >
                    <Download className="h-3.5 w-3.5" /> Descargar imagen
                  </a>
                </div>
              ) : null}
              {SOCIAL_PLATFORMS.filter((p) => posts[p.id]?.text).map((p) => (
                <CopyBox
                  key={p.id}
                  label={p.label}
                  text={[posts[p.id]?.text, (posts[p.id]?.hashtags || []).join(" ")].filter(Boolean).join("\n\n")}
                />
              ))}
              {firstText ? (
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Locución para redes (audio)</Label>
                  <VoiceButton text={firstText} sourceType="social_media" articleId={articleId} label="Generar audio del post" />
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Botón "Generar boletín" (usar en la cabecera de Noticias). */
export function NewsletterButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; data?: any; error?: string } | null>(null);

  const generate = async () => {
    setLoading(true); setRes(null);
    const r = await runAgent("newsletter", { limit: 8 });
    setRes(r); setLoading(false);
  };

  return (
    <>
      <AgentButton type="button" size="sm" onClick={() => { setOpen(true); generate(); }} icon={<Mail className="h-4 w-4 mr-1.5" />} data-testid="button-newsletter">
        Boletín
      </AgentButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Boletín / Newsletter</DialogTitle>
            <DialogDescription>Compilado de las noticias recientes. Revísalo antes de enviarlo.</DialogDescription>
          </DialogHeader>
          {loading ? (
            <AgentProgress
              title="Se están seleccionando y redactando las noticias del boletín"
              stages={[
                { afterSeconds: 0, label: "Reuniendo noticias publicadas" },
                { afterSeconds: 5, label: "Redactando el boletín" },
                { afterSeconds: 16, label: "Preparando la vista previa" },
                { afterSeconds: 35, label: "Ya casi está listo" },
              ]}
            />
          ) : res && !res.ok ? (
            <p className="text-sm text-destructive py-4">{res.error}</p>
          ) : res?.data ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <CopyBox label="Asunto" text={res.data.subject || ""} />
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Vista previa</Label>
                {/* iframe con sandbox="" (sin allow-scripts): aísla el HTML generado; nada se ejecuta. */}
                <iframe
                  title="Vista previa del boletín"
                  sandbox=""
                  srcDoc={res.data.html || ""}
                  className="w-full h-64 border rounded-md mt-1 bg-white"
                  data-testid="newsletter-preview"
                />
              </div>
              <CopyBox label="HTML (para pegar en el correo)" text={res.data.html || ""} />
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Boletín hablado (audio)</Label>
                <VoiceButton text={res.data.html || ""} sourceType="newsletter" label="Generar audio del boletín" />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={generate} disabled={loading}>Regenerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Botón "Crear alerta desde una fuente" (usar en la cabecera de Noticias). */
export function LegalAlertButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const generate = async () => {
    if (!text.trim() && !url.trim()) { setErr("Pega el texto de la fuente o una URL."); return; }
    setLoading(true); setErr("");
    const r = await runAgent("legal_alerts", { sourceText: text.trim() || undefined, sourceUrl: url.trim() || undefined });
    setLoading(false);
    if (!r.ok) { setErr(r.error || "No se pudo generar."); return; }
    toast({ title: "Borrador de alerta creado", description: "Revísalo y publícalo." });
    setOpen(false); setText(""); setUrl("");
    if (r.data?.newsId) setLocation(`/admin/news/${r.data.newsId}/edit`);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="button-alert">
        <Bell className="h-4 w-4 mr-1" /> Crear alerta
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear alerta desde una fuente</DialogTitle>
            <DialogDescription>Pega el texto de una publicación oficial (DOF/SCJN) o una URL. La IA redacta un <strong>borrador</strong> de alerta que queda como noticia sin publicar para tu revisión.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Texto de la fuente</Label>
              <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí el texto de la publicación oficial…" data-testid="input-alert-text" />
            </div>
            <div className="space-y-1">
              <Label>…o una URL (opcional)</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.dof.gob.mx/..." data-testid="input-alert-url" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            {loading && (
              <AgentProgress
                title="La fuente se está validando y convirtiendo en un borrador"
                stages={[
                  { afterSeconds: 0, label: "Validando la fuente" },
                  { afterSeconds: 5, label: "Analizando el contenido legal" },
                  { afterSeconds: 16, label: "Redactando el borrador" },
                  { afterSeconds: 35, label: "Guardando para revisión" },
                ]}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={generate} disabled={loading} data-testid="button-alert-generate">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bell className="h-4 w-4 mr-1" />}
              Generar borrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
