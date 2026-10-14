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
 */

const KOLUMNER = ["D", "E", "F"]; // scenario A, B, C

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
  [46, "='Projektinställningar'!$C$51"],
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

  SpreadsheetApp.getUi().alert(
    "Klart. Waterfall Simulering använder nu samma modell som portalen."
  );
}
