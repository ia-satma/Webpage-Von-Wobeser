import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * CapabilityCard — tarjeta de práctica/industria al estilo del slider de
 * capacidades del sitio viejo (`.capabilities__slide`): imagen de fondo a
 * pantalla completa de la tarjeta, capa oscura, y el título sobre la imagen.
 *
 * En el mirror el título flota en blanco sobre la foto con una transición de
 * desplazamiento al hover. Aquí lo recreamos con la foto en escala de grises en
 * reposo que vira a color al hover (patrón de la home recreada), título en
 * Publico-Roman y subrayado/acento rojo corporativo (#ac162c).
 */

interface CapabilityCardProps {
  href: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  /** Indicador de traducción en curso (esquina superior). */
  isTranslating?: boolean;
  testId?: string;
}

export default function CapabilityCard({
  href,
  title,
  description,
  imageUrl,
  isTranslating = false,
  testId,
}: CapabilityCardProps) {
  const [isHover, setIsHover] = useState(false);

  return (
    <Link href={href}>
      <article
        className="group relative block aspect-[4/5] h-full cursor-pointer overflow-hidden bg-vw-black"
        data-testid={testId}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        {/* Imagen de fondo — gris en reposo, color al hover */}
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            filter: isHover ? "grayscale(0%)" : "grayscale(100%)",
            transform: isHover ? "scale(1.04)" : "scale(1)",
            transition:
              "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Capa oscura para legibilidad */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isHover
              ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.25) 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 100%)",
            transition: "background 0.5s ease",
          }}
        />

        {isTranslating && (
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1 bg-black/60 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )}

        {/* Contenido inferior */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-6 lg:p-7">
          <span
            aria-hidden="true"
            className="mb-4 block h-px bg-vw-red transition-all duration-500"
            style={{ width: isHover ? "56px" : "32px" }}
          />
          <h3
            className="font-serif text-xl leading-snug text-white lg:text-2xl"
            data-testid="text-capability-title"
          >
            {title}
          </h3>
          {description && (
            <p className="mt-3 line-clamp-2 font-sans text-sm leading-relaxed text-white/70">
              {description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
