# Uppdrag: synka EPER-kalkylbladet med portalens vattenfallsmodell och markera vad som är inmatning

## Bakgrund
film.coop-portalen (filmcoop.nu) har en vattenfallsmodell som kalkylbladets flik "Waterfall Simulering" inte längre räknar likadant. Bladet och portalen visar därför olika siffror för samma scenario, och det är otydligt vilka celler man får skriva i. Skriptet längst ned löser båda sakerna:

1. Skriver om Waterfall Simulering så att den räknar som portalen (kontantinsatsen är en vanlig finansiär utan premie, stöd tar ingen andel av nettot, finansiärernas andel är insats ÷ total kostnad, övrig egeninsats återbetalas, samproducentens villkor hämtas från tabellen Finansiärer).
2. Färgmarkerar bladet: GUL cell med blå text = fyll i, GRÅ cell = formel eller länk som man inte ska ändra manuellt. Formelblock får dessutom ett varningsskydd (man kan fortfarande ändra, men får en varning först).
3. Lägger till kolumnen "Avtal" (JA/NEJ-rullista) sist bland rubrikerna i Egeninsats & Poäng. Portalen använder den för att visa vem som skrivit under rättighetsöverlåtelse och Participation Agreement. Den ska lämnas tom: jag fyller i den själv.
4. Skapar fliken "Frågor och svar" med de frågor en medverkande brukar ställa (betalning, sociala avgifter, försäkring, kollektivavtal, avhopp, rättigheter). Svaren i kolumn B ska lämnas tomma: jag skriver dem själv, och de visas för crew i portalen.
5. Skapar fliken "Pooler" med teamets fem delar (produktionsbolaget 5 %, initiativtagarna 10 %, skivorna 25 / 40 / 20 %) och en tabell där jag själv fördelar initiativtagarnas pool. Tabellen ska lämnas tom.
6. Skriver om Equity Dashboard så att ägarandelen (kolumn F) är andelen av teamets del enligt poolmodellen (skivornas andelar i H:J plus initiativandel i K). Personutdrag läser kolumn F och följer med. Rättar också texterna om faser och lock-punkter i Instruktioner och om poolen i Personutdrag.

Kalkylbladet: [KLISTRA IN LÄNK TILL EPER-BLADET HÄR]

## Förutsättningar
Du måste kunna redigera kalkylbladet som mig, antingen i min inloggade webbläsare (Claude in Chrome) eller via en Google Sheets-koppling med skrivrätt. Portalens servicekonto har bara läsrätt och ska INTE användas eller få mer behörighet. Kan du inte redigera bladet: stanna och säg till.

## Steg
1. Öppna bladet och bekräfta att det är rätt: flikarna Waterfall Simulering, Projektinställningar, Egeninsats & Poäng och Equity Dashboard finns, och Projektinställningar!C5 är "En plats, ett rum". Är det inte så: stanna och fråga.
2. Kontrollera att Waterfall Simulering!B40:F54 är helt tomt. Skriptet skriver där. Finns det innehåll: stanna och fråga.
3. Gör en säkerhetskopia först: Arkiv > Skapa en kopia, med namnet "EPER - backup före vattenfallssynk". Fortsätt inte utan kopia.
4. Tillägg > Apps Script. Ersätt HELA innehållet i Code.gs med skriptet längst ned och spara. Viktigt: klistra in via urklipp. Skriv inte in koden tecken för tecken, för editorn stänger parenteser och citattecken automatiskt och förstör då koden. Läs tillbaka koden efter inklistringen och kontrollera att den är identisk.
5. Välj funktionen uppdateraVattenfall och klicka Kör. Godkänn behörighetsfrågan med mitt Google-konto (gäller bara det här kalkylbladet). Skriptet visar en ruta "Klart" när det är färdigt.
6. Verifiera i bladet (siffrorna gäller EPER med nuvarande inmatning: bruttointäkt 500 000 / 1 500 000 / 8 000 000, distributionsavgift 0 / 25 / 20 %, kontantinsats 95 708 kr):

| Waterfall Simulering | Scenario A (kol. D) | Scenario B (kol. E) | Scenario C (kol. F) |
|---|---|---|---|
| Rad 18, återbetalning till finansiärer | −114 849 | −114 849 | −114 849 |
| Rad 19, netto efter finansiär | 385 151 | 1 010 151 | 6 285 151 |
| Rad 20, uppskjutna arvoden och egeninsats | −385 151 | −1 002 705 | −1 002 705 |
| Rad 21, netto efter deferred | 0 | 7 446 | 5 282 446 |
| Rad 22, teamets pool | 0 | 6 797 | 4 822 173 |
| Rad 23, finansiärspool | 0 | 649 | 460 273 |
| Rad 29, break-even bruttointäkt | 1 117 554 | 1 490 072 | 1 396 942 |

   Kontrollera också:
   - Inga felvärden (#REF!, #NAME?, #ERROR!, #DIV/0!) någonstans i Waterfall Simulering.
   - Rad 15–17 är oförändrade, och värdena i Projektinställningar!C42 (50 %) och C43 (15 %) är oförändrade (bara etiketterna ändras).
   - Färger: Waterfall Simulering D7:F8 och D35:E37 är gula med blå text. D9:F12, D15:F24 och D41:F54 är grå. I Egeninsats & Poäng är kolumnerna J:M grå och till exempel Dagar och Roll gula, utom celler som är formler (grå).
   - Vid manuell ändring i en grå formelcell visas en varning.
   - Egeninsats & Poäng har en ny rubrik "Avtal" sist bland rubrikerna på rad 4 (troligen kolumn R), med JA/NEJ-rullista på datarader. Cellerna ska vara tomma. Fyll inte i några värden.
   - En ny flik "Frågor och svar" finns, med sju frågor i kolumn A och tomma gula svarsceller i kolumn B. Skriv inga svar.
   - En ny flik "Pooler" finns: B4:C8 har 5 %, 10 %, 25 %, 40 % och 20 % (C9 = 100 %), och tilldelningstabellen B13:D32 är tom och gul. Fyll inte i något. D6:D8 har formler för ägarenheter per skiva.
   - Equity Dashboard: F7 är =SUM(H7:K7), kolumnerna H:K har rubrikerna Skiva 1, Skiva 2, Skiva 3 och Initiativ, raden under TOTALT visar Produktionsbolagets pool (5 %) och raden därunder det som är reserverat eller ofördelat. Summan F(TOTALT) + 5 % + sista raden = 100 %.
   - Instruktioner nämner F1–F3, F4–F5 och F6–F8 under Lock 1–3.
7. Rapportera: vad du gjorde, namnet på säkerhetskopian, och alla avvikelser mot tabellen ovan (med cellreferens och faktiskt värde).

## Regler
- Ändra inget annat än det skriptet ändrar.
- Fyll inte i ändringsloggen i Projektinställningar (kolumnen "Godkänd av" ska jag fylla i själv).
- Ändra inte delning eller behörigheter på bladet, och radera inte säkerhetskopian.
- Om något ser oväntat ut eller skriptet ger ett fel: stoppa och rapportera. Försök inte laga genom att ändra skriptet eller bladet på egen hand. Går det att återställa, hänvisa till säkerhetskopian.

## Skript (klistra in som Code.gs)

```javascript
/**
 * Synkar flikarna "Waterfall Simulering" och "Projektinställningar" med
 * portalens vattenfallsmodell, så att kalkylbladet och portalen visar samma
 * siffror för samma scenario.
 *
 * Så här kör du det (en gång per kalkylblad):
 *   1. Öppna kalkylbladet, välj Tillägg > Apps Script.
 *   2. Ersätt innehållet med den här filen och spara.
 *   3. Välj funktionen uppdateraVattenfall och klicka Kör (godkänn behörigheten).
 *
 * Det som ändras:
 *   - Samproducentens belopp och multiplikator (rad 10–11) hämtas från tabellen
 *     Finansiärer (rad 35–37), som alltså blir enda källan, precis som i portalen.
 *   - Kontantinsatsen är en finansiär som alla andra, utan premie.
 *   - Stöd tar ingen andel av nettot. Finansiärernas andel = insats ÷ total kostnad.
 *   - Övrig egeninsats (totalbudget minus kontant minus uppskjutna löner)
 *     återbetalas före vinst, på samma sätt som de uppskjutna lönerna.
 *   - Hjälpberäkningen läggs på rad 40–54 i Waterfall Simulering.
 *   - Fliken "Frågor och svar" skapas (om den saknas) med de frågor en medverkande brukar
 *     ställa. Skriv svaren i kolumn B: de visas för crew i portalen, och obesvarade
 *     frågor visas som "Inte besvarat än".
 *   - Fliken "Pooler" skapas (om den saknas): teamets del delas i produktionsbolagets pool
 *     (5 %), initiativtagarnas pool (10 %) och tre skivor (25 / 40 / 20 %), och här fördelar
 *     producenten initiativtagarnas pool. Portalen läser fliken.
 *   - Equity Dashboard räknar ägarandelen (kolumn F) som andel av teamets del enligt
 *     poolmodellen: skivornas andelar (H:J) plus tilldelning ur initiativtagarnas pool (K).
 *     Personutdrag läser kolumn F och följer med. Rad under TOTALT visar produktionsbolagets
 *     pool och det som är reserverat eller ofördelat. Instruktioner och Personutdrag får
 *     rättade texter om faser, lock-punkter och poolen.
 *   - Kolumnen "Avtal" (JA/NEJ) läggs till sist i Egeninsats & Poäng. JA betyder att
 *     personen skrivit under rättighetsöverlåtelse och Participation Agreement.
 *     Portalen visar avtalsstatus per person och varnar för dem som saknar avtal.
 *
 * Skriptet markerar också tydligt var du får skriva och var du inte ska det:
 *   - GUL cell med blå text = inmatning, fyll i själv.
 *   - GRÅ cell med mörk text = formel eller länk, ändra inte manuellt. Ändra i
 *     stället källan (t.ex. tabellen Finansiärer eller fliken Teamlista).
 *   Färgen sätts efter vad cellen faktiskt innehåller, så en cell som ser ut som
 *   inmatning men är en formel blir grå. Formelblocken får dessutom ett
 *   varningsskydd: du kan fortfarande ändra, men får en varning först.
 */

const KOLUMNER = ["D", "E", "F"]; // scenario A, B, C

const STIL_INMATNING = { bakgrund: "#fffde7", text: "#0000cc" };
const STIL_FORMEL = { bakgrund: "#f1f3f4", text: "#202124" };
const SKYDD_PREFIX = "film.coop: ";

// [flik, intervall, typ]
//   "inmatning": cellen blir gul/blå om den är tom eller har ett fast värde, men
//                grå om den innehåller en formel eller länk.
//   "formel":    cellen blir alltid grå.
const ZONER = [
  ["Waterfall Simulering", "D7:F8", "inmatning"],
  ["Waterfall Simulering", "D9:F12", "inmatning"],
  ["Waterfall Simulering", "D15:F24", "formel"],
  ["Waterfall Simulering", "D29:F30", "formel"],
  ["Waterfall Simulering", "D35:E37", "inmatning"],
  ["Waterfall Simulering", "F35:F36", "formel"],
  ["Waterfall Simulering", "F37", "inmatning"],
  ["Waterfall Simulering", "D41:F54", "formel"],
  ["Projektinställningar", "C5:C13", "inmatning"],
  ["Projektinställningar", "C14", "formel"],
  ["Projektinställningar", "C17:C19", "inmatning"],
  ["Projektinställningar", "D24:F31", "inmatning"],
  ["Projektinställningar", "G24:G31", "formel"],
  ["Projektinställningar", "D36:D38", "inmatning"],
  ["Projektinställningar", "C42:C43", "formel"],
  ["Projektinställningar", "C44", "inmatning"],
  ["Projektinställningar", "C49:C50", "inmatning"],
  ["Projektinställningar", "C51", "formel"],
];

// Block som får varningsskydd (du kan ändra, men får en varning först).
const SKYDDADE_BLOCK = [
  ["Waterfall Simulering", "D15:F24"],
  ["Waterfall Simulering", "D29:F30"],
  ["Waterfall Simulering", "D41:F54"],
  ["Projektinställningar", "G24:G31"],
  ["Projektinställningar", "C14"],
];

const FÖRKLARING =
  "GUL cell med blå text = fyll i  ·  GRÅ cell = formel eller länk, ändra inte manuellt";

// [rad, text] i kolumn B (Waterfall Simulering)
const ETIKETTER = [
  [9, "Kontantinsats (SEK)"],
  [10, "Samproducenters kapital (SEK, från tabellen Finansiärer)"],
  [11, "Samproducenters återbetalning (×, från tabellen Finansiärer)"],
  [18, "Steg 2  — Återbetalning till finansiärer: MG, samproducenter, kontantinsats (–)"],
  [20, "Steg 3  — Uppskjutna arvoden och övrig egeninsats (–)"],
  [22, "Steg 4  Teamets pool (netto minus finansiärernas andel)"],
  [23, "Steg 5  Finansiärspool (insats ÷ total kostnad)"],
  [35, "Stöd (utan anspråk på ägande)"],
  [36, "Samproducenter"],
  [40, "HJÄLPBERÄKNING — samma modell som portalen"],
  [41, "Stöd (SEK)"],
  [42, "Samproducenter (SEK)"],
  [43, "Distributörens MG (SEK)"],
  [44, "Kontantinsats (SEK)"],
  [45, "Total finansiering"],
  [46, "Budgetens kontantbehov"],
  [47, "Täcker kontantbehovet"],
  [48, "Övrig egeninsats (ej uppskjutna löner)"],
  [49, "Skuld att återbetala (uppskjutet + övrig egeninsats)"],
  [50, "Betalas kontant i stället för att skjutas upp"],
  [51, "Kvar att återbetala ur intäkterna"],
  [52, "MG som distributören återvinner"],
  [53, "Återbetalning till finansiärer (samproducenter, stöd, kontantinsats)"],
  [54, "Finansiärernas andel av netto"],
];

// [rad, formel] per scenariokolumn; {c} ersätts med D, E respektive F.
const FORMLER = [
  [10, "=$D$36"],
  [11, "=$E$36"],
  [18, "=-MIN({c}52+{c}53,{c}17)"],
  [20, "=-MIN({c}51,MAX(0,{c}19))"],
  [22, "={c}21*(1-{c}54)"],
  [23, "={c}21-{c}22"],
  [29, "=IFERROR(({c}52+{c}53+{c}51)/(1-{c}8),0)"],
  [30, "=IFERROR(-{c}20/{c}51,0)"],
  [41, "=$D$35"],
  [42, "={c}10"],
  [43, "=$D$37"],
  [44, "={c}9"],
  [45, "={c}41+{c}42+{c}43+{c}44"],
  [46, "=IF('Projektinställningar'!$C$12>0,'Projektinställningar'!$C$12,'Projektinställningar'!$C$51)"],
  [47, "=MIN({c}45,{c}46)"],
  [48, "=MAX(0,'Projektinställningar'!$C$13-{c}12)"],
  [49, "={c}12+{c}48"],
  [50, "=MIN({c}45-{c}47,{c}49)"],
  [51, "={c}49-{c}50"],
  [52, "={c}43*$E$37"],
  [53, "={c}42*{c}11+{c}41*$E$35+{c}44*{c}11"],
  [54, "=MIN(1,MAX(0,IF('Projektinställningar'!$C$11>0,({c}42+{c}44)/'Projektinställningar'!$C$11,0)+IF({c}43>0,$F$37,0)))"],
];

// Apps Script tar emot formler exakt som de står, och bladets lokal avgör argumentavgränsaren:
// semikolon i t.ex. svenska, tyska och franska blad, komma i engelska. Skriptet skriver formlerna
// med komma och byter till semikolon här när bladets lokal har decimalkomma.
function lokalFormel_(formel) {
  const lokal = SpreadsheetApp.getActive().getSpreadsheetLocale().replace("_", "-");
  let decimalkomma = /^(sv|de|fr|es|it|nl|da|nb|no|fi|pt|ru|pl|cs|tr|hu|sk|sl|hr|ro|bg|uk|el)/i.test(lokal);
  try {
    decimalkomma = decimalkomma || (1.5).toLocaleString(lokal).indexOf(",") !== -1;
  } catch (e) {}
  if (!decimalkomma) return formel;
  let ut = "";
  let iText = false;
  for (const tecken of formel) {
    if (tecken === '"') iText = !iText;
    ut += tecken === "," && !iText ? ";" : tecken;
  }
  return ut;
}

function uppdateraVattenfall() {
  const ss = SpreadsheetApp.getActive();
  const wf = ss.getSheetByName("Waterfall Simulering");
  const pi = ss.getSheetByName("Projektinställningar");
  if (!wf || !pi) {
    throw new Error('Flikarna "Waterfall Simulering" och "Projektinställningar" måste finnas.');
  }

  ETIKETTER.forEach(([rad, text]) => wf.getRange("B" + rad).setValue(text));
  wf.getRange("B40").setFontWeight("bold");

  FORMLER.forEach(([rad, formel]) => {
    KOLUMNER.forEach((c) => {
      wf.getRange(c + rad).setFormula(lokalFormel_(formel.split("{c}").join(c)));
    });
  });

  wf.getRange("D41:F53").setNumberFormat("#,##0");
  wf.getRange("D54:F54").setNumberFormat("0.0%");

  // Fält som inte längre används av modellen.
  pi.getRange("B42").setValue("Teamandel av netto — används inte längre");
  pi.getRange("D42").setValue("Finansiärernas andel räknas som insats ÷ total kostnad (se Waterfall Simulering)");
  pi.getRange("B43").setValue("Premie på kontantinsats — används inte längre");
  pi.getRange("D43").setValue("Kontantinsatsen återbetalas med samproducentens multiplikator");

  skapaFragorOchSvar_();
  skapaPooler_();
  uppdateraPoolerEnheter_();
  uppdateraPoolerVarden_();
  uppdateraEquityDashboard_();
  uppdateraTexter_();
  markeraInmatning();

  SpreadsheetApp.getUi().alert(
    "Klart. Waterfall Simulering använder nu samma modell som portalen, och " +
      "inmatningsceller (gula) och formler (grå) är markerade."
  );
}

const STANDARDFRAGOR = [
  "Hur och när betalas mitt uppskjutna arvode?",
  "Vem betalar sociala avgifter och semesterersättning när arvodet betalas ut?",
  "Gäller försäkring under inspelningen?",
  "Gäller mitt kollektivavtal (Scen & Film), och vad händer med min royalty vid återanvändning?",
  "Vad händer om jag hoppar av?",
  "Vad händer om filmen aldrig blir gjord eller såld?",
  "Vad händer med rättigheterna, och hur blir jag namngiven?",
];

// Skapar fliken "Frågor och svar" om den saknas. Befintliga svar skrivs aldrig över.
function skapaFragorOchSvar_() {
  const ss = SpreadsheetApp.getActive();
  if (ss.getSheetByName("Frågor och svar")) return;

  const blad = ss.insertSheet("Frågor och svar");
  blad.getRange("A1:B1").setValues([["Fråga", "Svar (visas för crew i portalen)"]]).setFontWeight("bold");
  blad
    .getRange(2, 1, STANDARDFRAGOR.length, 2)
    .setValues(STANDARDFRAGOR.map((fraga) => [fraga, ""]));
  blad.setColumnWidth(1, 460);
  blad.setColumnWidth(2, 620);
  blad.getRange(2, 2, 59, 1).setBackground(STIL_INMATNING.bakgrund).setFontColor(STIL_INMATNING.text);
}

// Skapar fliken "Pooler" om den saknas: teamets fem delar (B4:C8) och producentens
// tilldelning av initiativtagarnas pool (B13:C32). Befintliga värden skrivs aldrig över.
// Portalen läser fliken; saknas den används 5 / 10 / 25 / 40 / 20 %.
function skapaPooler_() {
  const ss = SpreadsheetApp.getActive();
  if (ss.getSheetByName("Pooler")) return;

  const blad = ss.insertSheet("Pooler");
  blad.getRange("B2").setValue("POOLER — hur teamets del av vinsten delas").setFontWeight("bold");
  blad.getRange("B3:C3").setValues([["Del", "Andel av teamets del"]]).setFontWeight("bold");
  blad.getRange("B4:C8").setValues([
    ["Produktionsbolagets pool (statisk)", 0.05],
    ["Initiativtagarnas pool (statisk, fördelas av producenten efter F1)", 0.1],
    ["Skiva 1: Lock 1 (F1–F3)", 0.25],
    ["Skiva 2: Lock 2 (F4–F5)", 0.4],
    ["Skiva 3: Lock 3 (F6–F8)", 0.2],
  ]);
  blad.getRange("B9").setValue("Summa (ska vara 100 %)").setFontWeight("bold");
  blad.getRange("C9").setFormula("=SUM(C4:C8)").setFontWeight("bold");
  blad.getRange("C4:C9").setNumberFormat("0%");
  blad.getRange("C4:C8").setBackground(STIL_INMATNING.bakgrund).setFontColor(STIL_INMATNING.text);
  blad.getRange("C9").setBackground(STIL_FORMEL.bakgrund).setFontColor(STIL_FORMEL.text);

  blad.getRange("B11").setValue("TILLDELNING AV INITIATIVTAGARNAS POOL (producentbeslut efter F1)").setFontWeight("bold");
  blad.getRange("B12:D12").setValues([["Namn (som i Egeninsats & Poäng)", "Andel av initiativpoolen", "Motivering"]]).setFontWeight("bold");
  blad.getRange("C13:C32").setNumberFormat("0%");
  blad.getRange("B13:D32").setBackground(STIL_INMATNING.bakgrund).setFontColor(STIL_INMATNING.text);
  blad.getRange("B33").setValue("Summa tilldelat").setFontWeight("bold");
  blad.getRange("C33").setFormula("=SUM(C13:C32)").setNumberFormat("0%").setFontWeight("bold");
  blad.getRange("C33").setBackground(STIL_FORMEL.bakgrund).setFontColor(STIL_FORMEL.text);
  blad.getRange("D33").setValue("Det som inte tilldelats är ofördelat och betalas inte ut.");

  blad.setColumnWidth(2, 460);
  blad.setColumnWidth(3, 190);
  blad.setColumnWidth(4, 420);
}

// Poolmodellen i formler. Fasgrupperna följer lock-punkterna (ramverket avsnitt 5b).
const SKIVOR = [
  { kol: "H", pooler: "$C$6", enheter: "$D$6", faser: ["F1", "F2", "F3"], rubrik: "Skiva 1 (%)" },
  { kol: "I", pooler: "$C$7", enheter: "$D$7", faser: ["F4", "F5"], rubrik: "Skiva 2 (%)" },
  { kol: "J", pooler: "$C$8", enheter: "$D$8", faser: ["F6", "F7", "F8"], rubrik: "Skiva 3 (%)" },
];
const EG = "'Egeninsats & Poäng'!";

// Summan av ägarenheter i en grupp av faser, för en person om namnCell anges.
function enhetsSumma_(faser, namnCell) {
  return faser
    .map((f) =>
      namnCell
        ? "SUMIFS(" + EG + "$M:$M," + EG + "$C:$C," + namnCell + "," + EG + '$F:$F,"' + f + '")'
        : "SUMIFS(" + EG + "$M:$M," + EG + '$F:$F,"' + f + '")'
    )
    .join("+");
}

// Formler för en rad i Equity Dashboard: skivornas andelar, initiativandel och summan.
function dashboardFormler_(rad) {
  const f = {};
  SKIVOR.forEach((s) => {
    f[s.kol] =
      "=IFERROR(Pooler!" + s.pooler + "*(" + enhetsSumma_(s.faser, "$B" + rad) + ")/Pooler!" + s.enheter + ",0)";
  });
  f.K = "=IFERROR(Pooler!$C$5*SUMIF(Pooler!$B$13:$B$32,$B" + rad + ",Pooler!$C$13:$C$32),0)";
  f.F = "=SUM(H" + rad + ":K" + rad + ")";
  return f;
}

// Skriver ägarenheterna per skiva (som beräknas) i fliken Pooler, kolumn D.
function uppdateraPoolerEnheter_() {
  const pooler = SpreadsheetApp.getActive().getSheetByName("Pooler");
  if (!pooler) return;
  pooler.getRange("D3").setValue("Enheter i skivan (beräknas)").setFontWeight("bold");
  SKIVOR.forEach((s) => {
    pooler.getRange(s.enheter.replace(/\$/g, "")).setFormula(lokalFormel_("=" + enhetsSumma_(s.faser, null)));
    pooler.getRange(s.enheter.replace(/\$/g, "")).setNumberFormat("#,##0.0");
    färgaZon_(pooler.getRange(s.enheter.replace(/\$/g, "")), "formel");
  });
}

// Värde per 100 enheter och flagga för tunn skiva (samma tröskel som portalen: mer än 2 gånger snittet).
function uppdateraPoolerVarden_() {
  const pooler = SpreadsheetApp.getActive().getSheetByName("Pooler");
  if (!pooler) return;
  pooler.getRange("E3:F3").setValues([["Värde per 100 enheter", "Status"]]).setFontWeight("bold");
  const snitt = "(SUMIF($D$6:$D$8,\">0\",$C$6:$C$8)/SUM($D$6:$D$8))*100";
  [6, 7, 8].forEach((rad) => {
    pooler.getRange("E" + rad).setFormula(lokalFormel_("=IF(D" + rad + ">0,C" + rad + "/D" + rad + "*100,0)"));
    pooler
      .getRange("F" + rad)
      .setFormula(
        lokalFormel_(
          "=IF(D" + rad + "<=0,\"Reserverad\",IF(AND(COUNTIF($D$6:$D$8,\">0\")>=2,E" + rad + ">2*" + snitt +
            "),\"Tunn skiva: få enheter, budgeten kanske inte är komplett\",\"\"))"
        )
      );
  });
  pooler.getRange("E6:E8").setNumberFormat("0.0%");
  färgaZon_(pooler.getRange("E6:F8"), "formel");
  pooler.setColumnWidth(5, 160);
  pooler.setColumnWidth(6, 360);
}

// Skriver om Equity Dashboard så att ägarandelen är andelen av teamets del enligt
// poolmodellen. Kolumn F (som Personutdrag läser) blir summan av H:K. Rad 23 och 24
// visar produktionsbolagets pool samt det som är reserverat eller ofördelat.
function uppdateraEquityDashboard_() {
  const ss = SpreadsheetApp.getActive();
  const dash = ss.getSheetByName("Equity Dashboard");
  if (!dash || !ss.getSheetByName("Pooler")) return;

  const kolB = dash.getRange("B1:B60").getValues();
  const totalRad = kolB.findIndex((r, i) => i >= 6 && String(r[0]).trim().toUpperCase() === "TOTALT") + 1;
  if (totalRad < 8) throw new Error('Hittar inte raden "TOTALT" i Equity Dashboard.');
  const forsta = 7;
  const sista = totalRad - 1;

  const ovan = dash.getRange("B" + (totalRad + 1) + ":L" + (totalRad + 2)).getValues();
  // Raderna får bara vara tomma eller ha skriptets egna etiketter (så att skriptet kan köras om).
  const upptagen = ovan.some(
    (rad) =>
      !/^(Produktionsbolagets pool|Reserverat)/.test(String(rad[0]).trim()) &&
      rad.some((v) => String(v).trim() !== "")
  );
  if (upptagen) throw new Error("Raderna under TOTALT i Equity Dashboard är inte tomma. Rensa dem först.");

  dash.getRange("B5").setValue("ÄGARANDELAR PER PERSON (andel av teamets del)");
  dash.getRange("F6").copyTo(dash.getRange("H6:K6"), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  dash.getRange("H6:K6").setValues([["Skiva 1 (%)", "Skiva 2 (%)", "Skiva 3 (%)", "Initiativ (%)"]]);
  dash.getRange("F6").setValue("Ägarandel (%)");

  for (let rad = forsta; rad <= sista; rad++) {
    const f = dashboardFormler_(rad);
    ["H", "I", "J", "K", "F"].forEach((kol) => dash.getRange(kol + rad).setFormula(lokalFormel_(f[kol])));
  }
  ["H", "I", "J", "K"].forEach((kol) =>
    dash.getRange(kol + totalRad).setFormula("=SUM(" + kol + forsta + ":" + kol + sista + ")")
  );
  dash.getRange("B" + (totalRad + 1)).setValue("Produktionsbolagets pool");
  dash.getRange("F" + (totalRad + 1)).setFormula("=Pooler!$C$4");
  dash.getRange("B" + (totalRad + 2)).setValue("Reserverat, ofördelat eller utan matchande namn");
  dash.getRange("F" + (totalRad + 2)).setFormula("=1-F" + totalRad + "-F" + (totalRad + 1));
  dash.getRange("F" + forsta + ":F" + (totalRad + 2)).setNumberFormat("0.0%");
  dash.getRange("H" + forsta + ":K" + totalRad).setNumberFormat("0.0%");
  färgaZon_(dash.getRange("H" + forsta + ":K" + totalRad), "formel");
  färgaZon_(dash.getRange("F" + (totalRad + 1) + ":F" + (totalRad + 2)), "formel");
}

// Rättar texter som beskriver den gamla fasindelningen och poolen.
function uppdateraTexter_() {
  const ss = SpreadsheetApp.getActive();

  const instr = ss.getSheetByName("Instruktioner");
  if (instr) {
    const nya = {
      "Lock 1": "Fastställ poäng för F1, F2 och F3 (pilot). Markera datum i Projektinställningar.",
      "Lock 2": "Fastställ poäng för F4 och F5 (inspelning). Uppdatera om ny finansiär tillkommit.",
      "Lock 3":
        "Fastställ poäng för F6, F7 (bokade promotiondagar) och F8. Slutgiltigt register. Arbete efter ett lock ger bara enheter genom en daterad ändring i registret.",
    };
    const kolB = instr.getRange("B1:B60").getValues();
    kolB.forEach((r, i) => {
      const nyckel = String(r[0]).slice(0, 6);
      if (nya[nyckel]) instr.getRange("C" + (i + 1)).setValue(nya[nyckel]);
    });
  }

  const utdrag = ss.getSheetByName("Personutdrag");
  if (utdrag) {
    const kolB = utdrag.getRange("B1:B400").getValues();
    kolB.forEach((r, i) => {
      if (String(r[0]).indexOf("Din ägarandel (%) multipliceras med Crew-poolen") === 0) {
        utdrag
          .getRange("B" + (i + 1))
          .setValue(
            "Din ägarandel (%) multipliceras med teamets del av nettot (efter distribution, finansiärer och uppskjutna arvoden). Teamets del delas i produktionsbolagets pool, initiativtagarnas pool och tre skivor efter lock-punkt."
          );
      }
    });
  }
}

/** Färgar inmatning respektive formler och lägger varningsskydd på formelblock. */
function markeraInmatning() {
  const ss = SpreadsheetApp.getActive();

  ZONER.forEach(([flik, intervall, typ]) => {
    const blad = ss.getSheetByName(flik);
    if (blad) färgaZon_(blad.getRange(intervall), typ);
  });

  // Egeninsats & Poäng: antalet rader varierar, så hitta SUMMERING-raden.
  const eg = ss.getSheetByName("Egeninsats & Poäng");
  if (eg) {
    const kolB = eg.getRange("B1:B300").getValues();
    const summering = kolB.findIndex((r) => String(r[0]).trim().toUpperCase() === "SUMMERING") + 1;
    const sista = summering > 0 ? summering - 1 : eg.getLastRow();
    färgaZon_(eg.getRange("C5:I" + sista), "inmatning");
    färgaZon_(eg.getRange("N5:Q" + sista), "inmatning");
    färgaZon_(eg.getRange("J5:M" + sista), "formel");
    if (summering > 0) färgaZon_(eg.getRange("J" + summering + ":M" + summering), "formel");
    skydda_(eg, "J5:M" + sista);
    läggTillAvtalskolumn_(eg, sista);
    skrivFörklaring_(eg, "B3", true);
  }

  SKYDDADE_BLOCK.forEach(([flik, intervall]) => {
    const blad = ss.getSheetByName(flik);
    if (blad) skydda_(blad, intervall);
  });

  const wf = ss.getSheetByName("Waterfall Simulering");
  if (wf) {
    skrivFörklaring_(wf, "B4", false);
    wf.getRange("F35").setNote("Används inte: stöd tar ingen andel av nettot.");
  }
  const pi = ss.getSheetByName("Projektinställningar");
  if (pi) skrivFörklaring_(pi, "B3", false);

  // Equity Dashboard räknas ut automatiskt: varna vid manuell ändring av hela fliken.
  const dash = ss.getSheetByName("Equity Dashboard");
  if (dash) {
    skyddaFlik_(dash);
    const info = dash.getRange("B4");
    if (String(info.getValue()).trim() === "") {
      info.setValue("Hela fliken räknas ut automatiskt — redigera inte här. Ändra i Egeninsats & Poäng.")
        .setFontStyle("italic");
    }
  }
}

// Lägger kolumnen "Avtal" (JA/NEJ) sist bland rubrikerna, om den inte redan finns.
function läggTillAvtalskolumn_(blad, sistaRad) {
  const rubriker = blad.getRange("A4:Z4").getValues()[0].map((h) => String(h).trim());
  let kolumn = rubriker.findIndex((h) => h.toLowerCase() === "avtal") + 1;
  if (kolumn === 0) {
    const sistaMedInnehåll = rubriker.reduce((sist, h, i) => (h !== "" ? i + 1 : sist), 0);
    kolumn = sistaMedInnehåll + 1;
    const rubrik = blad.getRange(4, kolumn);
    blad.getRange(4, kolumn - 1).copyTo(rubrik, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    rubrik.setValue("Avtal");
  }
  blad
    .getRange(4, kolumn)
    .setNote(
      "JA när personen skrivit under rättighetsöverlåtelse och Participation Agreement. " +
        "Visas i portalen."
    );
  if (sistaRad < 5) return;
  const data = blad.getRange(5, kolumn, sistaRad - 4, 1);
  data.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["JA", "NEJ"], true).setAllowInvalid(false).build()
  );
  färgaZon_(data, "inmatning");
}

function färgaZon_(intervall, typ) {
  const bakgrunder = [];
  const texter = [];
  intervall.getFormulas().forEach((rad) => {
    const b = [];
    const t = [];
    rad.forEach((formel) => {
      const stil = typ === "inmatning" && formel === "" ? STIL_INMATNING : STIL_FORMEL;
      b.push(stil.bakgrund);
      t.push(stil.text);
    });
    bakgrunder.push(b);
    texter.push(t);
  });
  intervall.setBackgrounds(bakgrunder).setFontColors(texter);
}

function skydda_(blad, a1) {
  taBortSkydd_(blad, a1);
  blad
    .getRange(a1)
    .protect()
    .setDescription(SKYDD_PREFIX + "formler — ändra inte manuellt (" + a1 + ")")
    .setWarningOnly(true);
}

function skyddaFlik_(blad) {
  taBortSkydd_(blad, null);
  blad
    .protect()
    .setDescription(SKYDD_PREFIX + "räknas ut automatiskt — ändra inte manuellt")
    .setWarningOnly(true);
}

// Tar bort skydd som det här skriptet satt tidigare, så att det går att köra om.
function taBortSkydd_(blad, a1) {
  const typer = [SpreadsheetApp.ProtectionType.RANGE, SpreadsheetApp.ProtectionType.SHEET];
  typer.forEach((typ) => {
    blad.getProtections(typ).forEach((skydd) => {
      const beskrivning = skydd.getDescription();
      if (beskrivning.indexOf(SKYDD_PREFIX) !== 0) return;
      if (a1 === null || beskrivning.indexOf("(" + a1 + ")") !== -1) skydd.remove();
    });
  });
}

// Skriver förklaringen i en cell, men bara om cellen är tom (eller ersätt = true).
function skrivFörklaring_(blad, a1, ersätt) {
  const cell = blad.getRange(a1);
  if (ersätt || String(cell.getValue()).trim() === "") {
    cell.setValue(FÖRKLARING).setFontStyle("italic");
  }
}
```
