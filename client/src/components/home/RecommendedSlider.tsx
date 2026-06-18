import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import Slider from "@/components/layout/Slider";

import badgeChambersGlobal from "@assets/Agosto156x156_chambers_global25-1_1764817346699.png";
import badgeLatAm from "@assets/LatAm_2026_156px_1764817346700.png";
import badgeLL250 from "@assets/156x156_chambers_LL250png_1764817346699.png";
import badgeChambersLatam from "@assets/Agosto156x156_chambers_LATAM26_1764817346699.png";

/**
 * RecommendedSlider — sección RECOGNITIONS del home viejo (`.home__rec`):
 * título, intro, lista de instituciones y un carrusel de sellos/logos
 * (`.home__rec--slider home_rec_JS`).
 *
 * El viejo mostraba 5 logos a la vez en bucle. Reagrupamos los sellos en
 * slides de varios logos cada uno (responsivo) y los pasamos al <Slider>.
 *
 * Contenido estático de marca (no requiere data-fetching).
 */

const badges = [
  { src: badgeChambersGlobal, alt: "Chambers & Partners Global" },
  { src: badgeLatAm, alt: "Chambers & Partners Latin America 2026" },
  { src: badgeLL250, alt: "Latin Lawyer 250" },
  { src: badgeChambersLatam, alt: "Chambers & Partners Latin America" },
];

type RecCopy = {
  title: string;
  intro: string;
  institutions: string;
  ariaLabel: string;
};

const copy: Record<string, RecCopy> = {
  en: {
    title: "RECOGNITIONS",
    intro:
      "Von Wobeser y Sierra, S.C. has been recognized at an international level by various institutions including",
    institutions:
      "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Lexology Index, LACCA, IFLR 1000, Best Lawyers and Benchmark Litigation, among others.",
    ariaLabel: "Recognitions logos carousel",
  },
  es: {
    title: "RECONOCIMIENTOS",
    intro:
      "Von Wobeser y Sierra, S.C. ha sido reconocida a nivel internacional por diversas instituciones, incluyendo",
    institutions:
      "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Lexology Index, LACCA, IFLR 1000, Best Lawyers y Benchmark Litigation, entre otras.",
    ariaLabel: "Carrusel de logos de reconocimientos",
  },
};

/** Agrupa los sellos en lotes para mostrar varios por diapositiva. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function RecommendedSlider() {
  const { language } = useLanguage();
  const ref = useFadeOnScroll<HTMLDivElement>();
  const t = copy[language] || copy.en;

  // Para dar sensación de carrusel infinito con pocos sellos, duplicamos.
  const loopBadges = [...badges, ...badges];
  const slides = chunk(loopBadges, 4).map((group, gi) => (
    <div
      key={gi}
      className="flex items-center justify-center gap-10 py-4"
      data-testid={`rec-slide-${gi}`}
    >
      {group.map((b, bi) => (
        <img
          key={`${gi}-${bi}`}
          src={b.src}
          alt={b.alt}
          className="h-[120px] w-[120px] object-contain md:h-[156px] md:w-[156px]"
          loading="lazy"
        />
      ))}
    </div>
  ));

  return (
    <section className="bg-white py-24 md:py-28" data-testid="section-recommended">
      <div className="vw-wrap">
        <div ref={ref} className="vw-fade mx-auto max-w-[940px] text-center">
          <h2 className="vw-label text-[26px] font-bold text-vw-gray">{t.title}</h2>
          <p className="mt-6 font-serif text-[20px] leading-relaxed text-vw-gray">
            <strong className="font-bold">{t.intro}</strong>
          </p>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-vw-gray/90">
            {t.institutions}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-[940px]">
          <Slider
            slides={slides}
            ariaLabel={t.ariaLabel}
            autoplay
            intervalMs={3500}
            loop
            showDots={false}
          />
        </div>
      </div>
    </section>
  );
}
