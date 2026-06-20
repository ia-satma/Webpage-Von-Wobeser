import { type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Slider from "@/components/layout/Slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import type { IndustryGroup } from "@shared/schema";

/**
 * IndustriesSlider — segundo carrusel a sangre completa del home viejo
 * (`.home__slider` con los Industry Groups). Mismo patrón visual que el
 * de prácticas: slide intro con el conteo seguido de los grupos numerados.
 *
 * Datos data-driven desde la API (`/api/industry-groups`); cada slide enlaza a
 * su detalle `/industry-groups/${slug}`. El idioma se resuelve con getDisplayValue.
 */

type SliderCopy = {
  countLabel: string;
  seeMore: string;
  ariaLabel: string;
};

const copy: Record<string, SliderCopy> = {
  en: {
    countLabel: "Industry Groups",
    seeMore: "SEE MORE",
    ariaLabel: "Industry groups carousel",
  },
  es: {
    countLabel: "Grupos de Industria",
    seeMore: "VER MÁS",
    ariaLabel: "Carrusel de grupos de industria",
  },
};

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

export default function IndustriesSlider() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;

  const { data } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const groups = data ?? [];

  const introSlide = (
    <SlideShell key="intro">
      <span className="block font-serif text-[120px] leading-none md:text-[150px]">
        {groups.length}
      </span>
      <span className="vw-label mt-2 block text-[22px]">{t.countLabel}</span>
      <Link
        href="/industry-groups"
        className="vw-label mt-6 inline-block text-[13px] font-bold text-white no-underline hover:underline"
        data-testid="link-industries-intro"
      >
        {t.seeMore}
      </Link>
    </SlideShell>
  );

  const industrySlides = groups.map((group, i) => {
    const name = getDisplayValue(group, "name", language);
    return (
      <SlideShell key={group.id}>
        <span className="block font-serif text-[90px] leading-none md:text-[110px]">
          {i + 1}
        </span>
        <span className="mt-2 block font-serif text-[28px] leading-tight md:text-[34px]">
          {name}
        </span>
        <Link
          href={`/industry-groups/${group.slug}`}
          className="vw-label mt-6 inline-block text-[13px] font-bold text-white no-underline hover:underline"
          data-testid={`link-industry-${i + 1}`}
        >
          {t.seeMore}
        </Link>
      </SlideShell>
    );
  });

  return (
    <section className="bg-vw-gray" data-testid="section-industries-slider">
      <Slider
        slides={[introSlide, ...industrySlides]}
        ariaLabel={t.ariaLabel}
        autoplay
        intervalMs={4500}
        loop
        showDots
      />
    </section>
  );
}
