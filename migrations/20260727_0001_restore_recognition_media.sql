CREATE TEMP TABLE recognition_media_replacements (
  old_path text PRIMARY KEY,
  new_path text NOT NULL
) ON COMMIT DROP;

INSERT INTO recognition_media_replacements (old_path, new_path) VALUES
  ('/uploads/26210a9c4975c40fe22c8aa0b1b7db4b.png', '/images/recognitions/2026/chambers-global-2026.webp'),
  ('/uploads/e39b0f797136f6ea470e43778157fdc8.png', '/images/recognitions/2026/chambers-latin-america-2026.webp'),
  ('/uploads/3c54e6ed736fa4bfcbf59c6f5b5bb120.png', '/images/recognitions/2026/ip-stars.webp'),
  ('/uploads/3149479eee1d53d7287e559cc598d6aa.png', '/images/recognitions/2026/iflr-1000.webp'),
  ('/uploads/02a070a3976729f6664547f5b4a24107.png', '/images/recognitions/2026/legal-500-latin-america-2026.webp'),
  ('/uploads/feb5bbe55eadc3e51393c49a7f24fdf0.png', '/images/recognitions/2026/latin-lawyer-250-2026.webp'),
  ('/uploads/787cc8babe4eb6a4db2a23ff95ef054a.png', '/images/recognitions/2026/gcr-100-2026.webp'),
  ('/uploads/47fbe0034bb49721d273681c992a4fec.png', '/images/recognitions/2026/gar-100-2025.webp'),
  ('/uploads/6328c6e9d4ab3537fe28d169b8f92663.png', '/images/recognitions/2026/itr-world-tax-2026.webp');

UPDATE rankings AS target
SET logo_url = replacement.new_path
FROM recognition_media_replacements AS replacement
WHERE target.logo_url = replacement.old_path;

UPDATE awards AS target
SET logo_url = replacement.new_path
FROM recognition_media_replacements AS replacement
WHERE target.logo_url = replacement.old_path;

UPDATE representative_clients AS target
SET logo_url = replacement.new_path
FROM recognition_media_replacements AS replacement
WHERE target.logo_url = replacement.old_path;

UPDATE alliances AS target
SET logo_url = replacement.new_path
FROM recognition_media_replacements AS replacement
WHERE target.logo_url = replacement.old_path;

UPDATE media_items AS target
SET
  path = replacement.new_path,
  filename = regexp_replace(replacement.new_path, '^.*/', ''),
  mime_type = 'image/webp',
  size = NULL
FROM recognition_media_replacements AS replacement
WHERE target.path = replacement.old_path;

UPDATE site_config AS target
SET value = replacement.new_path
FROM recognition_media_replacements AS replacement
WHERE target.value = replacement.old_path;

UPDATE site_config AS target
SET value_es = replacement.new_path
FROM recognition_media_replacements AS replacement
WHERE target.value_es = replacement.old_path;
