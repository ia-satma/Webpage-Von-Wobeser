import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const industryGroups = [
  { id: 1, nameEn: "Automotive, Mobility & Manufacturing", nameEs: "Automotriz, Movilidad y Manufactura", slug: "automotive-mobility-manufacturing" },
  { id: 2, nameEn: "Consumer Goods", nameEs: "Bienes de Consumo", slug: "consumer-goods" },
  { id: 3, nameEn: "Energy & Natural Resources", nameEs: "Energía y Recursos Naturales", slug: "energy-natural-resources" },
  { id: 4, nameEn: "Financial Services", nameEs: "Servicios Financieros", slug: "financial-services" },
  { id: 5, nameEn: "Pharmaceutical & Life Sciences", nameEs: "Farmacéutica y Ciencias de la Salud", slug: "pharmaceutical-life-sciences" },
  { id: 6, nameEn: "Real Estate", nameEs: "Inmobiliario", slug: "real-estate" },
  { id: 7, nameEn: "Technology", nameEs: "Tecnología", slug: "technology" },
];

const content = {
  en: {
    title: "INDUSTRY GROUPS",
    seeMore: "SEE MORE",
    ctaText: "Industry Expertise",
  },
  es: {
    title: "GRUPOS DE INDUSTRIA",
    seeMore: "VER MÁS",
    ctaText: "Expertise en Industrias",
  },
};

export default function IndustryGroupsSection() {
  const { language } = useLanguage();
  const t = content[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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
      id="industry-groups"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-industry-groups"
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
            data-testid="text-industry-groups-title"
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
          {industryGroups.map((group) => (
            <motion.div key={group.id} variants={itemVariants}>
              <Link
                href={`/industry-groups/${group.slug}`}
                className="group flex items-start gap-3 py-3 hover:text-primary transition-colors"
                data-testid={`link-industry-group-${group.id}`}
              >
                <span className="text-sm font-medium text-primary min-w-[24px]" data-testid={`text-industry-group-number-${group.id}`}>
                  {group.id}.
                </span>
                <span className="text-base text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors" data-testid={`text-industry-group-name-${group.id}`}>
                  {language === "es" ? group.nameEs : group.nameEn}
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
            href="/industry-groups"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            data-testid="link-industry-groups-see-more"
          >
            {t.seeMore}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-[#AC162C] hover:bg-[#841A1A] text-white uppercase tracking-wide"
              data-testid="button-industry-groups-contact"
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
