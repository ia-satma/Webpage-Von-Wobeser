import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Edit2, Loader2, Plus, Trash2, type LucideIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";

export type CatalogField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "email" | "url";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  span?: 1 | 2;
};

type Props = {
  title: string;
  description: string;
  endpoint: string;
  icon: LucideIcon;
  fields: CatalogField[];
  initial: Record<string, unknown>;
  itemTitle: (item: Record<string, unknown>) => string;
  itemMeta: (item: Record<string, unknown>) => string;
  helpId: string;
  help: string;
};

function inputValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return value == null ? "" : String(value);
}

export function CatalogEditorPage(props: Props) {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({ ...props.initial });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const query = useQuery<Record<string, unknown>[]>({
    queryKey: [props.endpoint],
    queryFn: async () => {
      const response = await adminApiRequest("GET", props.endpoint);
      if (!response.ok) throw new Error("No se pudo cargar el catálogo");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const valid = useMemo(() => props.fields.every((field) => !field.required || String(form[field.key] ?? "").trim()), [form, props.fields]);
  const startCreate = () => { setEditing(null); setForm({ ...props.initial }); setOpen(true); };
  const startEdit = (item: Record<string, unknown>) => { setEditing(item); setForm({ ...props.initial, ...item }); setOpen(true); };

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const id = String(editing?.id || "");
      const payload = Object.fromEntries(props.fields.map((field) => {
        const value = form[field.key];
        if (field.type === "number") return [field.key, value === "" || value == null ? null : Number(value)];
        if (field.type === "date") return [field.key, value ? new Date(`${value}T12:00:00`).toISOString() : null];
        if (field.type === "checkbox") return [field.key, Boolean(value)];
        return [field.key, value == null ? "" : value];
      }));
      const response = await adminApiRequest(editing ? "PUT" : "POST", editing ? `${props.endpoint}/${encodeURIComponent(id)}` : props.endpoint, payload);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "No se pudo guardar");
      await query.refetch();
      setOpen(false);
      toast({ title: editing ? "Registro actualizado" : "Registro creado" });
    } catch (error) {
      toast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Revisa los campos.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    try {
      const response = await adminApiRequest("DELETE", `${props.endpoint}/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("No se pudo eliminar");
      await query.refetch();
      toast({ title: "Registro eliminado" });
    } catch (error) {
      toast({ title: "No se pudo eliminar", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid={`catalog-${props.helpId}`}>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <AdminPageHeader title={props.title} description={props.description} icon={props.icon}
          actions={<Button onClick={startCreate}><Plus className="mr-2 size-4" />Nuevo registro</Button>} />
        <AdminPageHelp pageId={props.helpId} manualSectionId={props.helpId}>{props.help}</AdminPageHelp>
        {query.isLoading ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="size-7 animate-spin" /></div>
          : query.isError ? <Card><CardContent className="p-8 text-center"><p>No se pudo cargar esta sección.</p><Button className="mt-4" onClick={() => query.refetch()}>Reintentar</Button></CardContent></Card>
            : !query.data?.length ? <Card><CardContent className="p-10 text-center text-muted-foreground">Todavía no hay registros. La sección pública permanecerá oculta hasta que publiques contenido.</CardContent></Card>
              : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data.map((item) => <Card key={String(item.id)}><CardContent className="flex min-h-40 flex-col p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl">{props.itemTitle(item)}</h2><p className="mt-1 text-sm text-muted-foreground">{props.itemMeta(item)}</p></div><span className={`rounded-full px-2 py-1 text-xs ${item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.published ? "Publicado" : "Borrador"}</span></div><div className="mt-auto flex justify-end gap-2 pt-5"><Button variant="outline" size="sm" onClick={() => startEdit(item)}><Edit2 className="mr-2 size-4" />Editar</Button><Button variant="ghost" size="sm" disabled={deleting === item.id} onClick={() => remove(String(item.id))}><Trash2 className="size-4 text-destructive" /></Button></div></CardContent></Card>)}</div>}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><span /></DialogTrigger>
          <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar registro" : "Nuevo registro"}</DialogTitle></DialogHeader>
            <div className="grid gap-5 sm:grid-cols-2">
              {props.fields.map((field) => {
                const id = `${props.helpId}-${field.key}`;
                const value = form[field.key];
                const set = (next: unknown) => setForm((current) => ({ ...current, [field.key]: next }));
                return <div key={field.key} className={`space-y-2 ${field.span === 2 ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>
                  {field.type === "textarea" ? <Textarea id={id} value={inputValue(value)} rows={6} onChange={(event) => set(event.target.value)} />
                    : field.type === "select" ? <Select value={inputValue(value)} onValueChange={set}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
                      : field.type === "checkbox" ? <div className="flex min-h-10 items-center gap-3 rounded-md border px-3"><Checkbox id={id} checked={Boolean(value)} onCheckedChange={(checked) => set(checked === true)} /><span className="text-sm">{Boolean(value) ? "Sí" : "No"}</span></div>
                        : <Input id={id} type={field.type === "date" ? "date" : field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"} value={inputValue(value)} required={field.required} onChange={(event) => set(event.target.value)} />}
                </div>;
              })}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={!valid || saving} onClick={save}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
