-- Normaliza únicamente los cargos españoles de Socios que se guardaron como
-- "Partner". Es idempotente y preserva "Socia" y los demás cargos legales.
UPDATE team_members
SET title_es = 'Socio'
WHERE lower(btrim(title_es)) = 'partner'
  AND (
    coalesce(is_partner, false)
    OR lower(btrim(title)) = 'partner'
    OR lower(btrim(role)) = 'partner'
  );

UPDATE team_members
SET role_es = 'Socio'
WHERE lower(btrim(role_es)) = 'partner'
  AND (
    coalesce(is_partner, false)
    OR lower(btrim(title)) = 'partner'
    OR lower(btrim(role)) = 'partner'
  );
