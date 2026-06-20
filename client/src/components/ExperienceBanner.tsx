import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LanguageCode } from "@shared/schema";

type ContentItem = {
  text: string;
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    text: "Von Wobeser y Sierra, S.C. has more than three decades of experience providing top-quality legal services.",
  },
  es: {
    text: "Von Wobeser y Sierra, S.C. tiene más de tres décadas de experiencia brindando servicios legales de la más alta calidad.",
  },
};

export default function ExperienceBanner() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      className="py-16 lg:py-20 bg-primary"
      data-testid="section-experience-banner"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-xl md:text-2xl lg:text-3xl font-serif text-white text-center leading-relaxed"
          data-testid="text-experience-banner"
        >
          {t.text}
        </motion.p>
      </div>
    </section>
  );
}
