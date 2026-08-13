import { useState, useEffect, useCallback } from 'react';
import { usePipelineProgress, PipelineProgressEvent } from '@/hooks/usePipelineProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, FileText, Tags, Link2, Search, Languages, Image, Scale } from 'lucide-react';

interface PipelineProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string | null;
  articleTitle?: string;
  includeImage?: boolean;
  /** Error de inicio HTTP antes de que exista un evento de WebSocket. */
  startError?: string | null;
}

const STEP_ICONS: Record<string, typeof FileText> = {
  format: FileText,
  categorize: Tags,
  metadata: Link2,
  seo: Search,
  translate: Languages,
  council: Scale,
  image: Image,
  complete: CheckCircle2,
};

const STEP_LABELS: Record<string, string> = {
  format: 'Dando formato',
  categorize: 'Clasificando',
  metadata: 'Relacionando metadatos',
  seo: 'Optimizando SEO',
  translate: 'Traduciendo',
  council: 'Revisión legal final',
  image: 'Generando imagen',
  complete: 'Terminado',
};

export function PipelineProgressModal({ 
  open, 
  onOpenChange, 
  articleId, 
  articleTitle,
  includeImage = false,
  startError = null,
}: PipelineProgressModalProps) {
  const [steps, setSteps] = useState<Record<string, PipelineProgressEvent>>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleProgress = useCallback((event: PipelineProgressEvent) => {
    if (event.articleId === articleId) {
      setSteps(prev => ({ ...prev, [event.step]: event }));
      if (event.progress !== undefined) setOverallProgress(event.progress);
    }
  }, [articleId]);

  const handleComplete = useCallback((event: PipelineProgressEvent) => {
    if (event.articleId === articleId) {
      setSteps(prev => ({ ...prev, [event.step]: event }));
      if (event.step === 'complete') {
        setIsComplete(true);
        setOverallProgress(100);
      } else if (event.progress !== undefined) {
        setOverallProgress(event.progress);
      }
    }
  }, [articleId]);

  const handleError = useCallback((event: PipelineProgressEvent) => {
    if (event.articleId === articleId) {
      setSteps(prev => ({ ...prev, [event.step]: event }));
      setHasError(true);
      if (event.progress !== undefined) setOverallProgress(event.progress);
      if (event.step === 'complete') setIsComplete(true);
    }
  }, [articleId]);
  
  const { isConnected } = usePipelineProgress({
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError,
  });

  useEffect(() => {
    if (open && articleId) {
      const initialEvent: PipelineProgressEvent = {
        articleId,
        step: 'format',
        status: startError ? 'error' : 'running',
        progress: 0,
        message: startError || 'Preparando el artículo y validando la solicitud…',
        timestamp: new Date().toISOString(),
      };
      setSteps({ format: initialEvent });
      setOverallProgress(0);
      setIsComplete(Boolean(startError));
      setHasError(Boolean(startError));
    } else {
      setSteps({});
      setOverallProgress(0);
      setIsComplete(false);
      setHasError(false);
    }
  }, [open, articleId, startError]);

  const stepOrder = includeImage 
    ? ['format', 'categorize', 'metadata', 'seo', 'translate', 'council', 'image']
    : ['format', 'categorize', 'metadata', 'seo', 'translate', 'council'];

  const getStatusIcon = (step: string) => {
    const event = steps[step];
    if (!event) return null;
    
    if (event.status === 'running') {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (event.status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (event.status === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getStatusBadge = (step: string) => {
    const event = steps[step];
    if (!event) return <Badge variant="outline">Pendiente</Badge>;
    
    if (event.status === 'running') {
      return <Badge className="bg-blue-500">En curso</Badge>;
    }
    if (event.status === 'completed') {
      return <Badge className="bg-green-600">Listo</Badge>;
    }
    if (event.status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="outline">Pendiente</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              hasError
                ? <XCircle className="h-5 w-5 text-red-500" />
                : <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            Progreso del procesamiento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {articleTitle && (
            <p className="text-sm text-muted-foreground break-words">
              Procesando: <span className="font-medium text-foreground">{articleTitle}</span>
            </p>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progreso general</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          <div className="space-y-3 mt-4">
            {stepOrder.map((step) => {
              const Icon = STEP_ICONS[step] || FileText;
              const event = steps[step];
              
              return (
                <div 
                  key={step}
                  className={`flex items-center justify-between p-3 rounded-none border ${
                    event?.status === 'running' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' :
                    event?.status === 'completed' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' :
                    event?.status === 'error' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                    'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{STEP_LABELS[step] || step}</p>
                      {event?.message && (
                        <p className="text-xs text-muted-foreground break-words">{event.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusIcon(step)}
                    {getStatusBadge(step)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Conectado
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Reconectando
                </>
              )}
            </span>
            {articleId && <span>Artículo: {articleId.slice(0, 8)}…</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
