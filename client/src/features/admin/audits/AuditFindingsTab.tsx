import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { FindingsTable } from "./FindingsTable";
import type { AdminAuditsController } from "./useAdminAudits";

export function AuditFindingsTab({ controller }: { controller: AdminAuditsController }) {
  const {
    severityFilter,
    setSeverityFilter,
    categoryFilter,
    setCategoryFilter,
    selectedAudit,
    latestAudit,
    filteredFindings,
    language,
    t,
  } = controller;
  return (
    <TabsContent value="findings" className="space-y-4">
      <div className="flex gap-4">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-severity-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t.filterBySeverity} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            <SelectItem value="critical">{t.critical}</SelectItem>
            <SelectItem value="high">{t.high}</SelectItem>
            <SelectItem value="medium">{t.medium}</SelectItem>
            <SelectItem value="low">{t.low}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t.filterByCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            <SelectItem value="links">{t.links}</SelectItem>
            <SelectItem value="translations">{t.translations}</SelectItem>
            <SelectItem value="content">{t.content}</SelectItem>
            <SelectItem value="seo">{t.seo}</SelectItem>
            <SelectItem value="linguistic">
              {language === "es" ? "Ortografía y consistencia" : "Language consistency"}
            </SelectItem>
          </SelectContent>
        </Select>
        {(selectedAudit || latestAudit) && (
          <Button variant="outline" asChild>
            <a href={`/api/audits/${(selectedAudit || latestAudit)!.id}/export.csv`}>
              <Download className="h-4 w-4 mr-2" />
              {language === "es" ? "Exportar informe" : "Export report"}
            </a>
          </Button>
        )}
      </div>
      <FindingsTable controller={controller} findings={filteredFindings} mode="findings" />
    </TabsContent>
  );
}
