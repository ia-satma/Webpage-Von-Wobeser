import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import type { SiteContent, News, LanguageCode } from "@shared/schema";
import heroVideo from "@assets/dron_1764710361340.mp4";
import heroImage from "@assets/hero_office.jpg";

interface HeroSectionProps {
  language: LanguageCode;
}

type NewsPanelLabels = {
  news: string;
  seeMore: string;
};

const newsPanelLabels: Record<LanguageCode, NewsPanelLabels> = {
  en: {
    news: "News",
    seeMore: "SEE MORE",
  },
  es: {
    news: "Noticias",
    seeMore: "VER MÁS",
  },
  de: {
    news: "Nachrichten",
    seeMore: "MEHR SEHEN",
  },
  zh: {
    news: "新闻",
    seeMore: "查看更多",
  },
  ko: {
    news: "뉴스",
    seeMore: "더 보기",
  },
  ja: {
    news: "ニュース",
    seeMore: "もっと見る",
  },
  ar: {
    news: "أخبار",
    seeMore: "شاهد المزيد",
  },
  ru: {
    news: "Новости",
    seeMore: "ПОДРОБНЕЕ",
  },
  fr: {
    news: "Actualités",
    seeMore: "VOIR PLUS",
  },
  it: {
    news: "Notizie",
    seeMore: "VEDI DI PIÙ",
  },
};

function NewsItemTranslated({ 
  item, 
  language, 
  index, 
  seeMoreText 
}: { 
  item: News; 
  language: LanguageCode; 
  index: number; 
  seeMoreText: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'news',
    entityId: item.id,
    fields: { 
      title: item.titleEs || item.title, 
      titleEs: item.titleEs,
    },
    enabled: language !== 'es',
  });

  const displayTitle = language === 'es' 
    ? item.titleEs 
    : (translatedFields.title || item.titleEs || item.title);

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 + index * 0.15 }}
      className={`group ${index === 0 ? 'border-r border-[#E5E7EB] pr-4' : 'pl-2'}`}
      data-testid={`card-news-${item.id}`}
    >
      <h4 
        className="text-sm font-publico font-bold text-[#1D1D1B] leading-snug mb-3"
        data-testid={`text-news-title-${item.id}`}
      >
        {displayTitle}
      </h4>
      <Link 
        href={`/news/${item.slug}`}
        className="inline-flex items-center text-xs font-geomanist font-bold tracking-[0.15em] uppercase text-[#AA1A2E] hover:text-[#8A1525] no-underline transition-colors"
        data-testid={`link-news-seemore-${item.id}`}
      >
        {seeMoreText}
      </Link>
    </motion.div>
  );
}

function NewsPanel({ language, news }: { language: LanguageCode; news: News[] }) {
  const displayNews = news.slice(0, 2);
  
  const t = newsPanelLabels[language] || newsPanelLabels.en;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.8 }}
      className="absolute left-6 md:left-12 bottom-24 md:bottom-20 z-20 hidden md:block"
      data-testid="panel-news-overlay"
    >
      <div className="bg-white/95 backdrop-blur-sm p-6 shadow-lg" style={{ width: '420px' }}>
        <div className="mb-4 text-center">
          <h3 
            className="text-sm font-geomanist tracking-[0.2em] uppercase text-[#3A3A3A] pb-2"
            data-testid="text-news-header"
          >
            {t.news}
          </h3>
          <div className="h-px w-full bg-[#AA1A2E]" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {displayNews.map((item, index) => (
            <NewsItemTranslated
              key={item.id}
              item={item}
              language={language}
              index={index}
              seeMoreText={t.seeMore}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

type HeroContent = {
  tagline: string;
  headline: string;
  subheadline: string;
  scroll: string;
  ctaContact: string;
  ctaConsult: string;
  heroVideoLabel: string;
  heroImageLabel: string;
  ariaLabel: string;
  videoFallback: string;
};

const heroContent: Record<LanguageCode, HeroContent> = {
  en: {
    tagline: "LEADING LAW FIRM IN MEXICO",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "Corporate Legal Excellence Since 1986",
    scroll: "scroll",
    ctaContact: "CONTACT US",
    ctaConsult: "SCHEDULE CONSULTATION",
    heroVideoLabel: "Aerial view of Von Wobeser y Sierra offices in Mexico City",
    heroImageLabel: "Von Wobeser y Sierra headquarters building",
    ariaLabel: "Main welcome section",
    videoFallback: "Your browser does not support the video element.",
  },
  es: {
    tagline: "FIRMA LÍDER DE ABOGADOS EN MÉXICO",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "Excelencia Legal Corporativa Desde 1986",
    scroll: "scroll",
    ctaContact: "CONTÁCTENOS",
    ctaConsult: "AGENDAR CONSULTA",
    heroVideoLabel: "Vista aérea de las oficinas de Von Wobeser y Sierra en Ciudad de México",
    heroImageLabel: "Edificio de la sede de Von Wobeser y Sierra",
    ariaLabel: "Sección principal de bienvenida",
    videoFallback: "Tu navegador no soporta el elemento de video.",
  },
  de: {
    tagline: "FÜHRENDE ANWALTSKANZLEI IN MEXIKO",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "Erstklassige Unternehmensrechtsberatung seit 1986",
    scroll: "scrollen",
    ctaContact: "KONTAKT",
    ctaConsult: "BERATUNG VEREINBAREN",
    heroVideoLabel: "Luftaufnahme der Büros von Von Wobeser y Sierra in Mexiko-Stadt",
    heroImageLabel: "Hauptgebäude von Von Wobeser y Sierra",
    ariaLabel: "Hauptbegrüßungsbereich",
    videoFallback: "Ihr Browser unterstützt das Video-Element nicht.",
  },
  zh: {
    tagline: "墨西哥领先律师事务所",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "自1986年以来的卓越企业法律服务",
    scroll: "滚动",
    ctaContact: "联系我们",
    ctaConsult: "预约咨询",
    heroVideoLabel: "Von Wobeser y Sierra 墨西哥城办公室鸟瞰图",
    heroImageLabel: "Von Wobeser y Sierra 总部大楼",
    ariaLabel: "主要欢迎区域",
    videoFallback: "您的浏览器不支持视频元素。",
  },
  ko: {
    tagline: "멕시코 최고의 로펌",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "1986년부터 이어온 기업 법률 서비스의 우수성",
    scroll: "스크롤",
    ctaContact: "문의하기",
    ctaConsult: "상담 예약",
    heroVideoLabel: "멕시코시티 Von Wobeser y Sierra 사무실 항공 전경",
    heroImageLabel: "Von Wobeser y Sierra 본사 건물",
    ariaLabel: "메인 환영 섹션",
    videoFallback: "브라우저가 비디오 요소를 지원하지 않습니다.",
  },
  ja: {
    tagline: "メキシコをリードする法律事務所",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "1986年以来の企業法務における卓越性",
    scroll: "スクロール",
    ctaContact: "お問い合わせ",
    ctaConsult: "相談を予約する",
    heroVideoLabel: "メキシコシティにあるVon Wobeser y Sierraオフィスの空撮映像",
    heroImageLabel: "Von Wobeser y Sierra 本社ビル",
    ariaLabel: "メインウェルカムセクション",
    videoFallback: "お使いのブラウザはビデオ要素をサポートしていません。",
  },
  ar: {
    tagline: "شركة محاماة رائدة في المكسيك",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "التميز القانوني للشركات منذ عام 1986",
    scroll: "تمرير",
    ctaContact: "اتصل بنا",
    ctaConsult: "حجز استشارة",
    heroVideoLabel: "منظر جوي لمكاتب Von Wobeser y Sierra في مدينة مكسيكو",
    heroImageLabel: "مبنى المقر الرئيسي لـ Von Wobeser y Sierra",
    ariaLabel: "قسم الترحيب الرئيسي",
    videoFallback: "متصفحك لا يدعم عنصر الفيديو.",
  },
  ru: {
    tagline: "ВЕДУЩАЯ ЮРИДИЧЕСКАЯ ФИРМА В МЕКСИКЕ",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "Высочайший уровень корпоративного права с 1986 года",
    scroll: "прокрутка",
    ctaContact: "СВЯЗАТЬСЯ С НАМИ",
    ctaConsult: "ЗАПИСАТЬСЯ НА КОНСУЛЬТАЦИЮ",
    heroVideoLabel: "Аэросъёмка офисов Von Wobeser y Sierra в Мехико",
    heroImageLabel: "Здание штаб-квартиры Von Wobeser y Sierra",
    ariaLabel: "Главный приветственный раздел",
    videoFallback: "Ваш браузер не поддерживает видео элемент.",
  },
  fr: {
    tagline: "CABINET D'AVOCATS DE PREMIER PLAN AU MEXIQUE",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "Excellence juridique d'entreprise depuis 1986",
    scroll: "défiler",
    ctaContact: "CONTACTEZ-NOUS",
    ctaConsult: "PRENDRE RENDEZ-VOUS",
    heroVideoLabel: "Vue aérienne des bureaux de Von Wobeser y Sierra à Mexico",
    heroImageLabel: "Bâtiment du siège de Von Wobeser y Sierra",
    ariaLabel: "Section d'accueil principale",
    videoFallback: "Votre navigateur ne prend pas en charge l'élément vidéo.",
  },
  it: {
    tagline: "STUDIO LEGALE LEADER IN MESSICO",
    headline: "VON WOBESER Y SIERRA",
    subheadline: "Eccellenza legale aziendale dal 1986",
    scroll: "scorri",
    ctaContact: "CONTATTACI",
    ctaConsult: "PRENOTA UNA CONSULENZA",
    heroVideoLabel: "Vista aerea degli uffici di Von Wobeser y Sierra a Città del Messico",
    heroImageLabel: "Edificio della sede di Von Wobeser y Sierra",
    ariaLabel: "Sezione di benvenuto principale",
    videoFallback: "Il tuo browser non supporta l'elemento video.",
  },
};

const scrollAriaLabels: Record<LanguageCode, string> = {
  en: "Scroll down to news section",
  es: "Desplazar hacia abajo a la sección de noticias",
  de: "Nach unten zum Nachrichtenbereich scrollen",
  zh: "向下滚动到新闻部分",
  ko: "뉴스 섹션으로 스크롤",
  ja: "ニュースセクションまでスクロール",
  ar: "انتقل إلى قسم الأخبار",
  ru: "Прокрутить вниз к разделу новостей",
  fr: "Faire défiler vers la section actualités",
  it: "Scorri verso il basso alla sezione notizie",
};

export default function HeroSection({ language }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  const { data: siteContent } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const { data: newsData } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToNews = () => {
    const element = document.querySelector("#news");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const t = heroContent[language] || heroContent.en;
  const scrollAriaLabel = scrollAriaLabels[language] || scrollAriaLabels.en;
  
  const subheadline = (language === "en" && siteContent?.heroSubtitle) 
    ? siteContent.heroSubtitle 
    : t.subheadline;

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="section-hero"
      aria-label={t.ariaLabel}
    >
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]"
          data-testid="background-gradient"
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23AC162C' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {isMobile ? (
          <img
            src={heroImage}
            alt={t.heroImageLabel}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            loading="eager"
            data-testid="img-hero-background-mobile"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/hero-poster.jpg"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            data-testid="video-hero-background"
            aria-label={t.heroVideoLabel}
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = 'none';
            }}
          >
            <source
              src={heroVideo}
              type="video/mp4"
            />
            <img 
              src={heroImage}
              alt={t.heroImageLabel}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {t.videoFallback}
          </video>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {newsData && newsData.length > 0 && (
        <NewsPanel language={language} news={newsData} />
      )}

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/90 text-sm tracking-[0.3em] uppercase mb-8 font-sans"
          data-testid="text-hero-tagline"
        >
          {t.tagline}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-publico font-bold text-white leading-tight tracking-wide mb-8"
          data-testid="text-hero-headline"
        >
          {t.headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-white/90 text-lg md:text-xl font-serif max-w-2xl mx-auto"
          data-testid="text-hero-subheadline"
        >
          {subheadline}
        </motion.p>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1 }}
        onClick={scrollToNews}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/85 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] touch-manipulation p-2"
        data-testid="button-scroll-down"
        aria-label={scrollAriaLabel}
      >
        <span className="text-xs tracking-[0.2em] uppercase" data-testid="text-scroll">{t.scroll}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6" data-testid="icon-chevron-down" />
        </motion.div>
      </motion.button>
    </section>
  );
}
