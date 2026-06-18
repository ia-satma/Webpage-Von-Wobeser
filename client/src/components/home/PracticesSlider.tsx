import { type ReactNode } from "react";
import { Link } from "wouter";
import Slider from "@/components/layout/Slider";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * PracticesSlider — carrusel a sangre completa de las 18 áreas de práctica
 * (`.home__slider` con `practica_ipad`) del home viejo de Von Wobeser.
 *
 * Cada slide: número grande + nombre de práctica + enlace SEE MORE sobre una
 * imagen de fondo oscurecida. La primera diapositiva es el "intro" con el
 * conteo total ("18 / Practices"). Usa el <Slider> de la fundación.
 *
 * Contenido estático (catálogo de prácticas); rutas a /practices.
 */

type SliderCopy = {
  count: string;
  countLabel: string;
  seeMore: string;
  ariaLabel: string;
};

const copy: Record<string, SliderCopy> = {
  en: {
    count: "18",
    countLabel: "Practices",
    seeMore: "SEE MORE",
    ariaLabel: "Practice areas carousel",
  },
  es: {
    count: "18",
    countLabel: "Áreas de práctica",
    seeMore: "VER MÁS",
    ariaLabel: "Carrusel de áreas de práctica",
  },
};

/** Las 18 prácticas en el orden del home viejo. */
const practices: { en: string; es: string }[] = [
  { en: "Arbitration", es: "Arbitraje" },
  { en: "Banking & Finance", es: "Bancario y Financiero" },
  { en: "Bankruptcy & Restructuring", es: "Concursos y Reestructuras" },
  { en: "Competition & Antitrust", es: "Competencia Económica" },
  { en: "Corporate, Mergers & Acquisitions", es: "Corporativo, Fusiones y Adquisiciones" },
  { en: "Energy & Natural Resources", es: "Energía y Recursos Naturales" },
  { en: "Environmental", es: "Ambiental" },
  { en: "ESG (Environmental, Social and Governance)", es: "ESG (Ambiental, Social y Gobernanza)" },
  { en: "Immigration & Global Mobility", es: "Migración y Movilidad Global" },
  { en: "Industrial & Intellectual Property", es: "Propiedad Industrial e Intelectual" },
  { en: "International Trade & Customs", es: "Comercio Internacional y Aduanas" },
  { en: "Investigations, Anti-corruption & Compliance", es: "Investigaciones, Anticorrupción y Cumplimiento" },
  { en: "Labor, Executive Compensations & Benefits", es: "Laboral, Compensaciones y Beneficios" },
  { en: "Litigation", es: "Litigio" },
  { en: "Projects & Infrastructure", es: "Proyectos e Infraestructura" },
  { en: "Real Estate", es: "Inmobiliario" },
  { en: "TAX (Consultancy, Controversy & Litigation)", es: "Fiscal (Consultoría, Controversia y Litigio)" },
  { en: "Telecommunications, Media & Technology", es: "Telecomunicaciones, Medios y Tecnología" },
];

function SlideShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-[60vh] min-h-[420px] w-full items-center justify-center bg-vw-gray">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="vw-wrap relative z-10">
        <div className="mx-auto max-w-[940px] text-center text-white">{children}</div>
      </div>
    </div>
  );
}

export default function PracticesSlider() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;

  const introSlide = (
    <SlideShell key="intro">
      <span className="block font-serif text-[120px] leading-none md:text-[150px]">
        {t.count}
      </span>
      <span className="vw-label mt-2 block text-[22px]">{t.countLabel}</span>
      <Link
        href="/practice-groups"
        className="vw-label mt-6 inline-block text-[13px] font-bold text-white no-underline hover:underline"
        data-testid="link-practices-intro"
      >
        {t.seeMore}
      </Link>
    </SlideShell>
  );

  const practiceSlides = practices.map((p, i) => {
    const name = language === "es" ? p.es : p.en;
    return (
      <SlideShell key={p.en}>
        <span className="block font-serif text-[90px] leading-none md:text-[110px]">
          {i + 1}
        </span>
        <span className="mt-2 block font-serif text-[28px] leading-tight md:text-[34px]">
          {name}
        </span>
        <Link
          href="/practice-groups"
          className="vw-label mt-6 inline-block text-[13px] font-bold text-white no-underline hover:underline"
          data-testid={`link-practice-${i + 1}`}
        >
          {t.seeMore}
        </Link>
      </SlideShell>
    );
  });

  return (
    <section className="bg-vw-gray" data-testid="section-practices-slider">
      <Slider
        slides={[introSlide, ...practiceSlides]}
        ariaLabel={t.ariaLabel}
        autoplay
        intervalMs={4500}
        loop
        showDots
      />
    </section>
  );
}
