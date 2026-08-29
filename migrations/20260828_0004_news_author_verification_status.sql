-- Each author-publication relationship keeps its editorial provenance.  Legacy
-- links remain available to Administration but are not public authorship until
-- an approved source or manual confirmation is recorded.
ALTER TABLE "news_team_members"
  ADD COLUMN "verification_status" text NOT NULL DEFAULT 'legacy_unverified';

CREATE INDEX "news_team_members_team_verification_news_idx"
  ON "news_team_members" ("team_member_id", "verification_status", "news_id");
