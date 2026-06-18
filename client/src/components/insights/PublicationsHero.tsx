import { type ReactNode } from "react";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * PublicationsHero — encabezado de las páginas de archivo (News / Articles)
 * en el look viejo de Von Wobeser.
 *
 * El sitio viejo usaba `.page__ttl--holder` con un span ROTADO 90° en rojo
 * corporativo (la etiqueta vertical "Publications"). Aquí lo recreamos: en
 * desktop el label aparece vertical a la izquierda; en móvil cae a horizontal
 * (igual que el media-query `max-width: 800px` del original).
 */

interface PublicationsHeroProps {
  /** Etiqueta vertical roja (p.ej. "Publications" / "Publicaciones"). */
  label: string;
  /** Título grande en Publico-Roman. */
  title: string;
  /** Subtítulo opcional. */
  subtitle?: string;
  /** Banner de traducción automática (opcional). */
  translationBanner?: ReactNode;
  testId?: string;
}

export function PublicationsHero({
  label,
  title,
  subtitle,
  translationBanner,
  testId,
}: PublicationsHeroProps) {
  const fadeRef = useFadeOnScroll<HTMLDivElement>();

  return (
    <section className="vw-wrap pt-[91px] pb-12" data-testid={testId}>
      <div
        ref={fadeRef}
        className="vw-fade flex flex-wrap items-start"
      >
        {/* Etiqueta vertical roja (rotada en desktop, horizontal en móvil) */}
        <div className="relative mr-0 mb-10 w-full max-[800px]:mb-6 min-[801px]:w-[90px] min-[801px]:mb-0">
          <div className="relative h-px w-px overflow-visible max-[800px]:h-auto max-[800px]:w-full">
            <span
              className="vw-label block whitespace-nowrap text-[17px] text-vw-red max-[800px]:relative max-[800px]:transform-none min-[801px]:absolute min-[801px]:origin-top-left min-[801px]:-rotate-90 min-[801px]:[transform:rotate(-90deg)_translateX(-100%)] min-[801px]:text-right"
              data-testid="text-publications-label"
            >
              {label}
            </span>
          </div>
        </div>

        {/* Bloque de título */}
        <div className="min-w-0 flex-1">
          <h1
            className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.05] text-vw-gray"
            data-testid="text-publications-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-5 max-w-2xl text-[18px] leading-relaxed text-vw-gray/80"
              data-testid="text-publications-subtitle"
            >
              {subtitle}
            </p>
          )}
          {translationBanner && (
            <p
              className="mt-4 max-w-2xl text-[14px] text-vw-graylight"
              data-testid="text-translation-banner"
            >
              {translationBanner}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default PublicationsHero;
