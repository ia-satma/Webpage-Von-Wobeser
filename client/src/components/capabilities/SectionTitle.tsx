import { type ReactNode } from "react";

/**
 * SectionTitle — título de sección con borde inferior rojo corporativo.
 *
 * Replica el patrón de encabezados de las páginas de detalle del sitio viejo
 * (`.single__content` con títulos en Publico-Roman y la línea roja #ac162c).
 * Reusa la utilidad `.vw-section-title` definida en index.css.
 */

interface SectionTitleProps {
  children: ReactNode;
  /** Eyebrow Geomanist sobre el título (opcional). */
  eyebrow?: string;
  className?: string;
  testId?: string;
}

export default function SectionTitle({
  children,
  eyebrow,
  className = "",
  testId,
}: SectionTitleProps) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="vw-label mb-3 text-xs text-vw-red">{eyebrow}</p>
      )}
      <h2 className="vw-section-title pb-3 text-vw-black" data-testid={testId}>
        {children}
      </h2>
    </div>
  );
}
