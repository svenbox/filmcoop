#!/usr/bin/env bash
# Kopierar landningssidan till Next.js public-mappen och bygger/startar om
# containern. Kör efter att du redigerat web/index.html.
set -euo pipefail
cd "$(dirname "$0")"

echo "Kopierar web/index.html -> app/public/landing.html"
cp web/index.html app/public/landing.html

echo "Bygger om och startar om containern..."
docker compose up -d --build

echo "Klart. https://filmcoop.nu/ kör den uppdaterade sidan."
