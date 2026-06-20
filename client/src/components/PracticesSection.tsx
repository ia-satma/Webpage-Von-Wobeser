import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";

interface PracticeArea {
  id: number;
  nameEn: string;
  nameEs: string;
  slug: string;
}

const practiceAreas: PracticeArea[] = [
  { id: 1, nameEn: "Corporate, Mergers & Acquisitions", nameEs: "Corporativo, Fusiones y Adquisiciones", slug: "corporate-ma" },
  { id: 2, nameEn: "Antitrust & Competition", nameEs: "Competencia Económica", slug: "antitrust-competition" },
  { id: 3, nameEn: "Arbitration", nameEs: "Arbitraje", slug: "arbitration" },
  { id: 4, nameEn: "Litigation", nameEs: "Litigio", slug: "litigation" },
  { id: 5, nameEn: "Investigations, Anti-corruption & Compliance", nameEs: "Investigaciones, Anticorrupción y Compliance", slug: "investigations-anticorruption" },
  { id: 6, nameEn: "Bankruptcy & Restructuring", nameEs: "Concursos Mercantiles y Reestructuración", slug: "bankruptcy-restructuring" },
  { id: 7, nameEn: "Banking & Finance", nameEs: "Bancario y Financiero", slug: "banking-finance" },
  { id: 8, nameEn: "Energy & Natural Resources", nameEs: "Energía y Recursos Naturales", slug: "energy-natural-resources" },
  { id: 9, nameEn: "ESG (Environmental, Social & Corporate Governance)", nameEs: "ESG (Ambiental, Social y Gobierno Corporativo)", slug: "esg" },
  { id: 10, nameEn: "Real Estate", nameEs: "Inmobiliario", slug: "real-estate" },
  { id: 11, nameEn: "Intellectual Property", nameEs: "Propiedad Intelectual", slug: "intellectual-property" },
  { id: 12, nameEn: "Labor & Employment", nameEs: "Laboral", slug: "labor-employment" },
  { id: 13, nameEn: "Tax", nameEs: "Fiscal", slug: "tax" },
  { id: 14, nameEn: "International Trade", nameEs: "Comercio Exterior", slug: "international-trade" },
  { id: 15, nameEn: "Telecommunications, Media & Technology", nameEs: "Telecomunicaciones, Medios y Tecnología", slug: "telecommunications-media-technology" },
  { id: 16, nameEn: "Environmental", nameEs: "Ambiental", slug: "environmental" },
  { id: 17, nameEn: "Administrative Law", nameEs: "Derecho Administrativo", slug: "administrative-law" },
  { id: 18, nameEn: "German Desk", nameEs: "Desk Alemán", slug: "german-desk" },
];

interface PracticesContent {
  title: string;
  subtitle: string;
  intro: string;
  seeMore: string;
  ctaText: string;
}

const content: Record<LanguageCode, PracticesContent> = {
  en: {
    title: "PRACTICE AREAS",
    subtitle: "18 SPECIALIZED DISCIPLINES",
    intro: "Comprehensive legal services across 18 specialized disciplines.",
    seeMore: "SEE ALL PRACTICES",
    ctaText: "Get Legal Advice",
  },
  es: {
    title: "ÁREAS DE PRÁCTICA",
    subtitle: "18 DISCIPLINAS ESPECIALIZADAS",
    intro: "Asesoría legal integral en 18 disciplinas especializadas.",
    seeMore: "VER TODAS LAS PRÁCTICAS",
    ctaText: "Obtener Asesoría Legal",
  },
};

function getPracticeAreaName(area: PracticeArea, language: LanguageCode): string {
  const nameMap: Record<LanguageCode, string> = {
    en: area.nameEn,
    es: area.nameEs,
  };
  return nameMap[language] || area.nameEn;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PracticesSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      id="practices"
      className="py-24 lg:py-32 bg-[#111110]"
      data-testid="section-practices"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:gap-20">

          {/* Left editorial identity column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-1/3 mb-12 lg:mb-0"
          >
            <div className="flex flex-col">
              {/* Red rule */}
              <div className="w-12 h-px bg-primary mb-6" />

              {/* Serif section heading — Playfair Display */}
              <h2
                className="font-heading font-light text-xl md:text-2xl text-white/90 uppercase tracking-[0.12em] mb-6"
                data-testid="text-practices-title"
              >
                {t.title}
              </h2>

              {/* Decorative large number */}
              <div className="relative mb-6 select-none pointer-events-none">
                <span className="text-[9rem] leading-none font-heading font-light text-white/[0.10]">
                  18
                </span>
              </div>

              {/* Intro sentence */}
              <p className="text-sm text-white/50 leading-relaxed mb-10 max-w-xs">
                {t.intro}
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-4">
                <Link href="/contact">
                  <Button
                    className="bg-primary text-white uppercase tracking-wide text-xs w-full sm:w-auto"
                    data-testid="button-practices-contact"
                  >
                    <Phone className="w-3.5 h-3.5 mr-2" />
                    {t.ctaText}
                  </Button>
                </Link>
                <Link
                  href="/practice-groups"
                  className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors duration-200 group"
                  data-testid="link-practices-see-more"
                >
                  {t.seeMore}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right list column — 2-column grid on desktop */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:w-2/3 border-t border-primary/25 grid grid-cols-1 lg:grid-cols-2"
          >
            {practiceAreas.map((area) => (
              <motion.div key={area.id} variants={itemVariants}>
                <Link
                  href={`/practice-groups/${area.slug}`}
                  className="group flex items-center gap-6 px-4 py-3 border-b border-primary/25 border-l-2 border-l-transparent hover:border-l-primary hover:bg-white/4 transition-all duration-200 h-full"
                  data-testid={`link-practice-${area.id}`}
                >
                  <span
                    className="font-serif text-lg font-normal text-primary w-12 shrink-0 tabular-nums"
                    data-testid={`text-practice-number-${area.id}`}
                  >
                    {String(area.id).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1 text-sm font-light text-white/90 group-hover:text-white transition-colors duration-200 leading-snug"
                    data-testid={`text-practice-name-${area.id}`}
                  >
                    {getPracticeAreaName(area, language)}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-primary shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* Mobile-only CTA block — below the list */}
        <div className="lg:hidden mt-10 flex flex-col gap-4">
          <Link href="/contact">
            <Button
              className="bg-primary text-white uppercase tracking-wide text-xs w-full"
              data-testid="button-practices-contact-mobile"
            >
              <Phone className="w-3.5 h-3.5 mr-2" />
              {t.ctaText}
            </Button>
          </Link>
          <Link
            href="/practice-groups"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors duration-200 group"
            data-testid="link-practices-see-more-mobile"
          >
            {t.seeMore}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>

      </div>
    </section>
  );
}
