import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditFindingsTab } from "./AuditFindingsTab";
import { AuditHistoryTab } from "./AuditHistoryTab";
import { FindingsTable } from "./FindingsTable";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminAuditsController } from "./useAdminAudits";

export function AuditTabs({ controller }: { controller: AdminAuditsController }) {
  const { audits, filteredFindings, openFindings, t } = controller;
  return (
    <Tabs defaultValue="findings" className="w-full">
      <TabsList>
        <TabsTrigger value="findings" data-testid="tab-findings">
          {t.findings} ({filteredFindings.length})
        </TabsTrigger>
        <TabsTrigger value="history" data-testid="tab-history">
          {t.auditHistory} ({audits.length})
        </TabsTrigger>
        <TabsTrigger value="open" data-testid="tab-open">
          {t.openIssues} ({openFindings.length})
        </TabsTrigger>
      </TabsList>
      <AuditFindingsTab controller={controller} />
      <AuditHistoryTab controller={controller} />
      <TabsContent value="open">
        <FindingsTable controller={controller} findings={openFindings} mode="open" />
      </TabsContent>
    </Tabs>
  );
}
