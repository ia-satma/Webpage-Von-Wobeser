import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Award, 
  Users, 
  Globe2, 
  Building2, 
  Scale, 
  Heart, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  UserCheck,
  Target,
  TrendingUp,
  Handshake,
  GraduationCap,
  Coffee,
  Lightbulb,
  Shield,
  BarChart3,
  UsersRound,
  HeartHandshake
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember, PracticeGroup, IndustryGroup } from "@shared/schema";

export default function About() {
  const { language } = useLanguage();

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
      cultureTitle: "Our Culture",
      cultureSubtitle: "A workplace where talent thrives and excellence is the standard",
      cultureIntro: "At Von Wobeser y Sierra, we have cultivated a unique culture that blends professional rigor with a supportive and collaborative environment. Our attorneys work alongside some of the most talented legal professionals in Mexico, fostering an atmosphere of continuous learning and mutual respect.",
      cultureAspects: [
        { 
          icon: Building2, 
          title: "Modern Work Environment", 
          text: "State-of-the-art facilities designed to promote collaboration, creativity, and well-being. Our offices feature open spaces, meeting rooms with cutting-edge technology, and areas for relaxation and informal gatherings."
        },
        { 
          icon: Handshake, 
          title: "Team Collaboration", 
          text: "We believe the best legal solutions come from diverse perspectives. Our practice groups work seamlessly together, combining specialized expertise to deliver comprehensive counsel to our clients."
        },
        { 
          icon: GraduationCap, 
          title: "Professional Development", 
          text: "Continuous education is fundamental to our firm. We invest in training programs, mentorship opportunities, and support for advanced degrees and certifications to help our attorneys reach their full potential."
        },
        { 
          icon: HeartHandshake, 
          title: "Community Involvement", 
          text: "We are committed to giving back. Through pro bono work, partnerships with NGOs, and support for legal education initiatives, we strive to make a positive impact beyond our practice."
        },
        { 
          icon: Coffee, 
          title: "Work-Life Balance", 
          text: "We recognize that sustainable success requires balance. Our firm promotes flexible arrangements and wellness initiatives to support our team members both professionally and personally."
        },
        { 
          icon: Lightbulb, 
          title: "Innovation Mindset", 
          text: "We encourage creative thinking and embrace technology to deliver more efficient and effective legal services. Our culture rewards initiative and values new ideas from every level of the organization."
        },
      ],
      diversityTitle: "Diversity & Inclusion",
      diversitySubtitle: "Building a more inclusive legal profession",
      diversityIntro: "Von Wobeser y Sierra is committed to fostering a diverse and inclusive workplace where every individual is valued, respected, and empowered to succeed. We believe that diversity of thought, background, and experience strengthens our firm and enhances the quality of service we provide to our clients.",
      diversityStats: [
        { value: "45%", label: "Women in the Firm", icon: UsersRound },
        { value: "35%", label: "Women Partners", icon: TrendingUp },
        { value: "50%", label: "Women in Leadership Roles", icon: Target },
        { value: "100%", label: "Equal Opportunity Commitment", icon: Shield },
      ],
      diversityInitiatives: [
        { 
          icon: UserCheck, 
          title: "Inclusive Hiring", 
          text: "Our recruitment practices are designed to attract and evaluate candidates based solely on their skills, experience, and potential, ensuring equal opportunities for all regardless of gender, background, or personal circumstances."
        },
        { 
          icon: BarChart3, 
          title: "Gender Equality", 
          text: "We actively promote gender equality at all levels of the organization. Our programs support the advancement of women in leadership positions and ensure equitable compensation and growth opportunities."
        },
        { 
          icon: Sparkles, 
          title: "Equal Opportunities", 
          text: "Every team member has access to the same development resources, challenging assignments, and career advancement paths. We are committed to removing barriers and creating pathways for success for all."
        },
        { 
          icon: Shield, 
          title: "Inclusive Workplace", 
          text: "We foster an environment where differences are celebrated and all voices are heard. Our policies and practices ensure that every individual feels safe, respected, and able to bring their authentic self to work."
        },
      ],
      diversityCommitment: "Our commitment to diversity and inclusion is not just a policy—it's a core value that shapes how we work, grow, and serve our clients. We continuously evaluate and improve our practices to ensure we remain at the forefront of creating a more equitable legal profession.",
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
      cultureTitle: "Nuestra Cultura",
      cultureSubtitle: "Un lugar de trabajo donde el talento prospera y la excelencia es el estándar",
      cultureIntro: "En Von Wobeser y Sierra, hemos cultivado una cultura única que combina el rigor profesional con un ambiente de apoyo y colaboración. Nuestros abogados trabajan junto a algunos de los profesionales legales más talentosos de México, fomentando una atmósfera de aprendizaje continuo y respeto mutuo.",
      cultureAspects: [
        { 
          icon: Building2, 
          title: "Ambiente de Trabajo Moderno", 
          text: "Instalaciones de vanguardia diseñadas para promover la colaboración, la creatividad y el bienestar. Nuestras oficinas cuentan con espacios abiertos, salas de reuniones con tecnología de punta y áreas para relajación y reuniones informales."
        },
        { 
          icon: Handshake, 
          title: "Colaboración en Equipo", 
          text: "Creemos que las mejores soluciones legales provienen de perspectivas diversas. Nuestros grupos de práctica trabajan de manera integrada, combinando experiencia especializada para brindar asesoría integral a nuestros clientes."
        },
        { 
          icon: GraduationCap, 
          title: "Desarrollo Profesional", 
          text: "La educación continua es fundamental para nuestra firma. Invertimos en programas de capacitación, oportunidades de mentoría y apoyo para estudios avanzados y certificaciones para ayudar a nuestros abogados a alcanzar su máximo potencial."
        },
        { 
          icon: HeartHandshake, 
          title: "Participación Comunitaria", 
          text: "Estamos comprometidos con retribuir a la sociedad. A través del trabajo pro bono, asociaciones con ONGs y apoyo a iniciativas de educación legal, nos esforzamos por generar un impacto positivo más allá de nuestra práctica."
        },
        { 
          icon: Coffee, 
          title: "Equilibrio Vida-Trabajo", 
          text: "Reconocemos que el éxito sostenible requiere equilibrio. Nuestra firma promueve arreglos flexibles e iniciativas de bienestar para apoyar a los miembros de nuestro equipo tanto profesional como personalmente."
        },
        { 
          icon: Lightbulb, 
          title: "Mentalidad de Innovación", 
          text: "Fomentamos el pensamiento creativo y adoptamos tecnología para brindar servicios legales más eficientes y efectivos. Nuestra cultura recompensa la iniciativa y valora las nuevas ideas de todos los niveles de la organización."
        },
      ],
      diversityTitle: "Diversidad e Inclusión",
      diversitySubtitle: "Construyendo una profesión legal más inclusiva",
      diversityIntro: "Von Wobeser y Sierra está comprometido con fomentar un lugar de trabajo diverso e inclusivo donde cada individuo sea valorado, respetado y empoderado para triunfar. Creemos que la diversidad de pensamiento, antecedentes y experiencia fortalece nuestra firma y mejora la calidad del servicio que brindamos a nuestros clientes.",
      diversityStats: [
        { value: "45%", label: "Mujeres en la Firma", icon: UsersRound },
        { value: "35%", label: "Mujeres Socias", icon: TrendingUp },
        { value: "50%", label: "Mujeres en Roles de Liderazgo", icon: Target },
        { value: "100%", label: "Compromiso con Igualdad de Oportunidades", icon: Shield },
      ],
      diversityInitiatives: [
        { 
          icon: UserCheck, 
          title: "Contratación Inclusiva", 
          text: "Nuestras prácticas de reclutamiento están diseñadas para atraer y evaluar candidatos basándose únicamente en sus habilidades, experiencia y potencial, asegurando igualdad de oportunidades para todos sin importar género, antecedentes o circunstancias personales."
        },
        { 
          icon: BarChart3, 
          title: "Igualdad de Género", 
          text: "Promovemos activamente la igualdad de género en todos los niveles de la organización. Nuestros programas apoyan el avance de mujeres en posiciones de liderazgo y aseguran compensación equitativa y oportunidades de crecimiento."
        },
        { 
          icon: Sparkles, 
          title: "Igualdad de Oportunidades", 
          text: "Cada miembro del equipo tiene acceso a los mismos recursos de desarrollo, asignaciones desafiantes y caminos de avance profesional. Estamos comprometidos a remover barreras y crear caminos hacia el éxito para todos."
        },
        { 
          icon: Shield, 
          title: "Ambiente Inclusivo", 
          text: "Fomentamos un entorno donde las diferencias se celebran y todas las voces son escuchadas. Nuestras políticas y prácticas aseguran que cada individuo se sienta seguro, respetado y capaz de ser auténtico en el trabajo."
        },
      ],
      diversityCommitment: "Nuestro compromiso con la diversidad e inclusión no es solo una política—es un valor fundamental que moldea cómo trabajamos, crecemos y servimos a nuestros clientes. Continuamente evaluamos y mejoramos nuestras prácticas para asegurar que estemos a la vanguardia en la creación de una profesión legal más equitativa.",
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
      <SEOHead page="about" language={language} />
      <Header />
      
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

      <main id="main-content" className="py-16 lg:py-20">
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
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-20"
            data-testid="section-culture"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.cultureTitle}
              </h2>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-culture-subtitle">
                {t.cultureSubtitle}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto" data-testid="text-culture-intro">
                {t.cultureIntro}
              </p>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {t.cultureAspects.map((aspect, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid={`card-culture-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <aspect.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {aspect.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {aspect.text}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-md p-10"
            data-testid="section-diversity"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <UsersRound className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white">
                  {t.diversityTitle}
                </h2>
              </div>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-diversity-subtitle">
                {t.diversitySubtitle}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto" data-testid="text-diversity-intro">
                {t.diversityIntro}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {t.diversityStats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className="text-center bg-white dark:bg-gray-800 rounded-md p-6 shadow-sm"
                  data-testid={`stat-diversity-${index}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl lg:text-4xl font-heading text-primary mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
            >
              {t.diversityInitiatives.map((initiative, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" data-testid={`card-diversity-initiative-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <initiative.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {initiative.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {initiative.text}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center">
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto italic" data-testid="text-diversity-commitment">
                {t.diversityCommitment}
              </p>
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
                    <li key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300" data-testid={`text-ranking-${index}`}>
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
                  data-testid="img-rankings"
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
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-pro-bono">
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
                  <p className="text-white/90 leading-relaxed mb-6" data-testid="text-careers">
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

      <Footer />
    </div>
  );
}
