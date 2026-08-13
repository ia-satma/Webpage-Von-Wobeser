import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  CapabilityCopy,
  CapabilityGroup,
  CapabilityGroupConfig,
  CapabilityGroupFormData,
} from "./contracts";
import {
  capabilityGroupToFormData,
  createCapabilityGroupDefaults,
  generateCapabilitySlug,
  sortCapabilityGroups,
} from "./helpers";

export function useCapabilityGroups(
  config: CapabilityGroupConfig,
  t: CapabilityCopy,
  language: string,
) {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CapabilityGroup | null>(null);

  useEffect(() => {
    if (!authLoading) requireAuth();
  }, [authLoading, requireAuth]);

  const form = useForm<CapabilityGroupFormData>({
    resolver: zodResolver(config.schema),
    defaultValues: createCapabilityGroupDefaults(),
  });

  const groupsQuery = useQuery<CapabilityGroup[]>({
    queryKey: [config.adminEndpoint],
    queryFn: async () => {
      const response = await adminApiRequest("GET", config.adminEndpoint);
      if (!response.ok) throw new Error(t.fetchError);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CapabilityGroupFormData) => {
      const url = editingGroup
        ? `${config.adminEndpoint}/${editingGroup.id}`
        : config.adminEndpoint;
      const method = editingGroup ? "PUT" : "POST";
      const response = await adminApiRequest(method, url, data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || t.technicalSaveError);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.saveSuccess });
      queryClient.invalidateQueries({ queryKey: [config.adminEndpoint] });
      queryClient.invalidateQueries({ queryKey: [config.publicQueryKey] });
      setIsDialogOpen(false);
      setEditingGroup(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t.saveError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await adminApiRequest("DELETE", `${config.adminEndpoint}/${groupId}`);
      if (!response.ok) throw new Error(t.technicalDeleteError);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: [config.adminEndpoint] });
      queryClient.invalidateQueries({ queryKey: [config.publicQueryKey] });
    },
    onError: () => toast({ title: t.deleteError, variant: "destructive" }),
  });

  const editGroup = (group: CapabilityGroup) => {
    setEditingGroup(group);
    form.reset(capabilityGroupToFormData(group));
    setIsDialogOpen(true);
  };
  const deleteGroup = (groupId: string) => {
    if (window.confirm(t.confirmDelete)) deleteMutation.mutate(groupId);
  };
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingGroup(null);
      form.reset();
    }
  };
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingGroup && !form.getValues("slug")) {
      form.setValue("slug", generateCapabilitySlug(value));
    }
  };

  const groups = groupsQuery.data || [];
  return {
    config,
    t,
    language,
    authLoading,
    isAuthenticated,
    form,
    isDialogOpen,
    editingGroup,
    groups,
    sortedGroups: sortCapabilityGroups(groups),
    groupsQuery,
    saveMutation,
    deleteMutation,
    handleOpenChange,
    handleNameChange,
    editGroup,
    deleteGroup,
    submit: (data: CapabilityGroupFormData) => saveMutation.mutate(data),
  };
}

export type CapabilityGroupsController = ReturnType<typeof useCapabilityGroups>;
