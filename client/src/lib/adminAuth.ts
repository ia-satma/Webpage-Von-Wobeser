import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

const TOKEN_KEY = "vwb_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
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

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
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
  
  return res;
}

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  useEffect(() => {
    const token = getToken();
    setState({
      isAuthenticated: !!token,
      isLoading: false,
      token,
    });
  }, []);

  const login = useCallback((token: string) => {
    setToken(token);
    setState({
      isAuthenticated: true,
      isLoading: false,
      token,
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
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
