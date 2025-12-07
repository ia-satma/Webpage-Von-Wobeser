import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Heart, 
  Scale, 
  Users, 
  Globe2, 
  Building2, 
  HandHeart,
  Gavel,
  Shield,
  Handshake,
  Award,
  TrendingUp,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProBono() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Pro Bono",
      subtitle: "Committed to making justice accessible to all",
      commitmentTitle: "35+ Years of Pro Bono Commitment",
      commitmentText1: "Since 1989, Von Wobeser y Sierra has been at the forefront of pro bono legal services in Mexico. Our firm was among the first in the country to establish a formal pro bono program, reflecting our deep commitment to social responsibility and access to justice.",
      commitmentText2: "Our attorneys dedicate thousands of hours annually to pro bono matters, providing high-quality legal representation to individuals and organizations that could not otherwise afford it. This commitment is not just a program—it is a core value embedded in our firm's culture.",
      areasTitle: "Areas of Pro Bono Practice",
      areasSubtitle: "We focus our efforts where we can make the greatest impact",
      areas: [
        { 
          icon: Building2, 
          title: "NGO Support", 
          text: "We provide comprehensive legal advice to non-profit organizations, helping them with governance, compliance, tax matters, and operational challenges so they can focus on their mission."
        },
        { 
          icon: Shield, 
          title: "Human Rights", 
          text: "Our attorneys work on cases involving fundamental rights and liberties, collaborating with human rights organizations to protect vulnerable populations and advocate for systemic change."
        },
        { 
          icon: Gavel, 
          title: "Access to Justice", 
          text: "We represent individuals who cannot afford legal counsel in critical matters, ensuring that economic circumstances do not prevent anyone from receiving fair legal representation."
        },
        { 
          icon: HandHeart, 
          title: "Social Impact Organizations", 
          text: "We support foundations, charities, and social enterprises with legal structuring, contracts, and regulatory compliance to maximize their positive impact on society."
        },
        { 
          icon: BookOpen, 
          title: "Legal Education", 
          text: "Our attorneys participate in legal literacy programs, educating communities about their rights and how to navigate the legal system effectively."
        },
        { 
          icon: Globe2, 
          title: "Environmental Causes", 
          text: "We advise environmental organizations on regulatory matters, conservation initiatives, and sustainability projects that benefit communities and ecosystems."
        },
      ],
      statsTitle: "Our Pro Bono Impact",
      stats: [
        { value: "35+", label: "Years of Pro Bono Work" },
        { value: "5,000+", label: "Pro Bono Hours Annually" },
        { value: "100+", label: "Organizations Supported" },
        { value: "50+", label: "Attorneys Participating" },
      ],
      participationTitle: "How Our Lawyers Participate",
      participationSubtitle: "Every attorney at Von Wobeser y Sierra is encouraged to contribute",
      participationIntro: "Pro bono work is an integral part of professional development at our firm. We believe that giving back not only serves our community but also enriches our attorneys' skills and perspectives.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Dedicated Pro Bono Committee", 
          text: "A specialized committee coordinates our pro bono efforts, matching attorneys with matters that align with their expertise and interests while ensuring quality representation."
        },
        { 
          icon: Handshake, 
          title: "Strategic Partnerships", 
          text: "We collaborate with legal aid organizations, universities, and other law firms to maximize our collective impact and address complex challenges that require diverse expertise."
        },
        { 
          icon: Award, 
          title: "Recognition Program", 
          text: "We recognize and celebrate attorneys who make outstanding contributions to pro bono work, reinforcing its importance to our firm's culture and values."
        },
        { 
          icon: TrendingUp, 
          title: "Professional Development", 
          text: "Pro bono matters offer unique learning opportunities, allowing junior attorneys to handle significant responsibilities under the guidance of experienced mentors."
        },
      ],
      ctaTitle: "Partner With Us",
      ctaText: "If you represent a non-profit organization or know of a worthy cause that could benefit from pro bono legal assistance, we encourage you to reach out. Together, we can work toward a more just society.",
      contactButton: "Contact Us",
      learnMoreAbout: "Learn More About Our Firm",
    },
    es: {
      title: "Pro Bono",
      subtitle: "Comprometidos con hacer la justicia accesible para todos",
      commitmentTitle: "Más de 35 Años de Compromiso Pro Bono",
      commitmentText1: "Desde 1989, Von Wobeser y Sierra ha estado a la vanguardia de los servicios legales pro bono en México. Nuestra firma fue una de las primeras en el país en establecer un programa pro bono formal, reflejando nuestro profundo compromiso con la responsabilidad social y el acceso a la justicia.",
      commitmentText2: "Nuestros abogados dedican miles de horas anualmente a asuntos pro bono, brindando representación legal de alta calidad a individuos y organizaciones que de otro modo no podrían pagarla. Este compromiso no es solo un programa—es un valor fundamental arraigado en la cultura de nuestra firma.",
      areasTitle: "Áreas de Práctica Pro Bono",
      areasSubtitle: "Enfocamos nuestros esfuerzos donde podemos generar el mayor impacto",
      areas: [
        { 
          icon: Building2, 
          title: "Apoyo a ONGs", 
          text: "Brindamos asesoría legal integral a organizaciones sin fines de lucro, ayudándolas con gobernanza, cumplimiento, asuntos fiscales y desafíos operativos para que puedan enfocarse en su misión."
        },
        { 
          icon: Shield, 
          title: "Derechos Humanos", 
          text: "Nuestros abogados trabajan en casos que involucran derechos y libertades fundamentales, colaborando con organizaciones de derechos humanos para proteger a poblaciones vulnerables y abogar por cambios sistémicos."
        },
        { 
          icon: Gavel, 
          title: "Acceso a la Justicia", 
          text: "Representamos a individuos que no pueden pagar asesoría legal en asuntos críticos, asegurando que las circunstancias económicas no impidan a nadie recibir representación legal justa."
        },
        { 
          icon: HandHeart, 
          title: "Organizaciones de Impacto Social", 
          text: "Apoyamos a fundaciones, organizaciones benéficas y empresas sociales con estructuración legal, contratos y cumplimiento regulatorio para maximizar su impacto positivo en la sociedad."
        },
        { 
          icon: BookOpen, 
          title: "Educación Legal", 
          text: "Nuestros abogados participan en programas de alfabetización legal, educando a las comunidades sobre sus derechos y cómo navegar el sistema legal de manera efectiva."
        },
        { 
          icon: Globe2, 
          title: "Causas Ambientales", 
          text: "Asesoramos a organizaciones ambientales en asuntos regulatorios, iniciativas de conservación y proyectos de sostenibilidad que benefician a comunidades y ecosistemas."
        },
      ],
      statsTitle: "Nuestro Impacto Pro Bono",
      stats: [
        { value: "35+", label: "Años de Trabajo Pro Bono" },
        { value: "5,000+", label: "Horas Pro Bono Anuales" },
        { value: "100+", label: "Organizaciones Apoyadas" },
        { value: "50+", label: "Abogados Participantes" },
      ],
      participationTitle: "Cómo Participan Nuestros Abogados",
      participationSubtitle: "Cada abogado en Von Wobeser y Sierra está invitado a contribuir",
      participationIntro: "El trabajo pro bono es parte integral del desarrollo profesional en nuestra firma. Creemos que retribuir no solo sirve a nuestra comunidad sino que también enriquece las habilidades y perspectivas de nuestros abogados.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Comité Pro Bono Dedicado", 
          text: "Un comité especializado coordina nuestros esfuerzos pro bono, asignando abogados a asuntos que se alinean con su experiencia e intereses mientras asegura representación de calidad."
        },
        { 
          icon: Handshake, 
          title: "Alianzas Estratégicas", 
          text: "Colaboramos con organizaciones de asistencia legal, universidades y otras firmas de abogados para maximizar nuestro impacto colectivo y abordar desafíos complejos que requieren experiencia diversa."
        },
        { 
          icon: Award, 
          title: "Programa de Reconocimiento", 
          text: "Reconocemos y celebramos a los abogados que hacen contribuciones sobresalientes al trabajo pro bono, reforzando su importancia para la cultura y valores de nuestra firma."
        },
        { 
          icon: TrendingUp, 
          title: "Desarrollo Profesional", 
          text: "Los asuntos pro bono ofrecen oportunidades únicas de aprendizaje, permitiendo a los abogados junior manejar responsabilidades significativas bajo la guía de mentores experimentados."
        },
      ],
      ctaTitle: "Asóciese Con Nosotros",
      ctaText: "Si usted representa a una organización sin fines de lucro o conoce una causa valiosa que podría beneficiarse de asistencia legal pro bono, le invitamos a comunicarse con nosotros. Juntos, podemos trabajar hacia una sociedad más justa.",
      contactButton: "Contáctenos",
      learnMoreAbout: "Conozca Más Sobre Nuestra Firma",
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-pro-bono">
      <SEOHead page="proBono" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-pro-bono-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-pro-bono-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-pro-bono-subtitle"
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
            data-testid="section-commitment"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-6">
              {t.commitmentTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.commitmentText1}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.commitmentText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-20"
            data-testid="section-areas"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-4">
                {t.areasTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="text-areas-subtitle">
                {t.areasSubtitle}
              </p>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {t.areas.map((area, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid={`card-area-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <area.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {area.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20 bg-gray-50 dark:bg-gray-800 rounded-md p-10"
            data-testid="section-stats"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-8 text-center">
              {t.statsTitle}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {t.stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className="text-center" 
                  data-testid={`stat-${index}`}
                >
                  <p className="text-4xl lg:text-5xl font-heading text-primary mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-20"
            data-testid="section-participation"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-4">
                {t.participationTitle}
              </h2>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-participation-subtitle">
                {t.participationSubtitle}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto" data-testid="text-participation-intro">
                {t.participationIntro}
              </p>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.participationAspects.map((aspect, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid={`card-participation-${index}`}>
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
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
            data-testid="section-cta"
          >
            <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
              <CardContent className="p-10 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Scale className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white">
                    {t.ctaTitle}
                  </h2>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8" data-testid="text-cta-description">
                  {t.ctaText}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/contact">
                    <Button className="rounded-md" data-testid="button-contact">
                      <Heart className="w-4 h-4 mr-2" />
                      {t.contactButton}
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="outline" className="rounded-md" data-testid="button-learn-more">
                      {t.learnMoreAbout}
                      <ArrowRight className="w-4 h-4 ml-2" />
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
