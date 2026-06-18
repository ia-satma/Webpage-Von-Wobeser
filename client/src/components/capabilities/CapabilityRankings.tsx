import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import SectionTitle from "./SectionTitle";

/**
 * CapabilityRankings — listado de rankings/reconocimientos (Chambers, Legal 500,
 * etc.) en el look viejo: filas con un acento rojo, la publicación en
 * Publico-Roman, el año como label Geomanist y el rango como etiqueta roja.
 *
 * Preserva los datos de rankings que ya manejaba la página de detalle.
 */

export interface CapabilityRankingItem {
  publication: string;
  ranking: string;
  rankingEs: string;
  year: string;
  badgeType: string;
}

interface CapabilityRankingsProps {
  items: CapabilityRankingItem[];
  language: string;
  title: string;
  subtitle: string;
}

export default function CapabilityRankings({
  items,
  language,
  title,
  subtitle,
}: CapabilityRankingsProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  return (
    <section className="bg-vw-graylight/20 py-16 lg:py-20" data-testid="section-rankings">
      <div className="vw-wrap max-w-4xl">
        <div ref={ref} className="vw-fade">
          <SectionTitle eyebrow={subtitle} testId="text-rankings-title">
            {title}
          </SectionTitle>
          <ul className="mt-8 divide-y divide-vw-graylight border-y border-vw-graylight">
            {items.map((item, index) => {
              const displayRanking =
                language === "es" && item.rankingEs ? item.rankingEs : item.ranking;
              return (
                <li
                  key={index}
                  className="flex items-center justify-between gap-4 py-4 pl-1"
                  data-testid={`ranking-row-${index}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="h-2 w-2 shrink-0 bg-vw-red" aria-hidden="true" />
                    <p className="truncate font-serif text-base text-vw-black">
                      {item.publication}
                    </p>
                    {item.year && (
                      <span className="hidden shrink-0 vw-label text-[10px] text-vw-gray sm:inline">
                        {item.year}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 border border-vw-red px-3 py-1 vw-label text-[10px] text-vw-red">
                    {displayRanking}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
