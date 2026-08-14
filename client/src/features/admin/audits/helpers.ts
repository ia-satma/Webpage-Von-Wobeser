import type { WebsiteAuditFinding } from "@shared/schema";
import type { FindingFilters } from "./contracts";

export function filterAuditFindings(
  findings: WebsiteAuditFinding[],
  filters: FindingFilters,
): WebsiteAuditFinding[] {
  return findings.filter((finding) => {
    if (filters.severity !== "all" && finding.severity !== filters.severity) return false;
    if (filters.category !== "all" && finding.category !== filters.category) return false;
    return true;
  });
}

export function selectAuditFindings(
  selectedAuditId: string | null,
  selectedFindings: WebsiteAuditFinding[],
  latestFindings: WebsiteAuditFinding[],
): WebsiteAuditFinding[] {
  return selectedAuditId ? selectedFindings : latestFindings;
}
