import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * PageHero — encabezado de página del look viejo de Von Wobeser.
 *
 * Replica el `.page__ttl` del mirror Joomla beez3: un título grande
 * Publico-Roman con un label opcional (eyebrow) Geomanist uppercase encima
 * y un subtítulo Optima debajo. El conjunto vive sobre fondo blanco con
 * separación amplia (sección de apertura), dejando que el SiteHeader del
 * Layout quede arriba.
 *
 * No renderiza Header ni Footer (los aporta <Layout>).
 */
export interface PageHeroProps {
  /** Título principal (Publico-Roman, grande). */
  title: ReactNode;
  /** Label/eyebrow opcional (Geomanist uppercase). */
  eyebrow?: ReactNode;
  /** Subtítulo opcional (Optima, gris). */
  subtitle?: ReactNode;
  /** Alineación del contenido. Default: "left". */
  align?: "left" | "center";
  /** Clase extra para la sección. */
  className?: string;
  /** testid raíz. */
  "data-testid"?: string;
}

export default function PageHero({
  title,
  eyebrow,
  subtitle,
  align = "left",
  className,
  "data-testid": testId,
}: PageHeroProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  return (
    <section
      className={cn("bg-white pt-16 pb-10 md:pt-20 md:pb-12", className)}
      data-testid={testId}
    >
      <div className="vw-wrap">
        <div
          ref={ref}
          className={cn(
            "vw-fade",
            align === "center" && "text-center",
          )}
        >
          {eyebrow && (
            <span
              className="vw-label mb-4 inline-block text-xs text-vw-red md:text-sm"
              data-testid="page-hero-eyebrow"
            >
              {eyebrow}
            </span>
          )}
          <h1
            className="font-serif text-4xl leading-tight text-vw-black md:text-6xl"
            data-testid="page-hero-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "mt-5 max-w-3xl font-sans text-lg leading-relaxed text-vw-gray md:text-xl",
                align === "center" && "mx-auto",
              )}
              data-testid="page-hero-subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
