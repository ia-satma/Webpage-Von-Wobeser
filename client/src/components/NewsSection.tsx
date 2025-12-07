import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { News } from "@shared/schema";

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
        <div className="text-center">
          <span className="text-4xl md:text-5xl font-heading font-bold text-primary/30 tracking-wider">
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

interface NewsSectionProps {
  language: "es" | "en";
}

export default function NewsSection({ language }: NewsSectionProps) {
  const { data: newsItems, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const content = {
    en: {
      title: "news",
      seeMore: "SEE MORE",
      errorMessage: "Failed to load news",
    },
    es: {
      title: "noticias",
      seeMore: "VER M\u00c1S",
      errorMessage: "Error al cargar noticias",
    },
  };

  const t = content[language];

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
      <section id="news" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800" data-testid="section-news">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400" data-testid="text-news-error">{t.errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="news"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-news"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between gap-4 mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white tracking-wide"
            data-testid="text-news-title"
          >
            {t.title}
          </h2>
          <a
            href="#"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            data-testid="link-news-see-more"
          >
            {t.seeMore}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-sm rounded-none bg-white dark:bg-gray-900" data-testid={`skeleton-news-${i}`}>
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
                <Link href={`/news/${item.slug}`} className="block">
                  <Card
                    className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-none bg-white dark:bg-gray-900"
                    data-testid={`card-news-${item.id}`}
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <NewsImageWithFallback
                        src={item.imageUrl || ""}
                        alt={language === "es" ? item.titleEs : item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3" data-testid={`text-news-date-${item.id}`}>
                        {item.date ? new Date(item.date).toLocaleDateString(
                          language === "es" ? "es-MX" : "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        ) : ""}
                      </p>
                      <h3 
                        className="text-lg font-serif text-gray-800 dark:text-white leading-relaxed mb-4 line-clamp-3"
                        data-testid={`text-news-title-${item.id}`}
                      >
                        {language === "es" ? item.titleEs : item.title}
                      </h3>
                      <span
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
                        data-testid={`link-news-read-${item.id}`}
                      >
                        {t.seeMore}
                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 text-center md:hidden">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-medium text-primary touch-manipulation"
            data-testid="link-news-see-more-mobile"
          >
            {t.seeMore}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
