# Setup-guide

Komplett instruktion för att sätta upp film.coop (filmcoop.nu) på din server.

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

Valfritt: fliken `Frågor och svar` (kolumn A = fråga, B = svar) visas för crew som vanliga frågor på översikten, med obesvarade frågor markerade. Skriptet nedan skapar fliken med sju vanliga frågor. Producentens kontaktuppgifter hämtas från fliken `Teamlista` (raden med position Producent, om "Visa på webb" är JA), och datum för utveckling, inspelning och leverans från Projektinställningar C8:C10.

Valfritt: fliken `Pooler` anger hur teamets del delas (produktionsbolagets pool, initiativtagarnas pool och tre skivor; se ramverket avsnitt 5b) och var producenten fördelar initiativtagarnas pool (B13:C32: namn och andel av poolen). Saknas fliken används 5 / 10 / 25 / 40 / 20 %. Summan av de fem andelarna ska vara 100 %, annars varnar portalen och använder standardvärdena. Skriptet nedan skapar fliken och skriver om Equity Dashboard så att ägarandelen räknas med samma poolmodell som portalen (kolumn F är summan av skivorna H:J och initiativandelen K, och Personutdrag följer med).

Länken till budgetkalkylbladet ligger i **Projektinställningar!C15**. Totalbudget (C11), egeninsats (C13) och fliken Budgetdata läser alla från den cellen, så du byter budget genom att klistra in en ny länk där. Skriptet nedan lägger in cellen och kopplar om formlerna i äldre kopior.

Valfritt: lägg till kolumnen `Avtal` (JA/NEJ) sist bland rubrikerna i **Egeninsats & Poäng**. Portalen visar då vem som skrivit under rättighetsöverlåtelse och Participation Agreement, och varnar producenten för dem som saknar avtal. Skriptet nedan lägger till kolumnen åt dig.

Har du en äldre kopia av mallen kan du synka dess vattenfall med portalens modell genom att köra [`tools/uppdatera-vattenfall.gs`](../tools/uppdatera-vattenfall.gs) en gång (instruktioner i filens huvud). Då visar kalkylbladet och portalen samma siffror för samma scenario.

## Steg 2 — Google Cloud

### Skapa projekt

1. Gå till [console.cloud.google.com](https://console.cloud.google.com)
2. Skapa nytt projekt: `filmcoop`
3. Aktivera **Google Sheets API** och **Google Drive API**

### Service Account (för att läsa Sheets)

1. IAM & Admin → Service Accounts → Create
2. Namn: `filmcoop-sheets`
3. Ladda ner JSON-nyckel
4. Dela varje projekts Sheets-fil med service account-e-posten (Viewer-behörighet) — det gör du för varje nytt projekt, se Steg 5

### OAuth-klient (för inloggning)

1. APIs & Services → Credentials → Create OAuth client ID
2. Application type: Web application
3. Authorized redirect URIs: `https://filmcoop.nu/api/auth/callback/google`
4. Kopiera Client ID och Client Secret

## Steg 3 — Konfigurera portalen

```bash
git clone https://github.com/svenbox/filmcoop
cd filmcoop
cp .env.example .env
```

Fyll i `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=filmcoop-sheets@ditt-projekt.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
NEXTAUTH_SECRET=  # openssl rand -base64 32
NEXTAUTH_URL=https://filmcoop.nu
ADMIN_EMAILS=din@epost.se   # får använda /admin och lägga till projekt
```

Projekt läggs till på adminsidan (Steg 5), inte i `.env`. Om du uppgraderar en äldre installation som har `SPREADSHEET_ID` och `PRODUCER_EMAILS` i `.env` skapas ett projekt av dem automatiskt första gången portalen startar, och `PRODUCER_EMAILS` räknas som admin tills du sätter `ADMIN_EMAILS`.

## Steg 4 — Starta

```bash
docker compose up -d --build
docker compose logs -f app   # verifiera att allt startade
```

## Steg 5 — Lägg till projekt

Portalen hanterar flera filmprojekt, ett kalkylblad per film. Projekten läggs till på adminsidan:

1. Gör en kopia av kalkylbladsmallen (Steg 1) för den nya filmen och fyll i den.
2. Dela kalkylbladet med service account-e-posten (Viewer räcker). Adressen visas på adminsidan.
3. Logga in på `/admin` (kräver att din e-post står i `ADMIN_EMAILS`).
4. Fyll i projektnamn, klistra in länken till kalkylbladet och ange producentens e-post (flera avgränsas med kommatecken). Portalen kontrollerar direkt att kalkylbladet går att nå och har rätt flikar.

Crew behöver inte läggas till — de hittas via e-postkolumnen i kalkylbladet och ser sina projekt på `/projekt` efter inloggning. Producenter ser projektets fullständiga vy; admin ser alla projekt. Projektlistan sparas i Docker-volymen `filmcoop_data`.

## Steg 6 — Reverse proxy (valfritt)

Om du använder SWAG eller nginx, kopiera `nginx/filmcoop.subdomain.conf` till din proxy-conf-mapp och ladda om.

## Felsökning

**"Servicekontot saknar åtkomst" när du lägger till ett projekt** — kalkylbladet är inte delat med service account-e-posten. Dela det (Viewer) och försök igen.

**Jag ser inget projekt efter inloggning** — din e-post står varken i projektets producentlista eller i E-post-kolumnen i kalkylbladet.

**"Din e-post finns inte i registret"** — kontrollera att e-posten i Sheets-kolumnen stämmer exakt med din Gmail.

**Siffror visas som 0** — kontrollera att formelkolumnerna (J, K, L, M) i Sheets är ifyllda och att deferred fee-poolen finns i alla tre scenariernas rad 12 (D12, E12, F12) i Waterfall Simulering.

**OAuth-fel** — kontrollera att redirect URI i Google Cloud matchar exakt med `NEXTAUTH_URL/api/auth/callback/google`.
