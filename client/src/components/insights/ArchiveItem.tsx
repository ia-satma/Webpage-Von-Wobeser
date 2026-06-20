import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import type { News } from "@shared/schema";

/**
 * ArchiveItem — recreación del patrón `.archive__item` del sitio viejo de
 * Von Wobeser (mirror Joomla beez3, /publications/news y /publications/articles).
 *
 * Estructura del look viejo:
 *   - Título en Publico-Roman (~25px), hover → rojo corporativo #ac162c.
 *   - Fecha en Geomanist uppercase, letter-spacing 5px, color gris.
 *   - Intro/excerpt justificado con guiones (hyphens: auto).
 *   - Botón "Leer más" alineado a la derecha con línea decorativa gris
 *     (`.archive__item--btn:before`).
 *
 * i18n estático EN/ES: título/excerpt se resuelven por idioma con
 * getDisplayValue (titleEs/excerptEs en es, title/excerpt en en).
 */

interface ArchiveItemProps {
  article: News;
  readMoreText: string;
  /** etiqueta de idioma para formatear la fecha (es-MX, en-US, …) */
  dateLocale: string;
}

export function ArchiveItem({ article, readMoreText, dateLocale }: ArchiveItemProps) {
  const { language } = useLanguage();

  const displayTitle = getDisplayValue(article, "title", language) ?? "";
  const displayExcerpt = getDisplayValue(article, "excerpt", language) ?? "";

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    // El look viejo muestra "Month, Year" (p.ej. "June, 2026").
    return d.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
  };

  return (
    <article
      className="block w-full"
      data-testid={`archive-item-${article.slug}`}
    >
      {/* Título — Publico-Roman, hover rojo corporativo */}
      <Link href={`/news/${article.slug}`}>
        <h2
          className="font-serif text-[25px] leading-[1.15] text-vw-gray transition-colors duration-200 hover:text-vw-red max-[800px]:text-[21px]"
          data-testid={`text-archive-title-${article.slug}`}
        >
          {displayTitle}
        </h2>
      </Link>

      {/* Fecha — Geomanist uppercase, letter-spacing 5px, gris */}
      <div
        className="vw-label mb-6 mt-2 flex items-center gap-2 text-[16px] text-vw-gray"
        data-testid={`text-archive-date-${article.slug}`}
      >
        {formatDate(article.date)}
      </div>

      {/* Intro/excerpt — justificado con guiones */}
      <p
        className="mb-8 text-justify text-[17px] leading-relaxed text-vw-gray [hyphens:auto]"
        data-testid={`text-archive-excerpt-${article.slug}`}
      >
        {displayExcerpt}
      </p>

      {/* "Leer más" — alineado a la derecha con línea decorativa */}
      <Link
        href={`/news/${article.slug}`}
        className="group relative block w-full"
        data-testid={`link-archive-readmore-${article.slug}`}
      >
        {/* Línea decorativa: empieza a la izquierda, deja sitio al texto */}
        <span
          className="absolute left-0 top-1/2 hidden h-px w-[calc(100%-220px)] -translate-y-1/2 bg-vw-graylight sm:inline-block"
          aria-hidden="true"
        />
        <span className="vw-label relative block text-right text-[16px] leading-none text-vw-gray transition-colors duration-200 group-hover:text-vw-red">
          {readMoreText}
        </span>
      </Link>
    </article>
  );
}

export default ArchiveItem;
