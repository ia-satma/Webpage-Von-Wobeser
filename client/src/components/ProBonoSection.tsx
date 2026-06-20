import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";
import officePhoto from "@assets/collage_08.jpg";

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
    eyebrow: "SOCIAL RESPONSIBILITY",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra is committed to providing legal services to those who need them most. Our pro bono program allows us to give back to the community and support organizations and individuals who cannot afford legal representation.",
    buttonText: "SEE MORE",
    pillars: [
      { label: "Access to Justice", desc: "Legal representation for those who need it most, regardless of economic means." },
      { label: "Community Support", desc: "Collaboration with civil society organizations and non-profits." },
      { label: "Social Commitment", desc: "Giving back to the community with our expertise and dedication." },
    ],
  },
  es: {
    eyebrow: "RESPONSABILIDAD SOCIAL",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra está comprometido a brindar servicios legales a quienes más los necesitan. Nuestro programa pro bono nos permite retribuir a la comunidad y apoyar a organizaciones e individuos que no pueden costear representación legal.",
    buttonText: "VER MÁS",
    pillars: [
      { label: "Acceso a la Justicia", desc: "Representación legal para quienes más lo necesitan, sin importar sus medios económicos." },
      { label: "Apoyo Comunitario", desc: "Colaboración con organizaciones de la sociedad civil y sin fines de lucro." },
      { label: "Compromiso Social", desc: "Retribuyendo a la comunidad con nuestra experiencia y dedicación." },
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

export default function ProBonoSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      className="bg-muted border-t border-border overflow-hidden"
      data-testid="section-pro-bono"
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[400px]">

        {/* Content panel — mobile: below photo, desktop: left 60% */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-12 lg:py-14 lg:w-3/5 order-last lg:order-first">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6"
          >
            <div className="w-8 h-px bg-primary mb-5" />
            <p
              className="text-primary text-[10px] tracking-[0.25em] uppercase mb-4"
              data-testid="text-pro-bono-eyebrow"
            >
              {t.eyebrow}
            </p>
            <h2
              className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight mb-5"
              data-testid="text-pro-bono-title"
            >
              {t.title}
            </h2>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-pro-bono-description"
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
                data-testid={`pillar-probono-${i}`}
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
            <Link href="/pro-bono">
              <Button
                variant="default"
                className="rounded-none uppercase tracking-[0.15em] px-8"
                data-testid="button-pro-bono-see-more"
              >
                {t.buttonText}
              </Button>
            </Link>
          </motion.div>

        </div>

        {/* Photo panel — mobile: top h-[220px], desktop: right 40% */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[220px] lg:h-auto lg:w-2/5 shrink-0 overflow-hidden order-first lg:order-last"
          data-testid="panel-probono-photo"
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
            <p
              className="font-heading font-light text-2xl lg:text-3xl xl:text-4xl text-white uppercase tracking-[0.12em] leading-tight"
              data-testid="text-pro-bono-title-photo"
            >
              {t.title}
            </p>
            <div className="w-8 h-px bg-primary/80 mt-4" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
