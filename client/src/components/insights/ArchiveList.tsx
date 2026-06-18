import { ArchiveItem } from "./ArchiveItem";
import type { News } from "@shared/schema";

/**
 * ArchiveList — columna del listado de publicaciones (look viejo).
 *
 * En el sitio viejo `.archive__list` era una columna estrecha (max ~575px)
 * desplazada a la derecha, y cada `.archive__item` tenía un gran margen
 * inferior (~150px). Recreamos esa columna y el ritmo vertical generoso.
 */

interface ArchiveListProps {
  items: News[];
  readMoreText: string;
  dateLocale: string;
}

export function ArchiveList({ items, readMoreText, dateLocale }: ArchiveListProps) {
  return (
    <div
      className="w-full max-w-[640px] min-[1081px]:ml-[100px]"
      data-testid="archive-list"
    >
      <div className="flex flex-col gap-24 max-[800px]:gap-16">
        {items.map((article) => (
          <ArchiveItem
            key={article.id}
            article={article}
            readMoreText={readMoreText}
            dateLocale={dateLocale}
          />
        ))}
      </div>
    </div>
  );
}

export default ArchiveList;
