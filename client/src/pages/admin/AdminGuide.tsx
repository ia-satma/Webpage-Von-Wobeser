import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { NerveCenter } from "@/components/admin/NerveCenter";
import { EvolutionTimeline } from "@/components/admin/EvolutionTimeline";
import { Brain, Cpu, Shield, Activity, Zap, TrendingUp } from "lucide-react";

interface AgentCapabilityCard {
  id: string;
  technicalName: string;
  businessName: string;
  role: string;
  category: "brain" | "hands" | "shield";
  description: string;
  capabilities: string[];
  status: "active" | "dormant" | "evolving";
  evolutionLevel: number;
}

interface SystemEvolutionEntry {
  date: string;
  title: string;
  description: string;
  agentId?: string;
  impact: "major" | "minor" | "critical";
  category: "intelligence" | "security" | "performance" | "capability";
}

interface ChroniclerResponse {
  agents: AgentCapabilityCard[];
  timeline: SystemEvolutionEntry[];
  stats: {
    totalAgents: number;
    activeAgents: number;
    averageEvolutionLevel: number;
  };
}

const translations = {
  en: {
    pageTitle: "Live Nerve Center",
    pageSubtitle: "Real-time visualization of the AI agent ecosystem",
    loadingTitle: "Connecting to Neural Network...",
    errorTitle: "Connection Error",
    errorMessage: "Unable to connect to the agent network. Please try again.",
    
    statsTotal: "Total Agents",
    statsActive: "Active",
    statsEvolution: "Avg. Evolution",
    
    brainTitle: "The Brain",
    brainDesc: "Orchestration & Classification Agents",
    handsTitle: "The Hands",
    handsDesc: "Translation, Formatting & Generation Agents",
    shieldTitle: "The Shield",
    shieldDesc: "Security, Auditing & Self-Healing Agents",
    
    evolutionLevel: "Evolution",
    statusActive: "Active",
    statusDormant: "Dormant",
    statusEvolving: "Evolving",
    
    timelineTitle: "System Evolution Timeline",
    impactCritical: "Critical",
    impactMajor: "Major",
    impactMinor: "Minor",

    notStaticCms: "This is not a static CMS",
    livingEcosystem: "It's a living, breathing AI ecosystem"
  },
  es: {
    pageTitle: "Centro Neural en Vivo",
    pageSubtitle: "Visualización en tiempo real del ecosistema de agentes IA",
    loadingTitle: "Conectando a la Red Neural...",
    errorTitle: "Error de Conexión",
    errorMessage: "No se puede conectar a la red de agentes. Por favor intente de nuevo.",
    
    statsTotal: "Agentes Totales",
    statsActive: "Activos",
    statsEvolution: "Evolución Prom.",
    
    brainTitle: "El Cerebro",
    brainDesc: "Agentes de Orquestación y Clasificación",
    handsTitle: "Las Manos",
    handsDesc: "Agentes de Traducción, Formato y Generación",
    shieldTitle: "El Escudo",
    shieldDesc: "Agentes de Seguridad, Auditoría y Auto-Reparación",
    
    evolutionLevel: "Evolución",
    statusActive: "Activo",
    statusDormant: "Inactivo",
    statusEvolving: "Evolucionando",
    
    timelineTitle: "Línea de Tiempo de Evolución del Sistema",
    impactCritical: "Crítico",
    impactMajor: "Mayor",
    impactMinor: "Menor",

    notStaticCms: "Esto no es un CMS estático",
    livingEcosystem: "Es un ecosistema de IA vivo y dinámico"
  },
  de: {
    pageTitle: "Live-Nervenzentrum",
    pageSubtitle: "Echtzeit-Visualisierung des KI-Agenten-Ökosystems",
    loadingTitle: "Verbindung zum Neuronalen Netzwerk...",
    errorTitle: "Verbindungsfehler",
    errorMessage: "Keine Verbindung zum Agentennetzwerk möglich. Bitte versuchen Sie es erneut.",
    
    statsTotal: "Gesamte Agenten",
    statsActive: "Aktiv",
    statsEvolution: "Durchschn. Evolution",
    
    brainTitle: "Das Gehirn",
    brainDesc: "Orchestrierung & Klassifizierungsagenten",
    handsTitle: "Die Hände",
    handsDesc: "Übersetzungs-, Formatierungs- & Generierungsagenten",
    shieldTitle: "Der Schild",
    shieldDesc: "Sicherheits-, Audit- & Selbstheilungsagenten",
    
    evolutionLevel: "Evolution",
    statusActive: "Aktiv",
    statusDormant: "Ruhend",
    statusEvolving: "Entwickelnd",
    
    timelineTitle: "System-Evolutionszeitlinie",
    impactCritical: "Kritisch",
    impactMajor: "Bedeutend",
    impactMinor: "Gering",

    notStaticCms: "Dies ist kein statisches CMS",
    livingEcosystem: "Es ist ein lebendiges, atmendes KI-Ökosystem"
  },
  zh: {
    pageTitle: "实时神经中心",
    pageSubtitle: "AI代理生态系统的实时可视化",
    loadingTitle: "正在连接神经网络...",
    errorTitle: "连接错误",
    errorMessage: "无法连接到代理网络。请重试。",
    
    statsTotal: "代理总数",
    statsActive: "活跃",
    statsEvolution: "平均进化",
    
    brainTitle: "大脑",
    brainDesc: "编排和分类代理",
    handsTitle: "双手",
    handsDesc: "翻译、格式化和生成代理",
    shieldTitle: "盾牌",
    shieldDesc: "安全、审计和自我修复代理",
    
    evolutionLevel: "进化",
    statusActive: "活跃",
    statusDormant: "休眠",
    statusEvolving: "进化中",
    
    timelineTitle: "系统进化时间线",
    impactCritical: "严重",
    impactMajor: "重要",
    impactMinor: "次要",

    notStaticCms: "这不是静态CMS",
    livingEcosystem: "这是一个活的、会呼吸的AI生态系统"
  },
  ko: {
    pageTitle: "실시간 신경 센터",
    pageSubtitle: "AI 에이전트 생태계의 실시간 시각화",
    loadingTitle: "신경 네트워크에 연결 중...",
    errorTitle: "연결 오류",
    errorMessage: "에이전트 네트워크에 연결할 수 없습니다. 다시 시도해 주세요.",
    
    statsTotal: "전체 에이전트",
    statsActive: "활성",
    statsEvolution: "평균 진화",
    
    brainTitle: "두뇌",
    brainDesc: "오케스트레이션 및 분류 에이전트",
    handsTitle: "손",
    handsDesc: "번역, 포맷팅 및 생성 에이전트",
    shieldTitle: "방패",
    shieldDesc: "보안, 감사 및 자가 치유 에이전트",
    
    evolutionLevel: "진화",
    statusActive: "활성",
    statusDormant: "휴면",
    statusEvolving: "진화 중",
    
    timelineTitle: "시스템 진화 타임라인",
    impactCritical: "심각",
    impactMajor: "주요",
    impactMinor: "경미",

    notStaticCms: "이것은 정적 CMS가 아닙니다",
    livingEcosystem: "살아 숨 쉬는 AI 생태계입니다"
  },
  ja: {
    pageTitle: "ライブ神経センター",
    pageSubtitle: "AIエージェントエコシステムのリアルタイム可視化",
    loadingTitle: "ニューラルネットワークに接続中...",
    errorTitle: "接続エラー",
    errorMessage: "エージェントネットワークに接続できません。もう一度お試しください。",
    
    statsTotal: "総エージェント数",
    statsActive: "アクティブ",
    statsEvolution: "平均進化レベル",
    
    brainTitle: "ブレイン",
    brainDesc: "オーケストレーションと分類エージェント",
    handsTitle: "ハンズ",
    handsDesc: "翻訳、フォーマット、生成エージェント",
    shieldTitle: "シールド",
    shieldDesc: "セキュリティ、監査、自己修復エージェント",
    
    evolutionLevel: "進化",
    statusActive: "アクティブ",
    statusDormant: "休止中",
    statusEvolving: "進化中",
    
    timelineTitle: "システム進化タイムライン",
    impactCritical: "クリティカル",
    impactMajor: "メジャー",
    impactMinor: "マイナー",

    notStaticCms: "これは静的なCMSではありません",
    livingEcosystem: "生きて呼吸するAIエコシステムです"
  },
  ar: {
    pageTitle: "مركز الأعصاب المباشر",
    pageSubtitle: "التصور في الوقت الفعلي لنظام وكلاء الذكاء الاصطناعي",
    loadingTitle: "الاتصال بالشبكة العصبية...",
    errorTitle: "خطأ في الاتصال",
    errorMessage: "تعذر الاتصال بشبكة الوكلاء. يرجى المحاولة مرة أخرى.",
    
    statsTotal: "إجمالي الوكلاء",
    statsActive: "نشط",
    statsEvolution: "متوسط التطور",
    
    brainTitle: "الدماغ",
    brainDesc: "وكلاء التنسيق والتصنيف",
    handsTitle: "الأيدي",
    handsDesc: "وكلاء الترجمة والتنسيق والتوليد",
    shieldTitle: "الدرع",
    shieldDesc: "وكلاء الأمان والتدقيق والإصلاح الذاتي",
    
    evolutionLevel: "التطور",
    statusActive: "نشط",
    statusDormant: "خامل",
    statusEvolving: "يتطور",
    
    timelineTitle: "الجدول الزمني لتطور النظام",
    impactCritical: "حرج",
    impactMajor: "رئيسي",
    impactMinor: "ثانوي",

    notStaticCms: "هذا ليس نظام إدارة محتوى ثابت",
    livingEcosystem: "إنه نظام بيئي للذكاء الاصطناعي حي ومتنفس"
  },
  ru: {
    pageTitle: "Живой Нервный Центр",
    pageSubtitle: "Визуализация экосистемы ИИ-агентов в реальном времени",
    loadingTitle: "Подключение к нейронной сети...",
    errorTitle: "Ошибка подключения",
    errorMessage: "Не удается подключиться к сети агентов. Пожалуйста, попробуйте снова.",
    
    statsTotal: "Всего агентов",
    statsActive: "Активных",
    statsEvolution: "Сред. эволюция",
    
    brainTitle: "Мозг",
    brainDesc: "Агенты оркестрации и классификации",
    handsTitle: "Руки",
    handsDesc: "Агенты перевода, форматирования и генерации",
    shieldTitle: "Щит",
    shieldDesc: "Агенты безопасности, аудита и самовосстановления",
    
    evolutionLevel: "Эволюция",
    statusActive: "Активен",
    statusDormant: "Спящий",
    statusEvolving: "Эволюционирует",
    
    timelineTitle: "Хронология эволюции системы",
    impactCritical: "Критический",
    impactMajor: "Значительный",
    impactMinor: "Незначительный",

    notStaticCms: "Это не статическая CMS",
    livingEcosystem: "Это живая, дышащая экосистема ИИ"
  },
  fr: {
    pageTitle: "Centre Nerveux en Direct",
    pageSubtitle: "Visualisation en temps réel de l'écosystème d'agents IA",
    loadingTitle: "Connexion au Réseau Neural...",
    errorTitle: "Erreur de Connexion",
    errorMessage: "Impossible de se connecter au réseau d'agents. Veuillez réessayer.",
    
    statsTotal: "Total Agents",
    statsActive: "Actifs",
    statsEvolution: "Évolution Moy.",
    
    brainTitle: "Le Cerveau",
    brainDesc: "Agents d'Orchestration et de Classification",
    handsTitle: "Les Mains",
    handsDesc: "Agents de Traduction, Formatage et Génération",
    shieldTitle: "Le Bouclier",
    shieldDesc: "Agents de Sécurité, Audit et Auto-Réparation",
    
    evolutionLevel: "Évolution",
    statusActive: "Actif",
    statusDormant: "En veille",
    statusEvolving: "En évolution",
    
    timelineTitle: "Chronologie d'Évolution du Système",
    impactCritical: "Critique",
    impactMajor: "Majeur",
    impactMinor: "Mineur",

    notStaticCms: "Ce n'est pas un CMS statique",
    livingEcosystem: "C'est un écosystème IA vivant et respirant"
  },
  it: {
    pageTitle: "Centro Nervoso Live",
    pageSubtitle: "Visualizzazione in tempo reale dell'ecosistema di agenti IA",
    loadingTitle: "Connessione alla Rete Neurale...",
    errorTitle: "Errore di Connessione",
    errorMessage: "Impossibile connettersi alla rete degli agenti. Riprova.",
    
    statsTotal: "Totale Agenti",
    statsActive: "Attivi",
    statsEvolution: "Evoluzione Media",
    
    brainTitle: "Il Cervello",
    brainDesc: "Agenti di Orchestrazione e Classificazione",
    handsTitle: "Le Mani",
    handsDesc: "Agenti di Traduzione, Formattazione e Generazione",
    shieldTitle: "Lo Scudo",
    shieldDesc: "Agenti di Sicurezza, Audit e Auto-Riparazione",
    
    evolutionLevel: "Evoluzione",
    statusActive: "Attivo",
    statusDormant: "Dormiente",
    statusEvolving: "In evoluzione",
    
    timelineTitle: "Timeline Evoluzione Sistema",
    impactCritical: "Critico",
    impactMajor: "Maggiore",
    impactMinor: "Minore",

    notStaticCms: "Questo non è un CMS statico",
    livingEcosystem: "È un ecosistema IA vivo e pulsante"
  }
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function StatsCard({
  icon: Icon,
  title,
  value,
  variant = "default"
}: {
  icon: typeof Brain;
  title: string;
  value: string | number;
  variant?: "default" | "primary" | "success";
}) {
  const getBgColor = () => {
    switch (variant) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "success":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`p-3 rounded-lg ${getBgColor()}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGuide() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const { data, isLoading, isError } = useQuery<ChroniclerResponse>({
    queryKey: ["/api/system/chronicler"],
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 text-lg text-muted-foreground">
            <Activity className="w-6 h-6 animate-pulse text-primary" />
            <span>{t.loadingTitle}</span>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              {t.errorTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t.errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { agents, timeline: evolutionTimeline, stats: systemStats } = data;

  return (
    <div className="p-6 space-y-8" data-testid="admin-nerve-center">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
              {t.pageTitle}
            </h1>
            <p className="text-muted-foreground">{t.pageSubtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs font-normal">
            {t.notStaticCms}
          </Badge>
          <span className="text-muted-foreground">—</span>
          <span className="text-sm text-primary font-medium">{t.livingEcosystem}</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" data-testid="system-stats">
        <StatsCard
          icon={Cpu}
          title={t.statsTotal}
          value={systemStats.totalAgents}
          variant="default"
        />
        <StatsCard
          icon={Zap}
          title={t.statsActive}
          value={systemStats.activeAgents}
          variant="success"
        />
        <StatsCard
          icon={TrendingUp}
          title={t.statsEvolution}
          value={systemStats.averageEvolutionLevel.toFixed(1)}
          variant="primary"
        />
      </section>

      <NerveCenter
        agents={agents}
        translations={{
          brainTitle: t.brainTitle,
          brainDesc: t.brainDesc,
          handsTitle: t.handsTitle,
          handsDesc: t.handsDesc,
          shieldTitle: t.shieldTitle,
          shieldDesc: t.shieldDesc,
          evolutionLevel: t.evolutionLevel,
          statusActive: t.statusActive,
          statusDormant: t.statusDormant,
          statusEvolving: t.statusEvolving
        }}
      />

      {evolutionTimeline && evolutionTimeline.length > 0 && (
        <EvolutionTimeline
          entries={evolutionTimeline}
          translations={{
            title: t.timelineTitle,
            impactCritical: t.impactCritical,
            impactMajor: t.impactMajor,
            impactMinor: t.impactMinor
          }}
        />
      )}
    </div>
  );
}
