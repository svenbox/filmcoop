# Ramverk för samägande filmproduktion

**Version 1.0 — Konceptdokument**  
Svante Tidholm / Två Träd AB  
MIT-licens — fritt att använda och anpassa

---

## 1. Filosofi och syfte

Det här ramverket beskriver ett system för rättvist och transparent samägande av en filmproduktion — från de allra första stegen i development fram till recoupment efter försäljning eller distribution.

Systemet bygger på tre grundprinciper:

- **Tidigt engagemang belönas.** Den som går in tidigt tar större risk och ska kompenseras för det.
- **Funktion värderas.** Nyckelfunktioner med unikt konstnärligt eller tekniskt ansvar väger tyngre.
- **Faktiskt bidrag räknas.** Ägarenheter tjänas in genom konkret arbete — inte bara genom att inneha en titel.

> Modellen är inspirerad av det poängsystem som regissörerna Clint Bentley och Greg Kwedar utvecklade för filmerna *Jockey* (2021) och *Sing Sing* (2024).

---

## 2. Grundbegrepp

### Ägarenheter (Points)

Ägarenheter är den grundläggande valutan. De representerar en relativ andel i filmens ekonomiska resultat — inte i produktionsbolaget som sådant.

Ägarenheter är **relativa**: om teamet har 8 000 enheter totalt och du har 800, äger du 10% av teamets pool.

### Uppskjutet arvode (Deferred Fee)

Skillnaden mellan marknadsmässigt arvode och det reducerade arvode som betalas under produktion. Bokförs som produktionskostnad och återbetalas ur filmens intäkter **innan** vinst räknas.

### Fasindelning

| Fas | Benämning | Riskpremie | Kommentar |
|---|---|---|---|
| F1 | Development | 1,5× | Osäkert om filmen blir av |
| F2 | Pre-production | 1,25× | Produktionsbeslut ej fattat |
| F3 | Pilot / Testinspelning | 1,25× | Valfri fas |
| F4 | Production Fas 1 | 1,0× | Green light |
| F5 | Production Fas 2 | 1,0× | Valfri (serie, block) |
| F6 | Post-production | 1,0× | Klippning, ljud, VFX |
| F7 | Promotion / Lansering | 1,0× | Festival, press |
| F8 | Övrigt | 1,0× | Projektspecifik användning |

---

## 3. Poängsystemet

### Funktionskategorier

| Klass | Roller (exempel) | Multiplikator |
|---|---|---|
| A | Regissör, DOP, Scenograf, Klippare, Kompositör, Producent (lead) | 1,5× |
| B | 1:e AD, Kostymör, Ljudmästare, Colorist, Manusförfattare | 1,2× |
| C | PA, Grip, Gaffer, Rekvisitör, övrig crew | 1,0× |

### Formel

```
Ägarenheter = Dagar × Faspoäng × Klassmultiplikator
```

**Exempel:** DOP (klass A) arbetar 30 dagar i pre-production (faspoäng 12) och 40 dagar under inspelning (faspoäng 10):

- F2: 30 × 12 × 1,5 = **540 enheter**
- F4: 40 × 10 × 1,5 = **600 enheter**
- Totalt: **1 140 enheter**

---

## 4. Lock-punkter

Ägarandelarna låses vid tre definierade tidpunkter:

**Lock 1 — Green Light**  
Omedelbart innan inspelning. Poäng från F1 och F2 fastslås. Kan ej ändras retroaktivt.

**Lock 2 — Wrap**  
Sista inspelningsdagen. Inspelningspoängen fastslås. Ny finansiär som tillkommer efter Lock 1 hanteras separat.

**Lock 3 — Leverans**  
Vid godkänd teknisk leverans eller signerat distributionsavtal. Det slutgiltiga registret fastslås.

---

## 5. Utbetalningsordning (Waterfall)

Alla intäkter flödar genom vattenfallet i denna ordning:

| Steg | Part | Vad |
|---|---|---|
| 1 | Distributör | Avgifter och kostnader (typiskt 20–30% av brutto) |
| 2 | Extern finansiär | Återbetalning av kapital + avtalad avkastning (ex. 1,2×) |
| 3 | Uppskjutna arvoden | Alla deferred fees betalas pro rata |
| 4 | Teamets pool (50%) | Fördelas efter ägarenheter |
| 5 | Investerarpool (50%) | Fördelas till externa equity-investerare |

**Nettoprofit** = Bruttointäkter − Distributionsavgifter − Negativkostnad − Deferred fees

Allt definieras explicit i ett separat Recoupment Schedule-dokument som biläggs avtalet.

---

## 6. Koppling till SFI-budgeten

Systemet är byggt för att fungera med SFI:s standardmall för filmbudget. Uppskjutna arvoden bokförs som reella budgetposter under respektive avdelning — inte som sidoarrangemang.

För varje relevant budgetrad anges:
- Faktiskt utbetalt arvode (cash fee)
- Uppskjutet arvode (deferred fee — bokas som kostnad)
- Ägarenheter som deferred-delen konverteras till (separat bilaga)

Fungerar för kortfilm, dokumentär och lång spelfilm. Budgetmallen är densamma.

---

## 7. Transparens

| Dokument | Crew | Producent | Finansiär |
|---|---|---|---|
| Egna ägarenheter och historik | ✓ | ✓ | — |
| Totalt antal enheter (ej individuella) | ✓ | ✓ | ✓ |
| Individuella enheter för hela teamet | — | ✓ | — |
| Waterfall och utbetalningsordning | ✓ | ✓ | ✓ |
| Fullständig budget inkl. arvoden | — | ✓ | ✓ |

---

## 8. Crowdfunding (under utveckling)

Vi bygger integration för crowdfunding direkt i systemet. Tanken:

- Publik finansierar via crowdfunding och får dokumenterade ägarenheter
- Ägarenheterna följer samma waterfall som teamets
- Kräver lämplig juridisk struktur (kooperativ eller ekonomisk förening per film)

Se `docs/crowdfunding.md` för aktuell status.

---

## 9. Paralleller i andra branscher

| Bransch | Modell |
|---|---|
| Tech-startups | Employee Stock Options (ESOP) — vesting över tid |
| Musik | Publishing splits via PRO (STIM/ASCAP) |
| Fastighet | Syndikerade projekt med waterfall-struktur |
| Spel | Revenue share — studios som Subset Games (*Into the Breach*) |

---

## Licens

MIT. Använd, anpassa, bygg vidare. Ange gärna källan.
