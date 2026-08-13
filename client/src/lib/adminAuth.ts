import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

const SESSION_MARKER_KEY = "vwb_admin_session_active";
const CSRF_KEY = "vwb_admin_csrf";
const ROLE_KEY = "vwb_admin_role";

export type AdminSessionUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  permissions?: string[];
};

let cachedUser: AdminSessionUser | null = null;
let sessionPromise: Promise<AdminSessionUser | null> | null = null;

function sessionGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function sessionSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(key, value); } catch { /* sesión sigue en cookie */ }
}

function sessionRemove(key: string): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

export function getToken(): string | null {
  // Compatibilidad con componentes antiguos: es solo un marcador, nunca una
  // credencial. El token real vive en una cookie HttpOnly inaccesible a JS.
  return sessionGet(SESSION_MARKER_KEY) === "1" ? "cookie-session" : null;
}

export function getRole(): string | null {
  return cachedUser?.role || sessionGet(ROLE_KEY);
}

/** @deprecated La sesión ya no acepta Bearer tokens. */
export function setToken(_token?: string): void {
  sessionSet(SESSION_MARKER_KEY, "1");
}

export function setRole(role: string): void {
  sessionSet(ROLE_KEY, role || "");
}

export function clearToken(): void {
  cachedUser = null;
  sessionPromise = null;
  sessionRemove(SESSION_MARKER_KEY);
  sessionRemove(CSRF_KEY);
  sessionRemove(ROLE_KEY);
  try {
    // Limpia cualquier credencial heredada que hubiera quedado de versiones previas.
    localStorage.removeItem("vwb_admin_token");
    localStorage.removeItem("vwb_admin_role");
  } catch { /* ignore */ }
}

export function isAuthenticated(): boolean {
  return cachedUser !== null || getToken() !== null;
}

export function establishAdminSession(payload: { csrfToken?: string; user?: AdminSessionUser }): void {
  if (payload.csrfToken) sessionSet(CSRF_KEY, payload.csrfToken);
  if (payload.user) {
    cachedUser = payload.user;
    setRole(payload.user.role);
  }
  sessionSet(SESSION_MARKER_KEY, "1");
  // Un payload de login heredado puede traer rol pero no permisos. En ese caso no se
  // considera una sesión completamente hidratada: la siguiente lectura debe consultar
  // /api/admin/session en vez de perpetuar un menú incompleto desde la caché.
  sessionPromise = Array.isArray(cachedUser?.permissions)
    ? Promise.resolve(cachedUser)
    : null;
}

export async function loadAdminSession(force = false): Promise<AdminSessionUser | null> {
  if (!force && cachedUser) return cachedUser;
  if (!force && sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    try {
      const response = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        clearToken();
        return null;
      }
      const payload = await response.json();
      establishAdminSession(payload);
      return payload.user || null;
    } catch {
      clearToken();
      return null;
    }
  })();
  return sessionPromise;
}

export function getAuthHeaders(): Record<string, string> {
  const csrf = sessionGet(CSRF_KEY);
  return csrf ? { "X-CSRF-Token": csrf } : {};
}

export async function adminApiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const upperMethod = method.toUpperCase();
  const mutation = !["GET", "HEAD", "OPTIONS"].includes(upperMethod);
  if (mutation && !sessionGet(CSRF_KEY)) await loadAdminSession();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  if (data !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method: upperMethod,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
      window.location.href = "/admin/login";
    }
  }
  return response;
}

/**
 * Convierte una respuesta administrativa en JSON solo si la operación fue
 * aceptada. `fetch` no rechaza respuestas 4xx/5xx por sí solo; usar este
 * helper evita que una mutación muestre una notificación de éxito después de
 * que el servidor la rechazó.
 */
export async function readAdminJson<T = unknown>(response: Response, fallbackMessage = "La operación no pudo completarse."): Promise<T> {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof body.error === "string"
      ? body.error
      : typeof body.message === "string"
        ? body.message
        : fallbackMessage;
    throw new Error(message);
  }
  return body as T;
}

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  role: string | null;
  user: AdminSessionUser | null;
}

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    role: null,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;
    loadAdminSession().then((user) => {
      if (cancelled) return;
      setState({
        isAuthenticated: !!user,
        isLoading: false,
        token: user ? "cookie-session" : null,
        role: user?.role || null,
        user,
      });
    });
    return () => { cancelled = true; };
  }, [setLocation]);

  const login = useCallback((_token?: string, role?: string) => {
    const user = cachedUser || (role ? { id: "", username: "", email: "", role } : null);
    if (user) establishAdminSession({ user });
    setState({
      isAuthenticated: !!user,
      isLoading: false,
      token: user ? "cookie-session" : null,
      role: user?.role || null,
      user,
    });
  }, []);

  const logout = useCallback(() => {
    void adminApiRequest("POST", "/api/admin/logout").finally(() => {
      clearToken();
      setState({ isAuthenticated: false, isLoading: false, token: null, role: null, user: null });
      setLocation("/admin/login");
    });
  }, [setLocation]);

  const requireAuth = useCallback(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      setLocation("/admin/login");
      return false;
    }
    return state.isAuthenticated;
  }, [state.isLoading, state.isAuthenticated, setLocation]);

  return { ...state, login, logout, requireAuth };
}

export function useMyPermissions() {
  const [permissions, setPermissions] = useState<string[] | null>(cachedUser?.permissions || null);
  useEffect(() => {
    let cancelled = false;
    const needsAuthoritativeRefresh = cachedUser !== null && !Array.isArray(cachedUser.permissions);
    loadAdminSession(needsAuthoritativeRefresh).then((user) => {
      if (!cancelled) setPermissions(Array.isArray(user?.permissions) ? user.permissions : []);
    });
    return () => { cancelled = true; };
  }, []);
  const has = useCallback((permission: string) => permissions?.includes(permission) === true, [permissions]);
  return { perms: permissions, has, loaded: permissions !== null };
}
