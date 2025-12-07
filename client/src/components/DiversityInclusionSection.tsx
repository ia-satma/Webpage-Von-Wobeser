import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function DiversityInclusionSection() {
  const { displayLanguage } = useLanguage();

  const content = {
    en: {
      title: "DIVERSITY & INCLUSION",
      text: "At Von Wobeser y Sierra, we believe that diversity is a source of strength and innovation. We are committed to creating an inclusive environment where all individuals can thrive and contribute their unique perspectives to our practice.",
      buttonText: "SEE MORE",
    },
    es: {
      title: "DIVERSIDAD E INCLUSIÓN",
      text: "En Von Wobeser y Sierra, creemos que la diversidad es fuente de fortaleza e innovación. Estamos comprometidos a crear un entorno inclusivo donde todos los individuos puedan prosperar y contribuir con sus perspectivas únicas a nuestra práctica.",
      buttonText: "VER MÁS",
    },
  };

  const t = content[displayLanguage];

  return (
    <section
      className="py-20 lg:py-32 bg-white dark:bg-gray-900"
      data-testid="section-diversity-inclusion"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-heading font-light uppercase tracking-wide text-[#AC162C] mb-8"
          data-testid="text-diversity-inclusion-title"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-serif text-gray-600 dark:text-gray-300 leading-relaxed mb-10"
          data-testid="text-diversity-inclusion-description"
        >
          {t.text}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/diversity-inclusion">
            <Button
              size="lg"
              className="px-8 py-4 bg-[#AC162C] hover:bg-[#841A1A] text-white uppercase tracking-wide"
              data-testid="button-diversity-inclusion-see-more"
            >
              {t.buttonText}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
