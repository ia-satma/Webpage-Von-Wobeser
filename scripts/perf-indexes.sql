-- Índices de performance (idempotentes, no destructivos).
-- Declarados también en shared/schema.ts; esto los aplica sin correr un db:push
-- completo. Aplicar con:  node scripts/apply-perf-indexes.mjs
-- Revertir (si hiciera falta):  DROP INDEX IF EXISTS <nombre>;

-- Home / listado de noticias: ORDER BY date DESC + LIMIT.
CREATE INDEX IF NOT EXISTS news_date_idx ON news (date);

-- Traducciones: lookup exacto (news_id+language) y GROUP BY news_id (prefijo).
CREATE INDEX IF NOT EXISTS news_translations_news_id_language_idx ON news_translations (news_id, language);

-- Abogados: WHERE published + ORDER BY "order".
CREATE INDEX IF NOT EXISTS team_members_published_order_idx ON team_members (published, "order");

-- Blog: filtro por deleted_at IS NULL + status.
CREATE INDEX IF NOT EXISTS blog_posts_status_deleted_idx ON blog_posts (status, deleted_at);

-- Eventos: WHERE published + ORDER BY date.
CREATE INDEX IF NOT EXISTS events_published_date_idx ON events (published, date);

-- Cola de agentes: WHERE status + ORDER BY created_at, y filtro por agent_type.
CREATE INDEX IF NOT EXISTS agent_jobs_status_created_idx ON agent_jobs (status, created_at);
CREATE INDEX IF NOT EXISTS agent_jobs_agent_type_idx ON agent_jobs (agent_type);
