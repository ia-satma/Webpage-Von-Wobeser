import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@shared/schema";

type IndustryGroupNames = {
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
};

interface IndustryGroup {
  id: number;
  names: IndustryGroupNames;
  slug: string;
}

const industryGroups: IndustryGroup[] = [
  { 
    id: 1, 
    names: {
      en: "Automotive, Mobility & Manufacturing",
      es: "Automotriz, Movilidad y Manufactura",
      de: "Automobil, Mobilität & Fertigung",
      zh: "汽车、出行与制造业",
      ko: "자동차, 모빌리티 및 제조업",
      ja: "自動車・モビリティ・製造業",
      ar: "السيارات والتنقل والتصنيع",
      ru: "Автомобильная промышленность, мобильность и производство",
      fr: "Automobile, Mobilité et Fabrication",
      it: "Automotive, Mobilità e Manifattura",
    },
    slug: "automotive-mobility-manufacturing" 
  },
  { 
    id: 2, 
    names: {
      en: "Consumer Goods",
      es: "Bienes de Consumo",
      de: "Konsumgüter",
      zh: "消费品",
      ko: "소비재",
      ja: "消費財",
      ar: "السلع الاستهلاكية",
      ru: "Потребительские товары",
      fr: "Biens de Consommation",
      it: "Beni di Consumo",
    },
    slug: "consumer-goods" 
  },
  { 
    id: 3, 
    names: {
      en: "Energy & Natural Resources",
      es: "Energía y Recursos Naturales",
      de: "Energie & Natürliche Ressourcen",
      zh: "能源与自然资源",
      ko: "에너지 및 천연자원",
      ja: "エネルギー・天然資源",
      ar: "الطاقة والموارد الطبيعية",
      ru: "Энергетика и природные ресурсы",
      fr: "Énergie et Ressources Naturelles",
      it: "Energia e Risorse Naturali",
    },
    slug: "energy-natural-resources-industry" 
  },
  { 
    id: 4, 
    names: {
      en: "Pharmaceutical & Life Sciences",
      es: "Farmacéutica y Ciencias de la Salud",
      de: "Pharma & Life Sciences",
      zh: "制药与生命科学",
      ko: "제약 및 생명과학",
      ja: "製薬・ライフサイエンス",
      ar: "الأدوية وعلوم الحياة",
      ru: "Фармацевтика и науки о жизни",
      fr: "Pharmaceutique et Sciences de la Vie",
      it: "Farmaceutica e Scienze della Vita",
    },
    slug: "pharmaceutical-life-sciences" 
  },
  { 
    id: 5, 
    names: {
      en: "Financial Services",
      es: "Servicios Financieros",
      de: "Finanzdienstleistungen",
      zh: "金融服务",
      ko: "금융 서비스",
      ja: "金融サービス",
      ar: "الخدمات المالية",
      ru: "Финансовые услуги",
      fr: "Services Financiers",
      it: "Servizi Finanziari",
    },
    slug: "financial-services" 
  },
  { 
    id: 6, 
    names: {
      en: "Real Estate",
      es: "Inmobiliario",
      de: "Immobilien",
      zh: "房地产",
      ko: "부동산",
      ja: "不動産",
      ar: "العقارات",
      ru: "Недвижимость",
      fr: "Immobilier",
      it: "Immobiliare",
    },
    slug: "real-estate-industry" 
  },
  { 
    id: 7, 
    names: {
      en: "Technology",
      es: "Tecnología",
      de: "Technologie",
      zh: "科技",
      ko: "기술",
      ja: "テクノロジー",
      ar: "التكنولوجيا",
      ru: "Технологии",
      fr: "Technologie",
      it: "Tecnologia",
    },
    slug: "technology-industry" 
  },
];

type ContentItem = {
  title: string;
  seeMore: string;
  ctaText: string;
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    title: "INDUSTRY GROUPS",
    seeMore: "SEE MORE",
    ctaText: "Industry Expertise",
  },
  es: {
    title: "GRUPOS DE INDUSTRIA",
    seeMore: "VER MÁS",
    ctaText: "Expertise en Industrias",
  },
  de: {
    title: "BRANCHENGRUPPEN",
    seeMore: "MEHR ANZEIGEN",
    ctaText: "Branchenkompetenz",
  },
  zh: {
    title: "行业组",
    seeMore: "查看更多",
    ctaText: "行业专长",
  },
  ko: {
    title: "산업 그룹",
    seeMore: "더 보기",
    ctaText: "산업 전문성",
  },
  ja: {
    title: "産業グループ",
    seeMore: "もっと見る",
    ctaText: "業界の専門知識",
  },
  ar: {
    title: "مجموعات الصناعة",
    seeMore: "عرض المزيد",
    ctaText: "خبرة الصناعة",
  },
  ru: {
    title: "ОТРАСЛЕВЫЕ ГРУППЫ",
    seeMore: "ПОКАЗАТЬ БОЛЬШЕ",
    ctaText: "Отраслевая экспертиза",
  },
  fr: {
    title: "GROUPES INDUSTRIELS",
    seeMore: "VOIR PLUS",
    ctaText: "Expertise Industrielle",
  },
  it: {
    title: "GRUPPI INDUSTRIALI",
    seeMore: "VEDI DI PIÙ",
    ctaText: "Competenza Industriale",
  },
};

export default function IndustryGroupsSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const getGroupName = (group: IndustryGroup): string => {
    return group.names[language] || group.names.en;
  };

  return (
    <section
      id="industry-groups"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-industry-groups"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2
            className="text-2xl md:text-3xl font-heading font-light text-[#AA1A2E] uppercase tracking-[0.15em]"
            data-testid="text-industry-groups-title"
          >
            {t.title}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4"
        >
          {industryGroups.map((group) => (
            <motion.div key={group.id} variants={itemVariants}>
              <Link
                href={`/industry-groups/${group.slug}`}
                className="group flex items-start gap-3 py-3 hover:text-primary transition-colors"
                data-testid={`link-industry-group-${group.id}`}
              >
                <span className="text-sm font-medium text-primary min-w-[24px]" data-testid={`text-industry-group-number-${group.id}`}>
                  {group.id}.
                </span>
                <span className="text-base text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors" data-testid={`text-industry-group-name-${group.id}`}>
                  {getGroupName(group)}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/industry-groups"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            data-testid="link-industry-groups-see-more"
          >
            {t.seeMore}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-[#AA1A2E] hover:bg-[#8A1525] text-white uppercase tracking-wide"
              data-testid="button-industry-groups-contact"
            >
              <Phone className="w-4 h-4 mr-2" />
              {t.ctaText}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
