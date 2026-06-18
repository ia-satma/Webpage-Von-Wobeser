import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import {
  AttorneyFilters,
  AttorneyGroup,
  type AttorneyFiltersLabels,
} from "@/components/team";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

// Map URL parameters to filter values
const urlTypeToFilter: Record<string, string> = {
  partners: "partners",
  "of-counsel": "ofcounsel",
  counsel: "ofcounsel",
  associates: "associates",
};

// Helper to get filter from URL search params
function getFilterFromURL(): string {
  if (typeof window === "undefined") return "all";
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");
  if (typeParam && urlTypeToFilter[typeParam]) {
    return urlTypeToFilter[typeParam];
  }
  return "all";
}

export default function Team() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  // Initialize filter directly from URL to avoid flash of unfiltered content
  const [filterSeniority, setFilterSeniority] = useState<string>(() => getFilterFromURL());
  const [filterLetter, setFilterLetter] = useState<string>("all");

  const heroRef = useFadeOnScroll<HTMLDivElement>();

  // Listen for URL changes to update filter (for SPA navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      setFilterSeniority(getFilterFromURL());
    };

    window.addEventListener("popstate", handleUrlChange);

    // Poll for URL changes (for SPA navigation that doesn't trigger popstate)
    let lastSearch = window.location.search;
    const checkUrlChange = setInterval(() => {
      if (window.location.search !== lastSearch) {
        lastSearch = window.location.search;
        setFilterSeniority(getFilterFromURL());
      }
    }, 100);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      clearInterval(checkUrlChange);
    };
  }, []);

  const { data: allTeamMembers, isLoading: isLoadingAll, error: errorAll } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  // Preserved (parity with previous data layer): groups fetched for future use.
  useQuery<PracticeGroup[]>({ queryKey: ["/api/practice-groups"] });
  useQuery<IndustryGroup[]>({ queryKey: ["/api/industry-groups"] });

  const content: Record<string, {
    title: string;
    subtitle: string;
    eyebrow: string;
    errorMessage: string;
    all: string;
    partnersOnly: string;
    ofCounsel: string;
    associates: string;
    viewProfile: string;
    searchPlaceholder: string;
    clearFilters: string;
    noResults: string;
    teamMembers: string;
    browseByLetter: string;
  }> = {
    en: {
      title: "Attorneys",
      subtitle: "Meet the experienced attorneys who make our firm a leader in legal excellence",
      eyebrow: "Our Team",
      errorMessage: "Failed to load team members",
      all: "All",
      partnersOnly: "Partners",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewProfile: "View Profile",
      searchPlaceholder: "Search by name...",
      clearFilters: "Clear filters",
      noResults: "No team members match your criteria",
      teamMembers: "team members",
      browseByLetter: "Browse by Last Name",
    },
    es: {
      title: "Abogados",
      subtitle: "Conozca a los experimentados abogados que hacen de nuestra firma un líder en excelencia legal",
      eyebrow: "Nuestro Equipo",
      errorMessage: "Error al cargar los miembros del equipo",
      all: "Todos",
      partnersOnly: "Socios",
      ofCounsel: "Of Counsel",
      associates: "Asociados",
      viewProfile: "Ver Perfil",
      searchPlaceholder: "Buscar por nombre...",
      clearFilters: "Limpiar filtros",
      noResults: "No hay miembros que coincidan con los criterios",
      teamMembers: "miembros del equipo",
      browseByLetter: "Buscar por Apellido",
    },
    de: {
      title: "Anwälte",
      subtitle: "Lernen Sie unsere Experten kennen",
      eyebrow: "Unser Team",
      errorMessage: "Teammitglieder konnten nicht geladen werden",
      all: "Alle",
      partnersOnly: "Partner",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewProfile: "Profil anzeigen",
      searchPlaceholder: "Suchen...",
      clearFilters: "Filter löschen",
      noResults: "Keine Ergebnisse gefunden",
      teamMembers: "Teammitglieder",
      browseByLetter: "Nach Nachname",
    },
    zh: {
      title: "律师",
      subtitle: "认识我们的专家",
      eyebrow: "我们的团队",
      errorMessage: "无法加载团队成员",
      all: "全部",
      partnersOnly: "合伙人",
      ofCounsel: "法律顾问",
      associates: "律师",
      viewProfile: "查看简介",
      searchPlaceholder: "搜索...",
      clearFilters: "清除筛选",
      noResults: "未找到结果",
      teamMembers: "团队成员",
      browseByLetter: "按姓氏浏览",
    },
    ko: {
      title: "변호사",
      subtitle: "전문가들을 만나보세요",
      eyebrow: "우리 팀",
      errorMessage: "팀원을 불러올 수 없습니다",
      all: "전체",
      partnersOnly: "파트너",
      ofCounsel: "고문",
      associates: "어소시에이트",
      viewProfile: "프로필 보기",
      searchPlaceholder: "검색...",
      clearFilters: "필터 초기화",
      noResults: "결과 없음",
      teamMembers: "팀원",
      browseByLetter: "성으로 찾기",
    },
    ja: {
      title: "弁護士",
      subtitle: "専門家をご紹介します",
      eyebrow: "私たちのチーム",
      errorMessage: "チームメンバーを読み込めませんでした",
      all: "すべて",
      partnersOnly: "パートナー",
      ofCounsel: "オブ・カウンセル",
      associates: "アソシエイト",
      viewProfile: "プロフィールを見る",
      searchPlaceholder: "検索...",
      clearFilters: "フィルターをクリア",
      noResults: "結果が見つかりません",
      teamMembers: "チームメンバー",
      browseByLetter: "姓で探す",
    },
    ar: {
      title: "المحامون",
      subtitle: "تعرف على خبرائنا",
      eyebrow: "فريقنا",
      errorMessage: "فشل في تحميل أعضاء الفريق",
      all: "الكل",
      partnersOnly: "الشركاء",
      ofCounsel: "مستشار قانوني",
      associates: "المحامون",
      viewProfile: "عرض الملف الشخصي",
      searchPlaceholder: "بحث...",
      clearFilters: "مسح الفلاتر",
      noResults: "لم يتم العثور على نتائج",
      teamMembers: "أعضاء الفريق",
      browseByLetter: "البحث بالاسم الأخير",
    },
    ru: {
      title: "Юристы",
      subtitle: "Познакомьтесь с нашими экспертами",
      eyebrow: "Наша команда",
      errorMessage: "Не удалось загрузить членов команды",
      all: "Все",
      partnersOnly: "Партнёры",
      ofCounsel: "Советник",
      associates: "Юристы",
      viewProfile: "Посмотреть профиль",
      searchPlaceholder: "Поиск...",
      clearFilters: "Сбросить фильтры",
      noResults: "Результаты не найдены",
      teamMembers: "членов команды",
      browseByLetter: "По фамилии",
    },
    fr: {
      title: "Avocats",
      subtitle: "Rencontrez nos experts",
      eyebrow: "Notre équipe",
      errorMessage: "Échec du chargement des membres de l'équipe",
      all: "Tous",
      partnersOnly: "Associés",
      ofCounsel: "Of Counsel",
      associates: "Collaborateurs",
      viewProfile: "Voir le profil",
      searchPlaceholder: "Rechercher...",
      clearFilters: "Effacer les filtres",
      noResults: "Aucun résultat trouvé",
      teamMembers: "membres de l'équipe",
      browseByLetter: "Par nom de famille",
    },
    it: {
      title: "Avvocati",
      subtitle: "Conosci i nostri esperti",
      eyebrow: "Il nostro team",
      errorMessage: "Impossibile caricare i membri del team",
      all: "Tutti",
      partnersOnly: "Partner",
      ofCounsel: "Of Counsel",
      associates: "Associate",
      viewProfile: "Vedi profilo",
      searchPlaceholder: "Cerca...",
      clearFilters: "Cancella filtri",
      noResults: "Nessun risultato trovato",
      teamMembers: "membri del team",
      browseByLetter: "Per cognome",
    },
  };

  const t = content[language] || content.en;

  const groupedMembers = useMemo(() => {
    if (!allTeamMembers) return { partners: [], ofCounsel: [], associates: [] };

    const applyTextFilters = (members: TeamMember[]) =>
      members.filter((m) => {
        if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterLetter !== "all" && !m.name.toUpperCase().startsWith(filterLetter)) return false;
        return true;
      });

    const byName = (a: TeamMember, b: TeamMember) => a.name.localeCompare(b.name);

    const isOfCounsel = (m: TeamMember) => m.title?.toLowerCase() === "of counsel";
    const allPartners = [...allTeamMembers.filter((m) => m.isPartner)].sort(byName);
    const allOfCounsel = [...allTeamMembers.filter((m) => !m.isPartner && isOfCounsel(m))].sort(byName);
    const allAssociates = [...allTeamMembers.filter((m) => !m.isPartner && !isOfCounsel(m))].sort(byName);

    return {
      partners: applyTextFilters(allPartners),
      ofCounsel: applyTextFilters(allOfCounsel),
      associates: applyTextFilters(allAssociates),
    };
  }, [allTeamMembers, searchQuery, filterLetter]);

  const showPartners = filterSeniority === "all" || filterSeniority === "partners";
  const showOfCounsel = filterSeniority === "all" || filterSeniority === "ofcounsel";
  const showAssociates = filterSeniority === "all" || filterSeniority === "associates";

  const totalVisible =
    (showPartners ? groupedMembers.partners.length : 0) +
    (showOfCounsel ? groupedMembers.ofCounsel.length : 0) +
    (showAssociates ? groupedMembers.associates.length : 0);

  const hasActiveFilters =
    !!searchQuery || filterSeniority !== "all" || filterLetter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterSeniority("all");
    setFilterLetter("all");
  };

  const filterLabels: AttorneyFiltersLabels = {
    searchPlaceholder: t.searchPlaceholder,
    all: t.all,
    partnersOnly: t.partnersOnly,
    ofCounsel: t.ofCounsel,
    associates: t.associates,
    clearFilters: t.clearFilters,
    resultsLabel: t.teamMembers,
    browseByLetter: t.browseByLetter,
  };

  return (
    <div data-testid="page-team">
      <SEOHead page="team" language={language} />

      {/* Hero */}
      <section className="bg-white pt-28 pb-10">
        <div className="vw-wrap" ref={heroRef}>
          <span className="font-label text-[12px] uppercase tracking-[0.3em] text-vw-red">
            {t.eyebrow}
          </span>
          <h1
            className="vw-hero-title mt-3 block text-vw-gray"
            data-testid="text-team-title"
          >
            {t.title}
          </h1>
          <p
            className="mt-4 max-w-2xl font-sans text-[16px] leading-relaxed text-vw-gray/70"
            data-testid="text-team-subtitle"
          >
            {t.subtitle}
          </p>
        </div>
      </section>

      <div className="vw-wrap pb-24">
        <AttorneyFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterSeniority={filterSeniority}
          onSeniorityChange={setFilterSeniority}
          filterLetter={filterLetter}
          onLetterChange={setFilterLetter}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          totalVisible={totalVisible}
          labels={filterLabels}
        />

        {errorAll ? (
          <div className="py-24 text-center" data-testid="container-team-error">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-vw-gray/40" />
            <p className="text-vw-gray" data-testid="text-team-error">
              {t.errorMessage}
            </p>
          </div>
        ) : isLoadingAll ? (
          <div className="space-y-px pt-10" data-testid="container-team-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-5 border-b border-vw-graylight py-7"
                data-testid={`skeleton-team-member-${i}`}
              >
                <div className="h-[92px] w-[92px] shrink-0 animate-pulse bg-vw-graylight" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 animate-pulse bg-vw-graylight" />
                  <div className="h-3 w-32 animate-pulse bg-vw-graylight" />
                </div>
              </div>
            ))}
          </div>
        ) : totalVisible === 0 ? (
          <div className="py-24 text-center" data-testid="container-team-empty">
            <Users className="mx-auto mb-4 h-12 w-12 text-vw-gray/30" />
            <p className="text-vw-gray">{t.noResults}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 font-label text-[12px] uppercase tracking-[0.2em] text-vw-red hover:opacity-70"
                data-testid="button-clear-empty"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="pt-4">
            {showPartners && (
              <AttorneyGroup
                eyebrow={t.eyebrow}
                title={t.partnersOnly}
                members={groupedMembers.partners}
                language={language}
                viewProfileLabel={t.viewProfile}
                testId="section-partners"
              />
            )}
            {showOfCounsel && (
              <AttorneyGroup
                eyebrow={t.ofCounsel}
                title={t.ofCounsel}
                members={groupedMembers.ofCounsel}
                language={language}
                viewProfileLabel={t.viewProfile}
                testId="section-ofcounsel"
              />
            )}
            {showAssociates && (
              <AttorneyGroup
                eyebrow={t.associates}
                title={t.associates}
                members={groupedMembers.associates}
                language={language}
                viewProfileLabel={t.viewProfile}
                testId="section-associates"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
