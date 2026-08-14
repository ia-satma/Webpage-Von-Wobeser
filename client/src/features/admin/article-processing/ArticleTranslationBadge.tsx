import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArticleProcessingCopy } from "./translations";

export function ArticleTranslationBadge({
  count,
  copy,
}: {
  count: number;
  copy: ArticleProcessingCopy;
}) {
  if (count === 0) return <Badge variant="outline">0 {copy.languages}</Badge>;
  if (count >= 9) {
    return (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {count} {copy.languages}
      </Badge>
    );
  }
  return <Badge variant="secondary">{count} {copy.languages}</Badge>;
}
