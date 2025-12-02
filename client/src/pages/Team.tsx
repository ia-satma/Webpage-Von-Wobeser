import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Users, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { TeamMember } from "@shared/schema";

export default function Team() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [showPartnersOnly, setShowPartnersOnly] = useState(false);

  const { data: allTeamMembers, isLoading: isLoadingAll, error: errorAll } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: partners, isLoading: isLoadingPartners, error: errorPartners } = useQuery<TeamMember[]>({
    queryKey: ["/api/team/partners"],
  });

  const teamMembers = showPartnersOnly ? partners : allTeamMembers;
  const isLoading = showPartnersOnly ? isLoadingPartners : isLoadingAll;
  const error = showPartnersOnly ? errorPartners : errorAll;

  const content = {
    en: {
      title: "Our Team",
      subtitle: "Meet the experienced attorneys who make our firm a leader in legal excellence",
      errorMessage: "Failed to load team members",
      allMembers: "All Members",
      partnersOnly: "Partners",
      viewProfile: "View Profile",
    },
    es: {
      title: "Nuestro Equipo",
      subtitle: "Conozca a los experimentados abogados que hacen de nuestra firma un líder en excelencia legal",
      errorMessage: "Error al cargar los miembros del equipo",
      allMembers: "Todos",
      partnersOnly: "Socios",
      viewProfile: "Ver Perfil",
    },
  };

  const t = content[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-team">
      <Header language={language} onLanguageChange={setLanguage} />
      
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
              className="text-lg text-white/80 max-w-2xl mx-auto"
              data-testid="text-team-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-12"
          >
            <div 
              className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800"
              data-testid="container-team-filter"
            >
              <Button
                variant={!showPartnersOnly ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowPartnersOnly(false)}
                className="rounded-md gap-2"
                data-testid="button-filter-all"
              >
                <Users className="w-4 h-4" />
                {t.allMembers}
              </Button>
              <Button
                variant={showPartnersOnly ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowPartnersOnly(true)}
                className="rounded-md gap-2"
                data-testid="button-filter-partners"
              >
                <Crown className="w-4 h-4" />
                {t.partnersOnly}
              </Button>
            </div>
          </motion.div>

          {error ? (
            <div className="text-center py-12" data-testid="container-team-error">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-team-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
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
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {teamMembers?.map((member) => (
                <motion.div key={member.id} variants={itemVariants}>
                  <Link href={`/team/${member.slug}`}>
                    <Card
                      className="group h-full rounded-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800"
                      data-testid={`card-team-member-${member.slug}`}
                    >
                      <CardContent className="p-6 text-center">
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
                          {member.isPartner && (
                            <div 
                              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                              title={language === "es" ? "Socio" : "Partner"}
                            >
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 
                          className="text-lg font-semibold text-gray-800 dark:text-white mb-1 group-hover:text-primary transition-colors"
                          data-testid={`text-team-member-name-${member.slug}`}
                        >
                          {member.name}
                        </h3>
                        <p 
                          className="text-sm text-primary font-medium mb-1"
                          data-testid={`text-team-member-title-${member.slug}`}
                        >
                          {language === "es" ? member.titleEs : member.title}
                        </p>
                        <p 
                          className="text-sm text-gray-600 dark:text-gray-400"
                          data-testid={`text-team-member-role-${member.slug}`}
                        >
                          {language === "es" ? member.roleEs : member.role}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && !error && teamMembers?.length === 0 && (
            <div className="text-center py-12" data-testid="container-team-empty">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {language === "es" ? "No hay miembros del equipo disponibles" : "No team members available"}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
