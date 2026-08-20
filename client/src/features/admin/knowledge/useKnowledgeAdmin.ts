import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth, adminApiRequest, readAdminJson } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { KNOWLEDGE_CATEGORIES } from "./catalogs";
import {
  bulkUploadSchema,
  knowledgeFormSchema,
  type BulkUploadData,
  type KnowledgeDocument,
  type KnowledgeFormData,
} from "./contracts";
import { buildBulkKnowledgeItems, filterKnowledgeDocuments } from "./helpers";
import { translations } from "./translations";

export function useKnowledgeAdmin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, token } = useAdminAuth();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const form = useForm<KnowledgeFormData>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: {
      category: "",
      title: "",
      content: "",
      agentType: "",
      language: "",
      confidence: 80,
      dataClassification: "internal",
      aiUseConfirmed: false,
    },
  });

  const bulkForm = useForm<BulkUploadData>({
    resolver: zodResolver(bulkUploadSchema),
    defaultValues: {
      category: "legal_glossary",
      agentType: "polyglot_translator",
      data: "",
      dataClassification: "internal",
      aiUseConfirmed: false,
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: documents, isLoading, refetch } = useQuery<KnowledgeDocument[]>({
    queryKey: ["/api/admin/knowledge"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/knowledge");
      return readAdminJson<KnowledgeDocument[]>(response, t.createFailed);
    },
    enabled: isAuthenticated && !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: KnowledgeFormData) => {
      const response = await adminApiRequest("POST", "/api/admin/knowledge", {
        ...formData,
        metadata: {
          language: formData.language,
          confidence: formData.confidence,
        },
      });
      return readAdminJson<KnowledgeDocument>(response, t.createFailed);
    },
    onSuccess: () => {
      toast({ title: t.documentCreated });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: t.createFailed, description: String(error), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: KnowledgeFormData }) => {
      const response = await adminApiRequest("PUT", `/api/admin/knowledge/${id}`, {
        ...formData,
        metadata: {
          language: formData.language,
          confidence: formData.confidence,
        },
      });
      return readAdminJson<KnowledgeDocument>(response, t.updateFailed);
    },
    onSuccess: () => {
      toast({ title: t.documentUpdated });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsEditModalOpen(false);
      setSelectedDocument(null);
      form.reset();
    },
    onError: (error) => {
      toast({ title: t.updateFailed, description: String(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApiRequest("DELETE", `/api/admin/knowledge/${id}`);
      return readAdminJson<{ success?: boolean }>(response, t.deleteFailed);
    },
    onSuccess: () => {
      toast({ title: t.documentDeleted });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast({ title: t.deleteFailed, description: String(error), variant: "destructive" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (formData: BulkUploadData) => {
      const response = await adminApiRequest("POST", "/api/admin/knowledge/bulk", {
        items: buildBulkKnowledgeItems(formData),
      });
      return readAdminJson<{ created?: number }>(response, t.bulkUploadFailed);
    },
    onSuccess: (result) => {
      toast({
        title: t.bulkUploadComplete,
        description: `${result.created || 0} ${t.documentsCreated}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsBulkModalOpen(false);
      bulkForm.reset();
    },
    onError: (error) => {
      toast({ title: t.bulkUploadFailed, description: String(error), variant: "destructive" });
    },
  });

  const handleEdit = useCallback((document: KnowledgeDocument) => {
    setSelectedDocument(document);
    form.reset({
      category: document.category,
      title: document.title,
      content: document.content,
      agentType: document.agentType,
      language: document.metadata?.language || "",
      confidence: document.metadata?.confidence || 80,
      dataClassification: document.dataClassification === "public" ? "public" : "internal",
      aiUseConfirmed: false,
    });
    setIsEditModalOpen(true);
  }, [form]);

  const handleDelete = useCallback((document: KnowledgeDocument) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  }, []);

  const filteredDocuments = filterKnowledgeDocuments(documents, {
    searchQuery,
    category: filterCategory,
    agent: filterAgent,
    activeTab,
  });
  const documentsByCategory = KNOWLEDGE_CATEGORIES.map((category) => ({
    ...category,
    count: documents?.filter((document) => document.category === category.value).length || 0,
  }));

  return {
    t,
    authLoading,
    isAuthenticated,
    form,
    bulkForm,
    isLoading,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
    bulkUploadMutation,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isBulkModalOpen,
    setIsBulkModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedDocument,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterAgent,
    setFilterAgent,
    activeTab,
    setActiveTab,
    filteredDocuments,
    documentsByCategory,
    totalDocuments: documents?.length || 0,
    handleEdit,
    handleDelete,
  };
}

export type KnowledgeAdminModel = ReturnType<typeof useKnowledgeAdmin>;
