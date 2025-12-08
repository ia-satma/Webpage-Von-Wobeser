import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";

type ContentItem = {
  title: string;
  text: string;
  buttonText: string;
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    title: "DIVERSITY & INCLUSION",
    text: "At Von Wobeser y Sierra, we believe that diversity is a source of strength and innovation. We are committed to creating an inclusive environment where all individuals can thrive and contribute their unique perspectives to our practice.",
    buttonText: "SEE MORE",
  },
  es: {
    title: "DIVERSIDAD E INCLUSIÓN",
    text: "En Von Wobeser y Sierra, creemos que la diversidad es fuente de fortaleza e innovación. Estamos comprometidos a crear un entorno inclusivo donde todos los individuos puedan prosperar y contribuir con sus perspectivas únicas a nuestra práctica.",
    buttonText: "VER MÁS",
  },
  de: {
    title: "VIELFALT & INKLUSION",
    text: "Bei Von Wobeser y Sierra glauben wir, dass Vielfalt eine Quelle von Stärke und Innovation ist. Wir sind bestrebt, ein inklusives Umfeld zu schaffen, in dem alle Menschen gedeihen und ihre einzigartigen Perspektiven in unsere Praxis einbringen können.",
    buttonText: "MEHR ERFAHREN",
  },
  zh: {
    title: "多元化与包容性",
    text: "在Von Wobeser y Sierra，我们相信多元化是力量和创新的源泉。我们致力于创造一个包容的环境，让所有人都能蓬勃发展，并将其独特的观点贡献给我们的实践。",
    buttonText: "了解更多",
  },
  ko: {
    title: "다양성 및 포용성",
    text: "Von Wobeser y Sierra에서 우리는 다양성이 힘과 혁신의 원천이라고 믿습니다. 모든 개인이 번영하고 고유한 관점을 우리의 업무에 기여할 수 있는 포용적인 환경을 조성하기 위해 최선을 다하고 있습니다.",
    buttonText: "자세히 보기",
  },
  ja: {
    title: "ダイバーシティとインクルージョン",
    text: "Von Wobeser y Sierraでは、多様性が強さとイノベーションの源であると信じています。すべての個人が成長し、独自の視点を私たちの実践に貢献できるインクルーシブな環境の創造に取り組んでいます。",
    buttonText: "詳細を見る",
  },
  ar: {
    title: "التنوع والشمول",
    text: "في Von Wobeser y Sierra، نؤمن بأن التنوع هو مصدر للقوة والابتكار. نحن ملتزمون بخلق بيئة شاملة حيث يمكن لجميع الأفراد الازدهار والمساهمة بوجهات نظرهم الفريدة في ممارستنا.",
    buttonText: "اعرف المزيد",
  },
  ru: {
    title: "РАЗНООБРАЗИЕ И ИНКЛЮЗИВНОСТЬ",
    text: "В Von Wobeser y Sierra мы верим, что разнообразие является источником силы и инноваций. Мы стремимся создать инклюзивную среду, где все люди могут процветать и вносить свои уникальные перспективы в нашу практику.",
    buttonText: "ПОДРОБНЕЕ",
  },
  fr: {
    title: "DIVERSITÉ ET INCLUSION",
    text: "Chez Von Wobeser y Sierra, nous croyons que la diversité est une source de force et d'innovation. Nous nous engageons à créer un environnement inclusif où tous les individus peuvent s'épanouir et apporter leurs perspectives uniques à notre pratique.",
    buttonText: "EN SAVOIR PLUS",
  },
  it: {
    title: "DIVERSITÀ E INCLUSIONE",
    text: "In Von Wobeser y Sierra, crediamo che la diversità sia una fonte di forza e innovazione. Ci impegniamo a creare un ambiente inclusivo dove tutti gli individui possano prosperare e contribuire con le loro prospettive uniche alla nostra pratica.",
    buttonText: "SCOPRI DI PIÙ",
  },
};

export default function DiversityInclusionSection() {
  const { language } = useLanguage();

  const t = content[language] || content.en;

  return (
    <section
      className="py-20 lg:py-32 bg-white dark:bg-gray-900"
      data-testid="section-diversity-inclusion"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-heading font-light uppercase tracking-wide text-[#AC162C] mb-8"
          data-testid="text-diversity-inclusion-title"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-serif text-gray-600 dark:text-gray-300 leading-relaxed mb-10"
          data-testid="text-diversity-inclusion-description"
        >
          {t.text}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/diversity-inclusion">
            <Button
              size="lg"
              className="px-8 py-4 bg-[#AC162C] hover:bg-[#841A1A] text-white uppercase tracking-wide"
              data-testid="button-diversity-inclusion-see-more"
            >
              {t.buttonText}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
