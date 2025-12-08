import type { LanguageCode } from "@shared/schema";

interface JsonLdSchemaProps {
  language: LanguageCode;
}

const LANGUAGE_CODES: Record<LanguageCode, string> = {
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

const descriptions = {
  legalService: {
    en: "Von Wobeser y Sierra, S.C. is a leading law firm in Mexico, specializing in corporate legal services, litigation, arbitration, tax law, mergers and acquisitions, and more. Founded in 1986, it is recognized by Chambers, Legal 500 and other international directories.",
    es: "Von Wobeser y Sierra, S.C. es una firma de abogados líder en México, especializada en servicios legales corporativos, litigio, arbitraje, derecho fiscal, fusiones y adquisiciones, y más. Fundada en 1986, es reconocida por Chambers, Legal 500 y otros directorios internacionales.",
    de: "Von Wobeser y Sierra, S.C. ist eine führende Anwaltskanzlei in Mexiko, spezialisiert auf Unternehmensrecht, Prozessführung, Schiedsverfahren, Steuerrecht, Fusionen und Übernahmen und mehr. Gegründet 1986, anerkannt von Chambers, Legal 500 und anderen internationalen Verzeichnissen.",
    zh: "Von Wobeser y Sierra, S.C.是墨西哥领先的律师事务所，专门从事公司法律服务、诉讼、仲裁、税法、并购等。成立于1986年，获得Chambers、Legal 500等国际目录认可。",
    ko: "Von Wobeser y Sierra, S.C.는 멕시코의 선도적인 로펌으로, 기업 법률 서비스, 소송, 중재, 조세법, 인수합병 등을 전문으로 합니다. 1986년 설립, Chambers, Legal 500 등 국제 디렉토리에서 인정받고 있습니다.",
    ja: "Von Wobeser y Sierra, S.C.はメキシコの主要法律事務所であり、企業法務、訴訟、仲裁、税法、M&Aなどを専門としています。1986年設立、Chambers、Legal 500などの国際ディレクトリで認められています。",
    ar: "Von Wobeser y Sierra, S.C. هي شركة محاماة رائدة في المكسيك، متخصصة في الخدمات القانونية للشركات والتقاضي والتحكيم وقانون الضرائب وعمليات الاندماج والاستحواذ. تأسست عام 1986، ومعترف بها من قبل Chambers و Legal 500.",
    ru: "Von Wobeser y Sierra, S.C. — ведущая юридическая фирма в Мексике, специализирующаяся на корпоративных юридических услугах, судебных разбирательствах, арбитраже, налоговом праве, слияниях и поглощениях. Основана в 1986 году, признана Chambers, Legal 500.",
    fr: "Von Wobeser y Sierra, S.C. est un cabinet d'avocats leader au Mexique, spécialisé dans les services juridiques aux entreprises, le contentieux, l'arbitrage, le droit fiscal, les fusions et acquisitions. Fondé en 1986, reconnu par Chambers, Legal 500.",
    it: "Von Wobeser y Sierra, S.C. è uno studio legale leader in Messico, specializzato in servizi legali aziendali, contenzioso, arbitrato, diritto tributario, fusioni e acquisizioni. Fondato nel 1986, riconosciuto da Chambers, Legal 500.",
  },
  organization: {
    en: "Von Wobeser y Sierra, S.C. is one of Mexico's most prestigious law firms, with over 150 attorneys specializing in corporate law, litigation, arbitration, mergers and acquisitions, tax law, banking and finance, intellectual property, labor and environmental law.",
    es: "Von Wobeser y Sierra, S.C. es una de las firmas legales más prestigiosas de México, con más de 150 abogados especializados en derecho corporativo, litigio, arbitraje, fusiones y adquisiciones, derecho fiscal, bancario y financiero, propiedad intelectual, laboral y ambiental.",
    de: "Von Wobeser y Sierra, S.C. ist eine der renommiertesten Kanzleien Mexikos mit über 150 Anwälten, spezialisiert auf Gesellschaftsrecht, Prozessführung, Schiedsverfahren, M&A, Steuerrecht, Banken und Finanzen, geistiges Eigentum, Arbeits- und Umweltrecht.",
    zh: "Von Wobeser y Sierra, S.C.是墨西哥最负盛名的律师事务所之一，拥有150多名律师，专门从事公司法、诉讼、仲裁、并购、税法、银行和金融、知识产权、劳动和环境法。",
    ko: "Von Wobeser y Sierra, S.C.는 멕시코에서 가장 명망 있는 로펌 중 하나로, 150명 이상의 변호사가 기업법, 소송, 중재, M&A, 조세법, 금융, 지식재산권, 노동 및 환경법을 전문으로 합니다.",
    ja: "Von Wobeser y Sierra, S.C.はメキシコで最も権威ある法律事務所の一つであり、150名以上の弁護士が会社法、訴訟、仲裁、M&A、税法、銀行・金融、知的財産、労働・環境法を専門としています。",
    ar: "Von Wobeser y Sierra, S.C. هي واحدة من أعرق شركات المحاماة في المكسيك، مع أكثر من 150 محامياً متخصصين في قانون الشركات والتقاضي والتحكيم والاندماج والاستحواذ وقانون الضرائب والخدمات المصرفية والملكية الفكرية.",
    ru: "Von Wobeser y Sierra, S.C. — одна из самых престижных юридических фирм Мексики, насчитывающая более 150 юристов, специализирующихся на корпоративном праве, судебных разбирательствах, арбитраже, M&A, налоговом праве, банковском деле, интеллектуальной собственности.",
    fr: "Von Wobeser y Sierra, S.C. est l'un des cabinets d'avocats les plus prestigieux du Mexique, avec plus de 150 avocats spécialisés en droit des sociétés, contentieux, arbitrage, M&A, droit fiscal, banque et finance, propriété intellectuelle, droit du travail et environnemental.",
    it: "Von Wobeser y Sierra, S.C. è uno degli studi legali più prestigiosi del Messico, con oltre 150 avvocati specializzati in diritto societario, contenzioso, arbitrato, M&A, diritto tributario, banche e finanza, proprietà intellettuale, diritto del lavoro e ambientale.",
  },
  slogan: {
    en: "Legal excellence for your business in Mexico",
    es: "Excelencia legal para sus negocios en México",
    de: "Rechtliche Exzellenz für Ihr Geschäft in Mexiko",
    zh: "为您在墨西哥的业务提供卓越的法律服务",
    ko: "멕시코 비즈니스를 위한 법률적 탁월함",
    ja: "メキシコでのビジネスのための法的卓越性",
    ar: "التميز القانوني لأعمالك في المكسيك",
    ru: "Юридическое превосходство для вашего бизнеса в Мексике",
    fr: "Excellence juridique pour vos affaires au Mexique",
    it: "Eccellenza legale per il tuo business in Messico",
  },
  localBusiness: {
    en: "Main office of Von Wobeser y Sierra, located in Torre SOMA Chapultepec, one of Mexico's most prestigious law firms.",
    es: "Oficina principal de Von Wobeser y Sierra, ubicada en Torre SOMA Chapultepec, una de las firmas legales más prestigiosas de México.",
    de: "Hauptbüro von Von Wobeser y Sierra im Torre SOMA Chapultepec, eine der renommiertesten Anwaltskanzleien Mexikos.",
    zh: "Von Wobeser y Sierra主办公室，位于Torre SOMA Chapultepec，是墨西哥最负盛名的律师事务所之一。",
    ko: "Von Wobeser y Sierra 본사 사무실, Torre SOMA Chapultepec에 위치, 멕시코에서 가장 명망 있는 로펌 중 하나입니다.",
    ja: "Von Wobeser y Sierraの本社オフィス、Torre SOMA Chapultepecに位置し、メキシコで最も権威ある法律事務所の一つです。",
    ar: "المكتب الرئيسي لـ Von Wobeser y Sierra، يقع في Torre SOMA Chapultepec، أحد أعرق شركات المحاماة في المكسيك.",
    ru: "Главный офис Von Wobeser y Sierra, расположенный в Torre SOMA Chapultepec, одной из самых престижных юридических фирм Мексики.",
    fr: "Bureau principal de Von Wobeser y Sierra, situé dans la Torre SOMA Chapultepec, l'un des cabinets d'avocats les plus prestigieux du Mexique.",
    it: "Sede principale di Von Wobeser y Sierra, situata nella Torre SOMA Chapultepec, uno degli studi legali più prestigiosi del Messico.",
  },
  legalServices: {
    en: "Legal Services",
    es: "Servicios Legales",
    de: "Rechtsdienstleistungen",
    zh: "法律服务",
    ko: "법률 서비스",
    ja: "法律サービス",
    ar: "الخدمات القانونية",
    ru: "Юридические услуги",
    fr: "Services Juridiques",
    it: "Servizi Legali",
  },
  homeBreadcrumb: {
    en: "Home",
    es: "Inicio",
    de: "Startseite",
    zh: "首页",
    ko: "홈",
    ja: "ホーム",
    ar: "الرئيسية",
    ru: "Главная",
    fr: "Accueil",
    it: "Home",
  },
};

const serviceNames: Record<string, Record<LanguageCode, string>> = {
  corporateLaw: {
    en: "Corporate Law",
    es: "Derecho Corporativo",
    de: "Gesellschaftsrecht",
    zh: "公司法",
    ko: "기업법",
    ja: "会社法",
    ar: "قانون الشركات",
    ru: "Корпоративное право",
    fr: "Droit des Sociétés",
    it: "Diritto Societario",
  },
  litigationArbitration: {
    en: "Litigation and Arbitration",
    es: "Litigio y Arbitraje",
    de: "Prozessführung und Schiedsverfahren",
    zh: "诉讼与仲裁",
    ko: "소송 및 중재",
    ja: "訴訟・仲裁",
    ar: "التقاضي والتحكيم",
    ru: "Судебные разбирательства и арбитраж",
    fr: "Contentieux et Arbitrage",
    it: "Contenzioso e Arbitrato",
  },
  mergersAcquisitions: {
    en: "Mergers and Acquisitions",
    es: "Fusiones y Adquisiciones",
    de: "Fusionen und Übernahmen",
    zh: "并购",
    ko: "인수합병",
    ja: "M&A",
    ar: "الاندماج والاستحواذ",
    ru: "Слияния и поглощения",
    fr: "Fusions et Acquisitions",
    it: "Fusioni e Acquisizioni",
  },
  taxLaw: {
    en: "Tax Law",
    es: "Derecho Fiscal",
    de: "Steuerrecht",
    zh: "税法",
    ko: "조세법",
    ja: "税法",
    ar: "قانون الضرائب",
    ru: "Налоговое право",
    fr: "Droit Fiscal",
    it: "Diritto Tributario",
  },
  bankingFinance: {
    en: "Banking and Finance",
    es: "Bancario y Finanzas",
    de: "Banken und Finanzen",
    zh: "银行与金融",
    ko: "금융",
    ja: "銀行・金融",
    ar: "الخدمات المصرفية والمالية",
    ru: "Банковское дело и финансы",
    fr: "Banque et Finance",
    it: "Banche e Finanza",
  },
  intellectualProperty: {
    en: "Intellectual Property",
    es: "Propiedad Intelectual",
    de: "Geistiges Eigentum",
    zh: "知识产权",
    ko: "지식재산권",
    ja: "知的財産",
    ar: "الملكية الفكرية",
    ru: "Интеллектуальная собственность",
    fr: "Propriété Intellectuelle",
    it: "Proprietà Intellettuale",
  },
  laborLaw: {
    en: "Labor Law",
    es: "Derecho Laboral",
    de: "Arbeitsrecht",
    zh: "劳动法",
    ko: "노동법",
    ja: "労働法",
    ar: "قانون العمل",
    ru: "Трудовое право",
    fr: "Droit du Travail",
    it: "Diritto del Lavoro",
  },
  environmentalLaw: {
    en: "Environmental Law",
    es: "Derecho Ambiental",
    de: "Umweltrecht",
    zh: "环境法",
    ko: "환경법",
    ja: "環境法",
    ar: "القانون البيئي",
    ru: "Экологическое право",
    fr: "Droit de l'Environnement",
    it: "Diritto Ambientale",
  },
};

export default function JsonLdSchema({ language }: JsonLdSchemaProps) {
  const langDescriptions = {
    legalService: descriptions.legalService[language],
    organization: descriptions.organization[language],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.vonwobeser.com/#organization",
    "name": "Von Wobeser y Sierra, S.C.",
    "alternateName": "VWS",
    "legalName": "Von Wobeser y Sierra, S.C.",
    "url": "https://www.vonwobeser.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://vonwobeser.com/images/vonwobeser_2025.png",
      "width": "300",
      "height": "60"
    },
    "image": "https://vonwobeser.com/images/vonwobeser_2025.png",
    "description": langDescriptions.organization,
    "foundingDate": "1986",
    "foundingLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ciudad de México",
        "addressCountry": "MX"
      }
    },
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": "150+"
    },
    "slogan": descriptions.slogan[language],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Torre SOMA Chapultepec Piso 18, Campos Elíseos 204",
      "addressLocality": "Polanco",
      "postalCode": "11560",
      "addressRegion": "Ciudad de México",
      "addressCountry": "MX"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+52 55 5258 1000",
        "contactType": "customer service",
        "email": "info@vonwobeser.com",
        "availableLanguage": ["Spanish", "English", "German"]
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/company/von-wobeser-y-sierra"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Mexico"
    },
    "knowsAbout": [
      "Corporate Law",
      "Litigation",
      "Arbitration",
      "Tax Law",
      "Mergers and Acquisitions",
      "Banking and Finance",
      "Real Estate",
      "Intellectual Property",
      "Labor Law",
      "Environmental Law",
      "International Trade",
      "Energy Law",
      "Antitrust and Competition",
      "Compliance",
      "Corporate Governance"
    ],
    "award": [
      "Chambers Latin America - Band 1",
      "Legal 500 - Hall of Fame",
      "Latin Lawyer 250",
      "IFLR1000",
      "Who's Who Legal"
    ]
  };

  const legalServiceSchema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": "https://www.vonwobeser.com/#legalservice",
    "name": "Von Wobeser y Sierra, S.C.",
    "url": "https://www.vonwobeser.com",
    "logo": "https://vonwobeser.com/images/vonwobeser_2025.png",
    "image": "https://vonwobeser.com/images/vonwobeser_2025.png",
    "description": langDescriptions.legalService,
    "priceRange": "$$$",
    "currenciesAccepted": "MXN, USD",
    "paymentAccepted": "Bank Transfer, Wire Transfer",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Torre SOMA Chapultepec Piso 18, Campos Elíseos 204",
      "addressLocality": "Polanco",
      "postalCode": "11560",
      "addressRegion": "Ciudad de México",
      "addressCountry": "MX"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "19.4267",
      "longitude": "-99.1930"
    },
    "telephone": "+52 55 5258 1000",
    "email": "info@vonwobeser.com",
    "areaServed": [
      {
        "@type": "Country",
        "name": "Mexico"
      },
      {
        "@type": "AdministrativeArea",
        "name": "Latin America"
      }
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/company/von-wobeser-y-sierra"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": descriptions.legalServices[language],
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.corporateLaw[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.litigationArbitration[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.mergersAcquisitions[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.taxLaw[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.bankingFinance[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.intellectualProperty[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.laborLaw[language]
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceNames.environmentalLaw[language]
          }
        }
      ]
    },
    "knowsAbout": [
      "Corporate Law",
      "Litigation",
      "Arbitration",
      "Tax Law",
      "Mergers and Acquisitions",
      "Banking and Finance",
      "Real Estate",
      "Intellectual Property",
      "Labor Law",
      "Environmental Law"
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.vonwobeser.com/#localbusiness",
    "name": "Von Wobeser y Sierra, S.C.",
    "description": descriptions.localBusiness[language],
    "image": "https://vonwobeser.com/images/office.jpg",
    "url": "https://www.vonwobeser.com",
    "telephone": "+52 55 5258 1000",
    "email": "info@vonwobeser.com",
    "priceRange": "$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Torre SOMA Chapultepec Piso 18, Campos Elíseos 204",
      "addressLocality": "Polanco",
      "postalCode": "11560",
      "addressRegion": "Ciudad de México",
      "addressCountry": "MX"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "19.4267",
      "longitude": "-99.1930"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "hasMap": "https://www.google.com/maps/place/Torre+SOMA+Chapultepec/@19.4267,-99.1930,17z"
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.vonwobeser.com/#website",
    "name": "Von Wobeser y Sierra",
    "url": "https://www.vonwobeser.com",
    "inLanguage": LANGUAGE_CODES[language],
    "description": descriptions.organization[language],
    "publisher": {
      "@id": "https://www.vonwobeser.com/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.vonwobeser.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": descriptions.homeBreadcrumb[language],
        "item": "https://www.vonwobeser.com"
      }
    ]
  };

  const schemas = [
    organizationSchema,
    legalServiceSchema,
    localBusinessSchema,
    websiteSchema,
    breadcrumbSchema
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export function ArticleJsonLd({
  headline,
  description,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  imageUrl,
  url,
  language = "en"
}: {
  headline: string;
  description: string;
  datePublished: string | Date | null;
  dateModified?: string | Date | null;
  authorName?: string;
  authorUrl?: string;
  imageUrl?: string | null;
  url: string;
  language?: LanguageCode;
}) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return new Date().toISOString();
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString();
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": headline,
    "description": description,
    "image": imageUrl || "https://vonwobeser.com/images/vonwobeser_2025.png",
    "datePublished": formatDate(datePublished),
    "dateModified": formatDate(dateModified || datePublished),
    "author": authorName ? {
      "@type": "Person",
      "name": authorName,
      "url": authorUrl
    } : {
      "@type": "Organization",
      "name": "Von Wobeser y Sierra, S.C.",
      "url": "https://www.vonwobeser.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Von Wobeser y Sierra, S.C.",
      "url": "https://www.vonwobeser.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://vonwobeser.com/images/vonwobeser_2025.png",
        "width": "300",
        "height": "60"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "inLanguage": LANGUAGE_CODES[language],
    "isPartOf": {
      "@id": "https://www.vonwobeser.com/#website"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function PersonJsonLd({
  name,
  jobTitle,
  email,
  telephone,
  imageUrl,
  url,
  linkedinUrl,
  education,
  languages,
  knowsAbout,
  language = "en"
}: {
  name: string;
  jobTitle: string;
  email?: string | null;
  telephone?: string | null;
  imageUrl?: string | null;
  url: string;
  linkedinUrl?: string | null;
  education?: Array<{ school: string; degree: string; year?: string }>;
  languages?: string[];
  knowsAbout?: string[];
  language?: LanguageCode;
}) {
  const sameAs = [];
  if (linkedinUrl) sameAs.push(linkedinUrl);

  const alumniOf = education?.map(edu => ({
    "@type": "EducationalOrganization",
    "name": edu.school,
    "description": edu.degree
  })) || [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": name,
    "jobTitle": jobTitle,
    "url": url,
    "image": imageUrl || undefined,
    "email": email || undefined,
    "telephone": telephone || undefined,
    "worksFor": {
      "@type": "LegalService",
      "@id": "https://www.vonwobeser.com/#legalservice",
      "name": "Von Wobeser y Sierra, S.C.",
      "url": "https://www.vonwobeser.com"
    },
    "alumniOf": alumniOf.length > 0 ? alumniOf : undefined,
    "knowsLanguage": languages || undefined,
    "knowsAbout": knowsAbout || undefined,
    "sameAs": sameAs.length > 0 ? sameAs : undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Torre SOMA Chapultepec Piso 18, Campos Elíseos 204",
      "addressLocality": "Ciudad de México",
      "addressRegion": "CDMX",
      "postalCode": "11560",
      "addressCountry": "MX"
    },
    "memberOf": {
      "@type": "Organization",
      "@id": "https://www.vonwobeser.com/#organization",
      "name": "Von Wobeser y Sierra, S.C."
    }
  };

  const cleanSchema = JSON.parse(JSON.stringify(schema, (key, value) => 
    value === undefined ? undefined : value
  ));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
  language = "en"
}: {
  items: Array<{ name: string; url: string }>;
  language?: LanguageCode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
