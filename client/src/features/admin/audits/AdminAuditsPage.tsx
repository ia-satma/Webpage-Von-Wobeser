import { Loader2, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AuditHeaderActions } from "./AuditHeaderActions";
import { AuditSummaryCards } from "./AuditSummaryCards";
import { AuditTabs } from "./AuditTabs";
import { LatestAuditCard } from "./LatestAuditCard";
import { useAdminAudits } from "./useAdminAudits";

export default function AdminAuditsPage() {
  const controller = useAdminAudits();
  if (controller.authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!controller.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background" data-testid="admin-audits-page">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <AdminPageHeader
          title={controller.t.title}
          description={controller.t.subtitle}
          icon={ShieldCheck}
          actions={<AuditHeaderActions controller={controller} />}
        />
        <AdminPageHelp pageId="audits">
          Este es el registro de auditoría: guarda quién hizo qué cambio y cuándo, en todo el sitio. Úsalo si necesitas rastrear un cambio inesperado o confirmar que una acción se realizó correctamente.
        </AdminPageHelp>
        <AuditSummaryCards controller={controller} />
        <LatestAuditCard controller={controller} />
        <AuditTabs controller={controller} />
      </main>
    </div>
  );
}
