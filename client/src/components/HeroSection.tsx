import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDisplayValue } from "@/lib/translationUtils";
import type { SiteContent, News, LanguageCode } from "@shared/schema";
import heroVideo from "@assets/dron_1764710361340.mp4";
import heroImage from "@assets/hero_office.jpg";
import logoColor from "@assets/logovw_1775695774326.png";

interface HeroSectionProps {
  language: LanguageCode;
}

type NewsPanelLabels = {
  news: string;
  seeMore: string;
};

const newsPanelLabels: Record<string, NewsPanelLabels> = {
  en: {
    news: "News",
    seeMore: "SEE MORE",
  },
  es: {
    news: "Noticias",
    seeMore: "VER MÁS",
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
  const displayTitle = getDisplayValue(item, "title", language) ?? "";

  const inner = (
    <>
      <h4 
        className="text-sm font-medium text-white leading-snug mb-2 group-hover:text-white/80 transition-colors"
        data-testid={`text-news-title-${item.id}`}
      >
        {displayTitle}
      </h4>
      <Link 
        href={`/news/${item.slug}`}
        className="inline-flex items-center gap-1 text-[11px] font-geomanist font-bold tracking-[0.15em] uppercase text-primary hover:text-[#CC2038] no-underline transition-colors"
        data-testid={`link-news-seemore-${item.id}`}
      >
        {seeMoreText}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 5h6M5.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 + index * 0.15 }}
      className="group ps-3 border-s-2 border-primary"
      data-testid={`card-news-${item.id}`}
    >
      {inner}
    </motion.div>
  );
}

function NewsPanel({ language, news }: { language: LanguageCode; news: News[] }) {
  const displayNews = news.slice(0, 2);
  const t = newsPanelLabels[language] || newsPanelLabels.en;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8 }}
      className="absolute left-6 md:left-12 bottom-6 md:bottom-8 z-20 hidden md:block"
      data-testid="panel-news-overlay"
    >
      <div
        className="backdrop-blur-md border border-white/10 p-5 flex flex-col gap-4"
        style={{
          width: '280px',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(20,20,20,0.65) 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-px bg-primary" aria-hidden="true" />
          <h3
            className="text-[10px] font-geomanist tracking-[0.3em] uppercase text-white/50"
            data-testid="text-news-header"
          >
            {t.news}
          </h3>
          <div className="flex-1 h-px bg-card/10" aria-hidden="true" />
        </div>

        {/* News items */}
        <div className="flex flex-col gap-4">
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

const heroContent: Record<string, HeroContent> = {
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
};

const scrollAriaLabels: Record<string, string> = {
  en: "Scroll down to news section",
  es: "Desplazar hacia abajo a la sección de noticias",
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
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 to-transparent" />
      </div>

      {newsData && newsData.length > 0 && (
        <NewsPanel language={language} news={newsData} />
      )}

      {/* Hero content — all in one centred block */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-4 -mt-12 md:-mt-16">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/90 text-xs sm:text-sm tracking-[0.3em] uppercase font-sans"
          data-testid="text-hero-tagline"
        >
          {t.tagline}
        </motion.p>

        <motion.img
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.35 }}
          src={logoColor}
          alt={t.headline}
          className="w-[92vw] max-w-[540px] sm:max-w-[780px] md:max-w-[1000px] lg:max-w-[1200px] h-auto object-contain"
          style={{ imageRendering: "crisp-edges" }}
          data-testid="text-hero-headline"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-white/70 text-xs tracking-[0.2em] uppercase"
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
