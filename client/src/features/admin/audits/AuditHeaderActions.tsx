import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminAuditsController } from "./useAdminAudits";

export function AuditHeaderActions({ controller }: { controller: AdminAuditsController }) {
  const { auditType, setAuditType, runAuditMutation, t, language } = controller;
  return (
    <>
      <Select value={auditType} onValueChange={setAuditType}>
        <SelectTrigger className="w-[180px]" data-testid="select-audit-type">
          <SelectValue placeholder={t.auditType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="full">{t.fullAudit}</SelectItem>
          <SelectItem value="links_only">{t.linksOnly}</SelectItem>
          <SelectItem value="translations_only">{t.translationsOnly}</SelectItem>
          <SelectItem value="seo_only">{t.seoOnly}</SelectItem>
          <SelectItem value="content_only">{t.contentOnly}</SelectItem>
          <SelectItem value="linguistic">
            {language === "es" ? "Ortografía, nombres y consistencia" : "Spelling, names and consistency"}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={() => runAuditMutation.mutate(auditType)}
        disabled={runAuditMutation.isPending}
        data-testid="button-run-audit"
      >
        {runAuditMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t.runningAudit}
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            {t.runAudit}
          </>
        )}
      </Button>
    </>
  );
}
