# Setup-guide

Komplett instruktion för att sätta upp film.coop (filmcoop.soxbox.uk) på din server.

## Förutsättningar

- Docker + Docker Compose
- En server med publikt domännamn (eller kör lokalt på localhost)
- Ett Google-konto

## Steg 1 — Kalkylbladet

1. [Kopiera Google Sheets-mallen](https://docs.google.com/spreadsheets/d/1dx43tN7y3KS6KGdJs1TEFgOwkvgqB6eps2IiH_eyvT8/copy)
2. Byt namn till din filmtitel
3. Fyll i **Projektinställningar**: projektnamn, bolag, producent, lock-datum
4. Lägg till en kolumn `E-post` i fliken **Egeninsats & Poäng**
5. Fyll i teamets data (namn, roll, klass, fas, dagar, arvoden, e-post)

## Steg 2 — Google Cloud

### Skapa projekt

1. Gå till [console.cloud.google.com](https://console.cloud.google.com)
2. Skapa nytt projekt: `filmcoop`
3. Aktivera **Google Sheets API** och **Google Drive API**

### Service Account (för att läsa Sheets)

1. IAM & Admin → Service Accounts → Create
2. Namn: `filmcoop-sheets`
3. Ladda ner JSON-nyckel
4. Dela din Sheets-fil med service account-e-posten (Viewer-behörighet)

### OAuth-klient (för inloggning)

1. APIs & Services → Credentials → Create OAuth client ID
2. Application type: Web application
3. Authorized redirect URIs: `https://filmcoop.soxbox.uk/api/auth/callback/google`
4. Kopiera Client ID och Client Secret

## Steg 3 — Konfigurera portalen

```bash
git clone https://github.com/tvaatrad/filmcoop
cd filmcoop
cp .env.example .env
```

Fyll i `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=filmcoop-sheets@ditt-projekt.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
SPREADSHEET_ID=   # ID:t från din Sheets-URL
NEXTAUTH_SECRET=  # openssl rand -base64 32
NEXTAUTH_URL=https://filmcoop.soxbox.uk
PRODUCER_EMAILS=din@epost.se
```

## Steg 4 — Starta

```bash
docker compose up -d --build
docker compose logs -f app   # verifiera att allt startade
```

## Steg 5 — Reverse proxy (valfritt)

Om du använder SWAG eller nginx, kopiera `nginx/filmcoop.subdomain.conf` till din proxy-conf-mapp och ladda om.

## Felsökning

**"Din e-post finns inte i registret"** — kontrollera att e-posten i Sheets-kolumnen stämmer exakt med din Gmail.

**Siffror visas som 0** — kontrollera att formelkolumnerna (J, K, L, M) i Sheets är ifyllda och att deferred fee-poolen finns i alla tre scenariernas rad 12 (D12, E12, F12) i Waterfall Simulering.

**OAuth-fel** — kontrollera att redirect URI i Google Cloud matchar exakt med `NEXTAUTH_URL/api/auth/callback/google`.
