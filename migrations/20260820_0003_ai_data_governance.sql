ALTER TABLE agent_knowledge ADD COLUMN IF NOT EXISTS data_classification text NOT NULL DEFAULT 'unclassified';
ALTER TABLE agent_knowledge ADD COLUMN IF NOT EXISTS approved_for_ai_at timestamp;
ALTER TABLE agent_knowledge ADD COLUMN IF NOT EXISTS approved_for_ai_by varchar;

CREATE TABLE IF NOT EXISTS ai_governance_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  operation text NOT NULL,
  purpose text NOT NULL,
  agent_type text,
  classification text NOT NULL,
  decision text NOT NULL,
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_sha256 varchar(64) NOT NULL,
  content_bytes integer NOT NULL,
  policy_version text NOT NULL,
  actor_id varchar,
  job_id varchar,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_governance_events_created_idx
  ON ai_governance_events (created_at);
CREATE INDEX IF NOT EXISTS ai_governance_events_decision_created_idx
  ON ai_governance_events (decision, created_at);

CREATE TABLE IF NOT EXISTS protected_field_envelopes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_id varchar NOT NULL,
  field_name text NOT NULL,
  ciphertext text NOT NULL,
  key_id text NOT NULL,
  encryption_version integer NOT NULL DEFAULT 1,
  content_sha256 varchar(64) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS protected_field_envelopes_resource_idx
  ON protected_field_envelopes (resource_type, resource_id);
CREATE UNIQUE INDEX IF NOT EXISTS protected_field_envelopes_version_idx
  ON protected_field_envelopes (resource_type, resource_id, field_name, encryption_version);
