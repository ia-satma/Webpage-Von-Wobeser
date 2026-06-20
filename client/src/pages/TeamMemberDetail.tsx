import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PersonJsonLd, BreadcrumbJsonLd } from "@/components/JsonLdSchema";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { AttorneySidebar, AttorneyBio, type AttorneySidebarLabels } from "@/components/team";
import type {
  TeamMember,
  PracticeGroup,
  IndustryGroup,
  Education,
  Affiliation,
  Ranking,
  Publication,
  RepresentativeMatter,
  BarAdmission,
  News,
  LanguageCode,
} from "@shared/schema";

/* ──────────────────────────────────────────────────────────────────────────
   Imagen de noticia con fallback (preservada de la versión anterior).
   ────────────────────────────────────────────────────────────────────────── */
function NewsImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center bg-vw-graylight ${className}`}>
        <span className="font-serif text-4xl tracking-[0.18em] text-vw-gray/60">VWS</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-componentes de detalle con i18n estático EN/ES.
   Cada item de las arrays anidadas (education[], affiliations[], …) trae su
   variante `*Es`; getDisplayValue elige el campo correcto según idioma.
   ────────────────────────────────────────────────────────────────────────── */
function DetailSection({
  title,
  children,
  delayIndex = 0,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  delayIndex?: number;
  testId?: string;
}) {
  const ref = useFadeOnScroll<HTMLElement>();
  return (
    <section
      ref={ref}
      className="vw-fade pt-10"
      style={{ transitionDelay: `${delayIndex * 0.05}s` }}
      data-testid={testId}
    >
      <h2 className="vw-section-title text-vw-gray">{title}</h2>
      {children}
    </section>
  );
}

function EducationItemTranslated({
  edu,
  index,
  language,
}: {
  edu: Education;
  index: number;
  language: LanguageCode;
}) {
  const displayDegree = getDisplayValue(edu, "degree", language) ?? "";
  const displaySchool = getDisplayValue(edu, "school", language);

  return (
    <li className="flex items-baseline gap-3" data-testid={`item-education-${index}`}>
      <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
      <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
        <span className="text-vw-gray">{displayDegree}</span>
        {displaySchool && <span className="text-vw-gray/70">{` — ${displaySchool}`}</span>}
        {edu.year && <span className="text-vw-gray/60">{` (${edu.year})`}</span>}
      </span>
    </li>
  );
}

function AffiliationItemTranslated({
  affiliation,
  index,
  language,
}: {
  affiliation: Affiliation;
  index: number;
  language: LanguageCode;
}) {
  const displayOrganization = getDisplayValue(affiliation, "organization", language) ?? "";
  const displayRole = getDisplayValue(affiliation, "role", language) || null;

  return (
    <li className="flex items-baseline gap-3" data-testid={`item-affiliation-${index}`}>
      <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
      <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
        {displayOrganization}
        {displayRole && <span className="text-vw-gray/60">{` — ${displayRole}`}</span>}
      </span>
    </li>
  );
}

function PublicationItemTranslated({
  pub,
  index,
  language,
  viewPublicationText,
}: {
  pub: Publication;
  index: number;
  language: LanguageCode;
  viewPublicationText: string;
}) {
  const displayTitle = getDisplayValue(pub, "title", language) ?? "";

  return (
    <li className="flex items-baseline gap-3" data-testid={`item-publication-${index}`}>
      <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
      <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
        <span className="text-vw-gray">{displayTitle}</span>
        {pub.journal && <span className="text-vw-gray/60">{` — ${pub.journal}`}</span>}
        {pub.year && <span className="text-vw-gray/60">{` (${pub.year})`}</span>}
        {pub.url && (
          <>
            {" "}
            <a
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-vw-red hover:underline"
            >
              {viewPublicationText}
            </a>
          </>
        )}
      </span>
    </li>
  );
}

function RepresentativeMatterTranslated({
  matter,
  index,
  language,
}: {
  matter: RepresentativeMatter;
  index: number;
  language: LanguageCode;
}) {
  const displayDescription = getDisplayValue(matter, "description", language) ?? "";

  return (
    <li className="flex items-baseline gap-3" data-testid={`item-representative-matter-${index}`}>
      <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
      <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
        {displayDescription}
        {(matter.client || matter.year) && (
          <span className="text-vw-gray/60">
            {` — `}
            {matter.client && <span>{matter.client}</span>}
            {matter.client && matter.year && <span>{`, `}</span>}
            {matter.year && <span>{matter.year}</span>}
          </span>
        )}
      </span>
    </li>
  );
}

function RankingItemTranslated({
  ranking,
  index,
  language,
}: {
  ranking: Ranking;
  index: number;
  language: LanguageCode;
}) {
  const displayRanking = getDisplayValue(ranking, "ranking", language);
  const displayArea = getDisplayValue(ranking, "area", language);

  return (
    <li className="flex items-baseline gap-3" data-testid={`item-ranking-${index}`}>
      <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
      <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
        <span className="text-vw-gray">{ranking.publication}</span>
        {displayRanking && <span className="text-vw-gray/70">{` — ${displayRanking}`}</span>}
        {displayArea && <span className="text-vw-gray/60">{`, ${displayArea}`}</span>}
        {ranking.year && <span className="text-vw-gray/60">{` (${ranking.year})`}</span>}
      </span>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Página de detalle.
   ────────────────────────────────────────────────────────────────────────── */
export default function TeamMemberDetail() {
  const { language } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: member, isLoading, error } = useQuery<TeamMember>({
    queryKey: [`/api/team/${slug}`],
    enabled: !!slug,
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const { data: relatedNews } = useQuery<News[]>({
    queryKey: ["/api/team", slug, "news"],
    enabled: !!slug,
  });

  const introRef = useFadeOnScroll<HTMLDivElement>();

  const content: Record<string, {
    backToAll: string;
    partner: string;
    ofCounsel: string;
    associate: string;
    practiceAreas: string;
    industryGroups: string;
    education: string;
    barAdmissions: string;
    languages: string;
    affiliations: string;
    rankings: string;
    publications: string;
    representativeMatters: string;
    experience: string;
    downloadVCard: string;
    errorMessage: string;
    relatedNews: string;
    readMore: string;
    viewPublication: string;
    breadcrumbHome: string;
    breadcrumbTeam: string;
    translationPending: string;
  }> = {
    en: {
      backToAll: "All Attorneys",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associate",
      practiceAreas: "Practices",
      industryGroups: "Industry Groups",
      education: "Education & Experience",
      barAdmissions: "Bar Admissions",
      languages: "Languages",
      affiliations: "Affiliations & Academic Activities",
      rankings: "Recognitions",
      publications: "Articles",
      representativeMatters: "Representative Matters",
      experience: "Professional Experience",
      downloadVCard: "Download vCard",
      errorMessage: "Attorney not found",
      relatedNews: "News",
      readMore: "Read More",
      viewPublication: "View Publication",
      breadcrumbHome: "Home",
      breadcrumbTeam: "Attorneys",
      translationPending: "Loading translation...",
    },
    es: {
      backToAll: "Todos los Abogados",
      partner: "Socio",
      ofCounsel: "Of Counsel",
      associate: "Asociado",
      practiceAreas: "Prácticas",
      industryGroups: "Grupos Industriales",
      education: "Formación y Experiencia",
      barAdmissions: "Admisiones al Colegio",
      languages: "Idiomas",
      affiliations: "Afiliaciones y Actividades Académicas",
      rankings: "Reconocimientos",
      publications: "Artículos",
      representativeMatters: "Asuntos Representativos",
      experience: "Experiencia Profesional",
      downloadVCard: "Descargar vCard",
      errorMessage: "Abogado no encontrado",
      relatedNews: "Noticias",
      readMore: "Leer Más",
      viewPublication: "Ver Publicación",
      breadcrumbHome: "Inicio",
      breadcrumbTeam: "Abogados",
      translationPending: "Cargando...",
    },
  };

  const t = content[language] || content.en;

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const localeMap: Record<string, string> = {
      en: "en-US",
      es: "es-MX",
    };
    return d.toLocaleDateString(localeMap[language] || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSeniorityLabel = () => {
    if (member?.isPartner) return t.partner;
    if (member?.title === "Of Counsel") return t.ofCounsel;
    return t.associate;
  };

  const handleDownloadVCard = () => {
    if (member) {
      window.location.href = `/api/team/${member.slug}/vcard?lang=${language}`;
    }
  };

  const processedRankings = useMemo(() => {
    if (!member?.rankings || member.rankings.length === 0) return null;
    return member.rankings as Ranking[];
  }, [member?.rankings]);

  const getMemberEducation = () => {
    if (!member?.education || member.education.length === 0) return undefined;
    return (member.education as Education[]).map((edu) => ({
      school: getDisplayValue(edu, "school", language) ?? "",
      degree: getDisplayValue(edu, "degree", language) ?? "",
      year: edu.year,
    }));
  };

  const getMemberKnowsAbout = () => {
    const areas: string[] = [];
    if (practiceGroups && member) {
      practiceGroups.forEach((pg) => {
        const name = getDisplayValue(pg, "name", language);
        if (name) areas.push(name);
      });
    }
    return areas.length > 0 ? areas.slice(0, 10) : undefined;
  };

  /* ── Error ───────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="vw-wrap py-24 text-center" data-testid="page-team-member-error">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-vw-gray/40" />
        <h2 className="mb-6 font-serif text-2xl text-vw-gray" data-testid="text-error-title">
          {t.errorMessage}
        </h2>
        <Link
          href="/team"
          className="inline-flex items-center gap-2 font-label text-[12px] uppercase tracking-[0.2em] text-vw-red hover:opacity-70"
          data-testid="button-back-to-team"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToAll}
        </Link>
      </div>
    );
  }

  /* ── Cargando ────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="vw-wrap py-16" data-testid="page-team-member-loading">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[340px_1fr]">
          <div className="aspect-[4/5] w-full animate-pulse bg-vw-graylight" />
          <div className="space-y-4 pt-8">
            <div className="h-8 w-2/3 animate-pulse bg-vw-graylight" />
            <div className="h-5 w-full animate-pulse bg-vw-graylight" />
            <div className="h-5 w-5/6 animate-pulse bg-vw-graylight" />
            <div className="h-5 w-3/4 animate-pulse bg-vw-graylight" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Cargo / bio resueltos por idioma (i18n estático EN/ES) ──────────── */
  const displayTitle = getDisplayValue(member, "title", language) ?? null;
  const displayBio = getDisplayValue(member, "bio", language) ?? null;

  // Partición intro/cuerpo (preservada de la versión anterior).
  const bioParagraphs = displayBio
    ? displayBio.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean)
    : [];
  const [bioIntro, ...bioRest] = bioParagraphs.length
    ? bioParagraphs
    : displayBio
    ? [displayBio]
    : [];

  const sidebarLabels: AttorneySidebarLabels = {
    role: getSeniorityLabel(),
    practiceAreas: t.practiceAreas,
    industryGroups: t.industryGroups,
    downloadVCard: t.downloadVCard,
  };

  return (
    <div data-testid="page-team-member-detail">
      {member && (
        <>
          <PersonJsonLd
            name={member.name}
            jobTitle={displayTitle || member.title}
            email={member.email}
            telephone={member.phone}
            imageUrl={member.imageUrl}
            url={`https://www.vonwobeser.com/team/${member.slug}`}
            linkedinUrl={member.linkedinUrl}
            education={getMemberEducation()}
            languages={member.languages as string[] | undefined}
            knowsAbout={getMemberKnowsAbout()}
            language={language}
          />
          <BreadcrumbJsonLd
            items={[
              { name: t.breadcrumbHome, url: "https://www.vonwobeser.com" },
              { name: t.breadcrumbTeam, url: "https://www.vonwobeser.com/team" },
              { name: member.name, url: `https://www.vonwobeser.com/team/${member.slug}` },
            ]}
            language={language}
          />
        </>
      )}

      <div className="vw-wrap pb-24 pt-28">
        {/* Volver al listado */}
        <Link
          href="/team"
          className="mb-8 inline-flex items-center gap-2 font-label text-[12px] uppercase tracking-[0.2em] text-vw-gray/60 transition-colors hover:text-vw-red"
          data-testid="link-back-to-team"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToAll}
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
          {/* Sidebar gris */}
          {member && (
            <AttorneySidebar
              member={member}
              displayTitle={displayTitle}
              practiceGroups={practiceGroups?.slice(0, 8)}
              industryGroups={industryGroups?.slice(0, 6)}
              language={language}
              labels={sidebarLabels}
              onDownloadVCard={handleDownloadVCard}
            />
          )}

          {/* Columna de contenido */}
          <div className="min-w-0">
            {/* Intro + biografía */}
            {displayBio && (
              <div ref={introRef} className="vw-fade" data-testid="section-biography">
                <AttorneyBio
                  intro={bioIntro || ""}
                  body={bioRest}
                />
              </div>
            )}

            {/* Educación y experiencia */}
            {member?.education && member.education.length > 0 && (
              <DetailSection title={t.education} delayIndex={0} testId="section-education">
                <ul className="space-y-2.5">
                  {(member.education as Education[]).map((edu, index) => (
                    <EducationItemTranslated
                      key={index}
                      edu={edu}
                      index={index}
                      language={language}
                    />
                  ))}
                </ul>
              </DetailSection>
            )}

            {/* Admisiones */}
            {member?.barAdmissions && member.barAdmissions.length > 0 && (
              <DetailSection title={t.barAdmissions} delayIndex={1} testId="section-bar-admissions">
                <ul className="space-y-2.5">
                  {(member.barAdmissions as BarAdmission[]).map((admission, index) => {
                    const jurisdiction = getDisplayValue(admission, "jurisdiction", language);
                    return (
                      <li
                        key={index}
                        className="flex items-baseline gap-3"
                        data-testid={`item-bar-admission-${index}`}
                      >
                        <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
                        <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
                          {jurisdiction}
                          {admission.year && (
                            <span className="text-vw-gray/60">{` (${admission.year})`}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </DetailSection>
            )}

            {/* Afiliaciones */}
            {member?.affiliations && member.affiliations.length > 0 && (
              <DetailSection title={t.affiliations} delayIndex={2} testId="section-affiliations">
                <ul className="space-y-2.5">
                  {(member.affiliations as Affiliation[]).map((affiliation, index) => (
                    <AffiliationItemTranslated
                      key={index}
                      affiliation={affiliation}
                      index={index}
                      language={language}
                    />
                  ))}
                </ul>
              </DetailSection>
            )}

            {/* Reconocimientos */}
            {processedRankings && processedRankings.length > 0 && (
              <DetailSection title={t.rankings} delayIndex={3} testId="section-rankings">
                <ul className="space-y-2.5">
                  {processedRankings.map((ranking, index) => (
                    <RankingItemTranslated
                      key={index}
                      ranking={ranking}
                      index={index}
                      language={language}
                    />
                  ))}
                </ul>
              </DetailSection>
            )}

            {/* Asuntos representativos */}
            {member?.representativeMatters && member.representativeMatters.length > 0 && (
              <DetailSection
                title={t.representativeMatters}
                delayIndex={4}
                testId="section-representative-matters"
              >
                <ul className="space-y-2.5">
                  {(member.representativeMatters as RepresentativeMatter[]).map((matter, index) => (
                    <RepresentativeMatterTranslated
                      key={index}
                      matter={matter}
                      index={index}
                      language={language}
                    />
                  ))}
                </ul>
              </DetailSection>
            )}

            {/* Publicaciones / artículos */}
            {member?.publications && member.publications.length > 0 && (
              <DetailSection title={t.publications} delayIndex={5} testId="section-publications">
                <ul className="space-y-2.5">
                  {(member.publications as Publication[]).map((pub, index) => (
                    <PublicationItemTranslated
                      key={index}
                      pub={pub}
                      index={index}
                      language={language}
                      viewPublicationText={t.viewPublication}
                    />
                  ))}
                </ul>
              </DetailSection>
            )}

            {/* Experiencia profesional */}
            {member?.experience && member.experience.length > 0 && (
              <DetailSection title={t.experience} delayIndex={6} testId="section-experience">
                <ul className="space-y-2.5">
                  {(member.experience as any[]).map((exp, index) => (
                    <li
                      key={index}
                      className="flex items-baseline gap-3"
                      data-testid={`item-experience-${index}`}
                    >
                      <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 bg-vw-red" />
                      <span className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
                        <span className="text-vw-gray">
                          {getDisplayValue(exp, "position", language)}
                        </span>
                        {exp.company && <span className="text-vw-gray/70">{` — ${exp.company}`}</span>}
                        {(exp.startYear || exp.endYear) && (
                          <span className="text-vw-gray/60">
                            {` (${exp.startYear}${exp.endYear ? ` - ${exp.endYear}` : " - Present"})`}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}

            {/* Idiomas */}
            {member?.languages && member.languages.length > 0 && (
              <DetailSection title={t.languages} delayIndex={7} testId="section-languages">
                <p className="font-sans text-[15px] leading-relaxed text-vw-gray/90">
                  {(member.languages as string[]).join(", ")}
                </p>
              </DetailSection>
            )}
          </div>
        </div>

        {/* Noticias relacionadas */}
        {relatedNews && relatedNews.length > 0 && (
          <section className="mt-20 border-t border-vw-graylight pt-12" data-testid="section-related-news">
            <h2 className="vw-section-title text-vw-gray">{t.relatedNews}</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {relatedNews.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                  <div data-testid={`card-related-news-${article.slug}`}>
                    <div className="relative h-48 overflow-hidden bg-vw-graylight">
                      <NewsImageWithFallback
                        src={article.imageUrl || ""}
                        alt={getDisplayValue(article, "title", language) ?? ""}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="pt-4">
                      <div className="mb-2 flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.18em] text-vw-gray/50">
                        <Calendar className="h-3.5 w-3.5" />
                        <span data-testid={`text-news-date-${article.slug}`}>
                          {formatDate(article.date)}
                        </span>
                      </div>
                      <h3
                        className="font-serif text-[20px] leading-snug text-vw-gray transition-colors group-hover:text-vw-red"
                        data-testid={`text-news-title-${article.slug}`}
                      >
                        {getDisplayValue(article, "title", language)}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.18em] text-vw-red">
                        {t.readMore}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
