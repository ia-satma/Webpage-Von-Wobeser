import { type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Slider from "@/components/layout/Slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import type { PracticeGroup } from "@shared/schema";
import { getPracticeImage } from "@/lib/practiceIndustryImages";

/**
 * PracticesSlider — carrusel a sangre completa de las áreas de práctica
 * (`.home__slider` con `practica_ipad`) del home viejo de Von Wobeser.
 *
 * Cada slide: número grande + nombre de práctica + enlace SEE MORE sobre una
 * imagen de fondo oscurecida. La primera diapositiva es el "intro" con el
 * conteo total de prácticas. Usa el <Slider> de la fundación.
 *
 * Datos data-driven desde la API (`/api/practice-groups`); cada slide enlaza a
 * su detalle `/practice-groups/${slug}`. El idioma se resuelve con getDisplayValue.
 */

type SliderCopy = {
  countLabel: string;
  seeMore: string;
  ariaLabel: string;
};

const copy: Record<string, SliderCopy> = {
  en: {
    countLabel: "Practices",
    seeMore: "SEE MORE",
    ariaLabel: "Practice areas carousel",
  },
  es: {
    countLabel: "Áreas de práctica",
    seeMore: "VER MÁS",
    ariaLabel: "Carrusel de áreas de práctica",
  },
};

function SlideShell({ children, image }: { children: ReactNode; image?: string }) {
  return (
    <div
      className="relative flex h-[60vh] min-h-[420px] w-full items-center justify-center bg-vw-gray bg-cover bg-center"
      style={image ? { backgroundImage: `url("${image}")` } : undefined}
    >
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

  const { data } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const groups = data ?? [];

  // Mientras carga (sin datos), no rompemos: dejamos solo el slide intro con 0.
  const introSlide = (
    <SlideShell key="intro">
      <span className="block font-serif text-[120px] leading-none md:text-[150px]">
        {groups.length}
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

  const practiceSlides = groups.map((group, i) => {
    const name = getDisplayValue(group, "name", language);
    const image = getPracticeImage(group.slug, group.imageUrl);
    return (
      <SlideShell key={group.id} image={image}>
        <span className="block font-serif text-[90px] leading-none md:text-[110px]">
          {i + 1}
        </span>
        <span className="mt-2 block font-serif text-[28px] leading-tight md:text-[34px]">
          {name}
        </span>
        <Link
          href={`/practice-groups/${group.slug}`}
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
