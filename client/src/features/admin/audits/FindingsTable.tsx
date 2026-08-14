import { Ban, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { WebsiteAuditFinding } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryIcon, SeverityBadge, SeverityIcon, StatusBadge } from "./AuditBadges";
import type { AdminAuditsController } from "./useAdminAudits";

interface FindingsTableProps {
  controller: AdminAuditsController;
  findings: WebsiteAuditFinding[];
  mode: "findings" | "open";
}

export function FindingsTable({ controller, findings, mode }: FindingsTableProps) {
  const {
    language,
    t,
    latestAudit,
    findingsPage,
    setFindingsPage,
    findingsPagination,
    openPage,
    setOpenPage,
    openPagination,
    resolveFindingMutation,
    ignoreFindingMutation,
  } = controller;
  const detailed = mode === "findings";
  const currentPage = detailed ? findingsPage : openPage;
  const setCurrentPage = detailed ? setFindingsPage : setOpenPage;
  const pageInfo = detailed ? findingsPagination : openPagination;

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t.severity}</TableHead>
            <TableHead className="w-[120px]">{t.category}</TableHead>
            <TableHead>{t.details}</TableHead>
            {detailed && <TableHead className="w-[100px]">{t.status}</TableHead>}
            <TableHead className={detailed ? "w-[100px]" : "w-[100px]"} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={detailed ? 5 : 4}
                className="text-center py-8 text-muted-foreground"
              >
                {detailed ? (
                  latestAudit ? t.noAudits : t.runFirstAudit
                ) : (
                  <>
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                    {language === "es" ? "No hay problemas abiertos" : "No open issues"}
                  </>
                )}
              </TableCell>
            </TableRow>
          ) : (
            findings.map((finding) => (
              <TableRow
                key={finding.id}
                data-testid={detailed ? `row-finding-${finding.id}` : `row-open-${finding.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <SeverityIcon severity={finding.severity} />
                    <SeverityBadge severity={finding.severity} t={t} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={finding.category} />
                    <span className="capitalize">{finding.category}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{finding.issueType.replace(/_/g, " ")}</div>
                    {finding.recommendation && (
                      <div className="text-sm text-muted-foreground">{finding.recommendation}</div>
                    )}
                    {detailed && finding.entityType && finding.entityId && (
                      <div className="text-xs text-muted-foreground">
                        {finding.entityType}: {finding.entityId.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                </TableCell>
                {detailed && (
                  <TableCell>
                    <StatusBadge status={finding.status} t={t} />
                  </TableCell>
                )}
                <TableCell className={detailed ? "w-[190px]" : undefined}>
                  {detailed ? (
                    finding.status === "open" && (
                      <div className="flex items-center justify-end gap-1">
                        {finding.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title={language === "es" ? "Ir a editar o revisar" : "Open to review"}
                          >
                            <a href={finding.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => ignoreFindingMutation.mutate(finding.id)}
                          disabled={ignoreFindingMutation.isPending}
                          title={language === "es" ? "Ignorar" : "Ignore"}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveFindingMutation.mutate(finding.id)}
                          disabled={resolveFindingMutation.isPending}
                          data-testid={`button-resolve-${finding.id}`}
                          title={t.markResolved}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveFindingMutation.mutate(finding.id)}
                      disabled={resolveFindingMutation.isPending}
                      data-testid={`button-resolve-open-${finding.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pageInfo.total > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            {language === "es" ? "Página" : "Page"} {pageInfo.page} / {pageInfo.totalPages}
            {` · ${pageInfo.total} ${language === "es" ? "hallazgos" : "findings"}`}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              aria-label={language === "es" ? "Página anterior" : "Previous page"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pageInfo.totalPages}
              onClick={() => setCurrentPage(Math.min(pageInfo.totalPages, currentPage + 1))}
              aria-label={language === "es" ? "Página siguiente" : "Next page"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
