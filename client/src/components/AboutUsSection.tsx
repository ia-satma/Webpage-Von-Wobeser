import { motion } from "framer-motion";
import { Eye, Target, Shield, Award, Heart, Zap, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";

/**
 * AboutUsSection — bloque Visión / Misión / Valores del home viejo (mirror).
 *
 * Contenido bilingüe estático EN/ES. Cada valor trae `name`/`nameEs` y
 * `desc`/`descEs`; el idioma se resuelve con getDisplayValue (es → *Es||base,
 * en → base||*Es), igual que el resto del contenido data-driven del sitio.
 */

interface ValueItem {
  name: string;
  nameEs: string;
  desc: string;
  descEs: string;
  icon: React.ElementType;
}

const values: ValueItem[] = [
  {
    name: "Integrity",
    nameEs: "Integridad",
    desc: "We act with honesty and transparency at every step.",
    descEs: "Actuamos con honestidad y transparencia en todo momento.",
    icon: Shield,
  },
  {
    name: "Excellence",
    nameEs: "Excelencia",
    desc: "We pursue the highest quality in every service we deliver.",
    descEs: "Buscamos la más alta calidad en cada servicio que ofrecemos.",
    icon: Award,
  },
  {
    name: "Commitment",
    nameEs: "Compromiso",
    desc: "We dedicate ourselves fully to our clients' success.",
    descEs: "Nos dedicamos al éxito de nuestros clientes sin reservas.",
    icon: Heart,
  },
  {
    name: "Agility",
    nameEs: "Agilidad",
    desc: "We respond swiftly and effectively to every situation.",
    descEs: "Respondemos con rapidez y eficacia ante cualquier situación.",
    icon: Zap,
  },
  {
    name: "Diversity",
    nameEs: "Diversidad",
    desc: "We value every perspective to enrich our work together.",
    descEs: "Valoramos cada perspectiva para enriquecer nuestro trabajo.",
    icon: Globe,
  },
];

interface AboutUsContent {
  eyebrow: string;
  sectionTitle: string;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionText: string;
  valuesTitle: string;
}

const content: Record<string, AboutUsContent> = {
  en: {
    eyebrow: "ABOUT US",
    sectionTitle: "ABOUT US",
    visionTitle: "Vision",
    visionText: "To be the leading law firm in Mexico, recognized for delivering exceptional legal services, fostering talent, and making a positive impact in our community.",
    missionTitle: "Mission",
    missionText: "To provide our clients with the highest quality legal counsel, combining deep expertise with innovative solutions and an unwavering commitment to their success.",
    valuesTitle: "Our Values",
  },
  es: {
    eyebrow: "ACERCA DE NOSOTROS",
    sectionTitle: "ACERCA DE NOSOTROS",
    visionTitle: "Visión",
    visionText: "Ser la firma de abogados líder en México, reconocida por brindar servicios legales excepcionales, fomentar el talento y generar un impacto positivo en nuestra comunidad.",
    missionTitle: "Misión",
    missionText: "Proporcionar a nuestros clientes asesoría legal de la más alta calidad, combinando profunda experiencia con soluciones innovadoras y un compromiso inquebrantable con su éxito.",
    valuesTitle: "Nuestros Valores",
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const valueVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function AboutUsSection() {
  const { language } = useLanguage();
  const t = content[language] || content.es;

  const featureCards = [
    { icon: Eye, title: t.visionTitle, text: t.visionText, testId: "subsection-vision" },
    { icon: Target, title: t.missionTitle, text: t.missionText, testId: "subsection-mission" },
  ];

  return (
    <section
      id="about-us"
      className="py-20 lg:py-28 bg-background"
      data-testid="section-about-us"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p
            className="text-primary text-[10px] tracking-[0.28em] uppercase mb-4"
            data-testid="text-about-us-eyebrow"
          >
            {t.eyebrow}
          </p>
          <h2
            className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight mb-5"
            data-testid="text-about-us-title"
          >
            {t.sectionTitle}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-px bg-primary" />
            <div className="w-2 h-2 bg-primary rotate-45" />
            <div className="w-10 h-px bg-primary" />
          </div>
        </motion.div>

        {/* Vision + Mission feature cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-16"
        >
          {featureCards.map(({ icon: Icon, title, text, testId }) => (
            <motion.div
              key={testId}
              variants={cardVariants}
              className="group bg-card border border-border rounded-none p-8 lg:p-10 flex flex-col gap-6"
              data-testid={testId}
            >
              {/* Icon circle */}
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col justify-center pt-1">
                  <div className="w-6 h-px bg-primary mb-2" />
                  <h3
                    className="font-heading font-light uppercase tracking-[0.12em] text-base lg:text-lg text-foreground"
                    data-testid={`text-${testId}-title`}
                  >
                    {title}
                  </h3>
                </div>
              </div>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                data-testid={`text-${testId}-content`}
              >
                {text}
              </p>
              {/* Bottom accent */}
              <div className="mt-auto pt-4 border-t border-border">
                <div className="w-8 h-0.5 bg-primary/40 group-hover:w-16 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
          data-testid="subsection-values"
        >
          <div className="w-6 h-px bg-primary mb-4 mx-auto" />
          <h3
            className="font-heading font-light uppercase tracking-[0.12em] text-base lg:text-lg text-foreground"
            data-testid="text-values-title"
          >
            {t.valuesTitle}
          </h3>
        </motion.div>

        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-6"
          data-testid="values-grid"
        >
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.name}
                custom={i}
                variants={valueVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0 } }}
                className="group relative bg-[#1a1a19] dark:bg-card rounded-none p-8 flex flex-col items-center text-center gap-4 overflow-visible cursor-default"
                data-testid={`value-item-${i}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary group-hover:h-1.5 transition-all duration-300" />
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mt-2 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </div>
                <div className="w-5 h-px bg-primary/40 group-hover:w-8 transition-all duration-500" />
                <span
                  className="text-xs md:text-sm font-medium uppercase tracking-[0.12em] text-white/90 dark:text-foreground leading-tight"
                  data-testid={`text-value-${i}`}
                >
                  {getDisplayValue(value, "name", language)}
                </span>
                <p
                  className="text-xs text-white/60 dark:text-muted-foreground leading-relaxed"
                  data-testid={`text-value-desc-${i}`}
                >
                  {getDisplayValue(value, "desc", language)}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
