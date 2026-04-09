import { Link } from "wouter";
import { MapPin, Phone, Mail, Linkedin, ExternalLink, AlertCircle, Building2, Twitter, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent } from "@shared/schema";
import esrLogo from "@assets/image_1764710915519.png";
import footerLogo from "@assets/Recurso_2_1764819007853.png";

export default function Footer() {
  const { language } = useLanguage();
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content: Record<string, {
    firm: string;
    firmLinks: { label: string; href: string; id: string }[];
    capabilities: string;
    capabilitiesLinks: { label: string; href: string; id: string }[];
    resources: string;
    resourcesLinks: { label: string; href: string; id: string }[];
    contact: string;
    building: string;
    street: string;
    city: string;
    phone: string;
    email: string;
    legal: string;
    privacy: string;
    terms: string;
    cookies: string;
    description: string;
    practiceLabel: string;
    industryLabel: string;
    errorMessage: string;
    followUs: string;
    linkedinLabel: string;
    twitterLabel: string;
    websiteLabel: string;
    phoneLabel: string;
    emailLabel: string;
    cookiesLabel: string;
    loadingLabel: string;
    footerLabel: string;
    firmLinksLabel: string;
    capabilitiesLinksLabel: string;
    resourcesLinksLabel: string;
    legalLinksLabel: string;
    esrAlt: string;
  }> = {
    en: {
      firm: "The Firm",
      firmLinks: [
        { label: "About Us", href: "/about", id: "about" },
        { label: "Our Team", href: "/team", id: "people" },
        { label: "Careers", href: "/careers", id: "careers" },
        { label: "Contact", href: "/contact", id: "contact" },
      ],
      capabilities: "Capabilities",
      capabilitiesLinks: [
        { label: "Practice Areas", href: "/practice-groups", id: "practice" },
        { label: "Industry Groups", href: "/industry-groups", id: "industry" },
      ],
      resources: "Resources",
      resourcesLinks: [
        { label: "News & Insights", href: "/news", id: "news" },
        { label: "Rankings", href: "/rankings", id: "rankings" },
      ],
      contact: "Contact",
      building: "Torre SOMA Chapultepec Floor 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Mexico City",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      cookies: "Cookie Preferences",
      description: "Leading law firm in Mexico with over 70 years of experience providing excellent legal services.",
      practiceLabel: "Practice Areas",
      industryLabel: "Industry Groups",
      errorMessage: "Contact information unavailable",
      followUs: "Follow Us",
      linkedinLabel: "Visit Von Wobeser on LinkedIn (opens in new tab)",
      twitterLabel: "Visit Von Wobeser on X/Twitter (opens in new tab)",
      websiteLabel: "Visit Von Wobeser website (opens in new tab)",
      phoneLabel: "Call Von Wobeser",
      emailLabel: "Email Von Wobeser",
      cookiesLabel: "Manage cookie preferences",
      loadingLabel: "Loading contact information",
      footerLabel: "Site footer",
      firmLinksLabel: "Firm links",
      capabilitiesLinksLabel: "Capabilities links",
      resourcesLinksLabel: "Resources links",
      legalLinksLabel: "Legal links",
      esrAlt: "Socially Responsible Company",
    },
    es: {
      firm: "La Firma",
      firmLinks: [
        { label: "Acerca de Nosotros", href: "/about", id: "about" },
        { label: "Nuestro Equipo", href: "/team", id: "people" },
        { label: "Carreras", href: "/careers", id: "careers" },
        { label: "Contacto", href: "/contact", id: "contact" },
      ],
      capabilities: "Capacidades",
      capabilitiesLinks: [
        { label: "Áreas de Práctica", href: "/practice-groups", id: "practice" },
        { label: "Grupos Industriales", href: "/industry-groups", id: "industry" },
      ],
      resources: "Recursos",
      resourcesLinks: [
        { label: "Noticias e Insights", href: "/news", id: "news" },
        { label: "Rankings", href: "/rankings", id: "rankings" },
      ],
      contact: "Contacto",
      building: "Torre SOMA Chapultepec Piso 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Ciudad de México",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. Todos los derechos reservados.",
      privacy: "Política de Privacidad",
      terms: "Términos de Uso",
      cookies: "Preferencias de Cookies",
      description: "Firma de abogados líder en México con más de 70 años de experiencia brindando servicios legales de excelencia.",
      practiceLabel: "Áreas de Práctica",
      industryLabel: "Grupos Industriales",
      errorMessage: "Información de contacto no disponible",
      followUs: "Síguenos",
      linkedinLabel: "Visitar Von Wobeser en LinkedIn (abre en nueva pestaña)",
      twitterLabel: "Visitar Von Wobeser en X/Twitter (abre en nueva pestaña)",
      websiteLabel: "Visitar sitio web de Von Wobeser (abre en nueva pestaña)",
      phoneLabel: "Llamar a Von Wobeser",
      emailLabel: "Enviar correo a Von Wobeser",
      cookiesLabel: "Gestionar preferencias de cookies",
      loadingLabel: "Cargando información de contacto",
      footerLabel: "Pie de página del sitio",
      firmLinksLabel: "Enlaces de la firma",
      capabilitiesLinksLabel: "Enlaces de capacidades",
      resourcesLinksLabel: "Enlaces de recursos",
      legalLinksLabel: "Enlaces legales",
      esrAlt: "Empresa Socialmente Responsable",
    },
    de: {
      firm: "Die Kanzlei",
      firmLinks: [
        { label: "Über uns", href: "/about", id: "about" },
        { label: "Unser Team", href: "/team", id: "people" },
        { label: "Karriere", href: "/careers", id: "careers" },
        { label: "Kontakt", href: "/contact", id: "contact" },
      ],
      capabilities: "Kompetenzen",
      capabilitiesLinks: [
        { label: "Rechtsgebiete", href: "/practice-groups", id: "practice" },
        { label: "Branchengruppen", href: "/industry-groups", id: "industry" },
      ],
      resources: "Ressourcen",
      resourcesLinks: [
        { label: "Neuigkeiten & Einblicke", href: "/news", id: "news" },
        { label: "Rankings", href: "/rankings", id: "rankings" },
      ],
      contact: "Kontakt",
      building: "Torre SOMA Chapultepec Etage 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Mexiko-Stadt",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. Alle Rechte vorbehalten.",
      privacy: "Datenschutzhinweis",
      terms: "Nutzungsbedingungen",
      cookies: "Cookie-Einstellungen",
      description: "Führende Anwaltskanzlei in Mexiko mit über 70 Jahren Erfahrung in der Bereitstellung exzellenter Rechtsdienstleistungen.",
      practiceLabel: "Rechtsgebiete",
      industryLabel: "Branchengruppen",
      errorMessage: "Kontaktinformationen nicht verfügbar",
      followUs: "Folgen Sie uns",
      linkedinLabel: "Von Wobeser auf LinkedIn besuchen (öffnet in neuem Tab)",
      twitterLabel: "Von Wobeser auf X/Twitter besuchen (öffnet in neuem Tab)",
      websiteLabel: "Von Wobeser Website besuchen (öffnet in neuem Tab)",
      phoneLabel: "Von Wobeser anrufen",
      emailLabel: "E-Mail an Von Wobeser",
      cookiesLabel: "Cookie-Einstellungen verwalten",
      loadingLabel: "Kontaktinformationen werden geladen",
      footerLabel: "Fußzeile der Website",
      firmLinksLabel: "Kanzlei-Links",
      capabilitiesLinksLabel: "Kompetenz-Links",
      resourcesLinksLabel: "Ressourcen-Links",
      legalLinksLabel: "Rechtliche Links",
      esrAlt: "Sozial verantwortliches Unternehmen",
    },
    zh: {
      firm: "律所简介",
      firmLinks: [
        { label: "关于我们", href: "/about", id: "about" },
        { label: "我们的团队", href: "/team", id: "people" },
        { label: "职业发展", href: "/careers", id: "careers" },
        { label: "联系我们", href: "/contact", id: "contact" },
      ],
      capabilities: "业务能力",
      capabilitiesLinks: [
        { label: "业务领域", href: "/practice-groups", id: "practice" },
        { label: "行业组别", href: "/industry-groups", id: "industry" },
      ],
      resources: "资源",
      resourcesLinks: [
        { label: "新闻与洞察", href: "/news", id: "news" },
        { label: "排名", href: "/rankings", id: "rankings" },
      ],
      contact: "联系方式",
      building: "Torre SOMA Chapultepec 18层",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, 墨西哥城",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. 版权所有。",
      privacy: "隐私声明",
      terms: "使用条款",
      cookies: "Cookie偏好设置",
      description: "墨西哥领先的律师事务所，拥有超过70年提供卓越法律服务的经验。",
      practiceLabel: "业务领域",
      industryLabel: "行业组别",
      errorMessage: "联系信息不可用",
      followUs: "关注我们",
      linkedinLabel: "在LinkedIn上访问Von Wobeser（在新标签页中打开）",
      twitterLabel: "在X/Twitter上访问Von Wobeser（在新标签页中打开）",
      websiteLabel: "访问Von Wobeser网站（在新标签页中打开）",
      phoneLabel: "致电Von Wobeser",
      emailLabel: "发送邮件至Von Wobeser",
      cookiesLabel: "管理Cookie偏好设置",
      loadingLabel: "正在加载联系信息",
      footerLabel: "网站页脚",
      firmLinksLabel: "律所链接",
      capabilitiesLinksLabel: "业务能力链接",
      resourcesLinksLabel: "资源链接",
      legalLinksLabel: "法律链接",
      esrAlt: "社会责任企业",
    },
    ko: {
      firm: "법률 사무소",
      firmLinks: [
        { label: "회사 소개", href: "/about", id: "about" },
        { label: "우리 팀", href: "/team", id: "people" },
        { label: "채용", href: "/careers", id: "careers" },
        { label: "연락처", href: "/contact", id: "contact" },
      ],
      capabilities: "역량",
      capabilitiesLinks: [
        { label: "업무 분야", href: "/practice-groups", id: "practice" },
        { label: "산업 그룹", href: "/industry-groups", id: "industry" },
      ],
      resources: "자료",
      resourcesLinks: [
        { label: "뉴스 및 인사이트", href: "/news", id: "news" },
        { label: "순위", href: "/rankings", id: "rankings" },
      ],
      contact: "연락처",
      building: "Torre SOMA Chapultepec 18층",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, 멕시코시티",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. 모든 권리 보유.",
      privacy: "개인정보 처리방침",
      terms: "이용 약관",
      cookies: "쿠키 설정",
      description: "70년 이상의 우수한 법률 서비스 경험을 보유한 멕시코 최고의 로펌입니다.",
      practiceLabel: "업무 분야",
      industryLabel: "산업 그룹",
      errorMessage: "연락처 정보를 사용할 수 없습니다",
      followUs: "팔로우",
      linkedinLabel: "LinkedIn에서 Von Wobeser 방문 (새 탭에서 열림)",
      twitterLabel: "X/Twitter에서 Von Wobeser 방문 (새 탭에서 열림)",
      websiteLabel: "Von Wobeser 웹사이트 방문 (새 탭에서 열림)",
      phoneLabel: "Von Wobeser에 전화하기",
      emailLabel: "Von Wobeser에 이메일 보내기",
      cookiesLabel: "쿠키 설정 관리",
      loadingLabel: "연락처 정보 로딩 중",
      footerLabel: "사이트 푸터",
      firmLinksLabel: "사무소 링크",
      capabilitiesLinksLabel: "역량 링크",
      resourcesLinksLabel: "자료 링크",
      legalLinksLabel: "법적 링크",
      esrAlt: "사회적 책임 기업",
    },
    ja: {
      firm: "事務所概要",
      firmLinks: [
        { label: "私たちについて", href: "/about", id: "about" },
        { label: "チーム紹介", href: "/team", id: "people" },
        { label: "採用情報", href: "/careers", id: "careers" },
        { label: "お問い合わせ", href: "/contact", id: "contact" },
      ],
      capabilities: "業務分野",
      capabilitiesLinks: [
        { label: "プラクティス分野", href: "/practice-groups", id: "practice" },
        { label: "業界グループ", href: "/industry-groups", id: "industry" },
      ],
      resources: "リソース",
      resourcesLinks: [
        { label: "ニュース＆インサイト", href: "/news", id: "news" },
        { label: "ランキング", href: "/rankings", id: "rankings" },
      ],
      contact: "お問い合わせ",
      building: "Torre SOMA Chapultepec 18階",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, メキシコシティ",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. 無断複写・転載を禁じます。",
      privacy: "プライバシーポリシー",
      terms: "利用規約",
      cookies: "Cookie設定",
      description: "70年以上にわたり卓越した法務サービスを提供してきたメキシコの主要法律事務所です。",
      practiceLabel: "プラクティス分野",
      industryLabel: "業界グループ",
      errorMessage: "連絡先情報を取得できません",
      followUs: "フォロー",
      linkedinLabel: "LinkedInでVon Wobeserを訪問（新しいタブで開きます）",
      twitterLabel: "X/TwitterでVon Wobeserを訪問（新しいタブで開きます）",
      websiteLabel: "Von Wobeserのウェブサイトを訪問（新しいタブで開きます）",
      phoneLabel: "Von Wobeserに電話する",
      emailLabel: "Von Wobeserにメールを送る",
      cookiesLabel: "Cookie設定を管理",
      loadingLabel: "連絡先情報を読み込み中",
      footerLabel: "サイトフッター",
      firmLinksLabel: "事務所リンク",
      capabilitiesLinksLabel: "業務分野リンク",
      resourcesLinksLabel: "リソースリンク",
      legalLinksLabel: "法的リンク",
      esrAlt: "社会的責任企業",
    },
    ar: {
      firm: "المكتب",
      firmLinks: [
        { label: "من نحن", href: "/about", id: "about" },
        { label: "فريقنا", href: "/team", id: "people" },
        { label: "الوظائف", href: "/careers", id: "careers" },
        { label: "اتصل بنا", href: "/contact", id: "contact" },
      ],
      capabilities: "القدرات",
      capabilitiesLinks: [
        { label: "مجالات الممارسة", href: "/practice-groups", id: "practice" },
        { label: "مجموعات الصناعة", href: "/industry-groups", id: "industry" },
      ],
      resources: "الموارد",
      resourcesLinks: [
        { label: "الأخبار والرؤى", href: "/news", id: "news" },
        { label: "التصنيفات", href: "/rankings", id: "rankings" },
      ],
      contact: "اتصل بنا",
      building: "Torre SOMA Chapultepec الطابق 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, مكسيكو سيتي",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. جميع الحقوق محفوظة.",
      privacy: "إشعار الخصوصية",
      terms: "شروط الاستخدام",
      cookies: "تفضيلات ملفات تعريف الارتباط",
      description: "مكتب محاماة رائد في المكسيك مع أكثر من 70 عامًا من الخبرة في تقديم خدمات قانونية متميزة.",
      practiceLabel: "مجالات الممارسة",
      industryLabel: "مجموعات الصناعة",
      errorMessage: "معلومات الاتصال غير متوفرة",
      followUs: "تابعنا",
      linkedinLabel: "زيارة Von Wobeser على LinkedIn (يفتح في علامة تبويب جديدة)",
      twitterLabel: "زيارة Von Wobeser على X/Twitter (يفتح في علامة تبويب جديدة)",
      websiteLabel: "زيارة موقع Von Wobeser (يفتح في علامة تبويب جديدة)",
      phoneLabel: "اتصل بـ Von Wobeser",
      emailLabel: "أرسل بريدًا إلكترونيًا إلى Von Wobeser",
      cookiesLabel: "إدارة تفضيلات ملفات تعريف الارتباط",
      loadingLabel: "جاري تحميل معلومات الاتصال",
      footerLabel: "تذييل الموقع",
      firmLinksLabel: "روابط المكتب",
      capabilitiesLinksLabel: "روابط القدرات",
      resourcesLinksLabel: "روابط الموارد",
      legalLinksLabel: "الروابط القانونية",
      esrAlt: "شركة مسؤولة اجتماعياً",
    },
    ru: {
      firm: "О фирме",
      firmLinks: [
        { label: "О нас", href: "/about", id: "about" },
        { label: "Наша команда", href: "/team", id: "people" },
        { label: "Карьера", href: "/careers", id: "careers" },
        { label: "Контакты", href: "/contact", id: "contact" },
      ],
      capabilities: "Компетенции",
      capabilitiesLinks: [
        { label: "Практики", href: "/practice-groups", id: "practice" },
        { label: "Отраслевые группы", href: "/industry-groups", id: "industry" },
      ],
      resources: "Ресурсы",
      resourcesLinks: [
        { label: "Новости и аналитика", href: "/news", id: "news" },
        { label: "Рейтинги", href: "/rankings", id: "rankings" },
      ],
      contact: "Контакты",
      building: "Torre SOMA Chapultepec Этаж 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Мехико",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. Все права защищены.",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      cookies: "Настройки файлов cookie",
      description: "Ведущая юридическая фирма в Мексике с более чем 70-летним опытом предоставления превосходных юридических услуг.",
      practiceLabel: "Практики",
      industryLabel: "Отраслевые группы",
      errorMessage: "Контактная информация недоступна",
      followUs: "Подписывайтесь",
      linkedinLabel: "Посетить Von Wobeser в LinkedIn (откроется в новой вкладке)",
      twitterLabel: "Посетить Von Wobeser в X/Twitter (откроется в новой вкладке)",
      websiteLabel: "Посетить сайт Von Wobeser (откроется в новой вкладке)",
      phoneLabel: "Позвонить в Von Wobeser",
      emailLabel: "Написать в Von Wobeser",
      cookiesLabel: "Управление настройками файлов cookie",
      loadingLabel: "Загрузка контактной информации",
      footerLabel: "Подвал сайта",
      firmLinksLabel: "Ссылки фирмы",
      capabilitiesLinksLabel: "Ссылки компетенций",
      resourcesLinksLabel: "Ссылки ресурсов",
      legalLinksLabel: "Юридические ссылки",
      esrAlt: "Социально ответственная компания",
    },
    fr: {
      firm: "Le Cabinet",
      firmLinks: [
        { label: "À propos de nous", href: "/about", id: "about" },
        { label: "Notre équipe", href: "/team", id: "people" },
        { label: "Carrières", href: "/careers", id: "careers" },
        { label: "Contact", href: "/contact", id: "contact" },
      ],
      capabilities: "Compétences",
      capabilitiesLinks: [
        { label: "Domaines de pratique", href: "/practice-groups", id: "practice" },
        { label: "Groupes sectoriels", href: "/industry-groups", id: "industry" },
      ],
      resources: "Ressources",
      resourcesLinks: [
        { label: "Actualités et analyses", href: "/news", id: "news" },
        { label: "Classements", href: "/rankings", id: "rankings" },
      ],
      contact: "Contact",
      building: "Torre SOMA Chapultepec Étage 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Mexico",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. Tous droits réservés.",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      cookies: "Préférences de cookies",
      description: "Cabinet d'avocats de premier plan au Mexique avec plus de 70 ans d'expérience dans la fourniture de services juridiques d'excellence.",
      practiceLabel: "Domaines de pratique",
      industryLabel: "Groupes sectoriels",
      errorMessage: "Informations de contact non disponibles",
      followUs: "Suivez-nous",
      linkedinLabel: "Visiter Von Wobeser sur LinkedIn (ouvre dans un nouvel onglet)",
      twitterLabel: "Visiter Von Wobeser sur X/Twitter (ouvre dans un nouvel onglet)",
      websiteLabel: "Visiter le site Web de Von Wobeser (ouvre dans un nouvel onglet)",
      phoneLabel: "Appeler Von Wobeser",
      emailLabel: "Envoyer un e-mail à Von Wobeser",
      cookiesLabel: "Gérer les préférences de cookies",
      loadingLabel: "Chargement des informations de contact",
      footerLabel: "Pied de page du site",
      firmLinksLabel: "Liens du cabinet",
      capabilitiesLinksLabel: "Liens des compétences",
      resourcesLinksLabel: "Liens des ressources",
      legalLinksLabel: "Liens juridiques",
      esrAlt: "Entreprise socialement responsable",
    },
    it: {
      firm: "Lo Studio",
      firmLinks: [
        { label: "Chi siamo", href: "/about", id: "about" },
        { label: "Il nostro team", href: "/team", id: "people" },
        { label: "Carriere", href: "/careers", id: "careers" },
        { label: "Contatti", href: "/contact", id: "contact" },
      ],
      capabilities: "Competenze",
      capabilitiesLinks: [
        { label: "Aree di pratica", href: "/practice-groups", id: "practice" },
        { label: "Gruppi industriali", href: "/industry-groups", id: "industry" },
      ],
      resources: "Risorse",
      resourcesLinks: [
        { label: "Notizie e approfondimenti", href: "/news", id: "news" },
        { label: "Classifiche", href: "/rankings", id: "rankings" },
      ],
      contact: "Contatti",
      building: "Torre SOMA Chapultepec Piano 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Città del Messico",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. Tutti i diritti riservati.",
      privacy: "Informativa sulla privacy",
      terms: "Termini di utilizzo",
      cookies: "Preferenze cookie",
      description: "Studio legale leader in Messico con oltre 70 anni di esperienza nella fornitura di servizi legali di eccellenza.",
      practiceLabel: "Aree di pratica",
      industryLabel: "Gruppi industriali",
      errorMessage: "Informazioni di contatto non disponibili",
      followUs: "Seguici",
      linkedinLabel: "Visita Von Wobeser su LinkedIn (apre in una nuova scheda)",
      twitterLabel: "Visita Von Wobeser su X/Twitter (apre in una nuova scheda)",
      websiteLabel: "Visita il sito web di Von Wobeser (apre in una nuova scheda)",
      phoneLabel: "Chiama Von Wobeser",
      emailLabel: "Invia un'e-mail a Von Wobeser",
      cookiesLabel: "Gestisci le preferenze dei cookie",
      loadingLabel: "Caricamento informazioni di contatto",
      footerLabel: "Piè di pagina del sito",
      firmLinksLabel: "Link dello studio",
      capabilitiesLinksLabel: "Link delle competenze",
      resourcesLinksLabel: "Link delle risorse",
      legalLinksLabel: "Link legali",
      esrAlt: "Azienda socialmente responsabile",
    },
  };

  const t = content[language] || content.en;

  const renderContactInfo = () => {
    if (isLoading) {
      return (
        <div className="space-y-4" data-testid="skeleton-contact" aria-busy="true" aria-label={t.loadingLabel}>
          <div className="flex items-start gap-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 mt-1 bg-gray-700" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-40 bg-gray-700" />
              <Skeleton className="h-4 w-36 bg-gray-700" />
              <Skeleton className="h-4 w-32 bg-gray-700" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 bg-gray-700" />
            <Skeleton className="h-4 w-32 bg-gray-700" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 bg-gray-700" />
            <Skeleton className="h-4 w-40 bg-gray-700" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-3 text-gray-500" data-testid="text-contact-error" role="alert">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm">{t.errorMessage}</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <address className="not-italic" data-testid="text-footer-address">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
            <div className="text-sm text-gray-400">
              <p>{t.building}</p>
              <p>{t.street}</p>
              <p>{t.city}</p>
            </div>
          </div>
        </address>
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <a
            href={`tel:${t.phone.replace(/\s/g, "")}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            data-testid="link-footer-phone"
            aria-label={`${t.phoneLabel}: ${t.phone}`}
          >
            {t.phone}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <a
            href={`mailto:${t.email}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            data-testid="link-footer-email"
            aria-label={`${t.emailLabel}: ${t.email}`}
          >
            {t.email}
          </a>
        </div>
        <div className="pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t.followUs}</p>
          <div className="flex items-center gap-2">
            <a
              href="https://www.linkedin.com/company/von-wobeser-y-sierra/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
              data-testid="link-linkedin"
              aria-label={t.linkedinLabel}
            >
              <Linkedin className="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="https://twitter.com/vonwobeser"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
              data-testid="link-twitter"
              aria-label={t.twitterLabel}
            >
              <Twitter className="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="https://www.vonwobeser.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
              data-testid="link-website"
              aria-label={t.websiteLabel}
            >
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <footer
      id="footer"
      className="bg-gray-900 text-white py-16 lg:py-20"
      data-testid="footer"
      role="contentinfo"
      aria-label={t.footerLabel}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          <div className="lg:col-span-1">
            <img
              src={footerLogo}
              alt="Von Wobeser y Sierra"
              className="h-8 mb-6"
              data-testid="img-footer-logo"
            />
            <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-footer-description">
              {t.description}
            </p>
          </div>

          <nav aria-label={t.firmLinksLabel}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-firm-title">
              {t.firm}
            </h3>
            <ul className="space-y-3" data-testid="list-firm-links">
              {t.firmLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                    data-testid={`link-footer-${link.id}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <nav aria-label={t.capabilitiesLinksLabel}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-capabilities-title">
                {t.capabilities}
              </h3>
              <ul className="space-y-3" data-testid="list-capabilities-links">
                {t.capabilitiesLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                      data-testid={`link-footer-${link.id}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-center gap-3 text-primary mb-2" data-testid="stat-practice-groups">
                <span className="text-2xl font-heading" aria-label={`18 ${t.practiceLabel}`}>18</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {t.practiceLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-primary" data-testid="stat-industry-groups">
                <span className="text-2xl font-heading" aria-label={`7 ${t.industryLabel}`}>7</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {t.industryLabel}
                </span>
              </div>
            </div>
          </div>

          <nav aria-label={t.resourcesLinksLabel}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-resources-title">
              {t.resources}
            </h3>
            <ul className="space-y-3" data-testid="list-resources-links">
              {t.resourcesLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                    data-testid={`link-footer-${link.id}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-contact-title">
              {t.contact}
            </h3>
            {renderContactInfo()}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
              <p className="text-xs text-gray-500" data-testid="text-copyright">
                {t.legal}
              </p>
              <img 
                src={esrLogo} 
                alt={t.esrAlt}
                className="h-10 object-contain"
                data-testid="img-esr-logo"
              />
            </div>
            <nav className="flex flex-wrap items-center gap-2 sm:gap-4" aria-label={t.legalLinksLabel}>
              <Link
                href="/privacy-policy"
                className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-500 hover:text-white transition-colors touch-manipulation"
                data-testid="link-privacy"
              >
                {t.privacy}
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-500 hover:text-white transition-colors touch-manipulation"
                data-testid="link-terms"
              >
                {t.terms}
              </Link>
              <button
                onClick={() => localStorage.removeItem('vwb_cookie_consent')}
                className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-500 hover:text-white transition-colors touch-manipulation"
                data-testid="button-cookies"
                aria-label={t.cookiesLabel}
              >
                {t.cookies}
              </button>
              <Link
                href="/admin/login"
                className="inline-flex items-center min-h-[44px] px-2 text-gray-600 hover:text-gray-400 transition-colors touch-manipulation opacity-30 hover:opacity-60"
                data-testid="link-admin"
                aria-label="Admin"
              >
                <Settings className="h-3 w-3" />
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
