import { Link, useParams } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import {
  CapabilityHero,
  CapabilityProse,
  SectionTitle,
  CapabilityContactCta,
} from "@/components/capabilities";
import type { IndustryGroup, PracticeGroup } from "@shared/schema";

/**
 * IndustryGroupDetail — detalle de industria en el look viejo.
 *
 * Conserva el data-fetching: `/api/industry-groups/:slug` + `/api/practice-groups`
 * (para las prácticas relacionadas) y la traducción campo a campo.
 */

interface RelatedPracticeRowProps {
  practiceGroup: PracticeGroup;
  language: string;
}

function RelatedPracticeRow({ practiceGroup, language }: RelatedPracticeRowProps) {
  const displayName = getDisplayValue(practiceGroup, "name", language) ?? "";

  return (
    <li data-testid={`related-practice-${practiceGroup.slug}`}>
      <Link
        href={`/practice-groups/${practiceGroup.slug}`}
        className="group flex items-center justify-between gap-4 border-l-2 border-l-vw-red/40 bg-white py-4 pl-5 pr-3 transition-colors hover:border-l-vw-red"
      >
        <span className="min-w-0 truncate font-serif text-base text-vw-black transition-colors group-hover:text-vw-red">
          {displayName}
        </span>
        <span className="shrink-0 vw-label text-[10px] text-vw-gray">
          {language === "es" ? "Ver" : "View"} →
        </span>
      </Link>
    </li>
  );
}

export default function IndustryGroupDetail() {
  const { language } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: industryGroup, isLoading, error } = useQuery<IndustryGroup>({
    queryKey: [`/api/industry-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const relatedRef = useFadeOnScroll<HTMLDivElement>();

  const translations: Record<string, {
    backToAll: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    relatedServices: string;
    errorMessage: string;
    aboutIndustry: string;
  }> = {
    en: { backToAll: "All Industry Groups", contactCta: "Contact our team", contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges in this industry.", emailUs: "Email Us", callUs: "Call Us", relatedServices: "Related Practice Areas", errorMessage: "Industry group not found", aboutIndustry: "About This Industry" },
    es: { backToAll: "Todas las Industrias", contactCta: "Contacte a nuestro equipo", contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar los desafíos legales de esta industria.", emailUs: "Enviar Email", callUs: "Llamar", relatedServices: "Áreas de Práctica Relacionadas", errorMessage: "Industria no encontrada", aboutIndustry: "Acerca de esta Industria" },
  };

  const t = translations[language] || translations.en;

  if (error) {
    return (
      <div data-testid="page-industry-group-error">
        <div className="vw-wrap py-24 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-vw-graylight" />
          <h2 className="mb-6 font-serif text-2xl text-vw-black" data-testid="text-error-title">
            {t.errorMessage}
          </h2>
          <Link
            href="/industry-groups"
            className="inline-flex items-center gap-2 vw-label text-xs text-vw-red"
            data-testid="button-back-to-industry-groups"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToAll}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div data-testid="page-industry-group-loading">
        <div className="vw-wrap py-24">
          <div className="mb-6 h-5 w-48 animate-pulse bg-vw-graylight/50" />
          <div className="h-12 w-64 animate-pulse bg-vw-graylight/50" />
          <div className="mt-10 space-y-4">
            <div className="h-6 w-full animate-pulse bg-vw-graylight/40" />
            <div className="h-6 w-3/4 animate-pulse bg-vw-graylight/40" />
            <div className="h-6 w-5/6 animate-pulse bg-vw-graylight/40" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = getDisplayValue(industryGroup, "name", language) ?? "";
  const displayDescription =
    getDisplayValue(industryGroup, "fullDescription", language) ||
    getDisplayValue(industryGroup, "description", language);

  const relatedPracticeGroups = practiceGroups?.slice(0, 4);

  return (
    <div data-testid="page-industry-group-detail">
      <CapabilityHero
        eyebrow={t.aboutIndustry}
        title={displayName}
        backLabel={t.backToAll}
        backHref="/industry-groups"
        testId="section-industry-group-hero"
      />

      {displayDescription && (
        <CapabilityProse
          text={displayDescription}
          testId="section-industry-group-description"
        />
      )}

      {relatedPracticeGroups && relatedPracticeGroups.length > 0 && (
        <section className="bg-vw-graylight/20 py-16 lg:py-20" data-testid="section-related-services">
          <div className="vw-wrap max-w-4xl">
            <div ref={relatedRef} className="vw-fade">
              <SectionTitle testId="text-related-services-title">
                {t.relatedServices}
              </SectionTitle>
              <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="list-related-practices">
                {relatedPracticeGroups.map((practiceGroup) => (
                  <RelatedPracticeRow
                    key={practiceGroup.id}
                    practiceGroup={practiceGroup}
                    language={language}
                  />
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <CapabilityContactCta
        title={t.contactCta}
        subtitle={t.contactSubtitle}
        emailLabel={t.emailUs}
        callLabel={t.callUs}
      />
    </div>
  );
}
