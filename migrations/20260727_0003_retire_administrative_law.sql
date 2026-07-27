-- Derecho Administrativo se conserva en PostgreSQL como contenido histórico,
-- pero dejó de formar parte de las 18 prácticas públicas oficiales.
UPDATE practice_groups
SET published = false
WHERE slug = 'administrative-law'
  AND published IS DISTINCT FROM false;
