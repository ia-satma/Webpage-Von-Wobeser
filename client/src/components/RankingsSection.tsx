import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import chambersGlobal from "@assets/Agosto156x156_chambers_global25-1_1764817346699.png";
import chambersLatam from "@assets/Agosto156x156_chambers_LATAM26_1764817346699.png";
import latinLawyer from "@assets/156x156_chambers_LL250png_1764817346699.png";
import legal500 from "@assets/LatAm_2026_156px_1764817346700.png";
import type { LanguageCode } from "@shared/schema";

interface RankingsContent {
  eyebrow: string;
  title: string;
  intro: string;
  institutions: string;
}

const content: Record<LanguageCode, RankingsContent> = {
  en: {
    eyebrow: "INTERNATIONAL RECOGNITION",
    title: "RECOGNITIONS",
    intro: "Von Wobeser y Sierra, S.C. has been recognized on an international level by various institutions.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation, among others.",
  },
  es: {
    eyebrow: "RECONOCIMIENTO INTERNACIONAL",
    title: "RECONOCIMIENTOS",
    intro: "Von Wobeser y Sierra, S.C. ha sido reconocido a nivel internacional por diversas instituciones.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation, entre otros.",
  },
  de: {
    eyebrow: "INTERNATIONALE ANERKENNUNG",
    title: "AUSZEICHNUNGEN",
    intro: "Von Wobeser y Sierra, S.C. wurde auf internationaler Ebene von verschiedenen Institutionen anerkannt.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation, unter anderen.",
  },
  zh: {
    eyebrow: "国际认可",
    title: "荣誉认可",
    intro: "Von Wobeser y Sierra, S.C. 已获得多个国际机构的认可。",
    institutions: "Chambers & Partners Global、Chambers & Partners Latin America、Legal 500、Latin Lawyer 250、Global Arbitration Review (GAR 100)、Global Competition Review (GCR 100)、Global Investigations Review (GIR 100)、Global Restructuring Review (GCR)、Lexology Index、Latin America Corporate Counsel Association (LACCA)、IFLR 1000、Best Lawyers、Benchmark Litigation 等。",
  },
  ko: {
    eyebrow: "국제적 인정",
    title: "수상 및 인정",
    intro: "Von Wobeser y Sierra, S.C.는 다양한 국제 기관으로부터 인정받았습니다.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation 등.",
  },
  ja: {
    eyebrow: "国際的評価",
    title: "受賞・評価",
    intro: "Von Wobeser y Sierra, S.C.は、様々な国際機関から国際的に認められています。",
    institutions: "Chambers & Partners Global、Chambers & Partners Latin America、Legal 500、Latin Lawyer 250、Global Arbitration Review (GAR 100)、Global Competition Review (GCR 100)、Global Investigations Review (GIR 100)、Global Restructuring Review (GCR)、Lexology Index、Latin America Corporate Counsel Association (LACCA)、IFLR 1000、Best Lawyers、Benchmark Litigation など。",
  },
  ar: {
    eyebrow: "الاعتراف الدولي",
    title: "التقديرات",
    intro: "تم الاعتراف بـ Von Wobeser y Sierra, S.C. على المستوى الدولي من قبل مؤسسات مختلفة.",
    institutions: "Chambers & Partners Global، وChambers & Partners Latin America، وLegal 500، وLatin Lawyer 250، وGlobal Arbitration Review (GAR 100)، وGlobal Competition Review (GCR 100)، وGlobal Investigations Review (GIR 100)، وGlobal Restructuring Review (GCR)، وLexology Index، وLatin America Corporate Counsel Association (LACCA)، وIFLR 1000، وBest Lawyers، وBenchmark Litigation، وغيرها.",
  },
  ru: {
    eyebrow: "МЕЖДУНАРОДНОЕ ПРИЗНАНИЕ",
    title: "ПРИЗНАНИЕ",
    intro: "Von Wobeser y Sierra, S.C. получила международное признание различных организаций.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation, среди прочих.",
  },
  fr: {
    eyebrow: "RECONNAISSANCE INTERNATIONALE",
    title: "RECONNAISSANCES",
    intro: "Von Wobeser y Sierra, S.C. a été reconnu au niveau international par diverses institutions.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation, entre autres.",
  },
  it: {
    eyebrow: "RICONOSCIMENTO INTERNAZIONALE",
    title: "RICONOSCIMENTI",
    intro: "Von Wobeser y Sierra, S.C. è stata riconosciuta a livello internazionale da varie istituzioni.",
    institutions: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers, Benchmark Litigation, tra gli altri.",
  },
};

export default function RankingsSection() {
  const { language } = useLanguage();

  const t = content[language] || content.en;

  const rankings = [
    { src: chambersGlobal, alt: "Chambers Global 2025 - Top Ranked", id: "chambers-global" },
    { src: legal500, alt: "Legal 500 Latin America 2026 - Top Tier Firm", id: "legal-500" },
    { src: latinLawyer, alt: "Latin Lawyer 250 2026 - Highly Recommended Firm", id: "latin-lawyer" },
    { src: chambersLatam, alt: "Chambers Latin America 2026 - Top Ranked", id: "chambers-latam" },
  ];

  const logoVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const logoItem = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="rankings"
      className="pt-20 lg:pt-28 pb-0 bg-muted border-t border-border"
      data-testid="section-rankings"
    >
      {/* Text content — constrained width */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="w-12 h-px bg-[#AA1A2E] mb-6 mx-auto" />
          <p
            className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase mb-4"
            data-testid="text-rankings-eyebrow"
          >
            {t.eyebrow}
          </p>
          <h2
            className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight mb-8"
            data-testid="text-rankings-title"
          >
            {t.title}
          </h2>
        </motion.div>

        {/* Intro text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-6 max-w-4xl mx-auto"
        >
          <p
            className="text-sm text-muted-foreground leading-relaxed text-justify"
            data-testid="text-recognitions-intro"
          >
            {t.intro}
          </p>
        </motion.div>

        {/* Institutions paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-center mb-10 max-w-4xl mx-auto"
        >
          <p
            className="text-sm text-muted-foreground leading-relaxed text-justify"
            data-testid="text-recognitions-institutions"
          >
            {t.institutions}
          </p>
        </motion.div>

        {/* Divider */}
        <div className="w-full max-w-2xl mx-auto border-t border-border mb-10" data-testid="divider-recognitions" />

      </div>

      {/* Logos — full-width white band, outside the max-w container */}
      <motion.div
        variants={logoVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="bg-white w-full py-10 px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
            {rankings.map((ranking) => (
              <motion.div
                key={ranking.id}
                variants={logoItem}
                className="flex items-center justify-center"
              >
                <img
                  src={ranking.src}
                  alt={ranking.alt}
                  className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  data-testid={`img-ranking-${ranking.id}`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
