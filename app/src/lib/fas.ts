import type { CrewMember } from "./sheets";

export const FAS_LABELS: Record<string, string> = {
  F1: "Development",
  F2: "Pre-produktion",
  F3: "Pilot",
  F4: "Inspelning",
  F5: "Inspelning Fas 2",
  F6: "Post-produktion",
  F7: "Lansering",
};

const FAS_ORDER = Object.keys(FAS_LABELS);

export const FAS_TOOLTIP = FAS_ORDER.map((f) => `${f} = ${FAS_LABELS[f]}`).join(" · ");

export interface FasGroup {
  fas: string;
  label: string;
  rows: CrewMember[];
}

/** Grupperar rader per fas, sorterat i produktionsordning (F1→F7). Okända
 * fas-värden hamnar sist, sorterade alfabetiskt. */
export function groupByFas(rows: CrewMember[]): FasGroup[] {
  const byFas = new Map<string, CrewMember[]>();
  for (const r of rows) {
    const key = r.fas || "Okänd fas";
    const list = byFas.get(key) ?? [];
    list.push(r);
    byFas.set(key, list);
  }

  const keys = Array.from(byFas.keys()).sort((a, b) => {
    const ai = FAS_ORDER.indexOf(a);
    const bi = FAS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return keys.map((fas) => ({
    fas,
    label: FAS_LABELS[fas] || "",
    rows: byFas.get(fas)!,
  }));
}
