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
import type { IndustryGroup } from "@shared/schema";

export default function IndustryGroups() {
  const { language } = useLanguage();

  const { data: industryGroups, isLoading, error } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content: Record<string, { title: string; subtitle: string; errorMessage: string; learnMore: string }> = {
    en: {
      title: "Industry Groups",
      subtitle: "Delivering specialized legal expertise across key industry sectors to address your unique business challenges",
      errorMessage: "Failed to load industry groups",
      learnMore: "Learn More",
    },
    es: {
      title: "Industrias",
      subtitle: "Brindando experiencia legal especializada en sectores industriales clave para abordar los desafíos únicos de su negocio",
      errorMessage: "Error al cargar las industrias",
      learnMore: "Más Información",
    },
    de: {
      title: "Branchengruppen",
      subtitle: "Spezialisierte juristische Expertise für wichtige Industriesektoren",
      errorMessage: "Fehler beim Laden der Branchengruppen",
      learnMore: "Mehr erfahren",
    },
    zh: {
      title: "行业组",
      subtitle: "为关键行业提供专业法律服务",
      errorMessage: "加载行业组失败",
      learnMore: "了解更多",
    },
    ko: {
      title: "산업 그룹",
      subtitle: "주요 산업 분야에 전문화된 법률 서비스 제공",
      errorMessage: "산업 그룹 로드 실패",
      learnMore: "자세히 알아보기",
    },
    ja: {
      title: "産業グループ",
      subtitle: "主要産業分野に特化した法的サービスを提供",
      errorMessage: "産業グループの読み込みに失敗しました",
      learnMore: "詳しく見る",
    },
    ar: {
      title: "مجموعات الصناعة",
      subtitle: "خبرة قانونية متخصصة في القطاعات الصناعية الرئيسية",
      errorMessage: "فشل تحميل مجموعات الصناعة",
      learnMore: "اعرف المزيد",
    },
    ru: {
      title: "Отраслевые группы",
      subtitle: "Специализированная юридическая экспертиза в ключевых отраслях",
      errorMessage: "Не удалось загрузить отраслевые группы",
      learnMore: "Подробнее",
    },
    fr: {
      title: "Groupes sectoriels",
      subtitle: "Expertise juridique spécialisée dans les secteurs industriels clés",
      errorMessage: "Échec du chargement des groupes sectoriels",
      learnMore: "En savoir plus",
    },
    it: {
      title: "Gruppi industriali",
      subtitle: "Competenza legale specializzata nei principali settori industriali",
      errorMessage: "Impossibile caricare i gruppi industriali",
      learnMore: "Scopri di più",
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
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
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
              {industryGroups?.map((group) => {
                const IconComponent = getIcon(group.iconName);
                return (
                  <motion.div key={group.id} variants={itemVariants}>
                    <Link href={`/industry-groups/${group.slug}`}>
                      <Card
                        className="group h-full rounded-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
                        data-testid={`card-industry-group-${group.slug}`}
                      >
                        <CardContent className="p-6">
                          <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                            <IconComponent className="w-6 h-6 text-primary" data-testid={`icon-industry-group-${group.slug}`} />
                          </div>
                          <h3 
                            className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary transition-colors"
                            data-testid={`text-industry-group-name-${group.slug}`}
                          >
                            {language === "es" ? group.nameEs : group.name}
                          </h3>
                          <p 
                            className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3"
                            data-testid={`text-industry-group-desc-${group.slug}`}
                          >
                            {language === "es" ? group.descriptionEs : group.description}
                          </p>
                          <span 
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all"
                            data-testid={`link-industry-group-${group.slug}`}
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
