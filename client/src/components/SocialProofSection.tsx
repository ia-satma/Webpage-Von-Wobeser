import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface Quote {
  id: string;
  source: string;
  year?: string;
  text: {
    en: string;
    es: string;
  };
}

const quotes: Quote[] = [
  {
    id: "chambers",
    source: "Chambers & Partners",
    year: "2025",
    text: {
      en: "Von Wobeser y Sierra is a leading full-service law firm with deep expertise across all practice areas and industries.",
      es: "Von Wobeser y Sierra es una firma de abogados líder en servicio completo con profunda experiencia en todas las áreas de práctica e industrias.",
    },
  },
  {
    id: "legal500",
    source: "Legal 500",
    year: "2026",
    text: {
      en: "The team is highly regarded for its sophisticated handling of complex cross-border transactions and disputes.",
      es: "El equipo es altamente reconocido por su manejo sofisticado de transacciones transfronterizas complejas y disputas.",
    },
  },
  {
    id: "latinlawyer",
    source: "Latin Lawyer",
    year: "2026",
    text: {
      en: "A market-leading firm that consistently delivers exceptional results for clients in the most demanding matters.",
      es: "Una firma líder en el mercado que constantemente entrega resultados excepcionales para clientes en los asuntos más exigentes.",
    },
  },
];

interface SocialProofSectionProps {
  language?: "es" | "en";
}

export default function SocialProofSection({ language: propLanguage }: SocialProofSectionProps) {
  const { language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;

  const content = {
    en: {
      title: "What They Say About Us",
    },
    es: {
      title: "Lo Que Dicen De Nosotros",
    },
  };

  const t = content[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      id="social-proof"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-social-proof"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-gray-800 dark:text-white"
            data-testid="text-social-proof-title"
          >
            {t.title}
          </h2>
          <div
            className="w-16 h-0.5 bg-[#AC162C] mx-auto mt-6"
            data-testid="divider-social-proof"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
          data-testid="grid-social-proof-quotes"
        >
          {quotes.map((quote) => (
            <motion.div
              key={quote.id}
              variants={itemVariants}
              className="flex flex-col items-center text-center p-6 lg:p-8"
              data-testid={`card-quote-${quote.id}`}
            >
              <div
                className="w-8 h-8 mb-6 text-[#AC162C] opacity-30"
                data-testid={`icon-quote-${quote.id}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full"
                >
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                </svg>
              </div>

              <blockquote
                className="font-serif italic text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8"
                data-testid={`text-quote-${quote.id}`}
              >
                "{quote.text[language]}"
              </blockquote>

              <div className="mt-auto">
                <div
                  className="w-12 h-px bg-[#AC162C] mx-auto mb-4"
                  data-testid={`divider-quote-${quote.id}`}
                />
                <p
                  className="text-sm font-medium text-gray-800 dark:text-white uppercase tracking-wider"
                  data-testid={`text-source-${quote.id}`}
                >
                  {quote.source}
                </p>
                {quote.year && (
                  <p
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                    data-testid={`text-year-${quote.id}`}
                  >
                    {quote.year}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
