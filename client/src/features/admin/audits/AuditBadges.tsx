import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Info,
  Languages,
  Link2,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditCopy } from "./contracts";

export function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "high":
      return <AlertCircle className="h-4 w-4 text-warning" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4 text-warning/70" />;
    case "low":
      return <Info className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

export function SeverityBadge({ severity, t }: { severity: string; t: AuditCopy }) {
  const variants: Record<string, string> = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-warning text-warning-foreground",
    medium: "bg-warning/70 text-warning-foreground",
    low: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    critical: t.critical,
    high: t.high,
    medium: t.medium,
    low: t.low,
  };
  return <Badge className={variants[severity] || ""}>{labels[severity] || severity}</Badge>;
}

export function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "links":
      return <Link2 className="h-4 w-4" />;
    case "translations":
      return <Languages className="h-4 w-4" />;
    case "content":
      return <FileText className="h-4 w-4" />;
    case "seo":
      return <Search className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

export function StatusBadge({ status, t }: { status: string; t: AuditCopy }) {
  const variants: Record<string, string> = {
    open: "bg-destructive text-destructive-foreground",
    in_progress: "bg-warning/70 text-warning-foreground",
    resolved: "bg-success text-success-foreground",
    ignored: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    open: t.open,
    in_progress: t.inProgress,
    resolved: t.resolved,
    ignored: t.ignored,
  };
  return <Badge className={variants[status] || ""}>{labels[status] || status}</Badge>;
}
