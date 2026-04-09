import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import chambersGlobal from "@assets/Agosto156x156_chambers_global25-1_1764817346699.png";
import chambersLatam from "@assets/Agosto156x156_chambers_LATAM26_1764817346699.png";
import latinLawyer from "@assets/156x156_chambers_LL250png_1764817346699.png";
import legal500 from "@assets/LatAm_2026_156px_1764817346700.png";
import type { LanguageCode } from "@shared/schema";

interface RankingsContent {
  title: string;
  intro: string;
}

const content: Record<LanguageCode, RankingsContent> = {
  en: {
    title: "RECOGNITIONS",
    intro: "Von Wobeser y Sierra, S.C. has been recognized on an international level by various institutions including",
  },
  es: {
    title: "RECONOCIMIENTOS",
    intro: "Von Wobeser y Sierra, S.C. ha sido reconocido a nivel internacional por diversas instituciones incluyendo",
  },
  de: {
    title: "AUSZEICHNUNGEN",
    intro: "Von Wobeser y Sierra, S.C. wurde auf internationaler Ebene von verschiedenen Institutionen anerkannt, darunter",
  },
  zh: {
    title: "荣誉认可",
    intro: "Von Wobeser y Sierra, S.C. 已获得多个国际机构的认可，包括",
  },
  ko: {
    title: "수상 및 인정",
    intro: "Von Wobeser y Sierra, S.C.는 다음을 포함한 다양한 기관으로부터 국제적으로 인정받았습니다",
  },
  ja: {
    title: "受賞・評価",
    intro: "Von Wobeser y Sierra, S.C.は、以下を含む様々な機関から国際的に認められています",
  },
  ar: {
    title: "التقديرات",
    intro: "تم الاعتراف بـ Von Wobeser y Sierra, S.C. على المستوى الدولي من قبل مؤسسات مختلفة بما في ذلك",
  },
  ru: {
    title: "ПРИЗНАНИЕ",
    intro: "Von Wobeser y Sierra, S.C. получила международное признание различных организаций, включая",
  },
  fr: {
    title: "RECONNAISSANCES",
    intro: "Von Wobeser y Sierra, S.C. a été reconnu au niveau international par diverses institutions, notamment",
  },
  it: {
    title: "RICONOSCIMENTI",
    intro: "Von Wobeser y Sierra, S.C. è stata riconosciuta a livello internazionale da varie istituzioni tra cui",
  },
};

export default function RankingsSection() {
  const { language } = useLanguage();

  const t = content[language] || content.en;

  const institutionsList = "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) and IFLR 1000, Best Lawyers, Benchmark Litigation among others.";

  const rankings = [
    { src: chambersGlobal, alt: "Chambers Global 2025 - Top Ranked", id: "chambers-global", hasFirmName: true },
    { src: legal500, alt: "Legal 500 Latin America 2026 - Top Tier Firm", id: "legal-500", hasFirmName: false },
    { src: latinLawyer, alt: "Latin Lawyer 250 2026 - Highly Recommended Firm", id: "latin-lawyer", hasFirmName: false },
    { src: chambersLatam, alt: "Chambers Latin America 2026 - Top Ranked", id: "chambers-latam", hasFirmName: true },
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
          className="text-center mb-8"
        >
          <h2 
            className="text-2xl md:text-3xl font-heading font-light uppercase"
            style={{ color: '#8B0000', letterSpacing: '0.3em' }}
            data-testid="text-rankings-title"
          >
            {t.title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8 max-w-4xl mx-auto"
        >
          <p 
            className="font-serif italic text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
            data-testid="text-recognitions-intro"
          >
            {t.intro}
          </p>
          <p 
            className="font-serif text-gray-700 dark:text-gray-300 text-lg leading-relaxed mt-2"
            data-testid="text-recognitions-institutions"
          >
            {institutionsList}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-10"
        >
          <div 
            className="w-full max-w-2xl mx-auto"
            style={{ borderBottom: '1px solid #e5e2db' }}
            data-testid="divider-recognitions"
          />
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-start gap-6 sm:gap-8 md:gap-12 lg:gap-16"
        >
          {rankings.map((ranking) => (
            <motion.div
              key={ranking.id}
              variants={itemVariants}
              className="flex flex-col items-center justify-center p-2"
            >
              <img 
                src={ranking.src} 
                alt={ranking.alt}
                className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                data-testid={`img-ranking-${ranking.id}`}
              />
              {ranking.hasFirmName && (
                <span 
                  className="mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-serif text-center"
                  data-testid={`text-firm-name-${ranking.id}`}
                >
                  Von Wobeser y Sierra, S.C.
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
