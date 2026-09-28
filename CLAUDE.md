# CLAUDE.md — film.coop

Läs hela filen. Utför alla steg i ordning. Fråga inte om lov — kör.

---

## Vad du ska göra

1. Byt namn på projektet från `filmequity` till `filmcoop` på soxbox
2. Uppdatera konfiguration och miljövariabler
3. Lägg in landningssidan
4. Sätt upp SWAG-konfiguration
5. Bygg och starta Docker-containern
6. Skapa GitHub-repot

Servern heter soxbox. Tjänsterna körs under `~/docker/`.
Portalen ska vara tillgänglig på `https://filmcoop.soxbox.uk`.

---

## Steg 1 — Byt namn på befintlig installation

```bash
cd ~/docker
mv filmequity filmcoop
sed -i 's/filmequity_app/filmcoop_app/g' filmcoop/docker-compose.yml
sed -i 's/filmequity_net/filmcoop_net/g' filmcoop/docker-compose.yml
grep -E "container_name|filmcoop" filmcoop/docker-compose.yml
```

---

## Steg 2 — Uppdatera .env

```bash
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://filmcoop.soxbox.uk|' ~/docker/filmcoop/.env
sed -i 's|PROJECT_NAME=.*|PROJECT_NAME=film.coop|' ~/docker/filmcoop/.env
grep -E "NEXTAUTH_URL|PROJECT_NAME" ~/docker/filmcoop/.env
```

---

## Steg 3 — Uppdatera OAuth i Google Cloud (manuellt steg)

Gå till: https://console.cloud.google.com/auth/clients?project=filmequity

Lägg till denna Authorized redirect URI:
`https://filmcoop.soxbox.uk/api/auth/callback/google`

Den gamla filmequity-URI:n kan ligga kvar.

---

## Steg 4 — Landningssidan

Landningssidan ska visas på `https://filmcoop.soxbox.uk/` för besökare
som inte är inloggade. Inloggade användare redirectas till /crew eller /producer.

### 4a. Kopiera landningssidan till Next.js public-mappen

```bash
cp ~/docker/filmcoop/web/index.html ~/docker/filmcoop/app/public/landing.html
```

### 4b. Uppdatera app/src/app/page.tsx

Ersätt hela filen med detta:

```typescript
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/landing.html");
  }

  const producerEmails = (process.env.PRODUCER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (producerEmails.includes(session.user?.email?.toLowerCase() || "")) {
    redirect("/producer");
  }

  redirect("/crew");
}
```

---

## Steg 5 — SWAG nginx-konfiguration

Skapa filen `~/docker/filmcoop/nginx/filmcoop.subdomain.conf`:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name filmcoop.*;
    include /config/nginx/ssl.conf;
    client_max_body_size 10M;

    location / {
        include /config/nginx/proxy.conf;
        include /config/nginx/resolver.conf;
        set $upstream_app filmcoop_app;
        set $upstream_port 3000;
        set $upstream_proto http;
        proxy_pass $upstream_proto://$upstream_app:$upstream_port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kopiera och ladda om SWAG:

```bash
cp ~/docker/filmcoop/nginx/filmcoop.subdomain.conf \
   ~/docker/swag/config/nginx/proxy-confs/filmcoop.subdomain.conf
docker exec swag nginx -s reload
```

---

## Steg 6 — Bygg och starta

```bash
cd ~/docker/filmcoop
docker compose down 2>/dev/null || true
docker compose up -d --build
docker compose logs -f app
```

Verifiera:
```bash
curl -sI https://filmcoop.soxbox.uk | head -5
```

---

## Steg 7 — GitHub-repot

Skapa `.gitignore` i `~/docker/filmcoop/`:

```
.env
node_modules/
.next/
app/
```

Initiera och pusha:

```bash
cd ~/docker/filmcoop
git init
git add README.md LICENSE CONTRIBUTING.md .gitignore .env.example \
        docs/ tools/ web/
git commit -m "film.coop — initial release"
gh repo create tvaatrad/filmcoop --public \
   --description "Öppen infrastruktur för kooperativ filmproduktion"
git remote add origin git@github.com:tvaatrad/filmcoop.git
git push -u origin main
```

Om `gh` saknas:
```bash
sudo apt install gh -y && gh auth login
```

---

## Steg 8 — Verifiera allt

```bash
curl -sI https://filmcoop.soxbox.uk | head -3
docker ps | grep filmcoop
docker compose -f ~/docker/filmcoop/docker-compose.yml logs app --tail 20
gh repo view tvaatrad/filmcoop
```

---

## Felsökning

**Container startar inte**
```bash
docker compose logs app | tail -30
# Vanligast: saknat värde i .env
```

**SWAG 502 Bad Gateway**
```bash
docker exec swag nginx -t
docker ps | grep filmcoop   # kontrollera att containern kör
```

**OAuth-fel**
- Kontrollera att `https://filmcoop.soxbox.uk/api/auth/callback/google`
  finns i Google Cloud Console under Authorized redirect URIs
- Kontrollera att NEXTAUTH_URL i .env matchar exakt (ingen trailing slash)

**Sheets visar 0 kr**
- Kontrollera att kolumn O (E-post) finns i Sheets-fliken "Egeninsats & Poäng"
- Kontrollera att D12, E12, F12 i Waterfall Simulering innehåller 398300
- Kontrollera att formelkolumner J, K, L, M är ifyllda (rad 5–25)

---

## Projektöversikt

```
~/docker/filmcoop/
├── CLAUDE.md              ← denna fil
├── docker-compose.yml
├── .env                   ← COMMITTAS ALDRIG
├── .env.example
├── .gitignore
├── README.md              → GitHub
├── LICENSE                → GitHub
├── CONTRIBUTING.md        → GitHub
├── web/
│   └── index.html         → GitHub + kopieras till app/public/landing.html
├── docs/
│   ├── ramverk.md         → GitHub
│   ├── setup.md           → GitHub
│   └── crowdfunding.md    → GitHub
├── tools/
│   └── filmcoop_v1.xlsx   → GitHub (kalkylbladet)
├── nginx/
│   └── filmcoop.subdomain.conf   → kopieras till SWAG
└── app/                   → COMMITTAS INTE (portalens källkod)
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   └── landing.html   ← kopieras från web/index.html
    └── src/
        └── app/
            ├── page.tsx   ← uppdateras i steg 4b
            └── ...
```

## Vad som är byggt i portalen

- Inloggning via Google OAuth
- Crew-vy: översikt, mitt bidrag, utbetalningsordning, dokument
- Producent-vy: översikt, crew-tabell, team-ranklista, waterfall
- Utskrivbart utdrag (/print)
- Onboarding-modal, tooltips, lock-förklaringar
- Svenska termers: Ägarenheter, Uppskjutet arvode, Utbetalningsordning

## Vad som återstår

1. Crowdfunding-registrering
2. Dokument-uppladdning per person (PDF → Google Drive)
3. Notifieringar vid lock-punkter
4. Multi-projekt stöd
