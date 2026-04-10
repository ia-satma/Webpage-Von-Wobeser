import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";
import officePhoto from "@assets/collage_06.jpg";

type Pillar = { label: string; desc: string };

type ContentItem = {
  eyebrow: string;
  title: string;
  text: string;
  buttonText: string;
  pillars: Pillar[];
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    eyebrow: "OUR COMMITMENT",
    title: "DIVERSITY & INCLUSION",
    text: "At Von Wobeser y Sierra, we believe that diversity is a source of strength and innovation. We are committed to creating an inclusive environment where all individuals can thrive and contribute their unique perspectives to our practice.",
    buttonText: "SEE MORE",
    pillars: [
      { label: "Gender Parity", desc: "Equal opportunities for all talent, at every level of the firm." },
      { label: "Inclusive Culture", desc: "An environment where every voice is heard and valued." },
      { label: "Diverse Perspectives", desc: "Different viewpoints that enrich and strengthen our practice." },
    ],
  },
  es: {
    eyebrow: "NUESTRO COMPROMISO",
    title: "DIVERSIDAD E INCLUSIÓN",
    text: "En Von Wobeser y Sierra, creemos que la diversidad es fuente de fortaleza e innovación. Estamos comprometidos a crear un entorno inclusivo donde todos los individuos puedan prosperar y contribuir con sus perspectivas únicas a nuestra práctica.",
    buttonText: "VER MÁS",
    pillars: [
      { label: "Paridad de Género", desc: "Igualdad de oportunidades para todo el talento, en todos los niveles." },
      { label: "Cultura Inclusiva", desc: "Un entorno donde cada voz es escuchada y valorada." },
      { label: "Perspectivas Diversas", desc: "Distintas miradas que enriquecen y fortalecen nuestra práctica." },
    ],
  },
  de: {
    eyebrow: "UNSER ENGAGEMENT",
    title: "VIELFALT & INKLUSION",
    text: "Bei Von Wobeser y Sierra glauben wir, dass Vielfalt eine Quelle von Stärke und Innovation ist. Wir sind bestrebt, ein inklusives Umfeld zu schaffen, in dem alle Menschen gedeihen und ihre einzigartigen Perspektiven in unsere Praxis einbringen können.",
    buttonText: "MEHR ERFAHREN",
    pillars: [
      { label: "Geschlechterparität", desc: "Gleiche Chancen für alle Talente auf jeder Ebene der Kanzlei." },
      { label: "Inklusive Kultur", desc: "Ein Umfeld, in dem jede Stimme gehört und geschätzt wird." },
      { label: "Diverse Perspektiven", desc: "Unterschiedliche Sichtweisen, die unsere Praxis bereichern." },
    ],
  },
  zh: {
    eyebrow: "我们的承诺",
    title: "多元化与包容性",
    text: "在Von Wobeser y Sierra，我们相信多元化是力量和创新的源泉。我们致力于创造一个包容的环境，让所有人都能蓬勃发展，并将其独特的观点贡献给我们的实践。",
    buttonText: "了解更多",
    pillars: [
      { label: "性别平等", desc: "在各级别为所有人才提供平等机会。" },
      { label: "包容文化", desc: "每个声音都被倾听和尊重的环境。" },
      { label: "多元视角", desc: "丰富和强化我们实践的不同观点。" },
    ],
  },
  ko: {
    eyebrow: "우리의 약속",
    title: "다양성 및 포용성",
    text: "Von Wobeser y Sierra에서 우리는 다양성이 힘과 혁신의 원천이라고 믿습니다. 모든 개인이 번영하고 고유한 관점을 우리의 업무에 기여할 수 있는 포용적인 환경을 조성하기 위해 최선을 다하고 있습니다.",
    buttonText: "자세히 보기",
    pillars: [
      { label: "성별 평등", desc: "모든 직급에서 모든 인재에게 동등한 기회를 제공합니다." },
      { label: "포용적 문화", desc: "모든 목소리가 경청되고 존중받는 환경." },
      { label: "다양한 관점", desc: "우리의 업무를 풍요롭게 하는 다양한 시각." },
    ],
  },
  ja: {
    eyebrow: "私たちの取り組み",
    title: "ダイバーシティとインクルージョン",
    text: "Von Wobeser y Sierraでは、多様性が強さとイノベーションの源であると信じています。すべての個人が成長し、独自の視点を私たちの実践に貢献できるインクルーシブな環境の創造に取り組んでいます。",
    buttonText: "詳細を見る",
    pillars: [
      { label: "ジェンダー平等", desc: "あらゆるレベルですべての人材に平等な機会を。" },
      { label: "インクルーシブな文化", desc: "すべての声が聞かれ、大切にされる環境。" },
      { label: "多様な視点", desc: "私たちの実践を豊かにするさまざまな視点。" },
    ],
  },
  ar: {
    eyebrow: "التزامنا",
    title: "التنوع والشمول",
    text: "في Von Wobeser y Sierra، نؤمن بأن التنوع هو مصدر للقوة والابتكار. نحن ملتزمون بخلق بيئة شاملة حيث يمكن لجميع الأفراد الازدهار والمساهمة بوجهات نظرهم الفريدة في ممارستنا.",
    buttonText: "اعرف المزيد",
    pillars: [
      { label: "المساواة بين الجنسين", desc: "فرص متكافئة لجميع المواهب في كل المستويات." },
      { label: "ثقافة شاملة", desc: "بيئة يُسمع فيها كل صوت ويُقدَّر." },
      { label: "وجهات نظر متنوعة", desc: "رؤى مختلفة تثري ممارستنا وتقويها." },
    ],
  },
  ru: {
    eyebrow: "НАШЕ ОБЯЗАТЕЛЬСТВО",
    title: "РАЗНООБРАЗИЕ И ИНКЛЮЗИВНОСТЬ",
    text: "В Von Wobeser y Sierra мы верим, что разнообразие является источником силы и инноваций. Мы стремимся создать инклюзивную среду, где все люди могут процветать и вносить свои уникальные перспективы в нашу практику.",
    buttonText: "ПОДРОБНЕЕ",
    pillars: [
      { label: "Гендерное Равенство", desc: "Равные возможности для всех талантов на каждом уровне." },
      { label: "Инклюзивная Культура", desc: "Среда, где каждый голос услышан и ценится." },
      { label: "Разные Перспективы", desc: "Различные точки зрения, обогащающие нашу практику." },
    ],
  },
  fr: {
    eyebrow: "NOTRE ENGAGEMENT",
    title: "DIVERSITÉ ET INCLUSION",
    text: "Chez Von Wobeser y Sierra, nous croyons que la diversité est une source de force et d'innovation. Nous nous engageons à créer un environnement inclusif où tous les individus peuvent s'épanouir et apporter leurs perspectives uniques à notre pratique.",
    buttonText: "EN SAVOIR PLUS",
    pillars: [
      { label: "Parité de Genre", desc: "L'égalité des chances pour tous les talents, à chaque niveau." },
      { label: "Culture Inclusive", desc: "Un environnement où chaque voix est entendue et valorisée." },
      { label: "Perspectives Diverses", desc: "Des points de vue différents qui enrichissent notre pratique." },
    ],
  },
  it: {
    eyebrow: "IL NOSTRO IMPEGNO",
    title: "DIVERSITÀ E INCLUSIONE",
    text: "In Von Wobeser y Sierra, crediamo che la diversità sia una fonte di forza e innovazione. Ci impegniamo a creare un ambiente inclusivo dove tutti gli individui possano prosperare e contribuire con le loro prospettive uniche alla nostra pratica.",
    buttonText: "SCOPRI DI PIÙ",
    pillars: [
      { label: "Parità di Genere", desc: "Pari opportunità per tutti i talenti, a ogni livello." },
      { label: "Cultura Inclusiva", desc: "Un ambiente dove ogni voce è ascoltata e valorizzata." },
      { label: "Prospettive Diverse", desc: "Punti di vista differenti che arricchiscono la nostra pratica." },
    ],
  },
};

const pillarVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const pillarItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DiversityInclusionSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      className="bg-muted border-t border-border overflow-hidden"
      data-testid="section-diversity-inclusion"
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[400px]">

        {/* Photo panel — mobile: top banner h-[220px], desktop: left 40% */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[220px] lg:h-auto lg:w-2/5 shrink-0 overflow-hidden"
          data-testid="panel-diversity-photo"
        >
          {/* Photo */}
          <img
            src={officePhoto}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center grayscale"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Red tint gradient from bottom */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(170,26,46,0.45) 0%, rgba(170,26,46,0.1) 50%, transparent 100%)" }}
          />
          {/* Title on photo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-8 h-px bg-white/60 mb-4" />
            <h2
              className="font-heading font-light text-2xl lg:text-3xl xl:text-4xl text-white uppercase tracking-[0.12em] leading-tight"
              data-testid="text-diversity-inclusion-title"
            >
              {t.title}
            </h2>
            <div className="w-8 h-px bg-[#AA1A2E]/80 mt-4" />
          </div>
        </motion.div>

        {/* Content panel — desktop: right 60% */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-12 lg:py-14 lg:w-3/5">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6"
          >
            <div className="w-8 h-px bg-[#AA1A2E] mb-5" />
            <p
              className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase mb-5"
              data-testid="text-diversity-inclusion-eyebrow"
            >
              {t.eyebrow}
            </p>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-diversity-inclusion-description"
            >
              {t.text}
            </p>
          </motion.div>

          {/* Pillars */}
          <motion.div
            variants={pillarVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-8"
          >
            {t.pillars.map((pillar, i) => (
              <motion.div
                key={i}
                variants={pillarItem}
                className="border-t border-border pt-4 pb-4"
                data-testid={`pillar-diversity-${i}`}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground mb-1">
                  {pillar.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/diversity-inclusion">
              <Button
                variant="default"
                className="rounded-none uppercase tracking-[0.15em] px-8"
                data-testid="button-diversity-inclusion-see-more"
              >
                {t.buttonText}
              </Button>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
