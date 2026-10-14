# Uppdrag: synka EPER-kalkylbladet med portalens vattenfallsmodell och markera vad som är inmatning

## Bakgrund
film.coop-portalen (filmcoop.nu) har en vattenfallsmodell som kalkylbladets flik "Waterfall Simulering" inte längre räknar likadant. Bladet och portalen visar därför olika siffror för samma scenario, och det är otydligt vilka celler man får skriva i. Skriptet längst ned löser båda sakerna:

1. Skriver om Waterfall Simulering så att den räknar som portalen (kontantinsatsen är en vanlig finansiär utan premie, stöd tar ingen andel av nettot, finansiärernas andel är insats ÷ total kostnad, övrig egeninsats återbetalas, samproducentens villkor hämtas från tabellen Finansiärer).
2. Färgmarkerar bladet: GUL cell med blå text = fyll i, GRÅ cell = formel eller länk som man inte ska ändra manuellt. Formelblock får dessutom ett varningsskydd (man kan fortfarande ändra, men får en varning först).
3. Lägger till kolumnen "Avtal" (JA/NEJ-rullista) sist bland rubrikerna i Egeninsats & Poäng. Portalen använder den för att visa vem som skrivit under rättighetsöverlåtelse och Participation Agreement. Den ska lämnas tom: jag fyller i den själv.
4. Skapar fliken "Frågor och svar" med de frågor en medverkande brukar ställa (betalning, sociala avgifter, försäkring, kollektivavtal, avhopp, rättigheter). Svaren i kolumn B ska lämnas tomma: jag skriver dem själv, och de visas för crew i portalen.

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
      wf.getRange(c + rad).setFormula(formel.split("{c}").join(c));
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
