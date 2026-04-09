import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Stat, OfficeImage } from "@shared/schema";

interface StatsSectionProps {
  language: "es" | "en" | "de" | "zh" | "ko" | "ja" | "ar" | "ru" | "fr" | "it";
}

export default function StatsSection({ language }: StatsSectionProps) {
  const { data: stats, isLoading, error } = useQuery<Stat[]>({
    queryKey: ["/api/stats"],
  });

  const { data: officeImages = [], isLoading: imagesLoading } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<number | null>(null);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + officeImages.length) % officeImages.length);
  }, [lightboxIndex, officeImages.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % officeImages.length);
  }, [lightboxIndex, officeImages.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goPrev, goNext]);

  const content: Record<string, {
    title: string;
    subtitle: string;
    description: string;
    capacity: string;
    errorMessage: string;
  }> = {
    en: {
      title: "Collaboration, technology and well-being",
      subtitle: "Designed by Gensler, one of the most influential architecture and design firms worldwide, the new offices cover more than 5,300 square meters distributed over six levels.",
      description: "The design is conceived to maximize collaboration among our 18 legal practice groups and 7 industry groups.",
      capacity: "In its initial stage, the facilities offer capacity for more than 300 workstations, 16 meeting rooms, flexible spaces for social and academic activities with capacity for 250 people, and a panoramic terrace with privileged views of iconic Mexico City landmarks such as Chapultepec Forest and Campo Militar Marte.",
      errorMessage: "Failed to load statistics",
    },
    es: {
      title: "Colaboración, tecnología y bienestar",
      subtitle: "Diseñadas por Gensler, una de las firmas de arquitectura y diseño más influyentes del mundo, las nuevas oficinas abarcan más de 5,300 metros cuadrados distribuidos en seis niveles.",
      description: "El diseño está concebido para maximizar la colaboración entre nuestros 18 grupos de práctica legal y 7 grupos industriales.",
      capacity: "En su etapa inicial, las instalaciones ofrecen capacidad para más de 300 estaciones de trabajo, 16 salas de juntas, espacios flexibles para actividades sociales y académicas con capacidad para 250 personas, y una terraza panorámica con vistas privilegiadas de lugares emblemáticos de la Ciudad de México como el Bosque de Chapultepec y el Campo Militar Marte.",
      errorMessage: "Error al cargar estadísticas",
    },
    de: {
      title: "Zusammenarbeit, Technologie und Wohlbefinden",
      subtitle: "Die neuen Büros wurden von Gensler, einem der einflussreichsten Architektur- und Designbüros weltweit, entworfen und erstrecken sich über mehr als 5.300 Quadratmeter auf sechs Etagen.",
      description: "Das Design ist darauf ausgelegt, die Zusammenarbeit zwischen unseren 18 Rechtspraxisgruppen und 7 Branchengruppen zu maximieren.",
      capacity: "In der ersten Phase bieten die Einrichtungen Platz für mehr als 300 Arbeitsplätze, 16 Besprechungsräume, flexible Räume für soziale und akademische Aktivitäten mit einer Kapazität von 250 Personen und eine Panoramaterrasse mit privilegiertem Blick auf ikonische Wahrzeichen von Mexiko-Stadt wie den Chapultepec-Wald und das Campo Militar Marte.",
      errorMessage: "Fehler beim Laden der Statistiken",
    },
    zh: {
      title: "协作、技术与福祉",
      subtitle: "新办公室由全球最具影响力的建筑设计公司之一Gensler设计，占地面积超过5,300平方米，分布在六个楼层。",
      description: "设计旨在最大化我们18个法律执业团队和7个行业团队之间的协作。",
      capacity: "在初期阶段，设施可容纳300多个工作站、16间会议室、可容纳250人的社交和学术活动灵活空间，以及可俯瞰墨西哥城标志性地标（如查普尔特佩克森林和马尔特军事基地）的全景露台。",
      errorMessage: "加载统计数据失败",
    },
    ko: {
      title: "협업, 기술 그리고 웰빙",
      subtitle: "세계에서 가장 영향력 있는 건축 및 디자인 회사 중 하나인 Gensler가 설계한 새 사무실은 6개 층에 걸쳐 5,300제곱미터 이상을 차지합니다.",
      description: "이 디자인은 18개의 법률 실무 그룹과 7개의 산업 그룹 간의 협업을 극대화하도록 구상되었습니다.",
      capacity: "초기 단계에서 시설은 300개 이상의 워크스테이션, 16개의 회의실, 250명 수용 가능한 사회적 및 학술 활동을 위한 유연한 공간, 그리고 차풀테펙 숲과 캄포 밀리타르 마르테와 같은 멕시코시티의 상징적인 랜드마크를 조망할 수 있는 파노라마 테라스를 제공합니다.",
      errorMessage: "통계 로드 실패",
    },
    ja: {
      title: "コラボレーション、テクノロジー、そしてウェルビーイング",
      subtitle: "世界で最も影響力のある建築・デザイン事務所の一つであるGenslerが設計した新オフィスは、6フロアにわたる5,300平方メートル以上の広さを誇ります。",
      description: "このデザインは、18の法務プラクティスグループと7の業界グループ間のコラボレーションを最大化するように構想されています。",
      capacity: "初期段階では、300以上のワークステーション、16の会議室、250人収容可能な社会的・学術的活動のための柔軟なスペース、そしてチャプルテペックの森やカンポ・ミリタール・マルテなどメキシコシティの象徴的なランドマークを望む特権的な眺望を持つパノラマテラスを備えています。",
      errorMessage: "統計の読み込みに失敗しました",
    },
    ar: {
      title: "التعاون والتكنولوجيا والرفاهية",
      subtitle: "صُممت المكاتب الجديدة من قبل Gensler، إحدى أكثر شركات الهندسة المعمارية والتصميم تأثيراً في العالم، وتغطي أكثر من 5,300 متر مربع موزعة على ستة طوابق.",
      description: "تم تصميم المساحة لتحقيق أقصى قدر من التعاون بين مجموعات الممارسة القانونية الـ 18 ومجموعات الصناعة السبع لدينا.",
      capacity: "في مرحلتها الأولية، توفر المرافق سعة لأكثر من 300 محطة عمل، و16 غرفة اجتماعات، ومساحات مرنة للأنشطة الاجتماعية والأكاديمية تتسع لـ 250 شخصاً، وشرفة بانورامية بإطلالات مميزة على معالم مكسيكو سيتي الشهيرة مثل غابة تشابولتيبيك وكامبو ميليتار مارتي.",
      errorMessage: "فشل في تحميل الإحصائيات",
    },
    ru: {
      title: "Сотрудничество, технологии и благополучие",
      subtitle: "Новые офисы, спроектированные Gensler, одной из самых влиятельных архитектурных и дизайнерских фирм в мире, занимают более 5 300 квадратных метров на шести этажах.",
      description: "Дизайн разработан для максимального сотрудничества между нашими 18 практическими группами и 7 отраслевыми группами.",
      capacity: "На начальном этапе объект предлагает более 300 рабочих мест, 16 переговорных комнат, гибкие пространства для социальных и академических мероприятий вместимостью 250 человек, а также панорамную террасу с привилегированным видом на знаковые достопримечательности Мехико, такие как лес Чапультепек и Кампо Милитар Марте.",
      errorMessage: "Не удалось загрузить статистику",
    },
    fr: {
      title: "Collaboration, technologie et bien-être",
      subtitle: "Conçus par Gensler, l'un des cabinets d'architecture et de design les plus influents au monde, les nouveaux bureaux couvrent plus de 5 300 mètres carrés répartis sur six niveaux.",
      description: "Le design est conçu pour maximiser la collaboration entre nos 18 groupes de pratique juridique et 7 groupes sectoriels.",
      capacity: "Dans sa phase initiale, les installations offrent une capacité de plus de 300 postes de travail, 16 salles de réunion, des espaces flexibles pour des activités sociales et académiques pouvant accueillir 250 personnes, et une terrasse panoramique avec des vues privilégiées sur des sites emblématiques de Mexico comme la forêt de Chapultepec et le Campo Militar Marte.",
      errorMessage: "Échec du chargement des statistiques",
    },
    it: {
      title: "Collaborazione, tecnologia e benessere",
      subtitle: "Progettati da Gensler, uno degli studi di architettura e design più influenti al mondo, i nuovi uffici coprono più di 5.300 metri quadrati distribuiti su sei livelli.",
      description: "Il design è concepito per massimizzare la collaborazione tra i nostri 18 gruppi di pratica legale e 7 gruppi industriali.",
      capacity: "Nella sua fase iniziale, le strutture offrono una capacità di oltre 300 postazioni di lavoro, 16 sale riunioni, spazi flessibili per attività sociali e accademiche con capacità di 250 persone e una terrazza panoramica con viste privilegiate su luoghi iconici di Città del Messico come il Bosco di Chapultepec e il Campo Militar Marte.",
      errorMessage: "Impossibile caricare le statistiche",
    },
  };

  const t = content[language] || content.en;

  const statLabelTranslations: Record<string, Record<string, string>> = {
    en: {
      "Years of Experience": "Years of Experience",
      "Lawyers": "Lawyers",
      "Clients": "Clients",
      "Partners": "Partners",
      "Offices": "Offices",
      "Practice Areas": "Practice Areas",
      "Industry Groups": "Industry Groups",
      "Countries": "Countries",
      "Team Members": "Team Members",
      "Success Rate": "Success Rate",
      "SQUARE METERS": "SQUARE METERS",
      "WORKSTATIONS": "WORKSTATIONS",
      "MEETING ROOMS": "MEETING ROOMS",
      "LEVELS": "LEVELS",
      "square meters": "square meters",
      "workstations": "workstations",
      "meeting rooms": "meeting rooms",
      "levels": "levels",
    },
    es: {
      "Years of Experience": "Años de Experiencia",
      "Lawyers": "Abogados",
      "Clients": "Clientes",
      "Partners": "Socios",
      "Offices": "Oficinas",
      "Practice Areas": "Áreas de Práctica",
      "Industry Groups": "Grupos Industriales",
      "Countries": "Países",
      "Team Members": "Miembros del Equipo",
      "Success Rate": "Tasa de Éxito",
      "SQUARE METERS": "METROS CUADRADOS",
      "WORKSTATIONS": "ESTACIONES DE TRABAJO",
      "MEETING ROOMS": "SALAS DE JUNTAS",
      "LEVELS": "NIVELES",
      "square meters": "metros cuadrados",
      "workstations": "estaciones de trabajo",
      "meeting rooms": "salas de juntas",
      "levels": "niveles",
    },
    de: {
      "Years of Experience": "Jahre Erfahrung",
      "Lawyers": "Anwälte",
      "Clients": "Mandanten",
      "Partners": "Partner",
      "Offices": "Büros",
      "Practice Areas": "Praxisbereiche",
      "Industry Groups": "Branchengruppen",
      "Countries": "Länder",
      "Team Members": "Teammitglieder",
      "Success Rate": "Erfolgsquote",
      "SQUARE METERS": "QUADRATMETER",
      "WORKSTATIONS": "ARBEITSPLÄTZE",
      "MEETING ROOMS": "BESPRECHUNGSRÄUME",
      "LEVELS": "ETAGEN",
      "square meters": "Quadratmeter",
      "workstations": "Arbeitsplätze",
      "meeting rooms": "Besprechungsräume",
      "levels": "Etagen",
    },
    zh: {
      "Years of Experience": "年经验",
      "Lawyers": "律师",
      "Clients": "客户",
      "Partners": "合伙人",
      "Offices": "办公室",
      "Practice Areas": "业务领域",
      "Industry Groups": "行业团队",
      "Countries": "国家",
      "Team Members": "团队成员",
      "Success Rate": "成功率",
      "SQUARE METERS": "平方米",
      "WORKSTATIONS": "工作站",
      "MEETING ROOMS": "会议室",
      "LEVELS": "层",
      "square meters": "平方米",
      "workstations": "工作站",
      "meeting rooms": "会议室",
      "levels": "层",
    },
    ko: {
      "Years of Experience": "년 경력",
      "Lawyers": "변호사",
      "Clients": "고객",
      "Partners": "파트너",
      "Offices": "사무소",
      "Practice Areas": "업무 분야",
      "Industry Groups": "산업 그룹",
      "Countries": "국가",
      "Team Members": "팀원",
      "Success Rate": "성공률",
      "SQUARE METERS": "제곱미터",
      "WORKSTATIONS": "워크스테이션",
      "MEETING ROOMS": "회의실",
      "LEVELS": "층",
      "square meters": "제곱미터",
      "workstations": "워크스테이션",
      "meeting rooms": "회의실",
      "levels": "층",
    },
    ja: {
      "Years of Experience": "年の経験",
      "Lawyers": "弁護士",
      "Clients": "クライアント",
      "Partners": "パートナー",
      "Offices": "オフィス",
      "Practice Areas": "取扱分野",
      "Industry Groups": "業界グループ",
      "Countries": "国",
      "Team Members": "チームメンバー",
      "Success Rate": "成功率",
      "SQUARE METERS": "平方メートル",
      "WORKSTATIONS": "ワークステーション",
      "MEETING ROOMS": "会議室",
      "LEVELS": "階",
      "square meters": "平方メートル",
      "workstations": "ワークステーション",
      "meeting rooms": "会議室",
      "levels": "階",
    },
    ar: {
      "Years of Experience": "سنوات من الخبرة",
      "Lawyers": "محامون",
      "Clients": "عملاء",
      "Partners": "شركاء",
      "Offices": "مكاتب",
      "Practice Areas": "مجالات الممارسة",
      "Industry Groups": "مجموعات الصناعة",
      "Countries": "دول",
      "Team Members": "أعضاء الفريق",
      "Success Rate": "معدل النجاح",
      "SQUARE METERS": "متر مربع",
      "WORKSTATIONS": "محطات العمل",
      "MEETING ROOMS": "غرف الاجتماعات",
      "LEVELS": "طوابق",
      "square meters": "متر مربع",
      "workstations": "محطات العمل",
      "meeting rooms": "غرف الاجتماعات",
      "levels": "طوابق",
    },
    ru: {
      "Years of Experience": "лет опыта",
      "Lawyers": "юристов",
      "Clients": "клиентов",
      "Partners": "партнёров",
      "Offices": "офисов",
      "Practice Areas": "практик",
      "Industry Groups": "отраслевых групп",
      "Countries": "стран",
      "Team Members": "членов команды",
      "Success Rate": "успешных дел",
      "SQUARE METERS": "КВАДРАТНЫХ МЕТРОВ",
      "WORKSTATIONS": "РАБОЧИХ МЕСТ",
      "MEETING ROOMS": "ПЕРЕГОВОРНЫХ",
      "LEVELS": "ЭТАЖЕЙ",
      "square meters": "квадратных метров",
      "workstations": "рабочих мест",
      "meeting rooms": "переговорных",
      "levels": "этажей",
    },
    fr: {
      "Years of Experience": "ans d'expérience",
      "Lawyers": "avocats",
      "Clients": "clients",
      "Partners": "associés",
      "Offices": "bureaux",
      "Practice Areas": "domaines de pratique",
      "Industry Groups": "groupes sectoriels",
      "Countries": "pays",
      "Team Members": "membres de l'équipe",
      "Success Rate": "taux de réussite",
      "SQUARE METERS": "MÈTRES CARRÉS",
      "WORKSTATIONS": "POSTES DE TRAVAIL",
      "MEETING ROOMS": "SALLES DE RÉUNION",
      "LEVELS": "NIVEAUX",
      "square meters": "mètres carrés",
      "workstations": "postes de travail",
      "meeting rooms": "salles de réunion",
      "levels": "niveaux",
    },
    it: {
      "Years of Experience": "anni di esperienza",
      "Lawyers": "avvocati",
      "Clients": "clienti",
      "Partners": "partner",
      "Offices": "uffici",
      "Practice Areas": "aree di pratica",
      "Industry Groups": "gruppi industriali",
      "Countries": "paesi",
      "Team Members": "membri del team",
      "Success Rate": "tasso di successo",
      "SQUARE METERS": "METRI QUADRATI",
      "WORKSTATIONS": "POSTAZIONI DI LAVORO",
      "MEETING ROOMS": "SALE RIUNIONI",
      "LEVELS": "LIVELLI",
      "square meters": "metri quadrati",
      "workstations": "postazioni di lavoro",
      "meeting rooms": "sale riunioni",
      "levels": "livelli",
    },
  };

  const getTranslatedLabel = (englishLabel: string): string => {
    const langTranslations = statLabelTranslations[language] || statLabelTranslations.en;
    return langTranslations[englishLabel] || englishLabel;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (error) {
    return (
      <section id="stats" className="py-20 lg:py-28 bg-background" data-testid="section-stats">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-stats-error">{t.errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="stats"
      className="py-20 lg:py-28 bg-background"
      data-testid="section-stats"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Two-column layout: text left, accordion photos right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-0">

          {/* Left column: editorial text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-12 h-px bg-[#AA1A2E] mb-6" />
            <p className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase mb-4">
              GENSLER DESIGN
            </p>
            <h2
              className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight mb-8"
              data-testid="text-stats-title"
            >
              {t.title}
            </h2>
            <p
              className="text-sm text-muted-foreground leading-relaxed mb-4"
              data-testid="text-stats-subtitle"
            >
              {t.subtitle}
            </p>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-stats-description"
            >
              {t.description}
            </p>

            {/* Mobile: horizontal scrollable photo strip */}
            {!imagesLoading && officeImages.length > 0 && (
              <div
                className="lg:hidden overflow-x-auto flex gap-2 mt-8 -mx-6 px-6 pb-2"
                data-testid="stats-gallery-mobile-strip"
              >
                {officeImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative flex-none w-40 h-48 overflow-hidden cursor-pointer"
                    onClick={() => setLightboxIndex(idx)}
                    data-testid={`stats-gallery-mobile-${img.id}`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.alt || img.altEs || ""}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                ))}
              </div>
            )}
            {imagesLoading && (
              <div className="lg:hidden flex gap-2 mt-8 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="flex-none w-40 h-48" />
                ))}
              </div>
            )}
          </motion.div>

          {/* Right column: accordion photo panels (desktop only) */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            {imagesLoading ? (
              <Skeleton className="h-[420px] w-full" data-testid="stats-gallery-skeleton-desktop" />
            ) : officeImages.length > 0 ? (
              <div
                className="flex h-[420px] w-full"
                onMouseLeave={() => setActivePanel(null)}
                data-testid="stats-gallery-accordion"
              >
                {officeImages.map((img, idx) => {
                  const isActive = activePanel === idx;
                  return (
                    <div
                      key={img.id}
                      className="relative overflow-hidden cursor-pointer"
                      style={{
                        flex: isActive ? 3 : 1,
                        transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                        minWidth: 0,
                      }}
                      onMouseEnter={() => setActivePanel(idx)}
                      onClick={() => setLightboxIndex(idx)}
                      role="button"
                      tabIndex={0}
                      aria-label={img.alt || img.altEs || "Office photo"}
                      onKeyDown={(e) => e.key === "Enter" && setLightboxIndex(idx)}
                      data-testid={`stats-gallery-panel-${img.id}`}
                    >
                      {/* Photo */}
                      <img
                        src={img.imageUrl}
                        alt={img.alt || img.altEs || ""}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        style={{
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                          filter: isActive ? "grayscale(0%)" : "grayscale(80%)",
                          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease",
                        }}
                      />

                      {/* Dark overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: isActive
                            ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 60%)"
                            : "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 100%)",
                          transition: "background 0.5s ease",
                        }}
                      />

                      {/* Red vertical separator */}
                      <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/25" />

                      {/* Zoom icon — visible on active */}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          opacity: isActive ? 1 : 0,
                          transition: "opacity 0.3s ease 0.1s",
                        }}
                      >
                        <ZoomIn className="text-white w-6 h-6 drop-shadow-lg" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </motion.div>
        </div>

        {/* Stats grid — full width */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-border py-12 my-14">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`px-6 py-2 ${i > 1 ? "border-l border-border" : ""}`} data-testid={`skeleton-stat-${i}`}>
                <Skeleton className="h-12 w-24 mb-3" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-border py-12 my-14"
          >
            {stats?.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`px-6 py-2 ${index > 0 ? "border-l border-border" : ""}`}
                data-testid={`stat-item-${index}`}
              >
                <div
                  className="font-heading font-light text-4xl md:text-5xl lg:text-6xl text-[#AA1A2E] leading-none mb-3"
                  data-testid={`text-stat-value-${index}`}
                >
                  {stat.value}
                </div>
                <div
                  className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground leading-tight"
                  data-testid={`text-stat-label-${index}`}
                >
                  {getTranslatedLabel(stat.label)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Capacity text — full width */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="border-t border-border pt-10"
        >
          <p
            className="text-sm text-muted-foreground leading-relaxed max-w-4xl"
            data-testid="text-stats-capacity"
          >
            {t.capacity}
          </p>
        </motion.div>

      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && officeImages.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          data-testid="stats-lightbox-overlay"
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            data-testid="stats-lightbox-close"
          >
            <X className="w-8 h-8" />
          </button>

          {officeImages.length > 1 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous"
              data-testid="stats-lightbox-prev"
            >
              <ChevronLeft className="w-10 h-10 text-[#AA1A2E]" />
            </button>
          )}

          <img
            src={officeImages[lightboxIndex].imageUrl}
            alt={officeImages[lightboxIndex].alt || officeImages[lightboxIndex].altEs || ""}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="stats-lightbox-image"
          />

          {officeImages.length > 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next"
              data-testid="stats-lightbox-next"
            >
              <ChevronRight className="w-10 h-10 text-[#AA1A2E]" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-[0.2em] uppercase">
            {lightboxIndex + 1} / {officeImages.length}
          </div>
        </div>
      )}
    </section>
  );
}
