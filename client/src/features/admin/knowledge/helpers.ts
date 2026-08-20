import type { BulkUploadData, KnowledgeDocument } from "./contracts";

export type KnowledgeFilters = {
  searchQuery: string;
  category: string;
  agent: string;
  activeTab: string;
};

export function filterKnowledgeDocuments(
  documents: KnowledgeDocument[] | undefined,
  filters: KnowledgeFilters,
): KnowledgeDocument[] {
  const query = filters.searchQuery.toLowerCase();
  return (documents ?? []).filter((document) => {
    const matchesSearch =
      !query
      || document.title.toLowerCase().includes(query)
      || document.content.toLowerCase().includes(query);
    const matchesCategory = filters.category === "all" || document.category === filters.category;
    const matchesAgent = filters.agent === "all" || document.agentType === filters.agent;
    const matchesTab = filters.activeTab === "all" || document.category === filters.activeTab;
    return matchesSearch && matchesCategory && matchesAgent && matchesTab;
  });
}

export function buildBulkKnowledgeItems(data: BulkUploadData) {
  return data.data
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [key, ...valueParts] = line.split("|");
      return {
        category: data.category,
        agentType: data.agentType,
        title: key?.trim() || "",
        content: valueParts.join("|").trim() || key?.trim() || "",
        metadata: {},
        dataClassification: data.dataClassification,
        aiUseConfirmed: true,
      };
    })
    .filter((item) => item.title && item.content);
}
