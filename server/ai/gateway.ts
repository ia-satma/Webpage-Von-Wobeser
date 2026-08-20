import {
  AiGovernanceBlockedError,
  inspectAiData,
  type AiGovernanceContext,
  type AiOperation,
  type AiProvider,
} from "./dataGovernance";
import { recordAiGovernanceDecision } from "./governanceAudit";

export type AiProviderCall<T> = {
  context: AiGovernanceContext;
  payload: unknown;
  provider: AiProvider;
  operation: AiOperation;
  metered?: boolean;
  invoke: () => Promise<T>;
};

/**
 * Única puerta autorizada para llamadas a proveedores de IA. Clasifica e
 * inspecciona antes de abrir la conexión; nunca registra ni persiste el payload.
 */
export async function executeAiProviderCall<T>(call: AiProviderCall<T>): Promise<T> {
  const decision = inspectAiData(call.context, call.payload);
  await recordAiGovernanceDecision({
    context: call.context,
    decision,
    provider: call.provider,
    operation: call.operation,
  });
  if (!decision.allowed) throw new AiGovernanceBlockedError(decision);
  if (call.metered !== false) {
    const { assertAiBudget } = await import("../services/usageTracker");
    await assertAiBudget();
  }
  console.info("[ai-gateway]", {
    provider: call.provider,
    operation: call.operation,
    purpose: call.context.purpose,
    agentId: call.context.agentId || null,
    classification: decision.classification,
    policyVersion: decision.policyVersion,
    contentSha256: decision.contentSha256,
    contentBytes: decision.contentBytes,
  });
  return call.invoke();
}
