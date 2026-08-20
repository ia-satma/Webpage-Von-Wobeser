import type { Express, Request, Response } from "express";
import { z } from "zod";
import { ALL_AGENT_IDS, type AgentId } from "@shared/agentConstants";
import { authMiddleware, requirePermission } from "../auth";
import { inspectAiData } from "../ai/dataGovernance";

const agentTypeSchema = z.enum(ALL_AGENT_IDS as [AgentId, ...AgentId[]]);
const metadataSchema = z.record(z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
])).refine((value) => Object.keys(value).length <= 20, "Too many metadata fields");
const knowledgeWriteSchema = z.object({
  category: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(50_000),
  agentType: agentTypeSchema,
  metadata: metadataSchema.optional().default({}),
  dataClassification: z.enum(["public", "internal"]),
  aiUseConfirmed: z.literal(true),
}).strict();

async function knowledgePersistence() {
  const { dbPersistence } = await import("../agents/storage/DatabasePersistence");
  return dbPersistence;
}

function approveKnowledge(
  req: Request,
  input: z.infer<typeof knowledgeWriteSchema>,
): {
  ok: true;
  value: {
    category: string;
    title: string;
    content: string;
    agentType: AgentId;
    metadata: Record<string, string | number | boolean | null>;
    dataClassification: "public" | "internal";
    approvedForAiAt: Date;
    approvedForAiBy: string;
  };
} | { ok: false; reasons: string[] } {
  const decision = inspectAiData({
    classification: input.dataClassification,
    purpose: "agent_knowledge",
    source: "knowledge",
    agentId: input.agentType,
    actorId: req.adminUser?.id || null,
  }, { title: input.title, content: input.content });
  if (!decision.allowed) return { ok: false, reasons: decision.reasonCodes };
  return {
    ok: true,
    value: {
      category: input.category,
      title: input.title,
      content: input.content,
      agentType: input.agentType,
      metadata: input.metadata,
      dataClassification: input.dataClassification,
      approvedForAiAt: new Date(),
      approvedForAiBy: req.adminUser!.id,
    },
  };
}

function blockedKnowledge(res: Response, reasons: string[]): Response {
  return res.status(422).json({
    code: "AI_DATA_GOVERNANCE_BLOCKED",
    error: "El documento no puede aprobarse para uso de IA con la clasificación indicada.",
    reasons,
  });
}

export function registerAdminKnowledgeRoutes(app: Express): void {
  const guard = [authMiddleware, requirePermission("agent_knowledge_admin")] as const;

  app.get("/api/admin/knowledge", ...guard, async (_req: Request, res: Response) => {
    try {
      const dbPersistence = await knowledgePersistence();
      const documents = await dbPersistence.getAllKnowledge();
      res.setHeader("Cache-Control", "private, no-store");
      res.json(documents);
    } catch {
      res.status(500).json({ error: "Failed to fetch knowledge documents" });
    }
  });

  app.post("/api/admin/knowledge", ...guard, async (req: Request, res: Response) => {
    try {
      const parsed = knowledgeWriteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid knowledge document" });
      const approved = approveKnowledge(req, parsed.data);
      if (!approved.ok) return blockedKnowledge(res, approved.reasons);
      const dbPersistence = await knowledgePersistence();
      const document = await dbPersistence.createKnowledge(approved.value);
      res.status(201).json(document);
    } catch {
      res.status(500).json({ error: "Failed to create knowledge document" });
    }
  });

  app.put("/api/admin/knowledge/:id", ...guard, async (req: Request, res: Response) => {
    try {
      const parsed = knowledgeWriteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid knowledge document" });
      const dbPersistence = await knowledgePersistence();
      const existing = await dbPersistence.getKnowledge(req.params.id);
      if (!existing) return res.status(404).json({ error: "Knowledge document not found" });
      const approved = approveKnowledge(req, parsed.data);
      if (!approved.ok) return blockedKnowledge(res, approved.reasons);
      const updated = await dbPersistence.updateKnowledge(req.params.id, approved.value);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update knowledge document" });
    }
  });

  app.delete("/api/admin/knowledge/:id", ...guard, async (req: Request, res: Response) => {
    try {
      const dbPersistence = await knowledgePersistence();
      const existing = await dbPersistence.getKnowledge(req.params.id);
      if (!existing) return res.status(404).json({ error: "Knowledge document not found" });
      await dbPersistence.deleteKnowledge(req.params.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete knowledge document" });
    }
  });

  app.post("/api/admin/knowledge/bulk", ...guard, async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        items: z.array(knowledgeWriteSchema).min(1).max(200),
      }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid knowledge items" });
      const approved = parsed.data.items.map((item) => approveKnowledge(req, item));
      const blocked = approved.find((item) => !item.ok);
      if (blocked && !blocked.ok) return blockedKnowledge(res, blocked.reasons);
      const dbPersistence = await knowledgePersistence();
      for (const item of approved) {
        if (item.ok) await dbPersistence.createKnowledge(item.value);
      }
      res.status(201).json({ created: approved.length, total: approved.length });
    } catch {
      res.status(500).json({ error: "Failed to bulk create knowledge documents" });
    }
  });
}
