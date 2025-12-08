import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, ArrowRight, Search, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { type News } from "@shared/schema";

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

export default function ArticlesPage() {
  const { language, displayLanguage } = useLanguage();
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
  };

  const t = content[displayLanguage];

  const filteredArticles = articles?.filter(article => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const title = language === "es" ? article.titleEs : article.title;
    const excerpt = language === "es" ? article.excerptEs : article.excerpt;
    return title.toLowerCase().includes(query) || excerpt.toLowerCase().includes(query);
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(language === "es" ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-articles">
      <SEOHead page="articles" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-articles-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-articles-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-articles-subtitle"
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
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-md"
                data-testid="input-search-articles"
              />
            </div>
          </motion.div>

          {error ? (
            <div className="text-center py-12" data-testid="container-articles-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-articles-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md overflow-hidden border-0 shadow-sm"
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
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t.noResults}
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16" 
                data-testid="container-articles-coming-soon"
              >
                <FileText className="w-16 h-16 text-primary/40 mx-auto mb-6" />
                <h2 
                  className="text-3xl font-heading font-light mb-4"
                  style={{ color: "#AC162C" }}
                  data-testid="text-coming-soon-title"
                >
                  {t.comingSoon}
                </h2>
                <p 
                  className="text-gray-600 dark:text-gray-400 max-w-md mx-auto"
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
                  <Link href={`/news/${article.slug}`}>
                    <Card
                      className="group h-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
                      data-testid={`card-article-${article.slug}`}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <ArticleImageWithFallback
                          src={article.imageUrl || ""}
                          alt={language === "es" ? article.titleEs : article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <Calendar className="w-4 h-4" />
                          <span data-testid={`text-article-date-${article.slug}`}>
                            {formatDate(article.date)}
                          </span>
                        </div>
                        <h3 
                          className="text-xl font-semibold text-gray-800 dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-2"
                          data-testid={`text-article-title-${article.slug}`}
                        >
                          {language === "es" ? article.titleEs : article.title}
                        </h3>
                        <p 
                          className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4"
                          data-testid={`text-article-excerpt-${article.slug}`}
                        >
                          {language === "es" ? article.excerptEs : article.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                          {t.readMore}
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
