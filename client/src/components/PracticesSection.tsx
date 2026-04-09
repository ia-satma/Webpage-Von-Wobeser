import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";

interface PracticeArea {
  id: number;
  nameEn: string;
  nameEs: string;
  nameDe: string;
  nameZh: string;
  nameKo: string;
  nameJa: string;
  nameAr: string;
  nameRu: string;
  nameFr: string;
  nameIt: string;
  slug: string;
}

const practiceAreas: PracticeArea[] = [
  { id: 1, nameEn: "Corporate, Mergers & Acquisitions", nameEs: "Corporativo, Fusiones y Adquisiciones", nameDe: "Gesellschaftsrecht, Fusionen & Übernahmen", nameZh: "公司、并购", nameKo: "기업, 인수합병", nameJa: "企業、M&A", nameAr: "الشركات والاندماج والاستحواذ", nameRu: "Корпоративное право, слияния и поглощения", nameFr: "Droit des sociétés, Fusions & Acquisitions", nameIt: "Societario, Fusioni e Acquisizioni", slug: "corporate-ma" },
  { id: 2, nameEn: "Antitrust & Competition", nameEs: "Competencia Económica", nameDe: "Kartell- & Wettbewerbsrecht", nameZh: "反垄断与竞争", nameKo: "독점금지 및 경쟁", nameJa: "独占禁止法・競争法", nameAr: "مكافحة الاحتكار والمنافسة", nameRu: "Антимонопольное и конкурентное право", nameFr: "Droit de la concurrence", nameIt: "Antitrust e Concorrenza", slug: "antitrust-competition" },
  { id: 3, nameEn: "Arbitration", nameEs: "Arbitraje", nameDe: "Schiedsverfahren", nameZh: "仲裁", nameKo: "중재", nameJa: "仲裁", nameAr: "التحكيم", nameRu: "Арбитраж", nameFr: "Arbitrage", nameIt: "Arbitrato", slug: "arbitration" },
  { id: 4, nameEn: "Litigation", nameEs: "Litigio", nameDe: "Prozessführung", nameZh: "诉讼", nameKo: "소송", nameJa: "訴訟", nameAr: "التقاضي", nameRu: "Судебные споры", nameFr: "Contentieux", nameIt: "Contenzioso", slug: "litigation" },
  { id: 5, nameEn: "Investigations, Anti-corruption & Compliance", nameEs: "Investigaciones, Anticorrupción y Compliance", nameDe: "Ermittlungen, Korruptionsbekämpfung & Compliance", nameZh: "调查、反腐败与合规", nameKo: "조사, 반부패 및 컴플라이언스", nameJa: "調査、腐敗防止・コンプライアンス", nameAr: "التحقيقات ومكافحة الفساد والامتثال", nameRu: "Расследования, противодействие коррупции и комплаенс", nameFr: "Enquêtes, Anti-corruption et Conformité", nameIt: "Indagini, Anticorruzione e Compliance", slug: "investigations-anticorruption" },
  { id: 6, nameEn: "Bankruptcy & Restructuring", nameEs: "Concursos Mercantiles y Reestructuración", nameDe: "Insolvenz & Restrukturierung", nameZh: "破产与重组", nameKo: "파산 및 구조조정", nameJa: "倒産・事業再生", nameAr: "الإفلاس وإعادة الهيكلة", nameRu: "Банкротство и реструктуризация", nameFr: "Faillite et Restructuration", nameIt: "Fallimento e Ristrutturazione", slug: "bankruptcy-restructuring" },
  { id: 7, nameEn: "Banking & Finance", nameEs: "Bancario y Financiero", nameDe: "Bank- & Finanzrecht", nameZh: "银行与金融", nameKo: "은행 및 금융", nameJa: "銀行・金融", nameAr: "الخدمات المصرفية والمالية", nameRu: "Банковское дело и финансы", nameFr: "Banque et Finance", nameIt: "Bancario e Finanziario", slug: "banking-finance" },
  { id: 8, nameEn: "Energy & Natural Resources", nameEs: "Energía y Recursos Naturales", nameDe: "Energie & Natürliche Ressourcen", nameZh: "能源与自然资源", nameKo: "에너지 및 천연자원", nameJa: "エネルギー・天然資源", nameAr: "الطاقة والموارد الطبيعية", nameRu: "Энергетика и природные ресурсы", nameFr: "Énergie et Ressources Naturelles", nameIt: "Energia e Risorse Naturali", slug: "energy-natural-resources" },
  { id: 9, nameEn: "ESG (Environmental, Social & Corporate Governance)", nameEs: "ESG (Ambiental, Social y Gobierno Corporativo)", nameDe: "ESG (Umwelt, Soziales & Unternehmensführung)", nameZh: "ESG（环境、社会与公司治理）", nameKo: "ESG (환경, 사회, 기업지배구조)", nameJa: "ESG（環境・社会・ガバナンス）", nameAr: "الحوكمة البيئية والاجتماعية والمؤسسية", nameRu: "ESG (Экология, социальная ответственность, корпоративное управление)", nameFr: "ESG (Environnement, Social et Gouvernance)", nameIt: "ESG (Ambiente, Sociale e Governance)", slug: "esg" },
  { id: 10, nameEn: "Real Estate", nameEs: "Inmobiliario", nameDe: "Immobilienrecht", nameZh: "房地产", nameKo: "부동산", nameJa: "不動産", nameAr: "العقارات", nameRu: "Недвижимость", nameFr: "Immobilier", nameIt: "Immobiliare", slug: "real-estate" },
  { id: 11, nameEn: "Intellectual Property", nameEs: "Propiedad Intelectual", nameDe: "Geistiges Eigentum", nameZh: "知识产权", nameKo: "지적재산권", nameJa: "知的財産", nameAr: "الملكية الفكرية", nameRu: "Интеллектуальная собственность", nameFr: "Propriété Intellectuelle", nameIt: "Proprietà Intellettuale", slug: "intellectual-property" },
  { id: 12, nameEn: "Labor & Employment", nameEs: "Laboral", nameDe: "Arbeitsrecht", nameZh: "劳动与就业", nameKo: "노동 및 고용", nameJa: "労働・雇用", nameAr: "العمل والتوظيف", nameRu: "Трудовое право", nameFr: "Droit du Travail", nameIt: "Diritto del Lavoro", slug: "labor-employment" },
  { id: 13, nameEn: "Tax", nameEs: "Fiscal", nameDe: "Steuerrecht", nameZh: "税务", nameKo: "세무", nameJa: "税務", nameAr: "الضرائب", nameRu: "Налоговое право", nameFr: "Droit Fiscal", nameIt: "Fiscale", slug: "tax" },
  { id: 14, nameEn: "International Trade", nameEs: "Comercio Exterior", nameDe: "Internationaler Handel", nameZh: "国际贸易", nameKo: "국제무역", nameJa: "国際貿易", nameAr: "التجارة الدولية", nameRu: "Международная торговля", nameFr: "Commerce International", nameIt: "Commercio Internazionale", slug: "international-trade" },
  { id: 15, nameEn: "Telecommunications, Media & Technology", nameEs: "Telecomunicaciones, Medios y Tecnología", nameDe: "Telekommunikation, Medien & Technologie", nameZh: "电信、媒体与技术", nameKo: "통신, 미디어 및 기술", nameJa: "通信・メディア・テクノロジー", nameAr: "الاتصالات والإعلام والتكنولوجيا", nameRu: "Телекоммуникации, медиа и технологии", nameFr: "Télécommunications, Médias et Technologie", nameIt: "Telecomunicazioni, Media e Tecnologia", slug: "telecommunications-media-technology" },
  { id: 16, nameEn: "Environmental", nameEs: "Ambiental", nameDe: "Umweltrecht", nameZh: "环境", nameKo: "환경", nameJa: "環境", nameAr: "البيئة", nameRu: "Экологическое право", nameFr: "Droit de l'Environnement", nameIt: "Ambientale", slug: "environmental" },
  { id: 17, nameEn: "Administrative Law", nameEs: "Derecho Administrativo", nameDe: "Verwaltungsrecht", nameZh: "行政法", nameKo: "행정법", nameJa: "行政法", nameAr: "القانون الإداري", nameRu: "Административное право", nameFr: "Droit Administratif", nameIt: "Diritto Amministrativo", slug: "administrative-law" },
  { id: 18, nameEn: "German Desk", nameEs: "Desk Alemán", nameDe: "German Desk", nameZh: "德国服务部", nameKo: "독일 데스크", nameJa: "ジャーマンデスク", nameAr: "المكتب الألماني", nameRu: "Немецкий отдел", nameFr: "German Desk", nameIt: "German Desk", slug: "german-desk" },
];

interface PracticesContent {
  title: string;
  intro: string;
  seeMore: string;
  ctaText: string;
}

const content: Record<LanguageCode, PracticesContent> = {
  en: {
    title: "PRACTICE AREAS",
    intro: "Comprehensive legal services across 18 specialized disciplines.",
    seeMore: "SEE ALL PRACTICES",
    ctaText: "Get Legal Advice",
  },
  es: {
    title: "ÁREAS DE PRÁCTICA",
    intro: "Asesoría legal integral en 18 disciplinas especializadas.",
    seeMore: "VER TODAS LAS PRÁCTICAS",
    ctaText: "Obtener Asesoría Legal",
  },
  de: {
    title: "PRAXISBEREICHE",
    intro: "Umfassende Rechtsdienstleistungen in 18 spezialisierten Bereichen.",
    seeMore: "ALLE BEREICHE ANZEIGEN",
    ctaText: "Rechtsberatung Anfordern",
  },
  zh: {
    title: "业务领域",
    intro: "涵盖18个专业领域的综合法律服务。",
    seeMore: "查看所有业务领域",
    ctaText: "获取法律咨询",
  },
  ko: {
    title: "업무 분야",
    intro: "18개 전문 분야에 걸친 종합 법률 서비스.",
    seeMore: "모든 업무 분야 보기",
    ctaText: "법률 상담 받기",
  },
  ja: {
    title: "プラクティス分野",
    intro: "18の専門分野にわたる包括的な法律サービス。",
    seeMore: "すべての分野を見る",
    ctaText: "法律相談を受ける",
  },
  ar: {
    title: "مجالات الممارسة",
    intro: "خدمات قانونية شاملة في 18 تخصصاً متكاملاً.",
    seeMore: "عرض جميع المجالات",
    ctaText: "احصل على استشارة قانونية",
  },
  ru: {
    title: "ПРАКТИКИ",
    intro: "Комплексные юридические услуги по 18 специализациям.",
    seeMore: "ВСЕ ПРАКТИКИ",
    ctaText: "Получить консультацию",
  },
  fr: {
    title: "DOMAINES D'EXPERTISE",
    intro: "Services juridiques complets dans 18 disciplines spécialisées.",
    seeMore: "VOIR TOUS LES DOMAINES",
    ctaText: "Obtenir un Conseil Juridique",
  },
  it: {
    title: "AREE DI PRATICA",
    intro: "Servizi legali completi in 18 discipline specializzate.",
    seeMore: "VEDI TUTTE LE AREE",
    ctaText: "Richiedi Consulenza Legale",
  },
};

function getPracticeAreaName(area: PracticeArea, language: LanguageCode): string {
  const nameMap: Record<LanguageCode, string> = {
    en: area.nameEn,
    es: area.nameEs,
    de: area.nameDe,
    zh: area.nameZh,
    ko: area.nameKo,
    ja: area.nameJa,
    ar: area.nameAr,
    ru: area.nameRu,
    fr: area.nameFr,
    it: area.nameIt,
  };
  return nameMap[language] || area.nameEn;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PracticesSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <section
      id="practices"
      className="py-24 lg:py-32 bg-[#111110]"
      data-testid="section-practices"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:gap-20">

          {/* Left editorial identity column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-1/3 mb-12 lg:mb-0"
          >
            <div className="flex flex-col">
              {/* Red rule */}
              <div className="w-12 h-px bg-[#AA1A2E] mb-6" />

              {/* Section label */}
              <h2
                className="text-[#AA1A2E] text-sm font-medium tracking-[0.2em] uppercase mb-6"
                data-testid="text-practices-title"
              >
                {t.title}
              </h2>

              {/* Decorative large number */}
              <div className="relative mb-6 select-none pointer-events-none">
                <span className="text-[9rem] leading-none font-heading font-light text-white/[0.04]">
                  18
                </span>
              </div>

              {/* Intro sentence */}
              <p className="text-sm text-white/50 leading-relaxed mb-10 max-w-xs">
                {t.intro}
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-4">
                <Link href="/contact">
                  <Button
                    className="bg-[#AA1A2E] text-white uppercase tracking-wide text-xs w-full sm:w-auto"
                    data-testid="button-practices-contact"
                  >
                    <Phone className="w-3.5 h-3.5 mr-2" />
                    {t.ctaText}
                  </Button>
                </Link>
                <Link
                  href="/practice-groups"
                  className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors duration-200 group"
                  data-testid="link-practices-see-more"
                >
                  {t.seeMore}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right list column — 2-column grid on desktop */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:w-2/3 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2"
          >
            {practiceAreas.slice(0, 9).map((area) => (
              <motion.div key={area.id} variants={itemVariants}>
                <Link
                  href={`/practice-groups/${area.slug}`}
                  className="group flex items-center gap-4 px-4 py-4 border-b border-white/8 border-l-2 border-l-transparent hover:border-l-[#AA1A2E] hover:bg-white/4 transition-all duration-200 h-full"
                  data-testid={`link-practice-${area.id}`}
                >
                  <span
                    className="text-sm font-medium text-[#AA1A2E] w-8 shrink-0 tabular-nums"
                    data-testid={`text-practice-number-${area.id}`}
                  >
                    {String(area.id).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1 text-lg font-light text-white/90 group-hover:text-white transition-colors duration-200 leading-snug"
                    data-testid={`text-practice-name-${area.id}`}
                  >
                    {getPracticeAreaName(area, language)}
                  </span>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-[#AA1A2E] shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* Mobile-only CTA block — below the list */}
        <div className="lg:hidden mt-10 flex flex-col gap-4">
          <Link href="/contact">
            <Button
              className="bg-[#AA1A2E] text-white uppercase tracking-wide text-xs w-full"
              data-testid="button-practices-contact-mobile"
            >
              <Phone className="w-3.5 h-3.5 mr-2" />
              {t.ctaText}
            </Button>
          </Link>
          <Link
            href="/practice-groups"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors duration-200 group"
            data-testid="link-practices-see-more-mobile"
          >
            {t.seeMore}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>

      </div>
    </section>
  );
}
