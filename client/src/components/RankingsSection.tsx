import { motion } from "framer-motion";
import chambersGlobal from "@assets/Agosto156x156_chambers_global25-1_1764817346699.png";
import chambersLatam from "@assets/Agosto156x156_chambers_LATAM26_1764817346699.png";
import latinLawyer from "@assets/156x156_chambers_LL250png_1764817346699.png";
import legal500 from "@assets/LatAm_2026_156px_1764817346700.png";

interface RankingsSectionProps {
  language: "es" | "en";
}

export default function RankingsSection({ language }: RankingsSectionProps) {
  const content = {
    en: {
      title: "Rankings & Recognition",
    },
    es: {
      title: "Rankings y Reconocimientos",
    },
  };

  const t = content[language];

  const rankings = [
    { src: chambersGlobal, alt: "Chambers Global 2025 - Top Ranked", id: "chambers-global" },
    { src: chambersLatam, alt: "Chambers Latin America 2026 - Top Ranked", id: "chambers-latam" },
    { src: latinLawyer, alt: "Latin Lawyer 250 2026 - Highly Recommended Firm", id: "latin-lawyer" },
    { src: legal500, alt: "Legal 500 Latin America 2026 - Top Tier Firm", id: "legal-500" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section 
      id="rankings" 
      className="py-16 bg-white dark:bg-gray-900"
      data-testid="section-rankings"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 
            className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white"
            data-testid="text-rankings-title"
          >
            {t.title}
          </h2>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16"
        >
          {rankings.map((ranking) => (
            <motion.div
              key={ranking.id}
              variants={itemVariants}
              className="flex-shrink-0"
            >
              <img 
                src={ranking.src} 
                alt={ranking.alt}
                className="h-24 md:h-28 lg:h-32 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                data-testid={`img-ranking-${ranking.id}`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
