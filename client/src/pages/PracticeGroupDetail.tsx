import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getIcon } from "@/lib/icons";
import type { PracticeGroup, TeamMember } from "@shared/schema";

export default function PracticeGroupDetail() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: practiceGroup, isLoading, error } = useQuery<PracticeGroup>({
    queryKey: [`/api/practice-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team/partners"],
  });

  const content = {
    en: {
      backToAll: "All Practice Groups",
      contactUs: "Contact Us",
      contactCta: "Contact our team",
      contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges.",
      emailUs: "Email Us",
      callUs: "Call Us",
      ourTeam: "Meet Our Team",
      errorMessage: "Practice group not found",
      loading: "Loading...",
    },
    es: {
      backToAll: "Todas las Áreas de Práctica",
      contactUs: "Contáctenos",
      contactCta: "Contacte a nuestro equipo",
      contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar sus desafíos legales.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      ourTeam: "Conozca a Nuestro Equipo",
      errorMessage: "Área de práctica no encontrada",
      loading: "Cargando...",
    },
  };

  const t = content[language];

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-group-error">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h1>
            <Link href="/practice-groups">
              <Button variant="outline" data-testid="button-back-to-practice-groups">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToAll}
              </Button>
            </Link>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-group-loading">
        <Header language={language} onLanguageChange={setLanguage} />
        <section className="pt-32 pb-12 bg-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-5 w-48 bg-white/20 mb-6" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md bg-white/20" />
              <Skeleton className="h-12 w-64 bg-white/20" />
            </div>
          </div>
        </section>
        <main className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
          </div>
        </main>
        <Footer language={language} />
      </div>
    );
  }

  const IconComponent = practiceGroup ? getIcon(practiceGroup.iconName) : null;
  const displayName = language === "es" ? practiceGroup?.nameEs : practiceGroup?.name;
  const displayDescription = language === "es" 
    ? (practiceGroup?.fullDescriptionEs || practiceGroup?.descriptionEs) 
    : (practiceGroup?.fullDescription || practiceGroup?.description);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-group-detail">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-practice-group-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/practice-groups">
              <span 
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                data-testid="link-back-to-practice-groups"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToAll}
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {IconComponent && (
                <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-white" data-testid="icon-practice-group-detail" />
                </div>
              )}
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white"
                data-testid="text-practice-group-title"
              >
                {displayName}
              </h1>
            </div>
          </motion.div>
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
              className="prose prose-lg dark:prose-invert max-w-none mb-16"
              data-testid="container-practice-group-description"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          </motion.div>

          {teamMembers && teamMembers.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
              data-testid="section-team-members"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-8"
                data-testid="text-our-team-title"
              >
                {t.ourTeam}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.slice(0, 4).map((member) => (
                  <Card 
                    key={member.id}
                    className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    data-testid={`card-team-member-${member.slug}`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-gray-800 dark:text-white truncate"
                          data-testid={`text-team-member-name-${member.slug}`}
                        >
                          {member.name}
                        </h3>
                        <p 
                          className="text-sm text-gray-600 dark:text-gray-400 truncate"
                          data-testid={`text-team-member-role-${member.slug}`}
                        >
                          {language === "es" ? member.roleEs : member.role}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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

      <Footer language={language} />
    </div>
  );
}
