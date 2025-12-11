import { z } from 'zod';

export const CouncilRole = z.enum([
  'formatter',
  'translator', 
  'seo_optimizer',
  'metadata_linker',
  'content_auditor',
  'category_agent',
  'image_generator'
]);

export type CouncilRole = z.infer<typeof CouncilRole>;

export const CouncilMemberSchema = z.object({
  id: z.string().uuid(),
  role: CouncilRole,
  name: z.string().min(1).max(100),
});

export type CouncilMember = z.infer<typeof CouncilMemberSchema>;

export const VoteDecision = z.enum([
  'approve',
  'reject',
  'abstain',
  'request_revision'
]);

export type VoteDecision = z.infer<typeof VoteDecision>;

export const VoteResultSchema = z.object({
  score: z.number().min(0).max(100),
  decision: VoteDecision,
  reasoning: z.string().min(1).max(2000),
});

export type VoteResult = z.infer<typeof VoteResultSchema>;

export const OverallStatus = z.enum([
  'approved',
  'rejected',
  'pending_revision',
  'escalated',
  'deadlocked'
]);

export type OverallStatus = z.infer<typeof OverallStatus>;

export const RiskFlag = z.enum([
  'none',
  'low',
  'medium',
  'high',
  'critical'
]);

export type RiskFlag = z.infer<typeof RiskFlag>;

export const CouncilVerdictSchema = z.object({
  overallStatus: OverallStatus,
  riskFlag: RiskFlag,
  consolidatedFeedback: z.string().min(1).max(5000),
});

export type CouncilVerdict = z.infer<typeof CouncilVerdictSchema>;

export const CouncilSessionSchema = z.object({
  id: z.string().uuid(),
  articleId: z.string(),
  members: z.array(CouncilMemberSchema).min(1),
  votes: z.record(z.string(), VoteResultSchema),
  verdict: CouncilVerdictSchema.nullable(),
  createdAt: z.date(),
  concludedAt: z.date().nullable(),
});

export type CouncilSession = z.infer<typeof CouncilSessionSchema>;
