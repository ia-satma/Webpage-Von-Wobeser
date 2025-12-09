import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Users, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import TeamMemberCard from "@/components/TeamMemberCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

export default function Team() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeniority, setFilterSeniority] = useState<string>("all");
  const [filterPractice, setFilterPractice] = useState<string>("all");
  const [filterLetter, setFilterLetter] = useState<string>("all");

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

  const filteredMembers = useMemo(() => {
    if (!allTeamMembers) return [];
    
    return allTeamMembers.filter(member => {
      // Apply search filter
      if (searchQuery && !member.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply seniority filter
      if (filterSeniority !== "all") {
        const titleLower = member.title.toLowerCase();
        switch(filterSeniority) {
          case "partners":
            if (!member.isPartner) return false;
            break;
          case "ofcounsel":
            if (titleLower !== "of counsel") return false;
            break;
          case "associates":
            if (!titleLower.includes("associate")) return false;
            break;
        }
      }
      
      // Apply alphabetic filter
      if (filterLetter !== "all") {
        if (!member.name.toUpperCase().startsWith(filterLetter)) return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (a.isPartner && !b.isPartner) return -1;
      if (!a.isPartner && b.isPartner) return 1;
      if (a.title === "Of Counsel" && b.title === "Associate") return -1;
      if (a.title === "Associate" && b.title === "Of Counsel") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allTeamMembers, searchQuery, filterSeniority, filterLetter]);

  const hasActiveFilters = searchQuery || filterSeniority !== "all" || filterLetter !== "all" || filterPractice !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterSeniority("all");
    setFilterPractice("all");
    setFilterLetter("all");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team">
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
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-team-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-team-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-md"
                  data-testid="input-search"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={filterSeniority} onValueChange={setFilterSeniority}>
                  <SelectTrigger className="w-40 rounded-md" data-testid="select-seniority">
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
                  <SelectTrigger className="w-32 rounded-md" data-testid="select-alphabetic">
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
                  <Button
                    variant="outline"
                    size="default"
                    onClick={clearFilters}
                    className="gap-2 rounded-md"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4" />
                    {t.clearFilters}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-results-count">
                {filteredMembers.length} {t.teamMembers}
              </p>
            </div>
          </motion.div>

          {errorAll ? (
            <div className="text-center py-12" data-testid="container-team-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-team-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoadingAll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md border-0 shadow-sm bg-gray-50 dark:bg-gray-800"
                  data-testid={`skeleton-team-member-${i}`}
                >
                  <CardContent className="p-6 text-center">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto mb-1" />
                    <Skeleton className="h-4 w-2/3 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12" data-testid="container-team-empty">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t.noResults}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4 gap-2 rounded-md"
                  data-testid="button-clear-empty"
                >
                  <X className="w-4 h-4" />
                  {t.clearFilters}
                </Button>
              )}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {filteredMembers.map((member) => (
                <motion.div key={member.id} variants={itemVariants}>
                  <TeamMemberCard
                    member={member}
                    viewProfileLabel={t.viewProfile}
                    positions={t.positions}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
