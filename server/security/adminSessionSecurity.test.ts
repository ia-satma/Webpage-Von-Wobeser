import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { getAdminSessionPolicy } = await import("../auth");

const root = process.cwd();
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("la política de sesión es explícita por rol y no introduce una cuota global", () => {
  assert.deepEqual(getAdminSessionPolicy("super_admin"), {
    idleMinutes: 15,
    warningMinutes: 5,
    absoluteHours: 8,
    maxConcurrentSessions: 1,
  });
  assert.deepEqual(getAdminSessionPolicy("admin"), getAdminSessionPolicy("super_admin"));
  assert.deepEqual(getAdminSessionPolicy("editor"), {
    idleMinutes: 30,
    warningMinutes: 5,
    absoluteHours: 8,
    maxConcurrentSessions: 2,
  });
});

test("la cuota concurrente se aplica atómicamente por usuario y conserva la sesión nueva", () => {
  const repository = source("server/storage/repositories/securityRepository.ts");
  assert.match(repository, /createAdminSession\(session: InsertAdminSession, maximumActiveSessions: 1 \| 2\)/);
  assert.match(repository, /pg_advisory_xact_lock/);
  assert.match(repository, /admin-session:\$\{session\.userId\}/);
  assert.match(repository, /eq\(adminSessions\.userId, session\.userId\)/);
  assert.match(repository, /ne\(adminSessions\.id, created\.id\)/);
  assert.match(repository, /maximumActiveSessions - 1/);
  assert.match(repository, /deleteOtherAdminSessionsByUserId[\s\S]*?eq\(adminSessions\.userId, userId\)[\s\S]*?ne\(adminSessions\.id, currentSessionId\)/);
});

test("las rutas de sesiones son propias, no filtran identificadores sensibles y dejan evidencia", () => {
  const routes = source("server/routes/adminAccessRoutes.ts");
  assert.match(routes, /app\.get\("\/api\/admin\/sessions", authMiddleware/);
  assert.match(routes, /getActiveAdminSessionsByUserId\(req\.adminUser!\.id\)/);
  assert.match(routes, /app\.post\("\/api\/admin\/sessions\/revoke-others", authMiddleware/);
  assert.match(routes, /deleteOtherAdminSessionsByUserId\(req\.adminUser!\.id, req\.adminSession!\.id\)/);
  assert.match(routes, /app\.delete\("\/api\/admin\/sessions\/:id", authMiddleware/);
  assert.match(routes, /deleteAdminSessionByIdForUser\(parsed\.data, req\.adminUser!\.id\)/);
  assert.match(routes, /auditLog\("delete", "admin_session"/);
  const sessionPayload = routes.slice(routes.indexOf('app.get("/api/admin/sessions"'), routes.indexOf('app.post("/api/admin/sessions/revoke-others"'));
  assert.doesNotMatch(sessionPayload, /tokenHash|csrfTokenHash|ipAddress/);
  assert.doesNotMatch(sessionPayload, /userAgent:\s*session\.userAgent/);
  assert.match(sessionPayload, /device: sessionDeviceLabel\(session\.userAgent\)/);
});

test("la interfaz sincroniza actividad entre pestañas y conserva un aviso accesible", () => {
  const guard = source("client/src/components/admin/AdminSessionGuard.tsx");
  const account = source("client/src/pages/admin/AdminChangePassword.tsx");
  assert.match(guard, /BroadcastChannel/);
  assert.match(guard, /window\.addEventListener\("storage", onStorage\)/);
  assert.match(guard, /SERVER_REFRESH_INTERVAL_MS = 6 \* 60 \* 1000/);
  assert.match(guard, /Tu sesión está por cerrar/);
  assert.match(guard, /button-session-continue/);
  assert.match(account, /\/api\/admin\/sessions/);
  assert.match(account, /Cerrar las demás/);
  assert.match(account, /Verificación en dos pasos/);
});
