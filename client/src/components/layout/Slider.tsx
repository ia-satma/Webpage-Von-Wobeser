import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

/**
 * Slider — wrapper de carrusel del shell viejo de Von Wobeser.
 *
 * Implementado sobre `embla-carousel-react` (ya presente en package.json,
 * sin dependencias nuevas). Provee autoplay opcional, loop, dots e
 * indicadores accesibles, replicando el slider del home del sitio viejo.
 *
 * Recibe `slides` (array de nodos) y los renderiza cada uno en su track.
 */

export interface SliderProps {
  /** Diapositivas a renderizar (cada una ocupa el 100% del viewport). */
  slides: ReactNode[];
  /** Autoplay activo. Default: true. */
  autoplay?: boolean;
  /** Intervalo de autoplay en ms. Default: 6000. */
  intervalMs?: number;
  /** Loop infinito. Default: true. */
  loop?: boolean;
  /** Mostrar puntos de navegación. Default: true. */
  showDots?: boolean;
  /** Clase extra para el contenedor raíz. */
  className?: string;
  /** Clase extra para cada slide. */
  slideClassName?: string;
  /** Etiqueta accesible del carrusel. */
  ariaLabel?: string;
}

export default function Slider({
  slides,
  autoplay = true,
  intervalMs = 6000,
  loop = true,
  showDots = true,
  className,
  slideClassName,
  ariaLabel = "Carrusel",
}: SliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay (se pausa en hover y respeta movimiento reducido).
  useEffect(() => {
    if (!emblaApi || !autoplay || slides.length <= 1) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const clear = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    if (isHovered) {
      clear();
      return;
    }

    timerRef.current = setInterval(() => {
      if (!emblaApi) return;
      if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      else emblaApi.scrollTo(0);
    }, intervalMs);

    return clear;
  }, [emblaApi, autoplay, intervalMs, isHovered, slides.length]);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="vw-slider"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={cn("min-w-0 flex-[0_0_100%]", slideClassName)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${slides.length}`}
              data-testid={`vw-slide-${i}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              aria-current={i === selectedIndex}
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-white/70 transition-all",
                i === selectedIndex
                  ? "bg-vw-red border-vw-red w-6"
                  : "bg-white/40 hover:bg-white/70",
              )}
              data-testid={`vw-slider-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
