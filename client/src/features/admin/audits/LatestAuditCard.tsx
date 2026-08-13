import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAuditsController } from "./useAdminAudits";

export function LatestAuditCard({ controller }: { controller: AdminAuditsController }) {
  const { latestAudit, language, t } = controller;
  if (!latestAudit) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t.lastAudit}
        </CardTitle>
        <CardDescription>
          {new Date(latestAudit.startedAt!).toLocaleString(language === "es" ? "es-MX" : "en-US")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{latestAudit.issuesFound}</div>
            <div className="text-sm text-muted-foreground">{t.issuesFound}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{latestAudit.pagesScanned}</div>
            <div className="text-sm text-muted-foreground">{t.pagesScanned}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{latestAudit.linksChecked}</div>
            <div className="text-sm text-muted-foreground">{t.linksChecked}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{latestAudit.translationsChecked}</div>
            <div className="text-sm text-muted-foreground">{t.translationsChecked}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
