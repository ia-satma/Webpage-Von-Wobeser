import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const esCommon = {
  nav: {
    ourFirm: "Nuestra Firma",
    attorneys: "Abogados",
    capabilities: "Capacidades",
    publications: "Publicaciones",
    career: "Carrera en VWyS",
    contact: "Contacto",
    probono: "Pro Bono",
    diversity: "Diversidad e Inclusión",
    partners: "Socios",
    ofCounsel: "Of Counsel",
    counsel: "Consejeros",
    associates: "Asociados",
    practices: "Prácticas",
    industryGroups: "Grupos de Industria",
    desk: "German Desk",
    news: "Noticias",
    articles: "Artículos",
    newsletter: "Boletines",
    interns: "Pasantes",
    home: "Inicio",
    about: "Acerca de",
    rankings: "Rankings",
    offices: "Oficinas",
    events: "Eventos",
    experience: "Experiencia",
    terms: "Términos",
    privacy: "Privacidad"
  },
  home: {
    heroTagline: "VAMOS A DONDE NUESTROS CLIENTES NOS NECESITAN",
    seeMore: "Ver Más",
    experienceBanner: "Von Wobeser y Sierra, S.C. cuenta con más de tres décadas de experiencia",
    teamStats: "Equipo de más de 150 abogados (22 socios, 6 of counsel, 12 consejeros...)",
    recognitionsTitle: "RECONOCIMIENTOS",
    recognitionsIntro: "Von Wobeser y Sierra, S.C. ha sido reconocida a nivel internacional por diversas instituciones incluyendo",
    welcomeTitle: "Bienvenidos",
    welcomeSubtitle: "Una firma líder en México"
  },
  practices: {
    title: "Prácticas",
    subtitle: "18 Disciplinas Especializadas"
  },
  industries: {
    title: "Grupos de Industria",
    subtitle: "Sectores Especializados"
  },
  germanDesk: {
    title: "German Desk",
    description: "Por más de 34 años, Von Wobeser y Sierra ha trabajado con empresas alemanas, ofreciendo asesoría legal integral en México.",
    subtitle: "Especialistas en inversiones alemanas en México"
  },
  about: {
    title: "Acerca de Nosotros",
    vision: "Visión",
    mission: "Misión",
    values: "Valores",
    integrity: "Integridad",
    excellence: "Excelencia",
    commitment: "Compromiso",
    agility: "Agilidad",
    diversityValue: "Diversidad"
  },
  footer: {
    address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX",
    privacyNotice: "Aviso de Privacidad",
    copyright: "© 2025 Von Wobeser y Sierra, S.C. Todos los derechos reservados.",
    termsOfUse: "Términos de Uso",
    quickLinks: "Enlaces Rápidos",
    followUs: "Síguenos",
    contactUs: "Contáctanos"
  },
  cta: {
    seeMore: "Ver Más",
    contact: "Contactar",
    readMore: "Leer Más",
    viewProfile: "Ver Perfil",
    downloadVCard: "Descargar vCard",
    learnMore: "Saber Más",
    subscribe: "Suscribirse",
    submit: "Enviar",
    back: "Volver",
    next: "Siguiente",
    previous: "Anterior"
  },
  team: {
    title: "Nuestro Equipo",
    partners: "Socios",
    ofCounsel: "Of Counsel",
    counsel: "Consejeros",
    associates: "Asociados",
    allAttorneys: "Todos los Abogados",
    searchPlaceholder: "Buscar abogado...",
    filterByPractice: "Filtrar por Práctica",
    filterByIndustry: "Filtrar por Industria"
  },
  contact: {
    title: "Contacto",
    subtitle: "Estamos para servirle",
    name: "Nombre",
    email: "Correo Electrónico",
    phone: "Teléfono",
    message: "Mensaje",
    send: "Enviar Mensaje",
    success: "Mensaje enviado exitosamente",
    error: "Error al enviar el mensaje"
  },
  news: {
    title: "Noticias",
    subtitle: "Últimas Novedades",
    readMore: "Leer Más",
    allNews: "Todas las Noticias",
    recentNews: "Noticias Recientes"
  },
  events: {
    title: "Eventos",
    subtitle: "Próximos Eventos",
    upcoming: "Próximos",
    past: "Pasados",
    register: "Registrarse",
    details: "Detalles"
  },
  rankings: {
    title: "Rankings",
    subtitle: "Reconocimientos Internacionales",
    description: "Von Wobeser y Sierra ha sido reconocida por las principales publicaciones legales del mundo."
  },
  diversity: {
    title: "Diversidad e Inclusión",
    subtitle: "Nuestro Compromiso",
    description: "Promovemos un ambiente de trabajo diverso e inclusivo donde todos pueden prosperar."
  },
  probono: {
    title: "Pro Bono",
    subtitle: "Responsabilidad Social",
    description: "Brindamos servicios legales gratuitos a quienes más lo necesitan."
  },
  common: {
    loading: "Cargando...",
    error: "Ha ocurrido un error",
    noResults: "No se encontraron resultados",
    search: "Buscar",
    filter: "Filtrar",
    sort: "Ordenar",
    all: "Todos",
    close: "Cerrar",
    open: "Abrir",
    menu: "Menú",
    language: "Idioma",
    selectLanguage: "Seleccionar Idioma",
    mainNav: "Navegación principal",
    mobileNav: "Navegación móvil",
    openSearch: "Abrir búsqueda",
    closeSearch: "Cerrar búsqueda",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    searchPlaceholder: "Buscar...",
    expandSubmenu: "Expandir submenú",
    collapseSubmenu: "Contraer submenú",
    viewAll: "Ver todo",
    searchResults: "Resultados de búsqueda",
    aria: {
      paginationPrev: "Ir a la página anterior",
      paginationNext: "Ir a la página siguiente",
      paginationNav: "paginación",
      paginationMorePages: "Más páginas",
      carouselPrev: "Diapositiva anterior",
      carouselNext: "Diapositiva siguiente",
      carouselRegion: "carrusel",
      carouselSlide: "diapositiva",
      sidebarToggle: "Alternar barra lateral",
      sidebarMobile: "Muestra la barra lateral móvil"
    }
  }
};

const enCommon = {
  nav: {
    ourFirm: "Our Firm",
    attorneys: "Attorneys",
    capabilities: "Capabilities",
    publications: "Publications",
    career: "Career at VWyS",
    contact: "Contact",
    probono: "Pro Bono",
    diversity: "Diversity & Inclusion",
    partners: "Partners",
    ofCounsel: "Of Counsel",
    counsel: "Counsel",
    associates: "Associates",
    practices: "Practices",
    industryGroups: "Industry Groups",
    desk: "German Desk",
    news: "News",
    articles: "Articles",
    newsletter: "Newsletter",
    interns: "Interns",
    home: "Home",
    about: "About",
    rankings: "Rankings",
    offices: "Offices",
    events: "Events",
    experience: "Experience",
    terms: "Terms",
    privacy: "Privacy"
  },
  home: {
    heroTagline: "WE GO WHERE CLIENTS NEED US",
    seeMore: "See More",
    experienceBanner: "Von Wobeser y Sierra, S.C. has more than three decades of experience",
    teamStats: "Team of more than 150 lawyers (22 partners, 6 of counsel, 12 counsel...)",
    recognitionsTitle: "RECOGNITIONS",
    recognitionsIntro: "Von Wobeser y Sierra, S.C. has been recognized on an international level by various institutions including",
    welcomeTitle: "Welcome",
    welcomeSubtitle: "A Leading Firm in Mexico"
  },
  practices: {
    title: "Practices",
    subtitle: "18 Specialized Disciplines"
  },
  industries: {
    title: "Industry Groups",
    subtitle: "Specialized Sectors"
  },
  germanDesk: {
    title: "German Desk",
    description: "For more than 34 years, Von Wobeser y Sierra has worked with German companies, providing comprehensive legal advice in Mexico.",
    subtitle: "Specialists in German investments in Mexico"
  },
  about: {
    title: "About Us",
    vision: "Vision",
    mission: "Mission",
    values: "Values",
    integrity: "Integrity",
    excellence: "Excellence",
    commitment: "Commitment",
    agility: "Agility",
    diversityValue: "Diversity"
  },
  footer: {
    address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX",
    privacyNotice: "Privacy Notice",
    copyright: "© 2025 Von Wobeser y Sierra, S.C. All rights reserved.",
    termsOfUse: "Terms of Use",
    quickLinks: "Quick Links",
    followUs: "Follow Us",
    contactUs: "Contact Us"
  },
  cta: {
    seeMore: "See More",
    contact: "Contact",
    readMore: "Read More",
    viewProfile: "View Profile",
    downloadVCard: "Download vCard",
    learnMore: "Learn More",
    subscribe: "Subscribe",
    submit: "Submit",
    back: "Back",
    next: "Next",
    previous: "Previous"
  },
  team: {
    title: "Our Team",
    partners: "Partners",
    ofCounsel: "Of Counsel",
    counsel: "Counsel",
    associates: "Associates",
    allAttorneys: "All Attorneys",
    searchPlaceholder: "Search attorney...",
    filterByPractice: "Filter by Practice",
    filterByIndustry: "Filter by Industry"
  },
  contact: {
    title: "Contact",
    subtitle: "We are here to serve you",
    name: "Name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    send: "Send Message",
    success: "Message sent successfully",
    error: "Error sending message"
  },
  news: {
    title: "News",
    subtitle: "Latest Updates",
    readMore: "Read More",
    allNews: "All News",
    recentNews: "Recent News"
  },
  events: {
    title: "Events",
    subtitle: "Upcoming Events",
    upcoming: "Upcoming",
    past: "Past",
    register: "Register",
    details: "Details"
  },
  rankings: {
    title: "Rankings",
    subtitle: "International Recognition",
    description: "Von Wobeser y Sierra has been recognized by the world's leading legal publications."
  },
  diversity: {
    title: "Diversity & Inclusion",
    subtitle: "Our Commitment",
    description: "We promote a diverse and inclusive work environment where everyone can thrive."
  },
  probono: {
    title: "Pro Bono",
    subtitle: "Social Responsibility",
    description: "We provide free legal services to those who need them most."
  },
  common: {
    loading: "Loading...",
    error: "An error has occurred",
    noResults: "No results found",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    all: "All",
    close: "Close",
    open: "Open",
    menu: "Menu",
    language: "Language",
    selectLanguage: "Select Language",
    mainNav: "Main navigation",
    mobileNav: "Mobile navigation",
    openSearch: "Open search",
    closeSearch: "Close search",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    searchPlaceholder: "Search...",
    expandSubmenu: "Expand submenu",
    collapseSubmenu: "Collapse submenu",
    viewAll: "View all",
    searchResults: "Search results",
    aria: {
      paginationPrev: "Go to previous page",
      paginationNext: "Go to next page",
      paginationNav: "pagination",
      paginationMorePages: "More pages",
      carouselPrev: "Previous slide",
      carouselNext: "Next slide",
      carouselRegion: "carousel",
      carouselSlide: "slide",
      sidebarToggle: "Toggle Sidebar",
      sidebarMobile: "Displays the mobile sidebar"
    }
  }
};

const resources = {
  es: { translation: esCommon },
  en: { translation: enCommon }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['en', 'es'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'vwb_language',
      caches: ['localStorage']
    }
  });

export default i18n;
