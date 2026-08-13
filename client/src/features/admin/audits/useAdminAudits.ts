import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebsiteAudit, WebsiteAuditFinding } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, readAdminJson, useAdminAuth } from "@/lib/adminAuth";
import type {
  AuditCopy,
  AuditDetailResponse,
  AuditFindingsResponse,
  AuditListResponse,
  AuditRunResponse,
} from "./contracts";
import { filterAuditFindings, selectAuditFindings } from "./helpers";
import { auditTranslations } from "./translations";

export function useAdminAudits() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [auditType, setAuditType] = useState("full");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const t = (auditTranslations[language as keyof typeof auditTranslations] ||
    auditTranslations.en) as AuditCopy;

  const { data: auditsData } = useQuery({
    queryKey: ["/api/audits"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/audits?limit=20");
      return readAdminJson<AuditListResponse>(
        response,
        "No se pudo cargar el historial de auditorías.",
      );
    },
    enabled: isAuthenticated,
  });
  const { data: latestAuditData } = useQuery({
    queryKey: ["/api/audits/latest"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/audits/latest");
      return readAdminJson<AuditDetailResponse>(
        response,
        "No se pudo cargar la última auditoría.",
      );
    },
    enabled: isAuthenticated,
  });
  const { data: selectedAuditData } = useQuery({
    queryKey: ["/api/audits", selectedAuditId],
    queryFn: async () => {
      if (!selectedAuditId) return null;
      const response = await adminApiRequest("GET", `/api/audits/${selectedAuditId}`);
      return readAdminJson<AuditDetailResponse>(
        response,
        "No se pudo cargar la auditoría seleccionada.",
      );
    },
    enabled: isAuthenticated && !!selectedAuditId,
  });
  const { data: openFindingsData } = useQuery({
    queryKey: ["/api/audits/findings/open"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/audits/findings/open");
      return readAdminJson<AuditFindingsResponse>(
        response,
        "No se pudieron cargar los hallazgos.",
      );
    },
    enabled: isAuthenticated,
  });

  const runAuditMutation = useMutation({
    mutationFn: async (runType: string) => {
      const response = await adminApiRequest("POST", "/api/audits/run", { runType });
      return readAdminJson<AuditRunResponse>(response, t.auditStartError);
    },
    onSuccess: (data) => {
      toast({
        title: t.auditStarted,
        description: data.message || t.auditStartedDesc,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/audits/latest"] });
        queryClient.invalidateQueries({ queryKey: ["/api/audits/findings/open"] });
      }, 3000);
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.auditStartError,
        variant: "destructive",
      });
    },
  });

  const resolveFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const response = await adminApiRequest("PATCH", `/api/audits/findings/${findingId}`, {
        status: "resolved",
        resolvedBy: "manual",
      });
      return readAdminJson<{ success?: boolean }>(response, t.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits", selectedAuditId] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits/findings/open"] });
    },
  });
  const ignoreFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const response = await adminApiRequest("PATCH", `/api/audits/findings/${findingId}`, {
        status: "ignored",
        resolvedBy: "manual",
      });
      return readAdminJson<{ success?: boolean }>(response, t.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits", selectedAuditId] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits/findings/open"] });
    },
  });

  const audits: WebsiteAudit[] = auditsData?.audits || [];
  const latestAudit: WebsiteAudit | null = latestAuditData?.audit || null;
  const latestFindings: WebsiteAuditFinding[] = latestAuditData?.findings || [];
  const selectedAudit: WebsiteAudit | null = selectedAuditData?.audit || null;
  const selectedFindings: WebsiteAuditFinding[] = selectedAuditData?.findings || [];
  const openFindings: WebsiteAuditFinding[] = openFindingsData?.findings || [];
  const filteredFindings = filterAuditFindings(
    selectAuditFindings(selectedAuditId, selectedFindings, latestFindings),
    { severity: severityFilter, category: categoryFilter },
  );

  return {
    language,
    t,
    authLoading,
    isAuthenticated,
    audits,
    latestAudit,
    selectedAudit,
    openFindings,
    filteredFindings,
    selectedAuditId,
    setSelectedAuditId,
    auditType,
    setAuditType,
    severityFilter,
    setSeverityFilter,
    categoryFilter,
    setCategoryFilter,
    runAuditMutation,
    resolveFindingMutation,
    ignoreFindingMutation,
  };
}

export type AdminAuditsController = ReturnType<typeof useAdminAudits>;
