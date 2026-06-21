import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// Mock de ./storage para no arrastrar la conexión a Postgres (db.ts) al importar
// auth.ts. requireRole no toca la base; authMiddleware sí usa getAdminSession /
// getAdminUser / deleteAdminSession, así que se mockean.
vi.mock("./storage", () => ({
  storage: {
    getAdminSession: vi.fn(),
    getAdminUser: vi.fn(),
    deleteAdminSession: vi.fn(),
  },
}));

import { requireRole, authMiddleware } from "./auth";
import { storage } from "./storage";

// Acceso laxo a los mocks (el .test.ts está excluido de tsc; vitest lo transforma).
const s = storage as any;

function mockRes() {
  const res = {} as Response & { statusCode?: number; body?: unknown };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as Response["status"];
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  }) as unknown as Response["json"];
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// Blinda el modelo de roles ANTES y DESPUÉS del codemod que quita el rol fantasma
// 'admin': super_admin pasa siempre (bypass reparado), un rol listado pasa, uno no
// listado recibe 403, y sin sesión recibe 401.
describe("requireRole", () => {
  it("401 cuando no hay adminUser en la request", () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();
    requireRole("editor")(req, res, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("super_admin pasa siempre (bypass), aunque no esté en la lista pedida", () => {
    const req = { adminUser: { role: "super_admin" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    requireRole("editor")(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeUndefined();
  });

  it("un rol incluido en la lista pasa", () => {
    const req = { adminUser: { role: "editor" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    requireRole("editor", "author")(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledOnce();
  });

  it("un rol NO incluido recibe 403", () => {
    const req = { adminUser: { role: "author" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    requireRole("editor")(req, res, next as NextFunction);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// authMiddleware: la puerta de entrada de todo endpoint admin. Estos casos cubren
// el rechazo de sesión ausente / con formato inválido / inexistente / expirada /
// de usuario inactivo, y el camino feliz que adjunta adminUser y llama next().
describe("authMiddleware", () => {
  const req = (headers: Record<string, string> = {}) =>
    ({ headers }) as unknown as Request & { adminUser?: unknown };

  it("401 sin header Authorization", async () => {
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({}), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 si el header no empieza con 'Bearer '", async () => {
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Basic abc" }), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 si la sesión no existe", async () => {
    s.getAdminSession.mockResolvedValue(null);
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer tok" }), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 y borra la sesión cuando está expirada", async () => {
    s.getAdminSession.mockResolvedValue({
      token: "tok",
      userId: "u1",
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer tok" }), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(s.deleteAdminSession).toHaveBeenCalledWith("tok");
    expect(next).not.toHaveBeenCalled();
  });

  it("401 si el usuario está inactivo", async () => {
    s.getAdminSession.mockResolvedValue({
      token: "tok",
      userId: "u1",
      expiresAt: new Date(Date.now() + 100000),
    });
    s.getAdminUser.mockResolvedValue({ id: "u1", role: "editor", isActive: false });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer tok" }), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("pasa (next) con sesión válida + usuario activo y adjunta adminUser", async () => {
    const user = { id: "u1", role: "super_admin", isActive: true };
    s.getAdminSession.mockResolvedValue({
      token: "tok",
      userId: "u1",
      expiresAt: new Date(Date.now() + 100000),
    });
    s.getAdminUser.mockResolvedValue(user);
    const r = req({ authorization: "Bearer tok" });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(r, res, next as NextFunction);
    expect(next).toHaveBeenCalledOnce();
    expect(r.adminUser).toEqual(user);
  });
});
