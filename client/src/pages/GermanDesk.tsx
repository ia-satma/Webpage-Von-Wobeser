import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Globe2, 
  Building2, 
  Briefcase, 
  ArrowRight,
  Users,
  Scale,
  Car,
  Pill,
  Zap,
  Handshake,
  GraduationCap,
  Award,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GermanDesk() {
  const { language, displayLanguage } = useLanguage();

  const content = {
    en: {
      title: "German Desk",
      subtitle: "Your trusted legal partner for German and Austrian businesses in Mexico",
      experienceTitle: "Over 34 Years of Experience",
      experienceText1: "For more than 34 years, Von Wobeser y Sierra has been the trusted legal advisor for German and Austrian companies establishing and expanding their operations in Mexico. Our German Desk provides specialized legal services tailored to the unique needs of German-speaking clients.",
      experienceText2: "We understand the business culture, legal expectations, and communication preferences of German and Austrian companies. This deep understanding, combined with our expertise in Mexican law, positions us as the ideal bridge between European business practices and the Mexican legal landscape.",
      teamTitle: "Our German-Speaking Team",
      teamSubtitle: "Attorneys with roots in Germany and Austria",
      teamIntro: "Our German Desk is staffed by attorneys who have received their legal education in Germany and Austria, bringing authentic insight into European legal frameworks and business practices. This bilingual and bicultural expertise ensures seamless communication and culturally informed legal counsel.",
      teamHighlights: [
        { 
          icon: GraduationCap, 
          title: "German & Austrian Legal Education", 
          text: "Our attorneys have studied law in Germany and Austria, providing firsthand knowledge of European legal principles and practices."
        },
        { 
          icon: Globe2, 
          title: "Bilingual Communication", 
          text: "Fluent in German, English, and Spanish, our team ensures clear and precise communication at every stage of your legal matters."
        },
        { 
          icon: Handshake, 
          title: "Cultural Understanding", 
          text: "We bridge the gap between German business culture and Mexican legal practice, ensuring your expectations are met with precision and professionalism."
        },
        { 
          icon: Award, 
          title: "Recognized Excellence", 
          text: "Our German Desk has been recognized by leading legal directories for its outstanding service to German and Austrian clients."
        },
      ],
      servicesTitle: "Core Practice Areas",
      servicesSubtitle: "Comprehensive legal solutions for your business in Mexico",
      services: [
        { icon: Building2, title: "Corporate & M&A", text: "Formation, restructuring, mergers, acquisitions, and corporate governance for your Mexican operations." },
        { icon: Briefcase, title: "Foreign Investment", text: "Regulatory compliance, investment structuring, and market entry strategies for German and Austrian investors." },
        { icon: Car, title: "Automotive Industry", text: "Specialized counsel for the automotive sector, including supply chain, manufacturing, and distribution agreements." },
        { icon: Pill, title: "Pharmaceutical & Healthcare", text: "Regulatory matters, licensing, and commercial transactions in the pharmaceutical and healthcare industries." },
        { icon: Zap, title: "Energy & Infrastructure", text: "Legal support for energy projects, infrastructure investments, and regulatory compliance." },
        { icon: Scale, title: "Commercial Litigation", text: "Dispute resolution, arbitration, and litigation services to protect your business interests in Mexico." },
      ],
      differentiatorTitle: "Why Choose Our German Desk?",
      differentiatorSubtitle: "Cultural understanding as our key differentiator",
      differentiatorIntro: "What sets our German Desk apart is our genuine understanding of German and Austrian business culture. We don't just speak your language—we understand your expectations for precision, thoroughness, and reliability. Our attorneys anticipate your needs and deliver legal services that align with the high standards you expect.",
      differentiatorPoints: [
        { icon: Clock, title: "Punctuality & Reliability", text: "We respect your time and deliver on our commitments with German precision." },
        { icon: Users, title: "Direct Communication", text: "Clear, straightforward communication without unnecessary complexity or delays." },
        { icon: Scale, title: "Thoroughness", text: "Comprehensive analysis and attention to detail in every matter we handle." },
        { icon: MapPin, title: "Local Expertise", text: "Deep knowledge of Mexican law combined with understanding of your home legal system." },
      ],
      statsTitle: "German Desk by the Numbers",
      stats: [
        { value: "34+", label: "Years of Experience" },
        { value: "100+", label: "German & Austrian Clients Served" },
        { value: "5", label: "German-Speaking Attorneys" },
        { value: "Band 1", label: "Chambers Latin America Ranking" },
      ],
      ctaTitle: "Partner with Us",
      ctaText: "Discover how our German Desk can support your business objectives in Mexico. Contact our team for a consultation.",
      viewPractice: "View German Desk Practice",
      contactUs: "Contact Us",
      learnMore: "Learn More",
    },
    es: {
      title: "German Desk",
      subtitle: "Su socio legal de confianza para empresas alemanas y austriacas en México",
      experienceTitle: "Más de 34 Años de Experiencia",
      experienceText1: "Durante más de 34 años, Von Wobeser y Sierra ha sido el asesor legal de confianza para empresas alemanas y austriacas que establecen y expanden sus operaciones en México. Nuestro German Desk proporciona servicios legales especializados adaptados a las necesidades únicas de clientes de habla alemana.",
      experienceText2: "Entendemos la cultura empresarial, las expectativas legales y las preferencias de comunicación de las empresas alemanas y austriacas. Esta profunda comprensión, combinada con nuestra experiencia en derecho mexicano, nos posiciona como el puente ideal entre las prácticas comerciales europeas y el panorama legal mexicano.",
      teamTitle: "Nuestro Equipo de Habla Alemana",
      teamSubtitle: "Abogados con raíces en Alemania y Austria",
      teamIntro: "Nuestro German Desk cuenta con abogados que han recibido su educación legal en Alemania y Austria, aportando una visión auténtica de los marcos legales y prácticas comerciales europeas. Esta experiencia bilingüe y bicultural garantiza una comunicación fluida y un asesoramiento legal culturalmente informado.",
      teamHighlights: [
        { 
          icon: GraduationCap, 
          title: "Educación Legal Alemana y Austriaca", 
          text: "Nuestros abogados han estudiado derecho en Alemania y Austria, proporcionando conocimiento de primera mano de los principios y prácticas legales europeos."
        },
        { 
          icon: Globe2, 
          title: "Comunicación Bilingüe", 
          text: "Fluidos en alemán, inglés y español, nuestro equipo asegura una comunicación clara y precisa en cada etapa de sus asuntos legales."
        },
        { 
          icon: Handshake, 
          title: "Entendimiento Cultural", 
          text: "Cerramos la brecha entre la cultura empresarial alemana y la práctica legal mexicana, asegurando que sus expectativas se cumplan con precisión y profesionalismo."
        },
        { 
          icon: Award, 
          title: "Excelencia Reconocida", 
          text: "Nuestro German Desk ha sido reconocido por los principales directorios legales por su destacado servicio a clientes alemanes y austriacos."
        },
      ],
      servicesTitle: "Áreas de Práctica Principales",
      servicesSubtitle: "Soluciones legales integrales para su negocio en México",
      services: [
        { icon: Building2, title: "Corporativo y M&A", text: "Constitución, reestructuración, fusiones, adquisiciones y gobierno corporativo para sus operaciones en México." },
        { icon: Briefcase, title: "Inversión Extranjera", text: "Cumplimiento regulatorio, estructuración de inversiones y estrategias de entrada al mercado para inversionistas alemanes y austriacos." },
        { icon: Car, title: "Industria Automotriz", text: "Asesoría especializada para el sector automotriz, incluyendo cadena de suministro, manufactura y acuerdos de distribución." },
        { icon: Pill, title: "Farmacéutico y Salud", text: "Asuntos regulatorios, licencias y transacciones comerciales en las industrias farmacéutica y de salud." },
        { icon: Zap, title: "Energía e Infraestructura", text: "Apoyo legal para proyectos de energía, inversiones en infraestructura y cumplimiento regulatorio." },
        { icon: Scale, title: "Litigio Comercial", text: "Resolución de disputas, arbitraje y servicios de litigio para proteger sus intereses comerciales en México." },
      ],
      differentiatorTitle: "¿Por Qué Elegir Nuestro German Desk?",
      differentiatorSubtitle: "El entendimiento cultural como nuestro diferenciador clave",
      differentiatorIntro: "Lo que distingue a nuestro German Desk es nuestra genuina comprensión de la cultura empresarial alemana y austriaca. No solo hablamos su idioma—entendemos sus expectativas de precisión, minuciosidad y confiabilidad. Nuestros abogados anticipan sus necesidades y entregan servicios legales que se alinean con los altos estándares que usted espera.",
      differentiatorPoints: [
        { icon: Clock, title: "Puntualidad y Confiabilidad", text: "Respetamos su tiempo y cumplimos nuestros compromisos con precisión alemana." },
        { icon: Users, title: "Comunicación Directa", text: "Comunicación clara y directa sin complejidad ni retrasos innecesarios." },
        { icon: Scale, title: "Minuciosidad", text: "Análisis integral y atención al detalle en cada asunto que manejamos." },
        { icon: MapPin, title: "Experiencia Local", text: "Profundo conocimiento del derecho mexicano combinado con entendimiento de su sistema legal de origen." },
      ],
      statsTitle: "German Desk en Números",
      stats: [
        { value: "34+", label: "Años de Experiencia" },
        { value: "100+", label: "Clientes Alemanes y Austriacos Atendidos" },
        { value: "5", label: "Abogados de Habla Alemana" },
        { value: "Banda 1", label: "Ranking Chambers Latin America" },
      ],
      ctaTitle: "Asóciese con Nosotros",
      ctaText: "Descubra cómo nuestro German Desk puede apoyar sus objetivos de negocio en México. Contacte a nuestro equipo para una consulta.",
      viewPractice: "Ver Práctica German Desk",
      contactUs: "Contáctenos",
      learnMore: "Conocer Más",
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-german-desk">
      <SEOHead page="germanDesk" language={displayLanguage} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-german-desk-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-german-desk-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-german-desk-subtitle"
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
            data-testid="section-experience"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-6" data-testid="text-experience-title">
              {t.experienceTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-experience-1">
                {t.experienceText1}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-experience-2">
                {t.experienceText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-20"
            data-testid="section-team"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-4" data-testid="text-team-title">
                {t.teamTitle}
              </h2>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-team-subtitle">
                {t.teamSubtitle}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto" data-testid="text-team-intro">
                {t.teamIntro}
              </p>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.teamHighlights.map((highlight, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid={`card-team-highlight-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <highlight.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {highlight.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {highlight.text}
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
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-20"
            data-testid="section-services"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-4" data-testid="text-services-title">
                {t.servicesTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="text-services-subtitle">
                {t.servicesSubtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.services.map((service, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700 text-center" data-testid={`card-service-${index}`}>
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <service.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {service.text}
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
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-md p-10"
            data-testid="section-differentiator"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Handshake className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-heading font-light text-[#AC162C]" data-testid="text-differentiator-title">
                  {t.differentiatorTitle}
                </h2>
              </div>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-differentiator-subtitle">
                {t.differentiatorSubtitle}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto" data-testid="text-differentiator-intro">
                {t.differentiatorIntro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.differentiatorPoints.map((point, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className="text-center bg-white dark:bg-gray-800 rounded-md p-6 shadow-sm"
                  data-testid={`card-differentiator-${index}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <point.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {point.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {point.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20"
            data-testid="section-stats"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-8 text-center" data-testid="text-stats-title">
              {t.statsTitle}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                  data-testid={`stat-german-desk-${index}`}
                >
                  <div className="text-4xl md:text-5xl font-light text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mb-10"
            data-testid="section-cta"
          >
            <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-heading font-light text-[#AC162C] mb-4" data-testid="text-cta-title">
                  {t.ctaTitle}
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
                  {t.ctaText}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/practice-groups/german-desk">
                    <Button size="lg" className="gap-2" data-testid="button-view-practice">
                      {t.viewPractice}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="gap-2" data-testid="button-contact-us">
                      {t.contactUs}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
