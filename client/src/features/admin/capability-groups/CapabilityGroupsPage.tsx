import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { CapabilityGroupDialog } from "./CapabilityGroupDialog";
import { CapabilityGroupsOverview } from "./CapabilityGroupsOverview";
import type { CapabilityCopy, CapabilityGroupConfig } from "./contracts";
import { useCapabilityGroups } from "./useCapabilityGroups";

interface CapabilityGroupsPageProps {
  config: CapabilityGroupConfig;
  t: CapabilityCopy;
  language: string;
}

export function CapabilityGroupsPage({ config, t, language }: CapabilityGroupsPageProps) {
  const controller = useCapabilityGroups(config, t, language);
  if (controller.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg" data-testid="text-loading">{t.loading}</div>
      </div>
    );
  }
  if (!controller.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={t.title}
          icon={config.icon}
          actions={<CapabilityGroupDialog controller={controller} />}
        />
        <AdminPageHelp
          pageId={config.helpPageId}
          manualSectionId={config.helpManualSectionId}
        >
          {config.helpText}
        </AdminPageHelp>
        <CapabilityGroupsOverview controller={controller} />
      </main>
    </div>
  );
}
