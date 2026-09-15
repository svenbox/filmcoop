import {
  getAllCrewMembers,
  getCrewMembersForEmail,
  getProjectSettings,
  getWaterfall,
  type CrewMember,
  type ProjectSettings,
  type WaterfallData,
} from "./sheets";
import { groupByPerson } from "./team";

export interface MyEquityData {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
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
export async function getMyEquityData(email: string): Promise<MyEquityData | null> {
  const rows = await getCrewMembersForEmail(email);
  if (rows.length === 0) return null;

  const [project, waterfall, allRows] = await Promise.all([
    getProjectSettings(),
    getWaterfall(),
    getAllCrewMembers(),
  ]);

  const totalPoang = allRows.reduce((sum, r) => sum + r.poang, 0);
  const samagareCount = groupByPerson(allRows).length;

  return { project, rows, waterfall, totalPoang, samagareCount };
}
