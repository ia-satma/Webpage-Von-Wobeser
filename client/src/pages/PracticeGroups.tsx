import { useState } from "react";
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
import { getPracticeImage } from "@/lib/practiceIndustryImages";
import type { PracticeGroup } from "@shared/schema";

interface PracticeGroupCardProps {
  group: PracticeGroup;
  index: number;
  learnMoreText: string;
}

function PracticeGroupCard({ group, index, learnMoreText }: PracticeGroupCardProps) {
  const { language } = useLanguage();
  const [isHover, setIsHover] = useState(false);

  const { translatedFields, isLoading, isTranslating } = useTranslatedContent({
    contentType: 'practice_group',
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
  const numberLabel = String(index + 1).padStart(2, "0");

  const imageUrl = getPracticeImage(group.slug, group.imageUrl);

  return (
    <Link href={`/practice-groups/${group.slug}`}>
      <article
        className="group relative h-full overflow-hidden rounded-none bg-[#1a1a19] border-l-2 border-l-primary hover:border-l-4 transition-all duration-500 cursor-pointer aspect-[4/5]"
        data-testid={`card-practice-group-${group.slug}`}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        {/* Background image — grayscale at rest, color on hover (matches home pattern) */}
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            filter: isHover ? "grayscale(0%)" : "grayscale(100%)",
            transform: isHover ? "scale(1.04)" : "scale(1)",
            transition:
              "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Dark overlay — crossfade between rest and hover gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isHover
              ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)",
            transition: "background 0.5s ease",
          }}
        />

        {/* Translation indicator — top right */}
        {showTranslatingIndicator && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm text-xs text-white/80">
            <Loader2 className="w-3 h-3 animate-spin" />
          </div>
        )}

        {/* Decorative number — top left, large translucent */}
        <span
          className="absolute top-5 left-6 text-5xl font-heading font-light text-white/20 select-none pointer-events-none tabular-nums"
          data-testid={`number-practice-group-${group.slug}`}
        >
          {numberLabel}
        </span>

        {/* Content overlay — bottom */}
        <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7 flex flex-col">
          <div className="w-8 h-px bg-primary mb-4" />
          <h3
            className="text-base lg:text-lg font-medium text-white mb-3 uppercase tracking-[0.12em] leading-snug"
            data-testid={`text-practice-group-name-${group.slug}`}
          >
            {displayName}
          </h3>
          <p
            className="text-sm text-white/70 mb-5 line-clamp-2"
            data-testid={`text-practice-group-desc-${group.slug}`}
          >
            {displayDescription}
          </p>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-primary group-hover:gap-2.5 transition-all"
            data-testid={`link-practice-group-${group.slug}`}
          >
            {learnMoreText}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function PracticeGroups() {
  const { language } = useLanguage();

  const { data: practiceGroups, isLoading, error } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const content: Record<string, { title: string; subtitle: string; errorMessage: string; learnMore: string; searchPlaceholder: string; viewAll: string; noResults: string }> = {
    en: {
      title: "Practice Groups",
      subtitle: "Our expertise covers all major legal areas",
      errorMessage: "Failed to load practice groups",
      learnMore: "Learn More",
      searchPlaceholder: "Search...",
      viewAll: "View All",
      noResults: "No results found",
    },
    es: {
      title: "Áreas de Práctica",
      subtitle: "Nuestra experiencia cubre todas las principales áreas legales",
      errorMessage: "Error al cargar las áreas de práctica",
      learnMore: "Más Información",
      searchPlaceholder: "Buscar...",
      viewAll: "Ver todo",
      noResults: "No se encontraron resultados",
    },
    de: {
      title: "Praxisbereiche",
      subtitle: "Unsere Expertise deckt alle wichtigen Rechtsgebiete ab",
      errorMessage: "Fehler beim Laden der Praxisbereiche",
      learnMore: "Mehr erfahren",
      searchPlaceholder: "Suchen...",
      viewAll: "Alle anzeigen",
      noResults: "Keine Ergebnisse gefunden",
    },
    zh: {
      title: "业务领域",
      subtitle: "我们的专业覆盖所有主要法律领域",
      errorMessage: "加载业务领域失败",
      learnMore: "了解更多",
      searchPlaceholder: "搜索...",
      viewAll: "查看全部",
      noResults: "未找到结果",
    },
    ko: {
      title: "업무 분야",
      subtitle: "우리의 전문성은 모든 주요 법률 분야를 아우릅니다",
      errorMessage: "업무 분야 로드 실패",
      learnMore: "자세히 알아보기",
      searchPlaceholder: "검색...",
      viewAll: "전체 보기",
      noResults: "결과를 찾을 수 없습니다",
    },
    ja: {
      title: "取扱分野",
      subtitle: "当事務所の専門性はすべての主要な法律分野をカバーしています",
      errorMessage: "取扱分野の読み込みに失敗しました",
      learnMore: "詳しく見る",
      searchPlaceholder: "検索...",
      viewAll: "すべて表示",
      noResults: "結果が見つかりません",
    },
    ar: {
      title: "مجالات الممارسة",
      subtitle: "خبرتنا تغطي جميع المجالات القانونية الرئيسية",
      errorMessage: "فشل تحميل مجالات الممارسة",
      learnMore: "اعرف المزيد",
      searchPlaceholder: "بحث...",
      viewAll: "عرض الكل",
      noResults: "لم يتم العثور على نتائج",
    },
    ru: {
      title: "Практики",
      subtitle: "Наша экспертиза охватывает все основные области права",
      errorMessage: "Не удалось загрузить практики",
      learnMore: "Подробнее",
      searchPlaceholder: "Поиск...",
      viewAll: "Смотреть все",
      noResults: "Результаты не найдены",
    },
    fr: {
      title: "Domaines de pratique",
      subtitle: "Notre expertise couvre tous les principaux domaines juridiques",
      errorMessage: "Échec du chargement des domaines de pratique",
      learnMore: "En savoir plus",
      searchPlaceholder: "Rechercher...",
      viewAll: "Voir tout",
      noResults: "Aucun résultat trouvé",
    },
    it: {
      title: "Aree di pratica",
      subtitle: "La nostra competenza copre tutte le principali aree legali",
      errorMessage: "Impossibile caricare le aree di pratica",
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
    <div className="min-h-screen bg-background" data-testid="page-practice-groups">
      <SEOHead page="practiceGroups" language={language} />
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-practice-groups-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="h-0.5 w-12 bg-primary mx-auto mb-6" />
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-5 uppercase tracking-[0.15em]"
              data-testid="text-practice-groups-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-base text-white/60 max-w-2xl mx-auto"
              data-testid="text-practice-groups-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {error ? (
            <div className="text-center py-12" data-testid="container-practice-groups-error">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-practice-groups-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-none border-0 shadow-sm bg-muted"
                  data-testid={`skeleton-practice-group-${i}`}
                >
                  <CardContent className="p-6">
                    <Skeleton className="h-10 w-10 rounded-none mb-4" />
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
              whileInView="visible"
            viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {practiceGroups?.map((group, idx) => (
                <motion.div key={group.id} variants={itemVariants}>
                  <PracticeGroupCard group={group} index={idx} learnMoreText={t.learnMore} />
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
