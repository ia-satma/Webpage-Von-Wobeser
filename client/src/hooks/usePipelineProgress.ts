import { useEffect, useState, useCallback, useRef } from 'react';

export interface PipelineProgressEvent {
  articleId: string;
  step: string;
  status: 'running' | 'completed' | 'error';
  language?: string;
  progress?: number;
  message?: string;
  timestamp: string;
  data?: any;
}

type ProgressListener = (event: PipelineProgressEvent) => void;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPipelineProgressEvent(value: unknown): value is PipelineProgressEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<PipelineProgressEvent>;
  return typeof event.articleId === 'string'
    && UUID_PATTERN.test(event.articleId)
    && typeof event.step === 'string'
    && event.step.length > 0
    && event.step.length <= 80
    && ['running', 'completed', 'error'].includes(String(event.status))
    && typeof event.timestamp === 'string';
}

class PipelineWebSocketManager {
  private ws: WebSocket | null = null;
  private listeners: Map<ProgressListener, string> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private _isConnected = false;
  private events: PipelineProgressEvent[] = [];
  private currentProgress: Record<string, PipelineProgressEvent> = {};
  private connectionListeners: Set<() => void> = new Set();

  get isConnected() {
    return this._isConnected;
  }

  subscribe(listener: ProgressListener, articleId: string) {
    if (!UUID_PATTERN.test(articleId)) return () => undefined;
    this.listeners.set(listener, articleId);
    this.ensureConnected();
    this.sendControl('subscribe', articleId);
    return () => {
      this.listeners.delete(listener);
      if (!Array.from(this.listeners.values()).includes(articleId)) {
        this.sendControl('unsubscribe', articleId);
      }
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  subscribeToConnection(listener: () => void) {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private notifyConnectionChange() {
    this.connectionListeners.forEach(l => l());
  }

  private sendControl(type: 'subscribe' | 'unsubscribe', articleId: string) {
    if (this.ws?.readyState !== WebSocket.OPEN || !UUID_PATTERN.test(articleId)) return;
    this.ws.send(JSON.stringify({ type, articleId }));
  }

  getSnapshot() {
    return { isConnected: this._isConnected, events: this.events, currentProgress: this.currentProgress };
  }

  private ensureConnected() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.ws?.readyState === WebSocket.CONNECTING) return;
    
    this.connect();
  }

  private connect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/pipeline`;
    
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error('[Pipeline WS] Failed to create WebSocket:', error);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this._isConnected = true;
      this.notifyConnectionChange();
      new Set(Array.from(this.listeners.values())).forEach(articleId => {
        this.sendControl('subscribe', articleId);
      });
      console.log('[Pipeline WS] Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (['connected', 'subscribed', 'unsubscribed'].includes(String(data?.type))) {
          return;
        }
        if (!isPipelineProgressEvent(data)) return;

        this.events = [...this.events.slice(-100), data];
        this.currentProgress = {
          ...this.currentProgress,
          [data.articleId]: data,
        };

        this.listeners.forEach((subscribedArticleId, listener) => {
          if (subscribedArticleId !== data.articleId) return;
          try {
            listener(data);
          } catch (err) {
            console.error('[Pipeline WS] Listener error:', err);
          }
        });
      } catch (err) {
        console.error('[Pipeline WS] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      this._isConnected = false;
      this.notifyConnectionChange();
      console.log('[Pipeline WS] Disconnected');
      if (this.listeners.size > 0) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Pipeline WS] Error:', error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.listeners.size > 0) {
        this.connect();
      }
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
  }

  clearEvents() {
    this.events = [];
    this.currentProgress = {};
  }

  getProgressForArticle(articleId: string) {
    return this.currentProgress[articleId] || null;
  }
}

const wsManager = new PipelineWebSocketManager();

interface UsePipelineProgressOptions {
  articleId?: string | null;
  onProgress?: (event: PipelineProgressEvent) => void;
  onComplete?: (event: PipelineProgressEvent) => void;
  onError?: (event: PipelineProgressEvent) => void;
}

export function usePipelineProgress(options: UsePipelineProgressOptions = {}) {
  const [isConnected, setIsConnected] = useState(wsManager.isConnected);
  const [events, setEvents] = useState<PipelineProgressEvent[]>([]);
  const [currentProgress, setCurrentProgress] = useState<Record<string, PipelineProgressEvent>>({});
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleEvent = (event: PipelineProgressEvent) => {
      setEvents(prev => [...prev.slice(-100), event]);
      setCurrentProgress(prev => ({ ...prev, [event.articleId]: event }));

      if (event.status === 'completed') {
        optionsRef.current.onComplete?.(event);
      } else if (event.status === 'error') {
        optionsRef.current.onError?.(event);
      } else {
        optionsRef.current.onProgress?.(event);
      }
    };

    const unsubscribe = options.articleId
      ? wsManager.subscribe(handleEvent, options.articleId)
      : () => undefined;
    const unsubscribeConnection = wsManager.subscribeToConnection(() => {
      setIsConnected(wsManager.isConnected);
    });

    setIsConnected(wsManager.isConnected);

    return () => {
      unsubscribe();
      unsubscribeConnection();
    };
  }, [options.articleId]);

  const clearEvents = useCallback(() => {
    wsManager.clearEvents();
    setEvents([]);
    setCurrentProgress({});
  }, []);

  const getProgressForArticle = useCallback((articleId: string) => {
    return wsManager.getProgressForArticle(articleId);
  }, []);

  return {
    isConnected,
    events,
    currentProgress,
    clearEvents,
    getProgressForArticle,
  };
}
