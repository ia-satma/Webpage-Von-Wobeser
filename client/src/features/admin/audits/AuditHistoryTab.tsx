import { CheckCircle2, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminAuditsController } from "./useAdminAudits";

export function AuditHistoryTab({ controller }: { controller: AdminAuditsController }) {
  const { audits, language, setSelectedAuditId, t } = controller;
  return (
    <TabsContent value="history">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.auditType}</TableHead>
              <TableHead>{t.startedAt}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.issuesFound}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t.noAudits}
                </TableCell>
              </TableRow>
            ) : (
              audits.map((audit) => (
                <TableRow key={audit.id} data-testid={`row-audit-${audit.id}`}>
                  <TableCell className="capitalize">{audit.runType.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    {new Date(audit.startedAt!).toLocaleString(language === "es" ? "es-MX" : "en-US")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={audit.status === "completed" ? "default" : "secondary"}>
                      {audit.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {audit.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {audit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{audit.issuesFound}</span>
                      {(audit.criticalCount || 0) > 0 && (
                        <Badge variant="destructive">{audit.criticalCount} {t.critical}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAuditId(audit.id)}
                      data-testid={`button-view-${audit.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </TabsContent>
  );
}
