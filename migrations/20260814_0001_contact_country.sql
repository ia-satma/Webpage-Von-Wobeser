-- Campo comercial solicitado para identificar el país de cada contacto.
-- Es nullable para conservar todas las solicitudes históricas sin inventar datos.
ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS country text;
