import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminApiRequest,
  clearToken,
  loadAdminSession,
  type AdminSessionPolicy,
} from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ACTIVITY_KEY = "vwb_admin_session_last_activity";
const EVENT_KEY = "vwb_admin_session_event";
const CHANNEL_NAME = "vwb_admin_session";
const SERVER_REFRESH_INTERVAL_MS = 6 * 60 * 1000;

type SessionEvent = { type: "activity" | "logout"; at: number };

function readTimestamp(): number | null {
  try {
    const value = Number(window.localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeSharedEvent(event: SessionEvent): void {
  try {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(event));
    if (event.type === "activity") window.localStorage.setItem(ACTIVITY_KEY, String(event.at));
  } catch {
    // En modo privado el canal BroadcastChannel sigue cubriendo navegadores modernos.
  }
}

function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Guardia de inactividad común del panel. Sincroniza actividad y cierre entre
 * pestañas, muestra una advertencia accesible antes de expirar y limita la
 * renovación HTTP a una vez cada seis minutos de actividad real.
 */
export function AdminSessionGuard({ policy, userId }: { policy: AdminSessionPolicy | null; userId: string | undefined }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const lastActivity = useRef<number>(Date.now());
  const lastServerRefresh = useRef<number>(Date.now());
  const closing = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);

  const redirectToLogin = useCallback(() => {
    clearToken();
    window.location.assign("/admin/login");
  }, []);

  const endSession = useCallback((announce: boolean) => {
    if (closing.current) return;
    closing.current = true;
    if (announce) {
      const event: SessionEvent = { type: "logout", at: Date.now() };
      writeSharedEvent(event);
      channel.current?.postMessage(event);
      void adminApiRequest("POST", "/api/admin/logout").finally(redirectToLogin);
      return;
    }
    redirectToLogin();
  }, [redirectToLogin]);

  const recordActivity = useCallback((forceRefresh = false) => {
    if (!policy || closing.current) return;
    const now = Date.now();
    lastActivity.current = now;
    setRemaining(policy.idleMinutes * 60 * 1000);
    const event: SessionEvent = { type: "activity", at: now };
    writeSharedEvent(event);
    channel.current?.postMessage(event);

    if (forceRefresh || now - lastServerRefresh.current >= SERVER_REFRESH_INTERVAL_MS) {
      lastServerRefresh.current = now;
      void loadAdminSession(true).then((user) => {
        if (!user) endSession(false);
      });
    }
  }, [endSession, policy]);

  useEffect(() => {
    if (!policy || !userId) return;
    closing.current = false;
    const initial = readTimestamp();
    const now = Date.now();
    // Una sesión recién cargada es interacción válida; no se hereda un reloj de
    // una sesión anterior en este mismo navegador.
    lastActivity.current = initial && now - initial < policy.idleMinutes * 60 * 1000 ? initial : now;
    lastServerRefresh.current = now;
    if (!initial || now - initial >= policy.idleMinutes * 60 * 1000) recordActivity(false);

    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel(CHANNEL_NAME);
      channel.current.onmessage = (message: MessageEvent<SessionEvent>) => {
        const event = message.data;
        if (!event || !Number.isFinite(event.at)) return;
        if (event.type === "logout") endSession(false);
        if (event.type === "activity") lastActivity.current = Math.max(lastActivity.current, event.at);
      };
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== EVENT_KEY || !event.newValue) return;
      try {
        const shared = JSON.parse(event.newValue) as SessionEvent;
        if (shared.type === "logout") endSession(false);
        if (shared.type === "activity" && Number.isFinite(shared.at)) {
          lastActivity.current = Math.max(lastActivity.current, shared.at);
        }
      } catch {
        // Un valor de almacenamiento corrupto no puede impedir el cierre local.
      }
    };
    const onActivity = () => recordActivity(false);
    const activityEvents: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "wheel", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener("storage", onStorage);

    const timer = window.setInterval(() => {
      const nextRemaining = policy.idleMinutes * 60 * 1000 - (Date.now() - lastActivity.current);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) endSession(true);
    }, 1000);

    return () => {
      window.clearInterval(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener("storage", onStorage);
      channel.current?.close();
      channel.current = null;
    };
  }, [endSession, policy, recordActivity, userId]);

  if (!policy || remaining === null) return null;
  const warningThreshold = policy.warningMinutes * 60 * 1000;
  const showWarning = remaining > 0 && remaining <= warningThreshold;

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent data-testid="dialog-session-expiring">
        <AlertDialogHeader>
          <AlertDialogTitle>Tu sesión está por cerrar</AlertDialogTitle>
          <AlertDialogDescription>
            Por seguridad, se cerrará por inactividad en {formatCountdown(remaining)}. Puedes continuar sin perder el trabajo actual.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => endSession(true)} data-testid="button-session-logout-now">
            Cerrar sesión
          </Button>
          <Button onClick={() => recordActivity(true)} data-testid="button-session-continue">
            Continuar sesión
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
