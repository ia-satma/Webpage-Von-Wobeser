import { Link } from "wouter";
import { Award, Star, BookOpen, Users, Scale, Globe2, Briefcase, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { PageHero, Section, SectionTitle, Label } from "@/components/firm";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember } from "@shared/schema";

interface DirectoryInfo {
  id: string;
  name: string;
  nameEs: string;
  icon: typeof Award;
  description: string;
  descriptionEs: string;
  rankings: { en: string; es: string }[];
}

const directories: DirectoryInfo[] = [
  {
    id: "chambers-global",
    name: "Chambers Global",
    nameEs: "Chambers Global",
    icon: Globe2,
    description: "Recognized as one of the leading law firms in Mexico for cross-border transactions and international matters.",
    descriptionEs: "Reconocido como una de las firmas de abogados líderes en México para transacciones transfronterizas y asuntos internacionales.",
    rankings: [
      { en: "Band 1 - Corporate/M&A", es: "Banda 1 - Corporativo/M&A" },
      { en: "Band 1 - Dispute Resolution", es: "Banda 1 - Resolución de Controversias" },
      { en: "Band 1 - Antitrust", es: "Banda 1 - Competencia Económica" },
    ],
  },
  {
    id: "chambers-latam",
    name: "Chambers Latin America",
    nameEs: "Chambers América Latina",
    icon: Award,
    description: "Consistently ranked in the top tier across multiple practice areas for excellence in the Latin American market.",
    descriptionEs: "Consistentemente clasificado en el nivel superior en múltiples áreas de práctica por excelencia en el mercado latinoamericano.",
    rankings: [
      { en: "Band 1 - Corporate/M&A", es: "Banda 1 - Corporativo/M&A" },
      { en: "Band 1 - Litigation", es: "Banda 1 - Litigio" },
      { en: "Band 1 - Banking & Finance", es: "Banda 1 - Banca y Finanzas" },
      { en: "Band 1 - Energy & Natural Resources", es: "Banda 1 - Energía y Recursos Naturales" },
    ],
  },
  {
    id: "legal500",
    name: "Legal 500 Latin America",
    nameEs: "Legal 500 América Latina",
    icon: BookOpen,
    description: "Highly recommended for outstanding client service and legal expertise across various sectors.",
    descriptionEs: "Altamente recomendado por excelente servicio al cliente y experiencia legal en diversos sectores.",
    rankings: [
      { en: "Tier 1 - Corporate and M&A", es: "Nivel 1 - Corporativo y M&A" },
      { en: "Tier 1 - Dispute Resolution", es: "Nivel 1 - Resolución de Controversias" },
      { en: "Tier 1 - Competition/Antitrust", es: "Nivel 1 - Competencia Económica" },
    ],
  },
  {
    id: "iflr1000",
    name: "IFLR1000",
    nameEs: "IFLR1000",
    icon: Briefcase,
    description: "Top-ranked for financial and corporate work, including complex restructuring and capital markets transactions.",
    descriptionEs: "Clasificación superior para trabajo financiero y corporativo, incluyendo reestructuraciones complejas y transacciones de mercado de capitales.",
    rankings: [
      { en: "Tier 1 - M&A", es: "Nivel 1 - M&A" },
      { en: "Tier 1 - Banking", es: "Nivel 1 - Banca" },
      { en: "Tier 1 - Capital Markets", es: "Nivel 1 - Mercado de Capitales" },
      { en: "Tier 1 - Restructuring & Insolvency", es: "Nivel 1 - Reestructuración e Insolvencia" },
    ],
  },
  {
    id: "latin-lawyer",
    name: "Latin Lawyer 250",
    nameEs: "Latin Lawyer 250",
    icon: Scale,
    description: "Featured as an Elite firm and consistently recognized among the top law firms in Latin America.",
    descriptionEs: "Destacado como firma Elite y consistentemente reconocido entre las mejores firmas de abogados en América Latina.",
    rankings: [
      { en: "Elite Status", es: "Estatus Elite" },
      { en: "Deal of the Year - Multiple Categories", es: "Operación del Año - Múltiples Categorías" },
    ],
  },
  {
    id: "best-lawyers",
    name: "Best Lawyers",
    nameEs: "Best Lawyers",
    icon: Star,
    description: "Multiple partners recognized as leading lawyers in their respective practice areas.",
    descriptionEs: "Múltiples socios reconocidos como abogados líderes en sus respectivas áreas de práctica.",
    rankings: [
      { en: "Lawyer of the Year - Corporate Law", es: "Abogado del Año - Derecho Corporativo" },
      { en: "Lawyer of the Year - M&A", es: "Abogado del Año - M&A" },
      { en: "20+ Lawyers Recognized", es: "20+ Abogados Reconocidos" },
    ],
  },
  {
    id: "who-who-legal",
    name: "Who's Who Legal",
    nameEs: "Who's Who Legal",
    icon: Users,
    description: "Partners listed as Global Leaders and National Leaders across multiple specializations.",
    descriptionEs: "Socios listados como Líderes Globales y Líderes Nacionales en múltiples especializaciones.",
    rankings: [
      { en: "Global Leaders - Arbitration", es: "Líderes Globales - Arbitraje" },
      { en: "National Leaders - Competition", es: "Líderes Nacionales - Competencia" },
      { en: "Thought Leaders - Investigations", es: "Líderes de Opinión - Investigaciones" },
    ],
  },
];

interface AwardInfo {
  id: string;
  title: string;
  titleEs: string;
  years?: string[];
  description: string;
  descriptionEs: string;
}

const awards: AwardInfo[] = [
  {
    id: "law-firm-year",
    title: "Latin American Law Firm of the Year",
    titleEs: "Firma de Abogados del Año en América Latina",
    years: ["2023", "2021", "2019", "2017"],
    description: "Chambers Latin America Awards recognition for outstanding performance and market-leading work.",
    descriptionEs: "Reconocimiento de Chambers Latin America Awards por desempeño sobresaliente y trabajo líder en el mercado.",
  },
  {
    id: "mexico-firm-year",
    title: "Mexico Law Firm of the Year",
    titleEs: "Firma de Abogados del Año en México",
    years: ["2024", "2022", "2020", "2018"],
    description: "Chambers Latin America Awards recognition as the leading law firm in Mexico.",
    descriptionEs: "Reconocimiento de Chambers Latin America Awards como la firma de abogados líder en México.",
  },
  {
    id: "deal-of-year",
    title: "Deal of the Year Awards",
    titleEs: "Premios Operación del Año",
    description: "Multiple Deal of the Year recognitions from Latin Lawyer, IFLR Americas, and Chambers for landmark transactions.",
    descriptionEs: "Múltiples reconocimientos de Operación del Año de Latin Lawyer, IFLR Americas y Chambers por transacciones emblemáticas.",
  },
  {
    id: "gir-100",
    title: "GIR 100 - Global Investigations Review",
    titleEs: "GIR 100 - Global Investigations Review",
    description: "Recognized among the world's top 100 investigations practices for excellence in anti-corruption and compliance matters.",
    descriptionEs: "Reconocido entre las 100 mejores prácticas de investigaciones del mundo por excelencia en asuntos anticorrupción y cumplimiento.",
  },
];

const rankedLawyers = [
  { name: "Claus von Wobeser", slug: "claus-von-wobeser", title: "Founding Partner", titleEs: "Socio Fundador" },
  { name: "Pablo Fautsch", slug: "pablo-fautsch", title: "Partner", titleEs: "Socio" },
  { name: "Fernando Carreño", slug: "fernando-carreno", title: "Partner", titleEs: "Socio" },
  { name: "Diego Sierra", slug: "diego-sierra", title: "Partner", titleEs: "Socio" },
  { name: "Adrián Magallanes", slug: "adrian-magallanes", title: "Partner", titleEs: "Socio" },
  { name: "Montserrat Manzano", slug: "montserrat-manzano", title: "Partner", titleEs: "Socio" },
];

export default function Rankings() {
  const { language } = useLanguage();
  const directoriesRef = useFadeOnScroll<HTMLDivElement>();
  const awardsRef = useFadeOnScroll<HTMLDivElement>();
  const lawyersRef = useFadeOnScroll<HTMLDivElement>();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const content: Record<string, {
    title: string;
    subtitle: string;
    overviewTitle: string;
    overviewText1: string;
    overviewText2: string;
    directoriesTitle: string;
    directoriesSubtitle: string;
    awardsTitle: string;
    awardsSubtitle: string;
    lawyersTitle: string;
    lawyersSubtitle: string;
    viewProfile: string;
    quoteText: string;
    quoteSource: string;
    viewAllTeam: string;
    recognitions: string;
    awards: string;
    rankings: string;
    year: string;
  }> = {
    en: {
      title: "Rankings & Recognition",
      subtitle: "Consistently recognized as one of the leading law firms in Mexico and Latin America",
      overviewTitle: "Excellence Recognized Worldwide",
      overviewText1: "Von Wobeser y Sierra is consistently ranked among the top law firms in Mexico and Latin America by the world's most prestigious legal directories. Our commitment to excellence, deep expertise, and client-focused approach have earned us recognition across all major practice areas.",
      overviewText2: "For over seven decades, we have maintained our position as a market leader, earning top-tier rankings from Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250, and other leading publications.",
      directoriesTitle: "Major Legal Directories",
      directoriesSubtitle: "Top rankings across all major international legal directories",
      awardsTitle: "Awards & Achievements",
      awardsSubtitle: "Recent accolades recognizing our excellence in legal services",
      lawyersTitle: "Ranked Lawyers",
      lawyersSubtitle: "Our attorneys are individually recognized as leaders in their fields",
      viewProfile: "View Profile",
      quoteText: "Von Wobeser y Sierra is 'the standout Mexican firm' with 'an enviable client roster and stellar reputation for high-end transactional and contentious work.'",
      quoteSource: "Chambers Latin America",
      viewAllTeam: "View All Team Members",
      recognitions: "Recognitions",
      awards: "Awards",
      rankings: "Rankings",
      year: "Year",
    },
    es: {
      title: "Reconocimientos",
      subtitle: "Von Wobeser y Sierra ha sido reconocido a nivel internacional por diversas instituciones que incluyen Chambers Global, Chambers Latin America, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR), Global Investigations Review (GIR), Legal 500, Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000 e IFLR Energy & Infrastructure y Benchmark Litigation entre otras.",
      overviewTitle: "Excelencia Reconocida Mundialmente",
      overviewText1: "Von Wobeser y Sierra es consistentemente clasificado entre las principales firmas de abogados en México y América Latina por los directorios legales más prestigiosos del mundo. Nuestro compromiso con la excelencia, profunda experiencia y enfoque centrado en el cliente nos han ganado reconocimiento en todas las principales áreas de práctica.",
      overviewText2: "Durante más de siete décadas, hemos mantenido nuestra posición como líder del mercado, obteniendo clasificaciones de primer nivel de Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 y otras publicaciones líderes.",
      directoriesTitle: "Principales Directorios Legales",
      directoriesSubtitle: "Clasificaciones superiores en todos los principales directorios legales internacionales",
      awardsTitle: "Premios y Logros",
      awardsSubtitle: "Reconocimientos recientes que destacan nuestra excelencia en servicios legales",
      lawyersTitle: "Abogados Reconocidos",
      lawyersSubtitle: "Nuestros abogados son individualmente reconocidos como líderes en sus campos",
      viewProfile: "Ver Perfil",
      quoteText: "Von Wobeser y Sierra es 'la firma mexicana destacada' con 'una envidiable cartera de clientes y una reputación estelar para trabajo transaccional y contencioso de alto nivel.'",
      quoteSource: "Chambers América Latina",
      viewAllTeam: "Ver Todo el Equipo",
      recognitions: "Reconocimientos",
      awards: "Premios",
      rankings: "Rankings",
      year: "Año",
    },
    de: {
      title: "Auszeichnungen",
      subtitle: "Unsere Anerkennungen und Auszeichnungen",
      overviewTitle: "Weltweit anerkannte Exzellenz",
      overviewText1: "Von Wobeser y Sierra wird von den weltweit renommiertesten Rechtsverzeichnissen regelmäßig unter den besten Anwaltskanzleien in Mexiko und Lateinamerika eingestuft. Unser Engagement für Exzellenz, tiefgreifende Expertise und kundenorientierter Ansatz haben uns Anerkennung in allen wichtigen Praxisbereichen eingebracht.",
      overviewText2: "Seit über sieben Jahrzehnten behaupten wir unsere Position als Marktführer und erhalten Top-Bewertungen von Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 und anderen führenden Publikationen.",
      directoriesTitle: "Wichtige Rechtsverzeichnisse",
      directoriesSubtitle: "Spitzenplatzierungen in allen wichtigen internationalen Rechtsverzeichnissen",
      awardsTitle: "Preise und Erfolge",
      awardsSubtitle: "Aktuelle Auszeichnungen, die unsere Exzellenz in Rechtsdienstleistungen würdigen",
      lawyersTitle: "Ausgezeichnete Anwälte",
      lawyersSubtitle: "Unsere Anwälte werden individuell als Führungskräfte in ihren Bereichen anerkannt",
      viewProfile: "Profil ansehen",
      quoteText: "Von Wobeser y Sierra ist 'die herausragende mexikanische Kanzlei' mit 'einem beneidenswerten Mandantenkreis und einem hervorragenden Ruf für hochwertige transaktionale und streitige Arbeit.'",
      quoteSource: "Chambers Lateinamerika",
      viewAllTeam: "Alle Teammitglieder anzeigen",
      recognitions: "Anerkennungen",
      awards: "Auszeichnungen",
      rankings: "Rankings",
      year: "Jahr",
    },
    zh: {
      title: "荣誉",
      subtitle: "我们的认可和奖项",
      overviewTitle: "全球公认的卓越",
      overviewText1: "Von Wobeser y Sierra被世界上最负盛名的法律目录一致评为墨西哥和拉丁美洲顶级律师事务所之一。我们对卓越的承诺、深厚的专业知识和以客户为中心的方法使我们在所有主要业务领域获得认可。",
      overviewText2: "七十多年来，我们一直保持着市场领导者的地位，获得了Chambers and Partners、Legal 500、IFLR1000、Latin Lawyer 250和其他领先出版物的顶级评级。",
      directoriesTitle: "主要法律目录",
      directoriesSubtitle: "在所有主要国际法律目录中名列前茅",
      awardsTitle: "奖项与成就",
      awardsSubtitle: "表彰我们法律服务卓越的最新荣誉",
      lawyersTitle: "获评律师",
      lawyersSubtitle: "我们的律师个人被公认为各自领域的领导者",
      viewProfile: "查看简介",
      quoteText: "Von Wobeser y Sierra是'杰出的墨西哥律所'，拥有'令人羡慕的客户名单和卓越的高端交易和争议工作声誉。'",
      quoteSource: "Chambers 拉丁美洲",
      viewAllTeam: "查看所有团队成员",
      recognitions: "认可",
      awards: "奖项",
      rankings: "排名",
      year: "年份",
    },
    ko: {
      title: "순위 및 인정",
      subtitle: "멕시코와 라틴 아메리카 최고의 로펌으로 지속적으로 인정받고 있습니다",
      overviewTitle: "전 세계적으로 인정받는 우수성",
      overviewText1: "Von Wobeser y Sierra는 세계에서 가장 권위 있는 법률 디렉토리에서 멕시코와 라틴 아메리카 최고의 로펌으로 꾸준히 평가받고 있습니다. 우수성에 대한 헌신, 깊은 전문성, 고객 중심 접근 방식으로 모든 주요 업무 분야에서 인정받고 있습니다.",
      overviewText2: "70년 이상 우리는 시장 리더로서의 위치를 유지하며 Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 및 기타 주요 출판물에서 최고 등급을 받아왔습니다.",
      directoriesTitle: "주요 법률 디렉토리",
      directoriesSubtitle: "모든 주요 국제 법률 디렉토리에서 최고 순위",
      awardsTitle: "수상 및 성과",
      awardsSubtitle: "법률 서비스의 우수성을 인정하는 최근 수상",
      lawyersTitle: "순위에 오른 변호사",
      lawyersSubtitle: "우리 변호사들은 각자의 분야에서 리더로 개별 인정받고 있습니다",
      viewProfile: "프로필 보기",
      quoteText: "Von Wobeser y Sierra는 '부러운 고객 명단과 고급 거래 및 소송 업무에 대한 탁월한 명성을 가진' '뛰어난 멕시코 로펌'입니다.",
      quoteSource: "Chambers 라틴 아메리카",
      viewAllTeam: "모든 팀원 보기",
      recognitions: "인정",
      awards: "수상",
      rankings: "순위",
      year: "연도",
    },
    ja: {
      title: "ランキングと表彰",
      subtitle: "メキシコとラテンアメリカを代表する法律事務所として一貫して認められています",
      overviewTitle: "世界的に認められた卓越性",
      overviewText1: "Von Wobeser y Sierraは、世界で最も権威ある法律ディレクトリによって、メキシコとラテンアメリカのトップ法律事務所として一貫して評価されています。卓越性へのコミットメント、深い専門知識、クライアント重視のアプローチにより、すべての主要な業務分野で認められています。",
      overviewText2: "70年以上にわたり、Chambers and Partners、Legal 500、IFLR1000、Latin Lawyer 250、その他の主要出版物からトップランクを獲得し、市場リーダーとしての地位を維持してきました。",
      directoriesTitle: "主要法律ディレクトリ",
      directoriesSubtitle: "すべての主要な国際法律ディレクトリでトップランク",
      awardsTitle: "受賞と実績",
      awardsSubtitle: "法律サービスの卓越性を認める最近の受賞",
      lawyersTitle: "ランク入りした弁護士",
      lawyersSubtitle: "当事務所の弁護士は、それぞれの分野でリーダーとして個別に認められています",
      viewProfile: "プロフィールを見る",
      quoteText: "Von Wobeser y Sierraは'羨望のクライアントリストと高級トランザクションおよび訴訟業務に対する卓越した評判を持つ''傑出したメキシコの法律事務所'です。",
      quoteSource: "Chambers ラテンアメリカ",
      viewAllTeam: "すべてのチームメンバーを見る",
      recognitions: "表彰",
      awards: "受賞",
      rankings: "ランキング",
      year: "年",
    },
    ar: {
      title: "التصنيفات والتقدير",
      subtitle: "معترف بها باستمرار كواحدة من أبرز مكاتب المحاماة في المكسيك وأمريكا اللاتينية",
      overviewTitle: "التميز المعترف به عالمياً",
      overviewText1: "يتم تصنيف Von Wobeser y Sierra باستمرار بين أفضل مكاتب المحاماة في المكسيك وأمريكا اللاتينية من قبل أكثر الدلائل القانونية المرموقة في العالم. التزامنا بالتميز والخبرة العميقة والنهج المركز على العميل أكسبنا التقدير في جميع مجالات الممارسة الرئيسية.",
      overviewText2: "على مدى أكثر من سبعة عقود، حافظنا على مكانتنا كرائد في السوق، وحصلنا على تصنيفات من الدرجة الأولى من Chambers and Partners وLegal 500 وIFLR1000 وLatin Lawyer 250 وغيرها من المنشورات الرائدة.",
      directoriesTitle: "الدلائل القانونية الرئيسية",
      directoriesSubtitle: "تصنيفات متقدمة في جميع الدلائل القانونية الدولية الرئيسية",
      awardsTitle: "الجوائز والإنجازات",
      awardsSubtitle: "تقديرات حديثة تعترف بتميزنا في الخدمات القانونية",
      lawyersTitle: "المحامون المصنفون",
      lawyersSubtitle: "يتم الاعتراف بمحامينا فردياً كقادة في مجالاتهم",
      viewProfile: "عرض الملف الشخصي",
      quoteText: "Von Wobeser y Sierra هي 'شركة المحاماة المكسيكية البارزة' مع 'قائمة عملاء يُحسد عليها وسمعة ممتازة للعمل التعاقدي والخلافي رفيع المستوى.'",
      quoteSource: "Chambers أمريكا اللاتينية",
      viewAllTeam: "عرض جميع أعضاء الفريق",
      recognitions: "التقديرات",
      awards: "الجوائز",
      rankings: "التصنيفات",
      year: "السنة",
    },
    ru: {
      title: "Награды",
      subtitle: "Наши признания и награды",
      overviewTitle: "Признанное во всем мире превосходство",
      overviewText1: "Von Wobeser y Sierra неизменно входит в число лучших юридических фирм Мексики и Латинской Америки по версии самых престижных юридических справочников мира. Наша приверженность совершенству, глубокая экспертиза и клиентоориентированный подход принесли нам признание во всех основных областях практики.",
      overviewText2: "Более семи десятилетий мы сохраняем позицию лидера рынка, получая высшие рейтинги от Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 и других ведущих изданий.",
      directoriesTitle: "Основные юридические справочники",
      directoriesSubtitle: "Высшие рейтинги во всех основных международных юридических справочниках",
      awardsTitle: "Награды и достижения",
      awardsSubtitle: "Последние награды, признающие наше превосходство в юридических услугах",
      lawyersTitle: "Рейтинговые юристы",
      lawyersSubtitle: "Наши адвокаты индивидуально признаны лидерами в своих областях",
      viewProfile: "Посмотреть профиль",
      quoteText: "Von Wobeser y Sierra — это 'выдающаяся мексиканская фирма' с 'завидным списком клиентов и безупречной репутацией в сфере высококлассной транзакционной и судебной работы.'",
      quoteSource: "Chambers Латинская Америка",
      viewAllTeam: "Смотреть всех членов команды",
      recognitions: "Признания",
      awards: "Награды",
      rankings: "Рейтинги",
      year: "Год",
    },
    fr: {
      title: "Classements et Reconnaissance",
      subtitle: "Régulièrement reconnu comme l'un des cabinets d'avocats de premier plan au Mexique et en Amérique latine",
      overviewTitle: "Excellence reconnue mondialement",
      overviewText1: "Von Wobeser y Sierra est régulièrement classé parmi les meilleurs cabinets d'avocats au Mexique et en Amérique latine par les annuaires juridiques les plus prestigieux du monde. Notre engagement envers l'excellence, notre expertise approfondie et notre approche axée sur le client nous ont valu une reconnaissance dans tous les principaux domaines de pratique.",
      overviewText2: "Depuis plus de sept décennies, nous maintenons notre position de leader du marché, obtenant des classements de premier plan de Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 et d'autres publications de référence.",
      directoriesTitle: "Principaux annuaires juridiques",
      directoriesSubtitle: "Meilleurs classements dans tous les principaux annuaires juridiques internationaux",
      awardsTitle: "Prix et Réalisations",
      awardsSubtitle: "Distinctions récentes reconnaissant notre excellence dans les services juridiques",
      lawyersTitle: "Avocats classés",
      lawyersSubtitle: "Nos avocats sont individuellement reconnus comme des leaders dans leurs domaines",
      viewProfile: "Voir le profil",
      quoteText: "Von Wobeser y Sierra est 'le cabinet mexicain remarquable' avec 'un portefeuille de clients enviable et une réputation stellaire pour le travail transactionnel et contentieux haut de gamme.'",
      quoteSource: "Chambers Amérique latine",
      viewAllTeam: "Voir tous les membres de l'équipe",
      recognitions: "Reconnaissances",
      awards: "Prix",
      rankings: "Classements",
      year: "Année",
    },
    it: {
      title: "Riconoscimenti",
      subtitle: "I nostri riconoscimenti e premi",
      overviewTitle: "Eccellenza riconosciuta a livello mondiale",
      overviewText1: "Von Wobeser y Sierra è costantemente classificato tra i migliori studi legali in Messico e America Latina dalle directory legali più prestigiose del mondo. Il nostro impegno per l'eccellenza, la profonda competenza e l'approccio incentrato sul cliente ci hanno fatto guadagnare riconoscimenti in tutte le principali aree di pratica.",
      overviewText2: "Da oltre sette decenni, abbiamo mantenuto la nostra posizione di leader di mercato, ottenendo le migliori classifiche da Chambers and Partners, Legal 500, IFLR1000, Latin Lawyer 250 e altre pubblicazioni leader.",
      directoriesTitle: "Principali directory legali",
      directoriesSubtitle: "Classifiche ai vertici in tutte le principali directory legali internazionali",
      awardsTitle: "Premi e Risultati",
      awardsSubtitle: "Recenti riconoscimenti che celebrano la nostra eccellenza nei servizi legali",
      lawyersTitle: "Avvocati in classifica",
      lawyersSubtitle: "I nostri avvocati sono individualmente riconosciuti come leader nei loro campi",
      viewProfile: "Vedi profilo",
      quoteText: "Von Wobeser y Sierra è 'lo studio messicano di spicco' con 'un invidiabile portafoglio clienti e una reputazione stellare per il lavoro transazionale e contenzioso di alto livello.'",
      quoteSource: "Chambers America Latina",
      viewAllTeam: "Vedi tutti i membri del team",
      recognitions: "Riconoscimenti",
      awards: "Premi",
      rankings: "Classifiche",
      year: "Anno",
    },
  };

  const t = content[language] || content.en;

  return (
    <div data-testid="page-rankings">
      <SEOHead page="rankings" language={language} />

      <PageHero
        eyebrow={t.recognitions}
        title={t.title}
        subtitle={t.subtitle}
        data-testid="section-rankings-hero"
      />

      <Section tone="white" data-testid="section-rankings-overview">
        <SectionTitle>{t.overviewTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <p className="font-sans text-lg leading-relaxed text-vw-gray">
            {t.overviewText1}
          </p>
          <p className="font-sans text-lg leading-relaxed text-vw-gray">
            {t.overviewText2}
          </p>
        </div>
      </Section>

      <Section tone="gray" data-testid="section-directories">
        <Label>{t.directoriesSubtitle}</Label>
        <SectionTitle className="mt-3">{t.directoriesTitle}</SectionTitle>

        <div
          ref={directoriesRef}
          className="vw-fade grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {directories.map((directory) => {
            const Icon = directory.icon;
            return (
              <div
                key={directory.id}
                className="flex h-full flex-col border border-vw-graylight bg-white p-7 transition-colors hover:border-vw-red"
                data-testid={`card-directory-${directory.id}`}
              >
                <Icon className="mb-4 h-7 w-7 text-vw-red" aria-hidden="true" />
                <h3 className="mb-3 font-serif text-xl leading-snug text-vw-black">
                  {language === "es" ? directory.nameEs : directory.name}
                </h3>
                <p className="mb-4 font-sans text-base leading-relaxed text-vw-gray">
                  {language === "es" ? directory.descriptionEs : directory.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {directory.rankings.map((ranking, idx) => (
                    <span
                      key={idx}
                      className="inline-block border border-vw-graylight px-3 py-1 font-sans text-xs text-vw-gray"
                      data-testid={`badge-ranking-${directory.id}-${idx}`}
                    >
                      {language === "es" ? ranking.es : ranking.en}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section tone="white" data-testid="section-awards">
        <Label>{t.awardsSubtitle}</Label>
        <SectionTitle className="mt-3">{t.awardsTitle}</SectionTitle>

        <div
          ref={awardsRef}
          className="vw-fade grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {awards.map((award) => (
            <div
              key={award.id}
              className="h-full border border-vw-graylight bg-white p-7 transition-colors hover:border-vw-red"
              data-testid={`card-award-${award.id}`}
            >
              <h3 className="mb-3 font-serif text-xl leading-snug text-vw-black">
                {language === "es" ? award.titleEs : award.title}
              </h3>
              {award.years && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {award.years.map((year) => (
                    <span
                      key={year}
                      className="inline-block border border-vw-red px-3 py-1 font-sans text-xs text-vw-red"
                    >
                      {year}
                    </span>
                  ))}
                </div>
              )}
              <p className="font-sans text-base leading-relaxed text-vw-gray">
                {language === "es" ? award.descriptionEs : award.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="gray" fade={false} data-testid="section-rankings-quote">
        <div className="mx-auto max-w-4xl text-center">
          <blockquote className="font-serif text-2xl leading-snug text-vw-black md:text-3xl">
            "{t.quoteText}"
          </blockquote>
          <cite className="vw-label mt-6 block text-xs not-italic text-vw-red">
            — {t.quoteSource}
          </cite>
        </div>
      </Section>

      <Section tone="white" data-testid="section-ranked-lawyers">
        <Label>{t.lawyersSubtitle}</Label>
        <SectionTitle className="mt-3">{t.lawyersTitle}</SectionTitle>

        <div
          ref={lawyersRef}
          className="vw-fade grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {rankedLawyers.map((lawyer) => {
            const teamMember = teamMembers?.find(
              (m) => m.slug === lawyer.slug || m.name === lawyer.name
            );

            return (
              <Link
                key={lawyer.slug}
                href={teamMember ? `/team/${teamMember.slug}` : `/team/${lawyer.slug}`}
              >
                <div
                  className="group flex h-full cursor-pointer items-center gap-4 border border-vw-graylight bg-white p-6 transition-colors hover:border-vw-red"
                  data-testid={`card-lawyer-${lawyer.slug}`}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-vw-red/10 font-serif text-base text-vw-red">
                    {lawyer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg leading-snug text-vw-black transition-colors group-hover:text-vw-red">
                      {lawyer.name}
                    </h3>
                    <p className="font-sans text-sm text-vw-gray">
                      {language === "es" ? lawyer.titleEs : lawyer.title}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-vw-graylight transition-colors group-hover:text-vw-red" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/team">
            <span
              className="vw-label inline-flex cursor-pointer items-center gap-2 border border-vw-red px-8 py-3.5 text-xs text-vw-red transition-colors hover:bg-vw-red hover:text-white"
              data-testid="button-view-all-team"
            >
              {t.viewAllTeam}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </Section>
    </div>
  );
}
