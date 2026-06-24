import { useCallback, useRef, type RefCallback } from "react";

/**
 * useFadeOnScroll — replica del comportamiento `.fade_JS` / `.faded` del
 * sitio viejo de Von Wobeser (mirror Joomla beez3).
 *
 * Devuelve un **callback ref**: se engancha al elemento cuando éste se monta,
 * incluso si se renderiza más tarde (p.ej. tras cargar datos async). La versión
 * anterior usaba useEffect+useRef y corría una sola vez al montar el componente;
 * si el nodo se renderizaba después (bio del abogado tras el fetch), el observer
 * nunca se enganchaba y el contenido quedaba atascado en opacity:0 ("en blanco").
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
): RefCallback<T> {
  const {
    addedClassName = "vw-faded",
    threshold = 0.15,
    rootMargin = "0px 0px -10% 0px",
    once = true,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);

  return useCallback(
    (node: T | null) => {
      // Limpia el observer previo (nodo desmontado o reemplazado).
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      // SSR / sin soporte o movimiento reducido: revela de inmediato.
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (typeof IntersectionObserver === "undefined" || prefersReducedMotion) {
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
      observerRef.current = observer;

      // Revela de inmediato lo que YA está (parcial o totalmente) en el viewport
      // al montar: el IntersectionObserver no siempre dispara para contenido
      // above-the-fold en la carga inicial.
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh && rect.bottom > 0) {
        node.classList.add(addedClassName);
        if (once) observer.unobserve(node);
      }
    },
    [addedClassName, threshold, rootMargin, once],
  );
}

export default useFadeOnScroll;
