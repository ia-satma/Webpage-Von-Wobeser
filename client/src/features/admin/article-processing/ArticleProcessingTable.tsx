import { FilePlus2, Loader2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatArticleDate } from "./helpers";
import { ArticleTranslationBadge } from "./ArticleTranslationBadge";
import type { ArticleProcessingController } from "./useArticleProcessingController";

export function ArticleProcessingTable({
  controller,
}: {
  controller: ArticleProcessingController;
}) {
  const { copy, draftCopy, news } = controller;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {controller.newsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-articles">
            {copy.noArticles}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.titleColumn}</TableHead>
                <TableHead>{copy.date}</TableHead>
                <TableHead>{copy.translationsCount}</TableHead>
                <TableHead className="text-right">{copy.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((article) => {
                const isDraft = article.published === false;
                const isCreatingDraft = controller.creatingDraftArticleId === article.id;
                return (
                  <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                    <TableCell
                      className="font-medium max-w-md truncate"
                      data-testid={`text-title-${article.id}`}
                    >
                      {controller.language === "es" ? article.titleEs : article.title}
                    </TableCell>
                    <TableCell data-testid={`text-date-${article.id}`}>
                      {formatArticleDate(article.date, controller.language)}
                    </TableCell>
                    <TableCell data-testid={`badge-translations-${article.id}`}>
                      <ArticleTranslationBadge
                        count={controller.translationCounts[article.id] || 0}
                        copy={copy}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant={isDraft ? "secondary" : "default"}>
                          {isDraft ? draftCopy.draft : draftCopy.published}
                        </Badge>
                        {isDraft ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => controller.processArticleMutation.mutate({
                              articleId: article.id,
                              title: (controller.language === "es" ? article.titleEs : article.title)
                                || "Article",
                            })}
                            disabled={
                              controller.processingArticleId === article.id
                              || controller.batchProgress.isProcessing
                            }
                            data-testid={`button-process-${article.id}`}
                          >
                            {controller.processingArticleId === article.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {copy.processing}
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                {draftCopy.processDraft}
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => controller.createProcessingDraftMutation.mutate(article)}
                            disabled={isCreatingDraft || controller.batchProgress.isProcessing}
                            data-testid={`button-create-processing-draft-${article.id}`}
                          >
                            {isCreatingDraft ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {draftCopy.creatingDraft}
                              </>
                            ) : (
                              <>
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                {draftCopy.createDraft}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
