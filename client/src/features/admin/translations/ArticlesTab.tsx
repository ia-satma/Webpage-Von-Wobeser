import { CheckCircle, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { CONTENT_TYPES, SUPPORTED_LANGUAGES } from "./constants";
import { canTranslateArticle } from "./helpers";
import type { TranslationsController } from "./useTranslationsController";

export function ArticlesTab({ controller }: { controller: TranslationsController }) {
  const { copy, filteredArticles } = controller;
  return (
    <TabsContent value="articles" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{copy.articles}</CardTitle>
            <Select
              value={controller.contentTypeFilter}
              onValueChange={controller.setContentTypeFilter}
            >
              <SelectTrigger className="w-48" data-testid="select-content-type">
                <SelectValue placeholder={copy.filterByType} />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((contentType) => (
                  <SelectItem
                    key={contentType.value}
                    value={contentType.value}
                    data-testid={`option-type-${contentType.value}`}
                  >
                    {contentType.label[
                      controller.language as keyof typeof contentType.label
                    ] || contentType.label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {controller.translationCountsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-articles">
              {copy.noArticles}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.articleTitle}</TableHead>
                  <TableHead>{copy.contentType}</TableHead>
                  <TableHead>{copy.translationStatus}</TableHead>
                  <TableHead className="text-right">{copy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow
                    key={article.articleId}
                    data-testid={`row-article-${article.articleId}`}
                  >
                    <TableCell
                      className="font-medium max-w-xs truncate"
                      data-testid={`text-title-${article.articleId}`}
                    >
                      {article.title}
                    </TableCell>
                    <TableCell data-testid={`text-type-${article.articleId}`}>
                      <Badge variant="secondary">{article.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {SUPPORTED_LANGUAGES.map((language) => {
                          const isTranslated = article.translatedLanguages?.includes(language);
                          return (
                            <Badge
                              key={language}
                              variant={isTranslated ? "default" : "outline"}
                              className={`text-xs ${
                                isTranslated
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                              data-testid={`badge-lang-${article.articleId}-${language}`}
                            >
                              {isTranslated ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {language.toUpperCase()}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {article.published ? (
                        <span className="text-xs text-muted-foreground">
                          Crea un borrador para traducir
                        </span>
                      ) : canTranslateArticle(article) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controller.translateMissing(
                            article.articleId,
                            article.missingLanguages,
                          )}
                          disabled={controller.translatingArticleId === article.articleId}
                          data-testid={`button-translate-${article.articleId}`}
                        >
                          {controller.translatingArticleId === article.articleId ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {copy.translating}
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {copy.translateMissing} ({article.missingLanguages.length})
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
