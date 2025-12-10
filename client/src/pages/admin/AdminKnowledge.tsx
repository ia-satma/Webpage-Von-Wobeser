import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  BookOpen,
  Brain, 
  Languages,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Tag,
  Clock,
  BarChart3,
  Filter
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface KnowledgeDocument {
  id: string;
  agentType: string;
  category: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const KNOWLEDGE_CATEGORIES = [
  { value: "legal_glossary", label: "Legal Glossary", icon: BookOpen },
  { value: "translation_pattern", label: "Translation Pattern", icon: Languages },
  { value: "content_template", label: "Content Template", icon: FileText },
  { value: "seo_rule", label: "SEO Rule", icon: BarChart3 },
  { value: "workflow", label: "Workflow", icon: Clock },
] as const;

const AGENT_TYPES = [
  { value: "formatter", label: "Article Formatter" },
  { value: "metadata_linker", label: "Metadata Linker" },
  { value: "polyglot_translator", label: "Polyglot Translator" },
  { value: "content_auditor", label: "Content Auditor" },
  { value: "content_analyzer", label: "Content Analyzer" },
  { value: "seo_optimizer", label: "SEO Optimizer" },
  { value: "website_auditor", label: "Website Auditor" },
  { value: "image_suggestion", label: "Image Suggestion" },
  { value: "category_agent", label: "Category Agent" },
] as const;

const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
] as const;

const knowledgeFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title/Key is required"),
  content: z.string().min(1, "Content is required"),
  agentType: z.string().min(1, "Agent type is required"),
  language: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
});

type KnowledgeFormData = z.infer<typeof knowledgeFormSchema>;

const bulkUploadSchema = z.object({
  category: z.string().min(1, "Category is required"),
  agentType: z.string().min(1, "Agent type is required"),
  data: z.string().min(1, "Data is required"),
});

type BulkUploadData = z.infer<typeof bulkUploadSchema>;

export default function AdminKnowledge() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, token } = useAdminAuth();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
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
    },
  });

  const bulkForm = useForm<BulkUploadData>({
    resolver: zodResolver(bulkUploadSchema),
    defaultValues: {
      category: "legal_glossary",
      agentType: "polyglot_translator",
      data: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: documents, isLoading, refetch } = useQuery<KnowledgeDocument[]>({
    queryKey: ["/api/admin/knowledge"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/knowledge");
      return res.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (data: KnowledgeFormData) => {
      const res = await adminApiRequest("POST", "/api/admin/knowledge", {
        ...data,
        metadata: {
          language: data.language,
          confidence: data.confidence,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Knowledge document created" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to create document", description: String(error), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KnowledgeFormData }) => {
      const res = await adminApiRequest("PUT", `/api/admin/knowledge/${id}`, {
        ...data,
        metadata: {
          language: data.language,
          confidence: data.confidence,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Knowledge document updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsEditModalOpen(false);
      setSelectedDocument(null);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to update document", description: String(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/knowledge/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Knowledge document deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast({ title: "Failed to delete document", description: String(error), variant: "destructive" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (data: BulkUploadData) => {
      const lines = data.data.split("\n").filter(line => line.trim());
      const items = lines.map(line => {
        const [key, ...valueParts] = line.split("|");
        return {
          category: data.category,
          agentType: data.agentType,
          title: key?.trim() || "",
          content: valueParts.join("|").trim() || key?.trim() || "",
          metadata: {},
        };
      }).filter(item => item.title && item.content);
      
      const res = await adminApiRequest("POST", "/api/admin/knowledge/bulk", { items });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bulk upload complete", description: `${data.created || 0} documents created` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsBulkModalOpen(false);
      bulkForm.reset();
    },
    onError: (error) => {
      toast({ title: "Bulk upload failed", description: String(error), variant: "destructive" });
    },
  });

  const handleEdit = useCallback((doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    form.reset({
      category: doc.category,
      title: doc.title,
      content: doc.content,
      agentType: doc.agentType,
      language: doc.metadata?.language || "",
      confidence: doc.metadata?.confidence || 80,
    });
    setIsEditModalOpen(true);
  }, [form]);

  const handleDelete = useCallback((doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  }, []);

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesAgent = filterAgent === "all" || doc.agentType === filterAgent;
    const matchesTab = activeTab === "all" || doc.category === activeTab;
    return matchesSearch && matchesCategory && matchesAgent && matchesTab;
  }) || [];

  const documentsByCategory = KNOWLEDGE_CATEGORIES.map(cat => ({
    ...cat,
    count: documents?.filter(d => d.category === cat.value).length || 0,
  }));

  const totalDocuments = documents?.length || 0;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin-knowledge">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                Knowledge Base Management
              </h1>
              <p className="text-muted-foreground">
                Manage AI agent knowledge documents for translation, legal glossary, and workflows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-refresh-knowledge"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsBulkModalOpen(true)}
              data-testid="button-bulk-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                form.reset();
                setIsAddModalOpen(true);
              }}
              data-testid="button-add-knowledge"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {documentsByCategory.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card 
                key={cat.value} 
                className={`cursor-pointer transition-colors ${activeTab === cat.value ? 'border-primary' : ''}`}
                onClick={() => setActiveTab(cat.value)}
                data-testid={`card-category-${cat.value}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    <Badge variant="secondary">{cat.count}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-knowledge"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {KNOWLEDGE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-agent">
                    <SelectValue placeholder="Filter by agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {AGENT_TYPES.map(agent => (
                      <SelectItem key={agent.value} value={agent.value}>{agent.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="tabs-knowledge-categories">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({totalDocuments})
            </TabsTrigger>
            {KNOWLEDGE_CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} data-testid={`tab-${cat.value}`}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Knowledge Documents
                </CardTitle>
                <CardDescription>
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No knowledge documents found. Click "Add Document" to create one.
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title/Key</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((doc) => (
                          <TableRow key={doc.id} data-testid={`row-knowledge-${doc.id}`}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {doc.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {KNOWLEDGE_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {AGENT_TYPES.find(a => a.value === doc.agentType)?.label || doc.agentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.metadata?.language && (
                                <Badge variant="outline">
                                  {LANGUAGES.find(l => l.value === doc.metadata?.language)?.label || doc.metadata.language}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{doc.usageCount}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(doc)}
                                  data-testid={`button-edit-${doc.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(doc)}
                                  data-testid={`button-delete-${doc.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Knowledge Document</DialogTitle>
              <DialogDescription>
                Create a new knowledge document for AI agents to learn from.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KNOWLEDGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-agent">
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGENT_TYPES.map(agent => (
                              <SelectItem key={agent.value} value={agent.value}>{agent.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title / Key</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 'due_diligence' or 'Translation Pattern: Legal Terms'" data-testid="input-add-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content / Value</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter the knowledge content, definition, or pattern..."
                          className="min-h-[150px]"
                          data-testid="textarea-add-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {LANGUAGES.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidence (0-100)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-add-confidence"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add">
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Document
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Knowledge Document</DialogTitle>
              <DialogDescription>
                Update the knowledge document information.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => selectedDocument && updateMutation.mutate({ id: selectedDocument.id, data }))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KNOWLEDGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-agent">
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGENT_TYPES.map(agent => (
                              <SelectItem key={agent.value} value={agent.value}>{agent.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title / Key</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content / Value</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[150px]"
                          data-testid="textarea-edit-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {LANGUAGES.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidence (0-100)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-edit-confidence"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Document
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Knowledge</DialogTitle>
              <DialogDescription>
                Upload multiple knowledge entries at once. Format: one entry per line, use pipe (|) to separate key and value.
              </DialogDescription>
            </DialogHeader>
            <Form {...bulkForm}>
              <form onSubmit={bulkForm.handleSubmit((data) => bulkUploadMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={bulkForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bulk-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KNOWLEDGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bulk-agent">
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGENT_TYPES.map(agent => (
                              <SelectItem key={agent.value} value={agent.value}>{agent.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={bulkForm.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data (key|value per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={`due_diligence|Debida diligencia: Proceso de investigación exhaustiva
merger|Fusión: Combinación de dos o más empresas
acquisition|Adquisición: Compra de una empresa por otra`}
                          className="min-h-[200px] font-mono text-sm"
                          data-testid="textarea-bulk-data"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bulkUploadMutation.isPending} data-testid="button-submit-bulk">
                    {bulkUploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Upload All
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Knowledge Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedDocument?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedDocument && deleteMutation.mutate(selectedDocument.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
