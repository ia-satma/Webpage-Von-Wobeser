-- Fuente editorial opcional y verificable para publicaciones externas o PDFs.
-- La migración es estrictamente aditiva; la curaduría de contenido se aplica por un
-- comando explícito e idempotente después de que la columna exista.
ALTER TABLE news ADD COLUMN source_url text;
