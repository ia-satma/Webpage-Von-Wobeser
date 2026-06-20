import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import type { TeamMember } from "@shared/schema";

/**
 * AuthorLink — autor enlazado de una publicación, en el look viejo.
 *
 * El detalle viejo usaba una columna gris con tipografía Geomanist para los
 * nombres/roles de los abogados. Aquí mostramos el autor como una entrada de
 * lista enlazada a su ficha (/team/:slug): nombre en serif + cargo en
 * Geomanist uppercase, con hover rojo corporativo. El cargo se resuelve por
 * idioma de forma estática (titleEs en es, title en en) vía getDisplayValue.
 */

interface AuthorLinkProps {
  author: TeamMember;
}

export function AuthorLink({ author }: AuthorLinkProps) {
  const { language } = useLanguage();

  const displayTitle = getDisplayValue(author, "title", language) ?? "";

  return (
    <Link
      href={`/team/${author.slug}`}
      className="group block border-t border-vw-graylight py-4"
      data-testid={`link-author-${author.slug}`}
    >
      <span
        className="block font-serif text-[19px] leading-tight text-vw-gray transition-colors duration-200 group-hover:text-vw-red"
        data-testid={`text-author-name-${author.slug}`}
      >
        {author.name}
      </span>
      <span
        className="vw-label mt-1 flex items-center gap-2 text-[13px] text-vw-gray/80"
        data-testid={`text-author-title-${author.slug}`}
      >
        {displayTitle}
      </span>
    </Link>
  );
}

export default AuthorLink;
