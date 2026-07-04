-- Migración no destructiva e idempotente: permisos por usuario + historial de accesos.
-- Se aplica con: node scripts/apply-permissions-and-login-log.mjs

-- A) Permisos EXTRA por usuario (aditivos sobre los del rol)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;

-- B) Historial persistente de inicios de sesión (éxitos y fallos). Nunca almacena contraseñas.
CREATE TABLE IF NOT EXISTS admin_login_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar,
  email text NOT NULL,
  success boolean NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp DEFAULT now()
);

-- Índice para listar los accesos recientes rápido
CREATE INDEX IF NOT EXISTS idx_admin_login_events_created_at ON admin_login_events (created_at);
