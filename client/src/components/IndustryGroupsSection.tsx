import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
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
  image: string;
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
    slug: "automotive-mobility-manufacturing",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=1200&fit=crop&q=80",
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
    slug: "consumer-goods",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=1200&fit=crop&q=80",
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
    slug: "energy-natural-resources-industry",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=1200&fit=crop&q=80",
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
    slug: "pharmaceutical-life-sciences",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=1200&fit=crop&q=80",
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
    slug: "financial-services",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=1200&fit=crop&q=80",
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
    slug: "real-estate-industry",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=1200&fit=crop&q=80",
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
    slug: "technology-industry",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=1200&fit=crop&q=80",
  },
];

type ContentItem = {
  title: string;
  subtitle: string;
  seeMore: string;
  seeMoreAriaLabel: string;
};

const content: Record<LanguageCode, ContentItem> = {
  en: {
    title: "INDUSTRY GROUPS",
    subtitle: "7 strategic sectors",
    seeMore: "SEE ALL GROUPS",
    seeMoreAriaLabel: "See all industry groups",
  },
  es: {
    title: "GRUPOS DE INDUSTRIA",
    subtitle: "7 sectores estratégicos",
    seeMore: "VER TODOS LOS GRUPOS",
    seeMoreAriaLabel: "Ver todos los grupos de industria",
  },
  de: {
    title: "BRANCHENGRUPPEN",
    subtitle: "7 strategische Sektoren",
    seeMore: "ALLE GRUPPEN ANZEIGEN",
    seeMoreAriaLabel: "Alle Branchengruppen anzeigen",
  },
  zh: {
    title: "行业组",
    subtitle: "7个战略行业",
    seeMore: "查看所有组别",
    seeMoreAriaLabel: "查看所有行业组别",
  },
  ko: {
    title: "산업 그룹",
    subtitle: "7개 전략 부문",
    seeMore: "모든 그룹 보기",
    seeMoreAriaLabel: "모든 산업 그룹 보기",
  },
  ja: {
    title: "産業グループ",
    subtitle: "7つの戦略的セクター",
    seeMore: "すべてのグループを見る",
    seeMoreAriaLabel: "すべての産業グループを見る",
  },
  ar: {
    title: "مجموعات الصناعة",
    subtitle: "7 قطاعات استراتيجية",
    seeMore: "عرض جميع المجموعات",
    seeMoreAriaLabel: "عرض جميع مجموعات الصناعة",
  },
  ru: {
    title: "ОТРАСЛЕВЫЕ ГРУППЫ",
    subtitle: "7 стратегических секторов",
    seeMore: "ВСЕ ГРУППЫ",
    seeMoreAriaLabel: "Все отраслевые группы",
  },
  fr: {
    title: "GROUPES INDUSTRIELS",
    subtitle: "7 secteurs stratégiques",
    seeMore: "VOIR TOUS LES GROUPES",
    seeMoreAriaLabel: "Voir tous les groupes industriels",
  },
  it: {
    title: "GRUPPI INDUSTRIALI",
    subtitle: "7 settori strategici",
    seeMore: "VEDI TUTTI I GRUPPI",
    seeMoreAriaLabel: "Vedi tutti i gruppi industriali",
  },
};

export default function IndustryGroupsSection() {
  const { language } = useLanguage();
  const t = content[language] || content.en;
  const [activePanel, setActivePanel] = useState<number | null>(null);

  const getGroupName = (group: IndustryGroup): string => {
    return group.names[language] || group.names.en;
  };

  return (
    <section
      id="industry-groups"
      className="bg-[#111110]"
      data-testid="section-industry-groups"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-20 pb-10"
      >
        <div className="w-10 h-px bg-[#AA1A2E] mb-5" />
        <h2
          className="text-[#AA1A2E] text-sm font-medium tracking-[0.2em] uppercase"
          data-testid="text-industry-groups-title"
        >
          {t.title}
        </h2>
        <p className="text-white/40 text-xs tracking-[0.12em] uppercase mt-2">
          {t.subtitle}
        </p>
      </motion.div>

      {/* Desktop: 7 expanding vertical panels */}
      <div
        className="hidden lg:flex w-full h-[500px]"
        onMouseLeave={() => setActivePanel(null)}
        data-testid="container-industry-panels"
      >
        {industryGroups.map((group) => {
          const isActive = activePanel === group.id;
          const name = getGroupName(group);
          return (
            <Link
              key={group.id}
              href={`/industry-groups/${group.slug}`}
              data-testid={`link-industry-group-${group.id}`}
              aria-label={name}
              className="relative overflow-hidden cursor-pointer block"
              style={{
                flex: isActive ? 3 : 1,
                transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                minWidth: 0,
              }}
              onMouseEnter={() => setActivePanel(group.id)}
            >
              {/* Background image */}
              <img
                src={group.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: isActive ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />

              {/* Dark overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: isActive
                    ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)",
                  transition: "background 0.5s ease",
                }}
              />

              {/* Red vertical separator line */}
              <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/20" />

              {/* Number — top left */}
              <span
                className="absolute top-5 left-4 text-[#AA1A2E] text-xs font-medium tabular-nums tracking-wider"
                data-testid={`text-industry-group-number-${group.id}`}
              >
                {String(group.id).padStart(2, "0")}
              </span>

              {/* Vertical title — visible when panel is narrow */}
              <div
                className="absolute bottom-10 left-0 right-0 flex justify-center"
                style={{
                  opacity: isActive ? 0 : 1,
                  transition: "opacity 0.25s ease",
                }}
              >
                <span
                  className="text-white/70 text-[10px] uppercase tracking-[0.18em] font-light whitespace-nowrap"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  data-testid={`text-industry-group-name-${group.id}`}
                >
                  {name}
                </span>
              </div>

              {/* Horizontal title + arrow — visible when expanded */}
              <div
                className="absolute bottom-6 left-5 right-5"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s",
                }}
              >
                <p className="text-white text-base font-light uppercase tracking-[0.1em] leading-snug mb-3">
                  {name}
                </p>
                <div className="flex items-center gap-2 text-[#AA1A2E]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile + Tablet: 2-column (mobile) → 3-column (tablet) image grid */}
      <div className="lg:hidden grid grid-cols-2 md:grid-cols-3 gap-px" data-testid="container-industry-mobile">
        {industryGroups.map((group) => {
          const name = getGroupName(group);
          return (
            <Link
              key={group.id}
              href={`/industry-groups/${group.slug}`}
              className="relative h-44 md:h-52 overflow-hidden group block"
              data-testid={`link-industry-group-mobile-${group.id}`}
              aria-label={name}
            >
              <img
                src={group.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/65 group-hover:bg-black/50 transition-colors duration-300" />
              <span className="absolute top-3 left-3 text-[#AA1A2E] text-xs font-medium tabular-nums">
                {String(group.id).padStart(2, "0")}
              </span>
              <p className="absolute bottom-3 left-3 right-3 text-white/90 text-xs uppercase tracking-[0.1em] leading-snug font-light">
                {name}
              </p>
            </Link>
          );
        })}
      </div>

      {/* See more link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-6 lg:px-12 py-10"
      >
        <Link
          href="/industry-groups"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors duration-200 group"
          data-testid="link-industry-groups-see-more"
          aria-label={t.seeMoreAriaLabel}
        >
          {t.seeMore}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </motion.div>
    </section>
  );
}
