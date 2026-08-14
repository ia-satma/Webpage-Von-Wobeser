import { FileText, Globe, Languages, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleProcessingController } from "./useArticleProcessingController";

export function ProcessingSummaryCards({
  controller,
}: {
  controller: ArticleProcessingController;
}) {
  const { copy, batchProgress } = controller;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{copy.totalArticles}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {controller.statsQuery.isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold" data-testid="text-total-articles">
              {controller.stats.total}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{copy.withTranslations}</CardTitle>
          <Languages className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {controller.translationCountsQuery.isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold" data-testid="text-with-translations">
              {controller.articlesWithTranslations}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{copy.processingStatus}</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-processing-status">
            {batchProgress.isProcessing ? copy.processing : copy.ready}
          </div>
          {batchProgress.isProcessing && (
            <div className="mt-2 space-y-1">
              <Progress
                value={(batchProgress.processed / batchProgress.total) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {copy.batchProgress}: {batchProgress.processed} {copy.batchOf} {batchProgress.total}
                {batchProgress.failed > 0 && (
                  <span className="text-destructive ml-2">
                    ({batchProgress.failed} {copy.batchFailed})
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auto-Recovery</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => controller.recoverMutation.mutate()}
            disabled={controller.isRecovering || batchProgress.isProcessing}
            data-testid="button-repair-errors"
            className="w-full"
          >
            {controller.isRecovering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.repairing}
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                {copy.repairErrors}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
