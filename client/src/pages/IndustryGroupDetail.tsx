import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { getIcon } from "@/lib/icons";
import type { IndustryGroup, PracticeGroup } from "@shared/schema";

export default function IndustryGroupDetail() {
  const { language, displayLanguage } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: industryGroup, isLoading, error } = useQuery<IndustryGroup>({
    queryKey: [`/api/industry-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const content = {
    en: {
      backToAll: "All Industry Groups",
      contactUs: "Contact Us",
      contactCta: "Contact our team",
      contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges in this industry.",
      emailUs: "Email Us",
      callUs: "Call Us",
      relatedServices: "Related Practice Areas",
      errorMessage: "Industry group not found",
      loading: "Loading...",
    },
    es: {
      backToAll: "Todas las Industrias",
      contactUs: "Contáctenos",
      contactCta: "Contacte a nuestro equipo",
      contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar los desafíos legales de esta industria.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      relatedServices: "Áreas de Práctica Relacionadas",
      errorMessage: "Industria no encontrada",
      loading: "Cargando...",
    },
  };

  const t = content[displayLanguage];

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-group-error">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h1>
            <Link href="/industry-groups">
              <Button variant="outline" data-testid="button-back-to-industry-groups">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToAll}
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-group-loading">
        <Header />
        <section className="pt-32 pb-12 bg-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-5 w-48 bg-white/20 mb-6" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md bg-white/20" />
              <Skeleton className="h-12 w-64 bg-white/20" />
            </div>
          </div>
        </section>
        <main id="main-content" className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const IconComponent = industryGroup ? getIcon(industryGroup.iconName) : null;
  const displayName = language === "es" ? industryGroup?.nameEs : industryGroup?.name;
  const displayDescription = language === "es" 
    ? (industryGroup?.fullDescriptionEs || industryGroup?.descriptionEs) 
    : (industryGroup?.fullDescription || industryGroup?.description);

  const relatedPracticeGroups = practiceGroups?.slice(0, 4);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-group-detail">
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-industry-group-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/industry-groups">
              <span 
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                data-testid="link-back-to-industry-groups"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToAll}
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {IconComponent && (
                <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-white" data-testid="icon-industry-group-detail" />
                </div>
              )}
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white"
                data-testid="text-industry-group-title"
              >
                {displayName}
              </h1>
            </div>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-16"
              data-testid="container-industry-group-description"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          </motion.div>

          {relatedPracticeGroups && relatedPracticeGroups.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
              data-testid="section-related-services"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6"
                data-testid="text-related-services-title"
              >
                {t.relatedServices}
              </h2>
              <div className="flex flex-wrap gap-3">
                {relatedPracticeGroups.map((practiceGroup) => (
                  <Link key={practiceGroup.id} href={`/practice-groups/${practiceGroup.slug}`}>
                    <Badge 
                      variant="secondary"
                      className="cursor-pointer text-sm px-4 py-2 rounded-md"
                      data-testid={`badge-related-practice-${practiceGroup.slug}`}
                    >
                      {language === "es" ? practiceGroup.nameEs : practiceGroup.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-md p-8 lg:p-12"
            data-testid="section-contact-cta"
          >
            <h2 
              className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-3"
              data-testid="text-contact-cta-title"
            >
              {t.contactCta}
            </h2>
            <p 
              className="text-gray-600 dark:text-gray-400 mb-6"
              data-testid="text-contact-cta-subtitle"
            >
              {t.contactSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="rounded-md"
                data-testid="button-email-us"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t.emailUs}
              </Button>
              <Button 
                variant="outline"
                className="rounded-md"
                data-testid="button-call-us"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t.callUs}
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
