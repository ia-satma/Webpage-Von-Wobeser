import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import type { News } from "@shared/schema";
import heroVideo from "@assets/dron_1764710361340.mp4";
import heroImage from "@assets/hero_office.jpg";

/**
 * HeroSection — hero a pantalla completa del home viejo de Von Wobeser.
 *
 * Recrea `.home__hero` del mirror Joomla/beez3:
 *  - Video (o imagen en móvil) a pantalla completa con `object-fit:cover`.
 *  - Panel flotante de NEWS (`.covid_cont`) arriba-izquierda con las 2
 *    últimas noticias, separadas por una línea vertical.
 *  - Indicador "Scroll" centrado abajo (`.home__hero--scroll`).
 *
 * Preserva el data-fetching original: `/api/news` (las 2 más recientes).
 * NO renderiza header/footer (los provee <Layout>).
 */

type HeroLabels = {
  news: string;
  seeMore: string;
  scroll: string;
  ariaLabel: string;
  scrollAriaLabel: string;
  videoLabel: string;
  imageLabel: string;
};

const heroLabels: Record<string, HeroLabels> = {
  en: {
    news: "news",
    seeMore: "SEE MORE",
    scroll: "Scroll",
    ariaLabel: "Main welcome section",
    scrollAriaLabel: "Scroll down to the next section",
    videoLabel: "Aerial view of Von Wobeser y Sierra offices in Mexico City",
    imageLabel: "Von Wobeser y Sierra headquarters building",
  },
  es: {
    news: "noticias",
    seeMore: "VER MÁS",
    scroll: "Scroll",
    ariaLabel: "Sección principal de bienvenida",
    scrollAriaLabel: "Desplazarse a la siguiente sección",
    videoLabel: "Vista aérea de las oficinas de Von Wobeser y Sierra en Ciudad de México",
    imageLabel: "Edificio de la sede de Von Wobeser y Sierra",
  },
};

function HeroNewsItem({
  item,
  language,
  seeMore,
  withDivider,
}: {
  item: News;
  language: string;
  seeMore: string;
  withDivider: boolean;
}) {
  const title = language === "es" ? item.titleEs || item.title : item.title || item.titleEs;

  return (
    <div
      className={
        "flex-1 px-3 first:ps-0 last:pe-0 " +
        (withDivider ? "border-e border-vw-gray/40" : "")
      }
      data-testid={`hero-news-${item.id}`}
    >
      <Link
        href={`/news/${item.slug}`}
        className="no-underline"
        data-testid={`link-hero-news-${item.id}`}
      >
        <h3 className="mb-3 font-serif text-[15px] font-medium leading-snug text-vw-gray transition-colors hover:text-vw-red">
          {title}
        </h3>
      </Link>
      <Link
        href="/news"
        className="vw-label text-[11px] font-bold text-vw-red no-underline hover:underline"
        data-testid={`link-hero-news-more-${item.id}`}
      >
        {seeMore}
      </Link>
    </div>
  );
}

export default function HeroSection() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const { data: newsData } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = heroLabels[language] || heroLabels.en;
  const news = (newsData ?? []).slice(0, 2);

  const scrollDown = () => {
    const el = document.querySelector("#home-intro");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative h-screen min-h-[560px] w-full overflow-hidden bg-vw-gray"
      aria-label={t.ariaLabel}
      data-testid="section-hero"
    >
      {/* Media de fondo a pantalla completa */}
      <div className="absolute inset-0 z-0">
        {isMobile ? (
          <img
            src={heroImage}
            alt={t.imageLabel}
            className="h-full w-full object-cover"
            loading="eager"
            data-testid="img-hero-mobile"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            aria-label={t.videoLabel}
            data-testid="video-hero"
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = "none";
            }}
          >
            <source src={heroVideo} type="video/mp4" />
            <img src={heroImage} alt={t.imageLabel} className="h-full w-full object-cover" />
          </video>
        )}
        {/* Velo suave para legibilidad del panel de noticias */}
        <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />
      </div>

      {/* Panel de NEWS flotante (.covid_cont) */}
      {news.length > 0 && (
        <div
          className={
            "absolute left-8 top-8 z-20 hidden bg-white px-5 py-4 shadow-md transition-opacity duration-700 md:block " +
            (mounted ? "opacity-100" : "opacity-0")
          }
          style={{ width: 450, maxWidth: "calc(100vw - 4rem)" }}
          data-testid="panel-hero-news"
        >
          <div className="border-b-2 border-vw-red pb-1 text-center">
            <h2 className="vw-label text-[14px] font-bold text-vw-red">{t.news}</h2>
          </div>
          <div className="mt-5 flex">
            {news.map((item, i) => (
              <HeroNewsItem
                key={item.id}
                item={item}
                language={language}
                seeMore={t.seeMore}
                withDivider={i < news.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Indicador Scroll */}
      <button
        type="button"
        onClick={scrollDown}
        aria-label={t.scrollAriaLabel}
        className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/90 transition-colors hover:text-white"
        data-testid="button-hero-scroll"
      >
        <span className="vw-label text-[12px]">{t.scroll}</span>
        <motion.span
          className="block h-7 w-px bg-white/80"
          aria-hidden="true"
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </button>
    </section>
  );
}
