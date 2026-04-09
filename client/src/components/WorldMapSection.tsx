import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

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

interface TeamMember {
  id: string;
  name: string;
  photo: string;
  title?: string;
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
  },
};

// Equirectangular pin coordinates (1000×500 viewBox):
// x = (lon + 180) / 360 * 1000 ; y = (90 - lat) / 180 * 500
// Mexico City 19.4°N 99.1°W → x≈225 y≈196
// Germany     50.0°N  8.7°E → x≈524 y≈111
const MX = { x: 225, y: 196 };
const DE = { x: 524, y: 111 };
const ARC = `M ${MX.x},${MX.y} Q 374,18 ${DE.x},${DE.y}`;

// Simplified continent paths (equirectangular 1000×500)
const LAND = [
  // North America (Alaska → west coast → Mexico → Caribbean coast → east coast → Canada)
  "M 80,72 L 162,68 L 160,90 L 158,115 L 162,148 L 166,162 L 174,178 L 180,192 L 196,210 L 220,215 L 242,208 L 260,198 L 268,210 L 278,200 L 288,182 L 296,165 L 304,148 L 308,132 L 308,118 L 302,105 L 314,98 L 335,98 L 342,108 L 320,115 L 308,108 L 298,90 L 280,76 L 260,65 L 240,58 L 215,52 L 188,55 L 160,60 L 128,62 L 100,68 Z",
  // Greenland
  "M 322,42 L 372,38 L 390,52 L 380,70 L 358,76 L 330,68 L 318,55 Z",
  // South America
  "M 242,232 L 272,228 L 324,228 L 372,255 L 372,296 L 354,328 L 320,356 L 294,382 L 274,368 L 254,335 L 248,302 L 244,268 L 248,248 Z",
  // Europe
  "M 450,148 L 455,138 L 462,128 L 475,118 L 488,115 L 498,108 L 508,105 L 515,100 L 522,105 L 528,100 L 530,92 L 527,82 L 535,72 L 541,64 L 537,56 L 524,50 L 514,48 L 518,42 L 536,38 L 552,42 L 568,52 L 580,62 L 596,70 L 608,78 L 615,88 L 618,98 L 610,110 L 596,122 L 584,132 L 572,142 L 560,148 L 548,158 L 542,168 L 534,162 L 526,154 L 518,147 L 510,141 L 510,131 L 518,124 L 508,118 L 497,122 L 490,128 L 481,132 L 474,140 L 467,148 L 457,152 Z",
  // UK (island)
  "M 488,110 L 495,102 L 500,108 L 497,118 L 491,118 Z",
  // Iceland
  "M 443,82 L 454,78 L 462,82 L 458,90 L 447,90 L 441,86 Z",
  // Africa
  "M 462,155 L 488,148 L 532,150 L 558,162 L 591,165 L 600,175 L 608,190 L 616,215 L 640,218 L 638,248 L 624,278 L 612,310 L 590,338 L 558,352 L 540,342 L 514,352 L 498,335 L 485,308 L 472,278 L 457,252 L 447,228 L 444,205 L 447,188 L 455,175 L 462,162 Z",
  // Asia (main mass from Turkey east to Japan)
  "M 580,138 L 598,128 L 616,120 L 641,108 L 668,98 L 700,85 L 746,72 L 800,62 L 860,60 L 912,75 L 938,95 L 930,118 L 918,132 L 903,145 L 890,158 L 878,168 L 868,180 L 855,188 L 843,198 L 828,205 L 812,215 L 797,218 L 779,215 L 763,205 L 746,205 L 728,198 L 716,188 L 708,178 L 696,175 L 691,185 L 696,198 L 703,215 L 706,232 L 703,248 L 696,258 L 690,265 L 686,259 L 683,248 L 679,235 L 675,222 L 668,208 L 660,198 L 651,188 L 638,175 L 625,162 L 616,154 L 607,147 L 596,144 L 587,138 Z",
  // Arabian Peninsula
  "M 592,162 L 612,158 L 638,168 L 649,185 L 658,196 L 657,210 L 643,219 L 620,225 L 604,221 L 596,210 L 589,195 L 589,178 Z",
  // Indian subcontinent
  "M 702,178 L 718,178 L 728,185 L 730,200 L 724,218 L 716,232 L 708,245 L 700,252 L 693,261 L 686,269 L 683,259 L 686,248 L 690,238 L 690,225 L 688,215 L 683,205 L 676,195 L 670,185 L 663,180 L 672,178 L 686,174 Z",
  // Australia
  "M 858,282 L 895,278 L 925,322 L 919,342 L 906,358 L 886,348 L 856,348 L 818,338 L 811,308 L 854,282 Z",
  // Japan (Honshu simplified)
  "M 885,148 L 892,155 L 895,162 L 890,168 L 882,162 L 881,152 Z",
];

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
    <div ref={ref} className="text-center py-10 lg:py-12">
      <div className="font-heading font-light text-7xl lg:text-9xl leading-none text-primary tabular-nums" data-testid="stat-value">
        {count}{suffix}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>
    </div>
  );
}

export default function WorldMapSection({ language }: WorldMapSectionProps) {
  const t = content[language] || content.en;

  const partners: TeamMember[] = [
    { id: "claus-von-wobeser", name: "Claus von Wobeser", photo: clausVonWobeserPhoto, title: t.foundingPartner },
    { id: "luis-burgueno", name: "Luis Burgueño", photo: luisBurguenoPhoto, title: t.partner },
  ];

  const ofCounsel: TeamMember[] = [
    { id: "katharina-roehr", name: "Katharina Roehr", photo: katharinaRoehrPhoto },
    { id: "rupert-huttler", name: "Rupert Hüttler", photo: rupertHuttlerPhoto },
  ];

  const associates: TeamMember[] = [
    { id: "anna-maria-brandstadter", name: "Anna Maria Brandstädter", photo: annaMariaBrandstadterPhoto },
    { id: "michael-schreiber", name: "Michael Schreiber", photo: michaelSchreiberPhoto },
    { id: "alexander-barnes", name: "Alexander Barnes", photo: alexanderBarnesPhoto },
  ];

  const TeamMemberCard = ({ member, testIdPrefix }: { member: TeamMember; testIdPrefix: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center"
      data-testid={`${testIdPrefix}-${member.id}`}
    >
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 border-2 border-primary/20">
        <img
          src={member.photo}
          alt={member.name}
          className="w-full h-full object-cover"
          data-testid={`img-${testIdPrefix}-${member.id}`}
        />
      </div>
      <h4
        className="text-sm md:text-base font-semibold text-foreground"
        data-testid={`text-name-${member.id}`}
      >
        {member.name}
      </h4>
      {member.title && (
        <p
          className="text-xs text-muted-foreground mt-1"
          data-testid={`text-title-${member.id}`}
        >
          {member.title}
        </p>
      )}
    </motion.div>
  );

  return (
    <section
      id="german-desk"
      data-testid="section-german-desk"
      className="overflow-hidden"
    >
      <div className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 lg:pt-28">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-12 h-px bg-primary mx-auto mb-6" />
            <p
              className="text-primary text-[10px] tracking-[0.25em] uppercase mb-5"
              data-testid="text-section-title"
            >
              {t.sectionTitle}
            </p>
            <h2
              className="font-heading font-light uppercase tracking-[0.12em] text-2xl md:text-4xl text-white mb-6"
              data-testid="text-global-reach-title"
            >
              {t.title}
            </h2>
            <p
              className="text-sm text-white/60 leading-relaxed max-w-2xl mx-auto"
              data-testid="text-global-reach-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>

          {/* World Map SVG */}
          <span data-testid="connection-line-mobile" className="sr-only" aria-hidden="true" />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="w-full"
            data-testid="card-map-connection"
          >
            <svg
              viewBox="0 0 1000 500"
              className="w-full"
              style={{ aspectRatio: "1000 / 500" }}
              aria-hidden="true"
            >
              {/* Latitude grid lines */}
              {[83, 167, 250, 333, 417].map((y) => (
                <line key={y} x1={0} y1={y} x2={1000} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))}
              {/* Longitude grid lines */}
              {[167, 333, 500, 667, 833].map((x) => (
                <line key={x} x1={x} y1={0} x2={x} y2={500} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))}

              {/* Continent land masses */}
              {LAND.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="rgba(255,255,255,0.07)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
              ))}

              {/* Animated arc from Mexico to Germany */}
              <g data-testid="connection-line-desktop">
                <motion.path
                  d={ARC}
                  fill="none"
                  stroke="#AA1A2E"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.8 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.4, delay: 0.8, ease: "easeInOut" }}
                />
              </g>

              {/* Mexico City pin */}
              <g data-testid="location-mexico">
                {/* Outer pulse rings */}
                <motion.circle
                  cx={MX.x} cy={MX.y} r={6}
                  fill="none"
                  stroke="#AA1A2E"
                  strokeWidth="1"
                  animate={{ r: [6, 22, 6], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  cx={MX.x} cy={MX.y} r={6}
                  fill="none"
                  stroke="#AA1A2E"
                  strokeWidth="1"
                  animate={{ r: [6, 14, 6], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                />
                {/* Core dot */}
                <circle cx={MX.x} cy={MX.y} r={4} fill="#AA1A2E" />
                <circle cx={MX.x} cy={MX.y} r={2} fill="white" />
                {/* Label box */}
                <rect x={MX.x - 52} y={MX.y + 10} width={104} height={28} rx={0} fill="rgba(10,10,20,0.85)" />
                <text
                  x={MX.x} y={MX.y + 23}
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  letterSpacing="1.5"
                  data-testid="text-mexico-label"
                >
                  {t.mexicoLabel}
                </text>
                <text
                  x={MX.x} y={MX.y + 33}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="5.5"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.8"
                >
                  {t.mexicoSubtitle}
                </text>
              </g>

              {/* Germany pin */}
              <g data-testid="location-germany">
                {/* Outer pulse rings */}
                <motion.circle
                  cx={DE.x} cy={DE.y} r={6}
                  fill="none"
                  stroke="#AA1A2E"
                  strokeWidth="1"
                  animate={{ r: [6, 22, 6], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                />
                <motion.circle
                  cx={DE.x} cy={DE.y} r={6}
                  fill="none"
                  stroke="#AA1A2E"
                  strokeWidth="1"
                  animate={{ r: [6, 14, 6], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
                />
                {/* Core dot */}
                <circle cx={DE.x} cy={DE.y} r={4} fill="#AA1A2E" />
                <circle cx={DE.x} cy={DE.y} r={2} fill="white" />
                {/* Label box — above the pin to avoid overlap with arc */}
                <rect x={DE.x - 46} y={DE.y - 38} width={92} height={28} rx={0} fill="rgba(10,10,20,0.85)" />
                <text
                  x={DE.x} y={DE.y - 25}
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  letterSpacing="1.5"
                  data-testid="text-germany-label"
                >
                  {t.germanyLabel}
                </text>
                <text
                  x={DE.x} y={DE.y - 15}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="5.5"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.8"
                >
                  {t.germanySubtitle}
                </text>
                {/* Connector line from label to pin */}
                <line x1={DE.x} y1={DE.y - 10} x2={DE.x} y2={DE.y - 5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              </g>

              {/* German Desk label on arc midpoint */}
              <motion.g
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 3.0 }}
                data-testid="text-german-desk-label"
              >
                <rect x={332} y={12} width={84} height={16} rx={0} fill="rgba(170,26,46,0.9)" />
                <text
                  x={374} y={23}
                  textAnchor="middle"
                  fill="white"
                  fontSize="6"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="700"
                  letterSpacing="1.8"
                >
                  {t.sectionTitle}
                </text>
              </motion.g>
            </svg>
          </motion.div>

          {/* Stats XXL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            data-testid="stats-container"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div data-testid="stat-years">
                <StatBlock target={34} suffix="+" label={t.yearsLabel} />
              </div>
              <div data-testid="stat-clients">
                <StatBlock target={100} suffix="+" label={t.clientsLabel} />
              </div>
              <div data-testid="stat-languages">
                <StatBlock target={3} label={t.languagesLabel} />
              </div>
            </div>
          </motion.div>

          {/* Historical text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pb-20 lg:pb-28"
            data-testid="historical-text-container"
          >
            <div className="border-t border-white/10 pt-10">
              <p
                className="text-sm text-white/65 leading-relaxed text-justify max-w-4xl mx-auto"
                data-testid="text-historical-description"
              >
                {t.historicalText}
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="bg-background py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="space-y-12" data-testid="team-members-container">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              data-testid="partners-section"
            >
              <h3
                className="text-lg md:text-xl font-heading font-light text-foreground text-center mb-8 uppercase tracking-[0.12em]"
                data-testid="text-partners-title"
              >
                {t.partnersTitle}
              </h3>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {partners.map((member) => (
                  <TeamMemberCard key={member.id} member={member} testIdPrefix="partner" />
                ))}
              </div>
            </motion.div>

            <div className="border-t border-border" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              data-testid="of-counsel-section"
            >
              <h3
                className="text-lg md:text-xl font-heading font-light text-foreground text-center mb-8 uppercase tracking-[0.12em]"
                data-testid="text-of-counsel-title"
              >
                {t.ofCounselTitle}
              </h3>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {ofCounsel.map((member) => (
                  <TeamMemberCard key={member.id} member={member} testIdPrefix="of-counsel" />
                ))}
              </div>
            </motion.div>

            <div className="border-t border-border" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              data-testid="associates-section"
            >
              <h3
                className="text-lg md:text-xl font-heading font-light text-foreground text-center mb-8 uppercase tracking-[0.12em]"
                data-testid="text-associates-title"
              >
                {t.associatesTitle}
              </h3>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {associates.map((member) => (
                  <TeamMemberCard key={member.id} member={member} testIdPrefix="associate" />
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>

    </section>
  );
}
