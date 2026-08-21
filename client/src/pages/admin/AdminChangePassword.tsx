import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { KeyRound, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { adminApiRequest, clearToken, readAdminJson, type AdminSessionPolicy, useAdminAuth } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type SessionSummary = {
  id: string;
  isCurrent: boolean;
  createdAt: string | null;
  lastSeenAt: string | null;
  expiresAt: string;
  device: string;
};

type SecurityStatus = {
  sessionPolicy: AdminSessionPolicy;
  mfa: { eligible: boolean; enforced: boolean; encryptionReady: boolean };
};

function formatDate(value: string | null): string {
  if (!value) return "Sin información";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin información"
    : date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminChangePassword() {
  const { isAuthenticated, isLoading, sessionPolicy } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isLoading, setLocation]);

  const loadSecurity = useCallback(async () => {
    if (!isAuthenticated) return;
    setSessionsLoading(true);
    try {
      const [sessionsResponse, securityResponse] = await Promise.all([
        adminApiRequest("GET", "/api/admin/sessions"),
        adminApiRequest("GET", "/api/admin/security/status"),
      ]);
      const sessionsPayload = await readAdminJson<{ sessions: SessionSummary[] }>(sessionsResponse);
      const securityPayload = await readAdminJson<SecurityStatus>(securityResponse);
      setSessions(sessionsPayload.sessions);
      setSecurityStatus(securityPayload);
    } catch (error) {
      toast({
        title: "No se pudo cargar la seguridad de la cuenta",
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSessionsLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  const save = async () => {
    if (newPassword.length < 15 || newPassword.length > 128) {
      toast({ title: "Contraseña no válida", description: "Usa entre 15 y 128 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmation) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const response = await adminApiRequest("POST", "/api/admin/password/change", { currentPassword, newPassword });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "No se pudo cambiar", description: body.error || "Revisa los datos.", variant: "destructive" });
        return;
      }
      clearToken();
      toast({ title: "Contraseña actualizada", description: "Vuelve a iniciar sesión para continuar." });
      setLocation("/admin/login");
    } catch {
      toast({
        title: "No se pudo cambiar",
        description: "No fue posible conectar con el servidor. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const response = await adminApiRequest("DELETE", `/api/admin/sessions/${sessionId}`);
      await readAdminJson(response, "No se pudo cerrar esa sesión.");
      toast({ title: "Sesión cerrada", description: "El dispositivo ya no podrá acceder al panel." });
      await loadSecurity();
    } catch (error) {
      toast({ title: "No se pudo cerrar la sesión", description: error instanceof Error ? error.message : "Inténtalo nuevamente.", variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  const revokeOtherSessions = async () => {
    setRevoking("others");
    try {
      const response = await adminApiRequest("POST", "/api/admin/sessions/revoke-others");
      const payload = await readAdminJson<{ revoked: number }>(response, "No se pudieron cerrar las demás sesiones.");
      toast({ title: "Sesiones actualizadas", description: payload.revoked ? `Se cerraron ${payload.revoked} sesión(es).` : "No había otras sesiones activas." });
      await loadSecurity();
    } catch (error) {
      toast({ title: "No se pudieron cerrar las demás sesiones", description: error instanceof Error ? error.message : "Inténtalo nuevamente.", variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  const policy = securityStatus?.sessionPolicy || sessionPolicy;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8" aria-labelledby="security-page-title">
      <section className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Cuenta</p>
        <h1 id="security-page-title" className="font-heading text-3xl text-foreground">Mi seguridad</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Administra tu contraseña, sesiones activas y las medidas de acceso de tu cuenta.</p>
      </section>

      <Card className="border-t-2 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña cuando tú lo decidas. Esta acción cerrará las demás sesiones abiertas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Contraseña actual</Label>
            <Input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nueva contraseña</Label>
            <Input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <p className="text-xs text-muted-foreground">Entre 15 y 128 caracteres.</p>
          </div>
          <div className="space-y-1">
            <Label>Confirmar nueva contraseña</Label>
            <Input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </div>
          <Button className="w-full" disabled={busy || isLoading} onClick={save}>
            {busy ? "Guardando…" : "Guardar y volver a iniciar sesión"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><MonitorSmartphone className="h-5 w-5 text-primary" />Sesiones activas</CardTitle>
            <CardDescription className="mt-1">
              {policy
                ? `La sesión se cierra tras ${policy.idleMinutes} minutos sin actividad y nunca dura más de ${policy.absoluteHours} horas.`
                : "Revisamos la política de sesión de tu cuenta."}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={revokeOtherSessions} disabled={sessionsLoading || sessions.filter((session) => !session.isCurrent).length === 0 || revoking !== null}>
            {revoking === "others" ? "Cerrando…" : "Cerrar las demás"}
          </Button>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando sesiones…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay sesiones activas disponibles.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border" aria-label="Sesiones activas de esta cuenta">
              {sessions.map((session) => (
                <li key={session.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{session.device}</p>
                      {session.isCurrent && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Esta sesión</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Última actividad: {formatDate(session.lastSeenAt)} · Inicio: {formatDate(session.createdAt)}</p>
                  </div>
                  {!session.isCurrent && (
                    <Button variant="outline" size="sm" onClick={() => revokeSession(session.id)} disabled={revoking !== null}>
                      {revoking === session.id ? "Cerrando…" : "Cerrar sesión"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {securityStatus?.mfa.eligible && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Verificación en dos pasos</CardTitle>
            <CardDescription>
              {securityStatus.mfa.enforced
                ? "La verificación en dos pasos está activa para esta cuenta privilegiada."
                : securityStatus.mfa.encryptionReady
                  ? "La infraestructura TOTP está lista. Sistemas puede activar la obligación para Administradores y Dueños desde Replit Secrets."
                  : "La verificación en dos pasos está preparada, pero se activará después de configurar la clave de cifrado en Replit Secrets."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
