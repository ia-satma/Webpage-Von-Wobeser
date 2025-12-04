import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  GraduationCap, 
  Heart, 
  Scale, 
  Briefcase, 
  Clock, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Building2, 
  MapPin, 
  Mail, 
  ArrowRight, 
  Calendar,
  Target,
  Lightbulb,
  Shield,
  HandHeart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Careers() {
  const [language, setLanguage] = useState<"es" | "en">("es");

  const content = {
    en: {
      heroTitle: "Build Your Career With Us",
      heroSubtitle: "Join one of Mexico's leading law firms and be part of a team that values excellence, integrity, and professional growth.",
      whyJoinTitle: "Why Join Von Wobeser y Sierra",
      whyJoinSubtitle: "Discover what makes us a great place to work",
      cultureTitle: "Our Culture",
      cultureText: "At Von Wobeser y Sierra, we foster a collaborative and inclusive environment where every team member can thrive. With over 70 years of excellence, we combine tradition with innovation to deliver exceptional legal services. Our culture emphasizes teamwork, mutual respect, and a commitment to the highest ethical standards.",
      valuesTitle: "Our Core Values",
      values: [
        { icon: Scale, title: "Excellence", text: "We strive for the highest quality in everything we do" },
        { icon: Heart, title: "Integrity", text: "Ethical conduct guides all our professional relationships" },
        { icon: Users, title: "Collaboration", text: "We work together as a unified team to achieve success" },
        { icon: Lightbulb, title: "Innovation", text: "We embrace new ideas and approaches to solve challenges" },
      ],
      environmentTitle: "Work Environment",
      environmentText: "Our modern offices in Torre SOMA Chapultepec offer a dynamic and inspiring workspace. We believe in work-life balance and provide flexible arrangements to support our team members' well-being. Join a firm where your voice matters and your contributions are recognized.",
      benefitsTitle: "Benefits & Perks",
      benefitsSubtitle: "We take care of our team",
      benefits: [
        { icon: TrendingUp, title: "Competitive Compensation", text: "Market-leading salaries and performance bonuses" },
        { icon: GraduationCap, title: "Professional Development", text: "Continuous learning opportunities and career advancement" },
        { icon: Clock, title: "Work-Life Balance", text: "Flexible schedules and hybrid work options" },
        { icon: Shield, title: "Health Benefits", text: "Comprehensive medical, dental, and vision coverage" },
        { icon: BookOpen, title: "Training Programs", text: "In-house training and external certification support" },
        { icon: HandHeart, title: "Mentorship", text: "Guidance from experienced partners and senior attorneys" },
      ],
      positionsTitle: "Open Positions",
      positionsSubtitle: "Explore current opportunities at our firm",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "We are seeking talented attorneys with 2-5 years of experience in corporate law, M&A, or commercial transactions to join our growing team.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Join our internship program and gain hands-on experience working alongside leading legal professionals in various practice areas.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Support our litigation team with legal research, document preparation, and case management in a fast-paced environment.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Internship Program",
      internshipSubtitle: "Launch your legal career with us",
      internshipOverviewTitle: "Program Overview",
      internshipOverviewText: "Our internship program is designed to provide law students with comprehensive, hands-on experience in one of Mexico's most prestigious law firms. Interns work directly with partners and senior associates on real cases and transactions, gaining invaluable practical knowledge.",
      internshipDurationTitle: "Duration & Requirements",
      internshipDuration: [
        "Program duration: 6-12 months",
        "Law students in their final years or recent graduates",
        "Strong academic record from accredited law schools",
        "Excellent written and verbal communication skills",
        "Proficiency in Spanish and English preferred",
      ],
      internshipLearningTitle: "What You'll Learn",
      internshipLearning: [
        "Legal research and analysis techniques",
        "Document drafting and review",
        "Client communication and relationship management",
        "Courtroom and arbitration procedures",
        "Corporate transactions and due diligence",
        "Professional ethics and best practices",
      ],
      applyTitle: "How to Apply",
      applySubtitle: "Take the first step towards your future with us",
      applyInstructions: "To apply for any position or our internship program, please send your CV, cover letter, and academic transcripts to:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Please include the position title in your email subject line. We review all applications carefully and will contact qualified candidates for interviews.",
      contactCardTitle: "Careers Contact",
      contactCardText: "Have questions about opportunities at Von Wobeser y Sierra?",
      sendApplication: "Send Application",
      viewDetails: "View Details",
      apply: "Apply Now",
    },
    es: {
      heroTitle: "Construye Tu Carrera Con Nosotros",
      heroSubtitle: "Únete a una de las firmas de abogados líderes en México y sé parte de un equipo que valora la excelencia, la integridad y el crecimiento profesional.",
      whyJoinTitle: "Por Qué Trabajar en Von Wobeser y Sierra",
      whyJoinSubtitle: "Descubre lo que nos hace un excelente lugar para trabajar",
      cultureTitle: "Nuestra Cultura",
      cultureText: "En Von Wobeser y Sierra, fomentamos un ambiente colaborativo e inclusivo donde cada miembro del equipo puede prosperar. Con más de 70 años de excelencia, combinamos tradición con innovación para brindar servicios legales excepcionales. Nuestra cultura enfatiza el trabajo en equipo, el respeto mutuo y el compromiso con los más altos estándares éticos.",
      valuesTitle: "Nuestros Valores Fundamentales",
      values: [
        { icon: Scale, title: "Excelencia", text: "Nos esforzamos por la más alta calidad en todo lo que hacemos" },
        { icon: Heart, title: "Integridad", text: "La conducta ética guía todas nuestras relaciones profesionales" },
        { icon: Users, title: "Colaboración", text: "Trabajamos juntos como un equipo unificado para lograr el éxito" },
        { icon: Lightbulb, title: "Innovación", text: "Adoptamos nuevas ideas y enfoques para resolver desafíos" },
      ],
      environmentTitle: "Ambiente de Trabajo",
      environmentText: "Nuestras oficinas modernas en Torre SOMA Chapultepec ofrecen un espacio de trabajo dinámico e inspirador. Creemos en el equilibrio entre vida y trabajo y proporcionamos arreglos flexibles para apoyar el bienestar de nuestro equipo. Únete a una firma donde tu voz importa y tus contribuciones son reconocidas.",
      benefitsTitle: "Beneficios y Prestaciones",
      benefitsSubtitle: "Cuidamos de nuestro equipo",
      benefits: [
        { icon: TrendingUp, title: "Compensación Competitiva", text: "Salarios líderes en el mercado y bonos por desempeño" },
        { icon: GraduationCap, title: "Desarrollo Profesional", text: "Oportunidades continuas de aprendizaje y avance profesional" },
        { icon: Clock, title: "Balance Vida-Trabajo", text: "Horarios flexibles y opciones de trabajo híbrido" },
        { icon: Shield, title: "Beneficios de Salud", text: "Cobertura médica, dental y de visión completa" },
        { icon: BookOpen, title: "Programas de Capacitación", text: "Capacitación interna y apoyo para certificaciones externas" },
        { icon: HandHeart, title: "Mentoría", text: "Guía de socios experimentados y abogados senior" },
      ],
      positionsTitle: "Posiciones Abiertas",
      positionsSubtitle: "Explora las oportunidades actuales en nuestra firma",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "We are seeking talented attorneys with 2-5 years of experience in corporate law, M&A, or commercial transactions to join our growing team.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Join our internship program and gain hands-on experience working alongside leading legal professionals in various practice areas.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Support our litigation team with legal research, document preparation, and case management in a fast-paced environment.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Programa de Pasantías",
      internshipSubtitle: "Inicia tu carrera legal con nosotros",
      internshipOverviewTitle: "Descripción del Programa",
      internshipOverviewText: "Nuestro programa de pasantías está diseñado para proporcionar a los estudiantes de derecho una experiencia práctica integral en una de las firmas de abogados más prestigiosas de México. Los pasantes trabajan directamente con socios y asociados senior en casos y transacciones reales, obteniendo un conocimiento práctico invaluable.",
      internshipDurationTitle: "Duración y Requisitos",
      internshipDuration: [
        "Duración del programa: 6-12 meses",
        "Estudiantes de derecho en sus últimos años o recién graduados",
        "Excelente expediente académico de escuelas de derecho acreditadas",
        "Excelentes habilidades de comunicación escrita y verbal",
        "Dominio del español e inglés preferido",
      ],
      internshipLearningTitle: "Lo Que Aprenderás",
      internshipLearning: [
        "Técnicas de investigación y análisis legal",
        "Redacción y revisión de documentos",
        "Comunicación con clientes y gestión de relaciones",
        "Procedimientos judiciales y de arbitraje",
        "Transacciones corporativas y due diligence",
        "Ética profesional y mejores prácticas",
      ],
      applyTitle: "Cómo Aplicar",
      applySubtitle: "Da el primer paso hacia tu futuro con nosotros",
      applyInstructions: "Para aplicar a cualquier posición o a nuestro programa de pasantías, por favor envía tu CV, carta de presentación y expediente académico a:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Por favor incluye el título del puesto en el asunto de tu correo electrónico. Revisamos todas las aplicaciones cuidadosamente y contactaremos a los candidatos calificados para entrevistas.",
      contactCardTitle: "Contacto de Carreras",
      contactCardText: "¿Tienes preguntas sobre oportunidades en Von Wobeser y Sierra?",
      sendApplication: "Enviar Solicitud",
      viewDetails: "Ver Detalles",
      apply: "Aplicar Ahora",
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-careers">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <section className="pt-32 pb-16 bg-primary" data-testid="section-careers-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-careers-title"
            >
              {t.heroTitle}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-3xl mx-auto mb-8"
              data-testid="text-careers-subtitle"
            >
              {t.heroSubtitle}
            </p>
            <Button 
              className="rounded-md"
              variant="secondary"
              size="lg"
              asChild
              data-testid="button-hero-apply"
            >
              <a href={`mailto:${t.applyEmail}`}>
                <Briefcase className="w-5 h-5 mr-2" />
                {t.apply}
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <main className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-20"
            data-testid="section-why-join"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white mb-4"
                data-testid="text-why-join-title"
              >
                {t.whyJoinTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.whyJoinSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-culture">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-gray-800 dark:text-white">
                    <Building2 className="w-6 h-6 text-primary" />
                    {t.cultureTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t.cultureText}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-environment">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-gray-800 dark:text-white">
                    <Target className="w-6 h-6 text-primary" />
                    {t.environmentTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t.environmentText}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" data-testid="card-values">
              <CardHeader>
                <CardTitle className="text-xl font-heading font-light text-gray-800 dark:text-white text-center">
                  {t.valuesTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {t.values.map((value, index) => (
                    <motion.div
                      key={index}
                      className="text-center"
                      variants={itemVariants}
                      data-testid={`card-value-${index}`}
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {value.text}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-benefits"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white mb-4"
                data-testid="text-benefits-title"
              >
                {t.benefitsTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.benefitsSubtitle}
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.benefits.map((benefit, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-md border border-gray-200 dark:border-gray-700 h-full"
                    data-testid={`card-benefit-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {benefit.text}
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-positions"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white mb-4"
                data-testid="text-positions-title"
              >
                {t.positionsTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.positionsSubtitle}
              </p>
            </div>

            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.positions.map((position, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-md border border-gray-200 dark:border-gray-700"
                    data-testid={`card-position-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                              {language === "es" ? position.titleEs : position.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {language === "es" ? position.typeEs : position.type}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {language === "es" ? position.departmentEs : position.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {language === "es" ? position.locationEs : position.location}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {language === "es" ? position.descriptionEs : position.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Button 
                            className="rounded-md w-full lg:w-auto"
                            asChild
                            data-testid={`button-apply-position-${index}`}
                          >
                            <a href={`mailto:reclutamiento@vonwobeser.com?subject=${encodeURIComponent(language === "es" ? position.titleEs : position.title)}`}>
                              {t.apply}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-internship"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white mb-4"
                data-testid="text-internship-title"
              >
                {t.internshipTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.internshipSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card 
                className="rounded-md border border-gray-200 dark:border-gray-700 lg:col-span-2"
                data-testid="card-internship-overview"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-gray-800 dark:text-white">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    {t.internshipOverviewTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    {t.internshipOverviewText}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {t.internshipDurationTitle}
                      </h4>
                      <ul className="space-y-2">
                        {t.internshipDuration.map((item, index) => (
                          <li 
                            key={index} 
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        {t.internshipLearningTitle}
                      </h4>
                      <ul className="space-y-2">
                        {t.internshipLearning.map((item, index) => (
                          <li 
                            key={index} 
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="rounded-md border border-gray-200 dark:border-gray-700 bg-primary text-white"
                data-testid="card-internship-cta"
              >
                <CardContent className="p-8 flex flex-col justify-center h-full">
                  <GraduationCap className="w-12 h-12 mb-6" />
                  <h3 className="text-xl font-heading font-light mb-4">
                    {language === "es" ? "¿Listo para comenzar?" : "Ready to get started?"}
                  </h3>
                  <p className="text-white/90 mb-6">
                    {language === "es" 
                      ? "Aplica a nuestro programa de pasantías y da el primer paso en tu carrera legal."
                      : "Apply to our internship program and take the first step in your legal career."
                    }
                  </p>
                  <Button 
                    variant="secondary"
                    className="rounded-md w-full"
                    asChild
                    data-testid="button-internship-apply"
                  >
                    <a href={`mailto:reclutamiento@vonwobeser.com?subject=${encodeURIComponent(language === "es" ? "Programa de Pasantías" : "Internship Program")}`}>
                      {t.apply}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
            data-testid="section-apply"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 
                  className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white mb-4"
                  data-testid="text-apply-title"
                >
                  {t.applyTitle}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  {t.applySubtitle}
                </p>
                <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" data-testid="card-apply-instructions">
                  <CardContent className="p-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {t.applyInstructions}
                    </p>
                    <a 
                      href={`mailto:${t.applyEmail}`}
                      className="inline-flex items-center gap-2 text-xl font-semibold text-primary hover:underline mb-4"
                      data-testid="link-apply-email"
                    >
                      <Mail className="w-5 h-5" />
                      {t.applyEmail}
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t.applyNote}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card 
                  className="rounded-md border border-gray-200 dark:border-gray-700 h-full"
                  data-testid="card-careers-contact"
                >
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-heading font-light text-gray-800 dark:text-white mb-2">
                      {t.contactCardTitle}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t.contactCardText}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Mail className="w-5 h-5 text-primary" />
                        <a 
                          href={`mailto:${t.applyEmail}`}
                          className="hover:text-primary transition-colors"
                          data-testid="link-contact-email"
                        >
                          {t.applyEmail}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>
                          {language === "es" ? "Ciudad de México" : "Mexico City"}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="rounded-md w-full mt-6"
                      asChild
                      data-testid="button-send-application"
                    >
                      <a href={`mailto:${t.applyEmail}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.sendApplication}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.section>

        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
