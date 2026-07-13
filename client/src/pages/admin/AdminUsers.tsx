import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, KeyRound, Trash2, Loader2, SlidersHorizontal, History, Check, X } from "lucide-react";

type AdminUserRow = {
  id: string; username: string; email: string; role: string;
  permissions: string[] | null;
  isActive: boolean | null; lastLogin: string | null; createdAt: string | null;
};

type LoginEvent = {
  id: string; userId: string | null; email: string; success: boolean;
  ipAddress: string | null; userAgent: string | null; createdAt: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Dueño",
  admin: "Administrador",
  editor: "Editor (contenido)",
  marketing: "Marketing",
  sistemas: "Sistemas",
};

// Permisos que el Dueño/Admin puede conceder EXTRA (espejo de GRANTABLE en server/auth.ts).
const GRANTABLE: { key: string; label: string; hint: string }[] = [
  { key: "content", label: "Contenido", hint: "Noticias, abogados, prácticas, eventos, blog…" },
  { key: "agents", label: "Agentes IA", hint: "Ejecutar los agentes de inteligencia artificial" },
  { key: "config", label: "Configuración del sitio", hint: "Textos, pie de página, idiomas" },
  { key: "advanced", label: "Avanzado", hint: "Auditorías, salud del sistema, cronista" },
];

// Permisos BASE por rol (espejo de ROLE_PERMISSIONS en server/auth.ts).
const ROLE_BASE: Record<string, string[]> = {
  super_admin: ["content", "agents", "config", "advanced"],
  admin: ["content", "agents", "config", "advanced"],
  editor: ["content", "config"],
  marketing: ["content", "agents"],
  sistemas: ["content", "agents", "advanced"],
};

export default function AdminUsers() {
  const { isAuthenticated, isLoading: authLoading, role: myRole } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isOwner = myRole === "super_admin";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // Roles asignables: solo un Dueño puede crear/asignar Dueño.
  const assignable = Object.keys(ROLE_LABELS).filter((r) => r !== "super_admin" || isOwner);

  const usersQuery = useQuery<AdminUserRow[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/users");
      if (!res.ok) {
        if (res.status === 403) throw new Error("No tienes permiso para gestionar usuarios.");
        throw new Error("No se pudo cargar la lista.");
      }
      return res.json();
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
  const err = (fallback: string) => async (res: Response) => {
    const b = await res.json().catch(() => ({}));
    return (b as any)?.error || fallback;
  };

  // --- crear ---
  const [openCreate, setOpenCreate] = useState(false);
  const [nf, setNf] = useState({ username: "", email: "", password: "", role: "editor" });
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!nf.email || nf.password.length < 8) {
      toast({ title: "Faltan datos", description: "Correo y contraseña (mín. 8 caracteres).", variant: "destructive" });
      return;
    }
    setBusy(true);
    const res = await adminApiRequest("POST", "/api/admin/users", nf);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Usuario creado" });
      setOpenCreate(false); setNf({ username: "", email: "", password: "", role: "editor" }); refresh();
    } else {
      toast({ title: "Error", description: await err("No se pudo crear")(res), variant: "destructive" });
    }
  };

  const changeRole = async (u: AdminUserRow, role: string) => {
    const res = await adminApiRequest("PUT", `/api/admin/users/${u.id}`, { role });
    if (res.ok) { toast({ title: "Rol actualizado" }); refresh(); }
    else toast({ title: "Error", description: await err("No se pudo cambiar el rol")(res), variant: "destructive" });
  };

  const toggleActive = async (u: AdminUserRow) => {
    const res = await adminApiRequest("PUT", `/api/admin/users/${u.id}`, { isActive: !u.isActive });
    if (res.ok) { toast({ title: u.isActive ? "Usuario desactivado" : "Usuario activado" }); refresh(); }
    else toast({ title: "Error", description: await err("No se pudo cambiar")(res), variant: "destructive" });
  };

  const del = async (u: AdminUserRow) => {
    if (!window.confirm(`¿Eliminar a ${u.email}? Esta acción no se puede deshacer.`)) return;
    const res = await adminApiRequest("DELETE", `/api/admin/users/${u.id}`);
    if (res.ok) { toast({ title: "Usuario eliminado" }); refresh(); }
    else toast({ title: "Error", description: await err("No se pudo eliminar")(res), variant: "destructive" });
  };

  // --- reset contraseña ---
  const [pwUser, setPwUser] = useState<AdminUserRow | null>(null);
  const [pw, setPw] = useState("");
  const resetPw = async () => {
    if (!pwUser || pw.length < 8) { toast({ title: "Contraseña muy corta", description: "Mínimo 8 caracteres.", variant: "destructive" }); return; }
    setBusy(true);
    const res = await adminApiRequest("POST", `/api/admin/users/${pwUser.id}/password`, { password: pw });
    setBusy(false);
    if (res.ok) { toast({ title: "Contraseña actualizada" }); setPwUser(null); setPw(""); }
    else toast({ title: "Error", description: await err("No se pudo cambiar")(res), variant: "destructive" });
  };

  // --- permisos extra por usuario ---
  const [permUser, setPermUser] = useState<AdminUserRow | null>(null);
  const [permExtra, setPermExtra] = useState<string[]>([]);
  const openPerms = (u: AdminUserRow) => {
    const base = ROLE_BASE[u.role] || [];
    // Solo se editan las concesiones EXTRA (las de base vienen del rol y no se tocan aquí).
    setPermExtra((u.permissions || []).filter((p) => !base.includes(p)));
    setPermUser(u);
  };
  const toggleExtra = (key: string, on: boolean) =>
    setPermExtra((prev) => (on ? Array.from(new Set([...prev, key])) : prev.filter((p) => p !== key)));
  const savePerms = async () => {
    if (!permUser) return;
    setBusy(true);
    const res = await adminApiRequest("PUT", `/api/admin/users/${permUser.id}`, { permissions: permExtra });
    setBusy(false);
    if (res.ok) { toast({ title: "Permisos actualizados" }); setPermUser(null); refresh(); }
    else toast({ title: "Error", description: await err("No se pudieron guardar")(res), variant: "destructive" });
  };

  // --- historial de accesos ---
  const logQuery = useQuery<LoginEvent[]>({
    queryKey: ["/api/admin/login-log"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/login-log");
      if (!res.ok) throw new Error("No se pudo cargar el historial.");
      return res.json();
    },
  });

  const users = usersQuery.data || [];
  const events = logQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <AdminPageHeader
          title="Usuarios y accesos"
          actions={
            <Button size="sm" onClick={() => setOpenCreate(true)} data-testid="button-new-user"><UserPlus className="h-4 w-4 mr-1" /> Nuevo usuario</Button>
          }
        />
        <AdminPageHelp pageId="usuarios" manualSectionId="usuarios">
          Aquí gestionas <strong>quién puede entrar al panel</strong> y qué puede hacer. Cada usuario tiene un
          correo, una contraseña y un <strong>rol</strong> (Administrador, Editor, Marketing o Sistemas). Solo los
          administradores/dueños ven esta sección.
        </AdminPageHelp>

        <Card>
          <CardHeader><CardTitle className="text-base">Usuarios ({users.length})</CardTitle></CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : usersQuery.error ? (
              <p className="text-sm text-destructive py-4">{(usersQuery.error as Error).message}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Correo / Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const canEditOwner = u.role !== "super_admin" || isOwner;
                      return (
                        <TableRow key={u.id} data-testid={`user-${u.id}`}>
                          <TableCell>
                            <div className="font-medium">{u.email}</div>
                            <div className="text-xs text-muted-foreground">{u.username}</div>
                          </TableCell>
                          <TableCell>
                            {u.role === "super_admin" && !isOwner ? (
                              <Badge variant="secondary">Dueño</Badge>
                            ) : (
                              <Select value={u.role} onValueChange={(v) => changeRole(u, v)} disabled={!canEditOwner}>
                                <SelectTrigger className="w-[180px] h-8" data-testid={`role-${u.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {assignable.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                            {(() => {
                              const base = ROLE_BASE[u.role] || [];
                              const extra = (u.permissions || []).filter((p) => !base.includes(p));
                              return extra.length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-1" data-testid={`extra-perms-${u.id}`}>
                                  {extra.map((p) => (
                                    <Badge key={p} variant="outline" className="text-[10px] font-normal">
                                      + {GRANTABLE.find((g) => g.key === p)?.label || p}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={!!u.isActive} onCheckedChange={() => toggleActive(u)} disabled={!canEditOwner} data-testid={`active-${u.id}`} />
                              <span className="text-xs text-muted-foreground">{u.isActive ? "Activo" : "Inactivo"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("es-MX") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Permisos adicionales" onClick={() => openPerms(u)} disabled={!canEditOwner || u.role === "super_admin"} data-testid={`perms-${u.id}`}>
                                <SlidersHorizontal className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Cambiar contraseña" onClick={() => { setPwUser(u); setPw(""); }} disabled={!canEditOwner} data-testid={`pw-${u.id}`}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Eliminar" onClick={() => del(u)} disabled={!canEditOwner} data-testid={`del-${u.id}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de accesos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Accesos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Registro de inicios de sesión (exitosos y fallidos). Se conserva para auditoría. Nunca se guardan contraseñas.
            </p>
            {logQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : logQuery.error ? (
              <p className="text-sm text-destructive py-4">{(logQuery.error as Error).message}</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aún no hay accesos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Correo / usuario</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((ev) => (
                      <TableRow key={ev.id} data-testid={`login-event-${ev.id}`}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {ev.createdAt ? new Date(ev.createdAt).toLocaleString("es-MX") : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{ev.email}</TableCell>
                        <TableCell>
                          {ev.success ? (
                            <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Éxito</Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Fallido</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ev.ipAddress || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Crear usuario */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Se crea con correo y contraseña. La contraseña se guarda cifrada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Correo *</Label><Input type="email" value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} placeholder="persona@vonwobeser.com" data-testid="input-email" /></div>
            <div className="space-y-1"><Label>Usuario <span className="text-xs text-muted-foreground">(opcional — se genera del correo)</span></Label><Input value={nf.username} onChange={(e) => setNf({ ...nf, username: e.target.value })} placeholder="Se genera del correo si lo dejas vacío" data-testid="input-username" /></div>
            <div className="space-y-1"><Label>Contraseña temporal * <span className="text-xs text-muted-foreground">(mín. 8)</span></Label><Input type="text" value={nf.password} onChange={(e) => setNf({ ...nf, password: e.target.value })} placeholder="La comparte con la persona" data-testid="input-password" /></div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={nf.role} onValueChange={(v) => setNf({ ...nf, role: v })}>
                <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                <SelectContent>{assignable.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={create} disabled={busy} data-testid="button-create-user">
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permisos adicionales */}
      <Dialog open={!!permUser} onOpenChange={(o) => !o && setPermUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permisos adicionales</DialogTitle>
            <DialogDescription>
              {permUser?.email} — su rol <strong>{permUser ? ROLE_LABELS[permUser.role] : ""}</strong> ya incluye ciertos
              permisos. Aquí puedes darle acceso <strong>extra</strong> a otras áreas sin cambiarle el rol.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {GRANTABLE.map((p) => {
              const base = permUser ? (ROLE_BASE[permUser.role] || []).includes(p.key) : false;
              const checked = base || permExtra.includes(p.key);
              return (
                <label key={p.key} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer" data-testid={`perm-${p.key}`}>
                  <Checkbox
                    checked={checked}
                    disabled={base}
                    onCheckedChange={(v) => toggleExtra(p.key, v === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">
                      {p.label}
                      {base && <span className="ml-2 text-xs font-normal text-muted-foreground">(incluido por el rol)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.hint}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermUser(null)} disabled={busy}>Cancelar</Button>
            <Button onClick={savePerms} disabled={busy} data-testid="button-save-perms">
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <SlidersHorizontal className="h-4 w-4 mr-1" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset contraseña */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>{pwUser?.email} — se guardará cifrada. Comparte la nueva contraseña con la persona.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Nueva contraseña <span className="text-xs text-muted-foreground">(mín. 8)</span></Label>
            <Input type="text" value={pw} onChange={(e) => setPw(e.target.value)} data-testid="input-new-password" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)} disabled={busy}>Cancelar</Button>
            <Button onClick={resetPw} disabled={busy} data-testid="button-save-password">
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
