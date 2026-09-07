-- Dato editorial reversible para el directorio de Socios. La visibilidad del
-- año es independiente de `published`, por lo que ocultarlo no despublica al
-- perfil ni modifica su contenido.
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS partner_since_year integer;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS show_partner_since boolean NOT NULL DEFAULT true;
