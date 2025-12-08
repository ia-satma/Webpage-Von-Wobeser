import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LanguageCode } from "@shared/schema";

interface ValueItem {
  en: string;
  es: string;
  de: string;
  zh: string;
  ko: string;
  ja: string;
  ar: string;
  ru: string;
  fr: string;
  it: string;
}

const values: ValueItem[] = [
  { en: "Integrity", es: "Integridad", de: "Integrität", zh: "诚信", ko: "진실성", ja: "誠実さ", ar: "النزاهة", ru: "Честность", fr: "Intégrité", it: "Integrità" },
  { en: "Excellence", es: "Excelencia", de: "Exzellenz", zh: "卓越", ko: "탁월함", ja: "卓越性", ar: "التميز", ru: "Совершенство", fr: "Excellence", it: "Eccellenza" },
  { en: "Commitment", es: "Compromiso", de: "Engagement", zh: "承诺", ko: "헌신", ja: "コミットメント", ar: "الالتزام", ru: "Приверженность", fr: "Engagement", it: "Impegno" },
  { en: "Agility", es: "Agilidad", de: "Agilität", zh: "敏捷", ko: "민첩성", ja: "機敏性", ar: "المرونة", ru: "Гибкость", fr: "Agilité", it: "Agilità" },
  { en: "Diversity", es: "Diversidad", de: "Vielfalt", zh: "多样性", ko: "다양성", ja: "多様性", ar: "التنوع", ru: "Разнообразие", fr: "Diversité", it: "Diversità" },
];

interface AboutUsContent {
  sectionTitle: string;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionText: string;
  valuesTitle: string;
}

const content: Record<LanguageCode, AboutUsContent> = {
  en: {
    sectionTitle: "ABOUT US",
    visionTitle: "Vision",
    visionText: "To be the leading law firm in Mexico, recognized for delivering exceptional legal services, fostering talent, and making a positive impact in our community.",
    missionTitle: "Mission",
    missionText: "To provide our clients with the highest quality legal counsel, combining deep expertise with innovative solutions and an unwavering commitment to their success.",
    valuesTitle: "Values",
  },
  es: {
    sectionTitle: "ACERCA DE NOSOTROS",
    visionTitle: "Visión",
    visionText: "Ser la firma de abogados líder en México, reconocida por brindar servicios legales excepcionales, fomentar el talento y generar un impacto positivo en nuestra comunidad.",
    missionTitle: "Misión",
    missionText: "Proporcionar a nuestros clientes asesoría legal de la más alta calidad, combinando profunda experiencia con soluciones innovadoras y un compromiso inquebrantable con su éxito.",
    valuesTitle: "Valores",
  },
  de: {
    sectionTitle: "ÜBER UNS",
    visionTitle: "Vision",
    visionText: "Die führende Anwaltskanzlei in Mexiko zu sein, anerkannt für die Bereitstellung außergewöhnlicher Rechtsdienstleistungen, die Förderung von Talenten und einen positiven Einfluss auf unsere Gemeinschaft.",
    missionTitle: "Mission",
    missionText: "Unseren Mandanten Rechtsberatung höchster Qualität zu bieten, die tiefgreifende Expertise mit innovativen Lösungen und einem unerschütterlichen Engagement für ihren Erfolg verbindet.",
    valuesTitle: "Werte",
  },
  zh: {
    sectionTitle: "关于我们",
    visionTitle: "愿景",
    visionText: "成为墨西哥领先的律师事务所，以提供卓越的法律服务、培养人才和对社区产生积极影响而闻名。",
    missionTitle: "使命",
    missionText: "为客户提供最高质量的法律顾问服务，将深厚的专业知识与创新解决方案相结合，坚定不移地致力于客户的成功。",
    valuesTitle: "价值观",
  },
  ko: {
    sectionTitle: "회사 소개",
    visionTitle: "비전",
    visionText: "탁월한 법률 서비스 제공, 인재 육성, 지역사회에 긍정적인 영향을 미치는 것으로 인정받는 멕시코 최고의 법률 사무소가 되는 것입니다.",
    missionTitle: "미션",
    missionText: "깊은 전문성과 혁신적인 솔루션, 그리고 고객의 성공에 대한 확고한 헌신을 결합하여 최고 품질의 법률 자문을 제공합니다.",
    valuesTitle: "가치",
  },
  ja: {
    sectionTitle: "私たちについて",
    visionTitle: "ビジョン",
    visionText: "卓越した法的サービスの提供、才能の育成、コミュニティへの積極的な貢献で認められる、メキシコを代表する法律事務所になること。",
    missionTitle: "ミッション",
    missionText: "深い専門知識と革新的なソリューション、そしてクライアントの成功への揺るぎないコミットメントを組み合わせた最高品質の法的助言をクライアントに提供すること。",
    valuesTitle: "価値観",
  },
  ar: {
    sectionTitle: "من نحن",
    visionTitle: "الرؤية",
    visionText: "أن نكون شركة المحاماة الرائدة في المكسيك، معترف بها لتقديم خدمات قانونية استثنائية، وتعزيز المواهب، وإحداث تأثير إيجابي في مجتمعنا.",
    missionTitle: "المهمة",
    missionText: "تزويد عملائنا بأعلى جودة من الاستشارات القانونية، مع الجمع بين الخبرة العميقة والحلول المبتكرة والالتزام الراسخ بنجاحهم.",
    valuesTitle: "القيم",
  },
  ru: {
    sectionTitle: "О НАС",
    visionTitle: "Видение",
    visionText: "Быть ведущей юридической фирмой в Мексике, признанной за предоставление исключительных юридических услуг, развитие талантов и положительное влияние на наше сообщество.",
    missionTitle: "Миссия",
    missionText: "Предоставлять нашим клиентам юридические консультации высочайшего качества, сочетая глубокую экспертизу с инновационными решениями и непоколебимую приверженность их успеху.",
    valuesTitle: "Ценности",
  },
  fr: {
    sectionTitle: "À PROPOS DE NOUS",
    visionTitle: "Vision",
    visionText: "Être le cabinet d'avocats leader au Mexique, reconnu pour fournir des services juridiques exceptionnels, favoriser les talents et avoir un impact positif dans notre communauté.",
    missionTitle: "Mission",
    missionText: "Fournir à nos clients des conseils juridiques de la plus haute qualité, combinant une expertise approfondie avec des solutions innovantes et un engagement indéfectible envers leur succès.",
    valuesTitle: "Valeurs",
  },
  it: {
    sectionTitle: "CHI SIAMO",
    visionTitle: "Visione",
    visionText: "Essere lo studio legale leader in Messico, riconosciuto per la fornitura di servizi legali eccezionali, la promozione dei talenti e un impatto positivo nella nostra comunità.",
    missionTitle: "Missione",
    missionText: "Fornire ai nostri clienti consulenza legale della massima qualità, combinando profonda competenza con soluzioni innovative e un impegno incrollabile per il loro successo.",
    valuesTitle: "Valori",
  },
};

export default function AboutUsSection() {
  const { language } = useLanguage();

  const t = content[language] || content.en;

  const getValueText = (value: ValueItem): string => {
    return value[language] || value.en;
  };

  return (
    <section
      id="about-us"
      className="py-20 lg:py-32 bg-white dark:bg-gray-900"
      data-testid="section-about-us"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-heading font-light uppercase tracking-wide text-[#AC162C] text-center mb-16"
          data-testid="text-about-us-title"
        >
          {t.sectionTitle}
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-testid="subsection-vision"
          >
            <h3
              className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-6"
              data-testid="text-vision-title"
            >
              {t.visionTitle}
            </h3>
            <p
              className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed"
              data-testid="text-vision-content"
            >
              {t.visionText}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            data-testid="subsection-mission"
          >
            <h3
              className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-6"
              data-testid="text-mission-title"
            >
              {t.missionTitle}
            </h3>
            <p
              className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed"
              data-testid="text-mission-content"
            >
              {t.missionText}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-24 h-px bg-primary mx-auto mb-12"
          data-testid="divider-about-us"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
          data-testid="subsection-values"
        >
          <h3
            className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-10"
            data-testid="text-values-title"
          >
            {t.valuesTitle}
          </h3>

          <div
            className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8"
            data-testid="values-grid"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.en}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                data-testid={`value-item-${index}`}
              >
                <span
                  className="text-base md:text-lg font-heading text-gray-700 dark:text-gray-200"
                  data-testid={`text-value-${index}`}
                >
                  {getValueText(value)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
