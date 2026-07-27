-- El orden de reconocimientos es global y administrable. Esta migración solo
-- asigna la prioridad inicial solicitada; no cambia textos, años, enlaces,
-- visibilidad ni medios.
WITH classified AS (
  SELECT
    id,
    year,
    "order" AS previous_order,
    created_at,
    CASE
      WHEN logo_url ILIKE '%chambers-global%'
        OR name ILIKE '%chambers%global%' THEN 1
      WHEN logo_url ILIKE '%legal-500%'
        OR name ILIKE '%legal%500%'
        OR publication ILIKE '%legal%500%' THEN 2
      WHEN logo_url ILIKE '%latin-lawyer-250%'
        OR name ILIKE '%latin%lawyer%250%'
        OR publication ILIKE '%latin%lawyer%250%' THEN 3
      WHEN logo_url ILIKE '%chambers-latin-america%'
        OR name ILIKE '%chambers%latin%america%' THEN 4
      WHEN logo_url ILIKE '%gar-100%'
        OR name ILIKE '%gar%100%'
        OR publication ILIKE '%global%arbitration%review%' THEN 5
      ELSE 1000
    END AS requested_priority
  FROM rankings
),
positioned AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        requested_priority ASC,
        year DESC,
        previous_order ASC,
        created_at ASC,
        id ASC
    )::integer AS new_order
  FROM classified
)
UPDATE rankings AS target
SET "order" = positioned.new_order
FROM positioned
WHERE target.id = positioned.id;
