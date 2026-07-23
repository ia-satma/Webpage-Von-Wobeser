-- Security hardening, 2026-07-23.
-- This migration deliberately invalidates legacy bearer sessions because their
-- raw tokens may be present in the historical `token` column.

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS consented_at timestamp,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'home';

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamp;

UPDATE admin_users
SET permissions = (COALESCE(permissions, '[]'::jsonb) - 'submissions')
  || '["contact_submissions","career_applications","newsletter","exports","private_downloads"]'::jsonb
WHERE COALESCE(permissions, '[]'::jsonb) ? 'submissions';

DELETE FROM admin_sessions;

ALTER TABLE admin_sessions
  ADD COLUMN IF NOT EXISTS absolute_expires_at timestamp,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp DEFAULT now(),
  ADD COLUMN IF NOT EXISTS csrf_token_hash text,
  ADD COLUMN IF NOT EXISTS mfa_verified boolean NOT NULL DEFAULT false;

ALTER TABLE admin_sessions
  ALTER COLUMN absolute_expires_at SET NOT NULL,
  ALTER COLUMN last_seen_at SET NOT NULL,
  ALTER COLUMN csrf_token_hash SET NOT NULL;

CREATE TABLE IF NOT EXISTS admin_mfa_credentials (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL UNIQUE,
  encrypted_secret text NOT NULL,
  recovery_code_hashes jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_auth_challenges (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_auth_challenges_expires_at
  ON admin_auth_challenges (expires_at);

CREATE TABLE IF NOT EXISTS security_rate_limits (
  key_hash text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamp NOT NULL DEFAULT now(),
  blocked_until timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_rate_limits_updated_at
  ON security_rate_limits (updated_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_sessions_user_id_fk') THEN
    ALTER TABLE admin_sessions
      ADD CONSTRAINT admin_sessions_user_id_fk
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_mfa_credentials_user_id_fk') THEN
    ALTER TABLE admin_mfa_credentials
      ADD CONSTRAINT admin_mfa_credentials_user_id_fk
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_auth_challenges_user_id_fk') THEN
    ALTER TABLE admin_auth_challenges
      ADD CONSTRAINT admin_auth_challenges_user_id_fk
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_auth_challenges_purpose_check') THEN
    ALTER TABLE admin_auth_challenges
      ADD CONSTRAINT admin_auth_challenges_purpose_check CHECK (purpose IN ('mfa', 'enroll'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_rate_limits_attempts_check') THEN
    ALTER TABLE security_rate_limits
      ADD CONSTRAINT security_rate_limits_attempts_check CHECK (attempts >= 0);
  END IF;
END
$$;
