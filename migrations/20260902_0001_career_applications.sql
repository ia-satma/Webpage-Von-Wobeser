-- Solicitudes de Talento y deduplicación de fuentes oficiales.
--
-- Estas tablas se definieron originalmente en un script operativo que no
-- formaba parte de `npm run db:migrate`. Replit sólo ejecuta las migraciones
-- versionadas durante el arranque, así que la ausencia de esta migración podía
-- permitir cargar el CV y fallar después al intentar guardar la solicitud.
-- La operación es estrictamente aditiva e idempotente: no toca solicitudes,
-- publicaciones ni perfiles existentes.

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

CREATE TABLE IF NOT EXISTS processed_official_sources (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_hash text NOT NULL,
  status text DEFAULT 'skipped_not_relevant',
  news_id varchar,
  processed_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS processed_official_sources_source_url_idx
  ON processed_official_sources (source_url);
