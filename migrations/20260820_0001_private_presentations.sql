-- Fase 3: migración exclusivamente aditiva. No elimina ni reescribe registros existentes.
ALTER TABLE generated_presentations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE generated_presentations
  ADD COLUMN IF NOT EXISTS archived_at timestamp;

CREATE INDEX IF NOT EXISTS generated_presentations_status_created_idx
  ON generated_presentations (status, created_at DESC);

CREATE TABLE IF NOT EXISTS media_deletion_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  media_item_id varchar NOT NULL,
  public_path text NOT NULL,
  object_name text,
  status text NOT NULL DEFAULT 'pending',
  requested_by varchar NOT NULL,
  requested_at timestamp NOT NULL DEFAULT now(),
  processed_at timestamp,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);

CREATE UNIQUE INDEX IF NOT EXISTS media_deletion_requests_media_item_idx
  ON media_deletion_requests (media_item_id);

CREATE INDEX IF NOT EXISTS media_deletion_requests_status_requested_idx
  ON media_deletion_requests (status, requested_at);
