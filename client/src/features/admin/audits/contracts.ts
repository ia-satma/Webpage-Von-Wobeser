import type { WebsiteAudit, WebsiteAuditFinding } from "@shared/schema";
import { auditTranslations } from "./translations";

export type AuditListResponse = { audits: WebsiteAudit[] };
export type AuditDetailResponse = {
  audit: WebsiteAudit | null;
  findings: WebsiteAuditFinding[];
};
export type AuditPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type AuditFindingsResponse = {
  findings: WebsiteAuditFinding[];
  pagination: AuditPagination;
};
export type AuditRunResponse = { message?: string };
export type AuditCopy = Record<keyof typeof auditTranslations.en, string>;

export const AUDIT_RUN_TYPES = [
  "full",
  "links_only",
  "translations_only",
  "seo_only",
  "content_only",
  "linguistic",
] as const;

export interface FindingFilters {
  severity: string;
  category: string;
}
