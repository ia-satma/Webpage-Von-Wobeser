import { useParams, Link } from "wouter";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMING_SOON_SECTIONS } from "@/lib/adminNav";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminComingSoon() {
  const { key } = useParams<{ key: string }>();
  const section = COMING_SOON_SECTIONS.find((s) => s.key === key);

  if (!section) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader title="Sección no encontrada" icon={Construction} />
          <Link href="/admin/dashboard">
            <Button variant="outline" data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al panel
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={section.title}
          icon={section.icon}
          actions={<Badge className="bg-warning text-warning-foreground" data-testid="badge-coming-soon">En construcción</Badge>}
        />
        <Card className="rounded-2xl" data-testid="card-coming-soon">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Construction className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="text-foreground/90">{section.description}</p>
                <p className="text-muted-foreground">
                  Esta sección todavía no está conectada al sitio público — el cliente no ha
                  autorizado que este hueco se muestre en el sitio todavía. En cuanto se
                  confirme, se construye la pantalla de edición completa aquí.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
