import { ArchiveList } from "./ArchiveList";
import type { News } from "@shared/schema";

/**
 * ArticleList — listado de artículos en el look viejo.
 *
 * Los artículos comparten la misma presentación "archive" que las noticias en
 * el sitio viejo (/publications/articles usaba el mismo patrón `.archive__item`
 * que /publications/news). Reutilizamos ArchiveList para no duplicar el markup;
 * este componente existe como punto de extensión por si los artículos
 * divergen visualmente más adelante.
 */

interface ArticleListProps {
  items: News[];
  readMoreText: string;
  dateLocale: string;
}

export function ArticleList({ items, readMoreText, dateLocale }: ArticleListProps) {
  return (
    <ArchiveList items={items} readMoreText={readMoreText} dateLocale={dateLocale} />
  );
}

export default ArticleList;
