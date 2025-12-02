import { motion } from "framer-motion";
import rankingsImage from "@assets/image_1764710960980.png";

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

  return (
    <section 
      id="rankings" 
      className="py-12 bg-white"
      data-testid="section-rankings"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <img 
            src={rankingsImage} 
            alt={t.title}
            className="w-full max-w-4xl mx-auto h-auto object-contain"
            data-testid="img-rankings-logos"
          />
        </motion.div>
      </div>
    </section>
  );
}
