import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Users, Search, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

// Helper to split an array into chunks of a given size
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Map URL parameters to filter values
const urlTypeToFilter: Record<string, string> = {
  "partners": "partners",
  "of-counsel": "ofcounsel",
  "counsel": "ofcounsel",
  "associates": "associates",
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
  const [filterPractice, setFilterPractice] = useState<string>("all");
  const [filterLetter, setFilterLetter] = useState<string>("all");
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
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

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content: Record<string, {
    title: string;
    subtitle: string;
    errorMessage: string;
    allMembers: string;
    partnersOnly: string;
    ofCounsel: string;
    associates: string;
    viewProfile: string;
    downloadVCard: string;
    searchPlaceholder: string;
    filterBy: string;
    seniority: string;
    practiceArea: string;
    alphabetic: string;
    all: string;
    clearFilters: string;
    noResults: string;
    teamMembers: string;
    positions: {
      foundingPartner: string;
      partner: string;
      ofCounsel: string;
      seniorAssociate: string;
      associate: string;
    };
  }> = {
    en: {
      title: "Our Team",
      subtitle: "Meet the experienced attorneys who make our firm a leader in legal excellence",
      errorMessage: "Failed to load team members",
      allMembers: "All",
      partnersOnly: "Partners",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewProfile: "View Profile",
      downloadVCard: "Download vCard",
      searchPlaceholder: "Search by name...",
      filterBy: "Filter by",
      seniority: "Seniority",
      practiceArea: "Practice Area",
      alphabetic: "Alphabetic",
      all: "All",
      clearFilters: "Clear filters",
      noResults: "No team members match your criteria",
      teamMembers: "team members",
      positions: {
        foundingPartner: "Founding Partner",
        partner: "Partner",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Senior Associate",
        associate: "Associate",
      },
    },
    es: {
      title: "Nuestro Equipo",
      subtitle: "Conozca a los experimentados abogados que hacen de nuestra firma un líder en excelencia legal",
      errorMessage: "Error al cargar los miembros del equipo",
      allMembers: "Todos",
      partnersOnly: "Socios",
      ofCounsel: "Of Counsel",
      associates: "Asociados",
      viewProfile: "Ver Perfil",
      downloadVCard: "Descargar vCard",
      searchPlaceholder: "Buscar por nombre...",
      filterBy: "Filtrar por",
      seniority: "Nivel",
      practiceArea: "Área de Práctica",
      alphabetic: "Alfabético",
      all: "Todos",
      clearFilters: "Limpiar filtros",
      noResults: "No hay miembros que coincidan con los criterios",
      teamMembers: "miembros del equipo",
      positions: {
        foundingPartner: "Socio Fundador",
        partner: "Socio",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Asociado Senior",
        associate: "Asociado",
      },
    },
    de: {
      title: "Unser Team",
      subtitle: "Lernen Sie unsere Experten kennen",
      errorMessage: "Teammitglieder konnten nicht geladen werden",
      allMembers: "Alle",
      partnersOnly: "Partner",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewProfile: "Profil anzeigen",
      downloadVCard: "vCard herunterladen",
      searchPlaceholder: "Suchen...",
      filterBy: "Filtern nach",
      seniority: "Alle Positionen",
      practiceArea: "Alle Praxisbereiche",
      alphabetic: "Alphabetisch",
      all: "Alle",
      clearFilters: "Filter löschen",
      noResults: "Keine Ergebnisse gefunden",
      teamMembers: "Teammitglieder",
      positions: {
        foundingPartner: "Gründungspartner",
        partner: "Partner",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Senior Associate",
        associate: "Associate",
      },
    },
    zh: {
      title: "我们的团队",
      subtitle: "认识我们的专家",
      errorMessage: "无法加载团队成员",
      allMembers: "全部",
      partnersOnly: "合伙人",
      ofCounsel: "法律顾问",
      associates: "律师",
      viewProfile: "查看简介",
      downloadVCard: "下载名片",
      searchPlaceholder: "搜索...",
      filterBy: "筛选",
      seniority: "所有职位",
      practiceArea: "所有业务领域",
      alphabetic: "字母顺序",
      all: "全部",
      clearFilters: "清除筛选",
      noResults: "未找到结果",
      teamMembers: "团队成员",
      positions: {
        foundingPartner: "创始合伙人",
        partner: "合伙人",
        ofCounsel: "法律顾问",
        seniorAssociate: "高级律师",
        associate: "律师",
      },
    },
    ko: {
      title: "우리 팀",
      subtitle: "전문가들을 만나보세요",
      errorMessage: "팀원을 불러올 수 없습니다",
      allMembers: "전체",
      partnersOnly: "파트너",
      ofCounsel: "고문",
      associates: "어소시에이트",
      viewProfile: "프로필 보기",
      downloadVCard: "명함 다운로드",
      searchPlaceholder: "검색...",
      filterBy: "필터",
      seniority: "모든 직위",
      practiceArea: "모든 업무 분야",
      alphabetic: "알파벳순",
      all: "전체",
      clearFilters: "필터 초기화",
      noResults: "결과 없음",
      teamMembers: "팀원",
      positions: {
        foundingPartner: "창립 파트너",
        partner: "파트너",
        ofCounsel: "고문",
        seniorAssociate: "시니어 어소시에이트",
        associate: "어소시에이트",
      },
    },
    ja: {
      title: "私たちのチーム",
      subtitle: "専門家をご紹介します",
      errorMessage: "チームメンバーを読み込めませんでした",
      allMembers: "すべて",
      partnersOnly: "パートナー",
      ofCounsel: "オブ・カウンセル",
      associates: "アソシエイト",
      viewProfile: "プロフィールを見る",
      downloadVCard: "名刺をダウンロード",
      searchPlaceholder: "検索...",
      filterBy: "フィルター",
      seniority: "すべての役職",
      practiceArea: "すべての取扱分野",
      alphabetic: "アルファベット順",
      all: "すべて",
      clearFilters: "フィルターをクリア",
      noResults: "結果が見つかりません",
      teamMembers: "チームメンバー",
      positions: {
        foundingPartner: "創立パートナー",
        partner: "パートナー",
        ofCounsel: "オブ・カウンセル",
        seniorAssociate: "シニアアソシエイト",
        associate: "アソシエイト",
      },
    },
    ar: {
      title: "فريقنا",
      subtitle: "تعرف على خبرائنا",
      errorMessage: "فشل في تحميل أعضاء الفريق",
      allMembers: "الكل",
      partnersOnly: "الشركاء",
      ofCounsel: "مستشار قانوني",
      associates: "المحامون",
      viewProfile: "عرض الملف الشخصي",
      downloadVCard: "تحميل بطاقة العمل",
      searchPlaceholder: "بحث...",
      filterBy: "تصفية حسب",
      seniority: "جميع المناصب",
      practiceArea: "جميع مجالات الممارسة",
      alphabetic: "أبجدي",
      all: "الكل",
      clearFilters: "مسح الفلاتر",
      noResults: "لم يتم العثور على نتائج",
      teamMembers: "أعضاء الفريق",
      positions: {
        foundingPartner: "شريك مؤسس",
        partner: "شريك",
        ofCounsel: "مستشار قانوني",
        seniorAssociate: "محامي أول",
        associate: "محامي",
      },
    },
    ru: {
      title: "Наша команда",
      subtitle: "Познакомьтесь с нашими экспертами",
      errorMessage: "Не удалось загрузить членов команды",
      allMembers: "Все",
      partnersOnly: "Партнёры",
      ofCounsel: "Советник",
      associates: "Юристы",
      viewProfile: "Посмотреть профиль",
      downloadVCard: "Скачать визитку",
      searchPlaceholder: "Поиск...",
      filterBy: "Фильтр",
      seniority: "Все должности",
      practiceArea: "Все практики",
      alphabetic: "По алфавиту",
      all: "Все",
      clearFilters: "Сбросить фильтры",
      noResults: "Результаты не найдены",
      teamMembers: "членов команды",
      positions: {
        foundingPartner: "Партнёр-основатель",
        partner: "Партнёр",
        ofCounsel: "Советник",
        seniorAssociate: "Старший юрист",
        associate: "Юрист",
      },
    },
    fr: {
      title: "Notre équipe",
      subtitle: "Rencontrez nos experts",
      errorMessage: "Échec du chargement des membres de l'équipe",
      allMembers: "Tous",
      partnersOnly: "Associés",
      ofCounsel: "Of Counsel",
      associates: "Collaborateurs",
      viewProfile: "Voir le profil",
      downloadVCard: "Télécharger vCard",
      searchPlaceholder: "Rechercher...",
      filterBy: "Filtrer par",
      seniority: "Tous les postes",
      practiceArea: "Tous les domaines de pratique",
      alphabetic: "Alphabétique",
      all: "Tous",
      clearFilters: "Effacer les filtres",
      noResults: "Aucun résultat trouvé",
      teamMembers: "membres de l'équipe",
      positions: {
        foundingPartner: "Associé fondateur",
        partner: "Associé",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Collaborateur senior",
        associate: "Collaborateur",
      },
    },
    it: {
      title: "Il nostro team",
      subtitle: "Conosci i nostri esperti",
      errorMessage: "Impossibile caricare i membri del team",
      allMembers: "Tutti",
      partnersOnly: "Partner",
      ofCounsel: "Of Counsel",
      associates: "Associate",
      viewProfile: "Vedi profilo",
      downloadVCard: "Scarica vCard",
      searchPlaceholder: "Cerca...",
      filterBy: "Filtra per",
      seniority: "Tutte le posizioni",
      practiceArea: "Tutte le aree di pratica",
      alphabetic: "Alfabetico",
      all: "Tutti",
      clearFilters: "Cancella filtri",
      noResults: "Nessun risultato trovato",
      teamMembers: "membri del team",
      positions: {
        foundingPartner: "Partner fondatore",
        partner: "Partner",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Senior Associate",
        associate: "Associate",
      },
    },
  };

  const t = content[language] || content.en;

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const groupedMembers = useMemo(() => {
    if (!allTeamMembers) return { partners: [], ofCounsel: [], associates: [] };

    const applyTextFilters = (members: TeamMember[]) =>
      members.filter(m => {
        if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterLetter !== "all" && !m.name.toUpperCase().startsWith(filterLetter)) return false;
        return true;
      });

    const byName = (a: TeamMember, b: TeamMember) => a.name.localeCompare(b.name);

    const isOfCounsel = (m: TeamMember) => m.title?.toLowerCase() === "of counsel";
    const allPartners  = [...allTeamMembers.filter(m => m.isPartner)].sort(byName);
    const allOfCounsel = [...allTeamMembers.filter(m => !m.isPartner && isOfCounsel(m))].sort(byName);
    const allAssociates = [...allTeamMembers.filter(m => !m.isPartner && !isOfCounsel(m))].sort(byName);

    return {
      partners:   applyTextFilters(allPartners),
      ofCounsel:  applyTextFilters(allOfCounsel),
      associates: applyTextFilters(allAssociates),
    };
  }, [allTeamMembers, searchQuery, filterLetter]);

  const showPartners   = filterSeniority === "all" || filterSeniority === "partners";
  const showOfCounsel  = filterSeniority === "all" || filterSeniority === "ofcounsel";
  const showAssociates = filterSeniority === "all" || filterSeniority === "associates";

  const totalVisible =
    (showPartners   ? groupedMembers.partners.length   : 0) +
    (showOfCounsel  ? groupedMembers.ofCounsel.length  : 0) +
    (showAssociates ? groupedMembers.associates.length : 0);

  const hasActiveFilters = searchQuery || filterSeniority !== "all" || filterLetter !== "all" || filterPractice !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterSeniority("all");
    setFilterPractice("all");
    setFilterLetter("all");
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const getPhotoSrc = (member: TeamMember) =>
    member.imageUrl || `/partner_photos/${member.slug}.jpg`;

  return (
    <div className="min-h-screen bg-[#111110]" data-testid="page-team">
      <SEOHead page="team" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-team-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#AA1A2E]" />
              <p className="text-[#AA1A2E] text-[10px] tracking-[0.3em] uppercase font-medium">Von Wobeser y Sierra</p>
              <div className="w-8 h-px bg-[#AA1A2E]" />
            </div>
            <h1 
              className="text-3xl md:text-4xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]"
              data-testid="text-team-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-sm text-white/70 max-w-2xl mx-auto uppercase tracking-[0.08em]"
              data-testid="text-team-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="bg-[#0a0a09] border-b border-[#AA1A2E]/15 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-none bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#AA1A2E]/40 focus-visible:border-[#AA1A2E]/40"
                data-testid="input-search"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={filterSeniority} onValueChange={setFilterSeniority}>
                <SelectTrigger className="w-36 rounded-none bg-white/5 border-white/10 text-white/80 text-xs" data-testid="select-seniority">
                  <SelectValue placeholder={t.seniority} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="partners">{t.partnersOnly}</SelectItem>
                  <SelectItem value="ofcounsel">{t.ofCounsel}</SelectItem>
                  <SelectItem value="associates">{t.associates}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLetter} onValueChange={setFilterLetter}>
                <SelectTrigger className="w-28 rounded-none bg-white/5 border-white/10 text-white/80 text-xs" data-testid="select-alphabetic">
                  <SelectValue placeholder={t.alphabetic} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {alphabet.map(letter => (
                    <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="default" onClick={clearFilters} className="gap-1.5 rounded-none text-white/50 hover:text-white text-xs" data-testid="button-clear-filters">
                  <X className="w-3.5 h-3.5" />
                  {t.clearFilters}
                </Button>
              )}
              <span className="text-white/30 text-xs ml-2 hidden sm:inline" data-testid="text-results-count">{totalVisible} {t.teamMembers}</span>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" data-testid="section-team-main">

        {errorAll ? (
          <div className="text-center py-24" data-testid="container-team-error">
            <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50" data-testid="text-team-error">{t.errorMessage}</p>
          </div>
        ) : isLoadingAll ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-px">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="bg-[#1a1a18]" style={{ aspectRatio: "3/4" }} data-testid={`skeleton-team-member-${i}`}>
                <Skeleton className="w-full h-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : totalVisible === 0 ? (
          <div className="text-center py-24" data-testid="container-team-empty">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">{t.noResults}</p>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="mt-4 gap-2 rounded-none text-white/50" data-testid="button-clear-empty">
                <X className="w-4 h-4" />{t.clearFilters}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* ─── SOCIOS ──────────────────────────────────────── */}
            {showPartners && groupedMembers.partners.length > 0 && (
              <section className="bg-[#111110] border-b border-[#AA1A2E]/10" data-testid="section-partners">
                <div className="px-6 lg:px-12 pt-10 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-px bg-[#AA1A2E] shrink-0" />
                    <p className="text-[#AA1A2E] text-[10px] tracking-[0.3em] uppercase font-medium">NUESTRO EQUIPO</p>
                    <span className="text-white/20 text-[9px] tracking-wider ml-1">— {groupedMembers.partners.length}</span>
                  </div>
                  <h2 className="font-heading font-light text-xl uppercase tracking-[0.12em] text-white/90">
                    {t.partnersOnly}
                  </h2>
                </div>
                {/* Desktop: expanding panels — multiple rows of 8 */}
                <div className="hidden lg:block">
                  {chunkArray(groupedMembers.partners, 8).map((row, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="flex w-full h-[440px]"
                      onMouseLeave={() => setActivePanel(null)}
                    >
                      {row.map((member, colIdx) => {
                        const idx = rowIdx * 8 + colIdx;
                        const isActive = activePanel === `p-${member.id}`;
                        return (
                          <Link
                            key={member.id}
                            href={`/team/${member.slug}`}
                            data-testid={`card-team-member-${member.slug}`}
                            aria-label={member.name}
                            className="relative overflow-hidden cursor-pointer block"
                            style={{ flex: isActive ? 4 : 1, transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: 0 }}
                            onMouseEnter={() => setActivePanel(`p-${member.id}`)}
                          >
                            <div className="absolute inset-0 bg-[#1a1a18] flex items-center justify-center">
                              <span className="text-2xl font-heading font-bold text-[#AA1A2E]/50 select-none">{getInitials(member.name)}</span>
                            </div>
                            <img src={getPhotoSrc(member)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top" style={{ transform: isActive ? "scale(1.03)" : "scale(1)", filter: isActive ? "grayscale(0%)" : "grayscale(100%)", transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                            <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 100%)", transition: "background 0.5s ease" }} />
                            <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/15" />
                            <span className="absolute top-4 left-3 text-[#AA1A2E] text-[9px] font-medium tabular-nums tracking-wider">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="absolute bottom-5 left-3 right-3" style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.2s ease" }}>
                              <p className="text-white/60 text-[9px] uppercase tracking-[0.12em] font-light truncate">{member.name}</p>
                            </div>
                            <div className="absolute bottom-5 left-4 right-4" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s" }}>
                              <p className="font-heading font-light text-sm uppercase tracking-[0.1em] leading-snug mb-1 text-white whitespace-nowrap overflow-hidden text-ellipsis">{member.name}</p>
                              <p className="text-[10px] text-[#AA1A2E] uppercase tracking-[0.08em] mb-3">{t.partnersOnly}</p>
                              <div className="flex items-center gap-2 text-[#AA1A2E]">
                                <span className="text-[9px] uppercase tracking-[0.1em]">{t.viewProfile}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Mobile: 2-column portrait grid */}
                <div className="lg:hidden grid grid-cols-2 gap-px">
                  {groupedMembers.partners.map((member, idx) => (
                    <Link key={member.id} href={`/team/${member.slug}`} className="relative overflow-hidden group block cursor-pointer" style={{ aspectRatio: "3/4" }} data-testid={`card-team-member-mob-${member.slug}`} aria-label={member.name}>
                      <div className="absolute inset-0 bg-[#1a1a18] flex items-center justify-center">
                        <span className="text-2xl font-heading font-bold text-[#AA1A2E]/50 select-none">{getInitials(member.name)}</span>
                      </div>
                      <img src={getPhotoSrc(member)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top transition-[transform,filter] duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <span className="absolute top-2 left-2 text-[#AA1A2E] text-[9px] font-medium tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                        <p className="text-[#AA1A2E] text-[8px] uppercase tracking-[0.1em] mb-0.5">{t.partnersOnly}</p>
                        <p className="text-white text-[9px] uppercase tracking-[0.06em] leading-snug font-light line-clamp-2">{member.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ─── OF COUNSEL ──────────────────────────────────── */}
            {showOfCounsel && groupedMembers.ofCounsel.length > 0 && (
              <section className="bg-[#0d0d0c] border-b border-[#AA1A2E]/10" data-testid="section-ofcounsel">
                <div className="px-6 lg:px-12 pt-10 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-px bg-[#AA1A2E] shrink-0" />
                    <p className="text-[#AA1A2E] text-[10px] tracking-[0.3em] uppercase font-medium">{t.ofCounsel}</p>
                    <span className="text-white/20 text-[9px] tracking-wider ml-1">— {groupedMembers.ofCounsel.length}</span>
                  </div>
                  <h2 className="font-heading font-light text-xl uppercase tracking-[0.12em] text-white/90">
                    {t.ofCounsel}
                  </h2>
                </div>
                {/* Desktop: expanding panels */}
                <div className="hidden lg:flex w-full h-[380px]" onMouseLeave={() => setActivePanel(null)}>
                  {groupedMembers.ofCounsel.map((member, idx) => {
                    const isActive = activePanel === `oc-${member.id}`;
                    return (
                      <Link
                        key={member.id}
                        href={`/team/${member.slug}`}
                        data-testid={`card-team-member-${member.slug}`}
                        aria-label={member.name}
                        className="relative overflow-hidden cursor-pointer block"
                        style={{ flex: isActive ? 3 : 1, transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: 0 }}
                        onMouseEnter={() => setActivePanel(`oc-${member.id}`)}
                      >
                        <div className="absolute inset-0 bg-[#1a1a18] flex items-center justify-center">
                          <span className="text-4xl font-heading font-bold text-[#AA1A2E]/40 select-none">{getInitials(member.name)}</span>
                        </div>
                        <img src={getPhotoSrc(member)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top" style={{ transform: isActive ? "scale(1.04)" : "scale(1)", filter: isActive ? "grayscale(0%)" : "grayscale(100%)", transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)", transition: "background 0.5s ease" }} />
                        <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/20" />
                        <span className="absolute top-5 left-4 text-[#AA1A2E] text-xs font-medium tabular-nums tracking-wider">{String(idx + 1).padStart(2, '0')}</span>
                        <div className="absolute bottom-6 left-4 right-4" style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.25s ease" }}>
                          <p className="text-white/70 text-[9px] uppercase tracking-[0.12em] font-light truncate">{member.name}</p>
                        </div>
                        <div className="absolute bottom-6 left-5 right-5" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s" }}>
                          <p className="font-heading font-light text-base uppercase tracking-[0.1em] leading-snug mb-1 text-white">{member.name}</p>
                          <p className="text-xs text-[#AA1A2E] uppercase tracking-[0.08em] mb-3">{member.title}</p>
                          <div className="flex items-center gap-2 text-[#AA1A2E]">
                            <span className="text-[9px] uppercase tracking-[0.1em]">{t.viewProfile}</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {/* Mobile: 2-column grid */}
                <div className="lg:hidden grid grid-cols-2 gap-px">
                  {groupedMembers.ofCounsel.map((member, idx) => (
                    <Link key={member.id} href={`/team/${member.slug}`} className="relative overflow-hidden group block cursor-pointer" style={{ aspectRatio: "3/4" }} data-testid={`card-team-member-mob-${member.slug}`} aria-label={member.name}>
                      <div className="absolute inset-0 bg-[#1a1a18] flex items-center justify-center">
                        <span className="text-3xl font-heading font-bold text-[#AA1A2E]/60 select-none">{getInitials(member.name)}</span>
                      </div>
                      <img src={getPhotoSrc(member)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top transition-[transform,filter] duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <span className="absolute top-2 left-2 text-[#AA1A2E] text-[9px] font-medium tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                        <p className="text-[#AA1A2E] text-[8px] uppercase tracking-[0.1em] mb-0.5">{member.title}</p>
                        <p className="text-white text-[9px] uppercase tracking-[0.06em] leading-snug font-light">{member.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ─── ASOCIADOS ───────────────────────────────────── */}
            {showAssociates && groupedMembers.associates.length > 0 && (
              <section className="bg-[#111110]" data-testid="section-associates">
                <div className="px-6 lg:px-12 pt-10 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-px bg-[#AA1A2E] shrink-0" />
                    <p className="text-[#AA1A2E] text-[10px] tracking-[0.3em] uppercase font-medium">{t.associates}</p>
                    <span className="text-white/20 text-[9px] tracking-wider ml-1">— {groupedMembers.associates.length}</span>
                  </div>
                  <h2 className="font-heading font-light text-xl uppercase tracking-[0.12em] text-white/90">
                    {t.associates}
                  </h2>
                </div>
                {/* Desktop: expanding panels — multiple rows of 9 */}
                <div className="hidden lg:block">
                  {chunkArray(groupedMembers.associates, 9).map((row, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="flex w-full h-[400px]"
                      onMouseLeave={() => setActivePanel(null)}
                    >
                      {row.map((member, colIdx) => {
                        const idx = rowIdx * 9 + colIdx;
                        const isActive = activePanel === `a-${member.id}`;
                        return (
                          <Link
                            key={member.id}
                            href={`/team/${member.slug}`}
                            data-testid={`card-team-member-${member.slug}`}
                            aria-label={member.name}
                            className="relative overflow-hidden cursor-pointer block"
                            style={{ flex: isActive ? 4 : 1, transition: "flex 0.45s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: 0 }}
                            onMouseEnter={() => setActivePanel(`a-${member.id}`)}
                          >
                            <div className="absolute inset-0 bg-[#1a1a18] flex items-center justify-center">
                              <span className="text-xl font-heading font-bold text-[#AA1A2E]/40 select-none">{getInitials(member.name)}</span>
                            </div>
                            <img src={getPhotoSrc(member)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top" style={{ transform: isActive ? "scale(1.03)" : "scale(1)", filter: isActive ? "grayscale(0%)" : "grayscale(100%)", transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                            <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.75) 100%)", transition: "background 0.5s ease" }} />
                            <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/10" />
                            <span className="absolute top-4 left-3 text-[#AA1A2E] text-[9px] font-medium tabular-nums tracking-wider">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="absolute bottom-4 left-3 right-3" style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.2s ease" }}>
                              <p className="text-white/50 text-[8px] uppercase tracking-[0.1em] font-light truncate">{member.name}</p>
                            </div>
                            <div className="absolute bottom-4 left-3 right-3" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s" }}>
                              <p className="font-heading font-light text-sm uppercase tracking-[0.08em] leading-snug mb-0.5 text-white whitespace-nowrap overflow-hidden text-ellipsis">{member.name}</p>
                              <p className="text-[9px] text-[#AA1A2E] uppercase tracking-[0.08em] mb-2">{t.associates}</p>
                              <div className="flex items-center gap-1.5 text-[#AA1A2E]">
                                <span className="text-[9px] uppercase tracking-[0.1em]">{t.viewProfile}</span>
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Mobile: 2-column portrait grid */}
                <div className="lg:hidden grid grid-cols-2 gap-px">
                  {groupedMembers.associates.map((member, idx) => (
                    <Link key={member.id} href={`/team/${member.slug}`} className="relative overflow-hidden group block cursor-pointer" style={{ aspectRatio: "3/4" }} data-testid={`card-team-member-mob-${member.slug}`} aria-label={member.name}>
                      <div className="absolute inset-0 bg-[#1a1a18] flex items-center justify-center">
                        <span className="text-xl font-heading font-bold text-[#AA1A2E]/40 select-none">{getInitials(member.name)}</span>
                      </div>
                      <img src={getPhotoSrc(member)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top transition-[transform,filter] duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <span className="absolute top-2 left-2 text-[#AA1A2E] text-[8px] font-medium tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
                        <p className="text-[#AA1A2E] text-[7px] uppercase tracking-[0.08em] mb-0.5">{t.associates}</p>
                        <p className="text-white text-[8px] uppercase tracking-[0.05em] leading-snug font-light line-clamp-2">{member.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
