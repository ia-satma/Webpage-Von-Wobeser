import { useEffect } from "react";

const BASE_URL = "https://www.vonwobeser.com";
const DEFAULT_IMAGE = "https://vonwobeser.com/images/vonwobeser_2025_.png";

interface SEOConfig {
  title: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  path: string;
}

const seoConfig: Record<string, SEOConfig> = {
  home: {
    title: {
      en: "Von Wobeser y Sierra | Leading Law Firm in Mexico",
      es: "Von Wobeser y Sierra | Firma de Abogados Líder en México",
    },
    description: {
      en: "Von Wobeser y Sierra is one of Mexico's most prestigious law firms with over 70 years of experience. We provide comprehensive legal services in corporate law, litigation, M&A, and more.",
      es: "Von Wobeser y Sierra es una de las firmas de abogados más prestigiosas de México con más de 70 años de experiencia. Brindamos servicios legales integrales en derecho corporativo, litigio, M&A y más.",
    },
    path: "/",
  },
  about: {
    title: {
      en: "About Us | Von Wobeser y Sierra",
      es: "Acerca de Nosotros | Von Wobeser y Sierra",
    },
    description: {
      en: "Learn about Von Wobeser y Sierra's history, values, and commitment to legal excellence. Founded in 1952, we are one of Mexico's leading law firms with a proven track record.",
      es: "Conozca la historia, valores y compromiso con la excelencia legal de Von Wobeser y Sierra. Fundado en 1952, somos una de las firmas de abogados líderes en México.",
    },
    path: "/about",
  },
  team: {
    title: {
      en: "Our Team | Von Wobeser y Sierra",
      es: "Nuestro Equipo | Von Wobeser y Sierra",
    },
    description: {
      en: "Meet our team of experienced attorneys at Von Wobeser y Sierra. Our partners and associates are recognized leaders in their respective practice areas across Mexico.",
      es: "Conozca a nuestro equipo de abogados experimentados en Von Wobeser y Sierra. Nuestros socios y asociados son líderes reconocidos en sus respectivas áreas de práctica.",
    },
    path: "/team",
  },
  practiceGroups: {
    title: {
      en: "Practice Areas | Von Wobeser y Sierra",
      es: "Áreas de Práctica | Von Wobeser y Sierra",
    },
    description: {
      en: "Explore our comprehensive practice areas including Corporate Law, M&A, Litigation, Antitrust, Banking & Finance, and more. Expert legal services tailored to your needs.",
      es: "Explore nuestras áreas de práctica integrales incluyendo Derecho Corporativo, M&A, Litigio, Competencia Económica, Banca y Finanzas, y más. Servicios legales especializados.",
    },
    path: "/practice-groups",
  },
  industryGroups: {
    title: {
      en: "Industry Groups | Von Wobeser y Sierra",
      es: "Grupos Industriales | Von Wobeser y Sierra",
    },
    description: {
      en: "Specialized legal expertise across key industry sectors including Energy, Real Estate, Technology, Financial Services, and more. Industry-focused solutions for your business.",
      es: "Experiencia legal especializada en sectores industriales clave incluyendo Energía, Bienes Raíces, Tecnología, Servicios Financieros, y más. Soluciones enfocadas en su industria.",
    },
    path: "/industry-groups",
  },
  news: {
    title: {
      en: "News & Insights | Von Wobeser y Sierra",
      es: "Noticias e Insights | Von Wobeser y Sierra",
    },
    description: {
      en: "Stay informed with the latest legal news, insights, and updates from Von Wobeser y Sierra. Explore our publications, press releases, and thought leadership.",
      es: "Manténgase informado con las últimas noticias legales, insights y actualizaciones de Von Wobeser y Sierra. Explore nuestras publicaciones y liderazgo de pensamiento.",
    },
    path: "/news",
  },
  contact: {
    title: {
      en: "Contact Us | Von Wobeser y Sierra",
      es: "Contáctenos | Von Wobeser y Sierra",
    },
    description: {
      en: "Get in touch with Von Wobeser y Sierra. Visit our offices in Mexico City or contact our team for legal consultation and inquiries.",
      es: "Póngase en contacto con Von Wobeser y Sierra. Visite nuestras oficinas en Ciudad de México o contacte a nuestro equipo para consultas legales.",
    },
    path: "/contact",
  },
  careers: {
    title: {
      en: "Careers | Von Wobeser y Sierra",
      es: "Carreras | Von Wobeser y Sierra",
    },
    description: {
      en: "Join one of Mexico's leading law firms. Explore career opportunities, internship programs, and professional development at Von Wobeser y Sierra.",
      es: "Únase a una de las firmas de abogados líderes de México. Explore oportunidades de carrera, programas de pasantías y desarrollo profesional en Von Wobeser y Sierra.",
    },
    path: "/careers",
  },
  rankings: {
    title: {
      en: "Rankings & Recognition | Von Wobeser y Sierra",
      es: "Rankings y Reconocimientos | Von Wobeser y Sierra",
    },
    description: {
      en: "Von Wobeser y Sierra is consistently ranked among Mexico's top law firms by Chambers, Legal 500, Latin Lawyer 250, and other prestigious legal directories.",
      es: "Von Wobeser y Sierra es consistentemente clasificada entre las principales firmas de México por Chambers, Legal 500, Latin Lawyer 250 y otros directorios legales.",
    },
    path: "/rankings",
  },
  experience: {
    title: {
      en: "Our Experience | Von Wobeser y Sierra",
      es: "Nuestra Experiencia | Von Wobeser y Sierra",
    },
    description: {
      en: "Explore our track record of landmark transactions, complex disputes, and strategic advisory matters. Representative experience across all practice areas.",
      es: "Explore nuestra trayectoria de transacciones históricas, disputas complejas y asuntos de asesoría estratégica. Experiencia representativa en todas las áreas de práctica.",
    },
    path: "/experience",
  },
  offices: {
    title: {
      en: "Our Offices | Von Wobeser y Sierra",
      es: "Nuestras Oficinas | Von Wobeser y Sierra",
    },
    description: {
      en: "Visit Von Wobeser y Sierra at Torre SOMA Chapultepec in Polanco, Mexico City. Modern facilities with state-of-the-art amenities for clients and team members.",
      es: "Visite Von Wobeser y Sierra en Torre SOMA Chapultepec en Polanco, Ciudad de México. Instalaciones modernas con amenidades de primera clase.",
    },
    path: "/offices",
  },
  privacyPolicy: {
    title: {
      en: "Privacy Policy | Von Wobeser y Sierra",
      es: "Política de Privacidad | Von Wobeser y Sierra",
    },
    description: {
      en: "Read Von Wobeser y Sierra's Privacy Policy regarding the collection, use, and protection of personal data under Mexican law (LFPDPPP).",
      es: "Lea la Política de Privacidad de Von Wobeser y Sierra sobre la recolección, uso y protección de datos personales bajo la ley mexicana (LFPDPPP).",
    },
    path: "/privacy-policy",
  },
  terms: {
    title: {
      en: "Terms and Conditions | Von Wobeser y Sierra",
      es: "Términos y Condiciones | Von Wobeser y Sierra",
    },
    description: {
      en: "Review the Terms and Conditions for using the Von Wobeser y Sierra website. Please read these terms carefully before using our services.",
      es: "Revise los Términos y Condiciones para el uso del sitio web de Von Wobeser y Sierra. Por favor lea estos términos cuidadosamente.",
    },
    path: "/terms",
  },
};

interface SEOHeadProps {
  page: keyof typeof seoConfig;
  language: "es" | "en";
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
    const alternateLanguage = language === "en" ? "es" : "en";
    const alternateUrl = `${BASE_URL}${path}`;

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
    updateOrCreateMeta("og:locale", language === "es" ? "es_MX" : "en_US", true);
    updateOrCreateMeta("og:locale:alternate", language === "es" ? "en_US" : "es_MX", true);

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta("twitter:title", title);
    updateOrCreateMeta("twitter:description", description);
    updateOrCreateMeta("twitter:image", image);

    updateOrCreateLink("canonical", url);

    updateOrCreateLink("alternate", url, { hreflang: language === "es" ? "es-MX" : "en" });
    updateOrCreateLink("alternate", alternateUrl, { hreflang: alternateLanguage === "es" ? "es-MX" : "en" });
    updateOrCreateLink("alternate", url, { hreflang: "x-default" });

    return () => {
    };
  }, [page, language, customTitle, customDescription, customImage, customPath]);

  return null;
}

export { seoConfig };
