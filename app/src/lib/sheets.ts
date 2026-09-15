import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SHEET_EGENINSATS = "Egeninsats & Poäng";
const SHEET_PROJEKTINSTALLNINGAR = "Projektinställningar";
const SHEET_WATERFALL = "Waterfall Simulering";

const EGENINSATS_HEADER_ROW = 4;

export interface CrewMember {
  radnummer: number;
  namn: string;
  roll: string;
  klass: string;
  fas: string;
  dagar: number;
  cashFeePerDag: number;
  marknPrisPerDag: number;
  deferredFee: number;
  grundpPerDag: number;
  klassmult: number;
  poang: number;
  anteckningar: string;
  epost: string;
}

export interface ProjectSettings {
  projektnamn: string;
  produktionsbolag: string;
  producent: string;
  lock1: string;
  lock2: string;
  lock3: string;
}

export interface WaterfallScenario {
  bruttointakt: number;
  distributionsavgift: number;
  nettoEfterDistribution: number;
  finansiarsRecoupment: number;
  nettoEfterFinansiar: number;
  deferredFeePool: number;
  nettoEfterDeferred: number;
  crewPool: number;
  finansiarspool: number;
}

export interface WaterfallData {
  A: WaterfallScenario;
  B: WaterfallScenario;
  C: WaterfallScenario;
}

let docSingleton: GoogleSpreadsheet | null = null;

/**
 * Cachar GoogleSpreadsheet-instansen mellan anrop. I Next.js dev-läge kan
 * modulen laddas om vid HMR — då byggs singleton bara om, inget att undvika.
 */
async function getDoc(): Promise<GoogleSpreadsheet> {
  if (docSingleton) return docSingleton;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!email || !key || !spreadsheetId) {
    throw new Error(
      "Saknar GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY eller SPREADSHEET_ID i miljövariablerna"
    );
  }

  const jwt = new JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    // Måste vara den fulla "spreadsheets"-scopen (inte .readonly) — cellbaserade
    // anrop (loadCells, används av getProjectSettings/getWaterfall) svarar 403
    // "insufficient authentication scopes" med enbart .readonly. Faktisk
    // skrivbehörighet styrs ändå av att kontot bara delats med Visningsåtkomst
    // på själva filen i Drive.
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
  await doc.loadInfo();

  docSingleton = doc;
  return doc;
}

/**
 * Tolkar tal i svenskt format från Sheets: mellanslag (även oavbrutet
 * mellanslag, U+00A0) som tusentalsavgränsare, komma som decimaltecken.
 * T.ex. "2 500" → 2500, "1,50" → 1.5. Waterfall-cellerna kan redan vara
 * riktiga JS-nummer (formelresultat) — de returneras oförändrade.
 */
function parseNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;

  const normalized = String(value)
    .trim()
    .replace(/[\s\u00A0]/g, "")
    .replace(",", ".");

  if (normalized === "") return 0;

  const n = parseFloat(normalized);
  return Number.isNaN(n) ? 0 : n;
}

function rowToCrewMember(r: GoogleSpreadsheetRow): CrewMember {
  return {
    radnummer: parseNum(r.get("#")),
    namn: r.get("Namn") || "",
    roll: r.get("Roll / Befattning") || "",
    klass: r.get("Klass") || "",
    fas: r.get("Fas") || "",
    dagar: parseNum(r.get("Dagar")),
    cashFeePerDag: parseNum(r.get("Cash Fee\n(SEK/dag)")),
    marknPrisPerDag: parseNum(r.get("Markn.pris\n(SEK/dag)")),
    deferredFee: parseNum(r.get("Deferred\nFee (SEK)")),
    grundpPerDag: parseNum(r.get("Grundp./dag\n(från inst.)")),
    klassmult: parseNum(r.get("Klassmult.\n(från inst.)")),
    poang: parseNum(r.get("Poäng\n(beräknat)")),
    anteckningar: r.get("Anteckningar") || "",
    epost: r.get("E-post") || "",
  };
}

/** Hämtar samtliga giltiga rader (med e-post) från huvudregistret. */
export async function getAllCrewMembers(): Promise<CrewMember[]> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[SHEET_EGENINSATS];
  if (!sheet) {
    throw new Error(`Fliken "${SHEET_EGENINSATS}" saknas i Sheets`);
  }

  await sheet.loadHeaderRow(EGENINSATS_HEADER_ROW);
  const rows = await sheet.getRows();

  return rows
    .map(rowToCrewMember)
    .filter((m) => m.epost.trim() !== "");
}

/** Hämtar alla rader som tillhör en viss e-postadress (skiftlägesokänsligt). */
export async function getCrewMembersForEmail(email: string): Promise<CrewMember[]> {
  const all = await getAllCrewMembers();
  const target = email.trim().toLowerCase();
  return all.filter((m) => m.epost.trim().toLowerCase() === target);
}

/** Läser projektinställningar. Etiketter i kolumn B, värden i kolumn C (gulmarkerade
 * inmatningsfält). Kolumn D innehåller bara grå exempel-/formathjälptext, inga värden. */
export async function getProjectSettings(): Promise<ProjectSettings> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[SHEET_PROJEKTINSTALLNINGAR];
  if (!sheet) {
    throw new Error(`Fliken "${SHEET_PROJEKTINSTALLNINGAR}" saknas i Sheets`);
  }

  await sheet.loadCells("C5:C19");

  // formattedValue (inte .value) — datumcellerna (C17–C19) är datumformaterade
  // i Sheets och .value ger annars ett rått Excel-serienummer (t.ex. 46327).
  const cell = (a1: string) => sheet.getCellByA1(a1).formattedValue;

  return {
    projektnamn: String(cell("C5") ?? ""),
    produktionsbolag: String(cell("C6") ?? ""),
    producent: String(cell("C7") ?? ""),
    lock1: String(cell("C17") ?? ""),
    lock2: String(cell("C18") ?? ""),
    lock3: String(cell("C19") ?? ""),
  };
}

function scenarioColumn(sheet: GoogleSpreadsheetWorksheet, col: number): WaterfallScenario {
  const at = (row: number) => parseNum(sheet.getCell(row - 1, col).value);

  return {
    bruttointakt: at(15),
    distributionsavgift: at(16),
    nettoEfterDistribution: at(17),
    finansiarsRecoupment: at(18),
    nettoEfterFinansiar: at(19),
    deferredFeePool: at(20),
    nettoEfterDeferred: at(21),
    crewPool: at(22),
    finansiarspool: at(23),
  };
}

/** Läser vattenfallssimuleringen för scenario A/B/C (kolumn D/E/F). */
export async function getWaterfall(): Promise<WaterfallData> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[SHEET_WATERFALL];
  if (!sheet) {
    throw new Error(`Fliken "${SHEET_WATERFALL}" saknas i Sheets`);
  }

  await sheet.loadCells("D15:F23");

  return {
    A: scenarioColumn(sheet, 3),
    B: scenarioColumn(sheet, 4),
    C: scenarioColumn(sheet, 5),
  };
}

/** Kontrollerar om en e-postadress har producent-åtkomst (env PRODUCER_EMAILS). */
export function isProducerEmail(email: string): boolean {
  const list = (process.env.PRODUCER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
