import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Briefcase, 
  Clock, 
  Calendar,
  Target,
  Lightbulb,
  Users,
  Heart,
  BookOpen,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  Scale,
  HandHeart,
  Award,
  TrendingUp,
  Shield,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function Interns() {
  const { language, displayLanguage } = useLanguage();

  const content = {
    en: {
      heroTitle: "Internship Program",
      heroSubtitle: "Launch your legal career at one of Mexico's most prestigious law firms. Gain hands-on experience and develop essential skills alongside industry leaders.",
      applyNow: "Apply Now",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Program Overview",
      programOverviewSubtitle: "Two pathways to start your legal career",
      summerProgramTitle: "Summer Internship",
      summerProgramDescription: "Our summer internship program runs from June to August, offering law students an intensive experience during their academic break. Summer interns participate in ongoing matters across multiple practice areas, attend training sessions, and gain exposure to various aspects of legal practice.",
      summerProgramDuration: "Duration: 10-12 weeks (June - August)",
      permanentProgramTitle: "Permanent Internship",
      permanentProgramDescription: "Our permanent internship program is designed for law students in their final years who can dedicate part-time or full-time hours throughout the academic year. Permanent interns develop deeper expertise in specific practice areas and may transition to full-time associate positions upon graduation.",
      permanentProgramDuration: "Duration: 6-12 months (flexible schedule)",

      whatYouLearnTitle: "What You'll Learn",
      whatYouLearnSubtitle: "Comprehensive development for aspiring legal professionals",
      learningAreas: [
        { icon: Scale, title: "Work Dynamics", text: "Experience real-world legal work by supporting partners and associates on active matters. Learn how a top-tier law firm operates day-to-day." },
        { icon: Users, title: "Diversity & Inclusion", text: "Understand our commitment to D&I through training sessions and participation in firm initiatives. Experience a workplace where every voice matters." },
        { icon: BookOpen, title: "Legal Research", text: "Master legal research methodologies, case analysis, and the preparation of legal memoranda using cutting-edge tools and databases." },
        { icon: Briefcase, title: "Client Service", text: "Develop client-facing skills by participating in meetings, preparing client deliverables, and understanding relationship management." },
        { icon: Lightbulb, title: "Professional Ethics", text: "Learn the ethical standards and best practices that guide the legal profession in Mexico and internationally." },
        { icon: Building2, title: "Firm Culture", text: "Immerse yourself in our collaborative culture, network with attorneys at all levels, and build lasting professional relationships." },
      ],

      requirementsTitle: "Requirements",
      requirementsSubtitle: "What we look for in our interns",
      requirements: [
        "Currently enrolled in a law program at an accredited university",
        "Students in their 3rd year or higher preferred",
        "Strong academic record (minimum 8.5 GPA or equivalent)",
        "Excellent written and verbal communication skills in Spanish",
        "Proficiency in English (intermediate to advanced level preferred)",
        "Demonstrated interest in corporate law, litigation, or related fields",
        "Strong analytical and problem-solving abilities",
        "Availability for minimum 20 hours per week (permanent program)",
      ],

      applicationProcessTitle: "Application Process",
      applicationProcessSubtitle: "How to join our internship program",
      applicationSteps: [
        { step: "1", title: "Submit Application", text: "Send your CV, cover letter, academic transcripts, and two professional or academic references to our recruitment team." },
        { step: "2", title: "Initial Review", text: "Our HR team reviews all applications and selects candidates for the next stage based on qualifications and fit." },
        { step: "3", title: "Interview Process", text: "Selected candidates participate in interviews with HR and attorneys from relevant practice areas." },
        { step: "4", title: "Offer & Onboarding", text: "Successful candidates receive an offer and begin our comprehensive onboarding program." },
      ],

      benefitsTitle: "Benefits of Interning at Von Wobeser",
      benefitsSubtitle: "Invest in your future with us",
      benefits: [
        { icon: Award, title: "Prestigious Experience", text: "Add experience at a top-ranked Mexican law firm to your resume. Our reputation opens doors." },
        { icon: GraduationCap, title: "Mentorship Program", text: "Receive guidance from experienced attorneys who invest in your professional development." },
        { icon: TrendingUp, title: "Career Growth", text: "Many of our associates started as interns. Outstanding performers may receive full-time offers." },
        { icon: Shield, title: "Competitive Stipend", text: "Receive a competitive monthly stipend that recognizes the value of your contributions." },
        { icon: Users, title: "Professional Network", text: "Build connections with leading legal professionals, clients, and peers that last throughout your career." },
        { icon: HandHeart, title: "Flexible Arrangements", text: "We work with you to balance your internship with academic commitments." },
      ],

      ctaTitle: "Ready to Start Your Legal Career?",
      ctaSubtitle: "Take the first step towards joining one of Mexico's leading law firms",
      ctaInstructions: "Send your application materials to:",
      ctaNote: "Please include 'Internship Application - [Your Name]' in your email subject line. We review applications on a rolling basis and will contact qualified candidates for interviews.",
      sendApplication: "Send Application",
      viewCareers: "View All Careers",
      contactTitle: "Questions?",
      contactText: "Have questions about our internship program? Reach out to our recruitment team.",
    },
    es: {
      heroTitle: "Programa de Pasantes",
      heroSubtitle: "Inicia tu carrera legal en una de las firmas de abogados más prestigiosas de México. Obtén experiencia práctica y desarrolla habilidades esenciales junto a líderes de la industria.",
      applyNow: "Aplicar Ahora",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Descripción del Programa",
      programOverviewSubtitle: "Dos caminos para iniciar tu carrera legal",
      summerProgramTitle: "Pasantía de Verano",
      summerProgramDescription: "Nuestro programa de pasantías de verano se desarrolla de junio a agosto, ofreciendo a los estudiantes de derecho una experiencia intensiva durante su receso académico. Los pasantes de verano participan en asuntos activos en múltiples áreas de práctica, asisten a sesiones de capacitación y obtienen exposición a diversos aspectos de la práctica legal.",
      summerProgramDuration: "Duración: 10-12 semanas (junio - agosto)",
      permanentProgramTitle: "Pasantía Permanente",
      permanentProgramDescription: "Nuestro programa de pasantías permanentes está diseñado para estudiantes de derecho en sus últimos años que pueden dedicar horas parciales o completas durante el año académico. Los pasantes permanentes desarrollan experiencia más profunda en áreas de práctica específicas y pueden transitar a posiciones de tiempo completo como asociados al graduarse.",
      permanentProgramDuration: "Duración: 6-12 meses (horario flexible)",

      whatYouLearnTitle: "Lo Que Aprenderás",
      whatYouLearnSubtitle: "Desarrollo integral para futuros profesionales legales",
      learningAreas: [
        { icon: Scale, title: "Dinámica de Trabajo", text: "Experimenta el trabajo legal real apoyando a socios y asociados en asuntos activos. Aprende cómo opera una firma de primer nivel día a día." },
        { icon: Users, title: "Diversidad e Inclusión", text: "Comprende nuestro compromiso con D&I a través de sesiones de capacitación y participación en iniciativas de la firma. Experimenta un lugar de trabajo donde cada voz importa." },
        { icon: BookOpen, title: "Investigación Legal", text: "Domina metodologías de investigación legal, análisis de casos y preparación de memorándums legales usando herramientas y bases de datos de vanguardia." },
        { icon: Briefcase, title: "Servicio al Cliente", text: "Desarrolla habilidades de cara al cliente participando en reuniones, preparando entregables y entendiendo la gestión de relaciones." },
        { icon: Lightbulb, title: "Ética Profesional", text: "Aprende los estándares éticos y mejores prácticas que guían la profesión legal en México e internacionalmente." },
        { icon: Building2, title: "Cultura de la Firma", text: "Sumérgete en nuestra cultura colaborativa, establece contactos con abogados de todos los niveles y construye relaciones profesionales duraderas." },
      ],

      requirementsTitle: "Requisitos",
      requirementsSubtitle: "Lo que buscamos en nuestros pasantes",
      requirements: [
        "Actualmente inscrito en un programa de derecho en una universidad acreditada",
        "Se prefieren estudiantes de 3er año o superior",
        "Excelente expediente académico (mínimo 8.5 de promedio o equivalente)",
        "Excelentes habilidades de comunicación escrita y verbal en español",
        "Dominio del inglés (nivel intermedio a avanzado preferido)",
        "Interés demostrado en derecho corporativo, litigio o campos relacionados",
        "Fuertes habilidades analíticas y de resolución de problemas",
        "Disponibilidad mínima de 20 horas por semana (programa permanente)",
      ],

      applicationProcessTitle: "Proceso de Aplicación",
      applicationProcessSubtitle: "Cómo unirte a nuestro programa de pasantías",
      applicationSteps: [
        { step: "1", title: "Enviar Solicitud", text: "Envía tu CV, carta de presentación, expediente académico y dos referencias profesionales o académicas a nuestro equipo de reclutamiento." },
        { step: "2", title: "Revisión Inicial", text: "Nuestro equipo de RH revisa todas las solicitudes y selecciona candidatos para la siguiente etapa basándose en calificaciones y compatibilidad." },
        { step: "3", title: "Proceso de Entrevistas", text: "Los candidatos seleccionados participan en entrevistas con RH y abogados de las áreas de práctica relevantes." },
        { step: "4", title: "Oferta e Inducción", text: "Los candidatos exitosos reciben una oferta y comienzan nuestro programa integral de inducción." },
      ],

      benefitsTitle: "Beneficios de una Pasantía en Von Wobeser",
      benefitsSubtitle: "Invierte en tu futuro con nosotros",
      benefits: [
        { icon: Award, title: "Experiencia Prestigiosa", text: "Agrega experiencia en una firma mexicana de primer nivel a tu currículum. Nuestra reputación abre puertas." },
        { icon: GraduationCap, title: "Programa de Mentoría", text: "Recibe orientación de abogados experimentados que invierten en tu desarrollo profesional." },
        { icon: TrendingUp, title: "Crecimiento Profesional", text: "Muchos de nuestros asociados comenzaron como pasantes. Los mejores desempeños pueden recibir ofertas de tiempo completo." },
        { icon: Shield, title: "Beca Competitiva", text: "Recibe una beca mensual competitiva que reconoce el valor de tus contribuciones." },
        { icon: Users, title: "Red Profesional", text: "Construye conexiones con profesionales legales líderes, clientes y colegas que duran toda tu carrera." },
        { icon: HandHeart, title: "Arreglos Flexibles", text: "Trabajamos contigo para equilibrar tu pasantía con compromisos académicos." },
      ],

      ctaTitle: "¿Listo para Iniciar tu Carrera Legal?",
      ctaSubtitle: "Da el primer paso para unirte a una de las firmas de abogados líderes de México",
      ctaInstructions: "Envía tus materiales de aplicación a:",
      ctaNote: "Por favor incluye 'Solicitud de Pasantía - [Tu Nombre]' en el asunto del correo. Revisamos solicitudes de manera continua y contactaremos a los candidatos calificados para entrevistas.",
      sendApplication: "Enviar Solicitud",
      viewCareers: "Ver Todas las Carreras",
      contactTitle: "¿Preguntas?",
      contactText: "¿Tienes preguntas sobre nuestro programa de pasantías? Contacta a nuestro equipo de reclutamiento.",
    },
  };

  const t = content[displayLanguage];

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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-interns">
      <SEOHead page="interns" language={displayLanguage} />
      <Header />
      
      <section className="pt-32 pb-16 bg-primary" data-testid="section-interns-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-interns-title"
            >
              {t.heroTitle}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-3xl mx-auto mb-8"
              data-testid="text-interns-subtitle"
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
              <a href={`mailto:${t.applyEmail}?subject=Internship Application`}>
                <GraduationCap className="w-5 h-5 mr-2" />
                {t.applyNow}
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-20"
            data-testid="section-program-overview"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] mb-4"
                data-testid="text-program-overview-title"
              >
                {t.programOverviewTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.programOverviewSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-summer-program">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-gray-800 dark:text-white">
                    <Calendar className="w-6 h-6 text-primary" />
                    {t.summerProgramTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {t.summerProgramDescription}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {t.summerProgramDuration}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-permanent-program">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-gray-800 dark:text-white">
                    <Briefcase className="w-6 h-6 text-primary" />
                    {t.permanentProgramTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {t.permanentProgramDescription}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {t.permanentProgramDuration}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-what-you-learn"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] mb-4"
                data-testid="text-what-you-learn-title"
              >
                {t.whatYouLearnTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.whatYouLearnSubtitle}
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.learningAreas.map((area, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-md border border-gray-200 dark:border-gray-700 h-full"
                    data-testid={`card-learning-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <area.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            {area.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {area.text}
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
            data-testid="section-requirements"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] mb-4"
                data-testid="text-requirements-title"
              >
                {t.requirementsTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.requirementsSubtitle}
              </p>
            </div>

            <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" data-testid="card-requirements">
              <CardContent className="p-8">
                <motion.ul 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {t.requirements.map((requirement, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-3"
                      variants={itemVariants}
                      data-testid={`requirement-${index}`}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-application-process"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] mb-4"
                data-testid="text-application-process-title"
              >
                {t.applicationProcessTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.applicationProcessSubtitle}
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.applicationSteps.map((step, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-md border border-gray-200 dark:border-gray-700 h-full text-center"
                    data-testid={`card-step-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                        {step.step}
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.text}
                      </p>
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
            data-testid="section-benefits"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] mb-4"
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
            className="mb-12"
            data-testid="section-cta"
          >
            <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-primary text-white overflow-hidden">
              <CardContent className="p-8 lg:p-12 text-center">
                <h2 
                  className="text-2xl md:text-3xl font-heading font-light mb-4"
                  data-testid="text-cta-title"
                >
                  {t.ctaTitle}
                </h2>
                <p className="text-lg text-white/90 max-w-2xl mx-auto mb-6">
                  {t.ctaSubtitle}
                </p>
                <p className="text-white/80 mb-2">
                  {t.ctaInstructions}
                </p>
                <p className="text-xl font-semibold mb-6">
                  {t.applyEmail}
                </p>
                <p className="text-sm text-white/70 max-w-2xl mx-auto mb-8">
                  {t.ctaNote}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="secondary"
                    size="lg"
                    className="rounded-md"
                    asChild
                    data-testid="button-cta-apply"
                  >
                    <a href={`mailto:${t.applyEmail}?subject=Internship Application`}>
                      <Mail className="w-5 h-5 mr-2" />
                      {t.sendApplication}
                    </a>
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    className="rounded-md bg-white/10 border-white/20 text-white hover:bg-white/20"
                    asChild
                    data-testid="button-view-careers"
                  >
                    <Link href="/careers">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      {t.viewCareers}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            data-testid="section-contact"
          >
            <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-contact">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                    {t.contactTitle}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.contactText}
                  </p>
                </div>
                <Button 
                  className="rounded-md whitespace-nowrap"
                  asChild
                  data-testid="button-contact-email"
                >
                  <a href={`mailto:${t.applyEmail}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.applyEmail}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
