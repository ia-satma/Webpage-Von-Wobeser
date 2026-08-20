import type {
  AiGovernanceContext,
  AiGovernanceDecision,
  AiOperation,
  AiProvider,
} from "./dataGovernance";

export function isDurableAiGovernanceAuditEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // En producción no existe una variable de bypass: sin evidencia durable, el
  // gateway falla cerrado. La bandera solo permite ensayar la tabla fuera de prod.
  if (env.NODE_ENV === "production") return true;
  return env.AI_GOVERNANCE_AUDIT_ENABLED === "true";
}

export async function recordAiGovernanceDecision(input: {
  context: AiGovernanceContext;
  decision: AiGovernanceDecision;
  provider: AiProvider;
  operation: AiOperation;
}): Promise<void> {
  if (!isDurableAiGovernanceAuditEnabled()) return;
  try {
    const [{ db }, { aiGovernanceEvents }] = await Promise.all([
      import("../db"),
      import("@shared/schema"),
    ]);
    await db.insert(aiGovernanceEvents).values({
      provider: input.provider,
      operation: input.operation,
      purpose: input.context.purpose,
      agentType: input.context.agentId || null,
      classification: input.decision.classification,
      decision: input.decision.allowed ? "allowed" : "blocked",
      reasonCodes: input.decision.reasonCodes,
      contentSha256: input.decision.contentSha256,
      contentBytes: input.decision.contentBytes,
      policyVersion: input.decision.policyVersion,
      actorId: input.context.actorId || null,
      jobId: input.context.jobId || null,
    });
  } catch {
    // Producción falla cerrado: no se abre la conexión con el proveedor si la
    // evidencia mínima no pudo persistirse.
    throw new Error("AI governance audit is unavailable");
  }
}
