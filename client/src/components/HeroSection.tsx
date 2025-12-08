import { useEffect, useState } from "react";
import { ChevronDown, Phone, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SiteContent, News } from "@shared/schema";
import heroVideo from "@assets/dron_1764710361340.mp4";
import heroImage from "@assets/hero_office.jpg";

interface HeroSectionProps {
  language: "es" | "en";
}

function NewsPanel({ language, news }: { language: "es" | "en"; news: News[] }) {
  const displayNews = news.slice(0, 2);
  
  const labels = {
    en: {
      news: "News",
      seeMore: "SEE MORE",
    },
    es: {
      news: "Noticias",
      seeMore: "VER MÁS",
    },
  };

  const t = labels[language];

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
            className="text-sm font-medium tracking-[0.2em] uppercase text-[#5E5E5E] border-b border-[#CCCCCC] pb-2"
            data-testid="text-news-header"
          >
            {t.news}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {displayNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 + index * 0.15 }}
              className={`group ${index === 0 ? 'border-r border-[#E5E7EB] pr-4' : 'pl-2'}`}
              data-testid={`card-news-${item.id}`}
            >
              <h4 
                className="text-sm font-medium text-[#1F2937] leading-snug mb-3 italic"
                data-testid={`text-news-title-${item.id}`}
              >
                {language === "es" ? item.titleEs : item.title}
              </h4>
              <Link 
                href={`/news/${item.slug}`}
                className="inline-flex items-center text-xs font-medium tracking-wider text-[#AC162C] hover:text-[#841A1A] transition-colors"
                data-testid={`link-news-seemore-${item.id}`}
              >
                {t.seeMore}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

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

  const content = {
    en: {
      tagline: "Leading Law Firm in Mexico",
      headline: "VON WOBESER Y SIERRA",
      subheadline: siteContent?.heroSubtitle || "Corporate Legal Excellence Since 1986",
      scroll: "scroll",
      ctaContact: "Contact Us",
      ctaConsult: "Schedule Consultation",
      heroVideoLabel: "Aerial view of Von Wobeser y Sierra offices in Mexico City",
      heroImageLabel: "Von Wobeser y Sierra headquarters building",
    },
    es: {
      tagline: "Firma Líder de Abogados en México",
      headline: "VON WOBESER Y SIERRA",
      subheadline: "Excelencia Legal Corporativa Desde 1986",
      scroll: "scroll",
      ctaContact: "Contáctenos",
      ctaConsult: "Agendar Consulta",
      heroVideoLabel: "Vista aérea de las oficinas de Von Wobeser y Sierra en Ciudad de México",
      heroImageLabel: "Edificio de la sede de Von Wobeser y Sierra",
    },
  };

  const t = content[language];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="section-hero"
      aria-label={language === "es" ? "Sección principal de bienvenida" : "Main welcome section"}
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
            {language === "es" 
              ? "Tu navegador no soporta el elemento de video." 
              : "Your browser does not support the video element."}
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
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-light text-white leading-tight tracking-wide mb-8"
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
          {t.subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10 w-full sm:w-auto px-4 sm:px-0"
          data-testid="hero-cta-buttons"
        >
          <Link href="/contact" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-[#AC162C] hover:bg-[#841A1A] text-white px-8 py-6 text-base font-medium tracking-wide uppercase"
              data-testid="button-hero-contact"
            >
              <Phone className="w-5 h-5 mr-2" />
              {t.ctaContact}
            </Button>
          </Link>
          <Link href="/contact" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-base font-medium tracking-wide uppercase backdrop-blur-sm"
              data-testid="button-hero-consult"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {t.ctaConsult}
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1 }}
        onClick={scrollToNews}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/85 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] touch-manipulation p-2"
        data-testid="button-scroll-down"
        aria-label={language === "es" ? "Desplazar hacia abajo a la sección de noticias" : "Scroll down to news section"}
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
