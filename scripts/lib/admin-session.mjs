function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function adminSessionHeaders() {
  const cookie = required("ADMIN_SESSION_COOKIE");
  const csrf = required("ADMIN_CSRF_TOKEN");
  if (!/^(?:__Host-)?vwb_admin_session=[A-Za-z0-9_-]{32,256}$/.test(cookie)) {
    throw new Error("ADMIN_SESSION_COOKIE must contain only the session cookie name and value");
  }
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(csrf)) {
    throw new Error("ADMIN_CSRF_TOKEN has an invalid format");
  }
  return { cookie, "x-csrf-token": csrf };
}

export function requireIsolatedSecurityTarget(baseUrl) {
  if (process.env.SECURITY_TEST_ISOLATED !== "true") {
    throw new Error("SECURITY_TEST_ISOLATED=true is required for mutating or invasive tests");
  }
  const url = new URL(baseUrl);
  const allowed = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!allowed.has(url.hostname)) {
    throw new Error("Active security tests may only target an isolated localhost clone");
  }
  if (!process.env.DATABASE_URL || process.env.SECURITY_TEST_DATABASE_CONFIRMED !== "true") {
    throw new Error("Set SECURITY_TEST_DATABASE_CONFIRMED=true after verifying the database is isolated and synthetic");
  }
}
