import { useEffect, useRef, type RefObject } from "react";

/**
 * useFadeOnScroll — replica del comportamiento `.fade_JS` / `.faded` del
 * sitio viejo de Von Wobeser (mirror Joomla beez3).
 *
 * El viejo añadía la clase `.faded` a los elementos al entrar en viewport,
 * disparando una transición de opacity + translateY. Aquí usamos un
 * IntersectionObserver y añadimos `addedClassName` (por defecto `vw-faded`).
 *
 * Uso:
 *   const ref = useFadeOnScroll<HTMLDivElement>();
 *   <div ref={ref} className="vw-fade">...</div>
 *
 * Las clases `.vw-fade` / `.vw-faded` viven en index.css.
 */

export interface UseFadeOnScrollOptions {
  /** Clase que se añade al cruzar el umbral. Default: "vw-faded". */
  addedClassName?: string;
  /** Fracción visible para disparar (0–1). Default: 0.15. */
  threshold?: number;
  /** Margen del root (estilo CSS). Default: "0px 0px -10% 0px". */
  rootMargin?: string;
  /** Si true, se observa una sola vez (no revierte al salir). Default: true. */
  once?: boolean;
}

export function useFadeOnScroll<T extends HTMLElement = HTMLElement>(
  options: UseFadeOnScrollOptions = {},
): RefObject<T> {
  const {
    addedClassName = "vw-faded",
    threshold = 0.15,
    rootMargin = "0px 0px -10% 0px",
    once = true,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // SSR / navegadores sin soporte: mostrar de inmediato.
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add(addedClassName);
      return;
    }

    // Respeta la preferencia de movimiento reducido: revela sin animar.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      node.classList.add(addedClassName);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(addedClassName);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove(addedClassName);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [addedClassName, threshold, rootMargin, once]);

  return ref;
}

export default useFadeOnScroll;
