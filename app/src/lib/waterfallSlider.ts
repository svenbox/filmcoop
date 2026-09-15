import type { WaterfallData, WaterfallScenario } from "./sheets";

const FIELDS: (keyof WaterfallScenario)[] = [
  "bruttointakt",
  "distributionsavgift",
  "nettoEfterDistribution",
  "finansiarsRecoupment",
  "nettoEfterFinansiar",
  "deferredFeePool",
  "nettoEfterDeferred",
  "crewPool",
  "finansiarspool",
];

const ZERO_SCENARIO: WaterfallScenario = {
  bruttointakt: 0,
  distributionsavgift: 0,
  nettoEfterDistribution: 0,
  finansiarsRecoupment: 0,
  nettoEfterFinansiar: 0,
  deferredFeePool: 0,
  nettoEfterDeferred: 0,
  crewPool: 0,
  finansiarspool: 0,
};

function interpolatePair(a: WaterfallScenario, b: WaterfallScenario, x: number): WaterfallScenario {
  const span = b.bruttointakt - a.bruttointakt;
  const t = span === 0 ? 0 : (x - a.bruttointakt) / span;
  const result = {} as WaterfallScenario;
  for (const f of FIELDS) {
    result[f] = a[f] + (b[f] - a[f]) * t;
  }
  return result;
}

/**
 * Uppskattar vattenfallet för en godtycklig bruttointäkt genom att
 * linjärt interpolera mellan de tre scenarierna i kalkylbladet (plus en
 * naturlig nollpunkt vid 0 kr — ingen intäkt ger inget att fördela).
 *
 * Det är en uppskattning för slidern, inte en ny beräkningsformel — vi
 * hittar inte på avgifts- eller recoupment-villkor. Vid intäkter mellan
 * eller bortom de tre riktiga scenarierna interpolerar/extrapolerar vi
 * varje rad för sig utifrån hur den rör sig mellan de kända punkterna.
 */
export function interpolateWaterfall(waterfall: WaterfallData, targetBrutto: number): WaterfallScenario {
  const points = [ZERO_SCENARIO, waterfall.A, waterfall.B, waterfall.C].slice().sort(
    (a, b) => a.bruttointakt - b.bruttointakt
  );

  if (targetBrutto <= points[0].bruttointakt) return points[0];

  const last = points[points.length - 1];
  if (targetBrutto >= last.bruttointakt) {
    const prev = points[points.length - 2];
    return interpolatePair(prev, last, targetBrutto);
  }

  for (let i = 0; i < points.length - 1; i++) {
    if (targetBrutto >= points[i].bruttointakt && targetBrutto <= points[i + 1].bruttointakt) {
      return interpolatePair(points[i], points[i + 1], targetBrutto);
    }
  }

  return last;
}
