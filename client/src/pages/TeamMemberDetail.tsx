import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, AlertCircle, Loader2, Calendar, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PersonJsonLd, BreadcrumbJsonLd } from "@/components/JsonLdSchema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
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
   Sub-componentes de detalle con traducción on-demand.
   La capa de datos (useTranslatedContent) se preserva intacta; solo cambia
   la presentación a los tokens del look viejo.
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
  memberId,
}: {
  edu: Education;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: "team_member",
    entityId: `${memberId}_edu_${index}`,
    fields: { degree: edu.degreeEs || edu.degree, degreeEs: edu.degreeEs },
    enabled: language !== "es",
  });

  const displayDegree =
    language === "es" && edu.degreeEs
      ? edu.degreeEs
      : translatedFields.degree || edu.degreeEs || edu.degree;
  const displaySchool = language === "es" && edu.schoolEs ? edu.schoolEs : edu.school;

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
  memberId,
}: {
  affiliation: Affiliation;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: "team_member",
    entityId: `${memberId}_affil_${index}`,
    fields: {
      organization: affiliation.organizationEs || affiliation.organization,
      organizationEs: affiliation.organizationEs,
      role: affiliation.roleEs || affiliation.role,
      roleEs: affiliation.roleEs,
    },
    enabled: language !== "es",
  });

  const displayOrganization =
    language === "es" && affiliation.organizationEs
      ? affiliation.organizationEs
      : translatedFields.organization || affiliation.organizationEs || affiliation.organization;

  const displayRole = affiliation.role
    ? language === "es" && affiliation.roleEs
      ? affiliation.roleEs
      : translatedFields.role || affiliation.roleEs || affiliation.role
    : null;

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
  memberId,
  viewPublicationText,
}: {
  pub: Publication;
  index: number;
  language: LanguageCode;
  memberId: string;
  viewPublicationText: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: "team_member",
    entityId: `${memberId}_pub_${index}`,
    fields: { title: pub.titleEs || pub.title, titleEs: pub.titleEs },
    enabled: language !== "es",
  });

  const displayTitle =
    language === "es" && pub.titleEs
      ? pub.titleEs
      : translatedFields.title || pub.titleEs || pub.title;

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
  memberId,
}: {
  matter: RepresentativeMatter;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: "team_member",
    entityId: `${memberId}_matter_${index}`,
    fields: {
      description: matter.descriptionEs || matter.description,
      descriptionEs: matter.descriptionEs,
    },
    enabled: language !== "es",
  });

  const displayDescription =
    language === "es" && matter.descriptionEs
      ? matter.descriptionEs
      : translatedFields.description || matter.descriptionEs || matter.description;

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
  memberId,
}: {
  ranking: Ranking;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: "team_member",
    entityId: `${memberId}_ranking_${index}`,
    fields: {
      ranking: ranking.rankingEs || ranking.ranking,
      rankingEs: ranking.rankingEs,
      area: ranking.areaEs || ranking.area,
      areaEs: ranking.areaEs,
    },
    enabled: language !== "es",
  });

  const displayRanking =
    language === "es" && ranking.rankingEs
      ? ranking.rankingEs
      : translatedFields.ranking || ranking.rankingEs || ranking.ranking;
  const displayArea =
    language === "es" && ranking.areaEs
      ? ranking.areaEs
      : translatedFields.area || ranking.areaEs || ranking.area;

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

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: "team_member",
    entityId: member?.id?.toString() || "",
    fields: {
      title: member?.titleEs || member?.title,
      titleEs: member?.titleEs,
      role: member?.roleEs || member?.role,
      roleEs: member?.roleEs,
      bio: member?.bioEs || member?.bio,
      bioEs: member?.bioEs,
    },
    enabled: !!member && !!member.bio && language !== "es",
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
      translationPending: "Cargando traducción...",
    },
    de: {
      backToAll: "Alle Anwälte",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associate",
      practiceAreas: "Praxisbereiche",
      industryGroups: "Branchengruppen",
      education: "Ausbildung & Erfahrung",
      barAdmissions: "Zulassungen",
      languages: "Sprachen",
      affiliations: "Verbände & Akademische Aktivitäten",
      rankings: "Auszeichnungen",
      publications: "Artikel",
      representativeMatters: "Referenzmandate",
      experience: "Erfahrung",
      downloadVCard: "vCard herunterladen",
      errorMessage: "Anwalt nicht gefunden",
      relatedNews: "Nachrichten",
      readMore: "Mehr lesen",
      viewPublication: "Publikation ansehen",
      breadcrumbHome: "Startseite",
      breadcrumbTeam: "Anwälte",
      translationPending: "Übersetzung lädt...",
    },
    zh: {
      backToAll: "所有律师",
      partner: "合伙人",
      ofCounsel: "法律顾问",
      associate: "律师",
      practiceAreas: "业务领域",
      industryGroups: "行业领域",
      education: "教育背景与经历",
      barAdmissions: "执业资格",
      languages: "语言",
      affiliations: "专业协会与学术活动",
      rankings: "认可",
      publications: "文章",
      representativeMatters: "代表案例",
      experience: "工作经历",
      downloadVCard: "下载名片",
      errorMessage: "未找到律师",
      relatedNews: "新闻",
      readMore: "阅读更多",
      viewPublication: "查看出版物",
      breadcrumbHome: "首页",
      breadcrumbTeam: "律师",
      translationPending: "翻译加载中...",
    },
    ko: {
      backToAll: "모든 변호사",
      partner: "파트너",
      ofCounsel: "고문",
      associate: "어소시에이트",
      practiceAreas: "업무 분야",
      industryGroups: "산업 분야",
      education: "학력 및 경력",
      barAdmissions: "변호사 자격",
      languages: "사용 언어",
      affiliations: "협회 및 학술 활동",
      rankings: "인정",
      publications: "아티클",
      representativeMatters: "대표 사건",
      experience: "경력",
      downloadVCard: "명함 다운로드",
      errorMessage: "변호사를 찾을 수 없습니다",
      relatedNews: "뉴스",
      readMore: "더 읽기",
      viewPublication: "출판물 보기",
      breadcrumbHome: "홈",
      breadcrumbTeam: "변호사",
      translationPending: "번역 로딩 중...",
    },
    ja: {
      backToAll: "すべての弁護士",
      partner: "パートナー",
      ofCounsel: "オブ・カウンセル",
      associate: "アソシエイト",
      practiceAreas: "取扱分野",
      industryGroups: "業界グループ",
      education: "学歴・経歴",
      barAdmissions: "弁護士資格",
      languages: "使用言語",
      affiliations: "所属団体・学術活動",
      rankings: "受賞歴",
      publications: "記事",
      representativeMatters: "代表的案件",
      experience: "経験",
      downloadVCard: "名刺をダウンロード",
      errorMessage: "弁護士が見つかりません",
      relatedNews: "ニュース",
      readMore: "続きを読む",
      viewPublication: "出版物を見る",
      breadcrumbHome: "ホーム",
      breadcrumbTeam: "弁護士",
      translationPending: "翻訳を読み込み中...",
    },
    ar: {
      backToAll: "جميع المحامين",
      partner: "شريك",
      ofCounsel: "مستشار قانوني",
      associate: "محامي",
      practiceAreas: "مجالات الممارسة",
      industryGroups: "المجموعات الصناعية",
      education: "التعليم والخبرة",
      barAdmissions: "تراخيص المحاماة",
      languages: "اللغات",
      affiliations: "العضويات والأنشطة الأكاديمية",
      rankings: "التقديرات",
      publications: "المقالات",
      representativeMatters: "القضايا التمثيلية",
      experience: "الخبرة",
      downloadVCard: "تحميل بطاقة العمل",
      errorMessage: "لم يتم العثور على المحامي",
      relatedNews: "الأخبار",
      readMore: "اقرأ المزيد",
      viewPublication: "عرض المنشور",
      breadcrumbHome: "الرئيسية",
      breadcrumbTeam: "المحامون",
      translationPending: "جاري تحميل الترجمة...",
    },
    ru: {
      backToAll: "Все юристы",
      partner: "Партнёр",
      ofCounsel: "Советник",
      associate: "Юрист",
      practiceAreas: "Области практики",
      industryGroups: "Отраслевые группы",
      education: "Образование и опыт",
      barAdmissions: "Адвокатские лицензии",
      languages: "Языки",
      affiliations: "Ассоциации и академическая деятельность",
      rankings: "Признание",
      publications: "Статьи",
      representativeMatters: "Показательные дела",
      experience: "Опыт",
      downloadVCard: "Скачать визитку",
      errorMessage: "Юрист не найден",
      relatedNews: "Новости",
      readMore: "Читать далее",
      viewPublication: "Смотреть публикацию",
      breadcrumbHome: "Главная",
      breadcrumbTeam: "Юристы",
      translationPending: "Загрузка перевода...",
    },
    fr: {
      backToAll: "Tous les avocats",
      partner: "Associé",
      ofCounsel: "Of Counsel",
      associate: "Collaborateur",
      practiceAreas: "Domaines de pratique",
      industryGroups: "Groupes sectoriels",
      education: "Formation et expérience",
      barAdmissions: "Inscriptions au barreau",
      languages: "Langues",
      affiliations: "Affiliations et activités académiques",
      rankings: "Distinctions",
      publications: "Articles",
      representativeMatters: "Affaires représentatives",
      experience: "Expérience",
      downloadVCard: "Télécharger vCard",
      errorMessage: "Avocat introuvable",
      relatedNews: "Actualités",
      readMore: "Lire la suite",
      viewPublication: "Voir la publication",
      breadcrumbHome: "Accueil",
      breadcrumbTeam: "Avocats",
      translationPending: "Traduction en cours...",
    },
    it: {
      backToAll: "Tutti gli avvocati",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associato",
      practiceAreas: "Aree di pratica",
      industryGroups: "Settori industriali",
      education: "Formazione ed esperienza",
      barAdmissions: "Iscrizioni all'albo",
      languages: "Lingue",
      affiliations: "Affiliazioni e attività accademiche",
      rankings: "Riconoscimenti",
      publications: "Articoli",
      representativeMatters: "Casi rappresentativi",
      experience: "Esperienza",
      downloadVCard: "Scarica vCard",
      errorMessage: "Avvocato non trovato",
      relatedNews: "Notizie",
      readMore: "Leggi di più",
      viewPublication: "Vedi pubblicazione",
      breadcrumbHome: "Home",
      breadcrumbTeam: "Avvocati",
      translationPending: "Caricamento traduzione...",
    },
  };

  const t = content[language] || content.en;

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const localeMap: Record<string, string> = {
      en: "en-US",
      es: "es-MX",
      de: "de-DE",
      zh: "zh-CN",
      ko: "ko-KR",
      ja: "ja-JP",
      ar: "ar-SA",
      ru: "ru-RU",
      fr: "fr-FR",
      it: "it-IT",
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
      school: language === "es" && edu.schoolEs ? edu.schoolEs : edu.school,
      degree: language === "es" && edu.degreeEs ? edu.degreeEs : edu.degree,
      year: edu.year,
    }));
  };

  const getMemberKnowsAbout = () => {
    const areas: string[] = [];
    if (practiceGroups && member) {
      practiceGroups.forEach((pg) => {
        areas.push(language === "es" ? pg.nameEs : pg.name);
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

  /* ── Cargo / bio resueltos por idioma (lógica preservada) ────────────── */
  const displayTitle =
    language === "es"
      ? member?.titleEs || member?.title
      : language === "en"
      ? member?.title
      : translatedFields.title || null;

  const displayBio =
    language === "es"
      ? member?.bioEs || member?.bio
      : language === "en"
      ? member?.bio
      : translatedFields.bio || null;

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

  const memberId = member?.id?.toString() || "";

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
            {(displayBio || ((member?.bio || member?.bioEs) && isTranslating)) && (
              <div ref={introRef} className="vw-fade" data-testid="section-biography">
                <AttorneyBio
                  intro={bioIntro || ""}
                  body={bioRest}
                  isTranslating={isTranslating}
                  translationPendingLabel={t.translationPending}
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
                      memberId={memberId}
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
                    const jurisdiction =
                      language === "es" && admission.jurisdictionEs
                        ? admission.jurisdictionEs
                        : admission.jurisdiction;
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
                      memberId={memberId}
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
                      memberId={memberId}
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
                      memberId={memberId}
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
                      memberId={memberId}
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
                          {language === "es" && exp.positionEs ? exp.positionEs : exp.position}
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
                        alt={language === "es" ? article.titleEs : article.title}
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
                        {language === "es" ? article.titleEs : article.title}
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
