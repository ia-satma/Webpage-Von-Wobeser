import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * ErrorBoundary — último recurso ante errores de render no capturados.
 *
 * Motivación principal: los `<Suspense>` de App.tsx cargan las rutas como chunks
 * lazy. Si un chunk no se puede descargar (hash desfasado tras un deploy, o
 * iCloud/dataless evicta `dist/public/assets` en local), el `import()` lanza y,
 * sin un error boundary, React desmonta todo el árbol → pantalla blanca.
 *
 * Estrategia:
 *  - ChunkLoadError (chunk lazy roto): casi siempre se resuelve recargando, que
 *    trae el index.html nuevo con el manifest de assets actualizado. Recargamos
 *    UNA sola vez de forma automática, con guard en sessionStorage para no entrar
 *    en bucle si el problema persiste (build realmente roto).
 *  - Cualquier otro error: mostramos un fallback sobrio con botón "Recargar".
 *
 * Es un class component porque React solo soporta error boundaries vía
 * getDerivedStateFromError / componentDidCatch (no hay equivalente con hooks).
 */

const RELOAD_GUARD_KEY = "vwb_chunk_reload_attempted";
const LANGUAGE_KEY = "vwb_language";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

const COPY: Record<"es" | "en", { title: string; body: string; reload: string }> = {
  es: {
    title: "Algo salió mal",
    body: "No pudimos cargar esta sección. Recarga la página para continuar.",
    reload: "Recargar",
  },
  en: {
    title: "Something went wrong",
    body: "We couldn't load this section. Reload the page to continue.",
    reload: "Reload",
  },
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Auto-recuperación de chunk roto: recargar una vez (guard anti-bucle).
    // Solo recargamos si pudimos PERSISTIR el guard. Si sessionStorage no está
    // disponible (modo privado / cuota), recargar sin guard provocaría un bucle
    // infinito de recargas, así que en ese caso caemos directo al fallback.
    if (isChunkLoadError(error)) {
      let canReload = false;
      try {
        const alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY) === "1";
        if (!alreadyTried) {
          sessionStorage.setItem(RELOAD_GUARD_KEY, "1"); // si lanza, NO recargamos
          canReload = true;
        }
      } catch {
        canReload = false;
      }
      if (canReload) {
        window.location.reload();
        return;
      }
    }
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary capturó un error:", error, info.componentStack);
  }

  private handleReload = (): void => {
    try {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
    } catch {
      /* noop */
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    let lang: "es" | "en" = "es";
    try {
      lang = localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "es";
    } catch {
      /* noop: default es */
    }
    const t = COPY[lang];

    return (
      <div
        role="alert"
        data-testid="error-boundary-fallback"
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#1a1a1a",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>{t.title}</h1>
        <p style={{ maxWidth: "32rem", color: "#555", margin: 0 }}>{t.body}</p>
        <button
          type="button"
          onClick={this.handleReload}
          data-testid="error-boundary-reload"
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.5rem",
            border: "none",
            background: "#c8102e",
            color: "#fff",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {t.reload}
        </button>
      </div>
    );
  }
}
