import { motion } from "framer-motion";
import { Eye, Target, Shield, Award, Heart, Zap, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LanguageCode } from "@shared/schema";

interface ValueItem {
  en: string; es: string; de: string; zh: string; ko: string;
  ja: string; ar: string; ru: string; fr: string; it: string;
  desc_en: string; desc_es: string; desc_de: string; desc_zh: string;
  desc_ko: string; desc_ja: string; desc_ar: string; desc_ru: string;
  desc_fr: string; desc_it: string;
  icon: React.ElementType;
}

const values: ValueItem[] = [
  {
    en: "Integrity", es: "Integridad", de: "Integrität", zh: "诚信",
    ko: "진실성", ja: "誠実さ", ar: "النزاهة", ru: "Честность",
    fr: "Intégrité", it: "Integrità",
    desc_en: "We act with honesty and transparency at every step.",
    desc_es: "Actuamos con honestidad y transparencia en todo momento.",
    desc_de: "Wir handeln stets mit Ehrlichkeit und Transparenz.",
    desc_zh: "我们在每一步都以诚实和透明的态度行事。",
    desc_ko: "우리는 모든 단계에서 정직하고 투명하게 행동합니다.",
    desc_ja: "あらゆる場面で誠実かつ透明に行動します。",
    desc_ar: "نتصرف بصدق وشفافية في كل خطوة.",
    desc_ru: "Мы действуем честно и прозрачно на каждом шагу.",
    desc_fr: "Nous agissons avec honnêteté et transparence à chaque étape.",
    desc_it: "Agiamo con onestà e trasparenza in ogni momento.",
    icon: Shield,
  },
  {
    en: "Excellence", es: "Excelencia", de: "Exzellenz", zh: "卓越",
    ko: "탁월함", ja: "卓越性", ar: "التميز", ru: "Совершенство",
    fr: "Excellence", it: "Eccellenza",
    desc_en: "We pursue the highest quality in every service we deliver.",
    desc_es: "Buscamos la más alta calidad en cada servicio que ofrecemos.",
    desc_de: "Wir streben in jedem unserer Dienste nach höchster Qualität.",
    desc_zh: "我们在提供的每项服务中追求最高品质。",
    desc_ko: "우리는 모든 서비스에서 최고의 품질을 추구합니다.",
    desc_ja: "すべてのサービスで最高品質を追求します。",
    desc_ar: "نسعى إلى أعلى مستويات الجودة في كل خدمة نقدمها.",
    desc_ru: "Мы стремимся к высочайшему качеству в каждой услуге.",
    desc_fr: "Nous recherchons la plus haute qualité dans chaque service.",
    desc_it: "Puntiamo alla massima qualità in ogni servizio offerto.",
    icon: Award,
  },
  {
    en: "Commitment", es: "Compromiso", de: "Engagement", zh: "承诺",
    ko: "헌신", ja: "コミットメント", ar: "الالتزام", ru: "Приверженность",
    fr: "Engagement", it: "Impegno",
    desc_en: "We dedicate ourselves fully to our clients' success.",
    desc_es: "Nos dedicamos al éxito de nuestros clientes sin reservas.",
    desc_de: "Wir widmen uns voll und ganz dem Erfolg unserer Mandanten.",
    desc_zh: "我们全心全意致力于客户的成功。",
    desc_ko: "우리는 고객의 성공에 전적으로 헌신합니다.",
    desc_ja: "クライアントの成功に全力を尽くします。",
    desc_ar: "نكرس أنفسنا بالكامل لنجاح عملائنا.",
    desc_ru: "Мы полностью посвящаем себя успеху наших клиентов.",
    desc_fr: "Nous nous consacrons entièrement au succès de nos clients.",
    desc_it: "Ci dedichiamo pienamente al successo dei nostri clienti.",
    icon: Heart,
  },
  {
    en: "Agility", es: "Agilidad", de: "Agilität", zh: "敏捷",
    ko: "민첩성", ja: "機敏性", ar: "المرونة", ru: "Гибкость",
    fr: "Agilité", it: "Agilità",
    desc_en: "We respond swiftly and effectively to every situation.",
    desc_es: "Respondemos con rapidez y eficacia ante cualquier situación.",
    desc_de: "Wir reagieren schnell und effektiv auf jede Situation.",
    desc_zh: "我们对任何情况都能迅速有效地作出回应。",
    desc_ko: "모든 상황에 신속하고 효과적으로 대응합니다.",
    desc_ja: "あらゆる状況に迅速かつ効果的に対応します。",
    desc_ar: "نستجيب بسرعة وفعالية لكل موقف.",
    desc_ru: "Мы быстро и эффективно реагируем на любую ситуацию.",
    desc_fr: "Nous répondons rapidement et efficacement à chaque situation.",
    desc_it: "Rispondiamo rapidamente ed efficacemente a ogni situazione.",
    icon: Zap,
  },
  {
    en: "Diversity", es: "Diversidad", de: "Vielfalt", zh: "多样性",
    ko: "다양성", ja: "多様性", ar: "التنوع", ru: "Разнообразие",
    fr: "Diversité", it: "Diversità",
    desc_en: "We value every perspective to enrich our work together.",
    desc_es: "Valoramos cada perspectiva para enriquecer nuestro trabajo.",
    desc_de: "Wir schätzen jede Perspektive, um unsere Arbeit zu bereichern.",
    desc_zh: "我们重视每一种观点，以丰富我们共同的工作。",
    desc_ko: "우리는 모든 관점을 소중히 여겨 업무를 풍요롭게 합니다.",
    desc_ja: "多様な視点を大切にし、仕事を豊かにします。",
    desc_ar: "نقدر كل وجهة نظر لإثراء عملنا المشترك.",
    desc_ru: "Мы ценим каждую точку зрения для обогащения нашей работы.",
    desc_fr: "Nous valorisons chaque perspective pour enrichir notre travail.",
    desc_it: "Valorizziamo ogni prospettiva per arricchire il nostro lavoro.",
    icon: Globe,
  },
];

interface AboutUsContent {
  eyebrow: string;
  sectionTitle: string;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionText: string;
  valuesTitle: string;
}

const content: Record<LanguageCode, AboutUsContent> = {
  en: {
    eyebrow: "ABOUT US",
    sectionTitle: "ABOUT US",
    visionTitle: "Vision",
    visionText: "To be the leading law firm in Mexico, recognized for delivering exceptional legal services, fostering talent, and making a positive impact in our community.",
    missionTitle: "Mission",
    missionText: "To provide our clients with the highest quality legal counsel, combining deep expertise with innovative solutions and an unwavering commitment to their success.",
    valuesTitle: "Our Values",
  },
  es: {
    eyebrow: "ACERCA DE NOSOTROS",
    sectionTitle: "ACERCA DE NOSOTROS",
    visionTitle: "Visión",
    visionText: "Ser la firma de abogados líder en México, reconocida por brindar servicios legales excepcionales, fomentar el talento y generar un impacto positivo en nuestra comunidad.",
    missionTitle: "Misión",
    missionText: "Proporcionar a nuestros clientes asesoría legal de la más alta calidad, combinando profunda experiencia con soluciones innovadoras y un compromiso inquebrantable con su éxito.",
    valuesTitle: "Nuestros Valores",
  },
  de: {
    eyebrow: "ÜBER UNS",
    sectionTitle: "ÜBER UNS",
    visionTitle: "Vision",
    visionText: "Die führende Anwaltskanzlei in Mexiko zu sein, anerkannt für die Bereitstellung außergewöhnlicher Rechtsdienstleistungen, die Förderung von Talenten und einen positiven Einfluss auf unsere Gemeinschaft.",
    missionTitle: "Mission",
    missionText: "Unseren Mandanten Rechtsberatung höchster Qualität zu bieten, die tiefgreifende Expertise mit innovativen Lösungen und einem unerschütterlichen Engagement für ihren Erfolg verbindet.",
    valuesTitle: "Unsere Werte",
  },
  zh: {
    eyebrow: "关于我们",
    sectionTitle: "关于我们",
    visionTitle: "愿景",
    visionText: "成为墨西哥领先的律师事务所，以提供卓越的法律服务、培养人才和对社区产生积极影响而闻名。",
    missionTitle: "使命",
    missionText: "为客户提供最高质量的法律顾问服务，将深厚的专业知识与创新解决方案相结合，坚定不移地致力于客户的成功。",
    valuesTitle: "我们的价值观",
  },
  ko: {
    eyebrow: "회사 소개",
    sectionTitle: "회사 소개",
    visionTitle: "비전",
    visionText: "탁월한 법률 서비스 제공, 인재 육성, 지역사회에 긍정적인 영향을 미치는 것으로 인정받는 멕시코 최고의 법률 사무소가 되는 것입니다.",
    missionTitle: "미션",
    missionText: "깊은 전문성과 혁신적인 솔루션, 그리고 고객의 성공에 대한 확고한 헌신을 결합하여 최고 품질의 법률 자문을 제공합니다.",
    valuesTitle: "우리의 가치",
  },
  ja: {
    eyebrow: "私たちについて",
    sectionTitle: "私たちについて",
    visionTitle: "ビジョン",
    visionText: "卓越した法的サービスの提供、才能の育成、コミュニティへの積極的な貢献で認められる、メキシコを代表する法律事務所になること。",
    missionTitle: "ミッション",
    missionText: "深い専門知識と革新的なソリューション、そしてクライアントの成功への揺るぎないコミットメントを組み合わせた最高品質の法的助言をクライアントに提供すること。",
    valuesTitle: "私たちの価値観",
  },
  ar: {
    eyebrow: "من نحن",
    sectionTitle: "من نحن",
    visionTitle: "الرؤية",
    visionText: "أن نكون شركة المحاماة الرائدة في المكسيك، معترف بها لتقديم خدمات قانونية استثنائية، وتعزيز المواهب، وإحداث تأثير إيجابي في مجتمعنا.",
    missionTitle: "المهمة",
    missionText: "تزويد عملائنا بأعلى جودة من الاستشارات القانونية، مع الجمع بين الخبرة العميقة والحلول المبتكرة والالتزام الراسخ بنجاحهم.",
    valuesTitle: "قيمنا",
  },
  ru: {
    eyebrow: "О НАС",
    sectionTitle: "О НАС",
    visionTitle: "Видение",
    visionText: "Быть ведущей юридической фирмой в Мексике, признанной за предоставление исключительных юридических услуг, развитие талантов и положительное влияние на наше сообщество.",
    missionTitle: "Миссия",
    missionText: "Предоставлять нашим клиентам юридические консультации высочайшего качества, сочетая глубокую экспертизу с инновационными решениями и непоколебимую приверженность их успеху.",
    valuesTitle: "Наши ценности",
  },
  fr: {
    eyebrow: "À PROPOS DE NOUS",
    sectionTitle: "À PROPOS DE NOUS",
    visionTitle: "Vision",
    visionText: "Être le cabinet d'avocats leader au Mexique, reconnu pour fournir des services juridiques exceptionnels, favoriser les talents et avoir un impact positif dans notre communauté.",
    missionTitle: "Mission",
    missionText: "Fournir à nos clients des conseils juridiques de la plus haute qualité, combinant une expertise approfondie avec des solutions innovantes et un engagement indéfectible envers leur succès.",
    valuesTitle: "Nos valeurs",
  },
  it: {
    eyebrow: "CHI SIAMO",
    sectionTitle: "CHI SIAMO",
    visionTitle: "Visione",
    visionText: "Essere lo studio legale leader in Messico, riconosciuto per la fornitura di servizi legali eccezionali, la promozione dei talenti e un impatto positivo nella nostra comunità.",
    missionTitle: "Missione",
    missionText: "Fornire ai nostri clienti consulenza legale della massima qualità, combinando profonda competenza con soluzioni innovative e un impegno incrollabile per il loro successo.",
    valuesTitle: "I nostri valori",
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const valueVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function AboutUsSection() {
  const { language } = useLanguage();
  const t = content[language] || content.es;

  const getValueName = (v: ValueItem) => v[language] || v.en;
  const getValueDesc = (v: ValueItem) =>
    (v as Record<string, string>)[`desc_${language}`] || v.desc_en;

  const featureCards = [
    { icon: Eye, title: t.visionTitle, text: t.visionText, testId: "subsection-vision" },
    { icon: Target, title: t.missionTitle, text: t.missionText, testId: "subsection-mission" },
  ];

  return (
    <section
      id="about-us"
      className="py-20 lg:py-28 bg-background"
      data-testid="section-about-us"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p
            className="text-primary text-[10px] tracking-[0.28em] uppercase mb-4"
            data-testid="text-about-us-eyebrow"
          >
            {t.eyebrow}
          </p>
          <h2
            className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight mb-5"
            data-testid="text-about-us-title"
          >
            {t.sectionTitle}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-px bg-primary" />
            <div className="w-2 h-2 bg-primary rotate-45" />
            <div className="w-10 h-px bg-primary" />
          </div>
        </motion.div>

        {/* Vision + Mission feature cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-16"
        >
          {featureCards.map(({ icon: Icon, title, text, testId }) => (
            <motion.div
              key={testId}
              variants={cardVariants}
              className="group bg-card border border-border rounded-none p-8 lg:p-10 flex flex-col gap-6"
              data-testid={testId}
            >
              {/* Icon circle */}
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col justify-center pt-1">
                  <div className="w-6 h-px bg-primary mb-2" />
                  <h3
                    className="font-heading font-light uppercase tracking-[0.12em] text-base lg:text-lg text-foreground"
                    data-testid={`text-${testId}-title`}
                  >
                    {title}
                  </h3>
                </div>
              </div>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                data-testid={`text-${testId}-content`}
              >
                {text}
              </p>
              {/* Bottom accent */}
              <div className="mt-auto pt-4 border-t border-border">
                <div className="w-8 h-0.5 bg-primary/40 group-hover:w-16 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
          data-testid="subsection-values"
        >
          <div className="w-6 h-px bg-primary mb-4 mx-auto" />
          <h3
            className="font-heading font-light uppercase tracking-[0.12em] text-base lg:text-lg text-foreground"
            data-testid="text-values-title"
          >
            {t.valuesTitle}
          </h3>
        </motion.div>

        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-6"
          data-testid="values-grid"
        >
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.en}
                custom={i}
                variants={valueVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0 } }}
                className="group relative bg-[#1a1a19] dark:bg-card rounded-none p-8 flex flex-col items-center text-center gap-4 overflow-visible cursor-default"
                data-testid={`value-item-${i}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary group-hover:h-1.5 transition-all duration-300" />
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mt-2 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </div>
                <div className="w-5 h-px bg-primary/40 group-hover:w-8 transition-all duration-500" />
                <span
                  className="text-xs md:text-sm font-medium uppercase tracking-[0.12em] text-white/90 dark:text-foreground leading-tight"
                  data-testid={`text-value-${i}`}
                >
                  {getValueName(value)}
                </span>
                <p
                  className="text-xs text-white/60 dark:text-muted-foreground leading-relaxed"
                  data-testid={`text-value-desc-${i}`}
                >
                  {getValueDesc(value)}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
