import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmChangesDialog, fmtValue, type Change } from "@/components/admin/ConfirmChangesDialog";
import { ArrowLeft, Save, Settings, Loader2 } from "lucide-react";

// Friendly definitions for the editable site-config keys (grouped).
const GROUPS: Array<{
  title: string;
  fields: Array<{ key: string; label: string; help?: string; bilingual?: boolean; media?: "image" | "video" }>;
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
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl">Configuración del sitio</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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
                    ) : (
                      <Input
                        value={draft[f.key]?.value ?? ""}
                        onChange={(e) => set(f.key, "value", e.target.value)}
                        placeholder={f.bilingual ? "Texto en inglés" : ""}
                        data-testid={`input-${f.key}`}
                      />
                    )}
                    {f.bilingual && (
                      <Input
                        value={draft[f.key]?.valueEs ?? ""}
                        onChange={(e) => set(f.key, "valueEs", e.target.value)}
                        placeholder="Texto en español"
                        data-testid={`input-${f.key}-es`}
                      />
                    )}
                    <div>
                      <Button size="sm" onClick={() => requestSave(f)} disabled={saving === f.key} data-testid={`save-${f.key}`}>
                        {saving === f.key ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Guardar
                      </Button>
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
