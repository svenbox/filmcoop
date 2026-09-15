# Crowdfunding-integration

**Status: Under utveckling — bidrag välkomnas**

---

## Visionen

Vad händer om publiken inte bara betalar för en film — utan äger den?

Traditionell filmcrowdfunding (Kickstarter, Indiegogo) ger bidragsgivare merchandise, screenings och credits. Det är transaktionellt, inte transformativt.

filmcoop.soxbox.uk-modellen erbjuder något annat: **dokumenterade ägarenheter i filmens ekonomiska resultat**. Samma system som teamet använder — öppet, transparent, juridiskt bindande.

---

## Hur det skulle fungera

### Struktur

Varje film startar ett separat juridiskt subjekt — troligen ett **kooperativ** eller en **ekonomisk förening** under svensk lag. Det ger:

- Enkel inträdesprocess för nya ägare
- Begränsad personlig ansvarighet
- Transparent röstningsstruktur
- Inga krav på aktiekapital

### Ägarenheter för bidragsgivare

En crowdfunding-kampanj sätter ett pris per ägarenhet. Exempel:

```
Filmens totala ägarenheter: 10 000
Teamets enheter (fastslagna vid Lock 1): 8 691
Crowdfunding-pool: 1 309 enheter
Pris per enhet: 100 kr
Campagnmål: 130 900 kr
```

Bidragsgivare som köper 10 enheter för 1 000 kr äger 0,1% av crowdfunding-poolen, vilket ger 0,013% av teamets utbetalningspool.

### Waterfall-position

Crowdfunding-ägare placeras **efter** teamets uppskjutna arvoden men **parallellt** med eller **efter** externa investerare, beroende på kampanjens struktur.

```
Steg 1: Distributör
Steg 2: Externa investerare (recoupment)
Steg 3: Uppskjutna arvoden
Steg 4a: Teamets pool (50%)
Steg 4b: Crowdfunding-pool (del av de 50%)
Steg 5: Investerarpool
```

### Transparens

Alla ägare — team och publik — ser samma waterfall via portalen. Ingen skillnad i informationstillgång baserat på ägarandel.

---

## Juridiska frågor att lösa

- [ ] Optimal bolagsform för svenska förhållanden (kooperativ vs. ekonomisk förening)
- [ ] Prospektkrav vid offentliga investeringserbjudanden (Finansinspektionen)
- [ ] Skattemässig behandling av ägarenheter för privatpersoner
- [ ] Avtalsmall för crowdfunding-ägare (Participation Agreement)
- [ ] Process för utbetalning till många små ägare

---

## Plattformsalternativ

### Option A: Befintlig plattform + filmcoop.soxbox.uk
Integrera med Kickstarter/Indiegogo för pengainsamling. Ägarenheterna registreras separat i filmcoop.soxbox.uk-systemet. Enklast att bygga, svårast att kommunicera.

### Option B: Fristående kampanjsida
Bygg en enkel kampanjsida som integreras direkt med filmcoop.soxbox.uk. Betalning via Stripe. Ägarenheter registreras automatiskt.

### Option C: Befintlig equity crowdfunding
Samarbeta med befintliga equity crowdfunding-plattformar (FundedByMe m.fl.). Kräver att de förstår och accepterar filmbranschens specifika waterfall-logik.

---

## Bidra

Om du har kunskap inom:
- Svensk kooperativ-rätt eller ekonomisk föreningsrätt
- Finansinspektionens regelverk kring publika erbjudanden
- Crowdfunding-plattforms-integration
- Stripe eller betalningshantering

— öppna ett issue på GitHub eller hör av dig direkt.

---

## Tidslinje (preliminär)

- **Q4 2026:** Juridisk grundstruktur klar, avtalsmall v1
- **Q1 2027:** Teknisk prototyp för registrering av crowdfunding-ägare
- **Q2 2027:** Första riktiga kampanj med en svensk produktion
