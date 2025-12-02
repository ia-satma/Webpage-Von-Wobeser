import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Linkedin, AlertCircle, Crown, Download, GraduationCap, Globe2, Award, FileText, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

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

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const { data: allTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const content = {
    en: {
      backToAll: "All Team Members",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associate",
      contactInfo: "Contact Information",
      practiceAreas: "Practice Areas",
      industryGroups: "Industry Groups",
      biography: "Biography",
      education: "Education",
      languages: "Languages",
      rankings: "Rankings & Recognition",
      publications: "Publications",
      representativeMatters: "Representative Matters",
      contactCta: "Get in touch",
      contactSubtitle: "Connect with our team to discuss how we can assist with your legal needs.",
      emailUs: "Send Email",
      callUs: "Call",
      downloadVCard: "Download vCard",
      errorMessage: "Team member not found",
      loading: "Loading...",
      relatedTeam: "Related Team Members",
      viewProfile: "View Profile",
    },
    es: {
      backToAll: "Todos los Miembros",
      partner: "Socio",
      ofCounsel: "Of Counsel",
      associate: "Asociado",
      contactInfo: "Información de Contacto",
      practiceAreas: "Áreas de Práctica",
      industryGroups: "Grupos Industriales",
      biography: "Biografía",
      education: "Educación",
      languages: "Idiomas",
      rankings: "Rankings y Reconocimientos",
      publications: "Publicaciones",
      representativeMatters: "Asuntos Representativos",
      contactCta: "Contáctenos",
      contactSubtitle: "Conéctese con nuestro equipo para discutir cómo podemos ayudarle con sus necesidades legales.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      downloadVCard: "Descargar vCard",
      errorMessage: "Miembro del equipo no encontrado",
      loading: "Cargando...",
      relatedTeam: "Equipo Relacionado",
      viewProfile: "Ver Perfil",
    },
  };

  const t = content[language];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getSeniorityLabel = () => {
    if (member?.isPartner) return t.partner;
    if (member?.title === "Of Counsel") return t.ofCounsel;
    return t.associate;
  };

  const handleDownloadVCard = () => {
    if (member) {
      window.location.href = `/api/team/${member.slug}/vcard?lang=${language}`;
    }
  };

  const relatedMembers = allTeamMembers?.filter(m => 
    m.id !== member?.id && 
    ((m.isPartner && member?.isPartner) || 
     (m.title === member?.title))
  ).slice(0, 4);

  const generatePersonJsonLd = () => {
    if (!member) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": member.name,
      "jobTitle": language === "es" ? member.titleEs : member.title,
      "worksFor": {
        "@type": "LegalService",
        "name": "Von Wobeser y Sierra, S.C.",
        "url": "https://www.vonwobeser.com"
      },
      "email": member.email,
      "telephone": member.phone,
      "image": member.imageUrl,
      "url": `https://www.vonwobeser.com/team/${member.slug}`,
      "sameAs": member.linkedinUrl ? [member.linkedinUrl] : [],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Torre SOMA Chapultepec Piso 18, Campos Elíseos 204",
        "addressLocality": "Ciudad de México",
        "addressRegion": "CDMX",
        "postalCode": "11560",
        "addressCountry": "MX"
      }
    };
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
      
      {member && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generatePersonJsonLd()) }}
        />
      )}
      
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
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative flex-shrink-0">
                <Avatar className="w-40 h-40 border-4 border-white/20">
                  <AvatarImage 
                    src={member?.imageUrl || undefined} 
                    alt={member?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/10 text-white text-4xl font-light">
                    {member?.name ? getInitials(member.name) : ''}
                  </AvatarFallback>
                </Avatar>
                {member?.isPartner && (
                  <div 
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
                    title={t.partner}
                  >
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                  <h1 
                    className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white"
                    data-testid="text-team-member-name"
                  >
                    {member?.name}
                  </h1>
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-0 rounded-md"
                    data-testid="badge-seniority"
                  >
                    {getSeniorityLabel()}
                  </Badge>
                </div>
                <p 
                  className="text-xl text-white/90 font-medium mb-2"
                  data-testid="text-team-member-title"
                >
                  {displayTitle}
                </p>
                <p 
                  className="text-lg text-white/85 mb-6"
                  data-testid="text-team-member-role"
                >
                  {displayRole}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {member?.email && (
                    <Button 
                      variant="secondary"
                      className="rounded-md bg-white/20 hover:bg-white/30 text-white border-0"
                      asChild
                      data-testid="button-email"
                    >
                      <a href={`mailto:${member.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {member.email}
                      </a>
                    </Button>
                  )}
                  {member?.phone && (
                    <Button 
                      variant="secondary"
                      className="rounded-md bg-white/20 hover:bg-white/30 text-white border-0"
                      asChild
                      data-testid="button-phone"
                    >
                      <a href={`tel:${member.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {member.phone}
                      </a>
                    </Button>
                  )}
                  {member?.linkedinUrl && (
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="rounded-md bg-white/20 hover:bg-white/30 text-white border-0"
                      asChild
                      data-testid="button-linkedin"
                    >
                      <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="secondary"
                    className="rounded-md bg-white text-primary hover:bg-white/90"
                    onClick={handleDownloadVCard}
                    data-testid="button-download-vcard"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.downloadVCard}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {displayBio && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  data-testid="section-biography"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-biography-title"
                  >
                    <FileText className="w-6 h-6 text-primary" />
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

              {practiceGroups && practiceGroups.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  data-testid="section-practice-areas"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-practice-areas-title"
                  >
                    <Briefcase className="w-6 h-6 text-primary" />
                    {t.practiceAreas}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {practiceGroups.slice(0, 8).map((group) => (
                      <Link key={group.id} href={`/practice-groups/${group.slug}`}>
                        <Badge 
                          variant="outline" 
                          className="rounded-md cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors py-2 px-4"
                          data-testid={`badge-practice-group-${group.slug}`}
                        >
                          {language === "es" ? group.nameEs : group.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}

              {industryGroups && industryGroups.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  data-testid="section-industry-groups"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-industry-groups-title"
                  >
                    <Globe2 className="w-6 h-6 text-primary" />
                    {t.industryGroups}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {industryGroups.slice(0, 6).map((group) => (
                      <Link key={group.id} href={`/industry-groups/${group.slug}`}>
                        <Badge 
                          variant="outline" 
                          className="rounded-md cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors py-2 px-4"
                          data-testid={`badge-industry-group-${group.slug}`}
                        >
                          {language === "es" ? group.nameEs : group.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            <div className="space-y-8">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-md p-6"
                data-testid="section-contact-cta"
              >
                <h2 
                  className="text-xl font-heading font-light text-gray-800 dark:text-white mb-3"
                  data-testid="text-contact-cta-title"
                >
                  {t.contactCta}
                </h2>
                <p 
                  className="text-sm text-gray-600 dark:text-gray-400 mb-6"
                  data-testid="text-contact-cta-subtitle"
                >
                  {t.contactSubtitle}
                </p>
                <div className="flex flex-col gap-3">
                  {member?.email && (
                    <Button 
                      className="w-full rounded-md"
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
                      className="w-full rounded-md"
                      asChild
                      data-testid="button-call-contact"
                    >
                      <a href={`tel:${member.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {t.callUs}
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="w-full rounded-md"
                    onClick={handleDownloadVCard}
                    data-testid="button-download-vcard-sidebar"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.downloadVCard}
                  </Button>
                </div>
              </motion.section>

              {relatedMembers && relatedMembers.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  data-testid="section-related-team"
                >
                  <h2 
                    className="text-xl font-heading font-light text-gray-800 dark:text-white mb-4"
                    data-testid="text-related-team-title"
                  >
                    {t.relatedTeam}
                  </h2>
                  <div className="space-y-3">
                    {relatedMembers.map((relatedMember) => (
                      <Link key={relatedMember.id} href={`/team/${relatedMember.slug}`}>
                        <Card 
                          className="rounded-md border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                          data-testid={`card-related-member-${relatedMember.slug}`}
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage 
                                src={relatedMember.imageUrl || undefined} 
                                alt={relatedMember.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(relatedMember.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                {relatedMember.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {language === "es" ? relatedMember.titleEs : relatedMember.title}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
