import { useEffect } from "react";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@shared/schema";

const BASE_URL = "https://www.vonwobeser.com";
const DEFAULT_IMAGE = "https://vonwobeser.com/images/vonwobeser_2025_.png";

const HREFLANG_CODES: Record<LanguageCode, string> = {
  en: "en",
  es: "es-MX",
  de: "de",
  zh: "zh-CN",
  ko: "ko",
  ja: "ja",
  ar: "ar",
  ru: "ru",
  fr: "fr",
  it: "it",
};

const OG_LOCALE_CODES: Record<LanguageCode, string> = {
  en: "en_US",
  es: "es_MX",
  de: "de_DE",
  zh: "zh_CN",
  ko: "ko_KR",
  ja: "ja_JP",
  ar: "ar_SA",
  ru: "ru_RU",
  fr: "fr_FR",
  it: "it_IT",
};

interface SEOConfig {
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  path: string;
}

const seoConfig: Record<string, SEOConfig> = {
  home: {
    title: {
      en: "Von Wobeser y Sierra | Leading Law Firm in Mexico",
      es: "Von Wobeser y Sierra | Firma de Abogados Líder en México",
      de: "Von Wobeser y Sierra | Führende Anwaltskanzlei in Mexiko",
      zh: "Von Wobeser y Sierra | 墨西哥领先律师事务所",
      ko: "Von Wobeser y Sierra | 멕시코 최고의 로펌",
      ja: "Von Wobeser y Sierra | メキシコの主要法律事務所",
      ar: "Von Wobeser y Sierra | شركة المحاماة الرائدة في المكسيك",
      ru: "Von Wobeser y Sierra | Ведущая юридическая фирма в Мексике",
      fr: "Von Wobeser y Sierra | Cabinet d'Avocats Leader au Mexique",
      it: "Von Wobeser y Sierra | Studio Legale Leader in Messico",
    },
    description: {
      en: "Von Wobeser y Sierra is one of Mexico's most prestigious law firms with over 70 years of experience. We provide comprehensive legal services in corporate law, litigation, M&A, and more.",
      es: "Von Wobeser y Sierra es una de las firmas de abogados más prestigiosas de México con más de 70 años de experiencia. Brindamos servicios legales integrales en derecho corporativo, litigio, M&A y más.",
      de: "Von Wobeser y Sierra ist eine der renommiertesten Anwaltskanzleien Mexikos mit über 70 Jahren Erfahrung. Wir bieten umfassende Rechtsdienstleistungen im Gesellschaftsrecht, Prozessführung, M&A und mehr.",
      zh: "Von Wobeser y Sierra是墨西哥最负盛名的律师事务所之一，拥有70多年的经验。我们提供公司法、诉讼、并购等全面法律服务。",
      ko: "Von Wobeser y Sierra는 70년 이상의 경험을 가진 멕시코에서 가장 명망 있는 로펌 중 하나입니다. 기업법, 소송, M&A 등 종합 법률 서비스를 제공합니다.",
      ja: "Von Wobeser y Sierraは70年以上の経験を持つメキシコで最も権威ある法律事務所の一つです。会社法、訴訟、M&Aなどの包括的な法律サービスを提供しています。",
      ar: "Von Wobeser y Sierra هي واحدة من أعرق شركات المحاماة في المكسيك بخبرة تزيد عن 70 عامًا. نقدم خدمات قانونية شاملة في قانون الشركات والتقاضي والاندماج والاستحواذ.",
      ru: "Von Wobeser y Sierra — одна из самых престижных юридических фирм Мексики с более чем 70-летним опытом. Мы предоставляем комплексные юридические услуги в области корпоративного права, судебных разбирательств, M&A и многого другого.",
      fr: "Von Wobeser y Sierra est l'un des cabinets d'avocats les plus prestigieux du Mexique avec plus de 70 ans d'expérience. Nous fournissons des services juridiques complets en droit des sociétés, contentieux, M&A et plus encore.",
      it: "Von Wobeser y Sierra è uno degli studi legali più prestigiosi del Messico con oltre 70 anni di esperienza. Forniamo servizi legali completi in diritto societario, contenzioso, M&A e altro.",
    },
    path: "/",
  },
  about: {
    title: {
      en: "About Us | Von Wobeser y Sierra",
      es: "Acerca de Nosotros | Von Wobeser y Sierra",
      de: "Über Uns | Von Wobeser y Sierra",
      zh: "关于我们 | Von Wobeser y Sierra",
      ko: "회사 소개 | Von Wobeser y Sierra",
      ja: "私たちについて | Von Wobeser y Sierra",
      ar: "معلومات عنا | Von Wobeser y Sierra",
      ru: "О Нас | Von Wobeser y Sierra",
      fr: "À Propos de Nous | Von Wobeser y Sierra",
      it: "Chi Siamo | Von Wobeser y Sierra",
    },
    description: {
      en: "Learn about Von Wobeser y Sierra's history, values, and commitment to legal excellence. Founded in 1952, we are one of Mexico's leading law firms with a proven track record.",
      es: "Conozca la historia, valores y compromiso con la excelencia legal de Von Wobeser y Sierra. Fundado en 1952, somos una de las firmas de abogados líderes en México.",
      de: "Erfahren Sie mehr über die Geschichte, Werte und das Engagement für rechtliche Exzellenz von Von Wobeser y Sierra. Gegründet 1952, sind wir eine der führenden Kanzleien Mexikos.",
      zh: "了解Von Wobeser y Sierra的历史、价值观和对法律卓越的承诺。我们成立于1952年，是墨西哥领先的律师事务所之一。",
      ko: "Von Wobeser y Sierra의 역사, 가치 및 법률 우수성에 대한 헌신을 알아보세요. 1952년 설립된 멕시코 최고의 로펌입니다.",
      ja: "Von Wobeser y Sierraの歴史、価値観、法的卓越性への取り組みについてご紹介します。1952年設立、メキシコを代表する法律事務所です。",
      ar: "تعرف على تاريخ Von Wobeser y Sierra وقيمها والتزامها بالتميز القانوني. تأسست عام 1952، نحن من أبرز شركات المحاماة في المكسيك.",
      ru: "Узнайте об истории, ценностях и приверженности Von Wobeser y Sierra юридическому совершенству. Основанная в 1952 году, мы являемся одной из ведущих юридических фирм Мексики.",
      fr: "Découvrez l'histoire, les valeurs et l'engagement de Von Wobeser y Sierra envers l'excellence juridique. Fondé en 1952, nous sommes l'un des principaux cabinets du Mexique.",
      it: "Scopri la storia, i valori e l'impegno di Von Wobeser y Sierra per l'eccellenza legale. Fondato nel 1952, siamo uno dei principali studi legali del Messico.",
    },
    path: "/about",
  },
  team: {
    title: {
      en: "Our Team | Von Wobeser y Sierra",
      es: "Nuestro Equipo | Von Wobeser y Sierra",
      de: "Unser Team | Von Wobeser y Sierra",
      zh: "我们的团队 | Von Wobeser y Sierra",
      ko: "우리 팀 | Von Wobeser y Sierra",
      ja: "私たちのチーム | Von Wobeser y Sierra",
      ar: "فريقنا | Von Wobeser y Sierra",
      ru: "Наша Команда | Von Wobeser y Sierra",
      fr: "Notre Équipe | Von Wobeser y Sierra",
      it: "Il Nostro Team | Von Wobeser y Sierra",
    },
    description: {
      en: "Meet our team of experienced attorneys at Von Wobeser y Sierra. Our partners and associates are recognized leaders in their respective practice areas across Mexico.",
      es: "Conozca a nuestro equipo de abogados experimentados en Von Wobeser y Sierra. Nuestros socios y asociados son líderes reconocidos en sus respectivas áreas de práctica.",
      de: "Lernen Sie unser erfahrenes Anwaltsteam bei Von Wobeser y Sierra kennen. Unsere Partner und Mitarbeiter sind anerkannte Führungskräfte in ihren jeweiligen Praxisbereichen.",
      zh: "认识Von Wobeser y Sierra经验丰富的律师团队。我们的合伙人和律师在各自的业务领域都是公认的领导者。",
      ko: "Von Wobeser y Sierra의 경험 많은 변호사 팀을 만나보세요. 파트너와 어소시에이트는 각 분야에서 인정받는 리더입니다.",
      ja: "Von Wobeser y Sierraの経験豊富な弁護士チームをご紹介します。当事務所のパートナーとアソシエイトは各分野で認められたリーダーです。",
      ar: "تعرف على فريقنا من المحامين ذوي الخبرة في Von Wobeser y Sierra. شركاؤنا ومحامونا هم قادة معترف بهم في مجالات ممارستهم.",
      ru: "Познакомьтесь с нашей командой опытных юристов в Von Wobeser y Sierra. Наши партнеры и сотрудники являются признанными лидерами в своих областях практики.",
      fr: "Rencontrez notre équipe d'avocats expérimentés chez Von Wobeser y Sierra. Nos associés sont des leaders reconnus dans leurs domaines de pratique respectifs.",
      it: "Incontra il nostro team di avvocati esperti presso Von Wobeser y Sierra. I nostri partner e associati sono leader riconosciuti nelle rispettive aree di pratica.",
    },
    path: "/team",
  },
  practiceGroups: {
    title: {
      en: "Practice Areas | Von Wobeser y Sierra",
      es: "Áreas de Práctica | Von Wobeser y Sierra",
      de: "Praxisbereiche | Von Wobeser y Sierra",
      zh: "业务领域 | Von Wobeser y Sierra",
      ko: "업무 분야 | Von Wobeser y Sierra",
      ja: "業務分野 | Von Wobeser y Sierra",
      ar: "مجالات الممارسة | Von Wobeser y Sierra",
      ru: "Области Практики | Von Wobeser y Sierra",
      fr: "Domaines de Pratique | Von Wobeser y Sierra",
      it: "Aree di Pratica | Von Wobeser y Sierra",
    },
    description: {
      en: "Explore our comprehensive practice areas including Corporate Law, M&A, Litigation, Antitrust, Banking & Finance, and more. Expert legal services tailored to your needs.",
      es: "Explore nuestras áreas de práctica integrales incluyendo Derecho Corporativo, M&A, Litigio, Competencia Económica, Banca y Finanzas, y más. Servicios legales especializados.",
      de: "Entdecken Sie unsere umfassenden Praxisbereiche: Gesellschaftsrecht, M&A, Prozessführung, Kartellrecht, Banken & Finanzen und mehr. Maßgeschneiderte Rechtsdienstleistungen.",
      zh: "探索我们全面的业务领域，包括公司法、并购、诉讼、反垄断、银行与金融等。量身定制的专业法律服务。",
      ko: "기업법, M&A, 소송, 독점금지, 금융 등 종합 업무 분야를 살펴보세요. 맞춤형 전문 법률 서비스를 제공합니다.",
      ja: "会社法、M&A、訴訟、独占禁止法、銀行・金融など、包括的な業務分野をご覧ください。ニーズに合わせた専門的な法律サービス。",
      ar: "استكشف مجالات ممارستنا الشاملة بما في ذلك قانون الشركات والاندماج والاستحواذ والتقاضي ومكافحة الاحتكار والخدمات المصرفية والمالية والمزيد.",
      ru: "Изучите наши комплексные области практики: корпоративное право, M&A, судебные споры, антимонопольное право, банковское дело и финансы и многое другое.",
      fr: "Explorez nos domaines de pratique complets: droit des sociétés, M&A, contentieux, droit de la concurrence, banque et finance, et plus encore.",
      it: "Esplora le nostre aree di pratica complete: diritto societario, M&A, contenzioso, antitrust, banche e finanza e altro ancora. Servizi legali su misura.",
    },
    path: "/practice-groups",
  },
  industryGroups: {
    title: {
      en: "Industry Groups | Von Wobeser y Sierra",
      es: "Grupos Industriales | Von Wobeser y Sierra",
      de: "Branchengruppen | Von Wobeser y Sierra",
      zh: "行业组 | Von Wobeser y Sierra",
      ko: "산업 그룹 | Von Wobeser y Sierra",
      ja: "業界グループ | Von Wobeser y Sierra",
      ar: "مجموعات الصناعة | Von Wobeser y Sierra",
      ru: "Отраслевые Группы | Von Wobeser y Sierra",
      fr: "Groupes Industriels | Von Wobeser y Sierra",
      it: "Gruppi Industriali | Von Wobeser y Sierra",
    },
    description: {
      en: "Specialized legal expertise across key industry sectors including Energy, Real Estate, Technology, Financial Services, and more. Industry-focused solutions for your business.",
      es: "Experiencia legal especializada en sectores industriales clave incluyendo Energía, Bienes Raíces, Tecnología, Servicios Financieros, y más. Soluciones enfocadas en su industria.",
      de: "Spezialisierte Rechtsexpertise in Schlüsselbranchen: Energie, Immobilien, Technologie, Finanzdienstleistungen und mehr. Branchenspezifische Lösungen.",
      zh: "在能源、房地产、科技、金融服务等关键行业领域提供专业法律服务。行业导向的商业解决方案。",
      ko: "에너지, 부동산, 기술, 금융 서비스 등 주요 산업 분야에 대한 전문 법률 서비스. 산업 맞춤형 비즈니스 솔루션.",
      ja: "エネルギー、不動産、テクノロジー、金融サービスなど主要業界における専門的な法律サービス。業界に特化したソリューション。",
      ar: "خبرة قانونية متخصصة في القطاعات الصناعية الرئيسية بما في ذلك الطاقة والعقارات والتكنولوجيا والخدمات المالية والمزيد.",
      ru: "Специализированная юридическая экспертиза в ключевых отраслях: энергетика, недвижимость, технологии, финансовые услуги и другие. Отраслевые решения для вашего бизнеса.",
      fr: "Expertise juridique spécialisée dans les secteurs clés: énergie, immobilier, technologie, services financiers et plus. Solutions adaptées à votre industrie.",
      it: "Competenza legale specializzata nei settori industriali chiave: energia, immobiliare, tecnologia, servizi finanziari e altro. Soluzioni mirate per il tuo business.",
    },
    path: "/industry-groups",
  },
  news: {
    title: {
      en: "News & Insights | Von Wobeser y Sierra",
      es: "Noticias e Insights | Von Wobeser y Sierra",
      de: "Nachrichten & Einblicke | Von Wobeser y Sierra",
      zh: "新闻与洞察 | Von Wobeser y Sierra",
      ko: "뉴스 & 인사이트 | Von Wobeser y Sierra",
      ja: "ニュース＆インサイト | Von Wobeser y Sierra",
      ar: "الأخبار والرؤى | Von Wobeser y Sierra",
      ru: "Новости и Аналитика | Von Wobeser y Sierra",
      fr: "Actualités & Perspectives | Von Wobeser y Sierra",
      it: "Notizie & Approfondimenti | Von Wobeser y Sierra",
    },
    description: {
      en: "Stay informed with the latest legal news, insights, and updates from Von Wobeser y Sierra. Explore our publications, press releases, and thought leadership.",
      es: "Manténgase informado con las últimas noticias legales, insights y actualizaciones de Von Wobeser y Sierra. Explore nuestras publicaciones y liderazgo de pensamiento.",
      de: "Bleiben Sie informiert mit den neuesten Rechtsnachrichten, Einblicken und Updates von Von Wobeser y Sierra. Entdecken Sie unsere Publikationen und Thought Leadership.",
      zh: "获取Von Wobeser y Sierra最新的法律新闻、洞察和动态。探索我们的出版物和思想领导力。",
      ko: "Von Wobeser y Sierra의 최신 법률 뉴스, 인사이트 및 업데이트를 확인하세요. 간행물과 사고 리더십을 탐색하세요.",
      ja: "Von Wobeser y Sierraの最新の法律ニュース、インサイト、アップデートをご覧ください。出版物とソートリーダーシップを探索してください。",
      ar: "ابق على اطلاع بأحدث الأخبار القانونية والرؤى والتحديثات من Von Wobeser y Sierra. استكشف منشوراتنا وقيادتنا الفكرية.",
      ru: "Будьте в курсе последних юридических новостей, аналитики и обновлений от Von Wobeser y Sierra. Изучите наши публикации и экспертные материалы.",
      fr: "Restez informé des dernières actualités juridiques et perspectives de Von Wobeser y Sierra. Explorez nos publications et leadership éclairé.",
      it: "Rimani informato con le ultime notizie legali, approfondimenti e aggiornamenti da Von Wobeser y Sierra. Esplora le nostre pubblicazioni.",
    },
    path: "/news",
  },
  contact: {
    title: {
      en: "Contact Us | Von Wobeser y Sierra",
      es: "Contáctenos | Von Wobeser y Sierra",
      de: "Kontakt | Von Wobeser y Sierra",
      zh: "联系我们 | Von Wobeser y Sierra",
      ko: "연락처 | Von Wobeser y Sierra",
      ja: "お問い合わせ | Von Wobeser y Sierra",
      ar: "اتصل بنا | Von Wobeser y Sierra",
      ru: "Контакты | Von Wobeser y Sierra",
      fr: "Contactez-Nous | Von Wobeser y Sierra",
      it: "Contattaci | Von Wobeser y Sierra",
    },
    description: {
      en: "Get in touch with Von Wobeser y Sierra. Visit our offices in Mexico City or contact our team for legal consultation and inquiries.",
      es: "Póngase en contacto con Von Wobeser y Sierra. Visite nuestras oficinas en Ciudad de México o contacte a nuestro equipo para consultas legales.",
      de: "Nehmen Sie Kontakt mit Von Wobeser y Sierra auf. Besuchen Sie unsere Büros in Mexiko-Stadt oder kontaktieren Sie unser Team für rechtliche Beratung.",
      zh: "联系Von Wobeser y Sierra。访问我们在墨西哥城的办公室或联系我们的团队进行法律咨询。",
      ko: "Von Wobeser y Sierra에 연락하세요. 멕시코시티 사무실을 방문하거나 법률 상담을 위해 저희 팀에 연락하세요.",
      ja: "Von Wobeser y Sierraにお問い合わせください。メキシコシティのオフィスをご訪問いただくか、法的相談についてチームにご連絡ください。",
      ar: "تواصل مع Von Wobeser y Sierra. قم بزيارة مكاتبنا في مكسيكو سيتي أو اتصل بفريقنا للاستشارات القانونية.",
      ru: "Свяжитесь с Von Wobeser y Sierra. Посетите наши офисы в Мехико или обратитесь к нашей команде за юридической консультацией.",
      fr: "Contactez Von Wobeser y Sierra. Visitez nos bureaux à Mexico ou contactez notre équipe pour des consultations juridiques.",
      it: "Contatta Von Wobeser y Sierra. Visita i nostri uffici a Città del Messico o contatta il nostro team per consulenze legali.",
    },
    path: "/contact",
  },
  careers: {
    title: {
      en: "Careers | Von Wobeser y Sierra",
      es: "Carreras | Von Wobeser y Sierra",
      de: "Karriere | Von Wobeser y Sierra",
      zh: "职业机会 | Von Wobeser y Sierra",
      ko: "채용 | Von Wobeser y Sierra",
      ja: "採用情報 | Von Wobeser y Sierra",
      ar: "الوظائف | Von Wobeser y Sierra",
      ru: "Карьера | Von Wobeser y Sierra",
      fr: "Carrières | Von Wobeser y Sierra",
      it: "Carriere | Von Wobeser y Sierra",
    },
    description: {
      en: "Join one of Mexico's leading law firms. Explore career opportunities, internship programs, and professional development at Von Wobeser y Sierra.",
      es: "Únase a una de las firmas de abogados líderes de México. Explore oportunidades de carrera, programas de pasantías y desarrollo profesional en Von Wobeser y Sierra.",
      de: "Werden Sie Teil einer der führenden Kanzleien Mexikos. Entdecken Sie Karrieremöglichkeiten und Praktikumsprogramme bei Von Wobeser y Sierra.",
      zh: "加入墨西哥领先的律师事务所之一。探索Von Wobeser y Sierra的职业机会、实习项目和专业发展。",
      ko: "멕시코 최고의 로펌에 합류하세요. Von Wobeser y Sierra의 채용 기회, 인턴십 프로그램 및 전문 개발을 살펴보세요.",
      ja: "メキシコを代表する法律事務所に参加しませんか。Von Wobeser y Sierraでのキャリア機会、インターンシッププログラム、専門的成長を探索してください。",
      ar: "انضم إلى واحدة من شركات المحاماة الرائدة في المكسيك. استكشف فرص العمل وبرامج التدريب والتطوير المهني في Von Wobeser y Sierra.",
      ru: "Присоединяйтесь к одной из ведущих юридических фирм Мексики. Изучите карьерные возможности, стажировки и профессиональное развитие в Von Wobeser y Sierra.",
      fr: "Rejoignez l'un des principaux cabinets d'avocats du Mexique. Explorez les opportunités de carrière et les programmes de stage chez Von Wobeser y Sierra.",
      it: "Unisciti a uno dei principali studi legali del Messico. Esplora le opportunità di carriera, i programmi di tirocinio e lo sviluppo professionale presso Von Wobeser y Sierra.",
    },
    path: "/careers",
  },
  rankings: {
    title: {
      en: "Rankings & Recognition | Von Wobeser y Sierra",
      es: "Rankings y Reconocimientos | Von Wobeser y Sierra",
      de: "Rankings & Auszeichnungen | Von Wobeser y Sierra",
      zh: "排名与认可 | Von Wobeser y Sierra",
      ko: "순위 & 인정 | Von Wobeser y Sierra",
      ja: "ランキング＆評価 | Von Wobeser y Sierra",
      ar: "التصنيفات والتقدير | Von Wobeser y Sierra",
      ru: "Рейтинги и Признание | Von Wobeser y Sierra",
      fr: "Classements & Reconnaissance | Von Wobeser y Sierra",
      it: "Classifiche & Riconoscimenti | Von Wobeser y Sierra",
    },
    description: {
      en: "Von Wobeser y Sierra is consistently ranked among Mexico's top law firms by Chambers, Legal 500, Latin Lawyer 250, and other prestigious legal directories.",
      es: "Von Wobeser y Sierra es consistentemente clasificada entre las principales firmas de México por Chambers, Legal 500, Latin Lawyer 250 y otros directorios legales.",
      de: "Von Wobeser y Sierra wird von Chambers, Legal 500, Latin Lawyer 250 und anderen renommierten Verzeichnissen unter Mexikos Top-Kanzleien geführt.",
      zh: "Von Wobeser y Sierra被Chambers、Legal 500、Latin Lawyer 250等权威法律目录持续评为墨西哥顶级律所。",
      ko: "Von Wobeser y Sierra는 Chambers, Legal 500, Latin Lawyer 250 등 권위 있는 법률 디렉토리에서 멕시코 최고의 로펌으로 지속적으로 선정되고 있습니다.",
      ja: "Von Wobeser y Sierraは、Chambers、Legal 500、Latin Lawyer 250などの権威ある法律ディレクトリでメキシコのトップファームとして評価されています。",
      ar: "يتم تصنيف Von Wobeser y Sierra باستمرار من بين أفضل شركات المحاماة في المكسيك من قبل Chambers و Legal 500 و Latin Lawyer 250.",
      ru: "Von Wobeser y Sierra стабильно входит в число лучших юридических фирм Мексики по версии Chambers, Legal 500, Latin Lawyer 250.",
      fr: "Von Wobeser y Sierra est régulièrement classé parmi les meilleurs cabinets du Mexique par Chambers, Legal 500, Latin Lawyer 250.",
      it: "Von Wobeser y Sierra è costantemente classificato tra i migliori studi legali del Messico da Chambers, Legal 500, Latin Lawyer 250.",
    },
    path: "/rankings",
  },
  experience: {
    title: {
      en: "Our Experience | Von Wobeser y Sierra",
      es: "Nuestra Experiencia | Von Wobeser y Sierra",
      de: "Unsere Erfahrung | Von Wobeser y Sierra",
      zh: "我们的经验 | Von Wobeser y Sierra",
      ko: "우리의 경험 | Von Wobeser y Sierra",
      ja: "私たちの実績 | Von Wobeser y Sierra",
      ar: "خبرتنا | Von Wobeser y Sierra",
      ru: "Наш Опыт | Von Wobeser y Sierra",
      fr: "Notre Expérience | Von Wobeser y Sierra",
      it: "La Nostra Esperienza | Von Wobeser y Sierra",
    },
    description: {
      en: "Explore our track record of landmark transactions, complex disputes, and strategic advisory matters. Representative experience across all practice areas.",
      es: "Explore nuestra trayectoria de transacciones históricas, disputas complejas y asuntos de asesoría estratégica. Experiencia representativa en todas las áreas de práctica.",
      de: "Entdecken Sie unsere Erfolgsbilanz bei wegweisenden Transaktionen, komplexen Streitigkeiten und strategischer Beratung.",
      zh: "探索我们在标志性交易、复杂争议和战略咨询方面的业绩记录。涵盖所有业务领域的代表性经验。",
      ko: "획기적인 거래, 복잡한 분쟁 및 전략적 자문 사례에 대한 당사의 실적을 살펴보세요.",
      ja: "画期的な取引、複雑な紛争、戦略的アドバイザリー案件における実績をご覧ください。",
      ar: "استكشف سجلنا الحافل بالمعاملات التاريخية والنزاعات المعقدة والمسائل الاستشارية الاستراتيجية.",
      ru: "Ознакомьтесь с нашим опытом знаковых сделок, сложных споров и стратегического консультирования.",
      fr: "Explorez notre bilan de transactions majeures, litiges complexes et conseils stratégiques.",
      it: "Esplora il nostro track record di transazioni storiche, controversie complesse e consulenza strategica.",
    },
    path: "/experience",
  },
  offices: {
    title: {
      en: "Our Offices | Von Wobeser y Sierra",
      es: "Nuestras Oficinas | Von Wobeser y Sierra",
      de: "Unsere Büros | Von Wobeser y Sierra",
      zh: "我们的办公室 | Von Wobeser y Sierra",
      ko: "사무소 안내 | Von Wobeser y Sierra",
      ja: "オフィス案内 | Von Wobeser y Sierra",
      ar: "مكاتبنا | Von Wobeser y Sierra",
      ru: "Наши Офисы | Von Wobeser y Sierra",
      fr: "Nos Bureaux | Von Wobeser y Sierra",
      it: "I Nostri Uffici | Von Wobeser y Sierra",
    },
    description: {
      en: "Visit Von Wobeser y Sierra at Torre SOMA Chapultepec in Polanco, Mexico City. Modern facilities with state-of-the-art amenities for clients and team members.",
      es: "Visite Von Wobeser y Sierra en Torre SOMA Chapultepec en Polanco, Ciudad de México. Instalaciones modernas con amenidades de primera clase.",
      de: "Besuchen Sie Von Wobeser y Sierra im Torre SOMA Chapultepec in Polanco, Mexiko-Stadt. Moderne Einrichtungen mit erstklassiger Ausstattung.",
      zh: "访问位于墨西哥城波朗科区Torre SOMA Chapultepec的Von Wobeser y Sierra。配备一流设施的现代化办公环境。",
      ko: "멕시코시티 폴랑코의 Torre SOMA Chapultepec에 위치한 Von Wobeser y Sierra를 방문하세요. 최신 시설을 갖춘 현대적인 사무실.",
      ja: "メキシコシティ・ポランコのTorre SOMA Chapultepecにあるオフィスをご訪問ください。最新設備を備えた近代的な施設。",
      ar: "قم بزيارة Von Wobeser y Sierra في Torre SOMA Chapultepec في بولانكو، مكسيكو سيتي. مرافق حديثة مع وسائل راحة متطورة.",
      ru: "Посетите Von Wobeser y Sierra в Torre SOMA Chapultepec в Поланко, Мехико. Современные помещения с первоклассным оснащением.",
      fr: "Visitez Von Wobeser y Sierra à Torre SOMA Chapultepec à Polanco, Mexico. Installations modernes avec des équipements de pointe.",
      it: "Visita Von Wobeser y Sierra presso Torre SOMA Chapultepec a Polanco, Città del Messico. Strutture moderne con servizi all'avanguardia.",
    },
    path: "/offices",
  },
  privacyPolicy: {
    title: {
      en: "Privacy Policy | Von Wobeser y Sierra",
      es: "Política de Privacidad | Von Wobeser y Sierra",
      de: "Datenschutzrichtlinie | Von Wobeser y Sierra",
      zh: "隐私政策 | Von Wobeser y Sierra",
      ko: "개인정보 처리방침 | Von Wobeser y Sierra",
      ja: "プライバシーポリシー | Von Wobeser y Sierra",
      ar: "سياسة الخصوصية | Von Wobeser y Sierra",
      ru: "Политика Конфиденциальности | Von Wobeser y Sierra",
      fr: "Politique de Confidentialité | Von Wobeser y Sierra",
      it: "Privacy Policy | Von Wobeser y Sierra",
    },
    description: {
      en: "Read Von Wobeser y Sierra's Privacy Policy regarding the collection, use, and protection of personal data under Mexican law (LFPDPPP).",
      es: "Lea la Política de Privacidad de Von Wobeser y Sierra sobre la recolección, uso y protección de datos personales bajo la ley mexicana (LFPDPPP).",
      de: "Lesen Sie die Datenschutzrichtlinie von Von Wobeser y Sierra bezüglich der Erhebung, Nutzung und des Schutzes personenbezogener Daten.",
      zh: "阅读Von Wobeser y Sierra关于根据墨西哥法律收集、使用和保护个人数据的隐私政策。",
      ko: "멕시코 법률에 따른 개인정보 수집, 사용 및 보호에 관한 Von Wobeser y Sierra의 개인정보 처리방침을 읽어보세요.",
      ja: "メキシコ法に基づく個人データの収集、使用、保護に関するVon Wobeser y Sierraのプライバシーポリシーをお読みください。",
      ar: "اقرأ سياسة الخصوصية الخاصة بـ Von Wobeser y Sierra فيما يتعلق بجمع واستخدام وحماية البيانات الشخصية.",
      ru: "Ознакомьтесь с Политикой конфиденциальности Von Wobeser y Sierra о сборе, использовании и защите персональных данных.",
      fr: "Lisez la Politique de Confidentialité de Von Wobeser y Sierra concernant la collecte, l'utilisation et la protection des données personnelles.",
      it: "Leggi la Privacy Policy di Von Wobeser y Sierra riguardante la raccolta, l'uso e la protezione dei dati personali.",
    },
    path: "/privacy-policy",
  },
  terms: {
    title: {
      en: "Terms and Conditions | Von Wobeser y Sierra",
      es: "Términos y Condiciones | Von Wobeser y Sierra",
      de: "Allgemeine Geschäftsbedingungen | Von Wobeser y Sierra",
      zh: "条款与条件 | Von Wobeser y Sierra",
      ko: "이용약관 | Von Wobeser y Sierra",
      ja: "利用規約 | Von Wobeser y Sierra",
      ar: "الشروط والأحكام | Von Wobeser y Sierra",
      ru: "Условия Использования | Von Wobeser y Sierra",
      fr: "Conditions Générales | Von Wobeser y Sierra",
      it: "Termini e Condizioni | Von Wobeser y Sierra",
    },
    description: {
      en: "Review the Terms and Conditions for using the Von Wobeser y Sierra website. Please read these terms carefully before using our services.",
      es: "Revise los Términos y Condiciones para el uso del sitio web de Von Wobeser y Sierra. Por favor lea estos términos cuidadosamente.",
      de: "Lesen Sie die Allgemeinen Geschäftsbedingungen für die Nutzung der Website von Von Wobeser y Sierra.",
      zh: "查看使用Von Wobeser y Sierra网站的条款与条件。请在使用我们的服务之前仔细阅读这些条款。",
      ko: "Von Wobeser y Sierra 웹사이트 이용에 관한 이용약관을 검토하세요. 서비스 이용 전 약관을 주의 깊게 읽어주세요.",
      ja: "Von Wobeser y Sierraウェブサイトの利用規約をご確認ください。サービスをご利用の前に必ずお読みください。",
      ar: "راجع الشروط والأحكام لاستخدام موقع Von Wobeser y Sierra. يرجى قراءة هذه الشروط بعناية قبل استخدام خدماتنا.",
      ru: "Ознакомьтесь с Условиями использования сайта Von Wobeser y Sierra. Пожалуйста, внимательно прочитайте их перед использованием наших услуг.",
      fr: "Consultez les Conditions Générales d'utilisation du site Von Wobeser y Sierra. Veuillez lire attentivement ces conditions.",
      it: "Consulta i Termini e Condizioni per l'utilizzo del sito Von Wobeser y Sierra. Si prega di leggere attentamente questi termini.",
    },
    path: "/terms",
  },
  diversityInclusion: {
    title: {
      en: "Diversity & Inclusion | Von Wobeser y Sierra",
      es: "Diversidad e Inclusión | Von Wobeser y Sierra",
      de: "Vielfalt & Inklusion | Von Wobeser y Sierra",
      zh: "多元与包容 | Von Wobeser y Sierra",
      ko: "다양성 & 포용성 | Von Wobeser y Sierra",
      ja: "ダイバーシティ＆インクルージョン | Von Wobeser y Sierra",
      ar: "التنوع والشمول | Von Wobeser y Sierra",
      ru: "Разнообразие и Инклюзия | Von Wobeser y Sierra",
      fr: "Diversité & Inclusion | Von Wobeser y Sierra",
      it: "Diversità & Inclusione | Von Wobeser y Sierra",
    },
    description: {
      en: "Von Wobeser y Sierra is committed to diversity and inclusion since 1986. Learn about our initiatives for gender equality, inclusive hiring, and equal opportunities.",
      es: "Von Wobeser y Sierra está comprometido con la diversidad e inclusión desde 1986. Conozca nuestras iniciativas de igualdad de género, contratación inclusiva e igualdad de oportunidades.",
      de: "Von Wobeser y Sierra setzt sich seit 1986 für Vielfalt und Inklusion ein. Erfahren Sie mehr über unsere Initiativen für Geschlechtergleichstellung.",
      zh: "Von Wobeser y Sierra自1986年以来致力于多元化和包容性。了解我们在性别平等、包容性招聘和机会平等方面的举措。",
      ko: "Von Wobeser y Sierra는 1986년부터 다양성과 포용성에 전념하고 있습니다. 성평등, 포용적 채용, 기회 균등에 대한 이니셔티브를 알아보세요.",
      ja: "Von Wobeser y Sierraは1986年以来、多様性と包摂に取り組んでいます。ジェンダー平等、インクルーシブな採用、機会均等への取り組みをご紹介します。",
      ar: "Von Wobeser y Sierra ملتزمة بالتنوع والشمول منذ عام 1986. تعرف على مبادراتنا للمساواة بين الجنسين والتوظيف الشامل وتكافؤ الفرص.",
      ru: "Von Wobeser y Sierra привержена принципам разнообразия и инклюзии с 1986 года. Узнайте о наших инициативах по гендерному равенству.",
      fr: "Von Wobeser y Sierra est engagé pour la diversité et l'inclusion depuis 1986. Découvrez nos initiatives pour l'égalité des sexes et l'embauche inclusive.",
      it: "Von Wobeser y Sierra è impegnata per la diversità e l'inclusione dal 1986. Scopri le nostre iniziative per la parità di genere e le pari opportunità.",
    },
    path: "/diversity-inclusion",
  },
  proBono: {
    title: {
      en: "Pro Bono | Von Wobeser y Sierra",
      es: "Pro Bono | Von Wobeser y Sierra",
      de: "Pro Bono | Von Wobeser y Sierra",
      zh: "公益法律服务 | Von Wobeser y Sierra",
      ko: "프로보노 | Von Wobeser y Sierra",
      ja: "プロボノ | Von Wobeser y Sierra",
      ar: "خدمات قانونية مجانية | Von Wobeser y Sierra",
      ru: "Pro Bono | Von Wobeser y Sierra",
      fr: "Pro Bono | Von Wobeser y Sierra",
      it: "Pro Bono | Von Wobeser y Sierra",
    },
    description: {
      en: "Von Wobeser y Sierra has been committed to pro bono legal services for over 35 years. We support NGOs, human rights causes, and access to justice initiatives.",
      es: "Von Wobeser y Sierra está comprometido con servicios legales pro bono por más de 35 años. Apoyamos ONGs, causas de derechos humanos e iniciativas de acceso a la justicia.",
      de: "Von Wobeser y Sierra engagiert sich seit über 35 Jahren für Pro-Bono-Rechtsdienstleistungen. Wir unterstützen NGOs und Menschenrechtsinitiativen.",
      zh: "Von Wobeser y Sierra致力于公益法律服务超过35年。我们支持非政府组织、人权事业和司法公正倡议。",
      ko: "Von Wobeser y Sierra는 35년 이상 프로보노 법률 서비스에 헌신해 왔습니다. NGO, 인권 활동 및 사법 접근성 이니셔티브를 지원합니다.",
      ja: "Von Wobeser y Sierraは35年以上にわたりプロボノ法律サービスに取り組んでいます。NGO、人権、司法アクセスイニシアチブを支援しています。",
      ar: "Von Wobeser y Sierra ملتزمة بتقديم الخدمات القانونية المجانية لأكثر من 35 عامًا. ندعم المنظمات غير الحكومية وقضايا حقوق الإنسان.",
      ru: "Von Wobeser y Sierra более 35 лет оказывает юридические услуги pro bono. Мы поддерживаем НКО, правозащитные инициативы и доступ к правосудию.",
      fr: "Von Wobeser y Sierra s'engage dans les services juridiques pro bono depuis plus de 35 ans. Nous soutenons les ONG et les causes des droits de l'homme.",
      it: "Von Wobeser y Sierra è impegnata nei servizi legali pro bono da oltre 35 anni. Supportiamo ONG, cause per i diritti umani e accesso alla giustizia.",
    },
    path: "/pro-bono",
  },
  germanDesk: {
    title: {
      en: "German Desk | Von Wobeser y Sierra",
      es: "German Desk | Von Wobeser y Sierra",
      de: "German Desk | Von Wobeser y Sierra",
      zh: "德国服务台 | Von Wobeser y Sierra",
      ko: "German Desk | Von Wobeser y Sierra",
      ja: "ジャーマンデスク | Von Wobeser y Sierra",
      ar: "المكتب الألماني | Von Wobeser y Sierra",
      ru: "German Desk | Von Wobeser y Sierra",
      fr: "German Desk | Von Wobeser y Sierra",
      it: "German Desk | Von Wobeser y Sierra",
    },
    description: {
      en: "Over 34 years serving German and Austrian companies in Mexico. Our German Desk provides specialized legal services with attorneys educated in Germany and Austria.",
      es: "Más de 34 años sirviendo a empresas alemanas y austriacas en México. Nuestro German Desk ofrece servicios legales especializados con abogados educados en Alemania y Austria.",
      de: "Seit über 34 Jahren betreuen wir deutsche und österreichische Unternehmen in Mexiko. Unser German Desk bietet spezialisierte Rechtsdienstleistungen mit in Deutschland und Österreich ausgebildeten Anwälten.",
      zh: "为在墨西哥的德国和奥地利公司服务超过34年。我们的德国服务台提供由德国和奥地利培训的律师提供的专业法律服务。",
      ko: "34년 이상 멕시코에서 독일 및 오스트리아 기업에 서비스를 제공하고 있습니다. German Desk는 독일과 오스트리아에서 교육받은 변호사들이 전문 법률 서비스를 제공합니다.",
      ja: "メキシコでドイツ・オーストリア企業に34年以上のサービスを提供。ジャーマンデスクでは、ドイツ・オーストリアで教育を受けた弁護士が専門的な法律サービスを提供します。",
      ar: "أكثر من 34 عامًا في خدمة الشركات الألمانية والنمساوية في المكسيك. يقدم المكتب الألماني خدمات قانونية متخصصة مع محامين متعلمين في ألمانيا والنمسا.",
      ru: "Более 34 лет обслуживаем немецкие и австрийские компании в Мексике. Наш German Desk предоставляет специализированные юридические услуги с юристами, получившими образование в Германии и Австрии.",
      fr: "Plus de 34 ans au service des entreprises allemandes et autrichiennes au Mexique. Notre German Desk offre des services juridiques spécialisés avec des avocats formés en Allemagne et en Autriche.",
      it: "Oltre 34 anni al servizio di aziende tedesche e austriache in Messico. Il nostro German Desk offre servizi legali specializzati con avvocati formati in Germania e Austria.",
    },
    path: "/german-desk",
  },
  articles: {
    title: {
      en: "Articles | Von Wobeser y Sierra",
      es: "Artículos | Von Wobeser y Sierra",
      de: "Artikel | Von Wobeser y Sierra",
      zh: "文章 | Von Wobeser y Sierra",
      ko: "아티클 | Von Wobeser y Sierra",
      ja: "記事 | Von Wobeser y Sierra",
      ar: "المقالات | Von Wobeser y Sierra",
      ru: "Статьи | Von Wobeser y Sierra",
      fr: "Articles | Von Wobeser y Sierra",
      it: "Articoli | Von Wobeser y Sierra",
    },
    description: {
      en: "Read legal articles and publications from Von Wobeser y Sierra. Expert insights on Mexican law, regulatory changes, and industry developments.",
      es: "Lea artículos y publicaciones legales de Von Wobeser y Sierra. Insights expertos sobre la ley mexicana, cambios regulatorios y desarrollos de la industria.",
      de: "Lesen Sie juristische Artikel und Publikationen von Von Wobeser y Sierra. Experteneinblicke zu mexikanischem Recht und regulatorischen Änderungen.",
      zh: "阅读Von Wobeser y Sierra的法律文章和出版物。关于墨西哥法律、监管变化和行业发展的专家见解。",
      ko: "Von Wobeser y Sierra의 법률 기사 및 출판물을 읽어보세요. 멕시코 법률, 규제 변경 및 산업 동향에 대한 전문 인사이트.",
      ja: "Von Wobeser y Sierraの法律記事と出版物をご覧ください。メキシコ法、規制変更、業界動向に関する専門的な見解。",
      ar: "اقرأ المقالات والمنشورات القانونية من Von Wobeser y Sierra. رؤى الخبراء حول القانون المكسيكي والتغييرات التنظيمية.",
      ru: "Читайте юридические статьи и публикации Von Wobeser y Sierra. Экспертные материалы о мексиканском праве и регуляторных изменениях.",
      fr: "Lisez les articles et publications juridiques de Von Wobeser y Sierra. Perspectives d'experts sur le droit mexicain et les évolutions réglementaires.",
      it: "Leggi gli articoli e le pubblicazioni legali di Von Wobeser y Sierra. Approfondimenti esperti sul diritto messicano e le evoluzioni normative.",
    },
    path: "/articles",
  },
  newsletter: {
    title: {
      en: "Newsletter | Von Wobeser y Sierra",
      es: "Boletín Informativo | Von Wobeser y Sierra",
      de: "Newsletter | Von Wobeser y Sierra",
      zh: "通讯 | Von Wobeser y Sierra",
      ko: "뉴스레터 | Von Wobeser y Sierra",
      ja: "ニュースレター | Von Wobeser y Sierra",
      ar: "النشرة الإخبارية | Von Wobeser y Sierra",
      ru: "Рассылка | Von Wobeser y Sierra",
      fr: "Newsletter | Von Wobeser y Sierra",
      it: "Newsletter | Von Wobeser y Sierra",
    },
    description: {
      en: "Subscribe to Von Wobeser y Sierra's newsletter for legal updates, industry insights, and firm news. Stay informed about Mexican law and regulatory developments.",
      es: "Suscríbase al boletín de Von Wobeser y Sierra para actualizaciones legales, insights de la industria y noticias de la firma. Manténgase informado sobre la ley mexicana.",
      de: "Abonnieren Sie den Newsletter von Von Wobeser y Sierra für rechtliche Updates, Brancheneinblicke und Kanzleinachrichten.",
      zh: "订阅Von Wobeser y Sierra的通讯，获取法律更新、行业见解和事务所新闻。了解墨西哥法律和监管动态。",
      ko: "Von Wobeser y Sierra 뉴스레터를 구독하여 법률 업데이트, 산업 인사이트 및 회사 뉴스를 받아보세요.",
      ja: "Von Wobeser y Sierraのニュースレターを購読して、法律の最新情報、業界インサイト、事務所ニュースを受け取りましょう。",
      ar: "اشترك في النشرة الإخبارية لـ Von Wobeser y Sierra للحصول على التحديثات القانونية ورؤى الصناعة وأخبار الشركة.",
      ru: "Подпишитесь на рассылку Von Wobeser y Sierra для получения юридических обновлений, отраслевых инсайтов и новостей фирмы.",
      fr: "Abonnez-vous à la newsletter de Von Wobeser y Sierra pour les mises à jour juridiques, les perspectives du secteur et les nouvelles du cabinet.",
      it: "Iscriviti alla newsletter di Von Wobeser y Sierra per aggiornamenti legali, approfondimenti del settore e notizie dello studio.",
    },
    path: "/newsletter",
  },
  events: {
    title: {
      en: "Events | Von Wobeser y Sierra",
      es: "Eventos | Von Wobeser y Sierra",
      de: "Veranstaltungen | Von Wobeser y Sierra",
      zh: "活动 | Von Wobeser y Sierra",
      ko: "이벤트 | Von Wobeser y Sierra",
      ja: "イベント | Von Wobeser y Sierra",
      ar: "الفعاليات | Von Wobeser y Sierra",
      ru: "Мероприятия | Von Wobeser y Sierra",
      fr: "Événements | Von Wobeser y Sierra",
      it: "Eventi | Von Wobeser y Sierra",
    },
    description: {
      en: "Join Von Wobeser y Sierra at conferences, webinars, speaking engagements, and networking events. Stay connected with Mexico's leading law firm.",
      es: "Únase a Von Wobeser y Sierra en conferencias, webinars, ponencias y eventos de networking. Manténgase conectado con la firma de abogados líder de México.",
      de: "Nehmen Sie an Konferenzen, Webinaren, Vorträgen und Networking-Events von Von Wobeser y Sierra teil.",
      zh: "加入Von Wobeser y Sierra的会议、网络研讨会、演讲和社交活动。与墨西哥领先的律师事务所保持联系。",
      ko: "Von Wobeser y Sierra의 컨퍼런스, 웨비나, 강연 및 네트워킹 이벤트에 참여하세요. 멕시코 최고의 로펌과 연결되세요.",
      ja: "Von Wobeser y Sierraのカンファレンス、ウェビナー、講演、ネットワーキングイベントにご参加ください。",
      ar: "انضم إلى Von Wobeser y Sierra في المؤتمرات والندوات عبر الإنترنت والمحاضرات وفعاليات التواصل.",
      ru: "Присоединяйтесь к Von Wobeser y Sierra на конференциях, вебинарах, выступлениях и нетворкинг-мероприятиях.",
      fr: "Rejoignez Von Wobeser y Sierra lors de conférences, webinaires, interventions et événements de networking.",
      it: "Partecipa con Von Wobeser y Sierra a conferenze, webinar, interventi e eventi di networking.",
    },
    path: "/events",
  },
  interns: {
    title: {
      en: "Internship Program | Von Wobeser y Sierra",
      es: "Programa de Pasantes | Von Wobeser y Sierra",
      de: "Praktikumsprogramm | Von Wobeser y Sierra",
      zh: "实习项目 | Von Wobeser y Sierra",
      ko: "인턴십 프로그램 | Von Wobeser y Sierra",
      ja: "インターンシッププログラム | Von Wobeser y Sierra",
      ar: "برنامج التدريب | Von Wobeser y Sierra",
      ru: "Программа Стажировок | Von Wobeser y Sierra",
      fr: "Programme de Stage | Von Wobeser y Sierra",
      it: "Programma Tirocini | Von Wobeser y Sierra",
    },
    description: {
      en: "Launch your legal career with Von Wobeser y Sierra's internship program. Summer and permanent internships available for law students. Gain hands-on experience at one of Mexico's leading law firms.",
      es: "Inicia tu carrera legal con el programa de pasantías de Von Wobeser y Sierra. Pasantías de verano y permanentes disponibles para estudiantes de derecho. Obtén experiencia práctica en una de las firmas líderes de México.",
      de: "Starten Sie Ihre juristische Karriere mit dem Praktikumsprogramm von Von Wobeser y Sierra. Sommer- und Dauerpraktika für Jurastudenten verfügbar.",
      zh: "通过Von Wobeser y Sierra的实习项目开启您的法律职业生涯。为法学院学生提供暑期和长期实习机会。在墨西哥领先的律所获得实践经验。",
      ko: "Von Wobeser y Sierra의 인턴십 프로그램으로 법률 커리어를 시작하세요. 법대생을 위한 여름 및 정규 인턴십이 있습니다.",
      ja: "Von Wobeser y Sierraのインターンシッププログラムで法律キャリアをスタートしましょう。法学部生向けのサマーインターンシップと常時採用のインターンシップがあります。",
      ar: "ابدأ مسيرتك القانونية مع برنامج التدريب في Von Wobeser y Sierra. تتوفر فرص تدريب صيفية ودائمة لطلاب القانون.",
      ru: "Начните юридическую карьеру с программы стажировок Von Wobeser y Sierra. Летние и постоянные стажировки для студентов-юристов.",
      fr: "Lancez votre carrière juridique avec le programme de stage de Von Wobeser y Sierra. Stages d'été et permanents disponibles pour les étudiants en droit.",
      it: "Avvia la tua carriera legale con il programma di tirocinio di Von Wobeser y Sierra. Tirocini estivi e permanenti disponibili per studenti di giurisprudenza.",
    },
    path: "/careers/interns",
  },
};

interface SEOHeadProps {
  page: keyof typeof seoConfig;
  language: LanguageCode;
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
  customPath?: string;
}

export default function SEOHead({
  page,
  language,
  customTitle,
  customDescription,
  customImage,
  customPath,
}: SEOHeadProps) {
  useEffect(() => {
    const config = seoConfig[page];
    if (!config) return;

    const title = customTitle || config.title[language];
    const description = customDescription || config.description[language];
    const path = customPath || config.path;
    const image = customImage || DEFAULT_IMAGE;
    const url = `${BASE_URL}${path}`;

    document.title = title;

    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        if (isProperty) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    const updateOrCreateLink = (rel: string, href: string, attributes?: Record<string, string>) => {
      const extraSelector = attributes 
        ? Object.entries(attributes).map(([k, v]) => `[${k}="${v}"]`).join("")
        : "";
      const selector = `link[rel="${rel}"]${extraSelector}`;
      let link = document.querySelector(selector) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            link!.setAttribute(key, value);
          });
        }
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    updateOrCreateMeta("description", description);

    updateOrCreateMeta("og:title", title, true);
    updateOrCreateMeta("og:description", description, true);
    updateOrCreateMeta("og:url", url, true);
    updateOrCreateMeta("og:image", image, true);
    updateOrCreateMeta("og:type", "website", true);
    updateOrCreateMeta("og:site_name", "Von Wobeser y Sierra", true);
    
    updateOrCreateMeta("og:locale", OG_LOCALE_CODES[language], true);

    const removeExistingOgLocaleAlternates = () => {
      const existingAlternates = document.querySelectorAll('meta[property="og:locale:alternate"]');
      existingAlternates.forEach(el => el.remove());
    };
    removeExistingOgLocaleAlternates();

    SUPPORTED_LANGUAGES.forEach((lang) => {
      if (lang.code !== language) {
        const alternateMeta = document.createElement("meta");
        alternateMeta.setAttribute("property", "og:locale:alternate");
        alternateMeta.setAttribute("content", OG_LOCALE_CODES[lang.code]);
        document.head.appendChild(alternateMeta);
      }
    });

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta("twitter:title", title);
    updateOrCreateMeta("twitter:description", description);
    updateOrCreateMeta("twitter:image", image);

    updateOrCreateLink("canonical", url);

    const removeExistingHreflangLinks = () => {
      const existingLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
      existingLinks.forEach(el => el.remove());
    };
    removeExistingHreflangLinks();

    SUPPORTED_LANGUAGES.forEach((lang) => {
      const hreflangLink = document.createElement("link");
      hreflangLink.setAttribute("rel", "alternate");
      hreflangLink.setAttribute("hreflang", HREFLANG_CODES[lang.code]);
      hreflangLink.setAttribute("href", url);
      document.head.appendChild(hreflangLink);
    });

    const xDefaultLink = document.createElement("link");
    xDefaultLink.setAttribute("rel", "alternate");
    xDefaultLink.setAttribute("hreflang", "x-default");
    xDefaultLink.setAttribute("href", `${BASE_URL}${path}`);
    document.head.appendChild(xDefaultLink);

    return () => {
    };
  }, [page, language, customTitle, customDescription, customImage, customPath]);

  return null;
}

export { seoConfig };
