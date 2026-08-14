import { z } from "zod";

export interface KnowledgeDocument {
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

export const knowledgeFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title/Key is required"),
  content: z.string().min(1, "Content is required"),
  agentType: z.string().min(1, "Agent type is required"),
  language: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
});

export type KnowledgeFormData = z.infer<typeof knowledgeFormSchema>;

export const bulkUploadSchema = z.object({
  category: z.string().min(1, "Category is required"),
  agentType: z.string().min(1, "Agent type is required"),
  data: z.string().min(1, "Data is required"),
});

export type BulkUploadData = z.infer<typeof bulkUploadSchema>;
