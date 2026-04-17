import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import type { News, LanguageCode } from "@shared/schema";

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
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center">
          <span className="text-4xl md:text-5xl font-heading font-light text-muted-foreground/60 tracking-[0.18em]">
            VWS
          </span>
        </div>
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

interface NewsContent {
  title: string;
  seeMore: string;
  errorMessage: string;
}

const content: Record<LanguageCode, NewsContent> = {
  en: {
    title: "news",
    seeMore: "SEE MORE",
    errorMessage: "Failed to load news",
  },
  es: {
    title: "noticias",
    seeMore: "VER MÁS",
    errorMessage: "Error al cargar noticias",
  },
  de: {
    title: "Neuigkeiten",
    seeMore: "MEHR ANZEIGEN",
    errorMessage: "Nachrichten konnten nicht geladen werden",
  },
  zh: {
    title: "新闻",
    seeMore: "查看更多",
    errorMessage: "新闻加载失败",
  },
  ko: {
    title: "뉴스",
    seeMore: "더 보기",
    errorMessage: "뉴스를 불러오지 못했습니다",
  },
  ja: {
    title: "ニュース",
    seeMore: "もっと見る",
    errorMessage: "ニュースの読み込みに失敗しました",
  },
  ar: {
    title: "الأخبار",
    seeMore: "عرض المزيد",
    errorMessage: "فشل في تحميل الأخبار",
  },
  ru: {
    title: "новости",
    seeMore: "СМОТРЕТЬ ВСЕ",
    errorMessage: "Не удалось загрузить новости",
  },
  fr: {
    title: "actualités",
    seeMore: "VOIR PLUS",
    errorMessage: "Échec du chargement des actualités",
  },
  it: {
    title: "notizie",
    seeMore: "VEDI ALTRO",
    errorMessage: "Impossibile caricare le notizie",
  },
};

const dateLocales: Record<LanguageCode, string> = {
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

interface NewsCardTranslatedProps {
  item: News;
  language: LanguageCode;
  dateLocale: string;
  seeMoreText: string;
}

function NewsCardTranslated({ item, language, dateLocale, seeMoreText }: NewsCardTranslatedProps) {
  const isSpanish = language === 'es';
  
  const { translatedFields, isLoading: isTranslating } = useTranslatedContent({
    contentType: 'news',
    entityId: item.id,
    fields: {
      title: item.titleEs || item.title || '',
      titleEs: item.titleEs || '',
      excerpt: item.excerptEs || item.excerpt || '',
      excerptEs: item.excerptEs || '',
    },
    enabled: !isSpanish,
  });

  const getNewsTitle = () => {
    if (language === 'es') return item.titleEs || item.title;
    if (translatedFields.title) return translatedFields.title;
    return item.titleEs || item.title;
  };

  const getNewsExcerpt = () => {
    if (language === 'es') return item.excerptEs || item.excerpt;
    if (translatedFields.excerpt) return translatedFields.excerpt;
    return item.excerptEs || item.excerpt;
  };

  const displayTitle = getNewsTitle();
  const displayExcerpt = getNewsExcerpt();

  return (
    <Link href={`/news/${item.slug}`} className="block">
      <Card
        className="group overflow-hidden border-0 rounded-none bg-card transition-all duration-300"
        style={{ boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}
        data-testid={`card-news-${item.id}`}
      >
        <div className="aspect-[16/10] overflow-hidden">
          <NewsImageWithFallback
            src={item.imageUrl || ""}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3" data-testid={`text-news-date-${item.id}`}>
            {item.date ? new Date(item.date).toLocaleDateString(
              dateLocale,
              { year: "numeric", month: "long", day: "numeric" }
            ) : ""}
          </p>
          <h3 
            className={`text-lg font-publico text-[#1D1D1B] dark:text-white leading-relaxed mb-3 line-clamp-2 ${isTranslating ? 'opacity-50' : ''}`}
            data-testid={`text-news-title-${item.id}`}
          >
            {displayTitle}
          </h3>
          {displayExcerpt && (
            <p 
              className={`text-sm text-muted-foreground line-clamp-2 mb-4 ${isTranslating ? 'opacity-50' : ''}`}
              data-testid={`text-news-excerpt-${item.id}`}
            >
              {displayExcerpt}
            </p>
          )}
          <span
            className="inline-flex items-center gap-2 text-xs font-geomanist font-bold tracking-[0.15em] uppercase text-[#AA1A2E] hover:text-[#8A1525] transition-colors group/link no-underline"
            data-testid={`link-news-read-${item.id}`}
          >
            {seeMoreText}
            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default function NewsSection() {
  const { language } = useLanguage();
  const { data: newsItems, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const t = content[language] || content.en;
  const dateLocale = dateLocales[language] || dateLocales.en;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (error) {
    return (
      <section id="news" className="py-20 lg:py-28 bg-muted" data-testid="section-news">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-news-error">{t.errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="news"
      className="py-20 lg:py-28 bg-muted"
      data-testid="section-news"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex flex-col items-center mb-2">
            <h2
              className="text-2xl md:text-3xl font-geomanist tracking-[0.25em] uppercase text-[#3A3A3A] dark:text-white pb-3"
              data-testid="text-news-title"
            >
              {t.title}
            </h2>
            <div className="h-[2px] w-16 bg-[#AA1A2E]" aria-hidden="true" />
          </div>
          <div className="flex justify-end mt-4">
            <Link
              href="/news"
              className="hidden md:flex items-center gap-2 text-xs font-geomanist font-bold tracking-[0.15em] uppercase text-[#AA1A2E] hover:text-[#8A1525] no-underline transition-colors group"
              data-testid="link-news-see-more"
            >
              {t.seeMore}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 rounded-none bg-card" style={{ boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }} data-testid={`skeleton-news-${i}`}>
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-6">
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-5 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
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
            {newsItems?.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <NewsCardTranslated
                  item={item}
                  language={language}
                  dateLocale={dateLocale}
                  seeMoreText={t.seeMore}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 text-center md:hidden">
          <Link
            href="/news"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-geomanist font-bold tracking-[0.15em] uppercase text-[#AA1A2E] hover:text-[#8A1525] no-underline touch-manipulation"
            data-testid="link-news-see-more-mobile"
          >
            {t.seeMore}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
