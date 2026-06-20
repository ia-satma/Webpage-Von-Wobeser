import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";
import officePhoto from "@assets/collage_06.jpg";

type Pillar = { label: string; desc: string };

type ContentItem = {
  eyebrow: string;
  title: string;
  text: string;
  buttonText: string;
  pillars: Pillar[];
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    eyebrow: "OUR COMMITMENT",
    title: "DIVERSITY & INCLUSION",
    text: "At Von Wobeser y Sierra, we believe that diversity is a source of strength and innovation. We are committed to creating an inclusive environment where all individuals can thrive and contribute their unique perspectives to our practice.",
    buttonText: "SEE MORE",
    pillars: [
      { label: "Gender Parity", desc: "Equal opportunities for all talent, at every level of the firm." },
      { label: "Inclusive Culture", desc: "An environment where every voice is heard and valued." },
      { label: "Diverse Perspectives", desc: "Different viewpoints that enrich and strengthen our practice." },
    ],
  },
  es: {
    eyebrow: "NUESTRO COMPROMISO",
    title: "DIVERSIDAD E INCLUSIÓN",
    text: "En Von Wobeser y Sierra, creemos que la diversidad es fuente de fortaleza e innovación. Estamos comprometidos a crear un entorno inclusivo donde todos los individuos puedan prosperar y contribuir con sus perspectivas únicas a nuestra práctica.",
    buttonText: "VER MÁS",
    pillars: [
      { label: "Paridad de Género", desc: "Igualdad de oportunidades para todo el talento, en todos los niveles." },
      { label: "Cultura Inclusiva", desc: "Un entorno donde cada voz es escuchada y valorada." },
      { label: "Perspectivas Diversas", desc: "Distintas miradas que enriquecen y fortalecen nuestra práctica." },
    ],
  },
};

const pillarVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const pillarItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DiversityInclusionSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      className="bg-muted border-t border-border overflow-hidden"
      data-testid="section-diversity-inclusion"
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[400px]">

        {/* Photo panel — mobile: top banner h-[220px], desktop: left 40% */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[220px] lg:h-auto lg:w-2/5 shrink-0 overflow-hidden"
          data-testid="panel-diversity-photo"
        >
          {/* Photo */}
          <img
            src={officePhoto}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center grayscale"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Red tint gradient from bottom */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(170,26,46,0.45) 0%, rgba(170,26,46,0.1) 50%, transparent 100%)" }}
          />
          {/* Title on photo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-8 h-px bg-white/60 mb-4" />
            <h2
              className="font-heading font-light text-2xl lg:text-3xl xl:text-4xl text-white uppercase tracking-[0.12em] leading-tight"
              data-testid="text-diversity-inclusion-title"
            >
              {t.title}
            </h2>
            <div className="w-8 h-px bg-primary/80 mt-4" />
          </div>
        </motion.div>

        {/* Content panel — desktop: right 60% */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-12 lg:py-14 lg:w-3/5">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6"
          >
            <div className="w-8 h-px bg-primary mb-5" />
            <p
              className="text-primary text-[10px] tracking-[0.25em] uppercase mb-5"
              data-testid="text-diversity-inclusion-eyebrow"
            >
              {t.eyebrow}
            </p>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-diversity-inclusion-description"
            >
              {t.text}
            </p>
          </motion.div>

          {/* Pillars */}
          <motion.div
            variants={pillarVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-8"
          >
            {t.pillars.map((pillar, i) => (
              <motion.div
                key={i}
                variants={pillarItem}
                className="border-t border-border pt-4 pb-4"
                data-testid={`pillar-diversity-${i}`}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground mb-1">
                  {pillar.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/diversity-inclusion">
              <Button
                variant="default"
                className="rounded-none uppercase tracking-[0.15em] px-8"
                data-testid="button-diversity-inclusion-see-more"
              >
                {t.buttonText}
              </Button>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
