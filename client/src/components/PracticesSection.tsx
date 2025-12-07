import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const practiceAreas = [
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

const content = {
  en: {
    title: "PRACTICE AREAS",
    seeMore: "SEE MORE",
    ctaText: "Get Legal Advice",
  },
  es: {
    title: "ÁREAS DE PRÁCTICA",
    seeMore: "VER MÁS",
    ctaText: "Obtener Asesoría Legal",
  },
};

export default function PracticesSection() {
  const { displayLanguage } = useLanguage();
  const t = content[displayLanguage];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
    <section
      id="practices"
      className="py-20 lg:py-28 bg-white dark:bg-gray-900"
      data-testid="section-practices"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] tracking-wide"
            data-testid="text-practices-title"
          >
            {t.title}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4"
        >
          {practiceAreas.map((area) => (
            <motion.div key={area.id} variants={itemVariants}>
              <Link
                href={`/practice-groups/${area.slug}`}
                className="group flex items-start gap-3 py-3 hover:text-primary transition-colors"
                data-testid={`link-practice-${area.id}`}
              >
                <span className="text-sm font-medium text-primary min-w-[24px]" data-testid={`text-practice-number-${area.id}`}>
                  {area.id}.
                </span>
                <span className="text-base text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors" data-testid={`text-practice-name-${area.id}`}>
                  {displayLanguage === "es" ? area.nameEs : area.nameEn}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/practice-groups"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            data-testid="link-practices-see-more"
          >
            {t.seeMore}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-[#AC162C] hover:bg-[#841A1A] text-white uppercase tracking-wide"
              data-testid="button-practices-contact"
            >
              <Phone className="w-4 h-4 mr-2" />
              {t.ctaText}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
