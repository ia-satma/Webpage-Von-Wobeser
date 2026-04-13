import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, ArrowRight, Search, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import { type News } from "@shared/schema";

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

function ArticleImageWithFallback({ 
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

interface ArticleCardProps {
  article: News;
  readMoreText: string;
}

function ArticleCard({ article, readMoreText }: ArticleCardProps) {
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

  const showTranslatingIndicator = isLoading || isTranslating;

  return (
    <Link href={`/news/${article.slug}`}>
      <Card
        className="group h-full rounded-none overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-card"
        data-testid={`card-article-${article.slug}`}
      >
        <div className="relative h-48 overflow-hidden bg-muted">
          <ArticleImageWithFallback
            src={article.imageUrl || ""}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {showTranslatingIndicator && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded text-xs text-white">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="w-4 h-4" />
            <span data-testid={`text-article-date-${article.slug}`}>
              {formatDate(article.date)}
            </span>
          </div>
          <h3 
            className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2"
            data-testid={`text-article-title-${article.slug}`}
          >
            {displayTitle}
          </h3>
          <p 
            className="text-muted-foreground text-sm line-clamp-3 mb-4"
            data-testid={`text-article-excerpt-${article.slug}`}
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

export default function ArticlesPage() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: articles, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const content = {
    en: {
      title: "Articles",
      subtitle: "Legal insights and publications from Von Wobeser y Sierra",
      errorMessage: "Failed to load articles",
      searchPlaceholder: "Search articles...",
      readMore: "Read More",
      noResults: "No articles match your search",
      comingSoon: "Coming Soon",
      comingSoonMessage: "We are preparing new articles. Please check back soon.",
      published: "Published",
    },
    es: {
      title: "Artículos",
      subtitle: "Insights legales y publicaciones de Von Wobeser y Sierra",
      errorMessage: "Error al cargar los artículos",
      searchPlaceholder: "Buscar artículos...",
      readMore: "Leer Más",
      noResults: "No hay artículos que coincidan con su búsqueda",
      comingSoon: "Próximamente",
      comingSoonMessage: "Estamos preparando nuevos artículos. Por favor regrese pronto.",
      published: "Publicado",
    },
    de: {
      title: "Artikel",
      subtitle: "Einblicke und Analysen unserer Experten",
      errorMessage: "Artikel konnten nicht geladen werden",
      searchPlaceholder: "Artikel suchen...",
      readMore: "Weiterlesen",
      noResults: "Keine Artikel entsprechen Ihrer Suche",
      comingSoon: "Demnächst",
      comingSoonMessage: "Wir bereiten neue Artikel vor. Bitte schauen Sie bald wieder vorbei.",
      published: "Veröffentlicht",
    },
    zh: {
      title: "文章",
      subtitle: "来自我们专家的见解与分析",
      errorMessage: "文章加载失败",
      searchPlaceholder: "搜索文章...",
      readMore: "阅读更多",
      noResults: "没有符合搜索条件的文章",
      comingSoon: "即将推出",
      comingSoonMessage: "我们正在准备新文章，请稍后再来。",
      published: "发布日期",
    },
    ko: {
      title: "기사",
      subtitle: "전문가의 통찰력과 분석",
      errorMessage: "기사를 불러오지 못했습니다",
      searchPlaceholder: "기사 검색...",
      readMore: "자세히 보기",
      noResults: "검색 결과가 없습니다",
      comingSoon: "곧 출시",
      comingSoonMessage: "새로운 기사를 준비 중입니다. 곧 다시 확인해 주세요.",
      published: "게시일",
    },
    ja: {
      title: "記事",
      subtitle: "専門家による洞察と分析",
      errorMessage: "記事の読み込みに失敗しました",
      searchPlaceholder: "記事を検索...",
      readMore: "続きを読む",
      noResults: "検索に一致する記事がありません",
      comingSoon: "近日公開",
      comingSoonMessage: "新しい記事を準備中です。しばらくしてから再度ご確認ください。",
      published: "公開日",
    },
    ar: {
      title: "المقالات",
      subtitle: "رؤى وتحليلات من خبرائنا",
      errorMessage: "فشل تحميل المقالات",
      searchPlaceholder: "البحث في المقالات...",
      readMore: "اقرأ المزيد",
      noResults: "لا توجد مقالات تطابق بحثك",
      comingSoon: "قريباً",
      comingSoonMessage: "نحن نعد مقالات جديدة. يرجى العودة قريباً.",
      published: "تاريخ النشر",
    },
    ru: {
      title: "Статьи",
      subtitle: "Аналитика и публикации наших экспертов",
      errorMessage: "Не удалось загрузить статьи",
      searchPlaceholder: "Поиск статей...",
      readMore: "Читать далее",
      noResults: "Статьи по вашему запросу не найдены",
      comingSoon: "Скоро",
      comingSoonMessage: "Мы готовим новые статьи. Пожалуйста, загляните позже.",
      published: "Опубликовано",
    },
    fr: {
      title: "Articles",
      subtitle: "Perspectives et analyses de nos experts",
      errorMessage: "Échec du chargement des articles",
      searchPlaceholder: "Rechercher des articles...",
      readMore: "Lire la suite",
      noResults: "Aucun article ne correspond à votre recherche",
      comingSoon: "Bientôt disponible",
      comingSoonMessage: "Nous préparons de nouveaux articles. Revenez bientôt.",
      published: "Publié le",
    },
    it: {
      title: "Articoli",
      subtitle: "Approfondimenti e analisi dei nostri esperti",
      errorMessage: "Impossibile caricare gli articoli",
      searchPlaceholder: "Cerca articoli...",
      readMore: "Leggi di più",
      noResults: "Nessun articolo corrisponde alla tua ricerca",
      comingSoon: "Prossimamente",
      comingSoonMessage: "Stiamo preparando nuovi articoli. Torna presto.",
      published: "Pubblicato il",
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

  const filteredArticles = articles?.filter(article => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const title = language === "es" ? article.titleEs : article.title;
    const excerpt = language === "es" ? article.excerptEs : article.excerpt;
    return title.toLowerCase().includes(query) || excerpt.toLowerCase().includes(query);
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
    <div className="min-h-screen bg-background" data-testid="page-articles">
      <SEOHead page="articles" language={language} />
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-articles-hero">
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
              data-testid="text-articles-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-base text-white/60 max-w-2xl mx-auto"
              data-testid="text-articles-subtitle"
            >
              {t.subtitle}
            </p>
            {translationBanner && (
              <p 
                className="mt-4 text-sm text-white/50 max-w-2xl mx-auto"
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-none"
                data-testid="input-search-articles"
              />
            </div>
          </motion.div>

          {error ? (
            <div className="text-center py-12" data-testid="container-articles-error">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-articles-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-none overflow-hidden border-0 shadow-sm"
                  data-testid={`skeleton-article-${i}`}
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
          ) : !filteredArticles || filteredArticles.length === 0 ? (
            searchQuery ? (
              <div className="text-center py-12" data-testid="container-articles-empty">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t.noResults}
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center py-16" 
                data-testid="container-articles-coming-soon"
              >
                <FileText className="w-16 h-16 text-primary/40 mx-auto mb-6" />
                <h2 
                  className="text-2xl font-heading font-light mb-4 uppercase tracking-[0.12em]"
                  style={{ color: "#AA1A2E" }}
                  data-testid="text-coming-soon-title"
                >
                  {t.comingSoon}
                </h2>
                <p 
                  className="text-muted-foreground max-w-md mx-auto"
                  data-testid="text-coming-soon-message"
                >
                  {t.comingSoonMessage}
                </p>
              </motion.div>
            )
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredArticles?.map((article) => (
                <motion.div key={article.id} variants={itemVariants}>
                  <ArticleCard article={article} readMoreText={t.readMore} />
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
