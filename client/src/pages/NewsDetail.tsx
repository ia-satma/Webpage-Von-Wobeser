import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Share2, Linkedin, Twitter, Facebook, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { News } from "@shared/schema";

export default function NewsDetail() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: newsArticle, isLoading, error } = useQuery<News>({
    queryKey: [`/api/news/${slug}`],
    enabled: !!slug,
  });

  const { data: allNews } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const content = {
    en: {
      backToNews: "Back to News",
      share: "Share this article",
      relatedNews: "Related News",
      errorMessage: "Article not found",
      loading: "Loading...",
      readMore: "Read More",
    },
    es: {
      backToNews: "Volver a Noticias",
      share: "Compartir este artículo",
      relatedNews: "Noticias Relacionadas",
      errorMessage: "Artículo no encontrado",
      loading: "Cargando...",
      readMore: "Leer Más",
    },
  };

  const t = content[language];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d 'de' MMMM, yyyy", {
      locale: language === "es" ? es : enUS,
    });
  };

  const handleShare = (platform: "linkedin" | "twitter" | "facebook") => {
    const url = window.location.href;
    const title = language === "es" ? newsArticle?.titleEs : newsArticle?.title;
    
    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || "")}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };
    
    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  const scrollToNewsSection = () => {
    window.location.href = "/#news";
  };

  const relatedNews = allNews?.filter((item) => item.id !== newsArticle?.id).slice(0, 3);

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news-error">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h1>
            <Button 
              variant="outline" 
              onClick={scrollToNewsSection}
              data-testid="button-back-to-news"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToNews}
            </Button>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news-loading">
        <Header language={language} onLanguageChange={setLanguage} />
        <section className="pt-24 relative">
          <Skeleton className="w-full h-[50vh] min-h-[400px]" />
        </section>
        <main className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-3/4 mb-8" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
          </div>
        </main>
        <Footer language={language} />
      </div>
    );
  }

  const displayTitle = language === "es" ? newsArticle?.titleEs : newsArticle?.title;
  const displayContent = language === "es" 
    ? (newsArticle?.contentEs || newsArticle?.excerptEs) 
    : (newsArticle?.content || newsArticle?.excerpt);
  const heroImage = newsArticle?.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  const generateArticleJsonLd = () => {
    if (!newsArticle) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": language === "es" ? newsArticle.titleEs : newsArticle.title,
      "description": language === "es" ? newsArticle.excerptEs : newsArticle.excerpt,
      "image": newsArticle.imageUrl,
      "datePublished": newsArticle.date,
      "dateModified": newsArticle.date,
      "author": {
        "@type": "Organization",
        "name": "Von Wobeser y Sierra, S.C.",
        "url": "https://www.vonwobeser.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Von Wobeser y Sierra, S.C.",
        "logo": {
          "@type": "ImageObject",
          "url": "https://vonwobeser.com/images/vonwobeser_2025_.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://www.vonwobeser.com/news/${newsArticle.slug}`
      }
    };
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news-detail">
      <Header language={language} onLanguageChange={setLanguage} />
      
      {newsArticle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateArticleJsonLd()) }}
        />
      )}
      
      <section className="pt-24 relative" data-testid="section-news-hero">
        <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
          <img
            src={heroImage}
            alt={displayTitle || ""}
            className="w-full h-full object-cover"
            data-testid="img-news-hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-4xl mx-auto px-6 lg:px-12 pb-12 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <button
                  onClick={scrollToNewsSection}
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                  data-testid="link-back-to-news"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToNews}
                </button>
                
                <div className="flex items-center gap-2 text-white/85 text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-news-date">{formatDate(newsArticle?.date || null)}</span>
                </div>
                
                <h1 
                  className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white leading-tight"
                  data-testid="text-news-title"
                >
                  {displayTitle}
                </h1>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <main className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              data-testid="container-news-content"
            >
              {displayContent?.split('\n').map((paragraph, index) => (
                <p 
                  key={index} 
                  className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div 
              className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-16"
              data-testid="section-share"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.share}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("linkedin")}
                    data-testid="button-share-linkedin"
                  >
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("twitter")}
                    data-testid="button-share-twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("facebook")}
                    data-testid="button-share-facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {relatedNews && relatedNews.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              data-testid="section-related-news"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-8"
                data-testid="text-related-news-title"
              >
                {t.relatedNews}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/news/${item.slug}`}
                    className="block"
                  >
                    <Card
                      className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-none bg-white dark:bg-gray-800 hover-elevate"
                      data-testid={`card-related-news-${item.id}`}
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                          alt={language === "es" ? item.titleEs : item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          data-testid={`img-related-news-${item.id}`}
                        />
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2" data-testid={`text-related-news-date-${item.id}`}>
                          {formatDate(item.date)}
                        </p>
                        <h3 
                          className="text-base font-serif text-gray-800 dark:text-white leading-relaxed line-clamp-2"
                          data-testid={`text-related-news-title-${item.id}`}
                        >
                          {language === "es" ? item.titleEs : item.title}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
