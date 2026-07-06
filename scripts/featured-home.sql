-- Migración no destructiva e idempotente: noticias destacadas en el hero de la home.
-- Se aplica con: node scripts/apply-featured-home.mjs

-- Columna para marcar una noticia como destacada en la caja de Noticias del hero
ALTER TABLE news ADD COLUMN IF NOT EXISTS featured_home boolean DEFAULT false;

-- Índice parcial: acelera la consulta del hero (pocas filas destacadas, orden por fecha desc)
CREATE INDEX IF NOT EXISTS news_featured_home_idx ON news (date DESC) WHERE featured_home = true;
