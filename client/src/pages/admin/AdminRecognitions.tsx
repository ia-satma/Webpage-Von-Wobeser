import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  ArrowDown,
  ArrowUp,
  Award,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { queryClient } from "@/lib/queryClient";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";

type Ranking = {
  id: string;
  name: string; nameEs: string;
  publication: string; year: number;
  category?: string | null; logoUrl?: string | null; externalUrl?: string | null;
  order?: number | null;
};

const EMPTY = { name: "", nameEs: "", publication: "", year: new Date().getFullYear(), category: "", logoUrl: "", externalUrl: "" };

export default function AdminRecognitions() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = alta; id = edición
  const [orderedItems, setOrderedItems] = useState<Ranking[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading, isError, refetch } = useQuery<Ranking[]>({
    queryKey: ["/api/admin/rankings"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/rankings");
      if (!response.ok) throw new Error("No se pudo cargar la lista de reconocimientos.");
      return response.json();
    },
    enabled: isAuthenticated,
  });
  const items = data ?? [];

  useEffect(() => {
    if (!orderDirty && data) setOrderedItems(data);
  }, [data, orderDirty]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Cargar un reconocimiento existente en el formulario para editarlo.
  const edit = (r: Ranking) => {
    setEditingId(r.id);
    setForm({
      name: r.name || "", nameEs: r.nameEs || "", publication: r.publication || "",
      year: r.year || new Date().getFullYear(), category: r.category || "",
      logoUrl: r.logoUrl || "", externalUrl: r.externalUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm({ ...EMPTY }); };

  const save = async () => {
    if (!form.name || !form.nameEs || !form.publication) {
      toast({ title: "Faltan datos", description: "Nombre (ES/EN) y publicación son obligatorios.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, year: Number(form.year) || new Date().getFullYear() };
      const res = editingId
        ? await adminApiRequest("PUT", `/api/admin/rankings/${editingId}`, payload)
        : await adminApiRequest("POST", "/api/admin/rankings", payload);
      if (res.ok) {
        toast({ title: editingId ? "Reconocimiento actualizado" : "Reconocimiento agregado" });
        setForm({ ...EMPTY });
        setEditingId(null);
        setOrderDirty(false);
        void refetch();
      } else {
        toast({ title: editingId ? "Error al actualizar" : "Error al agregar", variant: "destructive" });
      }
    } catch {
      toast({
        title: editingId ? "Error al actualizar" : "Error al agregar",
        description: "No fue posible conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await adminApiRequest("DELETE", `/api/admin/rankings/${id}`);
      if (res.ok) {
        toast({ title: "Eliminado" });
        setOrderDirty(false);
        void refetch();
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" });
      }
    } catch {
      toast({
        title: "Error al eliminar",
        description: "No fue posible conectar con el servidor.",
        variant: "destructive",
      });
    }
  };

  const moveRanking = (id: string, direction: -1 | 1) => {
    setOrderedItems((current) => {
      const from = current.findIndex((item) => item.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setOrderDirty(true);
  };

  const dropRanking = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setOrderedItems((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setOrderDirty(true);
    setDraggedId(null);
    setDragOverId(null);
  };

  const cancelOrder = () => {
    setOrderedItems(items);
    setOrderDirty(false);
    setDraggedId(null);
    setDragOverId(null);
  };

  const saveOrder = async () => {
    if (!orderDirty || orderBusy) return;
    setOrderBusy(true);
    try {
      const res = await adminApiRequest("PUT", "/api/admin/rankings/order", {
        ids: orderedItems.map((item) => item.id),
      });
      if (res.status === 409) {
        toast({
          title: "La lista cambió",
          description: "Otro usuario agregó o eliminó un reconocimiento. Recargamos el orden para evitar perder cambios.",
          variant: "destructive",
        });
        setOrderDirty(false);
        const refreshed = await refetch();
        if (refreshed.data) setOrderedItems(refreshed.data);
        return;
      }
      if (!res.ok) throw new Error("No se pudo guardar el orden");

      const saved = await res.json() as Ranking[];
      queryClient.setQueryData(["/api/admin/rankings"], saved);
      setOrderedItems(saved);
      setOrderDirty(false);
      toast({ title: "Orden guardado", description: "El carrusel público ya usa esta secuencia." });
    } catch {
      toast({
        title: "No se pudo guardar el orden",
        description: "Tus movimientos siguen visibles en el panel para que puedas intentarlo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setOrderBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <AdminPageHeader title="Reconocimientos" icon={Award} />

        <AdminPageHelp pageId="reconocimientos" manualSectionId="reconocimientos">Registra los premios y rankings de la firma (Chambers, Legal 500…) con su logo y año.</AdminPageHelp>

        <p className="text-muted-foreground text-sm">
          Premios y rankings de la firma (Chambers, Legal 500, etc.). Lo que agregues aquí queda guardado en el sistema.
        </p>

        {/* Alta / edición */}
        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? "Editar reconocimiento" : "Agregar reconocimiento"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <TranslateButton
                getSource={() => ({ name: form.nameEs })}
                onApply={(f) => { if (f.name != null) set("name", f.name); }}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre (inglés) *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Band 1 — Dispute Resolution" data-testid="input-name" /><TypographyFieldControl entityType="ranking" entityId={editingId} field="name" language="en" role="editorial" compact /></div>
              <div className="space-y-1"><Label>Nombre (español) *</Label><Input value={form.nameEs} onChange={(e) => set("nameEs", e.target.value)} placeholder="Banda 1 — Resolución de Disputas" data-testid="input-nameEs" /><TypographyFieldControl entityType="ranking" entityId={editingId} field="nameEs" language="es" role="editorial" compact /></div>
              <div className="space-y-1"><Label>Publicación *</Label><Input value={form.publication} onChange={(e) => set("publication", e.target.value)} placeholder="Chambers and Partners" data-testid="input-publication" /><TypographyFieldControl entityType="ranking" entityId={editingId} field="publication" language="en" role="editorial" compact /></div>
              <div className="space-y-1"><Label>Año</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} data-testid="input-year" /></div>
              <div className="space-y-1"><Label>Categoría</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Arbitraje" data-testid="input-category" /></div>
              <div className="space-y-1"><Label>Logo</Label><ImageUpload value={form.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="/logos/chambers.png" /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Enlace externo</Label><Input value={form.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://chambers.com/..." data-testid="input-externalUrl" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={save} disabled={busy} data-testid="button-save">
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : editingId ? <Save className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {editingId ? "Guardar cambios" : "Agregar"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={cancelEdit} disabled={busy} data-testid="button-cancel-edit">
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Orden del carrusel ({orderedItems.length})</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Arrastra en escritorio o usa Subir y Bajar. Los cambios se publican únicamente al guardar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelOrder}
                  disabled={!orderDirty || orderBusy}
                  data-testid="button-cancel-order"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={saveOrder}
                  disabled={!orderDirty || orderBusy}
                  data-testid="button-save-order"
                >
                  {orderBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar orden
                </Button>
              </div>
            </div>
            {orderDirty && (
              <p className="border-l-2 border-primary pl-3 text-sm text-foreground" role="status">
                Hay cambios de orden pendientes de guardar.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : isError ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-destructive">No se pudo cargar la lista de reconocimientos.</p>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>Reintentar</Button>
              </div>
            ) : orderedItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aún no hay reconocimientos. Agrega el primero arriba.</p>
            ) : (
              <ul className="divide-y">
                {orderedItems.map((r, index) => (
                  <li
                    key={r.id}
                    className={`py-3 transition-colors ${dragOverId === r.id ? "bg-muted/70" : ""}`}
                    data-testid={`row-${r.id}`}
                    onDragOver={(event) => {
                      if (!draggedId) return;
                      event.preventDefault();
                      setDragOverId(r.id);
                    }}
                    onDragLeave={() => setDragOverId((current) => current === r.id ? null : current)}
                    onDrop={(event) => {
                      event.preventDefault();
                      dropRanking(r.id);
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                          type="button"
                          draggable
                          className="hidden h-10 w-8 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing sm:flex"
                          aria-label={`Arrastrar ${r.nameEs || r.name}`}
                          title="Arrastrar para cambiar la posición"
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", r.id);
                            setDraggedId(r.id);
                          }}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDragOverId(null);
                          }}
                        >
                          <GripVertical className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums" aria-label={`Posición ${index + 1}`}>
                          {index + 1}
                        </span>
                        <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-white p-1.5">
                          {r.logoUrl ? (
                            <img
                              src={r.logoUrl}
                              alt=""
                              className="h-full w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Award className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.nameEs || r.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {r.publication}{r.year ? ` · ${r.year}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pl-11 sm:pl-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveRanking(r.id, -1)}
                          disabled={index === 0 || orderBusy}
                          data-testid={`move-up-${r.id}`}
                          aria-label={`Subir ${r.nameEs || r.name}`}
                        >
                          <ArrowUp className="mr-1 h-4 w-4" aria-hidden="true" />
                          Subir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveRanking(r.id, 1)}
                          disabled={index === orderedItems.length - 1 || orderBusy}
                          data-testid={`move-down-${r.id}`}
                          aria-label={`Bajar ${r.nameEs || r.name}`}
                        >
                          <ArrowDown className="mr-1 h-4 w-4" aria-hidden="true" />
                          Bajar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => edit(r)} data-testid={`edit-${r.id}`} title="Editar" aria-label={`Editar ${r.nameEs || r.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(r.id)} data-testid={`del-${r.id}`} title="Eliminar" aria-label={`Eliminar ${r.nameEs || r.name}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
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
