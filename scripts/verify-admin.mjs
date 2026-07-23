// Verificación segura y no destructiva de la sesión administrativa.
// No cambia contraseñas ni contenido. Para cuentas con MFA, copie temporalmente
// la cookie y el CSRF de una sesión del entorno aislado a Secrets locales.
import "dotenv/config";

const base = process.env.VERIFY_BASE || "http://localhost:5050";
const cookie = process.env.ADMIN_SESSION_COOKIE;
const csrf = process.env.ADMIN_CSRF_TOKEN;

if (!cookie || !csrf) {
  throw new Error("ADMIN_SESSION_COOKIE and ADMIN_CSRF_TOKEN are required");
}
if (!/^(__Host-)?vwb_admin_session=/.test(cookie)) {
  throw new Error("ADMIN_SESSION_COOKIE must contain only the session cookie name and value");
}

const response = await fetch(`${base}/api/admin/session`, {
  headers: {
    cookie,
    "x-csrf-token": csrf,
  },
  redirect: "manual",
});
const body = await response.json().catch(() => ({}));

if (response.status !== 200 || !body?.user?.id) {
  throw new Error(`Admin session verification failed (${response.status})`);
}

console.log("Admin session verified");
console.log(`Role: ${body.user.role}`);
console.log(`Permissions: ${(body.permissions || []).join(", ")}`);
