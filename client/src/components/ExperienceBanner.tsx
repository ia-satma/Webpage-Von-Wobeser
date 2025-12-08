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
  de: {
    text: "Von Wobeser y Sierra, S.C. verfügt über mehr als drei Jahrzehnte Erfahrung in der Bereitstellung erstklassiger Rechtsdienstleistungen.",
  },
  zh: {
    text: "Von Wobeser y Sierra, S.C. 拥有超过三十年提供优质法律服务的经验。",
  },
  ko: {
    text: "Von Wobeser y Sierra, S.C.는 30년 이상의 최고 품질의 법률 서비스 제공 경험을 보유하고 있습니다.",
  },
  ja: {
    text: "Von Wobeser y Sierra, S.C.は、30年以上にわたり最高品質の法律サービスを提供してきた経験があります。",
  },
  ar: {
    text: "تمتلك Von Wobeser y Sierra, S.C. أكثر من ثلاثة عقود من الخبرة في تقديم خدمات قانونية عالية الجودة.",
  },
  ru: {
    text: "Von Wobeser y Sierra, S.C. имеет более чем тридцатилетний опыт предоставления юридических услуг высочайшего качества.",
  },
  fr: {
    text: "Von Wobeser y Sierra, S.C. possède plus de trois décennies d'expérience dans la fourniture de services juridiques de haute qualité.",
  },
  it: {
    text: "Von Wobeser y Sierra, S.C. vanta oltre tre decenni di esperienza nella fornitura di servizi legali di alta qualità.",
  },
};

export default function ExperienceBanner() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      className="py-16 lg:py-20 bg-[#AC162C]"
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
