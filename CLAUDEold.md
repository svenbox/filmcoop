# CLAUDE.md — Filmequity Portal


Detta är instruktionsfilen för Claude Code. Läs hela filen innan du skriver en rad kod.

---

## Vad projektet är

En webbportal för samägande filmproduktion. Producenten hanterar data i en
Google Sheets-fil (konverterad från Excel). Portalen läser från Sheets och
visar personliga ägarandels-vyer för varje crew-medlem och en full producent-vy.

Designreferens: Shortplanner (shortplanner.soxbox.uk) — mörkt/ljust läge,
breadcrumb-navigation, pill-shaped action-knappar i rad, tab-navigation med
underline, rena tabeller med ALL CAPS sektionsrubriker.

Driftsplats: Docker-container på en hemserver (soxbox) bakom SWAG reverse
proxy och Cloudflare Tunnel. Exponeras som `filmequity.soxbox.uk`.

---

## Tech stack

| Lager | Val | Motivering |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components + API routes i ett |
| Auth | NextAuth v4 med Google provider | OAuth utan lösenordshantering |
| Sheets-klient | google-spreadsheet v4 + google-auth-library | Service account read-only |
| Styling | Ren CSS i `globals.css` | Ingen Tailwind, inga komponentbibliotek |
| Deploy | Docker (standalone output) | Körs på soxbox bakom SWAG |
| Språk | TypeScript | Strikt läge aktiverat |

**Inga externa UI-bibliotek.** Allt UI är skrivet i ren HTML + CSS-variabler.

---

## Katalogstruktur

```
filmequity/
├── CLAUDE.md                          ← denna fil
├── docker-compose.yml
├── .env.example
├── README.md
├── nginx/
│   └── filmequity.subdomain.conf      ← SWAG proxy-conf
└── app/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    └── src/
        ├── lib/
        │   └── sheets.ts              ← ALL Sheets-logik samlas här
        └── app/
            ├── globals.css            ← ALL styling, CSS-variabler
            ├── layout.tsx             ← Root layout + SessionProvider
            ├── providers.tsx          ← "use client" SessionProvider-wrapper
            ├── page.tsx               ← redirect baserat på roll
            ├── login/page.tsx         ← Google OAuth-inloggning
            ├── crew/page.tsx          ← crew-vy (4 tabbar)
            ├── producer/page.tsx      ← producent-vy (3 tabbar)
            └── api/
                ├── auth/[...nextauth]/route.ts
                ├── sheets/me/route.ts         ← crew-data för inloggad person
                └── sheets/producer/route.ts   ← full data (kräver producent-roll)
```

**Regel: lägg inte till mappar eller filer utanför denna struktur utan godkännande.**

---

## Miljövariabler (.env)

Alla variabler är obligatoriska om inget annat anges.

```env
# Google OAuth (skapas i Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Sheets service account
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=          # hela nyckeln inkl \n, citationstecken runt värdet

# ID:t i Sheets-URL:en
SPREADSHEET_ID=

# NextAuth
NEXTAUTH_SECRET=             # generera med: openssl rand -base64 32
NEXTAUTH_URL=https://filmequity.soxbox.uk

# Kommaseparerade e-postadresser med producent-åtkomst
PRODUCER_EMAILS=

# Visas i UI om Sheets inte svarar (valfritt)
PROJECT_NAME=
```

Exponera aldrig dessa värden i klient-kod. Server components och API routes
har tillgång; klient-komponenter får data via fetch till API-routes.

---

## Google Sheets — datamodell

Filen heter ursprungligen `samagande_equity_v1.xlsx` men körs som Google Sheets.
Flikar som portalen läser (exakta namn, skiftlägeskänsliga):

### `Egeninsats & Poäng` — huvudregistret

Rubriker i rad 4. Data startar rad 5. Kolumnnamnen används av `sheet.getRows()`.
Tomma rader och rader utan e-post filtreras bort.

| Kolumnrubrik (exakt) | Typ | Kommentar |
|---|---|---|
| `#` | number | Radnummer |
| `Namn` | string | Personens fullständiga namn |
| `Roll / Befattning` | string | T.ex. "Regissör", "DOP" |
| `Klass` | "A"\|"B"\|"C" | Funktionsklass |
| `Fas` | "F1"–"F8" | Produktionsfas |
| `Dagar` | number | Antal arbetsdagar |
| `Cash Fee\n(SEK/dag)` | number | Faktiskt utbetalt dagarvode |
| `Markn.pris\n(SEK/dag)` | number | Marknadspris dagarvode |
| `Deferred\nFee (SEK)` | number | **Formelkolumn** — rör ej |
| `Grundp./dag\n(från inst.)` | number | **Formelkolumn** — rör ej |
| `Klassmult.\n(från inst.)` | number | **Formelkolumn** — rör ej |
| `Poäng\n(beräknat)` | number | **Formelkolumn** — rör ej |
| `Anteckningar` | string | Fritext |
| `E-post` | string | **Tillagd kolumn** — krävs för inloggning |

Kolumnrubriker innehåller `\n` (radbrytning i cellen). `getRows()` returnerar
dem med `\n` i nyckeln — matcha exakt, se `sheets.ts`.

### `Projektinställningar`

Etiketter står i kolumn B, värden fylls i av producenten i kolumn C (gulmarkerade
inmatningsfält). Kolumn D innehåller bara grå exempel-/formathjälptext (t.ex.
"Filmtiteln", "ÅÅÅÅ-MM-DD") — inga riktiga värden, läs den aldrig. Läses med
`getCellByA1()`. Relevanta celler:

| Cell | Innehåll |
|---|---|
| C5 | Projektnamn |
| C6 | Produktionsbolag |
| C7 | Producent |
| C17 | Lock 1-datum (Green Light) |
| C18 | Lock 2-datum (Wrap) |
| C19 | Lock 3-datum (Leverans) |

### `Waterfall Simulering`

Beräknade värden läses med `getCell(row-1, colIndex)` (0-baserat).
Kolumner D=3, E=4, F=5 = Scenario A, B, C.

| Rad (1-baserad) | Värde |
|---|---|
| 15 | Bruttointäkt |
| 16 | Distributionsavgift (negativ) |
| 17 | Netto efter distribution |
| 18 | Finansiärs recoupment (negativ) |
| 19 | Netto efter finansiär |
| 20 | Deferred fee pool (negativ) |
| 21 | Netto efter deferred |
| 22 | Crew-pool (50%) |
| 23 | Finansiärspool (50%) |

---

## Autentisering och behörighet

### Roller

**Crew:** alla inloggade användare vars e-post finns i kolumnen `E-post`.
Ser bara sina egna rader.

**Producent:** e-postadresser listade i env-variabeln `PRODUCER_EMAILS` (kommaseparerade).
Ser alla raders data.

Kontroll sker i API-routes på servern — aldrig i klientkod.

### Flöde

1. Användaren besöker `/` → server component kontrollerar session → redirect till `/crew` eller `/producer`
2. Om ingen session → redirect till `/login`
3. `/login` renderar Google OAuth-knapp
4. Efter inloggning → NextAuth callback → redirect till `/crew`
5. Producent-e-poster redirectas till `/producer`

### Skydda routes

Alla `page.tsx` som kräver inloggning: kontrollera session på klientsidan med
`useSession()` från `next-auth/react`, redirect till `/login` om `unauthenticated`.

API routes: kontrollera session med `getServerSession(authOptions)`, returnera
401 om saknas, 403 om fel behörighet.

---

## CSS-designsystem

All styling sker via CSS-variabler definierade i `globals.css`. Skriv aldrig
inline-färger med hex-koder direkt — använd alltid variablerna.

### Färgvariabler (mörkt/ljust läge via `prefers-color-scheme`)

```css
--bg          /* sidbakgrund */
--bg-card     /* kortbakgrund */
--bg-input    /* inputfält */
--bg-sect     /* sektionsrubriker, alternativa rader */
--text        /* primär text */
--text-2      /* sekundär text, labels */
--text-3      /* muted/placeholder */
--border      /* standard kantlinje */
--border-2    /* subtil kantlinje */
--accent      /* blå accentfärg, aktiva element */
--accent-bg   /* ljus accent-bakgrund */
--green       /* positiva värden, "Sparat"-status */
--red         /* destructiva actions, negativa värden */
--warn-bg/border/text  /* varningsbanner */
```

### Nyckelklasser

```css
.topbar          /* sticky topbar med breadcrumb */
.breadcrumb      /* Filmequity › Bolag › Projekt */
.pill-bar        /* rad med action-knappar */
.pill            /* pill-shaped knapp (neutral) */
.pill.primary    /* blå primär-knapp */
.pill.danger     /* röd destructiv-knapp */
.tab-row         /* tab-navigation container */
.tab-btn         /* enskild tab, lägg .active för aktiv */
.badge-count     /* blå räknare i tab */
.section-header  /* ALL CAPS sektionsrubrik (grå bakgrund) */
.data-table      /* ren tabell utan yttre ram */
.card            /* vit/mörk kortcontainer med border-radius */
.stat-grid       /* 2-kolumns grid för nyckeltal */
.stat-box        /* enskild nyckeltalskort */
.wf-row          /* vattenfall-rad */
.wf-row.total    /* summering i vattenfall */
.wf-row.highlight /* markerad rad (ägarandel) */
.klass-badge     /* cirkulär badge för A/B/C */
.modal-overlay   /* halvtransparent overlay */
.modal           /* modal-panel, sheet-style på mobil */
.scen-tabs       /* scenario-väljare (A/B/C) */
```

Lägg till nya klasser i `globals.css` — inte i komponentfiler.

---

## Komponentregler

### Server vs klient

- **API routes** (`/api/**`): alltid server, `async function`, direkt Sheets-anrop
- **`page.tsx` i `/crew` och `/producer`**: `"use client"` — hämtar data via `fetch("/api/...")`
- **`layout.tsx`**: server component (importerar `Providers` som är client)
- **`page.tsx` i root**: server component (redirect-logik)

### Datahämtning i klientkomponenter

```typescript
useEffect(() => {
  if (status === "unauthenticated") window.location.href = "/login";
  if (status === "authenticated") {
    fetch("/api/sheets/me")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Kunde inte hämta data"));
  }
}, [status]);
```

Visa laddningsstatus medan `status === "loading"` eller `!data && !error`.

### Felhantering

Alla Sheets-anrop kan misslyckas. API routes returnerar alltid:
- `200` med data vid lyckat anrop
- `401 { error: "Ej inloggad" }` om session saknas
- `403 { error: "Åtkomst nekad" }` om fel behörighet
- `404 { error: "Din e-post finns inte i registret" }` om personen ej finns i Sheets

Klienten visar fel inline med `.alert`-klassen, aldrig `alert()` eller `console.error` ensamt.

---

## Sheets-åtkomst — regler

All kommunikation med Google Sheets sker via `src/lib/sheets.ts`. Lägg aldrig
Sheets-logik direkt i API routes eller komponenter.

### Singleton-pattern

`getDoc()` returnerar och cachar ett `GoogleSpreadsheet`-objekt. I Next.js
dev-läge kan modulen laddas om — det är OK, den autentiserar om sig.

### Kolumnrubrikmatchning

Kolumnrubriker i Sheets matchar exakt mot `r.get("rubriknamn")`. Rubrikerna
är som de stod i Excel-filen, inklusive radbrytningar (`\n`). Kolla mot
tabellen i sektionen "Google Sheets — datamodell" ovan.

Om en kolumn inte hittas returnerar `r.get()` `undefined` — alltid ha
fallback: `r.get("Namn") || ""`.

### Read-only

Service account har bara läsrättigheter — kontot är delat med Visningsåtkomst
på själva filen i Drive. Skriv aldrig kod som försöker uppdatera Sheets från
portalen.

OAuth-scopen som används i koden är däremot den fulla `spreadsheets` (inte
`.readonly`): cellbaserade anrop (`loadCells`, används av `getProjectSettings`
och `getWaterfall`) svarar `403 insufficient authentication scopes` med bara
`.readonly`-scopen. Detta är en känd begränsning i `google-spreadsheet`-
biblioteket. Den faktiska skrivbehörigheten stoppas ändå av Drive-delningen,
så det här äventyrar inte read-only-garantin.

---

## Docker och deployment

### docker-compose.yml

Containern heter `filmequity_app`, exponerar port 3000 internt. Den ansluter
till `mediastack` (externt Docker-nätverk där SWAG finns).

```yaml
networks:
  filmequity_net:
    internal: true
  mediastack:
    external: true
```

### Dockerfile

Multi-stage build: `deps` → `builder` → `runner`. Kör som icke-root user
`nextjs`. Next.js `output: "standalone"` kopieras till runner-imagen.

### Bygga och starta

```bash
docker compose up -d --build   # bygg och starta
docker compose logs -f app     # följ loggar
docker compose restart app     # starta om utan rebuild
docker compose down            # stoppa
```

### SWAG nginx-conf

Filen `nginx/filmequity.subdomain.conf` kopieras till SWAG:s `proxy-confs/`.
Den proxyar alla requests till `filmequity_app:3000`. `proxy_set_header Host`
är kritiskt — NextAuth kräver korrekt host för callback-URL:en.

---

## Känsliga filer — rör inte

| Fil | Anledning |
|---|---|
| `.env` | Skapas manuellt av användaren, aldrig av kod |
| `samagande_equity_v1.xlsx` | Excel-källfilen, hanteras separat |
| `nginx/filmequity.subdomain.conf` | Driftsatt på servern, ändringar kräver SWAG-reload |

---

## Att göra / nästa steg

Dessa funktioner är inte byggda än. Bygg dem i denna ordning om du får i uppdrag:

### 1. Dokument-uppladdning per person
Producenten laddar upp PDF-kontrakt. Sparas i Google Drive, länk lagras i
ett extra Sheets-blad (`Dokument`) med kolumner: `E-post | Filnamn | Drive-URL | Datum`.
Crew ser sina dokument i en ny tab "Dokument" i `/crew`.

Implementation:
- Ny API route: `POST /api/docs/upload` (multipart, kräver producent-roll)
- Google Drive API med `drive.files.create` (service account behöver Drive-scope)
- Nytt blad i Sheets: `Dokument` med kolumnerna ovan
- Ny funktion i `sheets.ts`: `getDocsForEmail(email)`
- Ny tab i crew-vyn

### 2. Caching / revalidering
Sheets-anrop är långsamma (~500ms). Lägg till Next.js fetch-cache:
```typescript
// I API route, efter att ha hämtat data:
// next: { revalidate: 60 }  ← cachas 60 sekunder
```
Alternativt: Redis-cache med `ioredis` i en ny container.

### 3. Notifieringar vid lock-punkt
Skicka e-post (via Resend eller Nodemailer) till alla i registret när
producenten uppdaterar ett lock-datum i Sheets.
- Polling-job eller webhook (svårt med Sheets — polling enklare)
- Ny API route: `POST /api/notify/lock` (kräver producent-roll)

### 4. Multi-projekt stöd
Idag hanterar appen ett projekt (en Sheets-fil via `SPREADSHEET_ID`).
Multi-projekt kräver en databas (SQLite eller Postgres) som mappar
`projektId → spreadsheetId`. Faller utanför den nuvarande arkitekturen.

### 5. Finansiärsvy
Separat vy för externa finansiärer: visar waterfall och total deferred pool
men inte individuella löner. Ny roll i `PRODUCER_EMAILS`-systemet eller separat
`FINANCIER_EMAILS`-variabel.

---

## Felsökning

### "Fliken saknas i Sheets"
Fliknamnen i Sheets måste vara exakt (kopierat från Excel):
- `Egeninsats & Poäng` (ampersand, mellanslag)
- `Equity Dashboard`
- `Projektinställningar` (å, ä)
- `Waterfall Simulering`

### GOOGLE_PRIVATE_KEY-fel
Private key i JSON-filen har `\n` som faktiska radbrytningar. I `.env`-filen
måste de vara bokstavliga `\n` (escaped), och `sheets.ts` konverterar dem:
```typescript
key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n")
```
Citera alltid värdet med `"..."` i `.env`-filen.

### NextAuth callback-fel
`NEXTAUTH_URL` måste matcha exakt med den "Authorized redirect URI" du angett
i Google Cloud Console. Inkludera inte trailing slash.

### Tomma värden från Sheets
`getRows()` returnerar cached värden för formelceller. Om Sheets-filen nyss
öppnades och aldrig sparats kan cachen vara tom. Be användaren öppna och spara
filen i Google Sheets en gång.

---

## Kodstil

- TypeScript strikt läge — inga `any`
- Inga `console.log` i produktion — använd `console.error` bara i felhantering
- Alla strängar på svenska i UI (labels, felmeddelanden, knappar)
- Kommentarer på svenska i ny kod som rör domänlogik
- Formler och beräkningar: alltid `parseFloat()` med fallback `|| 0`
- Procent visas som `(n * 100).toFixed(1) + "%"` — aldrig råa decimaltal
- SEK-belopp formateras: `n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })`

---

## Snabbreferens — starta från noll

```bash
# 1. Klona/kopiera projektet till soxbox
scp -r filmequity/ user@soxbox.uk:~/docker/

# 2. Konfigurera
cd ~/docker/filmequity
cp .env.example .env
# Redigera .env med dina värden

# 3. SWAG-conf
cp nginx/filmequity.subdomain.conf /path/to/swag/config/nginx/proxy-confs/
docker exec swag nginx -s reload

# 4. Starta
docker compose up -d --build

# 5. Verifiera
docker compose logs app
curl -I https://filmequity.soxbox.uk
```
