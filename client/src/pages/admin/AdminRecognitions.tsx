import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ArrowLeft, Award, Plus, Trash2, Loader2 } from "lucide-react";

type Ranking = {
  id: string;
  name: string; nameEs: string;
  publication: string; year: number;
  category?: string | null; logoUrl?: string | null; externalUrl?: string | null;
};

const EMPTY = { name: "", nameEs: "", publication: "", year: new Date().getFullYear(), category: "", logoUrl: "", externalUrl: "" };

export default function AdminRecognitions() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: items = [], isLoading, refetch } = useQuery<Ranking[]>({
    queryKey: ["/api/admin/rankings"],
    queryFn: async () => (await adminApiRequest("GET", "/api/admin/rankings")).json(),
    enabled: isAuthenticated,
  });

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.name || !form.nameEs || !form.publication) {
      toast({ title: "Faltan datos", description: "Nombre (ES/EN) y publicación son obligatorios.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, year: Number(form.year) || new Date().getFullYear() };
      const res = await adminApiRequest("POST", "/api/admin/rankings", payload);
      if (res.ok) {
        toast({ title: "Reconocimiento agregado" });
        setForm({ ...EMPTY });
        refetch();
      } else {
        toast({ title: "Error al agregar", variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const res = await adminApiRequest("DELETE", `/api/admin/rankings/${id}`);
    if (res.ok) { toast({ title: "Eliminado" }); refetch(); }
    else toast({ title: "Error al eliminar", variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl">Reconocimientos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <p className="text-muted-foreground text-sm">
          Premios y rankings de la firma (Chambers, Legal 500, etc.). Lo que agregues aquí queda guardado en el sistema.
        </p>

        {/* Alta */}
        <Card>
          <CardHeader><CardTitle className="text-base">Agregar reconocimiento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre (inglés) *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Band 1 — Dispute Resolution" data-testid="input-name" /></div>
              <div className="space-y-1"><Label>Nombre (español) *</Label><Input value={form.nameEs} onChange={(e) => set("nameEs", e.target.value)} placeholder="Banda 1 — Resolución de Disputas" data-testid="input-nameEs" /></div>
              <div className="space-y-1"><Label>Publicación *</Label><Input value={form.publication} onChange={(e) => set("publication", e.target.value)} placeholder="Chambers and Partners" data-testid="input-publication" /></div>
              <div className="space-y-1"><Label>Año</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} data-testid="input-year" /></div>
              <div className="space-y-1"><Label>Categoría</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Arbitraje" data-testid="input-category" /></div>
              <div className="space-y-1"><Label>Logo</Label><ImageUpload value={form.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="/logos/chambers.png" /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Enlace externo</Label><Input value={form.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://chambers.com/..." data-testid="input-externalUrl" /></div>
            </div>
            <Button onClick={add} disabled={busy} data-testid="button-add">
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Agregar
            </Button>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader><CardTitle className="text-base">Reconocimientos actuales ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aún no hay reconocimientos. Agrega el primero arriba.</p>
            ) : (
              <ul className="divide-y">
                {items.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-4" data-testid={`row-${r.id}`}>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.publication}{r.year ? ` · ${r.year}` : ""}{r.category ? ` · ${r.category}` : ""}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)} data-testid={`del-${r.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
