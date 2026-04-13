import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, MapPin } from "lucide-react";
import createGlobe from "cobe";

import clausVonWobeserPhoto from "@assets/of_counsel_photos/claus_von_wobeser.jpg";
import luisBurguenoPhoto from "@assets/partner_photos/luis_burgueno.jpg";
import katharinaRoehrPhoto from "@assets/partner_photos/katharina_roehr.jpg";
import rupertHuttlerPhoto from "@assets/partner_photos/rupert_huttler.jpg";
import annaMariaBrandstadterPhoto from "@assets/associate_photos/anna_maria_brandstadter.jpg";
import michaelSchreiberPhoto from "@assets/associate_photos/michael_schreiber.jpg";
import alexanderBarnesPhoto from "@assets/associate_photos/alexander_barnes.jpg";

type SupportedLanguage = "es" | "en" | "de" | "zh" | "ko" | "ja" | "ar" | "ru" | "fr" | "it";

interface WorldMapSectionProps {
  language: SupportedLanguage;
}


interface ContentTranslation {
  sectionTitle: string;
  title: string;
  subtitle: string;
  mexicoLabel: string;
  mexicoSubtitle: string;
  germanyLabel: string;
  germanySubtitle: string;
  historicalText: string;
  partnersTitle: string;
  ofCounselTitle: string;
  associatesTitle: string;
  yearsLabel: string;
  clientsLabel: string;
  languagesLabel: string;
  foundingPartner: string;
  partner: string;
  teamTitle: string;
  seeMore: string;
}

const content: Record<SupportedLanguage, ContentTranslation> = {
  en: {
    sectionTitle: "GERMAN DESK",
    title: "Global Reach",
    subtitle: "Von Wobeser y Sierra's German Desk provides specialized legal services for German-speaking clients investing in Mexico and Latin America.",
    mexicoLabel: "MEXICO CITY",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "GERMANY",
    germanySubtitle: "German Desk",
    historicalText: "For more than 34 years, Von Wobeser y Sierra has maintained a dedicated German Desk to serve German-speaking clients investing in Mexico and Latin America. Our German Desk attorneys are fluent in German, English, and Spanish, and have extensive experience working with German and Austrian companies on their investments in the region. We understand the German business culture and legal requirements, enabling us to provide seamless service that bridges both legal systems.",
    partnersTitle: "Partners of the German Desk",
    ofCounselTitle: "Of Counsel",
    associatesTitle: "Associates",
    yearsLabel: "Years of Experience",
    clientsLabel: "German Clients",
    languagesLabel: "Languages (ES/EN/DE)",
    foundingPartner: "Founding Partner",
    partner: "Partner",
    teamTitle: "German Desk Team",
    seeMore: "Meet the full team",
  },
  es: {
    sectionTitle: "GERMAN DESK",
    title: "Alcance Global",
    subtitle: "El German Desk de Von Wobeser y Sierra proporciona servicios legales especializados para clientes de habla alemana que invierten en México y América Latina.",
    mexicoLabel: "CIUDAD DE MÉXICO",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "ALEMANIA",
    germanySubtitle: "German Desk",
    historicalText: "Durante más de 34 años, Von Wobeser y Sierra ha mantenido un German Desk dedicado a atender a clientes de habla alemana que invierten en México y América Latina. Los abogados de nuestro German Desk hablan alemán, inglés y español con fluidez, y tienen amplia experiencia trabajando con empresas alemanas y austriacas en sus inversiones en la región. Comprendemos la cultura empresarial y los requisitos legales alemanes, lo que nos permite brindar un servicio integrado que conecta ambos sistemas legales.",
    partnersTitle: "Socios del German Desk",
    ofCounselTitle: "Of Counsel",
    associatesTitle: "Asociados",
    yearsLabel: "Años de experiencia",
    clientsLabel: "Clientes alemanes",
    languagesLabel: "Idiomas (ES/EN/DE)",
    foundingPartner: "Socio Fundador",
    partner: "Socio",
    teamTitle: "Equipo German Desk",
    seeMore: "Ver equipo completo",
  },
  de: {
    sectionTitle: "GERMAN DESK",
    title: "German Desk",
    subtitle: "Ihre Brücke zwischen Deutschland und Mexiko",
    mexicoLabel: "MEXIKO-STADT",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "DEUTSCHLAND",
    germanySubtitle: "German Desk",
    historicalText: "Seit mehr als 34 Jahren arbeiten wir mit deutschen Unternehmen zusammen. Von Wobeser y Sierra unterhält einen eigenen German Desk für deutschsprachige Mandanten, die in Mexiko und Lateinamerika investieren. Unsere Anwälte des German Desk sprechen fließend Deutsch, Englisch und Spanisch und verfügen über umfangreiche Erfahrung in der Zusammenarbeit mit deutschen und österreichischen Unternehmen bei ihren Investitionen in der Region. Wir verstehen die deutsche Geschäftskultur und rechtlichen Anforderungen und können so einen nahtlosen Service bieten, der beide Rechtssysteme verbindet.",
    partnersTitle: "Partner des German Desk",
    ofCounselTitle: "Of Counsel",
    associatesTitle: "Associates",
    yearsLabel: "Jahre Erfahrung mit deutschen Kunden",
    clientsLabel: "Deutsche Mandanten",
    languagesLabel: "Sprachen (ES/EN/DE)",
    foundingPartner: "Gründungspartner",
    partner: "Partner",
    teamTitle: "German Desk Team",
    seeMore: "Vollständiges Team",
  },
  zh: {
    sectionTitle: "德国业务部",
    title: "德国业务部",
    subtitle: "德国与墨西哥之间的桥梁",
    mexicoLabel: "墨西哥城",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "德国",
    germanySubtitle: "德国业务部",
    historicalText: "34年来我们一直与德国企业合作。Von Wobeser y Sierra设有专门的德国业务部,为在墨西哥和拉丁美洲投资的德语客户提供服务。我们德国业务部的律师精通德语、英语和西班牙语,在与德国和奥地利公司合作投资该地区方面拥有丰富的经验。我们了解德国的商业文化和法律要求,能够提供连接两个法律体系的无缝服务。",
    partnersTitle: "德国业务部合伙人",
    ofCounselTitle: "顾问律师",
    associatesTitle: "律师",
    yearsLabel: "年服务德国客户经验",
    clientsLabel: "德国客户",
    languagesLabel: "语言 (ES/EN/DE)",
    foundingPartner: "创始合伙人",
    partner: "合伙人",
    teamTitle: "德国业务部团队",
    seeMore: "查看完整团队",
  },
  ko: {
    sectionTitle: "GERMAN DESK",
    title: "German Desk",
    subtitle: "독일과 멕시코를 연결하는 다리",
    mexicoLabel: "멕시코시티",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "독일",
    germanySubtitle: "German Desk",
    historicalText: "34년 이상 독일 기업과 협력해 왔습니다. Von Wobeser y Sierra는 멕시코와 라틴 아메리카에 투자하는 독일어권 고객을 위한 전담 German Desk를 운영하고 있습니다. 저희 German Desk 변호사들은 독일어, 영어, 스페인어에 능통하며, 독일 및 오스트리아 기업의 지역 투자에 대한 풍부한 경험을 보유하고 있습니다. 저희는 독일의 비즈니스 문화와 법적 요건을 이해하여 두 법률 시스템을 연결하는 원활한 서비스를 제공합니다.",
    partnersTitle: "German Desk 파트너",
    ofCounselTitle: "고문 변호사",
    associatesTitle: "어소시에이트",
    yearsLabel: "년 독일 고객 서비스 경험",
    clientsLabel: "독일 고객",
    languagesLabel: "언어 (ES/EN/DE)",
    foundingPartner: "창립 파트너",
    partner: "파트너",
    teamTitle: "German Desk 팀",
    seeMore: "전체 팀 보기",
  },
  ja: {
    sectionTitle: "GERMAN DESK",
    title: "German Desk",
    subtitle: "ドイツとメキシコを結ぶ架け橋",
    mexicoLabel: "メキシコシティ",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "ドイツ",
    germanySubtitle: "German Desk",
    historicalText: "34年以上にわたりドイツ企業と協力してきました。Von Wobeser y Sierraは、メキシコおよびラテンアメリカへの投資を行うドイツ語圏のクライアントにサービスを提供する専用のGerman Deskを維持しています。当事務所のGerman Deskの弁護士は、ドイツ語、英語、スペイン語に堪能であり、ドイツおよびオーストリア企業の当地域への投資に関する豊富な経験を持っています。私たちはドイツのビジネス文化と法的要件を理解しており、両法制度を橋渡しするシームレスなサービスを提供することができます。",
    partnersTitle: "German Desk パートナー",
    ofCounselTitle: "オブ・カウンセル",
    associatesTitle: "アソシエイト",
    yearsLabel: "年のドイツ顧客対応経験",
    clientsLabel: "ドイツのクライアント",
    languagesLabel: "言語 (ES/EN/DE)",
    foundingPartner: "創設パートナー",
    partner: "パートナー",
    teamTitle: "German Desk チーム",
    seeMore: "チーム全員を見る",
  },
  ar: {
    sectionTitle: "المكتب الألماني",
    title: "المكتب الألماني",
    subtitle: "جسرك بين ألمانيا والمكسيك",
    mexicoLabel: "مكسيكو سيتي",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "ألمانيا",
    germanySubtitle: "المكتب الألماني",
    historicalText: "منذ أكثر من 34 عامًا نعمل مع الشركات الألمانية. تحتفظ Von Wobeser y Sierra بمكتب ألماني مخصص لخدمة العملاء الناطقين بالألمانية الذين يستثمرون في المكسيك وأمريكا اللاتينية. يجيد محامو المكتب الألماني لدينا اللغات الألمانية والإنجليزية والإسبانية، ولديهم خبرة واسعة في العمل مع الشركات الألمانية والنمساوية في استثماراتها في المنطقة. نحن نفهم ثقافة الأعمال الألمانية والمتطلبات القانونية، مما يمكننا من تقديم خدمة سلسة تربط بين النظامين القانونيين.",
    partnersTitle: "شركاء المكتب الألماني",
    ofCounselTitle: "مستشار قانوني",
    associatesTitle: "محامون مشاركون",
    yearsLabel: "سنوات من الخبرة مع العملاء الألمان",
    clientsLabel: "عملاء ألمان",
    languagesLabel: "اللغات (ES/EN/DE)",
    foundingPartner: "شريك مؤسس",
    partner: "شريك",
    teamTitle: "فريق المكتب الألماني",
    seeMore: "عرض الفريق كاملاً",
  },
  ru: {
    sectionTitle: "GERMAN DESK",
    title: "German Desk",
    subtitle: "Ваш мост между Германией и Мексикой",
    mexicoLabel: "МЕХИКО",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "ГЕРМАНИЯ",
    germanySubtitle: "Немецкий отдел",
    historicalText: "Более 34 лет мы работаем с немецкими компаниями. Von Wobeser y Sierra имеет специализированный German Desk для обслуживания немецкоязычных клиентов, инвестирующих в Мексику и Латинскую Америку. Наши адвокаты German Desk свободно владеют немецким, английским и испанским языками и имеют большой опыт работы с немецкими и австрийскими компаниями по их инвестициям в регионе. Мы понимаем немецкую деловую культуру и правовые требования, что позволяет нам предоставлять бесперебойный сервис, связывающий обе правовые системы.",
    partnersTitle: "Партнёры German Desk",
    ofCounselTitle: "Советник",
    associatesTitle: "Юристы",
    yearsLabel: "лет работы с немецкими клиентами",
    clientsLabel: "Немецких клиентов",
    languagesLabel: "Языки (ES/EN/DE)",
    foundingPartner: "Партнёр-основатель",
    partner: "Партнёр",
    teamTitle: "Команда German Desk",
    seeMore: "Весь состав команды",
  },
  fr: {
    sectionTitle: "GERMAN DESK",
    title: "German Desk",
    subtitle: "Votre pont entre l'Allemagne et le Mexique",
    mexicoLabel: "MEXICO",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "ALLEMAGNE",
    germanySubtitle: "Bureau Allemand",
    historicalText: "Depuis plus de 34 ans, nous travaillons avec des entreprises allemandes. Von Wobeser y Sierra dispose d'un German Desk dédié pour servir les clients germanophones investissant au Mexique et en Amérique latine. Les avocats de notre German Desk parlent couramment l'allemand, l'anglais et l'espagnol, et possèdent une vaste expérience de travail avec des entreprises allemandes et autrichiennes sur leurs investissements dans la région. Nous comprenons la culture d'entreprise allemande et les exigences juridiques, ce qui nous permet de fournir un service fluide qui relie les deux systèmes juridiques.",
    partnersTitle: "Associés du German Desk",
    ofCounselTitle: "Avocat Conseil",
    associatesTitle: "Collaborateurs",
    yearsLabel: "ans d'expérience avec les clients allemands",
    clientsLabel: "Clients allemands",
    languagesLabel: "Langues (ES/EN/DE)",
    foundingPartner: "Associé Fondateur",
    partner: "Associé",
    teamTitle: "Équipe German Desk",
    seeMore: "Voir l'équipe complète",
  },
  it: {
    sectionTitle: "GERMAN DESK",
    title: "German Desk",
    subtitle: "Il vostro ponte tra Germania e Messico",
    mexicoLabel: "CITTÀ DEL MESSICO",
    mexicoSubtitle: "Torre SOMA Chapultepec",
    germanyLabel: "GERMANIA",
    germanySubtitle: "German Desk",
    historicalText: "Da oltre 34 anni collaboriamo con aziende tedesche. Von Wobeser y Sierra mantiene un German Desk dedicato per servire i clienti di lingua tedesca che investono in Messico e in America Latina. I nostri avvocati del German Desk parlano fluentemente tedesco, inglese e spagnolo e hanno una vasta esperienza nel lavorare con aziende tedesche e austriache sui loro investimenti nella regione. Comprendiamo la cultura aziendale tedesca e i requisiti legali, il che ci consente di fornire un servizio senza soluzione di continuità che collega entrambi i sistemi giuridici.",
    partnersTitle: "Partner del German Desk",
    ofCounselTitle: "Of Counsel",
    associatesTitle: "Associati",
    yearsLabel: "anni di esperienza con clienti tedeschi",
    clientsLabel: "Clienti tedeschi",
    languagesLabel: "Lingue (ES/EN/DE)",
    foundingPartner: "Socio Fondatore",
    partner: "Socio",
    teamTitle: "Team German Desk",
    seeMore: "Scopri il team completo",
  },
};

// useCountUp hook
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return { count, ref };
}

// StatBlock component
function StatBlock({ target, suffix, label }: { target: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="text-center py-8 lg:py-10">
      <div className="font-heading font-light text-5xl lg:text-6xl xl:text-7xl leading-none text-primary tabular-nums" data-testid="stat-value">
        {count}{suffix}
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  );
}

interface GDMember {
  id: string;
  name: string;
  photo: string;
  category: string;
  slug: string;
  number: string;
}

const DRAG_SENSITIVITY = 0.005;

function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);

  useEffect(() => {
    let width = 0;
    let fadeTimer: ReturnType<typeof setTimeout>;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 2,
      baseColor: [0.15, 0.15, 0.14],
      markerColor: [0.67, 0.1, 0.18],
      glowColor: [0.15, 0.15, 0.15],
      markers: [
        { location: [19.4326, -99.1332], size: 0.08 },
        { location: [51.1657, 10.4515], size: 0.08 },
      ],
      onRender: (state) => {
        if (pointerInteracting.current === null) {
          phiRef.current += 0.003;
        }
        state.phi = phiRef.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    fadeTimer = setTimeout(() => {
      if (canvas) canvas.style.opacity = "1";
    });

    return () => {
      clearTimeout(fadeTimer);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{
        contain: "layout paint size",
        opacity: 0,
        transition: "opacity 1s ease",
        cursor: "grab",
      }}
      onPointerDown={(e) => {
        pointerInteracting.current = e.clientX;
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      }}
      onPointerUp={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onPointerOut={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onPointerCancel={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onPointerMove={(e) => {
        if (pointerInteracting.current !== null) {
          const delta = e.clientX - pointerInteracting.current;
          pointerInteractionMovement.current = delta * DRAG_SENSITIVITY;
          pointerInteracting.current = e.clientX;
          phiRef.current += pointerInteractionMovement.current;
        }
      }}
      data-testid="globe-canvas"
    />
  );
}

export default function WorldMapSection({ language }: WorldMapSectionProps) {
  const t = content[language] || content.en;
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const gdSocios: GDMember[] = [
    { id: "claus-von-wobeser", name: "Claus von Wobeser", photo: clausVonWobeserPhoto,       category: t.foundingPartner, slug: "claus-von-wobeser", number: "01" },
    { id: "luis-burgueno",     name: "Luis Burgueño",     photo: luisBurguenoPhoto,           category: t.partner,         slug: "luis-burgueno",     number: "02" },
  ];

  const gdOfCounsel: GDMember[] = [
    { id: "katharina-roehr", name: "Katharina Roehr",  photo: katharinaRoehrPhoto, category: t.ofCounselTitle, slug: "katharina-roehr", number: "01" },
    { id: "rupert-huttler",  name: "Rupert Hüttler",   photo: rupertHuttlerPhoto,  category: t.ofCounselTitle, slug: "rupert-huttler",  number: "02" },
  ];

  const gdAssociates: GDMember[] = [
    { id: "anna-maria-brandstadter", name: "Anna Maria Brandstädter", photo: annaMariaBrandstadterPhoto, category: t.associatesTitle, slug: "anna-maria-brandstadter", number: "01" },
    { id: "michael-schreiber",       name: "Michael Schreiber",       photo: michaelSchreiberPhoto,       category: t.associatesTitle, slug: "michael-schreiber",       number: "02" },
    { id: "alexander-barnes",        name: "Alexander Barnes",        photo: alexanderBarnesPhoto,         category: t.associatesTitle, slug: "alexander-barnes",        number: "03" },
  ];

  return (
    <section
      id="german-desk"
      data-testid="section-german-desk"
      className="overflow-hidden"
    >
      <div className="bg-card dark:bg-[#111110]">

        {/* Header — stays in max-w container */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-12 h-px bg-primary mx-auto mb-6" />
            <h2
              className="font-heading font-light uppercase tracking-[0.12em] text-2xl md:text-4xl text-foreground mb-6"
              data-testid="text-global-reach-title"
            >
              {t.title}
            </h2>
            <p
              className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto"
              data-testid="text-global-reach-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>

        {/* 3D Globe + Location Cards */}
        <div
          className="relative w-full bg-[#111110] py-12 lg:py-16"
          data-testid="card-map-connection"
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">

            {/* Globe */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="relative w-full max-w-[320px] md:max-w-[440px] lg:max-w-[500px] mx-auto aspect-square mb-10"
              data-testid="globe-container"
            >
              <GlobeCanvas />
            </motion.div>

            {/* Location cards + pill */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6" data-testid="connection-line-desktop">

              {/* Mexico City card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-3 bg-[#1a1a19] border border-white/10 px-5 py-4"
                data-testid="location-mexico"
              >
                <div className="w-10 h-10 bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p
                    className="font-heading font-light text-xs uppercase tracking-[0.12em] text-white/90 leading-tight"
                    data-testid="text-mexico-label"
                  >
                    {t.mexicoLabel}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">{t.mexicoSubtitle}</p>
                </div>
              </motion.div>

              {/* Connector + pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center gap-2"
              >
                <div className="hidden md:block w-8 h-px bg-primary/40" />
                <div
                  className="bg-primary px-5 py-2"
                  data-testid="text-german-desk-label"
                >
                  <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
                    {t.sectionTitle}
                  </span>
                </div>
                <div className="hidden md:block w-8 h-px bg-primary/40" />
              </motion.div>

              {/* Germany card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex items-center gap-3 bg-[#1a1a19] border border-white/10 px-5 py-4"
                data-testid="location-germany"
              >
                <div className="w-10 h-10 bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p
                    className="font-heading font-light text-xs uppercase tracking-[0.12em] text-white/90 leading-tight"
                    data-testid="text-germany-label"
                  >
                    {t.germanyLabel}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">{t.germanySubtitle}</p>
                </div>
              </motion.div>

            </div>

          </div>
        </div>

        {/* Stats + historical text — back in max-w container */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            data-testid="stats-container"
          >
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 border-b md:border-b-0 border-border/40" data-testid="stat-years">
                <StatBlock target={34} suffix="+" label={t.yearsLabel} />
              </div>
              <div className="hidden md:block w-px my-8 bg-border/40 shrink-0" aria-hidden="true" />
              <div className="flex-1 border-b md:border-b-0 border-border/40" data-testid="stat-clients">
                <StatBlock target={100} suffix="+" label={t.clientsLabel} />
              </div>
              <div className="hidden md:block w-px my-8 bg-border/40 shrink-0" aria-hidden="true" />
              <div className="flex-1" data-testid="stat-languages">
                <StatBlock target={3} label={t.languagesLabel} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pb-20 lg:pb-28"
            data-testid="historical-text-container"
          >
            <div className="border-t border-border pt-10">
              <p
                className="text-sm text-muted-foreground leading-relaxed text-justify max-w-4xl mx-auto"
                data-testid="text-historical-description"
              >
                {t.historicalText}
              </p>
            </div>
          </motion.div>
        </div>

      </div>

      {/* German Desk Team — 3 groups by cargo */}
      <div className="bg-[#111110]" data-testid="team-members-container">

        {/* ─── SOCIOS ──────────────────────────────────────────── */}
        <div className="border-b border-[#AA1A2E]/10">
          {/* Desktop: expanding panels */}
          <div className="hidden lg:flex w-full h-[420px]" onMouseLeave={() => setActivePanel(null)}>
            {gdSocios.map((member) => {
              const isActive = activePanel === member.id;
              return (
                <Link
                  key={member.id}
                  href={`/team/${member.slug}`}
                  data-testid={`card-gdm-${member.slug}`}
                  aria-label={member.name}
                  className="relative overflow-hidden cursor-pointer block"
                  style={{ flex: isActive ? 3 : 1, transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: 0 }}
                  onMouseEnter={() => setActivePanel(member.id)}
                >
                  <img src={member.photo} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[50%_20%]" style={{ transform: isActive ? "scale(1.04)" : "scale(1)", filter: isActive ? "grayscale(0%)" : "grayscale(100%)", transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease" }} data-testid={`img-gdm-${member.slug}`} />
                  <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)", transition: "background 0.5s ease" }} />
                  <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/20" />

                  <div className="absolute bottom-5 left-3 right-3" style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.25s ease" }}>
                    <p className="text-white/70 text-[9px] uppercase tracking-[0.12em] font-light truncate" data-testid={`text-name-gdm-${member.slug}`}>{member.name}</p>
                  </div>
                  <div className="absolute bottom-6 left-5 right-5" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s" }}>
                    <p className="font-heading font-light text-base uppercase tracking-[0.1em] leading-snug mb-1 text-white">{member.name}</p>
                    <p className="text-xs text-[#AA1A2E] uppercase tracking-[0.08em] mb-3" data-testid={`text-category-gdm-${member.slug}`}>{member.category}</p>
                    <div className="flex items-center gap-2 text-[#AA1A2E]"><ArrowRight className="w-4 h-4" /></div>
                  </div>
                </Link>
              );
            })}
          </div>
          {/* Mobile: 2-col grid */}
          <div className="lg:hidden grid grid-cols-2 gap-px">
            {gdSocios.map((member) => (
              <Link key={member.id} href={`/team/${member.slug}`} className="relative h-44 overflow-hidden group block" data-testid={`card-gdm-mobile-${member.slug}`} aria-label={member.name}>
                <img src={member.photo} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top transition-[transform,filter] duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/65 group-hover:bg-black/50 transition-colors duration-300" />

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[#AA1A2E] text-[9px] uppercase tracking-[0.08em] mb-0.5">{member.category}</p>
                  <p className="text-white/90 text-xs uppercase tracking-[0.1em] leading-snug font-light">{member.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── OF COUNSEL ──────────────────────────────────────── */}
        <div className="bg-[#0d0d0c] border-b border-[#AA1A2E]/10">
          <div className="px-6 lg:px-12 pt-8 pb-4 flex items-center gap-3">
            <div className="w-8 h-px bg-[#AA1A2E] shrink-0" />
            <p className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase">{t.ofCounselTitle}</p>
          </div>
          <div className="hidden lg:flex w-full h-[380px]" onMouseLeave={() => setActivePanel(null)}>
            {gdOfCounsel.map((member) => {
              const isActive = activePanel === member.id;
              return (
                <Link
                  key={member.id}
                  href={`/team/${member.slug}`}
                  data-testid={`card-gdm-${member.slug}`}
                  aria-label={member.name}
                  className="relative overflow-hidden cursor-pointer block"
                  style={{ flex: isActive ? 3 : 1, transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: 0 }}
                  onMouseEnter={() => setActivePanel(member.id)}
                >
                  <img src={member.photo} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[50%_20%]" style={{ transform: isActive ? "scale(1.04)" : "scale(1)", filter: isActive ? "grayscale(0%)" : "grayscale(100%)", transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease" }} data-testid={`img-gdm-${member.slug}`} />
                  <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)", transition: "background 0.5s ease" }} />
                  <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/20" />

                  <div className="absolute bottom-5 left-3 right-3" style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.25s ease" }}>
                    <p className="text-white/70 text-[9px] uppercase tracking-[0.12em] font-light truncate" data-testid={`text-name-gdm-${member.slug}`}>{member.name}</p>
                  </div>
                  <div className="absolute bottom-6 left-5 right-5" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s" }}>
                    <p className="font-heading font-light text-base uppercase tracking-[0.1em] leading-snug mb-1 text-white">{member.name}</p>
                    <p className="text-xs text-[#AA1A2E] uppercase tracking-[0.08em] mb-3" data-testid={`text-category-gdm-${member.slug}`}>{member.category}</p>
                    <div className="flex items-center gap-2 text-[#AA1A2E]"><ArrowRight className="w-4 h-4" /></div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="lg:hidden grid grid-cols-2 gap-px">
            {gdOfCounsel.map((member) => (
              <Link key={member.id} href={`/team/${member.slug}`} className="relative h-44 overflow-hidden group block" data-testid={`card-gdm-mobile-${member.slug}`} aria-label={member.name}>
                <img src={member.photo} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top transition-[transform,filter] duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/65 group-hover:bg-black/50 transition-colors duration-300" />

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[#AA1A2E] text-[9px] uppercase tracking-[0.08em] mb-0.5">{member.category}</p>
                  <p className="text-white/90 text-xs uppercase tracking-[0.1em] leading-snug font-light">{member.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── ASOCIADOS ───────────────────────────────────────── */}
        <div>
          <div className="px-6 lg:px-12 pt-8 pb-4 flex items-center gap-3">
            <div className="w-8 h-px bg-[#AA1A2E] shrink-0" />
            <p className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase">{t.associatesTitle}</p>
          </div>
          <div className="hidden lg:flex w-full h-[380px]" onMouseLeave={() => setActivePanel(null)}>
            {gdAssociates.map((member) => {
              const isActive = activePanel === member.id;
              return (
                <Link
                  key={member.id}
                  href={`/team/${member.slug}`}
                  data-testid={`card-gdm-${member.slug}`}
                  aria-label={member.name}
                  className="relative overflow-hidden cursor-pointer block"
                  style={{ flex: isActive ? 3 : 1, transition: "flex 0.5s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: 0 }}
                  onMouseEnter={() => setActivePanel(member.id)}
                >
                  <img src={member.photo} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[50%_20%]" style={{ transform: isActive ? "scale(1.04)" : "scale(1)", filter: isActive ? "grayscale(0%)" : "grayscale(100%)", transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease" }} data-testid={`img-gdm-${member.slug}`} />
                  <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)", transition: "background 0.5s ease" }} />
                  <div className="absolute top-0 right-0 w-px h-full bg-[#AA1A2E]/20" />

                  <div className="absolute bottom-5 left-3 right-3" style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.25s ease" }}>
                    <p className="text-white/70 text-[9px] uppercase tracking-[0.12em] font-light truncate" data-testid={`text-name-gdm-${member.slug}`}>{member.name}</p>
                  </div>
                  <div className="absolute bottom-6 left-5 right-5" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s" }}>
                    <p className="font-heading font-light text-base uppercase tracking-[0.1em] leading-snug mb-1 text-white">{member.name}</p>
                    <p className="text-xs text-[#AA1A2E] uppercase tracking-[0.08em] mb-3" data-testid={`text-category-gdm-${member.slug}`}>{member.category}</p>
                    <div className="flex items-center gap-2 text-[#AA1A2E]"><ArrowRight className="w-4 h-4" /></div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="lg:hidden grid grid-cols-2 gap-px">
            {gdAssociates.map((member) => (
              <Link key={member.id} href={`/team/${member.slug}`} className="relative h-44 overflow-hidden group block" data-testid={`card-gdm-mobile-${member.slug}`} aria-label={member.name}>
                <img src={member.photo} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top transition-[transform,filter] duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/65 group-hover:bg-black/50 transition-colors duration-300" />

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[#AA1A2E] text-[9px] uppercase tracking-[0.08em] mb-0.5">{member.category}</p>
                  <p className="text-white/90 text-xs uppercase tracking-[0.1em] leading-snug font-light">{member.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom strip: section title (left) + CTA link (right) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#AA1A2E]/10"
        >
          <div className="flex items-center gap-5">
            <div className="w-10 h-px bg-[#AA1A2E] shrink-0" />
            <div>
              <p className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase mb-1">
                {t.sectionTitle}
              </p>
              <h2
                className="font-heading font-light text-xl md:text-2xl text-white/90 uppercase tracking-[0.12em]"
                data-testid="text-team-title"
              >
                {t.teamTitle}
              </h2>
            </div>
          </div>
          <Link
            href="/german-desk"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors duration-200 group"
            data-testid="link-gdm-see-more"
          >
            {t.seeMore}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>

      </div>

    </section>
  );
}
