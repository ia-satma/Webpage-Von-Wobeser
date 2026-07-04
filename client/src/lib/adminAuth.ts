import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

const TOKEN_KEY = "vwb_admin_token";
const ROLE_KEY = "vwb_admin_role";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.error("Failed to save admin token");
  }
}

export function setRole(role: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLE_KEY, role || "");
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    console.error("Failed to clear admin token");
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function adminApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  // Handle expired/invalid session - clear token and redirect to login
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
      window.location.href = "/admin/login";
    }
  }
  
  return res;
}

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  role: string | null;
}

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    role: null,
  });

  useEffect(() => {
    const token = getToken();
    setState({
      isAuthenticated: !!token,
      isLoading: false,
      token,
      role: getRole(),
    });
  }, []);

  const login = useCallback((token: string, role?: string) => {
    setToken(token);
    if (role && typeof window !== "undefined") {
      try { localStorage.setItem(ROLE_KEY, role); } catch { /* ignore */ }
    }
    setState({
      isAuthenticated: true,
      isLoading: false,
      token,
      role: role ?? getRole(),
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      role: null,
    });
    setLocation("/admin/login");
  }, [setLocation]);

  const requireAuth = useCallback(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      setLocation("/admin/login");
      return false;
    }
    return true;
  }, [state.isLoading, state.isAuthenticated, setLocation]);

  return {
    ...state,
    login,
    logout,
    requireAuth,
  };
}

// Permisos EFECTIVOS del usuario (rol + concesiones extra), leídos de /api/admin/me.
// Se usa para mostrar/ocultar secciones del panel con precisión. FAIL-OPEN: mientras carga
// o si falla, `has()` devuelve true (el backend siempre re-valida, así que no hay riesgo real).
export function useMyPermissions() {
  const [perms, setPerms] = useState<string[] | null>(null);
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApiRequest("GET", "/api/admin/me");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPerms(Array.isArray(data?.permissions) ? data.permissions : null);
      } catch {
        /* fail-open */
      }
    })();
    return () => { cancelled = true; };
  }, []);
  // Aún sin cargar → true (fail-open). Cargado → comprobación real.
  const has = useCallback((perm: string) => perms === null || perms.includes(perm), [perms]);
  return { perms, has, loaded: perms !== null };
}
