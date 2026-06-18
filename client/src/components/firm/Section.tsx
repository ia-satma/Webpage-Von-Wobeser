import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * Section — bloque de contenido del look viejo (Von Wobeser beez3).
 *
 * Aplica el contenedor `.vw-wrap` (1340px), el espaciado vertical generoso
 * del sitio viejo y el fade-on-scroll. Permite alternar fondo blanco/gris
 * con la prop `tone` para reproducir las secciones intercaladas.
 *
 * No renderiza Header/Footer.
 */
export interface SectionProps {
  children: ReactNode;
  /** Fondo: blanco o gris claro alterno. Default: "white". */
  tone?: "white" | "gray";
  /** Densidad del padding vertical. Default: "default". */
  size?: "default" | "compact" | "large";
  /** Activa el fade-on-scroll. Default: true. */
  fade?: boolean;
  /** Clase extra. */
  className?: string;
  /** Clase para el contenedor interno (.vw-wrap). */
  innerClassName?: string;
  /** testid raíz. */
  "data-testid"?: string;
  /** id de la sección (anclas). */
  id?: string;
}

const TONE: Record<NonNullable<SectionProps["tone"]>, string> = {
  white: "bg-white",
  gray: "bg-[#f4f4f4]",
};

const SIZE: Record<NonNullable<SectionProps["size"]>, string> = {
  compact: "py-10 md:py-12",
  default: "py-14 md:py-20",
  large: "py-16 md:py-24",
};

export default function Section({
  children,
  tone = "white",
  size = "default",
  fade = true,
  className,
  innerClassName,
  "data-testid": testId,
  id,
}: SectionProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  return (
    <section
      id={id}
      className={cn(TONE[tone], SIZE[size], className)}
      data-testid={testId}
    >
      <div
        ref={fade ? ref : undefined}
        className={cn("vw-wrap", fade && "vw-fade", innerClassName)}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * SectionTitle — título de sección Publico con borde inferior rojo (.vw-section-title).
 */
export function SectionTitle({
  children,
  className,
  "data-testid": testId,
}: {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <h2
      className={cn("vw-section-title text-vw-black", className)}
      data-testid={testId}
    >
      {children}
    </h2>
  );
}

/**
 * Label — eyebrow Geomanist uppercase rojo (.vw-label).
 */
export function Label({
  children,
  className,
  "data-testid": testId,
}: {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <span
      className={cn("vw-label text-xs text-vw-red md:text-sm", className)}
      data-testid={testId}
    >
      {children}
    </span>
  );
}
