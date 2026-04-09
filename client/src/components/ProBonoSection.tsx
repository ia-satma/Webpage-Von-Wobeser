import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";

type ContentItem = {
  eyebrow: string;
  title: string;
  text: string;
  buttonText: string;
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    eyebrow: "SOCIAL RESPONSIBILITY",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra is committed to providing legal services to those who need them most. Our pro bono program allows us to give back to the community and support organizations and individuals who cannot afford legal representation.",
    buttonText: "SEE MORE",
  },
  es: {
    eyebrow: "RESPONSABILIDAD SOCIAL",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra está comprometido a brindar servicios legales a quienes más los necesitan. Nuestro programa pro bono nos permite retribuir a la comunidad y apoyar a organizaciones e individuos que no pueden costear representación legal.",
    buttonText: "VER MÁS",
  },
  de: {
    eyebrow: "SOZIALE VERANTWORTUNG",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra setzt sich dafür ein, Rechtsdienstleistungen für diejenigen bereitzustellen, die sie am meisten benötigen. Unser Pro-Bono-Programm ermöglicht es uns, der Gemeinschaft etwas zurückzugeben und Organisationen sowie Einzelpersonen zu unterstützen, die sich keine rechtliche Vertretung leisten können.",
    buttonText: "MEHR ERFAHREN",
  },
  zh: {
    eyebrow: "社会责任",
    title: "公益法律服务",
    text: "Von Wobeser y Sierra 致力于为最需要法律服务的人提供帮助。我们的公益项目让我们能够回馈社会，支持那些无力承担法律代理费用的组织和个人。",
    buttonText: "了解更多",
  },
  ko: {
    eyebrow: "사회적 책임",
    title: "프로보노",
    text: "Von Wobeser y Sierra는 가장 필요로 하는 분들에게 법률 서비스를 제공하기 위해 최선을 다하고 있습니다. 프로보노 프로그램을 통해 지역 사회에 환원하고 법률 대리를 감당할 수 없는 조직과 개인을 지원합니다.",
    buttonText: "자세히 보기",
  },
  ja: {
    eyebrow: "社会的責任",
    title: "プロボノ",
    text: "Von Wobeser y Sierraは、最も必要としている方々に法的サービスを提供することに尽力しています。プロボノプログラムを通じて、コミュニティに還元し、法的代理を受ける余裕のない組織や個人を支援しています。",
    buttonText: "詳細を見る",
  },
  ar: {
    eyebrow: "المسؤولية الاجتماعية",
    title: "العمل التطوعي القانوني",
    text: "تلتزم Von Wobeser y Sierra بتقديم الخدمات القانونية لمن هم في أمس الحاجة إليها. يتيح لنا برنامج العمل التطوعي القانوني رد الجميل للمجتمع ودعم المنظمات والأفراد الذين لا يستطيعون تحمل تكاليف التمثيل القانوني.",
    buttonText: "اعرف المزيد",
  },
  ru: {
    eyebrow: "СОЦИАЛЬНАЯ ОТВЕТСТВЕННОСТЬ",
    title: "ПРО БОНО",
    text: "Von Wobeser y Sierra стремится предоставлять юридические услуги тем, кто в них больше всего нуждается. Наша программа pro bono позволяет нам отдавать долг обществу и поддерживать организации и частных лиц, которые не могут позволить себе юридическое представительство.",
    buttonText: "ПОДРОБНЕЕ",
  },
  fr: {
    eyebrow: "RESPONSABILITÉ SOCIALE",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra s'engage à fournir des services juridiques à ceux qui en ont le plus besoin. Notre programme pro bono nous permet de redonner à la communauté et de soutenir les organisations et les individus qui ne peuvent pas se permettre une représentation juridique.",
    buttonText: "EN SAVOIR PLUS",
  },
  it: {
    eyebrow: "RESPONSABILITÀ SOCIALE",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra si impegna a fornire servizi legali a chi ne ha più bisogno. Il nostro programma pro bono ci permette di restituire alla comunità e supportare organizzazioni e individui che non possono permettersi una rappresentanza legale.",
    buttonText: "SCOPRI DI PIÙ",
  },
};

export default function ProBonoSection() {
  const { language } = useLanguage();

  const t = content[language] || content.en;

  return (
    <section
      className="py-20 lg:py-28 bg-muted"
      data-testid="section-pro-bono"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-12 h-px bg-primary mb-6 mx-auto" />
          <p
            className="text-primary text-[10px] tracking-[0.25em] uppercase mb-4"
            data-testid="text-pro-bono-eyebrow"
          >
            {t.eyebrow}
          </p>
          <h2
            className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight"
            data-testid="text-pro-bono-title"
          >
            {t.title}
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm text-muted-foreground leading-relaxed text-justify max-w-4xl mx-auto mb-10"
          data-testid="text-pro-bono-description"
        >
          {t.text}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/pro-bono">
            <Button
              variant="default"
              className="rounded-none uppercase tracking-[0.15em] px-8"
              data-testid="button-pro-bono-see-more"
            >
              {t.buttonText}
            </Button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
