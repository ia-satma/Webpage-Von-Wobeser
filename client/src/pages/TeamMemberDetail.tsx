import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Linkedin, AlertCircle, Crown, Download, GraduationCap, Globe2, Award, FileText, Briefcase, Scale, Users, BookOpen, Building2, Languages, Newspaper, Calendar, ArrowRight, Trophy, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember, PracticeGroup, IndustryGroup, Education, Affiliation, Ranking, Publication, RepresentativeMatter, BarAdmission, News } from "@shared/schema";

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

export default function TeamMemberDetail() {
  const { language, displayLanguage } = useLanguage();
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

  const { data: relatedNews } = useQuery<News[]>({
    queryKey: ['/api/team', slug, 'news'],
    enabled: !!slug,
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
      barAdmissions: "Bar Admissions",
      languages: "Languages",
      affiliations: "Professional Affiliations",
      rankings: "Rankings & Recognition",
      publications: "Publications",
      representativeMatters: "Representative Matters",
      experience: "Professional Experience",
      contactCta: "Get in touch",
      contactSubtitle: "Connect with our team to discuss how we can assist with your legal needs.",
      emailUs: "Send Email",
      callUs: "Call",
      downloadVCard: "Download vCard",
      errorMessage: "Team member not found",
      loading: "Loading...",
      relatedTeam: "Related Team Members",
      viewProfile: "View Profile",
      relatedNews: "Latest News & Articles",
      readMore: "Read More",
      featuredRecognition: "Featured Recognition",
      totalRecognitions: "Total Recognitions",
      topPublications: "Top Publications",
      tieredRankings: "Tiered Rankings",
      otherRecognitions: "Other Recognitions",
      band: "Band",
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
      education: "Formación Académica",
      barAdmissions: "Admisiones al Colegio",
      languages: "Idiomas",
      affiliations: "Afiliaciones Profesionales",
      rankings: "Rankings y Reconocimientos",
      publications: "Publicaciones",
      representativeMatters: "Asuntos Representativos",
      experience: "Experiencia Profesional",
      contactCta: "Contáctenos",
      contactSubtitle: "Conéctese con nuestro equipo para discutir cómo podemos ayudarle con sus necesidades legales.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      downloadVCard: "Descargar vCard",
      errorMessage: "Miembro del equipo no encontrado",
      loading: "Cargando...",
      relatedTeam: "Equipo Relacionado",
      viewProfile: "Ver Perfil",
      relatedNews: "Últimas Noticias y Artículos",
      readMore: "Leer Más",
      featuredRecognition: "Reconocimiento Destacado",
      totalRecognitions: "Total de Reconocimientos",
      topPublications: "Publicaciones Principales",
      tieredRankings: "Rankings por Nivel",
      otherRecognitions: "Otros Reconocimientos",
      band: "Banda",
    },
  };

  const t = content[displayLanguage];

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(language === "es" ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const getPublicationIcon = (publication: string) => {
    const pubLower = publication.toLowerCase();
    if (pubLower.includes("chambers")) {
      return <Trophy className="w-5 h-5 text-amber-500" />;
    }
    if (pubLower.includes("legal 500")) {
      return <Award className="w-5 h-5 text-amber-500" />;
    }
    if (pubLower.includes("who's who") || pubLower.includes("whos who")) {
      return <Star className="w-5 h-5 text-amber-500" />;
    }
    if (pubLower.includes("iflr") || pubLower.includes("benchmark")) {
      return <Trophy className="w-5 h-5 text-amber-500" />;
    }
    return <Award className="w-5 h-5 text-amber-500" />;
  };

  const getPublicationPriority = (publication: string): number => {
    const pubLower = publication.toLowerCase();
    if (pubLower.includes("chambers")) return 1;
    if (pubLower.includes("legal 500")) return 2;
    if (pubLower.includes("who's who") || pubLower.includes("whos who")) return 3;
    if (pubLower.includes("iflr")) return 4;
    if (pubLower.includes("benchmark")) return 5;
    return 10;
  };

  const processedRankings = useMemo(() => {
    if (!member?.rankings || member.rankings.length === 0) return null;
    
    const rankings = member.rankings as Ranking[];
    
    const tieredRankings = rankings.filter(r => r.ranking && r.ranking.trim() !== "");
    const simpleRankings = rankings.filter(r => !r.ranking || r.ranking.trim() === "");
    
    const sortedTiered = [...tieredRankings].sort((a, b) => {
      const prioA = getPublicationPriority(a.publication);
      const prioB = getPublicationPriority(b.publication);
      if (prioA !== prioB) return prioA - prioB;
      const bandA = a.ranking?.match(/\d+/)?.[0];
      const bandB = b.ranking?.match(/\d+/)?.[0];
      if (bandA && bandB) return parseInt(bandA) - parseInt(bandB);
      return 0;
    });

    const uniquePublications = Array.from(new Set(rankings.map(r => r.publication)));
    const topPublications = uniquePublications
      .sort((a, b) => getPublicationPriority(a) - getPublicationPriority(b))
      .slice(0, 3);
    
    return {
      tieredRankings: sortedTiered,
      simpleRankings,
      totalCount: rankings.length,
      topPublications,
    };
  }, [member?.rankings]);

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
        <Header />
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
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team-member-loading">
        <Header />
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

  const displayTitle = language === "es" ? member?.titleEs : member?.title;
  const displayRole = language === "es" ? member?.roleEs : member?.role;
  const displayBio = language === "es" ? member?.bioEs : member?.bio;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team-member-detail">
      <Header />
      
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
                <Avatar className="w-40 h-40 border-4 border-white/20" data-testid="avatar-profile">
                  <AvatarImage 
                    src={member?.imageUrl || undefined} 
                    alt={member?.name}
                    data-testid="img-profile-photo"
                  />
                  <AvatarFallback className="bg-white/10 text-white text-4xl font-light" data-testid="avatar-fallback">
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

      <main id="main-content" className="py-16 lg:py-20">
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

              {processedRankings && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  data-testid="section-rankings"
                >
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-md p-6 border border-amber-200/50 dark:border-amber-700/30">
                    <h2 
                      className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                      data-testid="text-rankings-title"
                    >
                      <div className="p-2 bg-amber-500/20 rounded-md">
                        <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span>{t.rankings}</span>
                      <Badge 
                        className="ml-auto bg-amber-500 text-white rounded-md border-0"
                        data-testid="badge-rankings-count"
                      >
                        {processedRankings.totalCount}
                      </Badge>
                    </h2>

                    {processedRankings.tieredRankings.length > 0 && (
                      <div className="mb-6" data-testid="container-tiered-rankings">
                        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          {t.tieredRankings}
                        </h3>
                        <div className="space-y-3">
                          {processedRankings.tieredRankings.map((ranking, index) => (
                            <Card 
                              key={index}
                              className="border border-amber-200/50 dark:border-amber-700/30 bg-white dark:bg-gray-800/50 rounded-md overflow-visible"
                              data-testid={`card-ranking-tiered-${index}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getPublicationIcon(ranking.publication)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-white">
                                      {ranking.publication}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Badge 
                                        className="bg-amber-500 text-white rounded-md border-0"
                                        data-testid={`badge-ranking-band-${index}`}
                                      >
                                        {language === "es" && ranking.rankingEs 
                                          ? ranking.rankingEs 
                                          : ranking.ranking
                                        }
                                      </Badge>
                                      {ranking.year && (
                                        <Badge 
                                          variant="outline" 
                                          className="rounded-md border-amber-300 dark:border-amber-600"
                                        >
                                          {ranking.year}
                                        </Badge>
                                      )}
                                    </div>
                                    {ranking.area && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        {language === "es" && ranking.areaEs ? ranking.areaEs : ranking.area}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {processedRankings.simpleRankings.length > 0 && (
                      <div data-testid="container-simple-rankings">
                        {processedRankings.tieredRankings.length > 0 && (
                          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            {t.otherRecognitions}
                          </h3>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {processedRankings.simpleRankings.map((ranking, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-md border border-amber-200/30 dark:border-amber-700/20"
                              data-testid={`item-ranking-simple-${index}`}
                            >
                              <div className="flex-shrink-0">
                                {getPublicationIcon(ranking.publication)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                  {ranking.publication}
                                </p>
                                {ranking.year && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {ranking.year}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

              {member?.education && member.education.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  data-testid="section-education"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-education-title"
                  >
                    <GraduationCap className="w-6 h-6 text-primary" />
                    {t.education}
                  </h2>
                  <div className="space-y-4">
                    {(member.education as Education[]).map((edu, index) => (
                      <div 
                        key={index} 
                        className="border-l-2 border-primary/30 pl-4 py-1"
                        data-testid={`item-education-${index}`}
                      >
                        <p className="text-lg font-medium text-gray-800 dark:text-white">
                          {language === "es" && edu.degreeEs ? edu.degreeEs : edu.degree}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {language === "es" && edu.schoolEs ? edu.schoolEs : edu.school}
                          {edu.year && <span className="ml-2 text-sm">({edu.year})</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.barAdmissions && member.barAdmissions.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  data-testid="section-bar-admissions"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-bar-admissions-title"
                  >
                    <Scale className="w-6 h-6 text-primary" />
                    {t.barAdmissions}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {(member.barAdmissions as BarAdmission[]).map((admission, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="rounded-md py-2 px-4"
                        data-testid={`badge-bar-admission-${index}`}
                      >
                        {language === "es" && admission.jurisdictionEs ? admission.jurisdictionEs : admission.jurisdiction}
                        {admission.year && <span className="ml-1 opacity-70">({admission.year})</span>}
                      </Badge>
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.languages && member.languages.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  data-testid="section-languages"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-languages-title"
                  >
                    <Languages className="w-6 h-6 text-primary" />
                    {t.languages}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {(member.languages as string[]).map((lang, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="rounded-md py-2 px-4"
                        data-testid={`badge-language-${index}`}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.affiliations && member.affiliations.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                  data-testid="section-affiliations"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-affiliations-title"
                  >
                    <Users className="w-6 h-6 text-primary" />
                    {t.affiliations}
                  </h2>
                  <div className="space-y-3">
                    {(member.affiliations as Affiliation[]).map((affiliation, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3"
                        data-testid={`item-affiliation-${index}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-gray-800 dark:text-white">
                            {language === "es" && affiliation.organizationEs ? affiliation.organizationEs : affiliation.organization}
                          </p>
                          {affiliation.role && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {language === "es" && affiliation.roleEs ? affiliation.roleEs : affiliation.role}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.publications && member.publications.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.65 }}
                  data-testid="section-publications"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-publications-title"
                  >
                    <BookOpen className="w-6 h-6 text-primary" />
                    {t.publications}
                  </h2>
                  <div className="space-y-4">
                    {(member.publications as Publication[]).map((pub, index) => (
                      <div 
                        key={index}
                        className="border-l-2 border-primary/30 pl-4 py-1"
                        data-testid={`item-publication-${index}`}
                      >
                        <p className="text-gray-800 dark:text-white font-medium">
                          {language === "es" && pub.titleEs ? pub.titleEs : pub.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {pub.journal && <span>{pub.journal}</span>}
                          {pub.year && <span>• {pub.year}</span>}
                          {pub.url && (
                            <a 
                              href={pub.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Publication
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.representativeMatters && member.representativeMatters.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  data-testid="section-representative-matters"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-representative-matters-title"
                  >
                    <Briefcase className="w-6 h-6 text-primary" />
                    {t.representativeMatters}
                  </h2>
                  <div className="space-y-3">
                    {(member.representativeMatters as RepresentativeMatter[]).map((matter, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3"
                        data-testid={`item-representative-matter-${index}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-gray-800 dark:text-white">
                            {language === "es" && matter.descriptionEs ? matter.descriptionEs : matter.description}
                          </p>
                          {(matter.client || matter.year) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {matter.client && <span>{matter.client}</span>}
                              {matter.client && matter.year && <span> • </span>}
                              {matter.year && <span>{matter.year}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.experience && member.experience.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.75 }}
                  data-testid="section-experience"
                >
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6 flex items-center gap-3"
                    data-testid="text-experience-title"
                  >
                    <Building2 className="w-6 h-6 text-primary" />
                    {t.experience}
                  </h2>
                  <div className="space-y-4">
                    {(member.experience as any[]).map((exp, index) => (
                      <div 
                        key={index}
                        className="border-l-2 border-primary/30 pl-4 py-1"
                        data-testid={`item-experience-${index}`}
                      >
                        <p className="text-lg font-medium text-gray-800 dark:text-white">
                          {language === "es" && exp.positionEs ? exp.positionEs : exp.position}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {exp.company}
                          {(exp.startYear || exp.endYear) && (
                            <span className="ml-2 text-sm">
                              ({exp.startYear}{exp.endYear ? ` - ${exp.endYear}` : ' - Present'})
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            <div className="space-y-8">
              {processedRankings && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-md p-6 border border-amber-200/50 dark:border-amber-700/30"
                  data-testid="section-featured-recognition"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500 rounded-md">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <h2 
                      className="text-lg font-heading font-medium text-gray-800 dark:text-white"
                      data-testid="text-featured-recognition-title"
                    >
                      {t.featuredRecognition}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span 
                      className="text-3xl font-bold text-amber-600 dark:text-amber-400"
                      data-testid="text-total-recognitions-count"
                    >
                      {processedRankings.totalCount}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t.totalRecognitions}
                    </span>
                  </div>
                  
                  {processedRankings.topPublications.length > 0 && (
                    <div data-testid="container-top-publications">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                        {t.topPublications}
                      </p>
                      <div className="space-y-2">
                        {processedRankings.topPublications.map((pub, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                            data-testid={`item-top-publication-${index}`}
                          >
                            {getPublicationIcon(pub)}
                            <span className="truncate">{pub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

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

        {relatedNews && relatedNews.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-700"
            data-testid="section-related-news"
          >
            <div className="max-w-6xl mx-auto">
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-8 flex items-center gap-3"
                data-testid="text-related-news-title"
              >
                <Newspaper className="w-6 h-6 text-primary" />
                {t.relatedNews}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedNews.map((article) => (
                  <motion.div 
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link href={`/news/${article.slug}`}>
                      <Card
                        className="group h-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
                        data-testid={`card-related-news-${article.slug}`}
                      >
                        <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <NewsImageWithFallback
                            src={article.imageUrl || ""}
                            alt={language === "es" ? article.titleEs : article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {article.category && (
                            <span 
                              className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-primary text-white rounded"
                              data-testid={`badge-news-category-${article.slug}`}
                            >
                              {language === "es" ? article.categoryEs : article.category?.charAt(0).toUpperCase() + article.category?.slice(1)}
                            </span>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-news-date-${article.slug}`}>
                              {formatDate(article.date)}
                            </span>
                          </div>
                          <h3 
                            className="text-xl font-semibold text-gray-800 dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-2"
                            data-testid={`text-news-title-${article.slug}`}
                          >
                            {language === "es" ? article.titleEs : article.title}
                          </h3>
                          <p 
                            className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4"
                            data-testid={`text-news-excerpt-${article.slug}`}
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
              </div>
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  );
}
