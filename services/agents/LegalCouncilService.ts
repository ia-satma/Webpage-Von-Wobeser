import { randomUUID } from 'crypto';
import {
  CouncilMember,
  CouncilMemberSchema,
  VoteResult,
  VoteResultSchema,
  CouncilVerdict,
  CouncilVerdictSchema,
  CouncilSession,
  CouncilRole,
  VoteDecision,
  OverallStatus,
  RiskFlag,
  AgentVote,
} from '../../types/council';

interface AgentConfig {
  id: string;
  role: CouncilRole;
  name: string;
  systemPrompt: string;
}

const COUNCIL_AGENTS: AgentConfig[] = [
  {
    id: randomUUID(),
    role: 'content_auditor',
    name: 'Legal Scholar',
    systemPrompt: `You are a Legal Scholar agent evaluating article quality and accuracy.
Analyze the text for: legal accuracy, citation quality, professional tone, factual correctness.
Respond with JSON: { "score": 0-100, "decision": "approve|reject|abstain|request_revision", "reasoning": "explanation" }`,
  },
  {
    id: randomUUID(),
    role: 'content_auditor', 
    name: 'Risk Analyst',
    systemPrompt: `You are a Risk Analyst agent evaluating content for legal and reputational risks.
Analyze the text for: liability exposure, sensitive topics, compliance issues, potential controversies.
Respond with JSON: { "score": 0-100, "decision": "approve|reject|abstain|request_revision", "reasoning": "explanation" }`,
  },
  {
    id: randomUUID(),
    role: 'seo_optimizer',
    name: 'Brand Guardian',
    systemPrompt: `You are a Brand Guardian agent ensuring content aligns with Von Wobeser y Sierra's professional image.
Analyze the text for: brand consistency, tone appropriateness, professional standards, client perception.
Respond with JSON: { "score": 0-100, "decision": "approve|reject|abstain|request_revision", "reasoning": "explanation" }`,
  },
];

const SYSTEM_ABSTENTION_VOTE: VoteResult = {
  score: 50,
  decision: 'abstain',
  reasoning: 'System Abstention: Agent unavailable or encountered an error. Vote excluded from final tally.',
};

export class LegalCouncilService {
  private openaiBaseUrl: string;
  private openaiApiKey: string;

  constructor() {
    this.openaiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || '';
    this.openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || '';
  }

  async evaluateArticle(text: string): Promise<CouncilVerdict> {
    const sessionId = randomUUID();
    console.log(`[LegalCouncil] Session ${sessionId}: Starting evaluation with ${COUNCIL_AGENTS.length} agents`);

    const agentPromises = COUNCIL_AGENTS.map((agent) =>
      this.runAgentEvaluation(agent, text)
    );

    const results = await Promise.allSettled(agentPromises);

    const votes: Map<string, VoteResult> = new Map();
    const validVotes: VoteResult[] = [];

    results.forEach((result, index) => {
      const agent = COUNCIL_AGENTS[index];
      
      if (result.status === 'rejected') {
        console.error(`[LegalCouncil] Agent "${agent.name}" FAILED:`, result.reason);
        votes.set(agent.id, SYSTEM_ABSTENTION_VOTE);
      } else {
        const parseResult = VoteResultSchema.safeParse(result.value);
        
        if (!parseResult.success) {
          console.error(`[LegalCouncil] Agent "${agent.name}" returned invalid vote:`, parseResult.error.issues);
          votes.set(agent.id, SYSTEM_ABSTENTION_VOTE);
        } else {
          votes.set(agent.id, parseResult.data);
          if (parseResult.data.decision !== 'abstain') {
            validVotes.push(parseResult.data);
          }
        }
      }
    });

    const verdict = this.calculateVerdict(validVotes, votes);
    
    console.log(`[LegalCouncil] Session ${sessionId}: Verdict = ${verdict.overallStatus}, Risk = ${verdict.riskFlag}`);
    
    return verdict;
  }

  private async runAgentEvaluation(agent: AgentConfig, text: string): Promise<VoteResult> {
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) + '...[truncated]' : text;

    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: `Evaluate this article:\n\n${truncatedText}` },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      score: Number(parsed.score) || 50,
      decision: this.normalizeDecision(parsed.decision),
      reasoning: String(parsed.reasoning || 'No reasoning provided').substring(0, 2000),
    };
  }

  private normalizeDecision(decision: unknown): VoteDecision {
    const normalized = String(decision).toLowerCase().trim();
    
    const validDecisions: VoteDecision[] = ['approve', 'reject', 'abstain', 'request_revision'];
    
    if (validDecisions.includes(normalized as VoteDecision)) {
      return normalized as VoteDecision;
    }
    
    if (normalized.includes('approve') || normalized.includes('pass')) return 'approve';
    if (normalized.includes('reject') || normalized.includes('fail')) return 'reject';
    if (normalized.includes('revision') || normalized.includes('revise')) return 'request_revision';
    
    return 'abstain';
  }

  private calculateVerdict(validVotes: VoteResult[], allVotes: Map<string, VoteResult>): CouncilVerdict {
    const agentVotes: AgentVote[] = [];
    
    Array.from(allVotes.entries()).forEach(([agentId, vote], agentIndex) => {
      const agent = COUNCIL_AGENTS[agentIndex];
      agentVotes.push({
        agentName: agent?.name || 'Unknown Agent',
        role: agent?.role || 'content_auditor',
        score: vote.score,
        decision: vote.decision,
        reasoning: vote.reasoning,
      });
    });

    if (validVotes.length === 0) {
      return {
        overallStatus: 'deadlocked',
        riskFlag: 'medium',
        consolidatedFeedback: 'All council members abstained or were unavailable. Manual review required.',
        agentVotes,
        averageScore: 50,
      };
    }

    const approvals = validVotes.filter((v) => v.decision === 'approve').length;
    const rejections = validVotes.filter((v) => v.decision === 'reject').length;
    const revisions = validVotes.filter((v) => v.decision === 'request_revision').length;
    const avgScore = validVotes.reduce((sum, v) => sum + v.score, 0) / validVotes.length;

    let overallStatus: OverallStatus;
    
    if (rejections >= 2) {
      overallStatus = 'rejected';
    } else if (approvals >= 2 && rejections === 0) {
      overallStatus = 'approved';
    } else if (revisions >= 1) {
      overallStatus = 'pending_revision';
    } else if (approvals === rejections) {
      overallStatus = 'deadlocked';
    } else if (approvals > rejections) {
      overallStatus = 'approved';
    } else {
      overallStatus = 'escalated';
    }

    let riskFlag: RiskFlag;
    
    if (avgScore >= 80) {
      riskFlag = 'none';
    } else if (avgScore >= 65) {
      riskFlag = 'low';
    } else if (avgScore >= 50) {
      riskFlag = 'medium';
    } else if (avgScore >= 35) {
      riskFlag = 'high';
    } else {
      riskFlag = 'critical';
    }

    const feedbackParts: string[] = [];
    feedbackParts.push(`Council Decision: ${overallStatus.toUpperCase()}`);
    feedbackParts.push(`Average Score: ${avgScore.toFixed(1)}/100`);
    feedbackParts.push(`Votes: ${approvals} approve, ${rejections} reject, ${revisions} revision`);
    feedbackParts.push('');
    feedbackParts.push('Agent Reasoning:');
    
    Array.from(allVotes.entries()).forEach(([agentId, vote], agentIndex) => {
      const agent = COUNCIL_AGENTS[agentIndex];
      if (vote.decision !== 'abstain') {
        feedbackParts.push(`- ${agent?.name || 'Agent'}: ${vote.reasoning}`);
      }
    });

    const consolidatedFeedback = feedbackParts.join('\n').substring(0, 5000);

    const verdict: CouncilVerdict = {
      overallStatus,
      riskFlag,
      consolidatedFeedback,
      agentVotes,
      averageScore: avgScore,
    };

    const validation = CouncilVerdictSchema.safeParse(verdict);
    if (!validation.success) {
      console.error('[LegalCouncil] Internal verdict validation failed:', validation.error);
      return {
        overallStatus: 'escalated',
        riskFlag: 'high',
        consolidatedFeedback: 'System error during verdict calculation. Manual review required.',
      };
    }

    return validation.data;
  }

  getCouncilMembers(): CouncilMember[] {
    return COUNCIL_AGENTS.map((agent) => {
      const member = {
        id: agent.id,
        role: agent.role,
        name: agent.name,
      };
      
      const validation = CouncilMemberSchema.safeParse(member);
      return validation.success ? validation.data : { id: randomUUID(), role: 'content_auditor' as const, name: 'Unknown Agent' };
    });
  }
}

export const legalCouncilService = new LegalCouncilService();
