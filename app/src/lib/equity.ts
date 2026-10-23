import {
  getAllCrewMembers,
  getCrewMembersForEmail,
  getFaq,
  getProducentKontakt,
  getModelParams,
  getPooler,
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
import { beraknaFordelning, personNyckel, type PersonDelar, type PoolInstallning, type Skiva } from "./pooler";

export interface MyEquityData {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  params: ModelParams;
  kontakt: Kontakt | null;
  faq: FaqPost[];
  samagareCount: number;
  /** Den egna andelen av teamets del enligt poolmodellen. */
  minAndel: number;
  /** Den egna andelen uppdelad per pool/skiva. */
  minDelar: PersonDelar;
  pooler: PoolInstallning;
  poolerVarning: string | null;
  /** Skivor med få enheter: andelar i dem är preliminära tills budgeten är komplett. */
  tunnaSkivor: Skiva[];
}

/**
 * Hämtar allt en inloggad crew-medlem behöver se om sin egen ägarandel.
 * Returnerar null om e-posten inte finns i registret. Delas mellan
 * /api/sheets/me och /api/sheets/print.
 *
 * Skickar medvetet INTE med hela teamets individuella andelar, bara antal
 * samägare och den egna andelen. Enligt docs/ramverk.md §9 (Transparens)
 * ser crew inte varandras andelar. Den fullständiga per-person-listan finns
 * bara i /api/p/[projectId]/producer.
 */
export async function getMyEquityData(
  spreadsheetId: string,
  email: string
): Promise<MyEquityData | null> {
  const rows = await getCrewMembersForEmail(spreadsheetId, email);
  if (rows.length === 0) return null;

  const [project, waterfall, params, allRows, kontakt, faq, pooler] = await Promise.all([
    getProjectSettings(spreadsheetId),
    getWaterfall(spreadsheetId),
    getModelParams(spreadsheetId),
    getAllCrewMembers(spreadsheetId),
    // Kontakt och frågor är tillägg: ett fel där ska inte stoppa hela sidan.
    getProducentKontakt(spreadsheetId).catch(() => null),
    getFaq(spreadsheetId).catch(() => [] as FaqPost[]),
    getPooler(spreadsheetId),
  ]);

  const samagareCount = groupByPerson(allRows).length;

  // Bara den egna andelen skickas vidare, inte hela teamets (se kommentaren ovan).
  const fordelning = beraknaFordelning(allRows, pooler);
  const minaNycklar = Array.from(new Set(rows.map((r) => personNyckel(r.namn, r.epost))));
  const minDelar: PersonDelar = { skivor: { 1: 0, 2: 0, 3: 0 }, initiativ: 0 };
  let minAndel = 0;
  for (const nyckel of minaNycklar) {
    minAndel += fordelning.perPerson.get(nyckel) ?? 0;
    const d = fordelning.delar.get(nyckel);
    if (!d) continue;
    for (const s of [1, 2, 3] as const) minDelar.skivor[s] += d.skivor[s];
    minDelar.initiativ += d.initiativ;
  }

  return {
    project,
    rows,
    waterfall,
    params,
    kontakt,
    faq,
    samagareCount,
    minAndel,
    minDelar,
    pooler: pooler.installning,
    poolerVarning: pooler.varning,
    tunnaSkivor: fordelning.skivor.filter((sk) => sk.tunn).map((sk) => sk.skiva),
  };
}
