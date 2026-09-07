import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CircleAlert, CircleCheck, Cookie, ExternalLink, Loader2, Save, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";

type Pair = { en: string; es: string };
type ConsentConfig = {
  version: string;
  validityMonths: number;
  analyticsEnabled: boolean;
  ga4Id?: string;
  leadinfoSiteId: string;
  leadinfoEnabled: boolean;
  leadinfoDisclosureReviewed: boolean;
  leadinfoStatus: "not_configured" | "inactive" | "ready" | "active";
  leadinfoActive: boolean;
  leadinfoActivationRevision: number;
  leadinfoProductionHostname: string;
  bannerTitle: Pair;
  bannerBody: Pair;
  acceptAll: Pair;
  rejectOptional: Pair;
  configure: Pair;
  preferencesTitle: Pair;
  preferencesBody: Pair;
  essentialDescription: Pair;
  analyticsDescription: Pair;
  leadinfoDescription: Pair;
  externalDescription: Pair;
  policyTitle: Pair;
  policyContent: Pair;
  locationDisclosureReviewRequired: boolean;
};

const PAIR_FIELDS: Array<{ key: keyof ConsentConfig; label: string; long?: boolean }> = [
  { key: "bannerTitle", label: "Título del aviso" },
  { key: "bannerBody", label: "Explicación inicial", long: true },
  { key: "acceptAll", label: "Botón: aceptar todas" },
  { key: "rejectOptional", label: "Botón: rechazar no esenciales" },
  { key: "configure", label: "Botón: configurar" },
  { key: "preferencesTitle", label: "Título de preferencias" },
  { key: "preferencesBody", label: "Explicación de preferencias", long: true },
  { key: "essentialDescription", label: "Categoría: esenciales", long: true },
  { key: "analyticsDescription", label: "Categoría: analítica", long: true },
  { key: "leadinfoDescription", label: "Categoría: identificación de empresas", long: true },
  { key: "externalDescription", label: "Categoría: contenido externo", long: true },
];

const LEADINFO_SITE_ID = /^[A-Za-z0-9_-]{4,160}$/;

const LEADINFO_STATUS = {
  not_configured: {
    label: "No configurado",
    description: "No hay Site ID. Leadinfo no se carga, no crea cookies ni recibe visitas.",
    tone: "text-muted-foreground",
  },
  inactive: {
    label: "Inactivo",
    description: "La preparación sigue apagada. Falta completar o confirmar algún requisito antes de activar.",
    tone: "text-muted-foreground",
  },
  ready: {
    label: "Listo para activar",
    description: "El Site ID y la revisión legal están confirmados; aún no se ha activado el rastreador.",
    tone: "text-amber-700",
  },
  active: {
    label: "Activo",
    description: "Leadinfo se carga sólo en el dominio público autorizado y después del consentimiento del visitante.",
    tone: "text-emerald-700",
  },
} as const;

export default function AdminCookieConsent() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draft, setDraft] = useState<ConsentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (!isAuthenticated) return;
    adminApiRequest("GET", "/api/admin/cookie-consent")
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        setDraft(await response.json());
      })
      .catch(() => toast({ title: "No se pudo cargar la configuración", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [isAuthenticated, toast]);

  const updatePair = (key: keyof ConsentConfig, language: keyof Pair, value: string) => {
    setDraft((current) => current ? ({ ...current, [key]: { ...(current[key] as Pair), [language]: value } }) : current);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const {
        ga4Id: _ga4Id,
        locationDisclosureReviewRequired: _locationDisclosureReviewRequired,
        leadinfoStatus: _leadinfoStatus,
        leadinfoActive: _leadinfoActive,
        leadinfoActivationRevision: _leadinfoActivationRevision,
        leadinfoProductionHostname: _leadinfoProductionHostname,
        ...payload
      } = draft;
      const response = await adminApiRequest("PUT", "/api/admin/cookie-consent", payload);
      if (!response.ok) throw new Error("save");
      setDraft(await response.json());
      toast({ title: "Privacidad y cookies guardadas", description: "El aviso público y las políticas bilingües ya reflejan la configuración." });
    } catch {
      toast({ title: "No se pudo guardar", description: "Revisa la versión, la vigencia y los textos obligatorios.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !draft) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;

  return (
    <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AdminPageHeader
        title="Privacidad y cookies"
        description="Administra el consentimiento global, GA4, Leadinfo, contenido externo y la política bilingüe."
        icon={Cookie}
        actions={<Button variant="outline" asChild><a href="/politica-de-cookies" target="_blank" rel="noreferrer">Ver política <ExternalLink className="h-4 w-4" /></a></Button>}
      />
      <AdminPageHelp pageId="cookie-consent">
        Las categorías opcionales nunca se cargan antes de la autorización. Cambiar la versión obliga a solicitar una decisión nueva; no cambies la redacción jurídica sin validación de la firma.
      </AdminPageHelp>

      <Card>
        <CardHeader><CardTitle>Control y vigencia</CardTitle><CardDescription>La elección se guarda sin identificar al visitante.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="cookie-version">Versión de política</Label><Input id="cookie-version" value={draft.version} onChange={(event) => setDraft({ ...draft, version: event.target.value })} maxLength={24} /></div>
          <div className="space-y-2"><Label htmlFor="cookie-validity">Vigencia (meses)</Label><Input id="cookie-validity" type="number" min={1} max={12} value={draft.validityMonths} onChange={(event) => setDraft({ ...draft, validityMonths: Number(event.target.value) })} /></div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-4"><div><Label htmlFor="cookie-ga4">Permitir categoría Analítica</Label><p className="mt-1 text-xs text-muted-foreground">GA4 solo se cargará si además lo acepta el visitante.</p></div><Switch id="cookie-ga4" checked={draft.analyticsEnabled} onCheckedChange={(analyticsEnabled) => setDraft({ ...draft, analyticsEnabled })} /></div>
        </CardContent>
      </Card>

      {(() => {
        const leadinfo = LEADINFO_STATUS[draft.leadinfoStatus];
        const hasValidLeadinfoId = LEADINFO_SITE_ID.test(draft.leadinfoSiteId.trim());
        const canEnableLeadinfo = hasValidLeadinfoId && draft.leadinfoDisclosureReviewed;
        const StatusIcon = draft.leadinfoStatus === "active" ? CircleCheck : CircleAlert;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Leadinfo</CardTitle>
              <CardDescription>Identificación de empresas preparada de forma segura. No usa Google Tag Manager ni recibe datos de formularios del sitio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-muted/25 p-4" role="status" aria-live="polite">
                <div className="flex gap-3">
                  <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${leadinfo.tone}`} aria-hidden="true" />
                  <div>
                    <p className={`font-medium ${leadinfo.tone}`}>{leadinfo.label}</p>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{leadinfo.description}</p>
                  </div>
                </div>
                {draft.leadinfoProductionHostname && <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">Dominio autorizado: {draft.leadinfoProductionHostname}</span>}
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="leadinfo-site-id">Site ID de Leadinfo</Label>
                  <Input
                    id="leadinfo-site-id"
                    value={draft.leadinfoSiteId}
                    onChange={(event) => setDraft({ ...draft, leadinfoSiteId: event.target.value })}
                    placeholder="Pendiente de recibir del cliente"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={160}
                    aria-describedby="leadinfo-site-id-help"
                  />
                  <p id="leadinfo-site-id-help" className="text-xs text-muted-foreground">Pega sólo el Site ID del portal de Leadinfo. No acepta código, etiquetas &lt;script&gt; ni enlaces.</p>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-4 lg:min-w-80">
                  <div>
                    <Label htmlFor="leadinfo-enabled">Activar Leadinfo</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Sólo se habilita con Site ID válido, revisión legal y consentimiento.</p>
                  </div>
                  <Switch
                    id="leadinfo-enabled"
                    checked={draft.leadinfoEnabled}
                    disabled={!draft.leadinfoEnabled && !canEnableLeadinfo}
                    onCheckedChange={(leadinfoEnabled) => setDraft({ ...draft, leadinfoEnabled })}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  id="leadinfo-disclosure-reviewed"
                  checked={draft.leadinfoDisclosureReviewed}
                  onCheckedChange={(checked) => setDraft({ ...draft, leadinfoDisclosureReviewed: checked === true })}
                />
                <div className="space-y-1">
                  <Label htmlFor="leadinfo-disclosure-reviewed">Confirmo que la firma revisó el aviso de privacidad y la tabla de cookies para Leadinfo.</Label>
                  <p className="text-xs text-muted-foreground">Al activarlo, el sitio mostrará la información de Leadinfo en la Política de Cookies en ambos idiomas y pedirá una decisión nueva al visitante.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardHeader><CardTitle>Panel y categorías</CardTitle><CardDescription>Español e inglés comparten estructura, visibilidad y jerarquía.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          {PAIR_FIELDS.map((field) => (
            <section key={String(field.key)} className="space-y-3 border-b pb-5 last:border-0">
              <h2 className="text-sm font-semibold">{field.label}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(["es", "en"] as const).map((language) => {
                  const value = (draft[field.key] as Pair)[language];
                  return <div className="space-y-2" key={language}><Label>{language === "es" ? "Español" : "Inglés"}</Label>{field.long ? <Textarea value={value} onChange={(event) => updatePair(field.key, language, event.target.value)} rows={3} /> : <Input value={value} onChange={(event) => updatePair(field.key, language, event.target.value)} />}</div>;
                })}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Política de Cookies</CardTitle><CardDescription>Contenido bilingüe administrable que se publica en /politica-de-cookies y /cookie-policy. La firma puede sustituirlo por su propia redacción jurídica en cualquier momento.</CardDescription></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          {draft.locationDisclosureReviewRequired && <div role="status" className="lg:col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Esta política fue personalizada y se conservó sin sobrescribir. Revísala para declarar que Google Maps se carga automáticamente en Contacto y, al acercarse a la sección, en Inicio.
          </div>}
          {(["es", "en"] as const).map((language) => <section key={language} className="space-y-3"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{language === "es" ? "Español" : "Inglés"}</h2><Label>Título</Label><Input value={draft.policyTitle[language]} onChange={(event) => updatePair("policyTitle", language, event.target.value)} /><Label>Contenido</Label><Textarea className="min-h-80 font-sans" value={draft.policyContent[language]} onChange={(event) => updatePair("policyContent", language, event.target.value)} /></section>)}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar configuración</Button></div>
    </main>
  );
}
