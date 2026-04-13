import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Zap, Sparkles } from "lucide-react";

interface SystemEvolutionEntry {
  date: string;
  title: string;
  description: string;
  agentId?: string;
  impact: "major" | "minor" | "critical";
  category: "intelligence" | "security" | "performance" | "capability";
}

interface EvolutionTimelineProps {
  entries: SystemEvolutionEntry[];
  translations: {
    title: string;
    impactCritical: string;
    impactMajor: string;
    impactMinor: string;
  };
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "intelligence":
      return <Brain className="w-4 h-4" />;
    case "security":
      return <Shield className="w-4 h-4" />;
    case "performance":
      return <Zap className="w-4 h-4" />;
    case "capability":
      return <Sparkles className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
}

function getImpactBadge(impact: string, translations: EvolutionTimelineProps["translations"]) {
  switch (impact) {
    case "critical":
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white">
          {translations.impactCritical}
        </Badge>
      );
    case "major":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">
          {translations.impactMajor}
        </Badge>
      );
    case "minor":
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          {translations.impactMinor}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{impact}</Badge>;
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function EvolutionTimeline({ entries, translations }: EvolutionTimelineProps) {
  if (!entries || entries.length === 0) {
    return null;
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="space-y-4" data-testid="evolution-timeline">
      <h2 className="text-xl font-bold">{translations.title}</h2>
      <div className="relative space-y-0">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        {sortedEntries.map((entry, index) => (
          <div
            key={`${entry.date}-${index}`}
            className="relative pl-10 pb-6 last:pb-0"
            data-testid={`timeline-entry-${index}`}
          >
            <div className="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border">
              <span className="text-primary">{getCategoryIcon(entry.category)}</span>
            </div>
            <div className="bg-card rounded-none border border-card-border p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-xs text-muted-foreground font-medium">
                  {formatDate(entry.date)}
                </time>
                {getImpactBadge(entry.impact, translations)}
              </div>
              <h3 className="font-bold text-foreground" data-testid={`timeline-title-${index}`}>
                {entry.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`timeline-desc-${index}`}>
                {entry.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
