import { Link, useParams } from "wouter";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, AlertCircle, Award, Star, Trophy, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { getIcon } from "@/lib/icons";
import type { PracticeGroup, TeamMember, RepresentativeMatterDb } from "@shared/schema";

interface PracticeRanking {
  publication: string;
  ranking: string;
  rankingEs: string;
  year: string;
  badgeType: "band" | "tier" | "star" | "recommended";
}

const practiceRankingsData: Record<string, PracticeRanking[]> = {
  "corporate-ma": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "IFLR1000", ranking: "Highly Regarded", rankingEs: "Altamente Reconocido", year: "2024", badgeType: "recommended" },
  ],
  "antitrust-competition": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GCR 100", ranking: "Elite", rankingEs: "Élite", year: "2024", badgeType: "star" },
    { publication: "Who's Who Legal", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
  "arbitration": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GAR 100", ranking: "Top 30 Worldwide", rankingEs: "Top 30 Mundial", year: "2024", badgeType: "star" },
    { publication: "Latin Lawyer 250", ranking: "Elite", rankingEs: "Élite", year: "2024", badgeType: "star" },
  ],
  "litigation": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "Benchmark Litigation", ranking: "Top Tier", rankingEs: "Top Tier", year: "2024", badgeType: "tier" },
  ],
  "investigations-anticorruption": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "GIR 100", ranking: "Top 100 Global", rankingEs: "Top 100 Global", year: "2024", badgeType: "star" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
  ],
  "bankruptcy-restructuring": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GRR 100", ranking: "Top 100 Global", rankingEs: "Top 100 Global", year: "2024", badgeType: "star" },
  ],
  "banking-finance": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "IFLR1000", ranking: "Highly Regarded", rankingEs: "Altamente Reconocido", year: "2024", badgeType: "recommended" },
  ],
  "energy-natural-resources": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "Who's Who Legal", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
  "esg": [
    { publication: "Chambers Latin America", ranking: "Ranked", rankingEs: "Clasificado", year: "2024", badgeType: "recommended" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "real-estate": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "intellectual-property": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "WTR 1000", ranking: "Silver", rankingEs: "Plata", year: "2024", badgeType: "recommended" },
  ],
  "labor-employment": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "tax": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "ITR World Tax", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "international-trade": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "telecommunications-media-technology": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "environmental": [
    { publication: "Chambers Latin America", ranking: "Band 3", rankingEs: "Banda 3", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "administrative-law": [
    { publication: "Chambers Latin America", ranking: "Ranked", rankingEs: "Clasificado", year: "2024", badgeType: "recommended" },
    { publication: "Legal 500", ranking: "Tier 3", rankingEs: "Tier 3", year: "2024", badgeType: "tier" },
  ],
  "german-desk": [
    { publication: "Legal 500", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
};

const practiceAreaRoleMapping: Record<string, string[]> = {
  "corporate-ma": ["Corporate & M&A", "Corporate, M&A & Pharmaceutical Co-Leader"],
  "antitrust-competition": ["Antitrust & Competition"],
  "arbitration": ["Arbitration", "Arbitration & Energy", "Founding Partner, Arbitration & Litigation Expert"],
  "litigation": ["Litigation"],
  "investigations-anticorruption": ["Investigations, Anti-corruption & Compliance"],
  "bankruptcy-restructuring": ["Bankruptcy & Restructuring"],
  "banking-finance": ["Banking & Finance"],
  "energy-natural-resources": ["Energy & Natural Resources", "Arbitration & Energy"],
  "esg": ["ESG"],
  "real-estate": ["Real Estate"],
  "intellectual-property": ["Intellectual Property"],
  "labor-employment": ["Labor & Employment"],
  "tax": ["Tax", "Tax Practice"],
  "international-trade": ["International Trade"],
  "telecommunications-media-technology": ["Telecommunications, Media & Technology"],
  "environmental": ["Environmental"],
  "administrative-law": ["Administrative Law"],
  "german-desk": ["German Desk"],
};

export default function PracticeGroupDetail() {
  const { language, displayLanguage } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: practiceGroup, isLoading, error } = useQuery<PracticeGroup>({
    queryKey: [`/api/practice-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: allTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: representativeMatters } = useQuery<RepresentativeMatterDb[]>({
    queryKey: ['/api/practice-groups', slug, 'representative-matters'],
    enabled: !!slug,
  });

  const content = {
    en: {
      backToAll: "All Practice Groups",
      contactUs: "Contact Us",
      contactCta: "Contact our team",
      contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges.",
      emailUs: "Email Us",
      callUs: "Call Us",
      ourTeam: "Our Team",
      partners: "Partners",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewAll: "View all",
      viewProfile: "View Profile",
      rankingsTitle: "Rankings & Recognition",
      rankingsSubtitle: "Our practice has been recognized by leading legal directories worldwide.",
      successCasesTitle: "Success Cases",
      successCasesSubtitle: "Representative matters successfully handled by our practice.",
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
      ourTeam: "Nuestro Equipo",
      partners: "Socios",
      ofCounsel: "Of Counsel",
      associates: "Asociados",
      viewAll: "Ver todos",
      viewProfile: "Ver Perfil",
      rankingsTitle: "Rankings y Reconocimientos",
      rankingsSubtitle: "Nuestra práctica ha sido reconocida por los principales directorios legales a nivel mundial.",
      successCasesTitle: "Casos de Éxito",
      successCasesSubtitle: "Casos representativos manejados exitosamente por nuestra práctica.",
      errorMessage: "Área de práctica no encontrada",
      loading: "Cargando...",
    },
  };

  const t = content[displayLanguage];

  const filteredAndGroupedMembers = useMemo(() => {
    if (!allTeamMembers || !slug) return { partners: [], ofCounsel: [], associates: [] };

    const roleMatches = practiceAreaRoleMapping[slug] || [];
    
    const matchingMembers = allTeamMembers.filter(member => {
      return roleMatches.some(role => 
        member.role.toLowerCase().includes(role.toLowerCase()) ||
        role.toLowerCase().includes(member.role.toLowerCase())
      );
    });

    const partners = matchingMembers.filter(m => m.isPartner);
    const ofCounsel = matchingMembers.filter(m => m.title === "Of Counsel");
    const associates = matchingMembers.filter(m => m.title === "Associate");

    return { partners, ofCounsel, associates };
  }, [allTeamMembers, slug]);

  const practiceRankings = slug ? (practiceRankingsData[slug] || []) : [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getBadgeStyles = (badgeType: string) => {
    switch (badgeType) {
      case "band":
        return "bg-primary text-white";
      case "tier":
        return "bg-amber-600 text-white";
      case "star":
        return "bg-emerald-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "band":
        return <Award className="w-3 h-3 mr-1" />;
      case "tier":
        return <Trophy className="w-3 h-3 mr-1" />;
      case "star":
        return <Star className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-group-error">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h2>
            <Link href="/practice-groups">
              <Button variant="outline" data-testid="button-back-to-practice-groups">
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
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-group-loading">
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

  const IconComponent = practiceGroup ? getIcon(practiceGroup.iconName) : null;
  const displayName = language === "es" ? practiceGroup?.nameEs : practiceGroup?.name;
  const displayDescription = language === "es" 
    ? (practiceGroup?.fullDescriptionEs || practiceGroup?.descriptionEs) 
    : (practiceGroup?.fullDescription || practiceGroup?.description);

  const MAX_ASSOCIATES_DISPLAY = 6;
  const displayedAssociates = filteredAndGroupedMembers.associates.slice(0, MAX_ASSOCIATES_DISPLAY);
  const hasMoreAssociates = filteredAndGroupedMembers.associates.length > MAX_ASSOCIATES_DISPLAY;

  const renderMemberCard = (member: TeamMember) => (
    <Link key={member.id} href={`/team/${member.slug}`}>
      <Card 
        className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
        data-testid={`card-team-member-${member.slug}`}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {getInitials(member.name)}
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
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-practice-group-detail">
      <Header />
      
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

      <main id="main-content" className="py-16 lg:py-20">
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

          {representativeMatters && representativeMatters.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="mb-16"
              data-testid="section-representative-matters"
            >
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-primary" />
                <h2 
                  className="text-2xl font-heading font-light text-gray-800 dark:text-white"
                  data-testid="text-success-cases-title"
                >
                  {t.successCasesTitle}
                </h2>
              </div>
              <p 
                className="text-gray-600 dark:text-gray-400 mb-6"
                data-testid="text-success-cases-subtitle"
              >
                {t.successCasesSubtitle}
              </p>
              <div className="grid grid-cols-1 gap-4">
                {representativeMatters
                  .sort((a, b) => {
                    if (a.isHighlight && !b.isHighlight) return -1;
                    if (!a.isHighlight && b.isHighlight) return 1;
                    return b.year - a.year;
                  })
                  .map((matter) => (
                    <Card 
                      key={matter.id}
                      className={`rounded-md border ${matter.isHighlight ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                      data-testid={`card-matter-${matter.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {matter.isHighlight && (
                                <Badge className="bg-primary text-white rounded-md text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className="rounded-md text-xs"
                                data-testid={`badge-matter-year-${matter.id}`}
                              >
                                {matter.year}
                              </Badge>
                            </div>
                            <h3 
                              className="font-semibold text-gray-800 dark:text-white text-lg"
                              data-testid={`text-matter-title-${matter.id}`}
                            >
                              {language === "es" ? matter.titleEs : matter.title}
                            </h3>
                          </div>
                        </div>
                        <p 
                          className="text-gray-600 dark:text-gray-400 mb-3"
                          data-testid={`text-matter-description-${matter.id}`}
                        >
                          {language === "es" ? matter.descriptionEs : matter.description}
                        </p>
                        {matter.client && (
                          <p 
                            className="text-sm text-gray-500 dark:text-gray-500"
                            data-testid={`text-matter-client-${matter.id}`}
                          >
                            <span className="font-medium">
                              {language === "es" ? "Cliente: " : "Client: "}
                            </span>
                            {language === "es" ? (matter.clientEs || matter.client) : matter.client}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </motion.section>
          )}

          {practiceRankings.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-16"
              data-testid="section-rankings"
            >
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-primary" />
                <h2 
                  className="text-2xl font-heading font-light text-gray-800 dark:text-white"
                  data-testid="text-rankings-title"
                >
                  {t.rankingsTitle}
                </h2>
              </div>
              <p 
                className="text-gray-600 dark:text-gray-400 mb-6"
                data-testid="text-rankings-subtitle"
              >
                {t.rankingsSubtitle}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practiceRankings.map((ranking, index) => (
                  <Card 
                    key={index}
                    className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    data-testid={`card-ranking-${index}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium text-gray-800 dark:text-white"
                          data-testid={`text-ranking-publication-${index}`}
                        >
                          {ranking.publication}
                        </p>
                        <p 
                          className="text-sm text-gray-500 dark:text-gray-400"
                          data-testid={`text-ranking-year-${index}`}
                        >
                          {ranking.year}
                        </p>
                      </div>
                      <Badge 
                        className={`rounded-md text-xs flex items-center ${getBadgeStyles(ranking.badgeType)}`}
                        data-testid={`badge-ranking-${index}`}
                      >
                        {getBadgeIcon(ranking.badgeType)}
                        {language === "es" ? ranking.rankingEs : ranking.ranking}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          {(filteredAndGroupedMembers.partners.length > 0 || 
            filteredAndGroupedMembers.ofCounsel.length > 0 || 
            filteredAndGroupedMembers.associates.length > 0) && (
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

              {filteredAndGroupedMembers.partners.length > 0 && (
                <div className="mb-8" data-testid="section-partners">
                  <h3 
                    className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"
                    data-testid="text-partners-title"
                  >
                    <Badge className="bg-primary text-white rounded-md text-xs">
                      {filteredAndGroupedMembers.partners.length}
                    </Badge>
                    {t.partners}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndGroupedMembers.partners.map(renderMemberCard)}
                  </div>
                </div>
              )}

              {filteredAndGroupedMembers.ofCounsel.length > 0 && (
                <div className="mb-8" data-testid="section-of-counsel">
                  <h3 
                    className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"
                    data-testid="text-of-counsel-title"
                  >
                    <Badge className="bg-amber-600 text-white rounded-md text-xs">
                      {filteredAndGroupedMembers.ofCounsel.length}
                    </Badge>
                    {t.ofCounsel}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndGroupedMembers.ofCounsel.map(renderMemberCard)}
                  </div>
                </div>
              )}

              {displayedAssociates.length > 0 && (
                <div data-testid="section-associates">
                  <h3 
                    className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"
                    data-testid="text-associates-title"
                  >
                    <Badge className="bg-gray-600 text-white rounded-md text-xs">
                      {filteredAndGroupedMembers.associates.length}
                    </Badge>
                    {t.associates}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedAssociates.map(renderMemberCard)}
                  </div>
                  {hasMoreAssociates && (
                    <div className="mt-4 text-center">
                      <Link href={`/team?practice=${slug}`}>
                        <Button 
                          variant="outline" 
                          className="rounded-md gap-2"
                          data-testid="button-view-all-associates"
                        >
                          {t.viewAll} ({filteredAndGroupedMembers.associates.length})
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
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
              <Link href="/contact">
                <Button 
                  className="rounded-md"
                  data-testid="button-email-us"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t.emailUs}
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="rounded-md"
                data-testid="button-call-us"
                onClick={() => window.location.href = "tel:+525552581000"}
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
