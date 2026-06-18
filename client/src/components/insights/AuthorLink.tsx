import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import type { TeamMember } from "@shared/schema";

/**
 * AuthorLink — autor enlazado de una publicación, en el look viejo.
 *
 * El detalle viejo usaba una columna gris con tipografía Geomanist para los
 * nombres/roles de los abogados. Aquí mostramos el autor como una entrada de
 * lista enlazada a su ficha (/team/:slug): nombre en serif + cargo en
 * Geomanist uppercase, con hover rojo corporativo. Preserva la traducción del
 * cargo vía useTranslatedContent (contentType 'team_member'), tal como el
 * detalle actual.
 */

interface AuthorLinkProps {
  author: TeamMember;
}

export function AuthorLink({ author }: AuthorLinkProps) {
  const { language } = useLanguage();

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: "team_member",
    entityId: author.id.toString(),
    fields: {
      title: author.title,
      titleEs: author.titleEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayTitle = translatedFields.title || author.title;

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
        {isTranslating && (
          <Loader2 className="h-3 w-3 animate-spin text-vw-gray/50" aria-hidden="true" />
        )}
      </span>
    </Link>
  );
}

export default AuthorLink;
