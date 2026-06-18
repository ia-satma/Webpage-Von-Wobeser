import { type ReactNode } from "react";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * CapabilityGrid — rejilla de tarjetas de capacidades (prácticas/industrias).
 *
 * En el sitio viejo las capacidades vivían en un slider; en la recreación
 * editable las presentamos como una rejilla de tarjetas (`CapabilityCard`),
 * conservando el look (foto + título sobre la imagen) pero más usable y
 * accesible. Envuelve en `.vw-wrap` y aplica el fade .fade_JS al contenedor.
 */

interface CapabilityGridProps {
  children: ReactNode;
  testId?: string;
}

export default function CapabilityGrid({ children, testId }: CapabilityGridProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  return (
    <section className="bg-white pb-20 pt-4 lg:pb-28" data-testid={testId}>
      <div className="vw-wrap">
        <div
          ref={ref}
          className="vw-fade grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
