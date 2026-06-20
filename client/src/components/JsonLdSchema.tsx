import type { LanguageCode } from "@shared/schema";

interface JsonLdSchemaProps {
  language: LanguageCode;
}

const LANGUAGE_CODES: Record<LanguageCode, string> = {
  en: "en",
  es: "es-MX",
};

const descriptions = {
  legalService: {
    en: "Von Wobeser y Sierra, S.C. is a leading law firm in Mexico, specializing in corporate legal services, litigation, arbitration, tax law, mergers and acquisitions, and more. Founded in 1986, it is recognized by Chambers, Legal 500 and other international directories.",
    es: "Von Wobeser y Sierra, S.C. es una firma de abogados líder en México, especializada en servicios legales corporativos, litigio, arbitraje, derecho fiscal, fusiones y adquisiciones, y más. Fundada en 1986, es reconocida por Chambers, Legal 500 y otros directorios internacionales.",
  },
  organization: {
    en: "Von Wobeser y Sierra, S.C. is one of Mexico's most prestigious law firms, with over 150 attorneys specializing in corporate law, litigation, arbitration, mergers and acquisitions, tax law, banking and finance, intellectual property, labor and environmental law.",
    es: "Von Wobeser y Sierra, S.C. es una de las firmas legales más prestigiosas de México, con más de 150 abogados especializados en derecho corporativo, litigio, arbitraje, fusiones y adquisiciones, derecho fiscal, bancario y financiero, propiedad intelectual, laboral y ambiental.",
  },
  slogan: {
    en: "Legal excellence for your business in Mexico",
    es: "Excelencia legal para sus negocios en México",
  },
  localBusiness: {
    en: "Main office of Von Wobeser y Sierra, located in Torre SOMA Chapultepec, one of Mexico's most prestigious law firms.",
    es: "Oficina principal de Von Wobeser y Sierra, ubicada en Torre SOMA Chapultepec, una de las firmas legales más prestigiosas de México.",
  },
  legalServices: {
    en: "Legal Services",
    es: "Servicios Legales",
  },
  homeBreadcrumb: {
    en: "Home",
    es: "Inicio",
  },
};

const serviceNames: Record<string, Record<LanguageCode, string>> = {
  corporateLaw: {
    en: "Corporate Law",
    es: "Derecho Corporativo",
  },
  litigationArbitration: {
    en: "Litigation and Arbitration",
    es: "Litigio y Arbitraje",
  },
  mergersAcquisitions: {
    en: "Mergers and Acquisitions",
    es: "Fusiones y Adquisiciones",
  },
  taxLaw: {
    en: "Tax Law",
    es: "Derecho Fiscal",
  },
  bankingFinance: {
    en: "Banking and Finance",
    es: "Bancario y Finanzas",
  },
  intellectualProperty: {
    en: "Intellectual Property",
    es: "Propiedad Intelectual",
  },
  laborLaw: {
    en: "Labor Law",
    es: "Derecho Laboral",
  },
  environmentalLaw: {
    en: "Environmental Law",
    es: "Derecho Ambiental",
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
