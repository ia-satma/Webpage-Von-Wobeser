import { Cog } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { PipelineProgressModal } from "@/components/PipelineProgressModal";
import { ArticleProcessingTable } from "./ArticleProcessingTable";
import { ProcessingHeaderActions } from "./ProcessingHeaderActions";
import { ProcessingSummaryCards } from "./ProcessingSummaryCards";
import { useArticleProcessingController } from "./useArticleProcessingController";

export default function AdminArticleProcessingPage() {
  const controller = useArticleProcessingController();
  if (controller.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{controller.copy.loading}</div>
      </div>
    );
  }
  if (!controller.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={controller.copy.title}
          icon={Cog}
          actions={<ProcessingHeaderActions controller={controller} />}
        />
        <AdminPageHelp pageId="article-processing">
          Aquí sigues el proceso automático que analiza y prepara un artículo antes de publicarlo (traducción, clasificación, revisión de calidad).
        </AdminPageHelp>
        <ProcessingSummaryCards controller={controller} />
        <ArticleProcessingTable controller={controller} />
      </main>
      <PipelineProgressModal
        open={controller.progressModalOpen}
        onOpenChange={controller.handleProgressModalOpenChange}
        articleId={controller.processingArticleId}
        articleTitle={controller.progressArticleTitle}
        includeImage={controller.generateImages}
        startError={controller.pipelineStartError}
      />
    </div>
  );
}
