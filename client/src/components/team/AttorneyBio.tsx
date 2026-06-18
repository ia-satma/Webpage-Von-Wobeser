import { Loader2 } from "lucide-react";

/**
 * AttorneyBio — columna de contenido del detalle de abogado (look viejo,
 * `.attorney__content`).
 *
 * Intro grande en serif (Publico, `font-serif`) seguido de los párrafos de la
 * biografía en Optima (`font-sans`). Replica la separación intro/cuerpo del
 * sitio viejo. La lógica de partición (primer párrafo = intro, resto = cuerpo)
 * se preserva: el contenedor parte `displayBio` por dobles saltos de línea.
 *
 * Maneja el estado de traducción en curso (spinner) igual que la página
 * original.
 */
export interface AttorneyBioProps {
  /** Primer párrafo: intro grande en serif. */
  intro: string;
  /** Párrafos restantes del cuerpo. */
  body?: string[];
  isTranslating?: boolean;
  /** Texto a mostrar mientras la traducción carga (i18n). */
  translationPendingLabel?: string;
}

export default function AttorneyBio({
  intro,
  body = [],
  isTranslating = false,
  translationPendingLabel,
}: AttorneyBioProps) {
  return (
    <div data-testid="container-biography">
      {/* Intro grande (Publico serif) */}
      <p
        className="font-serif text-[24px] leading-[1.45] text-vw-gray sm:text-[28px]"
        data-testid="lead-biography"
      >
        {intro}
        {isTranslating && (
          <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin text-vw-red/60" />
        )}
      </p>

      {/* Cuerpo de la biografía (Optima sans) */}
      {body.length > 0 && (
        <div className="mt-7 space-y-5">
          {body.map((paragraph, i) => (
            <p
              key={i}
              className="font-sans text-[16px] leading-[1.7] text-vw-gray/90"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Marcador de traducción pendiente */}
      {!intro && isTranslating && translationPendingLabel && (
        <div className="flex items-center gap-2 italic text-vw-gray/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span data-testid="text-translation-pending">{translationPendingLabel}</span>
        </div>
      )}
    </div>
  );
}
