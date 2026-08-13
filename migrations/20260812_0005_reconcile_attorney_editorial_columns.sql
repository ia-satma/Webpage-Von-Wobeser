-- Reconciliación no destructiva para entornos de Replit que se quedaron con
-- una versión parcial de la migración editorial de abogados. Estas columnas
-- contienen la introducción y los idiomas en español de 142 perfiles; nunca
-- deben eliminarse al comparar desarrollo con producción.
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio_intro text;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio_intro_es text;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS languages_es jsonb;
