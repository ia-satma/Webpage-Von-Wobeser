import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Cpu, Shield, Circle } from "lucide-react";
import { getAgentCardTranslation } from "@/lib/adminTranslations";

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

interface NerveCenterProps {
  agents: AgentCapabilityCard[];
  language: string;
  translations: {
    brainTitle: string;
    brainDesc: string;
    handsTitle: string;
    handsDesc: string;
    shieldTitle: string;
    shieldDesc: string;
    evolutionLevel: string;
    statusActive: string;
    statusDormant: string;
    statusEvolving: string;
  };
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "brain":
      return <Brain className="w-6 h-6" />;
    case "hands":
      return <Cpu className="w-6 h-6" />;
    case "shield":
      return <Shield className="w-6 h-6" />;
    default:
      return <Brain className="w-6 h-6" />;
  }
}

function EvolutionDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1" data-testid="evolution-dots">
      {[1, 2, 3, 4, 5].map((dot) => (
        <Circle
          key={dot}
          className={`w-2 h-2 ${
            dot <= level
              ? "fill-primary text-primary"
              : "fill-muted text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function StatusIndicator({ status, translations }: { status: string; translations: NerveCenterProps["translations"] }) {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          color: "bg-green-500",
          pulse: true,
          label: translations.statusActive,
        };
      case "evolving":
        return {
          color: "bg-yellow-500",
          pulse: true,
          label: translations.statusEvolving,
        };
      case "dormant":
        return {
          color: "bg-muted-foreground",
          pulse: false,
          label: translations.statusDormant,
        };
      default:
        return {
          color: "bg-muted-foreground",
          pulse: false,
          label: status,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2" data-testid="status-indicator">
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${
          config.pulse ? "animate-pulse" : ""
        }`}
      />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}

function AgentCard({
  agent,
  language,
  translations,
}: {
  agent: AgentCapabilityCard;
  language: string;
  translations: NerveCenterProps["translations"];
}) {
  const isActive = agent.status === "active";
  const localizedCard = getAgentCardTranslation(agent.id, language);

  const displayName = localizedCard?.businessName ?? agent.businessName;
  const displayRole = localizedCard?.role ?? agent.role;
  const displayDescription = localizedCard?.description ?? agent.description;
  const displayCapabilities = localizedCard?.capabilities ?? agent.capabilities;

  return (
    <Card
      className={`relative overflow-visible transition-all duration-300 ${
        isActive ? "agent-pulse agent-breathing" : ""
      }`}
      data-testid={`agent-card-${agent.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold leading-tight" data-testid={`agent-name-${agent.id}`}>
              {displayName}
            </CardTitle>
            <p className="text-sm text-primary font-medium mt-1" data-testid={`agent-role-${agent.id}`}>
              {displayRole}
            </p>
          </div>
          <div className="flex-shrink-0 p-2 rounded-md bg-primary/10 text-primary">
            {getCategoryIcon(agent.category)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`agent-desc-${agent.id}`}>
          {displayDescription}
        </p>

        <div className="flex flex-wrap gap-1" data-testid={`agent-capabilities-${agent.id}`}>
          {displayCapabilities.slice(0, 3).map((capability, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-xs"
            >
              {capability.length > 30 ? capability.substring(0, 30) + "..." : capability}
            </Badge>
          ))}
          {displayCapabilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{displayCapabilities.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{translations.evolutionLevel}</span>
            <EvolutionDots level={agent.evolutionLevel} />
          </div>
          <StatusIndicator status={agent.status} translations={translations} />
        </div>
      </CardContent>
    </Card>
  );
}

function CategorySection({
  category,
  title,
  description,
  agents,
  language,
  translations,
}: {
  category: "brain" | "hands" | "shield";
  title: string;
  description: string;
  agents: AgentCapabilityCard[];
  language: string;
  translations: NerveCenterProps["translations"];
}) {
  const categoryAgents = agents.filter((a) => a.category === category);

  if (categoryAgents.length === 0) return null;

  const getBgColor = () => {
    switch (category) {
      case "brain":
        return "bg-blue-500/10 dark:bg-blue-500/20";
      case "hands":
        return "bg-amber-500/10 dark:bg-amber-500/20";
      case "shield":
        return "bg-green-500/10 dark:bg-green-500/20";
      default:
        return "bg-muted";
    }
  };

  const getIconColor = () => {
    switch (category) {
      case "brain":
        return "text-blue-600 dark:text-blue-400";
      case "hands":
        return "text-amber-600 dark:text-amber-400";
      case "shield":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <section className="space-y-4" data-testid={`category-section-${category}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${getBgColor()}`}>
          <span className={getIconColor()}>
            {getCategoryIcon(category)}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoryAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} language={language} translations={translations} />
        ))}
      </div>
    </section>
  );
}

export function NerveCenter({ agents, language, translations }: NerveCenterProps) {
  return (
    <div className="space-y-8" data-testid="nerve-center">
      <CategorySection
        category="brain"
        title={translations.brainTitle}
        description={translations.brainDesc}
        agents={agents}
        language={language}
        translations={translations}
      />
      <CategorySection
        category="hands"
        title={translations.handsTitle}
        description={translations.handsDesc}
        agents={agents}
        language={language}
        translations={translations}
      />
      <CategorySection
        category="shield"
        title={translations.shieldTitle}
        description={translations.shieldDesc}
        agents={agents}
        language={language}
        translations={translations}
      />
    </div>
  );
}
