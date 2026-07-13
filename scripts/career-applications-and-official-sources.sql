-- Migración no destructiva e idempotente: solicitudes de pasantías/empleo +
-- deduplicación de fuentes oficiales del LegalAlertsAgent automático.
-- Se aplica con: node scripts/apply-career-applications-and-official-sources.mjs

-- A) Solicitudes enviadas desde el formulario público de "Pasantes" (antes se perdían).
CREATE TABLE IF NOT EXISTS career_applications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  cv_path text NOT NULL,
  cv_original_name text,
  accepted_privacy boolean NOT NULL DEFAULT false,
  ip_address text,
  submitted_at timestamp DEFAULT now(),
  read boolean DEFAULT false
);

-- B) Fuentes oficiales ya escaneadas por el LegalAlertsAgent automático (dedup real por constraint).
CREATE TABLE IF NOT EXISTS processed_official_sources (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_hash text NOT NULL,
  status text DEFAULT 'skipped_not_relevant',
  news_id varchar,
  processed_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS processed_official_sources_source_url_idx ON processed_official_sources (source_url);
