import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Brain,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { AGENT_TYPES, KNOWLEDGE_CATEGORIES, LANGUAGE_OPTIONS } from "./catalogs";
import type { KnowledgeAdminModel } from "./useKnowledgeAdmin";

export function KnowledgeOverview({ model }: { model: KnowledgeAdminModel }) {
  const {
    t,
    refetch,
    setIsBulkModalOpen,
    form,
    setIsAddModalOpen,
    documentsByCategory,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterAgent,
    setFilterAgent,
    totalDocuments,
    filteredDocuments,
    isLoading,
    handleEdit,
    handleDelete,
  } = model;

  return (
    <>
        <AdminPageHeader
          title={t.title}
          description={t.subtitle}
          icon={Brain}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                data-testid="button-refresh-knowledge"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.refresh}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkModalOpen(true)}
                data-testid="button-bulk-upload"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.bulkUpload}
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
                {t.addDocument}
              </Button>
            </>
          }
        />
        <AdminPageHelp pageId="knowledge">
          Esta sección alimenta la 'memoria' del sistema: aquí se guarda información de referencia que los agentes de IA usan para generar o revisar contenido con mayor precisión.
        </AdminPageHelp>

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
                      <span className="text-sm font-medium">{t[cat.labelKey as keyof typeof t]}</span>
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
                  placeholder={t.searchDocuments}
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
                    <SelectValue placeholder={t.filterByCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCategories}</SelectItem>
                    {KNOWLEDGE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{t[cat.labelKey as keyof typeof t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-agent">
                    <SelectValue placeholder={t.filterByAgent} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allAgents}</SelectItem>
                    {AGENT_TYPES.map(agent => (
                      <SelectItem key={agent.value} value={agent.value}>{(t as any)[agent.labelKey] || (agent as any).label || agent.value}</SelectItem>
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
              {t.all} ({totalDocuments})
            </TabsTrigger>
            {KNOWLEDGE_CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} data-testid={`tab-${cat.value}`}>
                {t[cat.labelKey as keyof typeof t]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {t.knowledgeDocuments}
                </CardTitle>
                <CardDescription>
                  {filteredDocuments.length} {t.documentsFound}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t.noDocumentsFound}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.titleKey}</TableHead>
                          <TableHead>{t.category}</TableHead>
                          <TableHead>{t.agent}</TableHead>
                          <TableHead>{t.language}</TableHead>
                          <TableHead>{t.usage}</TableHead>
                          <TableHead>{t.updated}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((doc) => {
                          const catLabelKey = KNOWLEDGE_CATEGORIES.find(c => c.value === doc.category)?.labelKey;
                          const agentEntry = AGENT_TYPES.find(a => a.value === doc.agentType);
                          const agentLabelKey = agentEntry?.labelKey;
                          const langLabelKey = LANGUAGE_OPTIONS.find(l => l.value === doc.metadata?.language)?.labelKey;
                          return (
                          <TableRow key={doc.id} data-testid={`row-knowledge-${doc.id}`}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {doc.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {catLabelKey ? t[catLabelKey as keyof typeof t] : doc.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {(agentLabelKey && (t as any)[agentLabelKey]) || (agentEntry as any)?.label || doc.agentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.metadata?.language && (
                                <Badge variant="outline">
                                  {langLabelKey ? t[langLabelKey as keyof typeof t] : doc.metadata.language}
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </>
  );
}
