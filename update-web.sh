#!/usr/bin/env bash
# Snabbuppdaterar bara landningssidan (web/index.html) — kopierar den direkt
# in i den körande containern. Ingen ombyggnad, inget omstart, ändringen
# syns direkt eftersom filen bara serveras statiskt.
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

echo "Kopierar in i den körande containern (ingen ombyggnad)..."
docker cp web/index.html "${CONTAINER}:/app/public/landing.html"

echo "Klart. https://filmcoop.soxbox.uk/ kör den uppdaterade sidan direkt."
