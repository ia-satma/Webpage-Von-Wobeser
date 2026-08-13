import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useParams } from "wouter";
import type { Change } from "@/components/admin/ConfirmChangesDialog";
import { computeChanges } from "@/components/admin/ConfirmChangesDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import type { IndustryGroup, PracticeGroup, TeamMember } from "@shared/schema";
import {
  createTeamMemberDefaults,
  TEAM_LABELS,
  teamMemberFormSchema,
  type TeamFormCopy,
  type TeamMemberFormData,
} from "./contracts";
import {
  generateTeamMemberSlug,
  teamFormToPayload,
  teamMemberToFormData,
} from "./helpers";
import { teamFormTranslations } from "./translations";

export function useTeamMemberForm() {
  const { language } = useLanguage();
  const { token, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [confirm, setConfirm] = useState<{ data: any; changes: Change[] } | null>(null);
  const isEditMode = !!params.id;
  const t = (teamFormTranslations[language as keyof typeof teamFormTranslations] ||
    teamFormTranslations.en) as TeamFormCopy;

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: createTeamMemberDefaults(),
  });
  const watchedValues = form.watch();

  const {
    data: member,
    isLoading: memberLoading,
    isError: memberError,
  } = useQuery<TeamMember>({
    queryKey: ["/api/admin/team", params.id],
    queryFn: async () => {
      const response = await adminApiRequest("GET", `/api/admin/team/${params.id}`);
      if (!response.ok) throw new Error("Failed to load team member");
      return response.json();
    },
    enabled: isEditMode && isAuthenticated && !!token,
    retry: 1,
  });

  const { data: practiceGroups = [] } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });
  const { data: industryGroups = [] } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  useEffect(() => {
    if (memberError) {
      toast({
        title: t.error,
        description: "Could not load team member",
        variant: "destructive",
      });
      navigate("/admin/team");
    }
  }, [memberError, navigate, toast, t.error]);

  useEffect(() => {
    if (member) form.reset(teamMemberToFormData(member));
  }, [member, form]);

  const handleApiError = async (response: Response) => {
    const errorData = await response.json();
    if (errorData.details && Array.isArray(errorData.details)) {
      errorData.details.forEach((error: { path?: string[]; message?: string }) => {
        if (error.path && error.path.length > 0) {
          const fieldName = error.path[0] as keyof TeamMemberFormData;
          form.setError(fieldName, {
            type: "server",
            message: error.message || "Invalid value",
          });
        }
      });
      throw new Error(t.error);
    }
    throw new Error(errorData.error || "Failed");
  };

  const createMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await adminApiRequest("POST", "/api/admin/team", data);
      if (!response.ok) await handleApiError(response);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.createSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      navigate("/admin/team");
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.error, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await adminApiRequest("PUT", `/api/admin/team/${params.id}`, data);
      if (!response.ok) await handleApiError(response);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.updateSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      navigate("/admin/team");
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.error, variant: "destructive" });
    },
  });

  const doSave = (cleanData: any) => {
    if (isEditMode) updateMutation.mutate(cleanData as TeamMemberFormData);
    else createMutation.mutate(cleanData as TeamMemberFormData);
  };

  const submit = (data: TeamMemberFormData) => {
    const cleanData = teamFormToPayload(data);
    const changes = computeChanges(
      isEditMode ? (member as any) || {} : {},
      cleanData,
      TEAM_LABELS,
    );
    setConfirm({ data: cleanData, changes });
  };

  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) form.setValue("slug", generateTeamMemberSlug(name));
  };

  return {
    language,
    t,
    authLoading,
    isAuthenticated,
    isEditMode,
    member,
    memberLoading,
    form,
    watchedValues,
    activeTab,
    setActiveTab,
    practiceGroups,
    industryGroups,
    submit,
    generateSlug,
    isPending: createMutation.isPending || updateMutation.isPending,
    createMutation,
    updateMutation,
    confirm,
    setConfirm,
    doSave,
    memberId: params.id,
  };
}

export type TeamMemberFormController = ReturnType<typeof useTeamMemberForm>;
