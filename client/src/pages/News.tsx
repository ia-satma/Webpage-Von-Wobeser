import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, ArrowRight, Search, Newspaper, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import { newsCategories, type News } from "@shared/schema";

function NewsImageWithFallback({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError || !src) {
    return (
      <div className={`bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ${className}`}>
        <span className="text-4xl font-heading font-bold text-primary/30 tracking-wider">
          VWS
        </span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

const languageToLocale: Record<string, string> = {
  en: 'en-US',
  es: 'es-MX',
  de: 'de-DE',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ja: 'ja-JP',
  ar: 'ar-SA',
  ru: 'ru-RU',
  fr: 'fr-FR',
  it: 'it-IT',
};

interface NewsCardProps {
  article: News;
  readMoreText: string;
}

function NewsCard({ article, readMoreText }: NewsCardProps) {
  const { language } = useLanguage();
  const isSpanish = language === 'es';
  
  const { translatedFields, isLoading, isTranslating } = useTranslatedContent({
    contentType: 'news',
    entityId: String(article.id),
    fields: {
      title: article.titleEs || article.title,
      titleEs: article.titleEs,
      excerpt: article.excerptEs || article.excerpt,
      excerptEs: article.excerptEs,
    },
    enabled: !isSpanish,
  });

  const displayTitle = isSpanish 
    ? (article.titleEs || article.title)
    : (translatedFields.title || article.titleEs || article.title);
  const displayExcerpt = isSpanish
    ? (article.excerptEs || article.excerpt)
    : (translatedFields.excerpt || article.excerptEs || article.excerpt);
  
  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const locale = languageToLocale[language] || 'en-US';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = () => {
    if (!article.category) return null;
    if (language === "es" && article.categoryEs) {
      return article.categoryEs;
    }
    return article.category.charAt(0).toUpperCase() + article.category.slice(1);
  };

  const showTranslatingIndicator = isLoading || isTranslating;

  return (
    <Link href={`/news/${article.slug}`}>
      <Card
        className="group h-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
        data-testid={`card-news-${article.slug}`}
      >
        <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
          <NewsImageWithFallback
            src={article.imageUrl || ""}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {article.category && (
            <span 
              className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-primary text-white rounded"
              data-testid={`badge-category-${article.slug}`}
            >
              {getCategoryLabel()}
            </span>
          )}
          {showTranslatingIndicator && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded text-xs text-white">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <Calendar className="w-4 h-4" />
            <span data-testid={`text-news-date-${article.slug}`}>
              {formatDate(article.date)}
            </span>
          </div>
          <h3 
            className="text-xl font-semibold text-gray-800 dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-2"
            data-testid={`text-news-title-${article.slug}`}
          >
            {displayTitle}
          </h3>
          <p 
            className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4"
            data-testid={`text-news-excerpt-${article.slug}`}
          >
            {displayExcerpt}
          </p>
          <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
            {readMoreText}
            <ArrowRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function NewsPage() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: news, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const content: Record<string, {
    title: string;
    subtitle: string;
    errorMessage: string;
    searchPlaceholder: string;
    readMore: string;
    noResults: string;
    published: string;
    all: string;
    press: string;
    insights: string;
    rankings: string;
    events: string;
    alerts: string;
    filterBy: string;
    category: string;
    allCategories: string;
  }> = {
    en: {
      title: "News & Insights",
      subtitle: "News and insights",
      errorMessage: "Failed to load news",
      searchPlaceholder: "Search...",
      readMore: "Read More",
      noResults: "No news found",
      published: "Published",
      all: "All",
      press: "Press",
      insights: "Insights",
      rankings: "Rankings",
      events: "Events",
      alerts: "Alerts",
      filterBy: "Filter by",
      category: "Category",
      allCategories: "All Categories",
    },
    es: {
      title: "Noticias e Insights",
      subtitle: "Noticias y perspectivas",
      errorMessage: "Error al cargar las noticias",
      searchPlaceholder: "Buscar...",
      readMore: "Leer Más",
      noResults: "No se encontraron noticias",
      published: "Publicado",
      all: "Todos",
      press: "Prensa",
      insights: "Insights",
      rankings: "Rankings",
      events: "Eventos",
      alerts: "Alertas",
      filterBy: "Filtrar por",
      category: "Categoría",
      allCategories: "Todas las categorías",
    },
    de: {
      title: "Nachrichten",
      subtitle: "Neuigkeiten und Einblicke",
      errorMessage: "Nachrichten konnten nicht geladen werden",
      searchPlaceholder: "Suchen...",
      readMore: "Weiterlesen",
      noResults: "Keine Nachrichten gefunden",
      published: "Veröffentlicht",
      all: "Alle",
      press: "Presse",
      insights: "Einblicke",
      rankings: "Rankings",
      events: "Veranstaltungen",
      alerts: "Mitteilungen",
      filterBy: "Filtern nach",
      category: "Kategorie",
      allCategories: "Alle Kategorien",
    },
    zh: {
      title: "新闻",
      subtitle: "新闻与见解",
      errorMessage: "加载新闻失败",
      searchPlaceholder: "搜索...",
      readMore: "阅读更多",
      noResults: "未找到新闻",
      published: "发布于",
      all: "全部",
      press: "新闻稿",
      insights: "洞察",
      rankings: "排名",
      events: "活动",
      alerts: "公告",
      filterBy: "筛选",
      category: "类别",
      allCategories: "所有类别",
    },
    ko: {
      title: "뉴스 및 인사이트",
      subtitle: "뉴스와 인사이트",
      errorMessage: "뉴스 로드 실패",
      searchPlaceholder: "검색...",
      readMore: "더 읽기",
      noResults: "뉴스를 찾을 수 없습니다",
      published: "게시일",
      all: "전체",
      press: "보도자료",
      insights: "인사이트",
      rankings: "순위",
      events: "이벤트",
      alerts: "공지",
      filterBy: "필터",
      category: "카테고리",
      allCategories: "모든 카테고리",
    },
    ja: {
      title: "ニュースとインサイト",
      subtitle: "ニュースと洞察",
      errorMessage: "ニュースの読み込みに失敗しました",
      searchPlaceholder: "検索...",
      readMore: "続きを読む",
      noResults: "ニュースが見つかりません",
      published: "公開日",
      all: "すべて",
      press: "プレス",
      insights: "インサイト",
      rankings: "ランキング",
      events: "イベント",
      alerts: "お知らせ",
      filterBy: "フィルター",
      category: "カテゴリー",
      allCategories: "すべてのカテゴリー",
    },
    ar: {
      title: "الأخبار والرؤى",
      subtitle: "الأخبار والرؤى",
      errorMessage: "فشل تحميل الأخبار",
      searchPlaceholder: "بحث...",
      readMore: "اقرأ المزيد",
      noResults: "لم يتم العثور على أخبار",
      published: "نُشر",
      all: "الكل",
      press: "صحافة",
      insights: "رؤى",
      rankings: "تصنيفات",
      events: "فعاليات",
      alerts: "تنبيهات",
      filterBy: "تصفية حسب",
      category: "الفئة",
      allCategories: "جميع الفئات",
    },
    ru: {
      title: "Новости",
      subtitle: "Новости и аналитика",
      errorMessage: "Не удалось загрузить новости",
      searchPlaceholder: "Поиск...",
      readMore: "Читать далее",
      noResults: "Новости не найдены",
      published: "Опубликовано",
      all: "Все",
      press: "Пресса",
      insights: "Аналитика",
      rankings: "Рейтинги",
      events: "Мероприятия",
      alerts: "Уведомления",
      filterBy: "Фильтр",
      category: "Категория",
      allCategories: "Все категории",
    },
    fr: {
      title: "Actualités et perspectives",
      subtitle: "Actualités et perspectives",
      errorMessage: "Échec du chargement des actualités",
      searchPlaceholder: "Rechercher...",
      readMore: "Lire la suite",
      noResults: "Aucune actualité trouvée",
      published: "Publié",
      all: "Tout",
      press: "Presse",
      insights: "Perspectives",
      rankings: "Classements",
      events: "Événements",
      alerts: "Alertes",
      filterBy: "Filtrer par",
      category: "Catégorie",
      allCategories: "Toutes les catégories",
    },
    it: {
      title: "Notizie",
      subtitle: "Notizie e approfondimenti",
      errorMessage: "Impossibile caricare le notizie",
      searchPlaceholder: "Cerca...",
      readMore: "Leggi di più",
      noResults: "Nessuna notizia trovata",
      published: "Pubblicato",
      all: "Tutto",
      press: "Stampa",
      insights: "Approfondimenti",
      rankings: "Classifiche",
      events: "Eventi",
      alerts: "Avvisi",
      filterBy: "Filtra per",
      category: "Categoria",
      allCategories: "Tutte le categorie",
    },
  };

  const translationBannerMessages: Record<string, string> = {
    de: "Inhalte werden automatisch übersetzt.",
    zh: "内容正在自动翻译中。",
    ko: "콘텐츠가 자동으로 번역됩니다.",
    ja: "コンテンツは自動翻訳されています。",
    ar: "يتم ترجمة المحتوى تلقائياً.",
    ru: "Содержимое автоматически переводится.",
    fr: "Le contenu est traduit automatiquement.",
    it: "Il contenuto viene tradotto automaticamente.",
  };

  const t = content[language] || content.en;
  const isNonNativeLanguage = language !== 'es';
  const translationBanner = isNonNativeLanguage ? (translationBannerMessages[language] || (language === 'en' ? "Content is automatically translated from Spanish." : null)) : null;

  const categoryFilters = [
    { value: "all", label: language === "es" ? "Todos" : "All" },
    ...newsCategories.map(cat => ({
      value: cat.value,
      label: language === "es" ? cat.es : cat.en,
    })),
  ];

  const filteredNews = news?.filter(article => {
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    if (!searchQuery) return matchesCategory;
    
    const query = searchQuery.toLowerCase();
    const title = language === "es" ? article.titleEs : article.title;
    const excerpt = language === "es" ? article.excerptEs : article.excerpt;
    const matchesSearch = title.toLowerCase().includes(query) || excerpt.toLowerCase().includes(query);
    
    return matchesCategory && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news">
      <SEOHead page="news" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-news-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-3xl md:text-4xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]"
              data-testid="text-news-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-news-subtitle"
            >
              {t.subtitle}
            </p>
            {translationBanner && (
              <p 
                className="mt-4 text-sm italic text-white/70 max-w-2xl mx-auto"
                data-testid="text-translation-banner"
              >
                {translationBanner}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-2" data-testid="container-category-filters">
              {categoryFilters.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`transition-all ${
                    selectedCategory === cat.value 
                      ? "bg-primary text-white" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  data-testid={`button-filter-${cat.value}`}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-md"
                data-testid="input-search-news"
              />
            </div>
          </motion.div>

          {error ? (
            <div className="text-center py-12" data-testid="container-news-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-news-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md overflow-hidden border-0 shadow-sm"
                  data-testid={`skeleton-news-${i}`}
                >
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNews && filteredNews.length === 0 ? (
            <div className="text-center py-12" data-testid="container-news-empty">
              <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t.noResults}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredNews?.map((article) => (
                <motion.div key={article.id} variants={itemVariants}>
                  <NewsCard article={article} readMoreText={t.readMore} />
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
