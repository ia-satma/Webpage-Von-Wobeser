import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * CapabilityHero — encabezado de página de Capacidades en el look viejo.
 *
 * Replica el patrón `.page__ttl` / `.single__meta` del mirror Joomla beez3:
 * un eyebrow Geomanist (uppercase, letter-spacing) sobre el título grande en
 * Publico-Roman, con borde inferior rojo corporativo. Opcionalmente muestra un
 * enlace "volver" (detalle) y un subtítulo.
 *
 * Tokens: usa `.vw-wrap`, `.vw-label`, `.vw-section-title` (index.css) y
 * `useFadeOnScroll` para la aparición .fade_JS del sitio viejo.
 */

interface CapabilityHeroProps {
  /** Eyebrow superior (uppercase, Geomanist). Ej: "CAPABILITIES". */
  eyebrow?: string;
  /** Título principal (Publico-Roman, borde rojo). */
  title: ReactNode;
  /** Subtítulo / intro debajo del título. */
  subtitle?: ReactNode;
  /** Enlace de retorno (texto). Si se da `backHref`, se renderiza. */
  backLabel?: string;
  backHref?: string;
  /** Contenido extra a la derecha del título (icono, badge translating). */
  trailing?: ReactNode;
  testId?: string;
}

export default function CapabilityHero({
  eyebrow,
  title,
  subtitle,
  backLabel,
  backHref,
  trailing,
  testId,
}: CapabilityHeroProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  return (
    <section className="bg-white pt-16 pb-10 lg:pt-24 lg:pb-12" data-testid={testId}>
      <div className="vw-wrap">
        <div ref={ref} className="vw-fade">
          {backHref && backLabel && (
            <Link
              href={backHref}
              className="mb-6 inline-flex items-center gap-2 text-sm text-vw-gray transition-colors hover:text-vw-red"
              data-testid="link-capability-back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Link>
          )}

          {eyebrow && (
            <p className="vw-label mb-5 text-xs text-vw-red" data-testid="text-capability-eyebrow">
              {eyebrow}
            </p>
          )}

          <h1 className="vw-section-title flex flex-wrap items-baseline gap-x-4 pb-4 text-vw-black">
            <span className="font-serif">{title}</span>
            {trailing}
          </h1>

          {subtitle && (
            <p
              className="mt-5 max-w-3xl font-sans text-lg leading-relaxed text-vw-gray"
              data-testid="text-capability-subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
