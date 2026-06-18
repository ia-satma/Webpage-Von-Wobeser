import { type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * FeatureCard — tarjeta de contenido del look viejo de Von Wobeser.
 *
 * Tarjeta plana (sin sombras pesadas ni radios) con borde fino, ícono rojo
 * opcional, título Publico y cuerpo Optima. Se usa para valores, cultura,
 * iniciativas, beneficios y amenidades en las páginas de firma.
 */
export interface FeatureCardProps {
  /** Ícono (componente, p. ej. de lucide-react). */
  icon?: ElementType;
  /** Título de la tarjeta. */
  title: ReactNode;
  /** Cuerpo de la tarjeta. */
  children?: ReactNode;
  /** Clase extra. */
  className?: string;
  /** testid. */
  "data-testid"?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  children,
  className,
  "data-testid": testId,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "h-full border border-vw-graylight bg-white p-7 transition-colors hover:border-vw-red",
        className,
      )}
      data-testid={testId}
    >
      {Icon && (
        <Icon className="mb-4 h-7 w-7 text-vw-red" aria-hidden="true" />
      )}
      <h3 className="mb-3 font-serif text-xl leading-snug text-vw-black">
        {title}
      </h3>
      {children && (
        <div className="font-sans text-base leading-relaxed text-vw-gray">
          {children}
        </div>
      )}
    </div>
  );
}
