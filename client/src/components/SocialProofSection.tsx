import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LanguageCode } from "@shared/schema";

type QuoteText = Record<LanguageCode, string>;

interface Quote {
  id: string;
  source: string;
  year?: string;
  text: QuoteText;
  sourceUrl?: string;
}

const quotes: Quote[] = [
  {
    id: "chambers",
    source: "Chambers & Partners",
    year: "2025",
    sourceUrl: "https://chambers.com/law-firm/von-wobeser-y-sierra-sc-latin-america-7:113:11856398",
    text: {
      en: "Von Wobeser y Sierra is a leading full-service law firm with deep expertise across all practice areas and industries.",
      es: "Von Wobeser y Sierra es una firma de abogados líder en servicio completo con profunda experiencia en todas las áreas de práctica e industrias.",
    },
  },
  {
    id: "legal500",
    source: "Legal 500",
    year: "2026",
    sourceUrl: "https://www.legal500.com/firms/14641-von-wobeser-y-sierra-sc/14887-mexico-city-mexico/",
    text: {
      en: "The team is highly regarded for its sophisticated handling of complex cross-border transactions and disputes.",
      es: "El equipo es altamente reconocido por su manejo sofisticado de transacciones transfronterizas complejas y disputas.",
    },
  },
  {
    id: "latinlawyer",
    source: "Latin Lawyer",
    year: "2026",
    sourceUrl: "https://latinlawyer.com/rankings/latin-lawyer-250/2024/firm/von-wobeser-y-sierra-sc",
    text: {
      en: "A market-leading firm that consistently delivers exceptional results for clients in the most demanding matters.",
      es: "Una firma líder en el mercado que constantemente entrega resultados excepcionales para clientes en los asuntos más exigentes.",
    },
  },
];

const content: Record<LanguageCode, { title: string; readOn: string }> = {
  en: { title: "What They Say About Us", readOn: "Read on" },
  es: { title: "Lo Que Dicen De Nosotros", readOn: "Leer en" },
};

export default function SocialProofSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.22 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const getQuoteText = (quote: Quote): string =>
    quote.text[language] || quote.text.en;

  return (
    <section
      id="social-proof"
      className="py-20 lg:py-28 bg-muted"
      data-testid="section-social-proof"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-primary uppercase tracking-[0.12em]"
            data-testid="text-social-proof-title"
          >
            {t.title}
          </h2>
        </motion.div>

        {/* Editorial grid — no cards, open layout with vertical dividers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3"
          data-testid="grid-social-proof-quotes"
        >
          {quotes.map((quote, index) => (
            <motion.div
              key={quote.id}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              className={[
                "flex flex-col items-center text-center px-8 lg:px-12 py-6",
                index < quotes.length - 1
                  ? "border-b md:border-b-0 md:border-r border-foreground/10 mb-12 pb-12 md:mb-0 md:pb-6"
                  : "",
              ].join(" ")}
              data-testid={`card-quote-${quote.id}`}
            >
              {/* Large red opening quote — rises above the text block */}
              <div
                aria-hidden="true"
                className="text-primary font-serif select-none pointer-events-none"
                style={{
                  fontSize: "5.5rem",
                  lineHeight: "0.65",
                  fontStyle: "italic",
                  marginBottom: "1.5rem",
                  marginTop: "-0.75rem",
                }}
              >
                &ldquo;
              </div>

              {/* Quote text — italic serif, medium gray */}
              <blockquote
                className="text-sm lg:text-base leading-relaxed text-foreground/58 mb-8 flex-1"
                style={{ fontStyle: "italic" }}
                data-testid={`text-quote-${quote.id}`}
              >
                {getQuoteText(quote)}
              </blockquote>

              {/* Attribution */}
              <div className="flex flex-col items-center" data-testid={`attribution-${quote.id}`}>
                <div
                  className="w-10 h-px bg-primary mb-4"
                  data-testid={`divider-quote-${quote.id}`}
                />
                <div className="h-12 md:h-14 flex items-center justify-center">
                  <img
                    src={
                      quote.id === "chambers"
                        ? "/logos/chambers.png"
                        : quote.id === "legal500"
                        ? "/logos/legal500.png"
                        : "/logos/latin-lawyer.png"
                    }
                    alt={quote.source}
                    loading="lazy"
                    className={`w-auto object-contain dark:brightness-0 dark:invert ${
                      quote.id === "chambers"
                        ? "h-12 md:h-14 max-w-[150px] md:max-w-[170px]"
                        : quote.id === "legal500"
                        ? "h-7 md:h-8 max-w-[130px] md:max-w-[150px]"
                        : "h-5 md:h-6 max-w-[150px] md:max-w-[170px]"
                    }`}
                    data-testid={`text-source-${quote.id}`}
                  />
                </div>
                {quote.year && (
                  <p
                    className="font-support font-normal text-xs mt-1 tracking-wide text-muted-foreground"
                    data-testid={`text-year-${quote.id}`}
                  >
                    {quote.year}
                  </p>
                )}
                <div className="h-5 mt-3 flex items-center justify-center">
                  {quote.sourceUrl && (
                    <a
                      href={quote.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-support text-xs uppercase tracking-[0.12em] text-primary hover:underline"
                      data-testid={`link-source-${quote.id}`}
                    >
                      {t.readOn} {quote.source} →
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
