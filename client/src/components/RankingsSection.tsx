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
}

const content: Record<LanguageCode, RankingsContent> = {
  en: {
    eyebrow: "INTERNATIONAL RECOGNITION",
    title: "RECOGNITIONS",
    intro: "Von Wobeser y Sierra, S.C. has been recognized on an international level by various institutions including Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) and IFLR 1000, Best Lawyers, Benchmark Litigation, among others.",
  },
  es: {
    eyebrow: "RECONOCIMIENTO INTERNACIONAL",
    title: "RECONOCIMIENTOS",
    intro: "Von Wobeser y Sierra, S.C. ha sido reconocido a nivel internacional por diversas instituciones incluyendo Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) e IFLR 1000, Best Lawyers, Benchmark Litigation, entre otros.",
  },
  de: {
    eyebrow: "INTERNATIONALE ANERKENNUNG",
    title: "AUSZEICHNUNGEN",
    intro: "Von Wobeser y Sierra, S.C. wurde auf internationaler Ebene von verschiedenen Institutionen anerkannt, darunter Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) und IFLR 1000, Best Lawyers, Benchmark Litigation, unter anderen.",
  },
  zh: {
    eyebrow: "国际认可",
    title: "荣誉认可",
    intro: "Von Wobeser y Sierra, S.C. 已获得多个国际机构的认可，包括 Chambers & Partners Global、Chambers & Partners Latin America、Legal 500、Latin Lawyer 250、Global Arbitration Review (GAR 100)、Global Competition Review (GCR 100)、Global Investigations Review (GIR 100)、Global Restructuring Review (GCR)、Lexology Index、Latin America Corporate Counsel Association (LACCA)、IFLR 1000、Best Lawyers、Benchmark Litigation 等。",
  },
  ko: {
    eyebrow: "국제적 인정",
    title: "수상 및 인정",
    intro: "Von Wobeser y Sierra, S.C.는 Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) 및 IFLR 1000, Best Lawyers, Benchmark Litigation 등 다양한 기관으로부터 국제적으로 인정받았습니다.",
  },
  ja: {
    eyebrow: "国際的評価",
    title: "受賞・評価",
    intro: "Von Wobeser y Sierra, S.C.は、Chambers & Partners Global、Chambers & Partners Latin America、Legal 500、Latin Lawyer 250、Global Arbitration Review (GAR 100)、Global Competition Review (GCR 100)、Global Investigations Review (GIR 100)、Global Restructuring Review (GCR)、Lexology Index、Latin America Corporate Counsel Association (LACCA) および IFLR 1000、Best Lawyers、Benchmark Litigation など、様々な機関から国際的に認められています。",
  },
  ar: {
    eyebrow: "الاعتراف الدولي",
    title: "التقديرات",
    intro: "تم الاعتراف بـ Von Wobeser y Sierra, S.C. على المستوى الدولي من قبل مؤسسات مختلفة بما في ذلك Chambers & Partners Global، وChambers & Partners Latin America، وLegal 500، وLatin Lawyer 250، وGlobal Arbitration Review (GAR 100)، وGlobal Competition Review (GCR 100)، وGlobal Investigations Review (GIR 100)، وGlobal Restructuring Review (GCR)، وLexology Index، وLatin America Corporate Counsel Association (LACCA)، وIFLR 1000، وBest Lawyers، وBenchmark Litigation، وغيرها.",
  },
  ru: {
    eyebrow: "МЕЖДУНАРОДНОЕ ПРИЗНАНИЕ",
    title: "ПРИЗНАНИЕ",
    intro: "Von Wobeser y Sierra, S.C. получила международное признание различных организаций, включая Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) и IFLR 1000, Best Lawyers, Benchmark Litigation, среди прочих.",
  },
  fr: {
    eyebrow: "RECONNAISSANCE INTERNATIONALE",
    title: "RECONNAISSANCES",
    intro: "Von Wobeser y Sierra, S.C. a été reconnu au niveau international par diverses institutions, notamment Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) et IFLR 1000, Best Lawyers, Benchmark Litigation, entre autres.",
  },
  it: {
    eyebrow: "RICONOSCIMENTO INTERNAZIONALE",
    title: "RICONOSCIMENTI",
    intro: "Von Wobeser y Sierra, S.C. è stata riconosciuta a livello internazionale da varie istituzioni tra cui Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GCR), Lexology Index, Latin America Corporate Counsel Association (LACCA) e IFLR 1000, Best Lawyers, Benchmark Litigation, tra gli altri.",
  },
};

export default function RankingsSection() {
  const { language } = useLanguage();

  const t = content[language] || content.es;

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
      className="py-20 lg:py-28 bg-background"
      data-testid="section-rankings"
    >
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
          className="text-center mb-10 max-w-4xl mx-auto"
        >
          <p
            className="text-sm text-muted-foreground leading-relaxed text-justify"
            data-testid="text-recognitions-intro"
          >
            {t.intro}
          </p>
        </motion.div>

        {/* Divider */}
        <div className="w-full max-w-2xl mx-auto border-t border-border mb-10" data-testid="divider-recognitions" />

        {/* Logos — white background so PNG badges don't show their backgrounds */}
        <motion.div
          variants={logoVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="bg-white py-10 px-8 -mx-6 lg:-mx-12">
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

      </div>
    </section>
  );
}
