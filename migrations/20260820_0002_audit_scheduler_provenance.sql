-- Fase 4: infraestructura aditiva de auditoría, scheduler y procedencia.
-- No elimina ni reescribe registros existentes.
CREATE TABLE IF NOT EXISTS admin_audit_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  resource text NOT NULL,
  resource_id varchar,
  actor_id varchar,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx
  ON admin_audit_events (created_at);
CREATE INDEX IF NOT EXISTS admin_audit_events_actor_created_idx
  ON admin_audit_events (actor_id, created_at);
CREATE INDEX IF NOT EXISTS admin_audit_events_resource_created_idx
  ON admin_audit_events (resource, created_at);

CREATE TABLE IF NOT EXISTS scheduled_task_runs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name text NOT NULL,
  scheduled_for timestamp NOT NULL,
  status text NOT NULL DEFAULT 'running',
  attempts integer NOT NULL DEFAULT 1,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  commit_sha varchar(40),
  build_sha256 varchar(64),
  started_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_task_runs_task_window_idx
  ON scheduled_task_runs (task_name, scheduled_for);
CREATE INDEX IF NOT EXISTS scheduled_task_runs_status_started_idx
  ON scheduled_task_runs (status, started_at);

CREATE TABLE IF NOT EXISTS deployment_artifacts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  build_sha256 varchar(64) NOT NULL,
  commit_sha varchar(40) NOT NULL,
  package_lock_sha256 varchar(64) NOT NULL,
  sbom_sha256 varchar(64) NOT NULL,
  server_bundle_sha256 varchar(64) NOT NULL,
  public_assets_sha256 varchar(64) NOT NULL,
  source_tree_dirty boolean NOT NULL DEFAULT false,
  built_at timestamp NOT NULL,
  first_deployed_at timestamp NOT NULL DEFAULT now(),
  last_seen_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS deployment_artifacts_build_sha_idx
  ON deployment_artifacts (build_sha256);
CREATE INDEX IF NOT EXISTS deployment_artifacts_last_seen_idx
  ON deployment_artifacts (last_seen_at);
