CREATE TABLE IF NOT EXISTS editorial_typography (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  field text NOT NULL,
  language varchar(2) NOT NULL CHECK (language IN ('en', 'es')),
  family varchar(12) NOT NULL CHECK (family IN ('auto', 'gelasio', 'inter')) DEFAULT 'auto',
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT editorial_typography_target_unique UNIQUE (entity_type, entity_id, field, language)
);

CREATE INDEX IF NOT EXISTS editorial_typography_entity_idx
  ON editorial_typography (entity_type, entity_id);
