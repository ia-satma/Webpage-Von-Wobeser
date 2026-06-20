import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import { getPracticeImage } from "@/lib/practiceIndustryImages";
import {
  CapabilityHero,
  CapabilityGrid,
  CapabilityCard,
} from "@/components/capabilities";
import type { PracticeGroup } from "@shared/schema";

/**
 * PracticeGroups — listado de áreas de práctica en el look viejo de Von Wobeser.
 *
 * Conserva el data-fetching original (`/api/practice-groups`) y la traducción
 * campo a campo por tarjeta. El Header/Footer los provee <Layout> (App.tsx);
 * aquí sólo se renderiza el contenido + <SEOHead>.
 */

interface PracticeCardProps {
  group: PracticeGroup;
}

function PracticeCard({ group }: PracticeCardProps) {
  const { language } = useLanguage();

  const displayName = getDisplayValue(group, "name", language) ?? "";
  const displayDescription = getDisplayValue(group, "description", language) ?? "";
  const imageUrl = getPracticeImage(group.slug, group.imageUrl);

  return (
    <CapabilityCard
      href={`/practice-groups/${group.slug}`}
      title={displayName}
      description={displayDescription}
      imageUrl={imageUrl}
      testId={`card-practice-group-${group.slug}`}
    />
  );
}

export default function PracticeGroups() {
  const { language } = useLanguage();

  const { data: practiceGroups, isLoading, error } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const content: Record<string, { eyebrow: string; title: string; subtitle: string; errorMessage: string }> = {
    en: { eyebrow: "Capabilities", title: "Practice Groups", subtitle: "Our expertise covers all major legal areas", errorMessage: "Failed to load practice groups" },
    es: { eyebrow: "Capacidades", title: "Áreas de Práctica", subtitle: "Nuestra experiencia cubre todas las principales áreas legales", errorMessage: "Error al cargar las áreas de práctica" },
  };

  const t = content[language] || content.en;

  return (
    <div data-testid="page-practice-groups">
      <SEOHead page="practiceGroups" language={language} />

      <CapabilityHero
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        testId="section-practice-groups-hero"
      />

      {error ? (
        <section className="bg-white py-20">
          <div className="vw-wrap text-center" data-testid="container-practice-groups-error">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-vw-graylight" />
            <p className="text-vw-gray" data-testid="text-practice-groups-error">
              {t.errorMessage}
            </p>
          </div>
        </section>
      ) : isLoading ? (
        <CapabilityGrid testId="grid-practice-groups-loading">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse bg-vw-graylight/40"
              data-testid={`skeleton-practice-group-${i}`}
            />
          ))}
        </CapabilityGrid>
      ) : (
        <CapabilityGrid testId="grid-practice-groups">
          {practiceGroups?.map((group) => (
            <PracticeCard key={group.id} group={group} />
          ))}
        </CapabilityGrid>
      )}
    </div>
  );
}
