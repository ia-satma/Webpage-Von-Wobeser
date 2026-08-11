-- Etiquetas explícitas para relacionar publicaciones más allá de su categoría o autores.
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Acelera la coincidencia "alguna etiqueta en común" del motor editorial.
CREATE INDEX IF NOT EXISTS news_tags_gin_idx ON news USING GIN (tags);
