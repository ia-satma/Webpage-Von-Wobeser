import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";

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
    eyebrow: "SOCIAL RESPONSIBILITY",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra is committed to providing legal services to those who need them most. Our pro bono program allows us to give back to the community and support organizations and individuals who cannot afford legal representation.",
    buttonText: "SEE MORE",
    pillars: [
      { label: "Access to Justice", desc: "Legal representation for those who need it most, regardless of economic means." },
      { label: "Community Support", desc: "Collaboration with civil society organizations and non-profits." },
      { label: "Social Commitment", desc: "Giving back to the community with our expertise and dedication." },
    ],
  },
  es: {
    eyebrow: "RESPONSABILIDAD SOCIAL",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra está comprometido a brindar servicios legales a quienes más los necesitan. Nuestro programa pro bono nos permite retribuir a la comunidad y apoyar a organizaciones e individuos que no pueden costear representación legal.",
    buttonText: "VER MÁS",
    pillars: [
      { label: "Acceso a la Justicia", desc: "Representación legal para quienes más lo necesitan, sin importar sus medios económicos." },
      { label: "Apoyo Comunitario", desc: "Colaboración con organizaciones de la sociedad civil y sin fines de lucro." },
      { label: "Compromiso Social", desc: "Retribuyendo a la comunidad con nuestra experiencia y dedicación." },
    ],
  },
  de: {
    eyebrow: "SOZIALE VERANTWORTUNG",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra setzt sich dafür ein, Rechtsdienstleistungen für diejenigen bereitzustellen, die sie am meisten benötigen. Unser Pro-Bono-Programm ermöglicht es uns, der Gemeinschaft etwas zurückzugeben und Organisationen sowie Einzelpersonen zu unterstützen, die sich keine rechtliche Vertretung leisten können.",
    buttonText: "MEHR ERFAHREN",
    pillars: [
      { label: "Zugang zur Justiz", desc: "Rechtliche Vertretung für diejenigen, die sie am meisten benötigen." },
      { label: "Gemeinschaftliche Unterstützung", desc: "Zusammenarbeit mit zivilgesellschaftlichen Organisationen." },
      { label: "Soziales Engagement", desc: "Der Gemeinschaft mit unserem Fachwissen etwas zurückgeben." },
    ],
  },
  zh: {
    eyebrow: "社会责任",
    title: "公益法律服务",
    text: "Von Wobeser y Sierra 致力于为最需要法律服务的人提供帮助。我们的公益项目让我们能够回馈社会，支持那些无力承担法律代理费用的组织和个人。",
    buttonText: "了解更多",
    pillars: [
      { label: "司法公正", desc: "为最需要的人提供法律代理，不论经济能力。" },
      { label: "社区支持", desc: "与公民社会组织和非营利机构合作。" },
      { label: "社会承诺", desc: "以我们的专业知识和奉献精神回馈社会。" },
    ],
  },
  ko: {
    eyebrow: "사회적 책임",
    title: "프로보노",
    text: "Von Wobeser y Sierra는 가장 필요로 하는 분들에게 법률 서비스를 제공하기 위해 최선을 다하고 있습니다. 프로보노 프로그램을 통해 지역 사회에 환원하고 법률 대리를 감당할 수 없는 조직과 개인을 지원합니다.",
    buttonText: "자세히 보기",
    pillars: [
      { label: "사법 접근성", desc: "경제적 능력에 관계없이 가장 필요한 분들을 위한 법률 대리." },
      { label: "지역사회 지원", desc: "시민 사회 단체 및 비영리 기관과의 협력." },
      { label: "사회적 헌신", desc: "전문성과 헌신으로 지역사회에 환원합니다." },
    ],
  },
  ja: {
    eyebrow: "社会的責任",
    title: "プロボノ",
    text: "Von Wobeser y Sierraは、最も必要としている方々に法的サービスを提供することに尽力しています。プロボノプログラムを通じて、コミュニティに還元し、法的代理を受ける余裕のない組織や個人を支援しています。",
    buttonText: "詳細を見る",
    pillars: [
      { label: "司法へのアクセス", desc: "経済的手段に関わらず、最も必要な方々への法的代理。" },
      { label: "コミュニティ支援", desc: "市民社会組織や非営利団体との連携。" },
      { label: "社会的コミットメント", desc: "専門知識と献身でコミュニティに還元する。" },
    ],
  },
  ar: {
    eyebrow: "المسؤولية الاجتماعية",
    title: "العمل التطوعي القانوني",
    text: "تلتزم Von Wobeser y Sierra بتقديم الخدمات القانونية لمن هم في أمس الحاجة إليها. يتيح لنا برنامج العمل التطوعي القانوني رد الجميل للمجتمع ودعم المنظمات والأفراد الذين لا يستطيعون تحمل تكاليف التمثيل القانوني.",
    buttonText: "اعرف المزيد",
    pillars: [
      { label: "الوصول إلى العدالة", desc: "التمثيل القانوني لمن يحتاجونه أكثر، بصرف النظر عن إمكاناتهم الاقتصادية." },
      { label: "دعم المجتمع", desc: "التعاون مع منظمات المجتمع المدني وغير الربحية." },
      { label: "الالتزام الاجتماعي", desc: "إعادة العطاء للمجتمع بخبرتنا وتفانينا." },
    ],
  },
  ru: {
    eyebrow: "СОЦИАЛЬНАЯ ОТВЕТСТВЕННОСТЬ",
    title: "ПРО БОНО",
    text: "Von Wobeser y Sierra стремится предоставлять юридические услуги тем, кто в них больше всего нуждается. Наша программа pro bono позволяет нам отдавать долг обществу и поддерживать организации и частных лиц, которые не могут позволить себе юридическое представительство.",
    buttonText: "ПОДРОБНЕЕ",
    pillars: [
      { label: "Доступ к Правосудию", desc: "Юридическое представительство для тех, кто нуждается в нём больше всего." },
      { label: "Поддержка Сообщества", desc: "Сотрудничество с организациями гражданского общества." },
      { label: "Социальная Ответственность", desc: "Возвращение долга обществу с помощью нашей экспертизы." },
    ],
  },
  fr: {
    eyebrow: "RESPONSABILITÉ SOCIALE",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra s'engage à fournir des services juridiques à ceux qui en ont le plus besoin. Notre programme pro bono nous permet de redonner à la communauté et de soutenir les organisations et les individus qui ne peuvent pas se permettre une représentation juridique.",
    buttonText: "EN SAVOIR PLUS",
    pillars: [
      { label: "Accès à la Justice", desc: "Représentation juridique pour ceux qui en ont le plus besoin." },
      { label: "Soutien Communautaire", desc: "Collaboration avec les organisations de la société civile." },
      { label: "Engagement Social", desc: "Redonner à la communauté avec notre expertise et notre dévouement." },
    ],
  },
  it: {
    eyebrow: "RESPONSABILITÀ SOCIALE",
    title: "PRO BONO",
    text: "Von Wobeser y Sierra si impegna a fornire servizi legali a chi ne ha più bisogno. Il nostro programma pro bono ci permette di restituire alla comunità e supportare organizzazioni e individui che non possono permettersi una rappresentanza legale.",
    buttonText: "SCOPRI DI PIÙ",
    pillars: [
      { label: "Accesso alla Giustizia", desc: "Rappresentanza legale per chi ne ha più bisogno, indipendentemente dai mezzi economici." },
      { label: "Supporto Comunitario", desc: "Collaborazione con organizzazioni della società civile e senza scopo di lucro." },
      { label: "Impegno Sociale", desc: "Restituire alla comunità con la nostra competenza e dedizione." },
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

export default function ProBonoSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      className="bg-muted border-t border-border overflow-hidden"
      data-testid="section-pro-bono"
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[480px]">

        {/* Red panel — mobile: top banner (order-first), desktop: right 40% (order-last) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#AA1A2E] flex items-center justify-center px-10 py-14 lg:py-0 h-[180px] lg:h-auto lg:w-2/5 shrink-0 order-first lg:order-last"
          data-testid="panel-probono-red"
        >
          <h2
            className="font-heading font-light text-3xl lg:text-4xl xl:text-5xl text-white uppercase tracking-[0.12em] leading-tight text-center"
            data-testid="text-pro-bono-title"
          >
            {t.title}
          </h2>
        </motion.div>

        {/* Content panel — desktop: left 60% */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-14 lg:py-16 lg:w-3/5 order-last lg:order-first">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <div className="w-8 h-px bg-[#AA1A2E] mb-5" />
            <p
              className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase mb-4"
              data-testid="text-pro-bono-eyebrow"
            >
              {t.eyebrow}
            </p>
            <h2
              className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight mb-5"
              data-testid="text-pro-bono-title-content"
            >
              {t.title}
            </h2>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-pro-bono-description"
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
            className="mb-8 space-y-0"
          >
            {t.pillars.map((pillar, i) => (
              <motion.div
                key={i}
                variants={pillarItem}
                className="border-t border-border pt-4 pb-4"
                data-testid={`pillar-probono-${i}`}
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
      </div>
    </section>
  );
}
