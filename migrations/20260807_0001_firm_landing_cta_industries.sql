-- Actualiza solamente los valores predeterminados anteriores y conserva cualquier
-- personalización hecha desde Administración → Nuestra Firma.
UPDATE site_config
SET value = 'Practices', value_es = 'Prácticas', updated_at = now()
WHERE key = 'firm_landing_cta_2_label'
  AND value = 'Legal practices'
  AND value_es = 'Prácticas legales';

UPDATE site_config
SET value = 'Industries', value_es = 'Industrias', updated_at = now()
WHERE key = 'firm_landing_cta_3_label'
  AND value = 'Contact'
  AND value_es = 'Contacto';

UPDATE site_config
SET value = '/capabilities/industries', value_es = '/capacidades/industrias', updated_at = now()
WHERE key = 'firm_landing_cta_3_path'
  AND value = '/contact'
  AND value_es = '/contacto';

INSERT INTO site_config (key, value, value_es, type, category, description)
VALUES
  ('firm_landing_cta_4_label', 'Contact', 'Contacto', 'text', 'firm', 'Nuestra Firma — cuarto CTA'),
  ('firm_landing_cta_4_path', '/contact', '/contacto', 'url', 'firm', 'Nuestra Firma — destino del cuarto CTA')
ON CONFLICT (key) DO NOTHING;

-- Acorta únicamente la etiqueta del menú principal. La página y su contenido
-- continúan describiéndose como grupos de práctica por industria.
UPDATE site_config
SET value = 'Industries', value_es = 'Industrias', updated_at = now()
WHERE key = 'nav_industries'
  AND value = 'Industry groups'
  AND value_es = 'Grupos de práctica por industria';
