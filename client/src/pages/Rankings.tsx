import { Link } from "wouter";
import { motion } from "framer-motion";
import { Award, Star, Trophy, Medal, BookOpen, Users, Scale, Building2, Globe2, Briefcase, ChevronRight, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember } from "@shared/schema";

interface DirectoryInfo {
  id: string;
  name: string;
  nameEs: string;
  icon: typeof Award;
  description: string;
  descriptionEs: string;
  rankings: { en: string; es: string }[];
}

const directories: DirectoryInfo[] = [
  {
    id: "chambers-global",
    name: "Chambers Global",
    nameEs: "Chambers Global",
    icon: Globe2,
    description: "Recognized as one of the leading law firms in Mexico for cross-border transactions and international matters.",
    descriptionEs: "Reconocido como una de las firmas de abogados líderes en México para transacciones transfronterizas y asuntos internacionales.",
    rankings: [
      { en: "Band 1 - Corporate/M&A", es: "Banda 1 - Corporativo/M&A" },
      { en: "Band 1 - Dispute Resolution", es: "Banda 1 - Resolución de Controversias" },
      { en: "Band 1 - Antitrust", es: "Banda 1 - Competencia Económica" },
    ],
  },
  {
    id: "chambers-latam",
    name: "Chambers Latin America",
    nameEs: "Chambers América Latina",
    icon: Award,
    description: "Consistently ranked in the top tier across multiple practice areas for excellence in the Latin American market.",
    descriptionEs: "Consistentemente clasificado en el nivel superior en múltiples áreas de práctica por excelencia en el mercado latinoamericano.",
    rankings: [
      { en: "Band 1 - Corporate/M&A", es: "Banda 1 - Corporativo/M&A" },
      { en: "Band 1 - Litigation", es: "Banda 1 - Litigio" },
      { en: "Band 1 - Banking & Finance", es: "Banda 1 - Banca y Finanzas" },
      { en: "Band 1 - Energy & Natural Resources", es: "Banda 1 - Energía y Recursos Naturales" },
    ],
  },
  {
    id: "legal500",
    name: "Legal 500 Latin America",
    nameEs: "Legal 500 América Latina",
    icon: BookOpen,
    description: "Highly recommended for outstanding client service and legal expertise across various sectors.",
    descriptionEs: "Altamente recomendado por excelente servicio al cliente y experiencia legal en diversos sectores.",
    rankings: [
      { en: "Tier 1 - Corporate and M&A", es: "Nivel 1 - Corporativo y M&A" },
      { en: "Tier 1 - Dispute Resolution", es: "Nivel 1 - Resolución de Controversias" },
      { en: "Tier 1 - Competition/Antitrust", es: "Nivel 1 - Competencia Económica" },
    ],
  },
  {
    id: "iflr1000",
    name: "IFLR1000",
    nameEs: "IFLR1000",
    icon: Briefcase,
    description: "Top-ranked for financial and corporate work, including complex restructuring and capital markets transactions.",
    descriptionEs: "Clasificación superior para trabajo financiero y corporativo, incluyendo reestructuraciones complejas y transacciones de mercado de capitales.",
    rankings: [
      { en: "Tier 1 - M&A", es: "Nivel 1 - M&A" },
      { en: "Tier 1 - Banking", es: "Nivel 1 - Banca" },
      { en: "Tier 1 - Capital Markets", es: "Nivel 1 - Mercado de Capitales" },
      { en: "Tier 1 - Restructuring & Insolvency", es: "Nivel 1 - Reestructuración e Insolvencia" },
    ],
  },
  {
    id: "latin-lawyer",
    name: "Latin Lawyer 250",
    nameEs: "Latin Lawyer 250",
    icon: Scale,
    description: "Featured as an Elite firm and consistently recognized among the top law firms in Latin America.",
    descriptionEs: "Destacado como firma Elite y consistentemente reconocido entre las mejores firmas de abogados en América Latina.",
    rankings: [
      { en: "Elite Status", es: "Estatus Elite" },
      { en: "Deal of the Year - Multiple Categories", es: "Operación del Año - Múltiples Categorías" },
    ],
  },
  {
    id: "best-lawyers",
    name: "Best Lawyers",
    nameEs: "Best Lawyers",
    icon: Star,
    description: "Multiple partners recognized as leading lawyers in their respective practice areas.",
    descriptionEs: "Múltiples socios reconocidos como abogados líderes en sus respectivas áreas de práctica.",
    rankings: [
      { en: "Lawyer of the Year - Corporate Law", es: "Abogado del Año - Derecho Corporativo" },
      { en: "Lawyer of the Year - M&A", es: "Abogado del Año - M&A" },
      { en: "20+ Lawyers Recognized", es: "20+ Abogados Reconocidos" },
    ],
  },
  {
    id: "who-who-legal",
    name: "Who's Who Legal",
    nameEs: "Who's Who Legal",
    icon: Users,
    description: "Partners listed as Global Leaders and National Leaders across multiple specializations.",
    descriptionEs: "Socios listados como Líderes Globales y Líderes Nacionales en múltiples especializaciones.",
    rankings: [
      { en: "Global Leaders - Arbitration", es: "Líderes Globales - Arbitraje" },
      { en: "National Leaders - Competition", es: "Líderes Nacionales - Competencia" },
      { en: "Thought Leaders - Investigations", es: "Líderes de Opinión - Investigaciones" },
    ],
  },
];

interface AwardInfo {
  id: string;
  title: string;
  titleEs: string;
  years?: string[];
  description: string;
  descriptionEs: string;
}

const awards: AwardInfo[] = [
  {
    id: "law-firm-year",
    title: "Latin American Law Firm of the Year",
    titleEs: "Firma de Abogados del Año en América Latina",
    years: ["2023", "2021", "2019", "2017"],
    description: "Chambers Latin America Awards recognition for outstanding performance and market-leading work.",
    descriptionEs: "Reconocimiento de Chambers Latin America Awards por desempeño sobresaliente y trabajo líder en el mercado.",
  },
  {
    id: "mexico-firm-year",
    title: "Mexico Law Firm of the Year",
    titleEs: "Firma de Abogados del Año en México",
    years: ["2024", "2022", "2020", "2018"],
    description: "Chambers Latin America Awards recognition as the leading law firm in Mexico.",
    descriptionEs: "Reconocimiento de Chambers Latin America Awards como la firma de abogados líder en México.",
  },
  {
    id: "deal-of-year",
    title: "Deal of the Year Awards",
    titleEs: "Premios Operación del Año",
    description: "Multiple Deal of the Year recognitions from Latin Lawyer, IFLR Americas, and Chambers for landmark transactions.",
    descriptionEs: "Múltiples reconocimientos de Operación del Año de Latin Lawyer, IFLR Americas y Chambers por transacciones emblemáticas.",
  },
  {
    id: "gir-100",
    title: "GIR 100 - Global Investigations Review",
    titleEs: "GIR 100 - Global Investigations Review",
    description: "Recognized among the world's top 100 investigations practices for excellence in anti-corruption and compliance matters.",
    descriptionEs: "Reconocido entre las 100 mejores prácticas de investigaciones del mundo por excelencia en asuntos anticorrupción y cumplimiento.",
  },
];

const rankedLawyers = [
  { name: "Claus von Wobeser", slug: "claus-von-wobeser", title: "Founding Partner", titleEs: "Socio Fundador" },
  { name: "Pablo Fautsch", slug: "pablo-fautsch", title: "Partner", titleEs: "Socio" },
  { name: "Fernando Carreño", slug: "fernando-carreno", title: "Partner", titleEs: "Socio" },
  { name: "Diego Sierra", slug: "diego-sierra", title: "Partner", titleEs: "Socio" },
  { name: "Adrián Magallanes", slug: "adrian-magallanes", title: "Partner", titleEs: "Socio" },
  { name: "Montserrat Manzano", slug: "montserrat-manzano", title: "Partner", titleEs: "Socio" },
];

export default function Rankings() {
  const { language } = useLanguage();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const content = {
    en: {
      title: "Rankings & Recognition",
      subtitle: "Consistently recognized as one of the leading law firms in Mexico and Latin America",
      overviewTitle: "Excellence Recognized Worldwide",
      overviewText1: "Von Wobeser y Sierra is consistently ranked among the top law firms in Mexico and Latin America by the world's most prestigious legal directories. Our commitment to excellence, deep expertise, and client-focused approach have earned us recognition across all major practice areas.",
      overviewText2: "For over seven decades, we have maintained our position as a market leader, earning top-tier rankings from Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250, and other leading publications.",
      directoriesTitle: "Major Legal Directories",
      directoriesSubtitle: "Top rankings across all major international legal directories",
      awardsTitle: "Awards & Achievements",
      awardsSubtitle: "Recent accolades recognizing our excellence in legal services",
      lawyersTitle: "Ranked Lawyers",
      lawyersSubtitle: "Our attorneys are individually recognized as leaders in their fields",
      viewProfile: "View Profile",
      quoteText: "Von Wobeser y Sierra is 'the standout Mexican firm' with 'an enviable client roster and stellar reputation for high-end transactional and contentious work.'",
      quoteSource: "Chambers Latin America",
      viewAllTeam: "View All Team Members",
    },
    es: {
      title: "Reconocimientos",
      subtitle: "Von Wobeser y Sierra ha sido reconocido a nivel internacional por diversas instituciones que incluyen Chambers Global, Chambers Latin America, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR), Global Investigations Review (GIR), Legal 500, Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000 e IFLR Energy & Infrastructure y Benchmark Litigation entre otras.",
      overviewTitle: "Excelencia Reconocida Mundialmente",
      overviewText1: "Von Wobeser y Sierra es consistentemente clasificado entre las principales firmas de abogados en México y América Latina por los directorios legales más prestigiosos del mundo. Nuestro compromiso con la excelencia, profunda experiencia y enfoque centrado en el cliente nos han ganado reconocimiento en todas las principales áreas de práctica.",
      overviewText2: "Durante más de siete décadas, hemos mantenido nuestra posición como líder del mercado, obteniendo clasificaciones de primer nivel de Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 y otras publicaciones líderes.",
      directoriesTitle: "Principales Directorios Legales",
      directoriesSubtitle: "Clasificaciones superiores en todos los principales directorios legales internacionales",
      awardsTitle: "Premios y Logros",
      awardsSubtitle: "Reconocimientos recientes que destacan nuestra excelencia en servicios legales",
      lawyersTitle: "Abogados Reconocidos",
      lawyersSubtitle: "Nuestros abogados son individualmente reconocidos como líderes en sus campos",
      viewProfile: "Ver Perfil",
      quoteText: "Von Wobeser y Sierra es 'la firma mexicana destacada' con 'una envidiable cartera de clientes y una reputación estelar para trabajo transaccional y contencioso de alto nivel.'",
      quoteSource: "Chambers América Latina",
      viewAllTeam: "Ver Todo el Equipo",
    },
  };

  const t = content[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-rankings">
      <SEOHead page="rankings" language={language} />
      <Header />

      <section className="pt-32 pb-16 bg-primary" data-testid="section-rankings-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Trophy className="w-10 h-10 text-white/90" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-rankings-title"
            >
              {t.title}
            </h1>
            <p
              className="text-lg text-white/90 max-w-3xl mx-auto"
              data-testid="text-rankings-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
            data-testid="section-rankings-overview"
          >
            <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-6">
              {t.overviewTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.overviewText1}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.overviewText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-20"
            data-testid="section-directories"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.directoriesTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.directoriesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {directories.map((directory) => (
                <motion.div key={directory.id} variants={itemVariants}>
                  <Card
                    className="h-full hover-elevate transition-all duration-300"
                    data-testid={`card-directory-${directory.id}`}
                  >
                    <CardHeader className="flex flex-row items-start gap-4 pb-4">
                      <div className="p-3 rounded-md bg-primary/10 text-primary flex-shrink-0">
                        <directory.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-medium text-gray-800 dark:text-white">
                          {language === "es" ? directory.nameEs : directory.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === "es" ? directory.descriptionEs : directory.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {directory.rankings.map((ranking, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                            data-testid={`badge-ranking-${directory.id}-${idx}`}
                          >
                            {language === "es" ? ranking.es : ranking.en}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-20"
            data-testid="section-awards"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.awardsTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.awardsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {awards.map((award) => (
                <motion.div key={award.id} variants={itemVariants}>
                  <Card
                    className="h-full hover-elevate transition-all duration-300"
                    data-testid={`card-award-${award.id}`}
                  >
                    <CardHeader className="flex flex-row items-start gap-4 pb-4">
                      <div className="p-3 rounded-md bg-primary/10 text-primary flex-shrink-0">
                        <Medal className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-medium text-gray-800 dark:text-white">
                          {language === "es" ? award.titleEs : award.title}
                        </CardTitle>
                        {award.years && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {award.years.map((year) => (
                              <Badge
                                key={year}
                                variant="outline"
                                className="text-xs"
                              >
                                {year}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === "es" ? award.descriptionEs : award.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 py-12 px-8 bg-gray-50 dark:bg-gray-800 rounded-md"
            data-testid="section-rankings-quote"
          >
            <div className="max-w-4xl mx-auto text-center">
              <Quote className="w-12 h-12 text-primary/30 mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl font-heading font-light text-gray-800 dark:text-white italic mb-6">
                "{t.quoteText}"
              </blockquote>
              <cite className="text-primary font-medium not-italic">
                — {t.quoteSource}
              </cite>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-12"
            data-testid="section-ranked-lawyers"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.lawyersTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.lawyersSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedLawyers.map((lawyer) => {
                const teamMember = teamMembers?.find(
                  (m) => m.slug === lawyer.slug || m.name === lawyer.name
                );

                return (
                  <motion.div key={lawyer.slug} variants={itemVariants}>
                    <Link href={teamMember ? `/team/${teamMember.slug}` : `/team/${lawyer.slug}`}>
                      <Card
                        className="h-full hover-elevate transition-all duration-300 cursor-pointer group"
                        data-testid={`card-lawyer-${lawyer.slug}`}
                      >
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                            {lawyer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                              {lawyer.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {language === "es" ? lawyer.titleEs : lawyer.title}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Link href="/team">
                <Button
                  variant="outline"
                  className="gap-2"
                  data-testid="button-view-all-team"
                >
                  {t.viewAllTeam}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
