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
    subtitle: "Áreas de Especialización"
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
    subtitle: "Areas of Expertise"
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
      sidebarToggle: "Toggle Sidebar",
      sidebarMobile: "Displays the mobile sidebar"
    }
  }
};

const deCommon = {
  nav: {
    ourFirm: "Unsere Kanzlei",
    attorneys: "Anwälte",
    capabilities: "Kompetenzen",
    publications: "Publikationen",
    career: "Karriere bei VWyS",
    contact: "Kontakt",
    probono: "Pro Bono",
    diversity: "Vielfalt & Inklusion",
    partners: "Partner",
    ofCounsel: "Of Counsel",
    counsel: "Counsel",
    associates: "Associates",
    practices: "Praxisbereiche",
    industryGroups: "Branchengruppen",
    desk: "German Desk",
    news: "Nachrichten",
    articles: "Artikel",
    newsletter: "Newsletter",
    interns: "Praktikanten",
    home: "Startseite",
    about: "Über uns",
    rankings: "Rankings",
    offices: "Büros",
    events: "Veranstaltungen",
    experience: "Erfahrung",
    terms: "AGB",
    privacy: "Datenschutz"
  },
  home: {
    heroTagline: "WIR GEHEN DORTHIN, WO UNSERE MANDANTEN UNS BRAUCHEN",
    seeMore: "Mehr erfahren",
    experienceBanner: "Von Wobeser y Sierra, S.C. verfügt über mehr als drei Jahrzehnte Erfahrung",
    teamStats: "Team von mehr als 150 Anwälten (22 Partner, 6 Of Counsel, 12 Counsel...)",
    recognitionsTitle: "ANERKENNUNGEN",
    recognitionsIntro: "Von Wobeser y Sierra, S.C. wurde international von verschiedenen Institutionen anerkannt, darunter",
    welcomeTitle: "Willkommen",
    welcomeSubtitle: "Eine führende Kanzlei in Mexiko"
  },
  practices: { title: "Praxisbereiche", subtitle: "Fachgebiete" },
  industries: { title: "Branchengruppen", subtitle: "Spezialisierte Sektoren" },
  germanDesk: { title: "German Desk", description: "Seit mehr als 34 Jahren arbeitet Von Wobeser y Sierra mit deutschen Unternehmen zusammen und bietet umfassende Rechtsberatung in Mexiko.", subtitle: "Spezialisten für deutsche Investitionen in Mexiko" },
  about: { title: "Über uns", vision: "Vision", mission: "Mission", values: "Werte", integrity: "Integrität", excellence: "Exzellenz", commitment: "Engagement", agility: "Agilität", diversityValue: "Vielfalt" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "Datenschutzhinweis", copyright: "© 2025 Von Wobeser y Sierra, S.C. Alle Rechte vorbehalten.", termsOfUse: "Nutzungsbedingungen", quickLinks: "Schnellzugriff", followUs: "Folgen Sie uns", contactUs: "Kontaktieren Sie uns" },
  cta: { seeMore: "Mehr erfahren", contact: "Kontakt", readMore: "Weiterlesen", viewProfile: "Profil anzeigen", downloadVCard: "vCard herunterladen", learnMore: "Mehr erfahren", subscribe: "Abonnieren", submit: "Absenden", back: "Zurück", next: "Weiter", previous: "Vorherige" },
  team: { title: "Unser Team", partners: "Partner", ofCounsel: "Of Counsel", counsel: "Counsel", associates: "Associates", allAttorneys: "Alle Anwälte", searchPlaceholder: "Anwalt suchen...", filterByPractice: "Nach Praxisbereich filtern", filterByIndustry: "Nach Branche filtern" },
  contact: { title: "Kontakt", subtitle: "Wir sind für Sie da", name: "Name", email: "E-Mail", phone: "Telefon", message: "Nachricht", send: "Nachricht senden", success: "Nachricht erfolgreich gesendet", error: "Fehler beim Senden der Nachricht" },
  news: { title: "Nachrichten", subtitle: "Aktuelle Meldungen", readMore: "Weiterlesen", allNews: "Alle Nachrichten", recentNews: "Aktuelle Nachrichten" },
  events: { title: "Veranstaltungen", subtitle: "Kommende Veranstaltungen", upcoming: "Kommende", past: "Vergangene", register: "Anmelden", details: "Details" },
  rankings: { title: "Rankings", subtitle: "Internationale Anerkennung", description: "Von Wobeser y Sierra wurde von den weltweit führenden Rechtspublikationen anerkannt." },
  diversity: { title: "Vielfalt & Inklusion", subtitle: "Unser Engagement", description: "Wir fördern ein vielfältiges und inklusives Arbeitsumfeld, in dem alle gedeihen können." },
  probono: { title: "Pro Bono", subtitle: "Soziale Verantwortung", description: "Wir bieten kostenlose Rechtsdienstleistungen für diejenigen, die sie am meisten brauchen." },
  common: { loading: "Laden...", error: "Ein Fehler ist aufgetreten", noResults: "Keine Ergebnisse gefunden", search: "Suchen", filter: "Filtern", sort: "Sortieren", all: "Alle", close: "Schließen", open: "Öffnen", menu: "Menü", language: "Sprache", selectLanguage: "Sprache auswählen", mainNav: "Hauptnavigation", mobileNav: "Mobile Navigation", openSearch: "Suche öffnen", closeSearch: "Suche schließen", openMenu: "Menü öffnen", closeMenu: "Menü schließen", searchPlaceholder: "Suchen...", expandSubmenu: "Untermenü erweitern", collapseSubmenu: "Untermenü reduzieren", viewAll: "Alle anzeigen", searchResults: "Suchergebnisse", aria: { paginationPrev: "Zur vorherigen Seite", paginationNext: "Zur nächsten Seite", paginationNav: "Seitennavigation", paginationMorePages: "Weitere Seiten", carouselPrev: "Vorherige Folie", carouselNext: "Nächste Folie", sidebarToggle: "Seitenleiste umschalten", sidebarMobile: "Zeigt die mobile Seitenleiste an" } }
};

const zhCommon = {
  nav: { ourFirm: "我们的律所", attorneys: "律师", capabilities: "业务能力", publications: "出版物", career: "加入VWyS", contact: "联系我们", probono: "公益服务", diversity: "多元与包容", partners: "合伙人", ofCounsel: "顾问律师", counsel: "法律顾问", associates: "律师助理", practices: "业务领域", industryGroups: "行业组", desk: "德国业务部", news: "新闻", articles: "文章", newsletter: "通讯", interns: "实习生", home: "首页", about: "关于我们", rankings: "排名", offices: "办公室", events: "活动", experience: "经验", terms: "条款", privacy: "隐私" },
  home: { heroTagline: "我们去客户需要我们的地方", seeMore: "查看更多", experienceBanner: "Von Wobeser y Sierra, S.C. 拥有超过三十年的经验", teamStats: "超过150名律师的团队（22名合伙人，6名顾问律师，12名法律顾问...）", recognitionsTitle: "荣誉认可", recognitionsIntro: "Von Wobeser y Sierra, S.C. 获得了众多国际机构的认可，包括", welcomeTitle: "欢迎", welcomeSubtitle: "墨西哥领先律所" },
  practices: { title: "业务领域", subtitle: "专业领域" },
  industries: { title: "行业组", subtitle: "专业领域" },
  germanDesk: { title: "德国业务部", description: "34年来，Von Wobeser y Sierra 一直与德国企业合作，在墨西哥提供全面的法律咨询。", subtitle: "德国在墨投资专家" },
  about: { title: "关于我们", vision: "愿景", mission: "使命", values: "价值观", integrity: "诚信", excellence: "卓越", commitment: "承诺", agility: "敏捷", diversityValue: "多元" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "隐私声明", copyright: "© 2025 Von Wobeser y Sierra, S.C. 版权所有。", termsOfUse: "使用条款", quickLinks: "快速链接", followUs: "关注我们", contactUs: "联系我们" },
  cta: { seeMore: "查看更多", contact: "联系", readMore: "阅读更多", viewProfile: "查看简介", downloadVCard: "下载名片", learnMore: "了解更多", subscribe: "订阅", submit: "提交", back: "返回", next: "下一步", previous: "上一步" },
  team: { title: "我们的团队", partners: "合伙人", ofCounsel: "顾问律师", counsel: "法律顾问", associates: "律师助理", allAttorneys: "所有律师", searchPlaceholder: "搜索律师...", filterByPractice: "按业务领域筛选", filterByIndustry: "按行业筛选" },
  contact: { title: "联系我们", subtitle: "我们随时为您服务", name: "姓名", email: "电子邮件", phone: "电话", message: "留言", send: "发送消息", success: "消息发送成功", error: "发送消息时出错" },
  news: { title: "新闻", subtitle: "最新动态", readMore: "阅读更多", allNews: "所有新闻", recentNews: "最新新闻" },
  events: { title: "活动", subtitle: "即将举行的活动", upcoming: "即将举行", past: "已结束", register: "注册", details: "详情" },
  rankings: { title: "排名", subtitle: "国际认可", description: "Von Wobeser y Sierra 获得了世界领先法律出版物的认可。" },
  diversity: { title: "多元与包容", subtitle: "我们的承诺", description: "我们倡导多元包容的工作环境，让每个人都能蓬勃发展。" },
  probono: { title: "公益服务", subtitle: "社会责任", description: "我们为最需要帮助的人提供免费法律服务。" },
  common: { loading: "加载中...", error: "发生错误", noResults: "未找到结果", search: "搜索", filter: "筛选", sort: "排序", all: "全部", close: "关闭", open: "打开", menu: "菜单", language: "语言", selectLanguage: "选择语言", mainNav: "主导航", mobileNav: "移动导航", openSearch: "打开搜索", closeSearch: "关闭搜索", openMenu: "打开菜单", closeMenu: "关闭菜单", searchPlaceholder: "搜索...", expandSubmenu: "展开子菜单", collapseSubmenu: "收起子菜单", viewAll: "查看全部", searchResults: "搜索结果", aria: { paginationPrev: "转到上一页", paginationNext: "转到下一页", paginationNav: "分页", paginationMorePages: "更多页面", carouselPrev: "上一张幻灯片", carouselNext: "下一张幻灯片", sidebarToggle: "切换侧边栏", sidebarMobile: "显示移动端侧边栏" } }
};

const koCommon = {
  nav: { ourFirm: "우리 회사", attorneys: "변호사", capabilities: "역량", publications: "출판물", career: "VWyS 채용", contact: "연락처", probono: "프로보노", diversity: "다양성과 포용성", partners: "파트너", ofCounsel: "고문 변호사", counsel: "법률 고문", associates: "어소시에이트", practices: "업무 분야", industryGroups: "산업 그룹", desk: "German Desk", news: "뉴스", articles: "기사", newsletter: "뉴스레터", interns: "인턴", home: "홈", about: "소개", rankings: "순위", offices: "사무소", events: "이벤트", experience: "경험", terms: "약관", privacy: "개인정보" },
  home: { heroTagline: "고객이 필요한 곳으로 갑니다", seeMore: "더 보기", experienceBanner: "Von Wobeser y Sierra, S.C.는 30년 이상의 경험을 보유하고 있습니다", teamStats: "150명 이상의 변호사 팀 (22명의 파트너, 6명의 고문 변호사, 12명의 법률 고문...)", recognitionsTitle: "수상 및 인정", recognitionsIntro: "Von Wobeser y Sierra, S.C.는 다음을 포함한 다양한 국제 기관으로부터 인정받았습니다", welcomeTitle: "환영합니다", welcomeSubtitle: "멕시코 최고의 로펌" },
  practices: { title: "업무 분야", subtitle: "전문 분야" },
  industries: { title: "산업 그룹", subtitle: "전문 분야" },
  germanDesk: { title: "German Desk", description: "34년 이상 Von Wobeser y Sierra는 독일 기업들과 협력하여 멕시코에서 종합적인 법률 자문을 제공해 왔습니다.", subtitle: "멕시코 독일 투자 전문가" },
  about: { title: "소개", vision: "비전", mission: "미션", values: "가치", integrity: "성실", excellence: "탁월함", commitment: "헌신", agility: "민첩성", diversityValue: "다양성" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "개인정보 처리방침", copyright: "© 2025 Von Wobeser y Sierra, S.C. 모든 권리 보유.", termsOfUse: "이용 약관", quickLinks: "빠른 링크", followUs: "팔로우", contactUs: "문의하기" },
  cta: { seeMore: "더 보기", contact: "연락", readMore: "더 읽기", viewProfile: "프로필 보기", downloadVCard: "vCard 다운로드", learnMore: "자세히 알아보기", subscribe: "구독", submit: "제출", back: "뒤로", next: "다음", previous: "이전" },
  team: { title: "우리 팀", partners: "파트너", ofCounsel: "고문 변호사", counsel: "법률 고문", associates: "어소시에이트", allAttorneys: "모든 변호사", searchPlaceholder: "변호사 검색...", filterByPractice: "업무 분야별 필터", filterByIndustry: "산업별 필터" },
  contact: { title: "연락처", subtitle: "언제든지 도와드리겠습니다", name: "이름", email: "이메일", phone: "전화", message: "메시지", send: "메시지 보내기", success: "메시지가 성공적으로 전송되었습니다", error: "메시지 전송 중 오류 발생" },
  news: { title: "뉴스", subtitle: "최신 소식", readMore: "더 읽기", allNews: "모든 뉴스", recentNews: "최근 뉴스" },
  events: { title: "이벤트", subtitle: "예정된 이벤트", upcoming: "예정", past: "지난", register: "등록", details: "상세" },
  rankings: { title: "순위", subtitle: "국제적 인정", description: "Von Wobeser y Sierra는 세계 유수의 법률 출판물에서 인정받았습니다." },
  diversity: { title: "다양성과 포용성", subtitle: "우리의 약속", description: "모든 사람이 성장할 수 있는 다양하고 포용적인 업무 환경을 조성합니다." },
  probono: { title: "프로보노", subtitle: "사회적 책임", description: "가장 필요한 사람들에게 무료 법률 서비스를 제공합니다." },
  common: { loading: "로딩 중...", error: "오류가 발생했습니다", noResults: "결과를 찾을 수 없습니다", search: "검색", filter: "필터", sort: "정렬", all: "전체", close: "닫기", open: "열기", menu: "메뉴", language: "언어", selectLanguage: "언어 선택", mainNav: "주 탐색", mobileNav: "모바일 탐색", openSearch: "검색 열기", closeSearch: "검색 닫기", openMenu: "메뉴 열기", closeMenu: "메뉴 닫기", searchPlaceholder: "검색...", expandSubmenu: "하위 메뉴 펼치기", collapseSubmenu: "하위 메뉴 접기", viewAll: "모두 보기", searchResults: "검색 결과", aria: { paginationPrev: "이전 페이지로 이동", paginationNext: "다음 페이지로 이동", paginationNav: "페이지 탐색", paginationMorePages: "더 많은 페이지", carouselPrev: "이전 슬라이드", carouselNext: "다음 슬라이드", sidebarToggle: "사이드바 전환", sidebarMobile: "모바일 사이드바 표시" } }
};

const jaCommon = {
  nav: { ourFirm: "当事務所について", attorneys: "弁護士", capabilities: "業務内容", publications: "出版物", career: "採用情報", contact: "お問い合わせ", probono: "プロボノ", diversity: "ダイバーシティ＆インクルージョン", partners: "パートナー", ofCounsel: "オブカウンセル", counsel: "カウンセル", associates: "アソシエイト", practices: "取扱分野", industryGroups: "産業グループ", desk: "German Desk", news: "ニュース", articles: "記事", newsletter: "ニュースレター", interns: "インターン", home: "ホーム", about: "概要", rankings: "ランキング", offices: "オフィス", events: "イベント", experience: "経験", terms: "利用規約", privacy: "プライバシー" },
  home: { heroTagline: "クライアントが必要とする場所へ", seeMore: "詳細を見る", experienceBanner: "Von Wobeser y Sierra, S.C.は30年以上の経験を持っています", teamStats: "150名以上の弁護士チーム（パートナー22名、オブカウンセル6名、カウンセル12名...）", recognitionsTitle: "受賞・評価", recognitionsIntro: "Von Wobeser y Sierra, S.C.は以下を含む様々な国際機関から評価されています", welcomeTitle: "ようこそ", welcomeSubtitle: "メキシコのリーディングファーム" },
  practices: { title: "取扱分野", subtitle: "専門分野" },
  industries: { title: "産業グループ", subtitle: "専門セクター" },
  germanDesk: { title: "German Desk", description: "34年以上にわたり、Von Wobeser y Sierraはドイツ企業と協力し、メキシコで包括的な法的アドバイスを提供してきました。", subtitle: "メキシコへのドイツ投資の専門家" },
  about: { title: "概要", vision: "ビジョン", mission: "ミッション", values: "価値観", integrity: "誠実さ", excellence: "卓越性", commitment: "コミットメント", agility: "機敏性", diversityValue: "多様性" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "プライバシーポリシー", copyright: "© 2025 Von Wobeser y Sierra, S.C. 無断複写・転載を禁じます。", termsOfUse: "利用規約", quickLinks: "クイックリンク", followUs: "フォロー", contactUs: "お問い合わせ" },
  cta: { seeMore: "詳細を見る", contact: "連絡", readMore: "続きを読む", viewProfile: "プロフィールを見る", downloadVCard: "vCardをダウンロード", learnMore: "詳しく見る", subscribe: "購読", submit: "送信", back: "戻る", next: "次へ", previous: "前へ" },
  team: { title: "チーム", partners: "パートナー", ofCounsel: "オブカウンセル", counsel: "カウンセル", associates: "アソシエイト", allAttorneys: "全弁護士", searchPlaceholder: "弁護士を検索...", filterByPractice: "取扱分野で絞り込み", filterByIndustry: "産業で絞り込み" },
  contact: { title: "お問い合わせ", subtitle: "お気軽にご連絡ください", name: "お名前", email: "メールアドレス", phone: "電話番号", message: "メッセージ", send: "メッセージを送信", success: "メッセージが正常に送信されました", error: "メッセージの送信中にエラーが発生しました" },
  news: { title: "ニュース", subtitle: "最新情報", readMore: "続きを読む", allNews: "すべてのニュース", recentNews: "最新ニュース" },
  events: { title: "イベント", subtitle: "今後のイベント", upcoming: "今後", past: "過去", register: "登録", details: "詳細" },
  rankings: { title: "ランキング", subtitle: "国際的評価", description: "Von Wobeser y Sierraは世界の主要な法律出版物から評価されています。" },
  diversity: { title: "ダイバーシティ＆インクルージョン", subtitle: "私たちのコミットメント", description: "すべての人が活躍できる多様で包括的な職場環境を推進しています。" },
  probono: { title: "プロボノ", subtitle: "社会的責任", description: "最も必要としている方々に無料の法的サービスを提供しています。" },
  common: { loading: "読み込み中...", error: "エラーが発生しました", noResults: "結果が見つかりません", search: "検索", filter: "フィルター", sort: "並べ替え", all: "すべて", close: "閉じる", open: "開く", menu: "メニュー", language: "言語", selectLanguage: "言語を選択", mainNav: "メインナビゲーション", mobileNav: "モバイルナビゲーション", openSearch: "検索を開く", closeSearch: "検索を閉じる", openMenu: "メニューを開く", closeMenu: "メニューを閉じる", searchPlaceholder: "検索...", expandSubmenu: "サブメニューを展開", collapseSubmenu: "サブメニューを折りたたむ", viewAll: "すべて表示", searchResults: "検索結果", aria: { paginationPrev: "前のページへ", paginationNext: "次のページへ", paginationNav: "ページネーション", paginationMorePages: "他のページ", carouselPrev: "前のスライド", carouselNext: "次のスライド", sidebarToggle: "サイドバーを切り替える", sidebarMobile: "モバイルサイドバーを表示" } }
};

const arCommon = {
  nav: { ourFirm: "شركتنا", attorneys: "المحامون", capabilities: "الخدمات", publications: "المنشورات", career: "الوظائف في VWyS", contact: "اتصل بنا", probono: "خدمات مجانية", diversity: "التنوع والشمول", partners: "الشركاء", ofCounsel: "مستشار قانوني", counsel: "مستشار", associates: "محامون مساعدون", practices: "مجالات الممارسة", industryGroups: "مجموعات الصناعة", desk: "المكتب الألماني", news: "الأخبار", articles: "المقالات", newsletter: "النشرة الإخبارية", interns: "المتدربون", home: "الرئيسية", about: "من نحن", rankings: "التصنيفات", offices: "المكاتب", events: "الفعاليات", experience: "الخبرة", terms: "الشروط", privacy: "الخصوصية" },
  home: { heroTagline: "نذهب حيث يحتاجنا عملاؤنا", seeMore: "شاهد المزيد", experienceBanner: "تمتلك Von Wobeser y Sierra, S.C. أكثر من ثلاثة عقود من الخبرة", teamStats: "فريق من أكثر من 150 محامياً (22 شريكاً، 6 مستشارين قانونيين، 12 مستشاراً...)", recognitionsTitle: "التقديرات", recognitionsIntro: "حصلت Von Wobeser y Sierra, S.C. على اعتراف دولي من مؤسسات مختلفة بما في ذلك", welcomeTitle: "مرحباً بكم", welcomeSubtitle: "شركة رائدة في المكسيك" },
  practices: { title: "مجالات الممارسة", subtitle: "مجالات التخصص" },
  industries: { title: "مجموعات الصناعة", subtitle: "القطاعات المتخصصة" },
  germanDesk: { title: "المكتب الألماني", description: "لأكثر من 34 عاماً، عملت Von Wobeser y Sierra مع الشركات الألمانية، وتقدم استشارات قانونية شاملة في المكسيك.", subtitle: "متخصصون في الاستثمارات الألمانية في المكسيك" },
  about: { title: "من نحن", vision: "الرؤية", mission: "المهمة", values: "القيم", integrity: "النزاهة", excellence: "التميز", commitment: "الالتزام", agility: "المرونة", diversityValue: "التنوع" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "إشعار الخصوصية", copyright: "© 2025 Von Wobeser y Sierra, S.C. جميع الحقوق محفوظة.", termsOfUse: "شروط الاستخدام", quickLinks: "روابط سريعة", followUs: "تابعنا", contactUs: "اتصل بنا" },
  cta: { seeMore: "شاهد المزيد", contact: "اتصل", readMore: "اقرأ المزيد", viewProfile: "عرض الملف الشخصي", downloadVCard: "تحميل vCard", learnMore: "اعرف المزيد", subscribe: "اشترك", submit: "إرسال", back: "رجوع", next: "التالي", previous: "السابق" },
  team: { title: "فريقنا", partners: "الشركاء", ofCounsel: "مستشار قانوني", counsel: "مستشار", associates: "محامون مساعدون", allAttorneys: "جميع المحامين", searchPlaceholder: "البحث عن محامٍ...", filterByPractice: "تصفية حسب الممارسة", filterByIndustry: "تصفية حسب الصناعة" },
  contact: { title: "اتصل بنا", subtitle: "نحن هنا لخدمتكم", name: "الاسم", email: "البريد الإلكتروني", phone: "الهاتف", message: "الرسالة", send: "إرسال الرسالة", success: "تم إرسال الرسالة بنجاح", error: "خطأ في إرسال الرسالة" },
  news: { title: "الأخبار", subtitle: "آخر التحديثات", readMore: "اقرأ المزيد", allNews: "جميع الأخبار", recentNews: "أحدث الأخبار" },
  events: { title: "الفعاليات", subtitle: "الفعاليات القادمة", upcoming: "القادمة", past: "السابقة", register: "سجل", details: "التفاصيل" },
  rankings: { title: "التصنيفات", subtitle: "الاعتراف الدولي", description: "حصلت Von Wobeser y Sierra على اعتراف من أبرز المنشورات القانونية في العالم." },
  diversity: { title: "التنوع والشمول", subtitle: "التزامنا", description: "نعزز بيئة عمل متنوعة وشاملة حيث يمكن للجميع الازدهار." },
  probono: { title: "خدمات مجانية", subtitle: "المسؤولية الاجتماعية", description: "نقدم خدمات قانونية مجانية لمن هم في أمس الحاجة إليها." },
  common: { loading: "جاري التحميل...", error: "حدث خطأ", noResults: "لم يتم العثور على نتائج", search: "بحث", filter: "تصفية", sort: "ترتيب", all: "الكل", close: "إغلاق", open: "فتح", menu: "القائمة", language: "اللغة", selectLanguage: "اختر اللغة", mainNav: "التنقل الرئيسي", mobileNav: "التنقل المحمول", openSearch: "فتح البحث", closeSearch: "إغلاق البحث", openMenu: "فتح القائمة", closeMenu: "إغلاق القائمة", searchPlaceholder: "بحث...", expandSubmenu: "توسيع القائمة الفرعية", collapseSubmenu: "طي القائمة الفرعية", viewAll: "عرض الكل", searchResults: "نتائج البحث", aria: { paginationPrev: "الانتقال إلى الصفحة السابقة", paginationNext: "الانتقال إلى الصفحة التالية", paginationNav: "ترقيم الصفحات", paginationMorePages: "مزيد من الصفحات", carouselPrev: "الشريحة السابقة", carouselNext: "الشريحة التالية", sidebarToggle: "تبديل الشريط الجانبي", sidebarMobile: "يعرض الشريط الجانبي للجوال" } }
};

const ruCommon = {
  nav: { ourFirm: "О компании", attorneys: "Юристы", capabilities: "Услуги", publications: "Публикации", career: "Карьера в VWyS", contact: "Контакты", probono: "Pro Bono", diversity: "Многообразие и инклюзивность", partners: "Партнёры", ofCounsel: "Of Counsel", counsel: "Консультанты", associates: "Ассоциаты", practices: "Практики", industryGroups: "Отраслевые группы", desk: "German Desk", news: "Новости", articles: "Статьи", newsletter: "Рассылка", interns: "Стажёры", home: "Главная", about: "О нас", rankings: "Рейтинги", offices: "Офисы", events: "Мероприятия", experience: "Опыт", terms: "Условия", privacy: "Конфиденциальность" },
  home: { heroTagline: "МЫ ИДЁМ ТУДА, ГДЕ НУЖНЫ НАШИМ КЛИЕНТАМ", seeMore: "Подробнее", experienceBanner: "Von Wobeser y Sierra, S.C. имеет более чем тридцатилетний опыт", teamStats: "Команда из более чем 150 юристов (22 партнёра, 6 of counsel, 12 консультантов...)", recognitionsTitle: "ПРИЗНАНИЕ", recognitionsIntro: "Von Wobeser y Sierra, S.C. получила международное признание от различных организаций, включая", welcomeTitle: "Добро пожаловать", welcomeSubtitle: "Ведущая фирма в Мексике" },
  practices: { title: "Практики", subtitle: "Области специализации" },
  industries: { title: "Отраслевые группы", subtitle: "Специализированные секторы" },
  germanDesk: { title: "German Desk", description: "Более 34 лет Von Wobeser y Sierra работает с немецкими компаниями, предоставляя комплексные юридические консультации в Мексике.", subtitle: "Специалисты по немецким инвестициям в Мексике" },
  about: { title: "О нас", vision: "Видение", mission: "Миссия", values: "Ценности", integrity: "Честность", excellence: "Превосходство", commitment: "Приверженность", agility: "Гибкость", diversityValue: "Многообразие" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "Политика конфиденциальности", copyright: "© 2025 Von Wobeser y Sierra, S.C. Все права защищены.", termsOfUse: "Условия использования", quickLinks: "Быстрые ссылки", followUs: "Подписывайтесь", contactUs: "Связаться с нами" },
  cta: { seeMore: "Подробнее", contact: "Связаться", readMore: "Читать далее", viewProfile: "Просмотреть профиль", downloadVCard: "Скачать vCard", learnMore: "Узнать больше", subscribe: "Подписаться", submit: "Отправить", back: "Назад", next: "Далее", previous: "Предыдущий" },
  team: { title: "Наша команда", partners: "Партнёры", ofCounsel: "Of Counsel", counsel: "Консультанты", associates: "Ассоциаты", allAttorneys: "Все юристы", searchPlaceholder: "Поиск юриста...", filterByPractice: "Фильтр по практике", filterByIndustry: "Фильтр по отрасли" },
  contact: { title: "Контакты", subtitle: "Мы готовы помочь", name: "Имя", email: "Электронная почта", phone: "Телефон", message: "Сообщение", send: "Отправить сообщение", success: "Сообщение успешно отправлено", error: "Ошибка при отправке сообщения" },
  news: { title: "Новости", subtitle: "Последние обновления", readMore: "Читать далее", allNews: "Все новости", recentNews: "Последние новости" },
  events: { title: "Мероприятия", subtitle: "Предстоящие мероприятия", upcoming: "Предстоящие", past: "Прошедшие", register: "Регистрация", details: "Подробности" },
  rankings: { title: "Рейтинги", subtitle: "Международное признание", description: "Von Wobeser y Sierra признана ведущими юридическими изданиями мира." },
  diversity: { title: "Многообразие и инклюзивность", subtitle: "Наша приверженность", description: "Мы создаём разнообразную и инклюзивную рабочую среду, где каждый может развиваться." },
  probono: { title: "Pro Bono", subtitle: "Социальная ответственность", description: "Мы предоставляем бесплатные юридические услуги тем, кто больше всего в них нуждается." },
  common: { loading: "Загрузка...", error: "Произошла ошибка", noResults: "Результаты не найдены", search: "Поиск", filter: "Фильтр", sort: "Сортировка", all: "Все", close: "Закрыть", open: "Открыть", menu: "Меню", language: "Язык", selectLanguage: "Выберите язык", mainNav: "Основная навигация", mobileNav: "Мобильная навигация", openSearch: "Открыть поиск", closeSearch: "Закрыть поиск", openMenu: "Открыть меню", closeMenu: "Закрыть меню", searchPlaceholder: "Поиск...", expandSubmenu: "Развернуть подменю", collapseSubmenu: "Свернуть подменю", viewAll: "Показать все", searchResults: "Результаты поиска", aria: { paginationPrev: "Перейти на предыдущую страницу", paginationNext: "Перейти на следующую страницу", paginationNav: "пагинация", paginationMorePages: "Другие страницы", carouselPrev: "Предыдущий слайд", carouselNext: "Следующий слайд", sidebarToggle: "Переключить боковую панель", sidebarMobile: "Показывает мобильную боковую панель" } }
};

const frCommon = {
  nav: { ourFirm: "Notre Cabinet", attorneys: "Avocats", capabilities: "Compétences", publications: "Publications", career: "Carrière chez VWyS", contact: "Contact", probono: "Pro Bono", diversity: "Diversité et Inclusion", partners: "Associés", ofCounsel: "Of Counsel", counsel: "Counsel", associates: "Collaborateurs", practices: "Domaines d'expertise", industryGroups: "Groupes sectoriels", desk: "German Desk", news: "Actualités", articles: "Articles", newsletter: "Newsletter", interns: "Stagiaires", home: "Accueil", about: "À propos", rankings: "Classements", offices: "Bureaux", events: "Événements", experience: "Expérience", terms: "Conditions", privacy: "Confidentialité" },
  home: { heroTagline: "NOUS ALLONS LÀ OÙ NOS CLIENTS ONT BESOIN DE NOUS", seeMore: "En savoir plus", experienceBanner: "Von Wobeser y Sierra, S.C. possède plus de trois décennies d'expérience", teamStats: "Équipe de plus de 150 avocats (22 associés, 6 of counsel, 12 counsel...)", recognitionsTitle: "DISTINCTIONS", recognitionsIntro: "Von Wobeser y Sierra, S.C. a été reconnue au niveau international par diverses institutions, notamment", welcomeTitle: "Bienvenue", welcomeSubtitle: "Un cabinet leader au Mexique" },
  practices: { title: "Domaines d'expertise", subtitle: "Domaines de spécialisation" },
  industries: { title: "Groupes sectoriels", subtitle: "Secteurs spécialisés" },
  germanDesk: { title: "German Desk", description: "Depuis plus de 34 ans, Von Wobeser y Sierra travaille avec des entreprises allemandes, offrant des conseils juridiques complets au Mexique.", subtitle: "Spécialistes des investissements allemands au Mexique" },
  about: { title: "À propos de nous", vision: "Vision", mission: "Mission", values: "Valeurs", integrity: "Intégrité", excellence: "Excellence", commitment: "Engagement", agility: "Agilité", diversityValue: "Diversité" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "Politique de confidentialité", copyright: "© 2025 Von Wobeser y Sierra, S.C. Tous droits réservés.", termsOfUse: "Conditions d'utilisation", quickLinks: "Liens rapides", followUs: "Suivez-nous", contactUs: "Contactez-nous" },
  cta: { seeMore: "En savoir plus", contact: "Contacter", readMore: "Lire la suite", viewProfile: "Voir le profil", downloadVCard: "Télécharger vCard", learnMore: "En savoir plus", subscribe: "S'abonner", submit: "Envoyer", back: "Retour", next: "Suivant", previous: "Précédent" },
  team: { title: "Notre équipe", partners: "Associés", ofCounsel: "Of Counsel", counsel: "Counsel", associates: "Collaborateurs", allAttorneys: "Tous les avocats", searchPlaceholder: "Rechercher un avocat...", filterByPractice: "Filtrer par expertise", filterByIndustry: "Filtrer par secteur" },
  contact: { title: "Contact", subtitle: "Nous sommes à votre service", name: "Nom", email: "E-mail", phone: "Téléphone", message: "Message", send: "Envoyer le message", success: "Message envoyé avec succès", error: "Erreur lors de l'envoi du message" },
  news: { title: "Actualités", subtitle: "Dernières nouvelles", readMore: "Lire la suite", allNews: "Toutes les actualités", recentNews: "Actualités récentes" },
  events: { title: "Événements", subtitle: "Événements à venir", upcoming: "À venir", past: "Passés", register: "S'inscrire", details: "Détails" },
  rankings: { title: "Classements", subtitle: "Reconnaissance internationale", description: "Von Wobeser y Sierra a été reconnue par les principales publications juridiques mondiales." },
  diversity: { title: "Diversité et Inclusion", subtitle: "Notre engagement", description: "Nous promouvons un environnement de travail diversifié et inclusif où chacun peut s'épanouir." },
  probono: { title: "Pro Bono", subtitle: "Responsabilité sociale", description: "Nous fournissons des services juridiques gratuits à ceux qui en ont le plus besoin." },
  common: { loading: "Chargement...", error: "Une erreur s'est produite", noResults: "Aucun résultat trouvé", search: "Rechercher", filter: "Filtrer", sort: "Trier", all: "Tous", close: "Fermer", open: "Ouvrir", menu: "Menu", language: "Langue", selectLanguage: "Sélectionner la langue", mainNav: "Navigation principale", mobileNav: "Navigation mobile", openSearch: "Ouvrir la recherche", closeSearch: "Fermer la recherche", openMenu: "Ouvrir le menu", closeMenu: "Fermer le menu", searchPlaceholder: "Rechercher...", expandSubmenu: "Développer le sous-menu", collapseSubmenu: "Réduire le sous-menu", viewAll: "Voir tout", searchResults: "Résultats de recherche", aria: { paginationPrev: "Aller à la page précédente", paginationNext: "Aller à la page suivante", paginationNav: "pagination", paginationMorePages: "Plus de pages", carouselPrev: "Diapositive précédente", carouselNext: "Diapositive suivante", sidebarToggle: "Basculer la barre latérale", sidebarMobile: "Affiche la barre latérale mobile" } }
};

const itCommon = {
  nav: { ourFirm: "Il Nostro Studio", attorneys: "Avvocati", capabilities: "Competenze", publications: "Pubblicazioni", career: "Carriera in VWyS", contact: "Contatti", probono: "Pro Bono", diversity: "Diversità e Inclusione", partners: "Soci", ofCounsel: "Of Counsel", counsel: "Counsel", associates: "Associati", practices: "Aree di Pratica", industryGroups: "Gruppi Settoriali", desk: "German Desk", news: "Notizie", articles: "Articoli", newsletter: "Newsletter", interns: "Stagisti", home: "Home", about: "Chi Siamo", rankings: "Classifiche", offices: "Uffici", events: "Eventi", experience: "Esperienza", terms: "Termini", privacy: "Privacy" },
  home: { heroTagline: "ANDIAMO DOVE I NOSTRI CLIENTI HANNO BISOGNO DI NOI", seeMore: "Scopri di più", experienceBanner: "Von Wobeser y Sierra, S.C. ha più di tre decenni di esperienza", teamStats: "Team di oltre 150 avvocati (22 soci, 6 of counsel, 12 counsel...)", recognitionsTitle: "RICONOSCIMENTI", recognitionsIntro: "Von Wobeser y Sierra, S.C. è stata riconosciuta a livello internazionale da varie istituzioni tra cui", welcomeTitle: "Benvenuti", welcomeSubtitle: "Uno studio leader in Messico" },
  practices: { title: "Aree di Pratica", subtitle: "Aree di Specializzazione" },
  industries: { title: "Gruppi Settoriali", subtitle: "Settori Specializzati" },
  germanDesk: { title: "German Desk", description: "Da oltre 34 anni, Von Wobeser y Sierra collabora con aziende tedesche, fornendo consulenza legale completa in Messico.", subtitle: "Specialisti in investimenti tedeschi in Messico" },
  about: { title: "Chi Siamo", vision: "Visione", mission: "Missione", values: "Valori", integrity: "Integrità", excellence: "Eccellenza", commitment: "Impegno", agility: "Agilità", diversityValue: "Diversità" },
  footer: { address: "Torre SOMA Chapultepec, Campos Elíseos 204, Polanco, 11560, CDMX", privacyNotice: "Informativa sulla Privacy", copyright: "© 2025 Von Wobeser y Sierra, S.C. Tutti i diritti riservati.", termsOfUse: "Termini di Utilizzo", quickLinks: "Link Rapidi", followUs: "Seguici", contactUs: "Contattaci" },
  cta: { seeMore: "Scopri di più", contact: "Contatta", readMore: "Leggi di più", viewProfile: "Vedi Profilo", downloadVCard: "Scarica vCard", learnMore: "Scopri di più", subscribe: "Iscriviti", submit: "Invia", back: "Indietro", next: "Avanti", previous: "Precedente" },
  team: { title: "Il Nostro Team", partners: "Soci", ofCounsel: "Of Counsel", counsel: "Counsel", associates: "Associati", allAttorneys: "Tutti gli Avvocati", searchPlaceholder: "Cerca avvocato...", filterByPractice: "Filtra per Area", filterByIndustry: "Filtra per Settore" },
  contact: { title: "Contatti", subtitle: "Siamo a vostra disposizione", name: "Nome", email: "Email", phone: "Telefono", message: "Messaggio", send: "Invia Messaggio", success: "Messaggio inviato con successo", error: "Errore nell'invio del messaggio" },
  news: { title: "Notizie", subtitle: "Ultime Novità", readMore: "Leggi di più", allNews: "Tutte le Notizie", recentNews: "Notizie Recenti" },
  events: { title: "Eventi", subtitle: "Prossimi Eventi", upcoming: "Prossimi", past: "Passati", register: "Registrati", details: "Dettagli" },
  rankings: { title: "Classifiche", subtitle: "Riconoscimento Internazionale", description: "Von Wobeser y Sierra è stata riconosciuta dalle principali pubblicazioni legali mondiali." },
  diversity: { title: "Diversità e Inclusione", subtitle: "Il Nostro Impegno", description: "Promuoviamo un ambiente di lavoro diversificato e inclusivo dove tutti possono crescere." },
  probono: { title: "Pro Bono", subtitle: "Responsabilità Sociale", description: "Forniamo servizi legali gratuiti a chi ne ha più bisogno." },
  common: { loading: "Caricamento...", error: "Si è verificato un errore", noResults: "Nessun risultato trovato", search: "Cerca", filter: "Filtra", sort: "Ordina", all: "Tutti", close: "Chiudi", open: "Apri", menu: "Menu", language: "Lingua", selectLanguage: "Seleziona Lingua", mainNav: "Navigazione principale", mobileNav: "Navigazione mobile", openSearch: "Apri ricerca", closeSearch: "Chiudi ricerca", openMenu: "Apri menu", closeMenu: "Chiudi menu", searchPlaceholder: "Cerca...", expandSubmenu: "Espandi sottomenu", collapseSubmenu: "Comprimi sottomenu", viewAll: "Vedi tutto", searchResults: "Risultati della ricerca", aria: { paginationPrev: "Vai alla pagina precedente", paginationNext: "Vai alla pagina successiva", paginationNav: "paginazione", paginationMorePages: "Altre pagine", carouselPrev: "Diapositiva precedente", carouselNext: "Diapositiva successiva", sidebarToggle: "Attiva/disattiva la barra laterale", sidebarMobile: "Mostra la barra laterale mobile" } }
};

const resources = {
  es: { translation: esCommon },
  en: { translation: enCommon },
  de: { translation: deCommon },
  zh: { translation: zhCommon },
  ko: { translation: koCommon },
  ja: { translation: jaCommon },
  ar: { translation: arCommon },
  ru: { translation: ruCommon },
  fr: { translation: frCommon },
  it: { translation: itCommon }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'vwb_language',
      caches: ['localStorage']
    }
  });

export default i18n;
