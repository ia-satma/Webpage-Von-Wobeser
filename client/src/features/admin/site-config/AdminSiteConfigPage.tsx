import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmChangesDialog } from "@/components/admin/ConfirmChangesDialog";
import { AdminEditStatus, useAdminEditRegistration, useAdminEditingState } from "@/components/admin/AdminEditingState";
import { configMapToDraft } from "./helpers";
import { SiteConfigSections } from "./SiteConfigSections";
import { useSiteConfig } from "./useSiteConfig";

export default function AdminSiteConfigPage() {
  const [, setLocation] = useLocation();
  const { requestNavigation } = useAdminEditingState();
  const controller = useSiteConfig();
  const { section, page, data, draft, saving } = controller;
  const isDirty = !!data && JSON.stringify(draft) !== JSON.stringify(configMapToDraft(data));
  useAdminEditRegistration({ id: `site-config:${section}`, isDirty, isSaving: !!saving });
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {section !== "portada" && (
          <Link
            href="/admin/site-config"
            onClick={(event) => {
              event.preventDefault();
              requestNavigation(() => setLocation("/admin/site-config"));
            }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-site-config"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Configuración
          </Link>
        )}
        <AdminPageHeader
          title={page.title}
          description={page.description}
          icon={page.icon}
          actions={<AdminEditStatus isDirty={isDirty} isSaving={!!saving} />}
        />
        <AdminPageHelp
          pageId={section === "seo" ? "seo" : "configuracion"}
          manualSectionId={section === "seo" ? "seo" : "configuracion"}
        >
          {section === "seo"
            ? "A diferencia del resto del panel, estos dos campos NO se reflejan al instante: necesitas reiniciar el servidor después de guardarlos para que aparezcan en el sitio."
            : "Los cambios se reflejan en el sitio al instante."}
        </AdminPageHelp>
        {controller.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : (
          <SiteConfigSections controller={controller} />
        )}
      </main>
      <ConfirmChangesDialog
        open={!!controller.confirm}
        onOpenChange={(open) => !open && controller.setConfirm(null)}
        changes={controller.confirm?.changes || []}
        loading={controller.saving === controller.confirm?.key}
        onConfirm={async () => {
          if (controller.confirm) await controller.save(controller.confirm.key);
          controller.setConfirm(null);
        }}
      />
    </div>
  );
}
