import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Users, Crown, Download, Search, Filter, X, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

export default function Team() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeniority, setFilterSeniority] = useState<string>("all");
  const [filterPractice, setFilterPractice] = useState<string>("all");
  const [filterLetter, setFilterLetter] = useState<string>("all");

  const { data: allTeamMembers, isLoading: isLoadingAll, error: errorAll } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content = {
    en: {
      title: "Our Team",
      subtitle: "Meet the experienced attorneys who make our firm a leader in legal excellence",
      errorMessage: "Failed to load team members",
      allMembers: "All",
      partnersOnly: "Partners",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewProfile: "View Profile",
      downloadVCard: "Download vCard",
      searchPlaceholder: "Search by name...",
      filterBy: "Filter by",
      seniority: "Seniority",
      practiceArea: "Practice Area",
      alphabetic: "Alphabetic",
      all: "All",
      clearFilters: "Clear filters",
      noResults: "No team members match your criteria",
      teamMembers: "team members",
    },
    es: {
      title: "Nuestro Equipo",
      subtitle: "Conozca a los experimentados abogados que hacen de nuestra firma un líder en excelencia legal",
      errorMessage: "Error al cargar los miembros del equipo",
      allMembers: "Todos",
      partnersOnly: "Socios",
      ofCounsel: "Of Counsel",
      associates: "Asociados",
      viewProfile: "Ver Perfil",
      downloadVCard: "Descargar vCard",
      searchPlaceholder: "Buscar por nombre...",
      filterBy: "Filtrar por",
      seniority: "Nivel",
      practiceArea: "Área de Práctica",
      alphabetic: "Alfabético",
      all: "Todos",
      clearFilters: "Limpiar filtros",
      noResults: "No hay miembros que coincidan con los criterios",
      teamMembers: "miembros del equipo",
    },
  };

  const t = content[language];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredMembers = useMemo(() => {
    if (!allTeamMembers) return [];
    
    return allTeamMembers.filter(member => {
      if (searchQuery && !member.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filterSeniority !== "all") {
        if (filterSeniority === "partners" && !member.isPartner) return false;
        if (filterSeniority === "ofcounsel" && member.title !== "Of Counsel") return false;
        if (filterSeniority === "associates" && member.title !== "Associate") return false;
      }
      
      if (filterLetter !== "all") {
        if (!member.name.toUpperCase().startsWith(filterLetter)) return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (a.isPartner && !b.isPartner) return -1;
      if (!a.isPartner && b.isPartner) return 1;
      if (a.title === "Of Counsel" && b.title === "Associate") return -1;
      if (a.title === "Associate" && b.title === "Of Counsel") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allTeamMembers, searchQuery, filterSeniority, filterLetter]);

  const hasActiveFilters = searchQuery || filterSeniority !== "all" || filterLetter !== "all" || filterPractice !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterSeniority("all");
    setFilterPractice("all");
    setFilterLetter("all");
  };

  const handleDownloadVCard = (e: React.MouseEvent, member: TeamMember) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/api/team/${member.slug}/vcard?lang=${language}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getSeniorityLabel = (member: TeamMember) => {
    if (member.isPartner) return language === "es" ? "Socio" : "Partner";
    if (member.title === "Of Counsel") return "Of Counsel";
    return language === "es" ? "Asociado" : "Associate";
  };

  const getSeniorityColor = (member: TeamMember) => {
    if (member.isPartner) return "bg-primary text-white";
    if (member.title === "Of Counsel") return "bg-amber-600 text-white";
    return "bg-gray-600 text-white";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team">
      <SEOHead page="team" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-team-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-team-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-team-subtitle"
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
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-md"
                  data-testid="input-search"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={filterSeniority} onValueChange={setFilterSeniority}>
                  <SelectTrigger className="w-40 rounded-md" data-testid="select-seniority">
                    <SelectValue placeholder={t.seniority} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="partners">{t.partnersOnly}</SelectItem>
                    <SelectItem value="ofcounsel">{t.ofCounsel}</SelectItem>
                    <SelectItem value="associates">{t.associates}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterLetter} onValueChange={setFilterLetter}>
                  <SelectTrigger className="w-32 rounded-md" data-testid="select-alphabetic">
                    <SelectValue placeholder={t.alphabetic} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {alphabet.map(letter => (
                      <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={clearFilters}
                    className="gap-2 rounded-md"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4" />
                    {t.clearFilters}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-results-count">
                {filteredMembers.length} {t.teamMembers}
              </p>
            </div>
          </motion.div>

          {errorAll ? (
            <div className="text-center py-12" data-testid="container-team-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-team-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoadingAll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md border-0 shadow-sm bg-gray-50 dark:bg-gray-800"
                  data-testid={`skeleton-team-member-${i}`}
                >
                  <CardContent className="p-6 text-center">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto mb-1" />
                    <Skeleton className="h-4 w-2/3 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12" data-testid="container-team-empty">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t.noResults}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4 gap-2 rounded-md"
                  data-testid="button-clear-empty"
                >
                  <X className="w-4 h-4" />
                  {t.clearFilters}
                </Button>
              )}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {filteredMembers.map((member) => (
                <motion.div key={member.id} variants={itemVariants}>
                  <Card
                    className="group h-full rounded-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800"
                    data-testid={`card-team-member-${member.slug}`}
                  >
                    <CardContent className="p-6 text-center">
                      <Link href={`/team/${member.slug}`}>
                        <div className="cursor-pointer">
                          <div className="relative mb-4 mx-auto w-fit">
                            <Avatar className="w-24 h-24 mx-auto border-2 border-gray-100 dark:border-gray-700">
                              <AvatarImage 
                                src={member.imageUrl || undefined} 
                                alt={member.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <h3 
                            className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary transition-colors"
                            data-testid={`text-team-member-name-${member.slug}`}
                          >
                            {member.name}
                          </h3>
                          <Badge 
                            className={`mb-2 rounded-md text-xs ${getSeniorityColor(member)}`}
                            data-testid={`badge-seniority-${member.slug}`}
                          >
                            {getSeniorityLabel(member)}
                          </Badge>
                          <p 
                            className="text-sm text-gray-600 dark:text-gray-400"
                            data-testid={`text-team-member-role-${member.slug}`}
                          >
                            {language === "es" ? member.roleEs : member.role}
                          </p>
                        </div>
                      </Link>
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 rounded-md text-xs"
                          onClick={(e) => handleDownloadVCard(e, member)}
                          data-testid={`button-download-vcard-${member.slug}`}
                        >
                          <Download className="w-3 h-3" />
                          vCard
                        </Button>
                        <Link href={`/team/${member.slug}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1 rounded-md text-xs"
                            data-testid={`button-view-profile-${member.slug}`}
                          >
                            <Briefcase className="w-3 h-3" />
                            {t.viewProfile}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
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
