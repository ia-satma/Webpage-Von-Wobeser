import { Loader2 } from "lucide-react";
import { KnowledgeBulkAndDeleteDialogs } from "./KnowledgeBulkAndDeleteDialogs";
import { KnowledgeDocumentDialogs } from "./KnowledgeDocumentDialogs";
import { KnowledgeOverview } from "./KnowledgeOverview";
import { useKnowledgeAdmin } from "./useKnowledgeAdmin";

export default function AdminKnowledgePage() {
  const model = useKnowledgeAdmin();

  if (model.authLoading || !model.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{model.t.checkingAuth}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin-knowledge">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KnowledgeOverview model={model} />
        <KnowledgeDocumentDialogs model={model} />
        <KnowledgeBulkAndDeleteDialogs model={model} />
      </main>
    </div>
  );
}
