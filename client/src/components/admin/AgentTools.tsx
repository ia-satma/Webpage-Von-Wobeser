import { useState } from "react";
import { useLocation } from "wouter";
import { adminApiRequest } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Share2, Mail, Bell, Loader2, Copy, Volume2 } from "lucide-react";

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

  const generate = async () => {
    if (!text || !text.trim()) { setError("No hay texto para convertir a audio."); return; }
    setLoading(true); setError(null); setAudioUrl(null);
    const r = await runAgent("voice_agent", { text, sourceType, articleId });
    setLoading(false);
    if (!r.ok) { setError(r.error || "No se pudo generar el audio."); return; }
    setAudioUrl(r.data?.audioUrl || null);
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading || !text?.trim()} data-testid="button-voice">
        {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Volume2 className="h-4 w-4 mr-1" />}
        {label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {audioUrl && <audio controls src={audioUrl} className="w-full" data-testid="audio-generated" />}
    </div>
  );
}

/** Botón "Generar post de redes" para un artículo (usar en el editor de noticias). */
export function SocialPostButton({ articleId }: { articleId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; data?: any; error?: string } | null>(null);

  const generate = async () => {
    setLoading(true); setRes(null);
    const r = await runAgent("social_media", { articleId });
    setRes(r); setLoading(false);
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => { setOpen(true); setRes(null); generate(); }} data-testid="button-social">
        <Share2 className="h-4 w-4 mr-1" /> Generar post de redes
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publicaciones para redes</DialogTitle>
            <DialogDescription>Generadas con IA. Revísalas y cópialas a LinkedIn / X.</DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Generando…</div>
          ) : res && !res.ok ? (
            <p className="text-sm text-destructive py-4">{res.error}</p>
          ) : res?.data ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {res.data.imageUrl ? (
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Imagen para el post</Label>
                  <img src={res.data.imageUrl} alt="Imagen generada para redes" className="w-full max-h-64 object-cover rounded-none border" />
                </div>
              ) : null}
              <CopyBox label="LinkedIn" text={[res.data.linkedin, (res.data.linkedinHashtags || []).join(" ")].filter(Boolean).join("\n\n")} />
              <CopyBox label="X (Twitter)" text={[res.data.twitter, (res.data.twitterHashtags || []).join(" ")].filter(Boolean).join(" ")} />
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Locución para redes (audio)</Label>
                <VoiceButton text={res.data.linkedin || ""} sourceType="social_media" articleId={articleId} label="Generar audio del post" />
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
      <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(true); generate(); }} data-testid="button-newsletter">
        <Mail className="h-4 w-4 mr-1" /> Boletín
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Boletín / Newsletter</DialogTitle>
            <DialogDescription>Compilado de las noticias recientes. Revísalo antes de enviarlo.</DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Generando…</div>
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
