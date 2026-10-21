import type { CrewMember } from "./sheets";

/**
 * Teamets del av nettot (efter finansiärerna) delas i fem delar:
 *  - produktionsbolagets pool (statisk, finns med från start),
 *  - initiativtagarnas pool (statisk, fördelas av producenten efter F1),
 *  - tre skivor, en per lock-punkt, som delas efter ägarenheter inom skivan.
 * Se docs/ramverk.md §5.
 */

export type Skiva = 1 | 2 | 3;

export const SKIVA_FASER: Record<Skiva, string[]> = {
  1: ["F1", "F2", "F3"],
  2: ["F4", "F5"],
  3: ["F6", "F7", "F8"],
};

export const SKIVA_ETIKETT: Record<Skiva, string> = {
  1: "Lock 1, F1–F3",
  2: "Lock 2, F4–F5",
  3: "Lock 3, F6–F8",
};

export interface PoolInstallning {
  produktionsbolag: number;
  initiativ: number;
  skivor: Record<Skiva, number>;
}

export const STANDARD_POOLER: PoolInstallning = {
  produktionsbolag: 0.05,
  initiativ: 0.1,
  skivor: { 1: 0.25, 2: 0.4, 3: 0.2 },
};

/** Andel av initiativtagarnas pool (0–1) som producenten tilldelat en person. */
export interface InitiativTilldelning {
  namn: string;
  andel: number;
}

export interface PoolerData {
  installning: PoolInstallning;
  initiativ: InitiativTilldelning[];
  /** Falskt om fliken "Pooler" saknas i kalkylbladet och standardvärden används. */
  finns: boolean;
  /** Satt om inställningarna inte gick att använda (t.ex. summa ≠ 100 %). */
  varning: string | null;
}

export const STANDARD_POOLER_DATA: PoolerData = {
  installning: STANDARD_POOLER,
  initiativ: [],
  finns: false,
  varning: null,
};

export function skivaForFas(fas: string): Skiva | null {
  const m = /^F\s*(\d)/i.exec(fas.trim());
  if (!m) return null;
  const nyckel = `F${m[1]}`;
  for (const s of [1, 2, 3] as Skiva[]) if (SKIVA_FASER[s].includes(nyckel)) return s;
  return null;
}

export function personNyckel(namn: string, epost: string): string {
  return `${namn.trim().toLowerCase()}|${epost.trim().toLowerCase()}`;
}

export interface PersonDelar {
  skivor: Record<Skiva, number>;
  initiativ: number;
}

export interface SkivaSumma {
  skiva: Skiva;
  etikett: string;
  /** Skivans andel av teamets del. */
  andel: number;
  enheter: number;
  /** Ingen har enheter i skivan än: andelen är reserverad och ingen får den. */
  reserverad: boolean;
}

export interface Fordelning {
  /** Andel av teamets del per person (nyckel = namn|e-post, gemener). */
  perPerson: Map<string, number>;
  delar: Map<string, PersonDelar>;
  skivor: SkivaSumma[];
  produktionsbolag: number;
  /** Tilldelningar ur initiativtagarnas pool, som andel av teamets del. */
  initiativ: { namn: string; andel: number; iRegistret: boolean }[];
  initiativTotal: number;
  initiativOfordelat: number;
}

const tom = (): PersonDelar => ({ skivor: { 1: 0, 2: 0, 3: 0 }, initiativ: 0 });

/**
 * Räknar ut varje persons andel av teamets del. Inom en skiva delas andelen
 * efter ägarenheter (dagar × faspoäng × klassmultiplikator). En skiva utan
 * enheter är reserverad och fördelas inte. Initiativtagarnas pool går till de
 * personer producenten tilldelat; det som inte tilldelats är ofördelat.
 */
export function beraknaFordelning(rows: CrewMember[], pooler: PoolerData): Fordelning {
  const { installning } = pooler;
  const enheterPerSkiva: Record<Skiva, number> = { 1: 0, 2: 0, 3: 0 };
  const perNyckel = new Map<string, Record<Skiva, number>>();
  const nyckelPerNamn = new Map<string, string>();

  for (const r of rows) {
    const nyckel = personNyckel(r.namn, r.epost);
    const namn = r.namn.trim().toLowerCase();
    if (!nyckelPerNamn.has(namn)) nyckelPerNamn.set(namn, nyckel);
    const per = perNyckel.get(nyckel) ?? { 1: 0, 2: 0, 3: 0 };
    perNyckel.set(nyckel, per);
    const skiva = skivaForFas(r.fas);
    if (skiva === null) continue;
    per[skiva] += r.poang;
    enheterPerSkiva[skiva] += r.poang;
  }

  const delar = new Map<string, PersonDelar>();
  for (const [nyckel, per] of Array.from(perNyckel)) {
    const d = tom();
    for (const s of [1, 2, 3] as Skiva[]) {
      d.skivor[s] = enheterPerSkiva[s] > 0 ? (per[s] / enheterPerSkiva[s]) * installning.skivor[s] : 0;
    }
    delar.set(nyckel, d);
  }

  const initiativ: Fordelning["initiativ"] = [];
  let tilldelat = 0;
  for (const t of pooler.initiativ) {
    const andel = Math.max(0, t.andel) * installning.initiativ;
    tilldelat += Math.max(0, t.andel);
    const nyckel = nyckelPerNamn.get(t.namn.trim().toLowerCase());
    if (nyckel) {
      const d = delar.get(nyckel);
      if (d) d.initiativ += andel;
    }
    initiativ.push({ namn: t.namn, andel, iRegistret: Boolean(nyckel) });
  }

  const perPerson = new Map<string, number>();
  for (const [nyckel, d] of Array.from(delar)) {
    perPerson.set(nyckel, d.skivor[1] + d.skivor[2] + d.skivor[3] + d.initiativ);
  }

  return {
    perPerson,
    delar,
    skivor: ([1, 2, 3] as Skiva[]).map((s) => ({
      skiva: s,
      etikett: SKIVA_ETIKETT[s],
      andel: installning.skivor[s],
      enheter: enheterPerSkiva[s],
      reserverad: enheterPerSkiva[s] <= 0,
    })),
    produktionsbolag: installning.produktionsbolag,
    initiativ,
    initiativTotal: installning.initiativ,
    initiativOfordelat: installning.initiativ * Math.max(0, 1 - tilldelat),
  };
}
