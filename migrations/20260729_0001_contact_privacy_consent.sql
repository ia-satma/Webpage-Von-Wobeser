ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS accepted_privacy boolean NOT NULL DEFAULT false;

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS consented_at timestamp;

-- Oculta únicamente la etiqueta visual histórica. Si el administrador ya había
-- personalizado el texto, se conserva su valor.
UPDATE site_config
SET value = '', value_es = ''
WHERE key = 'newsletter_eyebrow'
  AND lower(trim(coalesce(value, ''))) = 'newsletter'
  AND lower(trim(coalesce(value_es, ''))) = 'newsletter';
