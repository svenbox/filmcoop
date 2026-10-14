import type { CrewMember } from "./sheets";

export interface TeamSummary {
  /** Unik nyckel per person (namn + e-post). */
  key: string;
  epost: string;
  /** Falskt om e-post saknas eller delas av flera namn (platshållare, t.ex. tbd@tbd.se). */
  bokad: boolean;
  namn: string;
  roller: string;
  klass: string;
  dagar: number;
  poang: number;
  deferredFee: number;
  andel: number;
}

/** E-postadresser som används av fler än ett namn, alltså platshållare för
 * personer som inte är bokade än (t.ex. tbd@tbd.se). */
export function sharedEmails(rows: CrewMember[]): Set<string> {
  const names = new Map<string, Set<string>>();
  for (const r of rows) {
    const epost = r.epost.trim().toLowerCase();
    if (!epost) continue;
    const set = names.get(epost) ?? new Set<string>();
    set.add(r.namn.trim().toLowerCase());
    names.set(epost, set);
  }
  return new Set(Array.from(names).filter(([, set]) => set.size > 1).map(([epost]) => epost));
}

/** Grupperar crew-rader per person och summerar dagar/poäng/deferred fee.
 * Personen identifieras av namn + e-post, så att flera obokade personer med
 * samma platshållaradress inte slås ihop. Sorterat efter poäng, högst först. */
export function groupByPerson(rows: CrewMember[]): TeamSummary[] {
  const byEmail = new Map<string, CrewMember[]>();
  for (const r of rows) {
    const key = `${r.namn.trim().toLowerCase()}|${r.epost.trim().toLowerCase()}`;
    const list = byEmail.get(key) ?? [];
    list.push(r);
    byEmail.set(key, list);
  }

  const delade = sharedEmails(rows);
  const totalPoang = rows.reduce((sum, r) => sum + r.poang, 0);

  const members: TeamSummary[] = Array.from(byEmail.entries()).map(([key, personRows]) => {
    const poang = personRows.reduce((sum, r) => sum + r.poang, 0);
    const epost = personRows[0]?.epost.trim().toLowerCase() ?? "";
    return {
      key,
      epost,
      bokad: epost !== "" && !delade.has(epost),
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
