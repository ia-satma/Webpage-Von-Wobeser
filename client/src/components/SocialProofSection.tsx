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

const content: Record<LanguageCode, { title: string }> = {
  en: { title: "What They Say About Us" },
  es: { title: "Lo Que Dicen De Nosotros" },
  de: { title: "Was Sie Über Uns Sagen" },
  zh: { title: "客户评价" },
  ko: { title: "고객 후기" },
  ja: { title: "お客様の声" },
  ar: { title: "ما يقولونه عنا" },
  ru: { title: "Что о нас говорят" },
  fr: { title: "Ce Qu'ils Disent De Nous" },
  it: { title: "Cosa Dicono Di Noi" },
};

export default function SocialProofSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const getQuoteText = (quote: Quote): string =>
    quote.text[language] || quote.text.en;

  return (
    <section
      id="social-proof"
      className="py-20 lg:py-28 bg-background"
      data-testid="section-social-proof"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Heading */}
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
          <div className="w-16 h-0.5 bg-[#AA1A2E] mx-auto mt-6" data-testid="divider-social-proof" />
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          data-testid="grid-social-proof-quotes"
        >
          {quotes.map((quote) => (
            <motion.div
              key={quote.id}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
              className="relative rounded-2xl pt-10 pb-8 px-8 lg:px-10 lg:pt-12 flex flex-col border border-foreground/[0.07] dark:border-foreground/[0.09] backdrop-blur-sm"
              style={{
                background: "rgba(0,0,0,0.03)",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.35s ease",
              }}
              onHoverStart={(e) => {
                (e.target as HTMLElement).style.boxShadow =
                  "0 24px 64px -12px rgba(0,0,0,0.13), 0 8px 24px -8px rgba(0,0,0,0.07)";
              }}
              onHoverEnd={(e) => {
                (e.target as HTMLElement).style.boxShadow =
                  "0 4px 24px -4px rgba(0,0,0,0.06)";
              }}
              data-testid={`card-quote-${quote.id}`}
            >
              {/* Red floating quote mark — sits on top edge of card, never overlaps text */}
              <span
                aria-hidden="true"
                className="absolute -top-10 left-5 select-none pointer-events-none font-serif text-[7rem] leading-none text-[#AA1A2E] drop-shadow-sm"
              >
                &ldquo;
              </span>

              {/* Quote text — centered, italic serif, medium gray */}
              <blockquote
                className="relative z-10 font-serif text-base lg:text-lg leading-relaxed text-foreground/60 dark:text-foreground/55 mb-8 text-center"
                style={{ fontStyle: "italic" }}
                data-testid={`text-quote-${quote.id}`}
              >
                {getQuoteText(quote)}
              </blockquote>

              {/* Attribution — pushed to bottom */}
              <div className="mt-auto" data-testid={`attribution-${quote.id}`}>
                {/* Red separator line — left-aligned */}
                <div
                  className="w-10 h-px bg-[#AA1A2E] mb-4"
                  data-testid={`divider-quote-${quote.id}`}
                />
                {/* Institution name — bold, uppercase, sans-serif, dark */}
                <p
                  className="font-support font-bold uppercase tracking-widest text-xs text-foreground/80 dark:text-foreground/75 leading-tight"
                  data-testid={`text-source-${quote.id}`}
                >
                  {quote.source}
                </p>
                {/* Year — regular, slightly lighter */}
                {quote.year && (
                  <p
                    className="font-support font-normal text-xs text-muted-foreground mt-1 tracking-wide"
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
