import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Linkedin, AlertCircle, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { TeamMember, PracticeGroup } from "@shared/schema";

export default function TeamMemberDetail() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: member, isLoading, error } = useQuery<TeamMember>({
    queryKey: [`/api/team/${slug}`],
    enabled: !!slug,
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const content = {
    en: {
      backToAll: "All Team Members",
      partner: "Partner",
      contactInfo: "Contact Information",
      practiceAreas: "Practice Areas",
      biography: "Biography",
      contactCta: "Get in touch",
      contactSubtitle: "Connect with our team to discuss how we can assist with your legal needs.",
      emailUs: "Send Email",
      callUs: "Call",
      errorMessage: "Team member not found",
      loading: "Loading...",
    },
    es: {
      backToAll: "Todos los Miembros",
      partner: "Socio",
      contactInfo: "Información de Contacto",
      practiceAreas: "Áreas de Práctica",
      biography: "Biografía",
      contactCta: "Contáctenos",
      contactSubtitle: "Conéctese con nuestro equipo para discutir cómo podemos ayudarle con sus necesidades legales.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      errorMessage: "Miembro del equipo no encontrado",
      loading: "Cargando...",
    },
  };

  const t = content[language];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team-member-error">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h1>
            <Link href="/team">
              <Button variant="outline" data-testid="button-back-to-team">
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
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team-member-loading">
        <Header language={language} onLanguageChange={setLanguage} />
        <section className="pt-32 pb-12 bg-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-5 w-48 bg-white/20 mb-6" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Skeleton className="h-32 w-32 rounded-full bg-white/20" />
              <div className="text-center md:text-left">
                <Skeleton className="h-10 w-64 bg-white/20 mb-3" />
                <Skeleton className="h-6 w-48 bg-white/20 mb-2" />
                <Skeleton className="h-5 w-32 bg-white/20" />
              </div>
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

  const displayTitle = language === "es" ? member?.titleEs : member?.title;
  const displayRole = language === "es" ? member?.roleEs : member?.role;
  const displayBio = language === "es" ? member?.bioEs : member?.bio;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team-member-detail">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-team-member-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/team">
              <span 
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                data-testid="link-back-to-team"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToAll}
              </span>
            </Link>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white/20">
                  <AvatarImage 
                    src={member?.imageUrl || undefined} 
                    alt={member?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/10 text-white text-3xl font-light">
                    {member?.name ? getInitials(member.name) : ''}
                  </AvatarFallback>
                </Avatar>
                {member?.isPartner && (
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                    title={t.partner}
                  >
                    <Crown className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <h1 
                    className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white"
                    data-testid="text-team-member-name"
                  >
                    {member?.name}
                  </h1>
                  {member?.isPartner && (
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-0 rounded-md"
                      data-testid="badge-partner"
                    >
                      {t.partner}
                    </Badge>
                  )}
                </div>
                <p 
                  className="text-xl text-white/90 font-medium mb-1"
                  data-testid="text-team-member-title"
                >
                  {displayTitle}
                </p>
                <p 
                  className="text-lg text-white/85"
                  data-testid="text-team-member-role"
                >
                  {displayRole}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          {displayBio && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
              data-testid="section-biography"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6"
                data-testid="text-biography-title"
              >
                {t.biography}
              </h2>
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                data-testid="container-biography"
              >
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {displayBio}
                </p>
              </div>
            </motion.section>
          )}

          {(member?.email || member?.phone || member?.linkedinUrl) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12"
              data-testid="section-contact-info"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6"
                data-testid="text-contact-info-title"
              >
                {t.contactInfo}
              </h2>
              <div className="flex flex-wrap gap-4">
                {member?.email && (
                  <a 
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-email"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    {member.email}
                  </a>
                )}
                {member?.phone && (
                  <a 
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-phone"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    {member.phone}
                  </a>
                )}
                {member?.linkedinUrl && (
                  <a 
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-linkedin"
                  >
                    <Linkedin className="w-4 h-4 text-primary" />
                    LinkedIn
                  </a>
                )}
              </div>
            </motion.section>
          )}

          {practiceGroups && practiceGroups.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12"
              data-testid="section-practice-areas"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6"
                data-testid="text-practice-areas-title"
              >
                {t.practiceAreas}
              </h2>
              <div className="flex flex-wrap gap-2">
                {practiceGroups.slice(0, 6).map((group) => (
                  <Link key={group.id} href={`/practice-groups/${group.slug}`}>
                    <Badge 
                      variant="outline" 
                      className="rounded-md cursor-pointer hover:bg-primary hover:text-white transition-colors"
                      data-testid={`badge-practice-group-${group.slug}`}
                    >
                      {language === "es" ? group.nameEs : group.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
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
              {member?.email && (
                <Button 
                  className="rounded-md"
                  asChild
                  data-testid="button-email-contact"
                >
                  <a href={`mailto:${member.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.emailUs}
                  </a>
                </Button>
              )}
              {member?.phone && (
                <Button 
                  variant="outline"
                  className="rounded-md"
                  asChild
                  data-testid="button-call-contact"
                >
                  <a href={`tel:${member.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {t.callUs}
                  </a>
                </Button>
              )}
            </div>
          </motion.section>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
