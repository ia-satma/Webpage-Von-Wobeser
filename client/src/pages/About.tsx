import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Award, Users, Globe2, Building2, Scale, Heart, Briefcase, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

export default function About() {
  const [language, setLanguage] = useState<"es" | "en">("es");

  const { data: teamMembers } = useQuery<TeamMember[]>({
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
      title: "About the Firm",
      subtitle: "Over 70 years of excellence in legal services in Mexico",
      historyTitle: "Our History",
      historyText1: "Founded in 1952, Von Wobeser y Sierra is one of Mexico's most prestigious and recognized law firms. For more than seven decades, we have provided top-tier legal services to national and international clients across a wide range of industries.",
      historyText2: "Our firm has grown to become a leader in the Mexican legal market, consistently ranked among the top law firms in the country by Chambers and Partners, Legal 500, and Latin Lawyer 250.",
      valuesTitle: "Our Values",
      values: [
        { icon: Scale, title: "Excellence", text: "We are committed to delivering the highest quality legal services" },
        { icon: Heart, title: "Integrity", text: "Ethical conduct and transparency guide all our actions" },
        { icon: Users, title: "Collaboration", text: "We work as one team to achieve the best results for our clients" },
        { icon: Globe2, title: "Innovation", text: "We embrace new technologies and approaches to serve our clients better" },
      ],
      statsTitle: "Our Firm in Numbers",
      stats: [
        { value: "70+", label: "Years of Experience" },
        { value: String(teamMembers?.length || 70), label: "Attorneys" },
        { value: String(practiceGroups?.length || 18), label: "Practice Areas" },
        { value: String(industryGroups?.length || 7), label: "Industry Groups" },
      ],
      rankingsTitle: "Rankings & Recognition",
      rankingsText: "Von Wobeser y Sierra is consistently recognized as one of the leading law firms in Mexico by the most prestigious legal directories worldwide.",
      rankings: [
        "Chambers and Partners Global - Band 1",
        "Chambers and Partners Latin America - Band 1",
        "Legal 500 Latin America - Tier 1",
        "Latin Lawyer 250 - Elite",
        "IFLR1000 - Tier 1",
        "Global Investigations Review 100",
      ],
      proBonoTitle: "Pro Bono",
      proBonoText: "We are deeply committed to providing pro bono legal services to those in need. Our attorneys dedicate significant time to supporting charitable organizations, human rights causes, and access to justice initiatives.",
      careersTitle: "Careers",
      careersText: "Join one of Mexico's leading law firms and build your career with the best. We offer exceptional opportunities for growth and development.",
      learnMore: "Learn More",
      viewTeam: "View Our Team",
      viewPractices: "View Practice Areas",
    },
    es: {
      title: "Acerca de la Firma",
      subtitle: "Más de 70 años de excelencia en servicios legales en México",
      historyTitle: "Nuestra Historia",
      historyText1: "Fundado en 1952, Von Wobeser y Sierra es uno de los despachos de abogados más prestigiosos y reconocidos de México. Durante más de siete décadas, hemos brindado servicios legales de primer nivel a clientes nacionales e internacionales en una amplia gama de industrias.",
      historyText2: "Nuestra firma ha crecido hasta convertirse en líder en el mercado legal mexicano, consistentemente clasificada entre los principales despachos de abogados del país por Chambers and Partners, Legal 500 y Latin Lawyer 250.",
      valuesTitle: "Nuestros Valores",
      values: [
        { icon: Scale, title: "Excelencia", text: "Estamos comprometidos a brindar servicios legales de la más alta calidad" },
        { icon: Heart, title: "Integridad", text: "La conducta ética y la transparencia guían todas nuestras acciones" },
        { icon: Users, title: "Colaboración", text: "Trabajamos en equipo para lograr los mejores resultados para nuestros clientes" },
        { icon: Globe2, title: "Innovación", text: "Adoptamos nuevas tecnologías y enfoques para servir mejor a nuestros clientes" },
      ],
      statsTitle: "Nuestra Firma en Números",
      stats: [
        { value: "70+", label: "Años de Experiencia" },
        { value: String(teamMembers?.length || 70), label: "Abogados" },
        { value: String(practiceGroups?.length || 18), label: "Áreas de Práctica" },
        { value: String(industryGroups?.length || 7), label: "Grupos Industriales" },
      ],
      rankingsTitle: "Rankings y Reconocimientos",
      rankingsText: "Von Wobeser y Sierra es consistentemente reconocido como uno de los principales despachos de abogados en México por los directorios legales más prestigiosos del mundo.",
      rankings: [
        "Chambers and Partners Global - Banda 1",
        "Chambers and Partners Latin America - Banda 1",
        "Legal 500 Latin America - Nivel 1",
        "Latin Lawyer 250 - Elite",
        "IFLR1000 - Nivel 1",
        "Global Investigations Review 100",
      ],
      proBonoTitle: "Pro Bono",
      proBonoText: "Estamos profundamente comprometidos con brindar servicios legales pro bono a quienes más lo necesitan. Nuestros abogados dedican tiempo significativo a apoyar organizaciones benéficas, causas de derechos humanos e iniciativas de acceso a la justicia.",
      careersTitle: "Carreras",
      careersText: "Únase a uno de los principales despachos de abogados de México y construya su carrera con los mejores. Ofrecemos oportunidades excepcionales de crecimiento y desarrollo.",
      learnMore: "Conocer Más",
      viewTeam: "Ver Nuestro Equipo",
      viewPractices: "Ver Áreas de Práctica",
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-about">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-about-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-about-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-about-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
            data-testid="section-history"
          >
            <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-6">
              {t.historyTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.historyText1}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.historyText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-20"
            data-testid="section-values"
          >
            <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-8 text-center">
              {t.valuesTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.values.map((value, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700 text-center" data-testid={`card-value-${index}`}>
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {value.text}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20 bg-gray-50 dark:bg-gray-800 rounded-md p-10"
            data-testid="section-stats"
          >
            <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-8 text-center">
              {t.statsTitle}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {t.stats.map((stat, index) => (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <p className="text-4xl lg:text-5xl font-heading text-primary mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-20"
            data-testid="section-rankings"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white">
                    {t.rankingsTitle}
                  </h2>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  {t.rankingsText}
                </p>
                <ul className="space-y-3">
                  {t.rankings.map((ranking, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      {ranking}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <img
                  src="https://vonwobeser.com/images/vonwobeser_2025.png"
                  alt="Von Wobeser y Sierra"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              data-testid="section-pro-bono"
            >
              <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                    <h2 className="text-2xl font-heading font-light text-gray-800 dark:text-white">
                      {t.proBonoTitle}
                    </h2>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t.proBonoText}
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              data-testid="section-careers"
            >
              <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700 bg-primary text-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="w-8 h-8 text-white" />
                    <h2 className="text-2xl font-heading font-light">
                      {t.careersTitle}
                    </h2>
                  </div>
                  <p className="text-white/90 leading-relaxed mb-6">
                    {t.careersText}
                  </p>
                  <Button 
                    variant="secondary"
                    className="rounded-md bg-white text-primary hover:bg-white/90"
                    asChild
                    data-testid="button-careers"
                  >
                    <a href="mailto:carreras@vonwobeser.com">
                      {t.learnMore}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.section>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/team">
              <Button className="rounded-md" data-testid="button-view-team">
                <Users className="w-4 h-4 mr-2" />
                {t.viewTeam}
              </Button>
            </Link>
            <Link href="/practice-groups">
              <Button variant="outline" className="rounded-md" data-testid="button-view-practices">
                <Briefcase className="w-4 h-4 mr-2" />
                {t.viewPractices}
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
