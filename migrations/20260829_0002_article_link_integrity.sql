-- Historial reversible de enlaces externos de Artículos. El contenido original
-- se conserva: status=disabled únicamente evita que se ofrezca al lector un
-- destino que ya no responde con contenido real.
CREATE TABLE IF NOT EXISTS news_external_links (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id varchar NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('source', 'content')),
  url text NOT NULL,
  normalized_url text NOT NULL,
  status text NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'disabled')),
  final_url text,
  failure_code text,
  checked_at timestamp NOT NULL DEFAULT now(),
  disabled_at timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS news_external_links_news_url_kind_idx
  ON news_external_links (news_id, normalized_url, kind);
CREATE INDEX IF NOT EXISTS news_external_links_news_id_idx ON news_external_links (news_id);
CREATE INDEX IF NOT EXISTS news_external_links_status_idx ON news_external_links (status);
