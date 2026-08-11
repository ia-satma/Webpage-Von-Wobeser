-- Una publicación solo puede vincular una vez a cada abogado. Conserva la fila
-- más antigua si algún proceso histórico creó duplicados antes de este índice.
DELETE FROM news_team_members AS duplicate
USING news_team_members AS original
WHERE duplicate.news_id = original.news_id
  AND duplicate.team_member_id = original.team_member_id
  AND duplicate.ctid > original.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS news_team_members_news_member_unique
  ON news_team_members (news_id, team_member_id);

CREATE INDEX IF NOT EXISTS news_team_members_team_news_idx
  ON news_team_members (team_member_id, news_id);
