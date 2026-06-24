import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearch, useLocation } from "wouter";
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

// Mapea el valor entrante de `?type` al valor interno de seniority. Incluye
// tanto los alias del sitio viejo ("of-counsel", "counsel") como los valores
// canónicos internos, para que la URL que nosotros escribimos también se relea.
const urlTypeToFilter: Record<string, string> = {
  partners: "partners",
  "of-counsel": "ofcounsel",
  counsel: "ofcounsel",
  ofcounsel: "ofcounsel",
  associates: "associates",
};

// Lee el seniority desde los params de la URL. La URL es la fuente de verdad,
// así que esto se evalúa en cada render a partir de `useSearch`.
function getSeniorityFromSearch(search: string): string {
  const typeParam = new URLSearchParams(search).get("type");
  if (typeParam && urlTypeToFilter[typeParam]) {
    return urlTypeToFilter[typeParam];
  }
  return "all";
}

// Lee la letra (inicial de apellido) desde los params de la URL.
function getLetterFromSearch(search: string): string {
  const letterParam = new URLSearchParams(search).get("letter");
  if (letterParam && /^[A-Z]$/.test(letterParam.toUpperCase())) {
    return letterParam.toUpperCase();
  }
  return "all";
}

export default function Team() {
  const { language } = useLanguage();

  // --- URL como única fuente de verdad para los filtros ---
  // `useSearch` da el query string (sin el `?`); `setLocation` lo reescribe.
  // Patrón espejo de News.tsx (que precarga `?q`), extendido aquí a
  // `type` (seniority) y `letter` para que el filtro sea compartible y
  // sobreviva a la recarga.
  const search = useSearch();
  const [location, setLocation] = useLocation();

  // Estado derivado de la URL (ambos sentidos: leer aquí, escribir abajo).
  const filterSeniority = getSeniorityFromSearch(search);
  const filterLetter = getLetterFromSearch(search);
  const searchFromUrl = new URLSearchParams(search).get("q") ?? "";

  // `searchQuery` se mantiene como estado local para que teclear sea fluido,
  // pero se siembra desde `?q` y se reescribe en la URL con `replace` (sin
  // ensuciar el history). Sigue siendo la URL la fuente compartible.
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);

  const heroRef = useFadeOnScroll<HTMLDivElement>();

  // Re-sincroniza el input cuando `?q` cambia desde fuera (p. ej. el buscador
  // del header navega a /team?q=...). No interfiere con lo tecleado porque
  // solo dispara al cambiar el query param.
  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

  // Escribe un conjunto de params en la URL preservando la ruta actual y los
  // demás filtros. `replace` evita spam del history (útil al teclear).
  const updateParams = useCallback(
    (patch: Record<string, string | null>, opts?: { replace?: boolean }) => {
      const params = new URLSearchParams(search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      const path = location.split("?")[0];
      setLocation(qs ? `${path}?${qs}` : path, { replace: opts?.replace });
    },
    [search, location, setLocation],
  );

  // Handlers que escriben en la URL (fuente de verdad). El seniority y la letra
  // van con push normal (son acciones de navegación deliberadas); la búsqueda
  // tecleada va con `replace` para no inundar el history.
  const handleSeniorityChange = useCallback(
    (value: string) => updateParams({ type: value }),
    [updateParams],
  );
  const handleLetterChange = useCallback(
    (value: string) => updateParams({ letter: value }),
    [updateParams],
  );
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      updateParams({ q: value }, { replace: true });
    },
    [updateParams],
  );

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
    // Limpia los tres filtros de la URL de una sola vez (un único cambio de
    // history). Al borrarlos, la ruta vuelve a /team sin query string.
    updateParams({ q: null, type: null, letter: null });
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
          onSearchChange={handleSearchChange}
          filterSeniority={filterSeniority}
          onSeniorityChange={handleSeniorityChange}
          filterLetter={filterLetter}
          onLetterChange={handleLetterChange}
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
