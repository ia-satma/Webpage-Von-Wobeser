import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Mail, Search, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminApiRequest, useAdminAuth, useMyPermissions } from "@/lib/adminAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Subscriber = {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  preferredLanguage: string | null;
  subscribedAt: string | null;
  consentedAt: string | null;
  isActive: boolean | null;
};

const fmtDate = (value: string | null) => value
  ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })
  : "—";

export default function AdminNewsletter() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { has, loaded: permissionsLoaded } = useMyPermissions();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (active !== "all") params.set("active", active);
    return params.toString();
  }, [search, active]);

  const subscribers = useQuery<Subscriber[]>({
    queryKey: ["/api/admin/newsletter-subscribers", queryString],
    enabled: isAuthenticated && permissionsLoaded && has("newsletter"),
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/newsletter-subscribers${queryString ? `?${queryString}` : ""}`);
      if (!res.ok) throw new Error("No se pudieron cargar los suscriptores.");
      return res.json();
    },
  });

  const updateStatus = async (subscriber: Subscriber) => {
    setUpdatingId(subscriber.id);
    try {
      const res = await adminApiRequest("PATCH", `/api/admin/newsletter-subscribers/${subscriber.id}/active`, {
        isActive: !subscriber.isActive,
      });
      if (!res.ok) throw new Error();
      toast({ title: subscriber.isActive ? "Suscripción desactivada" : "Suscripción reactivada" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter-subscribers"] });
    } catch {
      toast({ title: "No se pudo actualizar la suscripción", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteSubscriber = async (subscriber: Subscriber) => {
    if (!window.confirm(`¿Eliminar permanentemente la suscripción de ${subscriber.email}? Esta acción no se puede deshacer.`)) return;
    setUpdatingId(subscriber.id);
    try {
      const res = await adminApiRequest("DELETE", `/api/admin/newsletter-subscribers/${subscriber.id}`);
      if (!res.ok) throw new Error();
      toast({ title: "Suscripción eliminada" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter-subscribers"] });
    } catch {
      toast({ title: "No se pudo eliminar la suscripción", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await adminApiRequest("GET", `/api/admin/newsletter-subscribers/export.csv${queryString ? `?${queryString}` : ""}`);
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "newsletter-subscribers.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "No se pudo exportar el CSV", variant: "destructive" });
    }
  };

  if (authLoading || !isAuthenticated || !permissionsLoaded) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <AdminPageHeader
          title="Suscriptores del Newsletter"
          description="Registros recibidos desde la portada. Puedes desactivar o eliminar una suscripción y exportar el resultado filtrado."
          icon={Mail}
          actions={has("exports") ? <Button onClick={exportCsv} variant="outline"><Download className="h-4 w-4 mr-2" />Exportar CSV</Button> : undefined}
        />

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Lista de suscriptores</CardTitle>
              <CardDescription>El consentimiento y la fecha de registro quedan guardados para consulta interna.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative min-w-0 sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar nombre, correo o empresa" className="pl-9" />
              </div>
              <Select value={active} onValueChange={(value: "all" | "active" | "inactive") => setActive(value)}>
                <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {subscribers.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando suscriptores…</p>
            ) : subscribers.isError ? (
              <p className="text-sm text-destructive">No se pudieron cargar los suscriptores.</p>
            ) : !subscribers.data?.length ? (
              <p className="text-sm text-muted-foreground">No hay suscriptores para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Empresa</TableHead><TableHead>Idioma</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.data.map((subscriber) => (
                      <TableRow key={subscriber.id} className={subscriber.isActive ? "" : "opacity-60"}>
                        <TableCell>{subscriber.name || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{subscriber.email}</TableCell>
                        <TableCell>{subscriber.company || "—"}</TableCell>
                        <TableCell className="uppercase">{subscriber.preferredLanguage || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(subscriber.subscribedAt)}</TableCell>
                        <TableCell><Badge variant={subscriber.isActive ? "default" : "secondary"}>{subscriber.isActive ? "Activo" : "Inactivo"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="hidden items-center gap-1 sm:inline-flex">
                            <Button variant="ghost" size="sm" disabled={updatingId === subscriber.id} onClick={() => updateStatus(subscriber)}>{subscriber.isActive ? "Desactivar" : "Reactivar"}</Button>
                            <Button variant="ghost" size="sm" disabled={updatingId === subscriber.id} onClick={() => deleteSubscriber(subscriber)} title="Eliminar suscripción" aria-label="Eliminar suscripción">
                              <Trash2 className="mr-1 h-4 w-4 text-destructive" />Eliminar
                            </Button>
                          </div>
                          <div className="sm:hidden">
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones para ${subscriber.email}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => updateStatus(subscriber)} disabled={updatingId === subscriber.id}>{subscriber.isActive ? "Desactivar" : "Reactivar"}</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => deleteSubscriber(subscriber)} disabled={updatingId === subscriber.id}><Trash2 />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent></DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
