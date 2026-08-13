-- Historial editorial privado e inmutable de resultados textuales generados por agentes.
-- Esta migración únicamente agrega una tabla nueva e índices: no modifica ni elimina contenido,
-- perfiles, artículos ni los historiales ya existentes de medios generados.
CREATE TABLE IF NOT EXISTS agent_copy_history (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  source_job_id varchar,
  agent_type text NOT NULL,
  copy_type text NOT NULL,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL,
  search_text text NOT NULL,
  language text NOT NULL DEFAULT 'multi',
  article_id varchar REFERENCES news(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'proposal' CHECK (status IN ('proposal', 'applied', 'draft', 'recovered')),
  origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'pipeline', 'scheduled', 'recovered')),
  actor_id varchar REFERENCES admin_users(id) ON DELETE SET NULL,
  archived boolean NOT NULL DEFAULT false,
  archived_at timestamp,
  archived_by varchar REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_copy_history_source_job_unique
  ON agent_copy_history (source_job_id);
CREATE INDEX IF NOT EXISTS agent_copy_history_created_idx
  ON agent_copy_history (created_at DESC);
CREATE INDEX IF NOT EXISTS agent_copy_history_agent_status_idx
  ON agent_copy_history (agent_type, status);
CREATE INDEX IF NOT EXISTS agent_copy_history_article_idx
  ON agent_copy_history (article_id);
CREATE INDEX IF NOT EXISTS agent_copy_history_archived_created_idx
  ON agent_copy_history (archived, created_at DESC);
