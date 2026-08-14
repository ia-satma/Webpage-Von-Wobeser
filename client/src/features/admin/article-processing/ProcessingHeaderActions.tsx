import { ImageIcon, Play, RefreshCw, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ArticleProcessingController } from "./useArticleProcessingController";

export function ProcessingHeaderActions({
  controller,
}: {
  controller: ArticleProcessingController;
}) {
  const { copy, batchProgress } = controller;
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-none border bg-muted/50">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <Label htmlFor="generate-images" className="text-xs font-medium cursor-pointer">
            {copy.generateImages}
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {copy.generateImagesDesc}
          </span>
        </div>
        <Switch
          id="generate-images"
          checked={controller.generateImages}
          onCheckedChange={controller.setGenerateImages}
          data-testid="switch-generate-images"
        />
      </div>
      <Button
        variant="outline"
        onClick={controller.refreshAll}
        disabled={controller.newsQuery.isLoading || controller.translationCountsQuery.isLoading}
        data-testid="button-refresh"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        {copy.refresh}
      </Button>
      {batchProgress.isProcessing ? (
        <Button
          onClick={controller.stopBatch}
          variant="destructive"
          data-testid="button-stop-batch"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          {copy.stopProcessing}
        </Button>
      ) : (
        <Button
          onClick={controller.processAll}
          disabled={batchProgress.isProcessing}
          data-testid="button-process-all"
        >
          <Play className="mr-2 h-4 w-4" />
          {copy.processAll}
        </Button>
      )}
    </>
  );
}
