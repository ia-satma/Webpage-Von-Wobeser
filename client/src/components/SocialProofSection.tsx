import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LanguageCode } from "@shared/schema";

type QuoteText = Record<LanguageCode, string>;

interface Quote {
  id: string;
  source: string;
  year?: string;
  text: QuoteText;
}

const quotes: Quote[] = [
  {
    id: "chambers",
    source: "Chambers & Partners",
    year: "2025",
    text: {
      en: "Von Wobeser y Sierra is a leading full-service law firm with deep expertise across all practice areas and industries.",
      es: "Von Wobeser y Sierra es una firma de abogados líder en servicio completo con profunda experiencia en todas las áreas de práctica e industrias.",
      de: "Von Wobeser y Sierra ist eine führende Full-Service-Kanzlei mit tiefgreifender Expertise in allen Praxisbereichen und Branchen.",
      zh: "Von Wobeser y Sierra是一家领先的综合性律师事务所，在所有业务领域和行业都拥有深厚的专业知识。",
      ko: "Von Wobeser y Sierra는 모든 업무 분야와 산업에 걸쳐 깊은 전문성을 갖춘 선도적인 종합 법률 사무소입니다.",
      ja: "Von Wobeser y Sierraは、すべての業務分野と産業において深い専門知識を持つ、業界をリードするフルサービス法律事務所です。",
      ar: "Von Wobeser y Sierra هي شركة محاماة رائدة متكاملة الخدمات تتمتع بخبرة عميقة في جميع مجالات الممارسة والصناعات.",
      ru: "Von Wobeser y Sierra — ведущая юридическая фирма полного цикла с глубокой экспертизой во всех областях практики и отраслях.",
      fr: "Von Wobeser y Sierra est un cabinet d'avocats leader offrant une gamme complète de services avec une expertise approfondie dans tous les domaines de pratique et industries.",
      it: "Von Wobeser y Sierra è uno studio legale leader a servizio completo con profonda competenza in tutti i settori di pratica e industrie.",
    },
  },
  {
    id: "legal500",
    source: "Legal 500",
    year: "2026",
    text: {
      en: "The team is highly regarded for its sophisticated handling of complex cross-border transactions and disputes.",
      es: "El equipo es altamente reconocido por su manejo sofisticado de transacciones transfronterizas complejas y disputas.",
      de: "Das Team ist hoch angesehen für seinen anspruchsvollen Umgang mit komplexen grenzüberschreitenden Transaktionen und Streitigkeiten.",
      zh: "该团队因其对复杂跨境交易和争议的专业处理而备受推崇。",
      ko: "이 팀은 복잡한 국경 간 거래 및 분쟁의 정교한 처리로 높은 평가를 받고 있습니다.",
      ja: "チームは、複雑な国境を越えた取引や紛争の洗練された処理で高く評価されています。",
      ar: "يحظى الفريق بتقدير كبير لتعامله المتطور مع المعاملات والنزاعات العابرة للحدود المعقدة.",
      ru: "Команда высоко ценится за профессиональное ведение сложных трансграничных сделок и споров.",
      fr: "L'équipe est hautement reconnue pour sa gestion sophistiquée des transactions transfrontalières complexes et des litiges.",
      it: "Il team è altamente stimato per la sua gestione sofisticata di transazioni transfrontaliere complesse e controversie.",
    },
  },
  {
    id: "latinlawyer",
    source: "Latin Lawyer",
    year: "2026",
    text: {
      en: "A market-leading firm that consistently delivers exceptional results for clients in the most demanding matters.",
      es: "Una firma líder en el mercado que constantemente entrega resultados excepcionales para clientes en los asuntos más exigentes.",
      de: "Eine marktführende Kanzlei, die konsequent außergewöhnliche Ergebnisse für Mandanten in den anspruchsvollsten Angelegenheiten liefert.",
      zh: "一家市场领先的律所，在最苛刻的事务中始终为客户提供卓越的成果。",
      ko: "가장 까다로운 사안에서 고객에게 일관되게 탁월한 결과를 제공하는 시장 선도 기업입니다.",
      ja: "最も困難な案件において、クライアントに一貫して卓越した結果を提供する市場をリードする事務所です。",
      ar: "شركة رائدة في السوق تقدم باستمرار نتائج استثنائية للعملاء في أكثر المسائل تطلبًا.",
      ru: "Лидер рынка, который неизменно обеспечивает исключительные результаты для клиентов в самых сложных делах.",
      fr: "Un cabinet leader du marché qui délivre systématiquement des résultats exceptionnels pour ses clients dans les affaires les plus exigeantes.",
      it: "Uno studio leader di mercato che offre costantemente risultati eccezionali per i clienti nelle questioni più impegnative.",
    },
  },
];

type ContentItem = {
  title: string;
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    title: "What They Say About Us",
  },
  es: {
    title: "Lo Que Dicen De Nosotros",
  },
  de: {
    title: "Was Sie Über Uns Sagen",
  },
  zh: {
    title: "客户评价",
  },
  ko: {
    title: "고객 후기",
  },
  ja: {
    title: "お客様の声",
  },
  ar: {
    title: "ما يقولونه عنا",
  },
  ru: {
    title: "Что о нас говорят",
  },
  fr: {
    title: "Ce Qu'ils Disent De Nous",
  },
  it: {
    title: "Cosa Dicono Di Noi",
  },
};

export default function SocialProofSection() {
  const { language } = useLanguage();

  const t = content[language] || content.en;

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

  const getQuoteText = (quote: Quote): string => {
    return quote.text[language] || quote.text.en;
  };

  return (
    <section
      id="social-proof"
      className="py-20 lg:py-28 bg-muted"
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
            className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-[#AA1A2E] uppercase tracking-[0.12em]"
            data-testid="text-social-proof-title"
          >
            {t.title}
          </h2>
          <div
            className="w-16 h-0.5 bg-[#AA1A2E] mx-auto mt-6"
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
                className="w-8 h-8 mb-6 text-[#AA1A2E] opacity-30"
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
                className="font-serif italic text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8"
                data-testid={`text-quote-${quote.id}`}
              >
                "{getQuoteText(quote)}"
              </blockquote>

              <div className="mt-auto">
                <div
                  className="w-12 h-px bg-[#AA1A2E] mx-auto mb-4"
                  data-testid={`divider-quote-${quote.id}`}
                />
                <p
                  className="text-sm font-medium text-foreground uppercase tracking-wider"
                  data-testid={`text-source-${quote.id}`}
                >
                  {quote.source}
                </p>
                {quote.year && (
                  <p
                    className="text-xs text-muted-foreground mt-1"
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
