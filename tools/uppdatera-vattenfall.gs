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
  skapaPooler_();
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
