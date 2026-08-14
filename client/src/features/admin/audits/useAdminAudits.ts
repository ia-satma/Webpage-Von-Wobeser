import { useEffect, useState } from "react";
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
import { auditTranslations } from "./translations";

const FINDINGS_PAGE_SIZE = 50;

export function useAdminAudits() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [auditType, setAuditType] = useState("full");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [findingsPage, setFindingsPage] = useState(1);
  const [openPage, setOpenPage] = useState(1);
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
      const response = await adminApiRequest("GET", "/api/audits/latest?includeFindings=false");
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
      const response = await adminApiRequest("GET", `/api/audits/${selectedAuditId}?includeFindings=false`);
      return readAdminJson<AuditDetailResponse>(
        response,
        "No se pudo cargar la auditoría seleccionada.",
      );
    },
    enabled: isAuthenticated && !!selectedAuditId,
  });
  const latestAudit: WebsiteAudit | null = latestAuditData?.audit || null;
  const selectedAudit: WebsiteAudit | null = selectedAuditData?.audit || null;
  const activeAuditId = selectedAuditId || latestAudit?.id || null;

  const { data: auditFindingsData } = useQuery({
    queryKey: ["/api/audits/findings", activeAuditId, findingsPage, severityFilter, categoryFilter],
    queryFn: async () => {
      if (!activeAuditId) return null;
      const params = new URLSearchParams({
        page: String(findingsPage),
        limit: String(FINDINGS_PAGE_SIZE),
      });
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const response = await adminApiRequest(
        "GET",
        `/api/audits/${activeAuditId}/findings?${params.toString()}`,
      );
      return readAdminJson<AuditFindingsResponse>(
        response,
        "No se pudieron cargar los hallazgos de la auditoría.",
      );
    },
    enabled: isAuthenticated && !!activeAuditId,
  });
  const { data: openFindingsData } = useQuery({
    queryKey: ["/api/audits/findings/open", openPage],
    queryFn: async () => {
      const response = await adminApiRequest(
        "GET",
        `/api/audits/findings/open?page=${openPage}&limit=${FINDINGS_PAGE_SIZE}`,
      );
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
      queryClient.invalidateQueries({ queryKey: ["/api/audits/findings"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/audits/findings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits/findings/open"] });
    },
  });

  const audits: WebsiteAudit[] = auditsData?.audits || [];
  const openFindings: WebsiteAuditFinding[] = openFindingsData?.findings || [];
  const filteredFindings: WebsiteAuditFinding[] = auditFindingsData?.findings || [];
  const findingsPagination = auditFindingsData?.pagination || {
    page: 1,
    limit: FINDINGS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };
  const openPagination = openFindingsData?.pagination || {
    page: 1,
    limit: FINDINGS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  useEffect(() => {
    if (findingsPage > findingsPagination.totalPages) {
      setFindingsPage(findingsPagination.totalPages);
    }
  }, [findingsPage, findingsPagination.totalPages]);
  useEffect(() => {
    if (openPage > openPagination.totalPages) {
      setOpenPage(openPagination.totalPages);
    }
  }, [openPage, openPagination.totalPages]);

  const selectAudit = (auditId: string | null) => {
    setSelectedAuditId(auditId);
    setFindingsPage(1);
  };
  const selectSeverity = (severity: string) => {
    setSeverityFilter(severity);
    setFindingsPage(1);
  };
  const selectCategory = (category: string) => {
    setCategoryFilter(category);
    setFindingsPage(1);
  };

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
    setSelectedAuditId: selectAudit,
    auditType,
    setAuditType,
    severityFilter,
    setSeverityFilter: selectSeverity,
    categoryFilter,
    setCategoryFilter: selectCategory,
    findingsPage,
    setFindingsPage,
    findingsPagination,
    openPage,
    setOpenPage,
    openPagination,
    runAuditMutation,
    resolveFindingMutation,
    ignoreFindingMutation,
  };
}

export type AdminAuditsController = ReturnType<typeof useAdminAudits>;
