import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { getIcon } from "@/lib/icons";
import type { PracticeGroup } from "@shared/schema";

export default function PracticeGroups() {
  const { language, displayLanguage } = useLanguage();

  const { data: practiceGroups, isLoading, error } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const content = {
    en: {
      title: "Practice Groups",
      subtitle: "Our specialized legal teams provide comprehensive solutions across all major practice areas",
      errorMessage: "Failed to load practice groups",
      learnMore: "Learn More",
    },
    es: {
      title: "Áreas de Práctica",
      subtitle: "Nuestros equipos legales especializados brindan soluciones integrales en todas las áreas de práctica principales",
      errorMessage: "Error al cargar las áreas de práctica",
      learnMore: "Más Información",
    },
  };

  const translationBannerMessages: Record<string, string> = {
    de: "Inhalte werden in Englisch angezeigt. Klicken Sie auf einen Praxisbereich für vollständige Übersetzung.",
    zh: "内容以英语显示。点击业务领域查看完整翻译。",
    ko: "콘텐츠가 영어로 표시됩니다. 업무 분야를 클릭하면 전체 번역을 볼 수 있습니다.",
    ja: "コンテンツは英語で表示されています。業務分野をクリックして完全な翻訳をご覧ください。",
    ar: "يتم عرض المحتوى باللغة الإنجليزية. انقر على مجال الممارسة للترجمة الكاملة.",
    ru: "Содержимое отображается на английском языке. Нажмите на практику для полного перевода.",
    fr: "Le contenu est affiché en anglais. Cliquez sur un domaine de pratique pour la traduction complète.",
    it: "Il contenuto viene visualizzato in inglese. Fare clic su un'area di pratica per la traduzione completa.",
  };

  const t = content[displayLanguage];
  const isNonNativeLanguage = language !== 'en' && language !== 'es';
  const translationBanner = isNonNativeLanguage ? translationBannerMessages[language] : null;

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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-groups">
      <SEOHead page="practiceGroups" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-practice-groups-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-practice-groups-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-practice-groups-subtitle"
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
          {error ? (
            <div className="text-center py-12" data-testid="container-practice-groups-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-practice-groups-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md border-0 shadow-sm bg-gray-50 dark:bg-gray-800"
                  data-testid={`skeleton-practice-group-${i}`}
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
              {practiceGroups?.map((group) => {
                const IconComponent = getIcon(group.iconName);
                return (
                  <motion.div key={group.id} variants={itemVariants}>
                    <Link href={`/practice-groups/${group.slug}`}>
                      <Card
                        className="group h-full rounded-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
                        data-testid={`card-practice-group-${group.slug}`}
                      >
                        <CardContent className="p-6">
                          <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                            <IconComponent className="w-6 h-6 text-primary" data-testid={`icon-practice-group-${group.slug}`} />
                          </div>
                          <h3 
                            className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary transition-colors"
                            data-testid={`text-practice-group-name-${group.slug}`}
                          >
                            {language === "es" ? group.nameEs : group.name}
                          </h3>
                          <p 
                            className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3"
                            data-testid={`text-practice-group-desc-${group.slug}`}
                          >
                            {language === "es" ? group.descriptionEs : group.description}
                          </p>
                          <span 
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all"
                            data-testid={`link-practice-group-${group.slug}`}
                          >
                            {t.learnMore}
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
