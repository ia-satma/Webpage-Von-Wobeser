import { type LucideIcon } from "lucide-react";

/**
 * FeatureCard — tarjeta de característica/servicio en el look viejo: número
 * grande en Publico-Roman rojo, icono, título uppercase (Geomanist) con línea
 * roja que se expande al hover, y cuerpo en OptimaLT. Usada en el German Desk
 * (highlights del equipo, áreas de práctica, diferenciadores).
 */

interface FeatureCardProps {
  index: number;
  title: string;
  body: string;
  icon?: LucideIcon;
  testId?: string;
}

export default function FeatureCard({
  index,
  title,
  body,
  icon: Icon,
  testId,
}: FeatureCardProps) {
  const padded = String(index + 1).padStart(2, "0");

  return (
    <article
      className="group flex h-full flex-col border border-vw-graylight bg-white p-6"
      data-testid={testId}
    >
      <div className="grid h-full grid-cols-[auto,1fr] gap-x-5">
        <span className="font-serif text-3xl font-light leading-none text-vw-red sm:text-4xl">
          {padded}
        </span>
        <div className="flex min-w-0 flex-col">
          {Icon && (
            <Icon className="mb-3 h-5 w-5 text-vw-red" strokeWidth={1.5} aria-hidden="true" />
          )}
          <h3 className="vw-label text-sm text-vw-black">{title}</h3>
          <span className="mt-3 mb-4 block h-px w-10 bg-vw-red transition-all duration-300 group-hover:w-16" />
          <p className="font-sans text-sm leading-relaxed text-vw-gray">{body}</p>
        </div>
      </div>
    </article>
  );
}
