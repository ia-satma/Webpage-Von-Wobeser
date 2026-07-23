import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { KeyRound } from "lucide-react";
import { adminApiRequest, clearToken, useAdminAuth } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminChangePassword() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isLoading, setLocation]);

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
    const response = await adminApiRequest("POST", "/api/admin/password/change", { currentPassword, newPassword });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      toast({ title: "No se pudo cambiar", description: body.error || "Revisa los datos.", variant: "destructive" });
      return;
    }
    clearToken();
    toast({ title: "Contraseña actualizada", description: "Vuelve a iniciar sesión para continuar." });
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-lg border-t-2 border-t-primary shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Esta cuenta tiene una contraseña temporal o heredada. Crea una frase de al menos 15 caracteres antes de continuar.
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
            <p className="text-xs text-muted-foreground">15–128 caracteres. Se permiten frases largas y espacios.</p>
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
    </div>
  );
}
