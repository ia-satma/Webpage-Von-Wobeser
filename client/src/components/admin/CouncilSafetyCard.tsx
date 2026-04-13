import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  Eye,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AgentVote {
  agentName: string;
  role: string;
  score: number;
  decision: 'approve' | 'reject' | 'abstain' | 'request_revision';
  reasoning: string;
}

interface CouncilVerdict {
  overallStatus: 'approved' | 'rejected' | 'pending_revision' | 'escalated' | 'deadlocked';
  riskFlag: 'none' | 'low' | 'medium' | 'high' | 'critical';
  consolidatedFeedback: string;
  agentVotes?: AgentVote[];
  averageScore?: number;
}

interface CouncilSafetyCardProps {
  verdict: CouncilVerdict | null;
  onValidate?: () => void;
  isValidating?: boolean;
  isAdmin?: boolean;
}

const translations = {
  en: {
    title: "Council Safety Review",
    noVerdict: "No council evaluation available",
    status: "Status",
    riskLevel: "Risk Level",
    councilNotes: "Council Notes",
    showNotes: "Show Notes",
    hideNotes: "Hide Notes",
    validatePublish: "VALIDATE & PUBLISH",
    validating: "Validating...",
    approved: "Approved",
    rejected: "Rejected",
    pendingRevision: "Pending Revision",
    escalated: "Escalated",
    deadlocked: "Deadlocked",
    riskNone: "No Risk",
    riskLow: "Low Risk",
    riskMedium: "Medium Risk",
    riskHigh: "High Risk",
    riskCritical: "Critical Risk",
    legalCheck: "Legal Check",
    riskCheck: "Risk Check",
    brandCheck: "Brand Check",
    passed: "Passed",
    review: "Review",
    failed: "Failed",
    score: "Score",
  },
  es: {
    title: "Revisión de Seguridad del Consejo",
    noVerdict: "Sin evaluación del consejo disponible",
    status: "Estado",
    riskLevel: "Nivel de Riesgo",
    councilNotes: "Notas del Consejo",
    showNotes: "Mostrar Notas",
    hideNotes: "Ocultar Notas",
    validatePublish: "VALIDAR Y PUBLICAR",
    validating: "Validando...",
    approved: "Aprobado",
    rejected: "Rechazado",
    pendingRevision: "Pendiente de Revisión",
    escalated: "Escalado",
    deadlocked: "Sin Decisión",
    riskNone: "Sin Riesgo",
    riskLow: "Riesgo Bajo",
    riskMedium: "Riesgo Medio",
    riskHigh: "Riesgo Alto",
    riskCritical: "Riesgo Crítico",
    legalCheck: "Revisión Legal",
    riskCheck: "Revisión de Riesgo",
    brandCheck: "Revisión de Marca",
    passed: "Aprobado",
    review: "Revisar",
    failed: "Fallido",
    score: "Puntuación",
  },
  de: {
    title: "Sicherheitsbewertung des Rates",
    noVerdict: "Keine Ratsbewertung verfügbar",
    status: "Status",
    riskLevel: "Risikostufe",
    councilNotes: "Ratsnotizen",
    showNotes: "Notizen anzeigen",
    hideNotes: "Notizen ausblenden",
    validatePublish: "VALIDIEREN & VERÖFFENTLICHEN",
    validating: "Validierung...",
    approved: "Genehmigt",
    rejected: "Abgelehnt",
    pendingRevision: "Überarbeitung ausstehend",
    escalated: "Eskaliert",
    deadlocked: "Unentschieden",
    riskNone: "Kein Risiko",
    riskLow: "Geringes Risiko",
    riskMedium: "Mittleres Risiko",
    riskHigh: "Hohes Risiko",
    riskCritical: "Kritisches Risiko",
    legalCheck: "Rechtsprüfung",
    riskCheck: "Risikoprüfung",
    brandCheck: "Markenprüfung",
    passed: "Bestanden",
    review: "Überprüfen",
    failed: "Fehlgeschlagen",
    score: "Punktzahl",
  },
  zh: {
    title: "委员会安全审查",
    noVerdict: "暂无委员会评估",
    status: "状态",
    riskLevel: "风险等级",
    councilNotes: "委员会备注",
    showNotes: "显示备注",
    hideNotes: "隐藏备注",
    validatePublish: "验证并发布",
    validating: "验证中...",
    approved: "已批准",
    rejected: "已拒绝",
    pendingRevision: "待修订",
    escalated: "已升级",
    deadlocked: "僵持",
    riskNone: "无风险",
    riskLow: "低风险",
    riskMedium: "中等风险",
    riskHigh: "高风险",
    riskCritical: "严重风险",
    legalCheck: "法律审查",
    riskCheck: "风险审查",
    brandCheck: "品牌审查",
    passed: "通过",
    review: "审查",
    failed: "未通过",
    score: "分数",
  },
  ko: {
    title: "위원회 안전 검토",
    noVerdict: "위원회 평가 없음",
    status: "상태",
    riskLevel: "위험 수준",
    councilNotes: "위원회 메모",
    showNotes: "메모 표시",
    hideNotes: "메모 숨기기",
    validatePublish: "검증 및 게시",
    validating: "검증 중...",
    approved: "승인됨",
    rejected: "거부됨",
    pendingRevision: "수정 대기",
    escalated: "상위 검토",
    deadlocked: "교착 상태",
    riskNone: "위험 없음",
    riskLow: "낮은 위험",
    riskMedium: "중간 위험",
    riskHigh: "높은 위험",
    riskCritical: "심각한 위험",
    legalCheck: "법적 검토",
    riskCheck: "위험 검토",
    brandCheck: "브랜드 검토",
    passed: "통과",
    review: "검토",
    failed: "실패",
    score: "점수",
  },
  ja: {
    title: "評議会安全審査",
    noVerdict: "評議会評価なし",
    status: "ステータス",
    riskLevel: "リスクレベル",
    councilNotes: "評議会ノート",
    showNotes: "ノートを表示",
    hideNotes: "ノートを非表示",
    validatePublish: "検証して公開",
    validating: "検証中...",
    approved: "承認済み",
    rejected: "却下",
    pendingRevision: "修正待ち",
    escalated: "エスカレート",
    deadlocked: "デッドロック",
    riskNone: "リスクなし",
    riskLow: "低リスク",
    riskMedium: "中リスク",
    riskHigh: "高リスク",
    riskCritical: "重大リスク",
    legalCheck: "法的チェック",
    riskCheck: "リスクチェック",
    brandCheck: "ブランドチェック",
    passed: "合格",
    review: "レビュー",
    failed: "不合格",
    score: "スコア",
  },
  ar: {
    title: "مراجعة أمان المجلس",
    noVerdict: "لا يوجد تقييم من المجلس",
    status: "الحالة",
    riskLevel: "مستوى المخاطر",
    councilNotes: "ملاحظات المجلس",
    showNotes: "عرض الملاحظات",
    hideNotes: "إخفاء الملاحظات",
    validatePublish: "التحقق والنشر",
    validating: "جارٍ التحقق...",
    approved: "موافق عليه",
    rejected: "مرفوض",
    pendingRevision: "في انتظار المراجعة",
    escalated: "تم التصعيد",
    deadlocked: "مأزق",
    riskNone: "لا مخاطر",
    riskLow: "مخاطر منخفضة",
    riskMedium: "مخاطر متوسطة",
    riskHigh: "مخاطر عالية",
    riskCritical: "مخاطر حرجة",
    legalCheck: "فحص قانوني",
    riskCheck: "فحص المخاطر",
    brandCheck: "فحص العلامة التجارية",
    passed: "ناجح",
    review: "مراجعة",
    failed: "فاشل",
    score: "النتيجة",
  },
  ru: {
    title: "Проверка безопасности совета",
    noVerdict: "Нет оценки совета",
    status: "Статус",
    riskLevel: "Уровень риска",
    councilNotes: "Заметки совета",
    showNotes: "Показать заметки",
    hideNotes: "Скрыть заметки",
    validatePublish: "ПОДТВЕРДИТЬ И ОПУБЛИКОВАТЬ",
    validating: "Проверка...",
    approved: "Одобрено",
    rejected: "Отклонено",
    pendingRevision: "На доработке",
    escalated: "Эскалировано",
    deadlocked: "Тупик",
    riskNone: "Нет риска",
    riskLow: "Низкий риск",
    riskMedium: "Средний риск",
    riskHigh: "Высокий риск",
    riskCritical: "Критический риск",
    legalCheck: "Юридическая проверка",
    riskCheck: "Проверка рисков",
    brandCheck: "Проверка бренда",
    passed: "Пройдено",
    review: "Проверить",
    failed: "Провалено",
    score: "Оценка",
  },
  fr: {
    title: "Examen de sécurité du conseil",
    noVerdict: "Aucune évaluation du conseil disponible",
    status: "Statut",
    riskLevel: "Niveau de risque",
    councilNotes: "Notes du conseil",
    showNotes: "Afficher les notes",
    hideNotes: "Masquer les notes",
    validatePublish: "VALIDER ET PUBLIER",
    validating: "Validation...",
    approved: "Approuvé",
    rejected: "Rejeté",
    pendingRevision: "En attente de révision",
    escalated: "Escaladé",
    deadlocked: "Bloqué",
    riskNone: "Aucun risque",
    riskLow: "Risque faible",
    riskMedium: "Risque moyen",
    riskHigh: "Risque élevé",
    riskCritical: "Risque critique",
    legalCheck: "Vérification juridique",
    riskCheck: "Vérification des risques",
    brandCheck: "Vérification de marque",
    passed: "Réussi",
    review: "Réviser",
    failed: "Échoué",
    score: "Score",
  },
  it: {
    title: "Revisione di sicurezza del consiglio",
    noVerdict: "Nessuna valutazione del consiglio disponibile",
    status: "Stato",
    riskLevel: "Livello di rischio",
    councilNotes: "Note del consiglio",
    showNotes: "Mostra note",
    hideNotes: "Nascondi note",
    validatePublish: "CONVALIDA E PUBBLICA",
    validating: "Convalida in corso...",
    approved: "Approvato",
    rejected: "Rifiutato",
    pendingRevision: "In attesa di revisione",
    escalated: "Escalato",
    deadlocked: "Stallo",
    riskNone: "Nessun rischio",
    riskLow: "Rischio basso",
    riskMedium: "Rischio medio",
    riskHigh: "Rischio alto",
    riskCritical: "Rischio critico",
    legalCheck: "Verifica legale",
    riskCheck: "Verifica rischi",
    brandCheck: "Verifica marchio",
    passed: "Superato",
    review: "Rivedi",
    failed: "Fallito",
    score: "Punteggio",
  },
};

export function CouncilSafetyCard({ verdict, onValidate, isValidating, isAdmin }: CouncilSafetyCardProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [notesOpen, setNotesOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <ShieldCheck className="w-5 h-5 text-green-600" />;
      case 'rejected': return <ShieldX className="w-5 h-5 text-red-600" />;
      case 'pending_revision': return <ShieldAlert className="w-5 h-5 text-yellow-600" />;
      case 'escalated': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return t.approved;
      case 'rejected': return t.rejected;
      case 'pending_revision': return t.pendingRevision;
      case 'escalated': return t.escalated;
      case 'deadlocked': return t.deadlocked;
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending_revision': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'escalated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'none': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'none': return t.riskNone;
      case 'low': return t.riskLow;
      case 'medium': return t.riskMedium;
      case 'high': return t.riskHigh;
      case 'critical': return t.riskCritical;
      default: return risk;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 65) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approve': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'reject': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'request_revision': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDecisionLabel = (decision: string) => {
    switch (decision) {
      case 'approve': return t.passed;
      case 'reject': return t.failed;
      case 'request_revision': return t.review;
      default: return decision;
    }
  };

  const getAgentIcon = (name: string) => {
    if (name.includes('Scholar')) return <Scale className="w-4 h-4" />;
    if (name.includes('Risk')) return <ShieldAlert className="w-4 h-4" />;
    if (name.includes('Brand')) return <Eye className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  if (!verdict) {
    return (
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700" data-testid="card-council-empty">
        <CardContent className="py-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-muted-foreground">{t.noVerdict}</p>
        </CardContent>
      </Card>
    );
  }

  const extractScoreFallback = (feedback: string): number | null => {
    const match = feedback.match(/Average Score:\s*(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };
  
  const score = verdict.averageScore ?? extractScoreFallback(verdict.consolidatedFeedback);
  const checksPassed = verdict.overallStatus === 'approved' || verdict.overallStatus === 'pending_revision';

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5" data-testid="card-council-safety">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="w-5 h-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {score !== null && (
            <div className="flex items-center gap-2 bg-card rounded-none px-4 py-2 shadow-sm">
              <Sparkles className={`w-5 h-5 ${getScoreColor(score)}`} />
              <span className="text-sm text-muted-foreground">{t.score}:</span>
              <span className={`text-2xl font-bold ${getScoreColor(score)}`} data-testid="text-council-score">
                {Math.round(score)}/100
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {getStatusIcon(verdict.overallStatus)}
            <Badge className={`${getStatusColor(verdict.overallStatus)}`} data-testid="badge-council-status">
              {getStatusLabel(verdict.overallStatus)}
            </Badge>
          </div>

          <Badge className={`${getRiskColor(verdict.riskFlag)}`} data-testid="badge-council-risk">
            {getRiskLabel(verdict.riskFlag)}
          </Badge>
        </div>

        {verdict.agentVotes && verdict.agentVotes.length > 0 && (
          <div className="space-y-2" data-testid="section-agent-votes">
            {verdict.agentVotes.map((vote, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 p-3 rounded-none ${getScoreBgColor(vote.score)}`}
                data-testid={`agent-vote-${index}`}
              >
                <div className="flex items-center gap-2 min-w-[140px]">
                  {getAgentIcon(vote.agentName)}
                  <span className="font-medium text-sm">{vote.agentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getDecisionIcon(vote.decision)}
                  <Badge variant="outline" className="text-xs">
                    {getDecisionLabel(vote.decision)}
                  </Badge>
                </div>
                <div className={`font-bold ${getScoreColor(vote.score)}`}>
                  {vote.score}/100
                </div>
                <p className="text-xs text-muted-foreground flex-1 line-clamp-2">
                  {vote.reasoning}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={checksPassed ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}
            data-testid="badge-legal-check"
          >
            <Scale className="w-3 h-3 mr-1" />
            {t.legalCheck}: {checksPassed ? t.passed : t.review}
          </Badge>
          <Badge 
            variant="outline" 
            className={verdict.riskFlag === 'none' || verdict.riskFlag === 'low' ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}
            data-testid="badge-risk-check"
          >
            <ShieldCheck className="w-3 h-3 mr-1" />
            {t.riskCheck}: {verdict.riskFlag === 'none' || verdict.riskFlag === 'low' ? t.passed : t.review}
          </Badge>
          <Badge 
            variant="outline" 
            className={verdict.overallStatus !== 'rejected' ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}
            data-testid="badge-brand-check"
          >
            <Eye className="w-3 h-3 mr-1" />
            {t.brandCheck}: {verdict.overallStatus !== 'rejected' ? t.passed : t.failed}
          </Badge>
        </div>

        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid="button-toggle-notes">
              {t.councilNotes}
              {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div 
              className="mt-2 p-4 bg-muted/50 rounded-none text-sm whitespace-pre-wrap font-mono"
              data-testid="text-council-feedback"
            >
              {verdict.consolidatedFeedback}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {isAdmin && onValidate && (
          <Button 
            onClick={onValidate}
            disabled={isValidating || verdict.overallStatus === 'rejected'}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3"
            size="lg"
            data-testid="button-validate-publish"
          >
            {isValidating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t.validating}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {t.validatePublish}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
