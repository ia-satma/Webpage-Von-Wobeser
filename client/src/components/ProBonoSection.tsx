import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function ProBonoSection() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "PRO BONO",
      text: "Von Wobeser y Sierra is committed to providing legal services to those who need them most. Our pro bono program allows us to give back to the community and support organizations and individuals who cannot afford legal representation.",
      buttonText: "SEE MORE",
    },
    es: {
      title: "PRO BONO",
      text: "Von Wobeser y Sierra está comprometido a brindar servicios legales a quienes más los necesitan. Nuestro programa pro bono nos permite retribuir a la comunidad y apoyar a organizaciones e individuos que no pueden costear representación legal.",
      buttonText: "VER MÁS",
    },
  };

  const t = content[language];

  return (
    <section
      className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-800"
      data-testid="section-pro-bono"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-heading font-light uppercase tracking-wide text-[#AC162C] mb-8"
          data-testid="text-pro-bono-title"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-serif text-gray-600 dark:text-gray-300 leading-relaxed mb-10"
          data-testid="text-pro-bono-description"
        >
          {t.text}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/pro-bono">
            <Button
              size="lg"
              className="px-8 py-4 bg-[#AC162C] hover:bg-[#841A1A] text-white uppercase tracking-wide"
              data-testid="button-pro-bono-see-more"
            >
              {t.buttonText}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
