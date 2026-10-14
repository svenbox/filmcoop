import {
  getAllCrewMembers,
  getCrewMembersForEmail,
  getFaq,
  getProducentKontakt,
  getModelParams,
  getProjectSettings,
  getWaterfall,
  type CrewMember,
  type FaqPost,
  type Kontakt,
  type ModelParams,
  type ProjectSettings,
  type WaterfallData,
} from "./sheets";
import { groupByPerson } from "./team";

export interface MyEquityData {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  params: ModelParams;
  kontakt: Kontakt | null;
  faq: FaqPost[];
  totalPoang: number;
  samagareCount: number;
}

/**
 * Hämtar allt en inloggad crew-medlem behöver se om sin egen ägarandel.
 * Returnerar null om e-posten inte finns i registret. Delas mellan
 * /api/sheets/me och /api/sheets/print.
 *
 * Skickar medvetet INTE med hela teamets individuella ägarenheter —
 * bara en räknad totalsumma och antal samägare. Enligt
 * docs/ramverk.md §7 (Transparens) ska crew bara se totalt antal
 * enheter, inte varandras individuella andelar. Den fullständiga
 * per-person-listan finns bara i /api/sheets/producer.
 */
export async function getMyEquityData(
  spreadsheetId: string,
  email: string
): Promise<MyEquityData | null> {
  const rows = await getCrewMembersForEmail(spreadsheetId, email);
  if (rows.length === 0) return null;

  const [project, waterfall, params, allRows, kontakt, faq] = await Promise.all([
    getProjectSettings(spreadsheetId),
    getWaterfall(spreadsheetId),
    getModelParams(spreadsheetId),
    getAllCrewMembers(spreadsheetId),
    // Kontakt och frågor är tillägg: ett fel där ska inte stoppa hela sidan.
    getProducentKontakt(spreadsheetId).catch(() => null),
    getFaq(spreadsheetId).catch(() => [] as FaqPost[]),
  ]);

  const totalPoang = allRows.reduce((sum, r) => sum + r.poang, 0);
  const samagareCount = groupByPerson(allRows).length;

  return { project, rows, waterfall, params, kontakt, faq, totalPoang, samagareCount };
}
