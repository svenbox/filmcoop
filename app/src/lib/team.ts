import type { CrewMember } from "./sheets";

export interface TeamSummary {
  epost: string;
  namn: string;
  roller: string;
  klass: string;
  dagar: number;
  poang: number;
  deferredFee: number;
  andel: number;
}

/** Grupperar crew-rader per person (e-post) och summerar dagar/poäng/deferred
 * fee. Sorterat efter poäng, högst först. */
export function groupByPerson(rows: CrewMember[]): TeamSummary[] {
  const byEmail = new Map<string, CrewMember[]>();
  for (const r of rows) {
    const key = r.epost.trim().toLowerCase();
    const list = byEmail.get(key) ?? [];
    list.push(r);
    byEmail.set(key, list);
  }

  const totalPoang = rows.reduce((sum, r) => sum + r.poang, 0);

  const members: TeamSummary[] = Array.from(byEmail.entries()).map(([epost, personRows]) => {
    const poang = personRows.reduce((sum, r) => sum + r.poang, 0);
    return {
      epost,
      namn: personRows[0]?.namn || epost,
      roller: Array.from(new Set(personRows.map((r) => r.roll).filter(Boolean))).join(" / "),
      klass: personRows[0]?.klass || "",
      dagar: personRows.reduce((sum, r) => sum + r.dagar, 0),
      poang,
      deferredFee: personRows.reduce((sum, r) => sum + r.deferredFee, 0),
      andel: totalPoang > 0 ? poang / totalPoang : 0,
    };
  });

  return members.sort((a, b) => b.poang - a.poang);
}
