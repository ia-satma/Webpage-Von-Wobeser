import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import { getIndustryImage } from "@/lib/practiceIndustryImages";
import {
  CapabilityHero,
  CapabilityGrid,
  CapabilityCard,
} from "@/components/capabilities";
import type { IndustryGroup } from "@shared/schema";

/**
 * IndustryGroups — listado de industrias en el look viejo de Von Wobeser.
 *
 * Conserva el data-fetching original (`/api/industry-groups`) y la traducción
 * por tarjeta. El Header/Footer los provee <Layout> (App.tsx).
 */

interface IndustryCardProps {
  group: IndustryGroup;
}

function IndustryCard({ group }: IndustryCardProps) {
  const { language } = useLanguage();

  const displayName = getDisplayValue(group, "name", language) ?? "";
  const displayDescription = getDisplayValue(group, "description", language) ?? "";
  const imageUrl = getIndustryImage(group.slug, group.imageUrl);

  return (
    <CapabilityCard
      href={`/industry-groups/${group.slug}`}
      title={displayName}
      description={displayDescription}
      imageUrl={imageUrl}
      testId={`card-industry-group-${group.slug}`}
    />
  );
}

export default function IndustryGroups() {
  const { language } = useLanguage();

  const { data: industryGroups, isLoading, error } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content: Record<string, { eyebrow: string; title: string; subtitle: string; errorMessage: string }> = {
    en: { eyebrow: "Capabilities", title: "Industry Groups", subtitle: "Specialized industry expertise", errorMessage: "Failed to load industry groups" },
    es: { eyebrow: "Capacidades", title: "Industrias", subtitle: "Experiencia especializada en industrias", errorMessage: "Error al cargar las industrias" },
  };

  const t = content[language] || content.en;

  return (
    <div data-testid="page-industry-groups">
      <SEOHead page="industryGroups" language={language} />

      <CapabilityHero
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        testId="section-industry-groups-hero"
      />

      {error ? (
        <section className="bg-white py-20">
          <div className="vw-wrap text-center" data-testid="container-industry-groups-error">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-vw-graylight" />
            <p className="text-vw-gray" data-testid="text-industry-groups-error">
              {t.errorMessage}
            </p>
          </div>
        </section>
      ) : isLoading ? (
        <CapabilityGrid testId="grid-industry-groups-loading">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse bg-vw-graylight/40"
              data-testid={`skeleton-industry-group-${i}`}
            />
          ))}
        </CapabilityGrid>
      ) : (
        <CapabilityGrid testId="grid-industry-groups">
          {industryGroups?.map((group) => (
            <IndustryCard key={group.id} group={group} />
          ))}
        </CapabilityGrid>
      )}
    </div>
  );
}
