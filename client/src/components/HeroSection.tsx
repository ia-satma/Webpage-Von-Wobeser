import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { SiteContent } from "@shared/schema";

interface HeroSectionProps {
  language: "es" | "en";
}

export default function HeroSection({ language }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { data: siteContent } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
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
      tagline: "Von Wobeser - New Offices",
      headline: siteContent?.heroTitle || "WE GO WHERE CLIENTS NEED US",
      subheadline: siteContent?.heroSubtitle || "New offices of Von Wobeser y Sierra",
      scroll: "scroll",
    },
    es: {
      tagline: "Von Wobeser - Nuevas Oficinas",
      headline: "VAMOS DONDE NUESTROS CLIENTES NOS NECESITAN",
      subheadline: "Nuevas oficinas de Von Wobeser y Sierra",
      scroll: "scroll",
    },
  };

  const t = content[language];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
          data-testid="img-hero-background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/80 text-sm tracking-[0.3em] uppercase mb-8 font-sans"
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
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1 }}
        onClick={scrollToNews}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
        data-testid="button-scroll-down"
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
