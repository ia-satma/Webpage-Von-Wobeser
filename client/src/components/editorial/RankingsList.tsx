import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export interface RankingItem {
  publication: string;
  ranking: string;
  rankingEs?: string;
  year?: string | number;
  badgeType?: string;
}

interface RankingsListProps {
  items: RankingItem[];
  language: string;
  getBadgeStyles?: (badgeType: any) => string;
  getBadgeIcon?: (badgeType: any) => ReactNode;
  testIdPrefix?: string;
}

export function RankingsList({
  items,
  language,
  getBadgeStyles,
  getBadgeIcon,
  testIdPrefix = "ranking",
}: RankingsListProps) {
  return (
    <ul className="divide-y divide-border border-y border-border" data-testid={`list-${testIdPrefix}s`}>
      {items.map((item, index) => {
        const displayRanking =
          language === "es" && item.rankingEs ? item.rankingEs : item.ranking;
        return (
          <li
            key={index}
            className="flex items-center justify-between gap-4 py-4 px-1 hover-elevate"
            data-testid={`${testIdPrefix}-${index}`}
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div
                className="w-2 h-2 bg-[#AA1A2E] shrink-0"
                aria-hidden="true"
              />
              <p
                className="text-foreground font-medium truncate"
                data-testid={`text-${testIdPrefix}-publication-${index}`}
              >
                {item.publication}
              </p>
              {item.year && (
                <span
                  className="hidden sm:inline text-[10px] text-muted-foreground tracking-[0.2em] uppercase shrink-0"
                  data-testid={`text-${testIdPrefix}-year-${index}`}
                >
                  {item.year}
                </span>
              )}
            </div>
            <Badge
              className={`rounded-none text-xs flex items-center gap-1 shrink-0 ${
                getBadgeStyles ? getBadgeStyles(item.badgeType) : "bg-[#AA1A2E] text-white border-0"
              }`}
              data-testid={`badge-${testIdPrefix}-${index}`}
            >
              {getBadgeIcon && getBadgeIcon(item.badgeType)}
              {displayRanking}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
