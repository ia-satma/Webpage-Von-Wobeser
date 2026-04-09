import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import { getIcon } from "@/lib/icons";
import type { IndustryGroup } from "@shared/schema";

interface IndustryGroupCardProps {
  group: IndustryGroup;
  learnMoreText: string;
}

function IndustryGroupCard({ group, learnMoreText }: IndustryGroupCardProps) {
  const { language } = useLanguage();
  const IconComponent = getIcon(group.iconName);

  const { translatedFields, isLoading, isTranslating } = useTranslatedContent({
    contentType: 'industry_group',
    entityId: String(group.id),
    fields: {
      name: group.name,
      nameEs: group.nameEs,
      description: group.description,
      descriptionEs: group.descriptionEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayName = translatedFields.name || group.name;
  const displayDescription = translatedFields.description || group.description;
  const showTranslatingIndicator = isLoading || isTranslating;

  return (
    <Link href={`/industry-groups/${group.slug}`}>
      <Card
        className="group h-full rounded-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
        data-testid={`card-industry-group-${group.slug}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-primary" data-testid={`icon-industry-group-${group.slug}`} />
            </div>
            {showTranslatingIndicator && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            )}
          </div>
          <h3 
            className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary transition-colors"
            data-testid={`text-industry-group-name-${group.slug}`}
          >
            {displayName}
          </h3>
          <p 
            className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3"
            data-testid={`text-industry-group-desc-${group.slug}`}
          >
            {displayDescription}
          </p>
          <span 
            className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all"
            data-testid={`link-industry-group-${group.slug}`}
          >
            {learnMoreText}
            <ArrowRight className="w-4 h-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function IndustryGroups() {
  const { language } = useLanguage();

  const { data: industryGroups, isLoading, error } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content: Record<string, { title: string; subtitle: string; errorMessage: string; learnMore: string; searchPlaceholder: string; viewAll: string; noResults: string }> = {
    en: {
      title: "Industry Groups",
      subtitle: "Specialized industry expertise",
      errorMessage: "Failed to load industry groups",
      learnMore: "Learn More",
      searchPlaceholder: "Search...",
      viewAll: "View All",
      noResults: "No results found",
    },
    es: {
      title: "Industrias",
      subtitle: "Experiencia especializada en industrias",
      errorMessage: "Error al cargar las industrias",
      learnMore: "Más Información",
      searchPlaceholder: "Buscar...",
      viewAll: "Ver todo",
      noResults: "No se encontraron resultados",
    },
    de: {
      title: "Branchengruppen",
      subtitle: "Spezialisierte Branchenexpertise",
      errorMessage: "Fehler beim Laden der Branchengruppen",
      learnMore: "Mehr erfahren",
      searchPlaceholder: "Suchen...",
      viewAll: "Alle anzeigen",
      noResults: "Keine Ergebnisse gefunden",
    },
    zh: {
      title: "行业领域",
      subtitle: "专业的行业知识",
      errorMessage: "加载行业领域失败",
      learnMore: "了解更多",
      searchPlaceholder: "搜索...",
      viewAll: "查看全部",
      noResults: "未找到结果",
    },
    ko: {
      title: "산업 그룹",
      subtitle: "전문화된 산업 전문성",
      errorMessage: "산업 그룹 로드 실패",
      learnMore: "자세히 알아보기",
      searchPlaceholder: "검색...",
      viewAll: "전체 보기",
      noResults: "결과를 찾을 수 없습니다",
    },
    ja: {
      title: "産業グループ",
      subtitle: "専門的な業界知識",
      errorMessage: "産業グループの読み込みに失敗しました",
      learnMore: "詳しく見る",
      searchPlaceholder: "検索...",
      viewAll: "すべて表示",
      noResults: "結果が見つかりません",
    },
    ar: {
      title: "مجموعات الصناعة",
      subtitle: "خبرة صناعية متخصصة",
      errorMessage: "فشل تحميل مجموعات الصناعة",
      learnMore: "اعرف المزيد",
      searchPlaceholder: "بحث...",
      viewAll: "عرض الكل",
      noResults: "لم يتم العثور على نتائج",
    },
    ru: {
      title: "Отрасли",
      subtitle: "Специализированная отраслевая экспертиза",
      errorMessage: "Не удалось загрузить отраслевые группы",
      learnMore: "Подробнее",
      searchPlaceholder: "Поиск...",
      viewAll: "Смотреть все",
      noResults: "Результаты не найдены",
    },
    fr: {
      title: "Groupes sectoriels",
      subtitle: "Expertise sectorielle spécialisée",
      errorMessage: "Échec du chargement des groupes sectoriels",
      learnMore: "En savoir plus",
      searchPlaceholder: "Rechercher...",
      viewAll: "Voir tout",
      noResults: "Aucun résultat trouvé",
    },
    it: {
      title: "Settori industriali",
      subtitle: "Competenza settoriale specializzata",
      errorMessage: "Impossibile caricare i settori industriali",
      learnMore: "Scopri di più",
      searchPlaceholder: "Cerca...",
      viewAll: "Vedi tutto",
      noResults: "Nessun risultato trovato",
    },
  };

  const t = content[language] || content.en;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-groups">
      <SEOHead page="industryGroups" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-industry-groups-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-3xl md:text-4xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]"
              data-testid="text-industry-groups-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-industry-groups-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {error ? (
            <div className="text-center py-12" data-testid="container-industry-groups-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-industry-groups-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {Array.from({ length: 7 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md border-0 shadow-sm bg-gray-50 dark:bg-gray-800"
                  data-testid={`skeleton-industry-group-${i}`}
                >
                  <CardContent className="p-6">
                    <Skeleton className="h-10 w-10 rounded-md mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {industryGroups?.map((group) => (
                <motion.div key={group.id} variants={itemVariants}>
                  <IndustryGroupCard group={group} learnMoreText={t.learnMore} />
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
