#!/usr/bin/env bash
# Snabbuppdaterar bara landningssidan (web/index.html) och dess bilder
# (app/public/screenshots/) — kopierar dem direkt in i den körande
# containern och startar om den. Ingen ombyggnad av Next.js-appen.
#
# Omstarten krävs för att helt nya filer (t.ex. en ny skärmdump) ska bli
# synliga — Next.js standalone-servern känner annars bara till de filer
# som fanns i public/ när containern startade. Själva omstarten tar bara
# någon sekund och loggar inte ut någon (sessionen är en cookie, inte
# serverminne).
#
# Uppdaterar också app/public/landing.html lokalt så att nästa fullständiga
# ombyggnad (./update-landing.sh eller docker compose up --build) inte
# råkar återställa ändringen.
set -euo pipefail
cd "$(dirname "$0")"

CONTAINER="filmcoop_app"

if ! docker ps --filter "name=${CONTAINER}" --filter "status=running" --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Containern ${CONTAINER} kör inte — använd ./update-landing.sh istället (bygger och startar den)."
  exit 1
fi

echo "Kopierar web/index.html -> app/public/landing.html (lokalt)"
cp web/index.html app/public/landing.html

echo "Kopierar in sidan i den körande containern..."
docker cp web/index.html "${CONTAINER}:/app/public/landing.html"

if [ -d app/public/screenshots ] && [ -n "$(ls -A app/public/screenshots 2>/dev/null)" ]; then
  echo "Kopierar in skärmdumpar..."
  docker cp app/public/screenshots/. "${CONTAINER}:/app/public/screenshots/"
fi

echo "Startar om containern (krävs för att nya filer ska bli synliga)..."
docker restart "${CONTAINER}" >/dev/null

echo "Klart. https://filmcoop.nu/ kör den uppdaterade sidan."
