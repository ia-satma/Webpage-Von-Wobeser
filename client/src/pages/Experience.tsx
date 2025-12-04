import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, AlertCircle, Calendar, Building2, Briefcase, Award, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
import type { RepresentativeMatterDb, PracticeGroup, IndustryGroup } from "@shared/schema";

export default function Experience() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  const { data: matters, isLoading: mattersLoading, error: mattersError } = useQuery<RepresentativeMatterDb[]>({
    queryKey: ["/api/representative-matters"],
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content = {
    en: {
      title: "Experience",
      subtitle: "A proven track record of excellence across every practice area",
      heroDescription: "For over three decades, Von Wobeser y Sierra has represented leading national and multinational companies in their most complex and high-stakes legal matters. Our experience spans landmark transactions, groundbreaking disputes, and strategic advisory mandates.",
      featuredTitle: "Featured Matters",
      featuredSubtitle: "High-profile cases that showcase our expertise",
      allMattersTitle: "Representative Matters",
      filterByPractice: "Filter by Practice Area",
      filterByIndustry: "Filter by Industry",
      searchPlaceholder: "Search matters...",
      allPracticeAreas: "All Practice Areas",
      allIndustries: "All Industries",
      errorMessage: "Failed to load representative matters",
      noResults: "No matters found matching your criteria",
      confidentialClient: "Confidential Client",
      viewPracticeArea: "View Practice Area",
    },
    es: {
      title: "Experiencia",
      subtitle: "Una trayectoria comprobada de excelencia en todas las áreas de práctica",
      heroDescription: "Durante más de tres décadas, Von Wobeser y Sierra ha representado a empresas nacionales y multinacionales líderes en sus asuntos legales más complejos y de alto perfil. Nuestra experiencia abarca transacciones históricas, disputas pioneras y mandatos de asesoría estratégica.",
      featuredTitle: "Asuntos Destacados",
      featuredSubtitle: "Casos de alto perfil que demuestran nuestra experiencia",
      allMattersTitle: "Asuntos Representativos",
      filterByPractice: "Filtrar por Área de Práctica",
      filterByIndustry: "Filtrar por Industria",
      searchPlaceholder: "Buscar asuntos...",
      allPracticeAreas: "Todas las Áreas de Práctica",
      allIndustries: "Todas las Industrias",
      errorMessage: "Error al cargar los asuntos representativos",
      noResults: "No se encontraron asuntos que coincidan con los criterios",
      confidentialClient: "Cliente Confidencial",
      viewPracticeArea: "Ver Área de Práctica",
    },
  };

  const t = content[language];

  const highlightedMatters = useMemo(() => {
    return matters?.filter((m) => m.isHighlight) || [];
  }, [matters]);

  const filteredMatters = useMemo(() => {
    if (!matters) return [];
    
    return matters.filter((matter) => {
      const title = language === "es" ? matter.titleEs : matter.title;
      const description = language === "es" ? matter.descriptionEs : matter.description;
      const client = language === "es" ? (matter.clientEs || matter.client) : matter.client;
      
      const matchesSearch = searchQuery === "" || 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client && client.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPractice = selectedPracticeArea === "all" || 
        matter.practiceAreaSlug === selectedPracticeArea;
      
      const matchesIndustry = selectedIndustry === "all" || 
        matter.industrySlug === selectedIndustry;
      
      return matchesSearch && matchesPractice && matchesIndustry;
    });
  }, [matters, searchQuery, selectedPracticeArea, selectedIndustry, language]);

  const getPracticeAreaName = (slug: string) => {
    const group = practiceGroups?.find((g) => g.slug === slug);
    return group ? (language === "es" ? group.nameEs : group.name) : slug;
  };

  const getIndustryName = (slug: string | null) => {
    if (!slug) return null;
    const group = industryGroups?.find((g) => g.slug === slug);
    return group ? (language === "es" ? group.nameEs : group.name) : slug;
  };

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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-experience">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <section className="pt-32 pb-16 bg-primary" data-testid="section-experience-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-experience-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto mb-6"
              data-testid="text-experience-subtitle"
            >
              {t.subtitle}
            </p>
            <p 
              className="text-base text-white/80 max-w-3xl mx-auto"
              data-testid="text-experience-description"
            >
              {t.heroDescription}
            </p>
          </motion.div>
        </div>
      </section>

      {mattersError ? (
        <div className="text-center py-20" data-testid="container-experience-error">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-experience-error">
            {t.errorMessage}
          </p>
        </div>
      ) : (
        <>
          <section className="py-16 bg-gray-50 dark:bg-gray-800" data-testid="section-featured-matters">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-12"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-primary" />
                  <h2 
                    className="text-3xl font-heading font-light text-gray-900 dark:text-white"
                    data-testid="text-featured-title"
                  >
                    {t.featuredTitle}
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-featured-subtitle">
                  {t.featuredSubtitle}
                </p>
              </motion.div>

              {mattersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="rounded-md border-0 shadow-sm bg-white dark:bg-gray-700">
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {highlightedMatters.map((matter) => (
                    <motion.div key={matter.id} variants={itemVariants}>
                      <Card
                        className="h-full rounded-md border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 hover:shadow-lg transition-shadow duration-300"
                        data-testid={`card-featured-matter-${matter.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-sm text-primary mb-3">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-featured-year-${matter.id}`}>{matter.year}</span>
                          </div>
                          <h3 
                            className="text-lg font-medium text-gray-900 dark:text-white mb-3 line-clamp-2"
                            data-testid={`text-featured-title-${matter.id}`}
                          >
                            {language === "es" ? matter.titleEs : matter.title}
                          </h3>
                          <p 
                            className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3"
                            data-testid={`text-featured-description-${matter.id}`}
                          >
                            {language === "es" ? matter.descriptionEs : matter.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <Building2 className="w-4 h-4" />
                            <span data-testid={`text-featured-client-${matter.id}`}>
                              {language === "es" 
                                ? (matter.clientEs || matter.client || t.confidentialClient) 
                                : (matter.client || t.confidentialClient)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/practice-groups/${matter.practiceAreaSlug}`}>
                              <Badge 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover-elevate"
                                data-testid={`badge-featured-practice-${matter.id}`}
                              >
                                <Briefcase className="w-3 h-3 mr-1" />
                                {getPracticeAreaName(matter.practiceAreaSlug)}
                              </Badge>
                            </Link>
                            {matter.industrySlug && (
                              <Link href={`/industry-groups/${matter.industrySlug}`}>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover-elevate"
                                  data-testid={`badge-featured-industry-${matter.id}`}
                                >
                                  {getIndustryName(matter.industrySlug)}
                                </Badge>
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>

          <section className="py-16" data-testid="section-all-matters">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-12"
              >
                <h2 
                  className="text-3xl font-heading font-light text-gray-900 dark:text-white text-center mb-8"
                  data-testid="text-all-matters-title"
                >
                  {t.allMattersTitle}
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-center mb-8">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-matters"
                    />
                  </div>
                  
                  <Select value={selectedPracticeArea} onValueChange={setSelectedPracticeArea}>
                    <SelectTrigger className="w-full md:w-[220px]" data-testid="select-practice-area">
                      <SelectValue placeholder={t.filterByPractice} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="select-practice-all">
                        {t.allPracticeAreas}
                      </SelectItem>
                      {practiceGroups?.map((group) => (
                        <SelectItem 
                          key={group.slug} 
                          value={group.slug}
                          data-testid={`select-practice-${group.slug}`}
                        >
                          {language === "es" ? group.nameEs : group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-full md:w-[220px]" data-testid="select-industry">
                      <SelectValue placeholder={t.filterByIndustry} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="select-industry-all">
                        {t.allIndustries}
                      </SelectItem>
                      {industryGroups?.map((group) => (
                        <SelectItem 
                          key={group.slug} 
                          value={group.slug}
                          data-testid={`select-industry-${group.slug}`}
                        >
                          {language === "es" ? group.nameEs : group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {mattersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="rounded-md border-0 shadow-sm bg-gray-50 dark:bg-gray-800">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <Skeleton className="h-5 w-24 mb-2" />
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMatters.length === 0 ? (
                <div className="text-center py-12" data-testid="container-no-results">
                  <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400" data-testid="text-no-results">
                    {t.noResults}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {filteredMatters.map((matter) => (
                    <motion.div key={matter.id} variants={itemVariants}>
                      <Card
                        className="rounded-md border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-300"
                        data-testid={`card-matter-${matter.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-2 text-sm text-primary">
                                  <Calendar className="w-4 h-4" />
                                  <span data-testid={`text-matter-year-${matter.id}`}>{matter.year}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <Building2 className="w-4 h-4" />
                                  <span data-testid={`text-matter-client-${matter.id}`}>
                                    {language === "es" 
                                      ? (matter.clientEs || matter.client || t.confidentialClient) 
                                      : (matter.client || t.confidentialClient)}
                                  </span>
                                </div>
                              </div>
                              <h3 
                                className="text-lg font-medium text-gray-900 dark:text-white mb-2"
                                data-testid={`text-matter-title-${matter.id}`}
                              >
                                {language === "es" ? matter.titleEs : matter.title}
                              </h3>
                              <p 
                                className="text-gray-600 dark:text-gray-300 text-sm"
                                data-testid={`text-matter-description-${matter.id}`}
                              >
                                {language === "es" ? matter.descriptionEs : matter.description}
                              </p>
                            </div>
                            <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:min-w-fit">
                              <Link href={`/practice-groups/${matter.practiceAreaSlug}`}>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer hover-elevate whitespace-nowrap"
                                  data-testid={`badge-matter-practice-${matter.id}`}
                                >
                                  <Briefcase className="w-3 h-3 mr-1" />
                                  {getPracticeAreaName(matter.practiceAreaSlug)}
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Badge>
                              </Link>
                              {matter.industrySlug && (
                                <Link href={`/industry-groups/${matter.industrySlug}`}>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs cursor-pointer hover-elevate whitespace-nowrap"
                                    data-testid={`badge-matter-industry-${matter.id}`}
                                  >
                                    {getIndustryName(matter.industrySlug)}
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </Badge>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        </>
      )}

      <Footer language={language} />
    </div>
  );
}
