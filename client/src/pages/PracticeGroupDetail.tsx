import { Link, useParams } from "wouter";
import { useMemo } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import {
  CapabilityHero,
  CapabilityProse,
  RepresentativeMatters,
  RelatedAttorneys,
  CapabilityRankings,
  CapabilityContactCta,
  type CapabilityRankingItem,
} from "@/components/capabilities";
import type { PracticeGroup, TeamMember, RepresentativeMatterDb } from "@shared/schema";

/* ─────────────────────────────────────────────────────────────────────────
   Datos preservados de la implementación previa (rankings + mapeo de roles).
   ───────────────────────────────────────────────────────────────────────── */

const practiceRankingsData: Record<string, CapabilityRankingItem[]> = {
  "corporate-ma": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "IFLR1000", ranking: "Highly Regarded", rankingEs: "Altamente Reconocido", year: "2024", badgeType: "recommended" },
  ],
  "antitrust-competition": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GCR 100", ranking: "Elite", rankingEs: "Élite", year: "2024", badgeType: "star" },
    { publication: "Who's Who Legal", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
  "arbitration": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GAR 100", ranking: "Top 30 Worldwide", rankingEs: "Top 30 Mundial", year: "2024", badgeType: "star" },
    { publication: "Latin Lawyer 250", ranking: "Elite", rankingEs: "Élite", year: "2024", badgeType: "star" },
  ],
  "litigation": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "Benchmark Litigation", ranking: "Top Tier", rankingEs: "Top Tier", year: "2024", badgeType: "tier" },
  ],
  "investigations-anticorruption": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "GIR 100", ranking: "Top 100 Global", rankingEs: "Top 100 Global", year: "2024", badgeType: "star" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
  ],
  "bankruptcy-restructuring": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GRR 100", ranking: "Top 100 Global", rankingEs: "Top 100 Global", year: "2024", badgeType: "star" },
  ],
  "banking-finance": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "IFLR1000", ranking: "Highly Regarded", rankingEs: "Altamente Reconocido", year: "2024", badgeType: "recommended" },
  ],
  "energy-natural-resources": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "Who's Who Legal", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
  "esg": [
    { publication: "Chambers Latin America", ranking: "Ranked", rankingEs: "Clasificado", year: "2024", badgeType: "recommended" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "real-estate": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "intellectual-property": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "WTR 1000", ranking: "Silver", rankingEs: "Plata", year: "2024", badgeType: "recommended" },
  ],
  "labor-employment": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "tax": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "ITR World Tax", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "international-trade": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "telecommunications-media-technology": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "environmental": [
    { publication: "Chambers Latin America", ranking: "Band 3", rankingEs: "Banda 3", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "administrative-law": [
    { publication: "Chambers Latin America", ranking: "Ranked", rankingEs: "Clasificado", year: "2024", badgeType: "recommended" },
    { publication: "Legal 500", ranking: "Tier 3", rankingEs: "Tier 3", year: "2024", badgeType: "tier" },
  ],
  "german-desk": [
    { publication: "Legal 500", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
};

const practiceAreaRoleMapping: Record<string, string[]> = {
  "corporate-ma": ["Corporate & M&A", "Corporate, M&A & Pharmaceutical Co-Leader"],
  "antitrust-competition": ["Antitrust & Competition"],
  "arbitration": ["Arbitration", "Arbitration & Energy", "Founding Partner, Arbitration & Litigation Expert"],
  "litigation": ["Litigation"],
  "investigations-anticorruption": ["Investigations, Anti-corruption & Compliance"],
  "bankruptcy-restructuring": ["Bankruptcy & Restructuring"],
  "banking-finance": ["Banking & Finance"],
  "energy-natural-resources": ["Energy & Natural Resources", "Arbitration & Energy"],
  "esg": ["ESG"],
  "real-estate": ["Real Estate"],
  "intellectual-property": ["Intellectual Property"],
  "labor-employment": ["Labor & Employment"],
  "tax": ["Tax", "Tax Practice"],
  "international-trade": ["International Trade"],
  "telecommunications-media-technology": ["Telecommunications, Media & Technology"],
  "environmental": ["Environmental"],
  "administrative-law": ["Administrative Law"],
  "german-desk": ["German Desk"],
};

export default function PracticeGroupDetail() {
  const { language } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: practiceGroup, isLoading, error } = useQuery<PracticeGroup>({
    queryKey: [`/api/practice-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: allTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: representativeMatters } = useQuery<RepresentativeMatterDb[]>({
    queryKey: ["/api/practice-groups", slug, "representative-matters"],
    enabled: !!slug,
  });

  const translations: Record<string, {
    backToAll: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    ourTeam: string;
    partners: string;
    ofCounsel: string;
    associates: string;
    viewAll: string;
    rankingsTitle: string;
    rankingsSubtitle: string;
    successCasesTitle: string;
    successCasesSubtitle: string;
    errorMessage: string;
    overview: string;
    featured: string;
    client: string;
  }> = {
    en: { backToAll: "All Practice Groups", contactCta: "Contact our team", contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges.", emailUs: "Email Us", callUs: "Call Us", ourTeam: "Our Team", partners: "Partners", ofCounsel: "Of Counsel", associates: "Associates", viewAll: "View all", rankingsTitle: "Rankings & Recognition", rankingsSubtitle: "Recognized by leading legal directories worldwide", successCasesTitle: "Success Cases", successCasesSubtitle: "Representative matters", errorMessage: "Practice group not found", overview: "Overview", featured: "Featured", client: "Client:" },
    es: { backToAll: "Todas las Áreas de Práctica", contactCta: "Contacte a nuestro equipo", contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar sus desafíos legales.", emailUs: "Enviar Email", callUs: "Llamar", ourTeam: "Nuestro Equipo", partners: "Socios", ofCounsel: "Of Counsel", associates: "Asociados", viewAll: "Ver todos", rankingsTitle: "Rankings y Reconocimientos", rankingsSubtitle: "Reconocidos por los principales directorios legales del mundo", successCasesTitle: "Casos de Éxito", successCasesSubtitle: "Casos representativos", errorMessage: "Área de práctica no encontrada", overview: "Resumen", featured: "Destacado", client: "Cliente:" },
  };

  const t = translations[language] || translations.en;

  const filteredAndGroupedMembers = useMemo(() => {
    if (!allTeamMembers || !slug) return { partners: [], ofCounsel: [], associates: [] };

    const roleMatches = practiceAreaRoleMapping[slug] || [];

    const matchingMembers = allTeamMembers.filter((member) =>
      roleMatches.some(
        (role) =>
          member.role.toLowerCase().includes(role.toLowerCase()) ||
          role.toLowerCase().includes(member.role.toLowerCase()),
      ),
    );

    const partners = matchingMembers.filter((m) => m.isPartner);
    const ofCounsel = matchingMembers.filter((m) => m.title === "Of Counsel");
    const associates = matchingMembers.filter((m) => m.title === "Associate");

    return { partners, ofCounsel, associates };
  }, [allTeamMembers, slug]);

  const practiceRankings = slug ? practiceRankingsData[slug] || [] : [];

  /* ── Estados de error / carga ───────────────────────────────────────── */

  if (error) {
    return (
      <div data-testid="page-practice-group-error">
        <div className="vw-wrap py-24 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-vw-graylight" />
          <h2 className="mb-6 font-serif text-2xl text-vw-black" data-testid="text-error-title">
            {t.errorMessage}
          </h2>
          <Link
            href="/practice-groups"
            className="inline-flex items-center gap-2 vw-label text-xs text-vw-red"
            data-testid="button-back-to-practice-groups"
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
      <div data-testid="page-practice-group-loading">
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

  /* ── Resolución de nombre/descripción (i18n estático EN/ES) ──────────── */

  const displayName = getDisplayValue(practiceGroup, "name", language);

  const displayDescription =
    getDisplayValue(practiceGroup, "fullDescription", language) ||
    getDisplayValue(practiceGroup, "description", language);

  const hasTeam =
    filteredAndGroupedMembers.partners.length > 0 ||
    filteredAndGroupedMembers.ofCounsel.length > 0 ||
    filteredAndGroupedMembers.associates.length > 0;

  return (
    <div data-testid="page-practice-group-detail">
      <CapabilityHero
        eyebrow={t.overview}
        title={displayName || practiceGroup?.name || ""}
        backLabel={t.backToAll}
        backHref="/practice-groups"
        testId="section-practice-group-hero"
      />

      {displayDescription && (
        <CapabilityProse
          text={displayDescription}
          testId="section-practice-group-description"
        />
      )}

      {representativeMatters && representativeMatters.length > 0 && (
        <RepresentativeMatters
          matters={representativeMatters}
          language={language}
          t={{
            title: t.successCasesTitle,
            subtitle: t.successCasesSubtitle,
            featured: t.featured,
            client: t.client,
          }}
        />
      )}

      {practiceRankings.length > 0 && (
        <CapabilityRankings
          items={practiceRankings}
          language={language}
          title={t.rankingsTitle}
          subtitle={t.rankingsSubtitle}
        />
      )}

      {hasTeam && (
        <RelatedAttorneys
          groups={filteredAndGroupedMembers}
          language={language}
          practiceSlug={slug}
          t={{
            ourTeam: t.ourTeam,
            partners: t.partners,
            ofCounsel: t.ofCounsel,
            associates: t.associates,
            viewAll: t.viewAll,
          }}
        />
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
