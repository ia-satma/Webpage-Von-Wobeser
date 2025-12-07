import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Users,
  Heart,
  UserCheck,
  Target,
  TrendingUp,
  GraduationCap,
  Shield,
  BarChart3,
  UsersRound,
  HeartHandshake,
  Sparkles,
  Award,
  Scale,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DiversityInclusion() {
  const { language, displayLanguage } = useLanguage();

  const content = {
    en: {
      title: "Diversity & Inclusion",
      subtitle: "Building a more inclusive legal profession since 1986",
      foundingTitle: "Our Founding Commitment",
      foundingText1: "Since its founding in 1986, Von Wobeser y Sierra has been committed to creating an inclusive environment where talent thrives regardless of background, gender, or personal circumstances. This commitment was embedded in our firm's DNA from day one and continues to guide our practices today.",
      foundingText2: "We believe that diverse perspectives lead to better legal solutions. Our firm has consistently championed equality and inclusion, long before these became industry standards, recognizing that a diverse team is our greatest strength in serving clients with complex legal needs.",
      statsTitle: "Our Progress in Numbers",
      stats: [
        { value: "45%", label: "Women in the Firm", icon: UsersRound },
        { value: "35%", label: "Women Partners", icon: TrendingUp },
        { value: "50%", label: "Women in Leadership Roles", icon: Target },
        { value: "100%", label: "Equal Opportunity Commitment", icon: Shield },
      ],
      initiativesTitle: "Our Diversity Initiatives",
      initiativesSubtitle: "Concrete actions for a more equitable workplace",
      initiatives: [
        {
          icon: UserCheck,
          title: "Inclusive Hiring",
          text: "Our recruitment practices are designed to attract and evaluate candidates based solely on their skills, experience, and potential, ensuring equal opportunities for all regardless of gender, background, or personal circumstances.",
        },
        {
          icon: BarChart3,
          title: "Gender Equality",
          text: "We actively promote gender equality at all levels of the organization. Our programs support the advancement of women in leadership positions and ensure equitable compensation and growth opportunities.",
        },
        {
          icon: Sparkles,
          title: "Equal Opportunities",
          text: "Every team member has access to the same development resources, challenging assignments, and career advancement paths. We are committed to removing barriers and creating pathways for success for all.",
        },
        {
          icon: GraduationCap,
          title: "Mentorship Programs",
          text: "Our structured mentorship programs pair junior attorneys with experienced partners, fostering professional growth and ensuring that knowledge and opportunities are shared across all levels of our organization.",
        },
      ],
      proBonoTitle: "Diversity Through Pro Bono",
      proBonoText: "Our commitment to diversity extends beyond our firm walls. Through our pro bono practice, we provide legal services to underrepresented communities, support organizations fighting for equality, and contribute to access to justice initiatives that help level the playing field for all.",
      proBonoButton: "Learn About Our Pro Bono Work",
      commitmentTitle: "Our Ongoing Commitment",
      commitmentText: "Diversity and inclusion are not just policies at Von Wobeser y Sierra—they are core values that shape how we work, grow, and serve our clients. We continuously evaluate and improve our practices to ensure we remain at the forefront of creating a more equitable legal profession.",
      valuesTitle: "Inclusion Values",
      values: [
        { icon: Scale, title: "Equity", text: "Fair treatment and equal access to opportunities for all" },
        { icon: Heart, title: "Respect", text: "Honoring the dignity and unique contributions of every individual" },
        { icon: Users, title: "Belonging", text: "Creating a workplace where everyone feels valued and included" },
        { icon: Award, title: "Excellence", text: "Leveraging diverse perspectives to achieve the highest standards" },
      ],
      joinTitle: "Join Our Team",
      joinText: "Be part of a firm that values your unique perspective and supports your professional growth.",
      joinButton: "View Career Opportunities",
    },
    es: {
      title: "Diversidad e Inclusión",
      subtitle: "Construyendo una profesión legal más inclusiva desde 1986",
      foundingTitle: "Nuestro Compromiso Fundacional",
      foundingText1: "Desde su fundación en 1986, Von Wobeser y Sierra ha estado comprometido con crear un ambiente inclusivo donde el talento prospere sin importar antecedentes, género o circunstancias personales. Este compromiso fue incorporado en el ADN de nuestra firma desde el primer día y continúa guiando nuestras prácticas hoy.",
      foundingText2: "Creemos que las perspectivas diversas conducen a mejores soluciones legales. Nuestra firma ha defendido consistentemente la igualdad y la inclusión, mucho antes de que estos se convirtieran en estándares de la industria, reconociendo que un equipo diverso es nuestra mayor fortaleza para servir a clientes con necesidades legales complejas.",
      statsTitle: "Nuestro Progreso en Números",
      stats: [
        { value: "45%", label: "Mujeres en la Firma", icon: UsersRound },
        { value: "35%", label: "Mujeres Socias", icon: TrendingUp },
        { value: "50%", label: "Mujeres en Roles de Liderazgo", icon: Target },
        { value: "100%", label: "Compromiso con Igualdad de Oportunidades", icon: Shield },
      ],
      initiativesTitle: "Nuestras Iniciativas de Diversidad",
      initiativesSubtitle: "Acciones concretas para un lugar de trabajo más equitativo",
      initiatives: [
        {
          icon: UserCheck,
          title: "Contratación Inclusiva",
          text: "Nuestras prácticas de reclutamiento están diseñadas para atraer y evaluar candidatos basándose únicamente en sus habilidades, experiencia y potencial, asegurando igualdad de oportunidades para todos sin importar género, antecedentes o circunstancias personales.",
        },
        {
          icon: BarChart3,
          title: "Igualdad de Género",
          text: "Promovemos activamente la igualdad de género en todos los niveles de la organización. Nuestros programas apoyan el avance de mujeres en posiciones de liderazgo y aseguran compensación equitativa y oportunidades de crecimiento.",
        },
        {
          icon: Sparkles,
          title: "Igualdad de Oportunidades",
          text: "Cada miembro del equipo tiene acceso a los mismos recursos de desarrollo, asignaciones desafiantes y caminos de avance profesional. Estamos comprometidos a remover barreras y crear caminos hacia el éxito para todos.",
        },
        {
          icon: GraduationCap,
          title: "Programas de Mentoría",
          text: "Nuestros programas estructurados de mentoría emparejan a abogados junior con socios experimentados, fomentando el crecimiento profesional y asegurando que el conocimiento y las oportunidades se compartan en todos los niveles de nuestra organización.",
        },
      ],
      proBonoTitle: "Diversidad a Través del Pro Bono",
      proBonoText: "Nuestro compromiso con la diversidad se extiende más allá de las paredes de nuestra firma. A través de nuestra práctica pro bono, brindamos servicios legales a comunidades subrepresentadas, apoyamos organizaciones que luchan por la igualdad y contribuimos a iniciativas de acceso a la justicia que ayudan a nivelar el campo de juego para todos.",
      proBonoButton: "Conoce Nuestro Trabajo Pro Bono",
      commitmentTitle: "Nuestro Compromiso Continuo",
      commitmentText: "La diversidad e inclusión no son solo políticas en Von Wobeser y Sierra—son valores fundamentales que moldean cómo trabajamos, crecemos y servimos a nuestros clientes. Continuamente evaluamos y mejoramos nuestras prácticas para asegurar que estemos a la vanguardia en la creación de una profesión legal más equitativa.",
      valuesTitle: "Valores de Inclusión",
      values: [
        { icon: Scale, title: "Equidad", text: "Trato justo e igual acceso a oportunidades para todos" },
        { icon: Heart, title: "Respeto", text: "Honrar la dignidad y las contribuciones únicas de cada individuo" },
        { icon: Users, title: "Pertenencia", text: "Crear un lugar de trabajo donde todos se sientan valorados e incluidos" },
        { icon: Award, title: "Excelencia", text: "Aprovechar perspectivas diversas para alcanzar los más altos estándares" },
      ],
      joinTitle: "Únete a Nuestro Equipo",
      joinText: "Sé parte de una firma que valora tu perspectiva única y apoya tu crecimiento profesional.",
      joinButton: "Ver Oportunidades de Carrera",
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-diversity-inclusion">
      <SEOHead page="diversityInclusion" language={displayLanguage} />
      <Header />

      <section className="pt-32 pb-12 bg-[#AC162C]" data-testid="section-diversity-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <UsersRound className="w-10 h-10 text-white" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-diversity-title"
            >
              {t.title}
            </h1>
            <p
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-diversity-subtitle"
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
            data-testid="section-founding"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-6">
              {t.foundingTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.foundingText1}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.foundingText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mb-20"
            data-testid="section-stats"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-8 text-center">
              {t.statsTitle}
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center bg-gradient-to-br from-[#AC162C]/5 to-[#AC162C]/10 dark:from-[#AC162C]/10 dark:to-[#AC162C]/20 rounded-md p-6"
                  data-testid={`stat-diversity-${index}`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#AC162C]/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-[#AC162C]" />
                  </div>
                  <div className="text-4xl font-light text-[#AC162C] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-20"
            data-testid="section-values"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-8 text-center">
              {t.valuesTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.values.map((value, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700 text-center" data-testid={`card-value-${index}`}>
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-full bg-[#AC162C]/10 flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-7 h-7 text-[#AC162C]" />
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
            data-testid="section-initiatives"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-4">
                {t.initiativesTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="text-initiatives-subtitle">
                {t.initiativesSubtitle}
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.initiatives.map((initiative, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid={`card-initiative-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#AC162C]/10 flex items-center justify-center flex-shrink-0">
                          <initiative.icon className="w-6 h-6 text-[#AC162C]" />
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
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-20"
            data-testid="section-probono"
          >
            <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-[#AC162C]/5 to-[#AC162C]/10 dark:from-[#AC162C]/10 dark:to-[#AC162C]/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <HeartHandshake className="w-8 h-8 text-[#AC162C]" />
                  <h2 className="text-2xl font-heading font-light text-[#AC162C]">
                    {t.proBonoTitle}
                  </h2>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  {t.proBonoText}
                </p>
                <Link href="/about">
                  <Button
                    variant="outline"
                    className="border-[#AC162C] text-[#AC162C] hover:bg-[#AC162C] hover:text-white"
                    data-testid="button-probono-learn-more"
                  >
                    {t.proBonoButton}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20 text-center"
            data-testid="section-commitment"
          >
            <h2 className="text-3xl font-heading font-light text-[#AC162C] mb-6">
              {t.commitmentTitle}
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
              {t.commitmentText}
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="bg-[#AC162C] rounded-md p-10 text-center"
            data-testid="section-join"
          >
            <h2 className="text-3xl font-heading font-light text-white mb-4">
              {t.joinTitle}
            </h2>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              {t.joinText}
            </p>
            <Link href="/careers">
              <Button
                size="lg"
                className="bg-white text-[#AC162C] hover:bg-gray-100"
                data-testid="button-join-careers"
              >
                {t.joinButton}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
