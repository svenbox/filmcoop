import type { ModelParams } from "./sheets";

export interface FinancingInput {
  /** Stöd som inte återbetalas från intäkter (t.ex. Filminstitutet). */
  stod: number;
  /** Samproducent / regional filmfond — equity som återbetalas och tar del av nettot. */
  samproducent: number;
  /** Distributörens minimigaranti (MG) — förskott som distributören återvinner först. */
  mg: number;
}

export interface ModelResult {
  bruttointakt: number;
  distributionsavgift: number;
  nettoEfterDistribution: number;
  mgAtervinning: number;
  nettoEfterMg: number;
  /** Hur finansieringen används i budgeten. */
  ersatterKontant: number;
  betalarArvodenKontant: number;
  kvarKontantinsats: number;
  kvarDeferredPool: number;
  /** Återbetalning till samproducent + stöd + er kontantinsats (pari passu). */
  recoupment: number;
  recoupmentSamproducent: number;
  recoupmentKontant: number;
  recoupmentStod: number;
  nettoEfterRecoupment: number;
  deferredBetalt: number;
  nettoEfterDeferred: number;
  finansiarsAndel: number;
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
 *  3. Finansieringen (stöd + samproducent + MG) täcker först er kontantinsats,
 *     sedan betalas arvoden kontant så att mindre behöver skjutas upp.
 *  4. Återbetalning pari passu: samproducent (× mult), stöd (× mult, normalt 0)
 *     och kvarvarande kontantinsats (× 1 + premie).
 *  5. Kvarvarande uppskjutna arvoden.
 *  6. Netto delas: samproducentens andel = belopp / total budget, plus de
 *     fasta andelar för stöd och MG som anges i kalkylbladet. Resten till teamet.
 */
export function computeWaterfall(
  params: ModelParams,
  brutto: number,
  financing: FinancingInput
): ModelResult {
  const { stod, samproducent, mg } = financing;

  const distributionsavgift = brutto * params.distributionsavgift;
  const nettoEfterDistribution = brutto - distributionsavgift;

  const mgAtervinning = Math.min(mg * params.distributor.multiplikator, nettoEfterDistribution);
  const nettoEfterMg = nettoEfterDistribution - mgAtervinning;

  const totalFinansiering = stod + samproducent + mg;
  const ersatterKontant = Math.min(totalFinansiering, params.kontantinsats);
  const kvarKontantinsats = params.kontantinsats - ersatterKontant;
  const betalarArvodenKontant = Math.min(
    totalFinansiering - ersatterKontant,
    params.deferredPool
  );
  const kvarDeferredPool = params.deferredPool - betalarArvodenKontant;

  const dueSam = samproducent * params.samproducent.multiplikator;
  const dueStod = stod * params.stod.multiplikator;
  const dueKontant = kvarKontantinsats * (1 + params.premieKontant);
  const due = dueSam + dueStod + dueKontant;
  const recoupment = Math.min(due, nettoEfterMg);
  const ratio = due === 0 ? 0 : recoupment / due;
  const nettoEfterRecoupment = nettoEfterMg - recoupment;

  const deferredBetalt = Math.min(kvarDeferredPool, nettoEfterRecoupment);
  const nettoEfterDeferred = nettoEfterRecoupment - deferredBetalt;

  const samAndel = params.totalBudget > 0 ? samproducent / params.totalBudget : 0;
  const finansiarsAndel = clamp01(
    samAndel +
      (stod > 0 ? params.stod.andelAvNetto : 0) +
      (mg > 0 ? params.distributor.andelAvNetto : 0)
  );
  const finansiarspool = nettoEfterDeferred * finansiarsAndel;
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
    ersatterKontant,
    betalarArvodenKontant,
    kvarKontantinsats,
    kvarDeferredPool,
    recoupment: -recoupment || 0,
    recoupmentSamproducent: dueSam * ratio,
    recoupmentKontant: dueKontant * ratio,
    recoupmentStod: dueStod * ratio,
    nettoEfterRecoupment,
    deferredBetalt: -deferredBetalt || 0,
    nettoEfterDeferred,
    finansiarsAndel,
    crewPool,
    finansiarspool,
    breakEven,
  };
}
