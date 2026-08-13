import { Languages, RefreshCw } from "lucide-react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveLanguagesTab } from "./ActiveLanguagesTab";
import { ArticlesTab } from "./ArticlesTab";
import { OverviewTab } from "./OverviewTab";
import { RecentJobsTab } from "./RecentJobsTab";
import { useTranslationsController } from "./useTranslationsController";

export default function AdminTranslationsPage() {
  const controller = useTranslationsController();
  const { copy } = controller;

  if (controller.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-auth">
        <div className="text-lg">{copy.loading}</div>
      </div>
    );
  }
  if (!controller.isAuthenticated) return null;

  if (controller.loadError) {
    const message = controller.loadError instanceof Error
      ? controller.loadError.message
      : "No se pudo cargar el estado de traducciones.";
    return (
      <div className="min-h-screen bg-background" data-testid="admin-translations-page">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader title={copy.title} description={copy.subtitle} icon={Languages} />
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-8">
              <p className="text-sm text-destructive">{message}</p>
              <Button variant="outline" size="sm" onClick={controller.retry}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-translations-page">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={copy.title}
          description={copy.subtitle}
          icon={Languages}
          actions={(
            <Button
              variant="outline"
              size="sm"
              onClick={controller.refresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {copy.refresh}
            </Button>
          )}
        />
        <AdminPageHelp pageId="traducciones" manualSectionId="traducciones">
          Traduce el contenido a otros idiomas
          {controller.canManageLanguages
            ? " y elige, en la pestaña Idiomas activos, a cuáles traducir."
            : "."}
        </AdminPageHelp>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList data-testid="tabs-navigation">
            <TabsTrigger value="overview" data-testid="tab-overview">{copy.overview}</TabsTrigger>
            <TabsTrigger value="articles" data-testid="tab-articles">{copy.articles}</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">{copy.recentJobs}</TabsTrigger>
            {controller.canManageLanguages && (
              <TabsTrigger value="languages" data-testid="tab-languages">
                Idiomas activos
              </TabsTrigger>
            )}
          </TabsList>

          {controller.canManageLanguages && <ActiveLanguagesTab controller={controller} />}
          <OverviewTab controller={controller} />
          <ArticlesTab controller={controller} />
          <RecentJobsTab copy={copy} />
        </Tabs>
      </main>
    </div>
  );
}
