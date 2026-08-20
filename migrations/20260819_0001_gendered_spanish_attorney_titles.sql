-- La fuente histórica usa el masculino genérico en los perfiles. Esta lista
-- editorial fue revisada contra las biografías bilingües; no deduce género por
-- nombre. Es idempotente y deja intactos los demás cargos y perfiles.
WITH feminine_titles(name, category, spanish_title) AS (
  VALUES
    ('Anna-Maria Brandstädter', 'associate', 'Asociada'),
    ('Virginia Cornett', 'associate', 'Asociada'),
    ('Patricia Kaim', 'partner', 'Socia'),
    ('Laura Maldonado', 'associate', 'Asociada'),
    ('Montserrat Manzano', 'partner', 'Socia'),
    ('Gabriela Negrete', 'associate', 'Asociada'),
    ('Jessika Rocha', 'partner', 'Socia'),
    ('Katharina Roehr', 'partner', 'Socia'),
    ('Rocío Vega', 'associate', 'Asociada'),
    ('Cinthya González', 'associate', 'Asociada'),
    ('Carolina Camacho', 'associate', 'Asociada'),
    ('Libna Macías', 'associate', 'Asociada'),
    ('Regina Godínez', 'associate', 'Asociada'),
    ('Sara Ortiz', 'associate', 'Asociada'),
    ('Déborah Luengo', 'associate', 'Asociada'),
    ('Cynthia Osio', 'associate', 'Asociada'),
    ('Alejandra Arizpe', 'associate', 'Asociada'),
    ('Ileana Pantiga', 'associate', 'Asociada'),
    ('Mariana Gómez-Vallin', 'associate', 'Asociada'),
    ('Sarah Gibert', 'associate', 'Asociada'),
    ('Ana Ruiz', 'associate', 'Asociada'),
    ('Liliana Pérez', 'associate', 'Asociada'),
    ('Melissa Cruz', 'associate', 'Asociada'),
    ('Dolores Jiménez', 'associate', 'Asociada'),
    ('María García', 'associate', 'Asociada'),
    ('Julieta Béjar', 'associate', 'Asociada'),
    ('Daniela Pons', 'associate', 'Asociada'),
    ('Regina Castillo', 'associate', 'Asociada'),
    ('Sofía Reyes', 'associate', 'Asociada'),
    ('Ana Victoria Guevara', 'associate', 'Asociada'),
    ('Ana Alpízar', 'associate', 'Asociada'),
    ('Paola Hernández', 'associate', 'Asociada'),
    ('Alondra Marín', 'associate', 'Asociada'),
    ('Stefania Lopardo', 'associate', 'Asociada'),
    ('Mercedes Jiménez Roel', 'associate', 'Asociada'),
    ('Montserrat García', 'associate', 'Asociada'),
    ('Sofía Alcántara', 'associate', 'Asociada'),
    ('Alexa Mendivil', 'associate', 'Asociada'),
    ('Regina Forte', 'associate', 'Asociada'),
    ('Eliana González', 'associate', 'Asociada'),
    ('Amanda Ibáñez', 'associate', 'Asociada'),
    ('Regina González', 'associate', 'Asociada'),
    ('Gabriela Mancha', 'associate', 'Asociada'),
    ('Mariana Salcedo', 'associate', 'Asociada'),
    ('Margarita Lima', 'associate', 'Asociada'),
    ('María Elisa Vera Madrigal', 'associate', 'Asociada'),
    ('Gabriela Zambrano', 'associate', 'Asociada')
)
UPDATE team_members AS member
SET
  title_es = feminine_titles.spanish_title,
  role_es = CASE
    WHEN lower(btrim(member.role)) = feminine_titles.category THEN feminine_titles.spanish_title
    ELSE member.role_es
  END
FROM feminine_titles
WHERE lower(btrim(member.name)) = lower(feminine_titles.name)
  AND lower(btrim(member.title)) = feminine_titles.category
  AND (
    member.title_es IS DISTINCT FROM feminine_titles.spanish_title
    OR (
      lower(btrim(member.role)) = feminine_titles.category
      AND member.role_es IS DISTINCT FROM feminine_titles.spanish_title
    )
  );
