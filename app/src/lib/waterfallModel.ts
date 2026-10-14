import type { ModelParams } from "./sheets";

export interface FinancingInput {
  /** Stöd som inte återbetalas från intäkter (t.ex. Filminstitutet). */
  stod: number;
  /** Samproducent / regional filmfond — equity som återbetalas och tar del av nettot. */
  samproducent: number;
  /** Distributörens minimigaranti (MG) — förskott som distributören återvinner först. */
  mg: number;
  /** Kontantinsats från producent och regissör — en finansiär som alla andra. */
  kontant: number;
}

export interface ModelResult {
  bruttointakt: number;
  distributionsavgift: number;
  nettoEfterDistribution: number;
  mgAtervinning: number;
  nettoEfterMg: number;
  /** Hur finansieringen används i budgeten. */
  taeckerBehov: number;
  saknasKontant: number;
  betalarArvodenKontant: number;
  kvarDeferredPool: number;
  /** Återbetalning till samproducent + stöd + er kontantinsats (pari passu). */
  recoupment: number;
  recoupmentSamproducent: number;
  recoupmentKontant: number;
  recoupmentStod: number;
  /** Kontantinsatsens del av finansiärspoolen. */
  finansiarspoolKontant: number;
  nettoEfterRecoupment: number;
  deferredBetalt: number;
  nettoEfterDeferred: number;
  finansiarsAndel: number;
  /** Delandelar av nettot (före ev. begränsning till 100 %), per finansiär. */
  andelSamproducent: number;
  andelKontant: number;
  andelStod: number;
  andelMg: number;
  crewPool: number;
  finansiarspool: number;
  breakEven: number;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Portalens egen vattenfallsmodell. Ersätter interpoleringen mellan
 * kalkylbladets tre scenarier så att både intäkt och finansiering kan
 * varieras fritt.
 *
 * Ordning:
 *  1. Distributionsavgift.
 *  2. Distributören återvinner sin MG (× multiplikator) innan resten lämnas vidare.
 *  3. Finansieringen (stöd + samproducent + MG + kontantinsats) täcker först
 *     budgetens kontantbehov; det som överstiger behovet betalar arvoden
 *     kontant så att mindre behöver skjutas upp. Kontantinsatsen från
 *     producent och regissör är en finansiär bland de andra — den trängs inte
 *     undan av annan finansiering, utan man justerar dess reglage själv.
 *  4. Återbetalning pari passu: samproducent (× mult), stöd (× mult, normalt 0)
 *     och kontantinsats, som får samproducentens villkor.
 *  5. Kvarvarande uppskjutna arvoden.
 *  6. Netto delas: samproducentens och kontantinsatsens andelar = belopp /
 *     total budget, plus de fasta andelar för stöd och MG som anges i
 *     kalkylbladet. Resten till teamet.
 */
export function computeWaterfall(
  params: ModelParams,
  brutto: number,
  financing: FinancingInput
): ModelResult {
  const { stod, samproducent, mg, kontant } = financing;

  const distributionsavgift = brutto * params.distributionsavgift;
  const nettoEfterDistribution = brutto - distributionsavgift;

  const mgAtervinning = Math.min(mg * params.distributor.multiplikator, nettoEfterDistribution);
  const nettoEfterMg = nettoEfterDistribution - mgAtervinning;

  const totalFinansiering = stod + samproducent + mg + kontant;
  const taeckerBehov = Math.min(totalFinansiering, params.kontantinsats);
  const saknasKontant = params.kontantinsats - taeckerBehov;
  // Uppskjutna löner och övrig egeninsats är samma sorts skuld: återbetalas
  // före vinst, och betalas kontant om finansieringen överstiger behovet.
  const skuld = params.deferredPool + params.ovrigEgeninsats;
  const betalarArvodenKontant = Math.min(totalFinansiering - taeckerBehov, skuld);
  const kvarDeferredPool = skuld - betalarArvodenKontant;

  const dueSam = samproducent * params.samproducent.multiplikator;
  const dueStod = stod * params.stod.multiplikator;
  const dueKontant = kontant * params.samproducent.multiplikator;
  const due = dueSam + dueStod + dueKontant;
  const recoupment = Math.min(due, nettoEfterMg);
  const ratio = due === 0 ? 0 : recoupment / due;
  const nettoEfterRecoupment = nettoEfterMg - recoupment;

  const deferredBetalt = Math.min(kvarDeferredPool, nettoEfterRecoupment);
  const nettoEfterDeferred = nettoEfterRecoupment - deferredBetalt;

  const samAndel = params.totalBudget > 0 ? samproducent / params.totalBudget : 0;
  const kontantAndel = params.totalBudget > 0 ? kontant / params.totalBudget : 0;
  const andelStod = stod > 0 ? params.stod.andelAvNetto : 0;
  const andelMg = mg > 0 ? params.distributor.andelAvNetto : 0;
  const rawAndel = samAndel + kontantAndel + andelStod + andelMg;
  const finansiarsAndel = clamp01(rawAndel);
  const finansiarspool = nettoEfterDeferred * finansiarsAndel;
  const finansiarspoolKontant = rawAndel > 0 ? finansiarspool * (kontantAndel / rawAndel) : 0;
  const crewPool = nettoEfterDeferred - finansiarspool;

  // Den bruttointäkt där alla återbetalningar och uppskjutna arvoden är täckta.
  const kvar = 1 - params.distributionsavgift;
  const breakEven =
    kvar > 0 ? (mg * params.distributor.multiplikator + due + kvarDeferredPool) / kvar : 0;

  return {
    bruttointakt: brutto,
    distributionsavgift: -distributionsavgift || 0,
    nettoEfterDistribution,
    mgAtervinning: -mgAtervinning || 0,
    nettoEfterMg,
    taeckerBehov,
    saknasKontant,
    betalarArvodenKontant,
    kvarDeferredPool,
    recoupment: -recoupment || 0,
    recoupmentSamproducent: dueSam * ratio,
    recoupmentKontant: dueKontant * ratio,
    recoupmentStod: dueStod * ratio,
    finansiarspoolKontant,
    nettoEfterRecoupment,
    deferredBetalt: -deferredBetalt || 0,
    nettoEfterDeferred,
    finansiarsAndel,
    andelSamproducent: samAndel,
    andelKontant: kontantAndel,
    andelStod,
    andelMg,
    crewPool,
    finansiarspool,
    breakEven,
  };
}
