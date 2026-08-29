-- A person linked to a publication can be its author or a verified
-- professional related to an event, recognition or communication. New
-- historical rows start conservatively as related until the following
-- evidence-backed migration assigns Article author roles.
ALTER TABLE "news_team_members"
  ADD COLUMN "relationship_role" text NOT NULL DEFAULT 'related'
  CHECK ("relationship_role" IN ('author', 'related'));

CREATE INDEX "news_team_members_team_verification_role_news_idx"
  ON "news_team_members" ("team_member_id", "verification_status", "relationship_role", "news_id");
