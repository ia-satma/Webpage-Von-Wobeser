#!/usr/bin/env bash
#
# Empaqueta el frontend del espejo dentro del repo para deploy (ej. Replit).
# Excluye los PDFs (686 MB) y archivos basura de macOS. Las fotos de abogados
# las sirve el backend, no el espejo, así que el chrome + páginas pesan poco.
#
# Uso:
#   scripts/package-mirror.sh [SRC] [DEST]
#   SRC  por defecto: ../mirror     (espejo en la carpeta hermana)
#   DEST por defecto: ./frontend-mirror  (lo que config.ts busca en prod)
#
# Tras correrlo: el server detecta ./frontend-mirror automáticamente (o define
# MIRROR_DIR). Decide aparte si commiteas esta carpeta o la subes a Replit fuera de git.
set -euo pipefail

SRC="${1:-../mirror}"
DEST="${2:-./frontend-mirror}"

if [ ! -f "$SRC/index.html" ]; then
  echo "❌ No encuentro el espejo en '$SRC' (falta index.html). Pasa la ruta como primer argumento." >&2
  exit 1
fi

echo "📦 Empaquetando espejo: $SRC → $DEST (sin PDFs)"
mkdir -p "$DEST"
rsync -a --delete \
  --exclude 'assets/files/PDF' \
  --exclude 'images/PDF_news' \
  --exclude '._*' \
  --exclude '.DS_Store' \
  "$SRC/" "$DEST/"

# Limpia cualquier AppleDouble que el volumen haya colado.
find "$DEST" -name '._*' -delete 2>/dev/null || true

echo "✅ Listo. Tamaño del paquete:"
du -sh "$DEST"
echo "ℹ️  El server lo detecta automáticamente (config.ts) o vía MIRROR_DIR=$DEST"
