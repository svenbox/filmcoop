import type { FaqPost } from "./sheets";

/**
 * Frågor som en medverkande rimligen ställer sig innan hen går med på uppskjuten
 * ersättning. Svaren skrivs i fliken "Frågor och svar" i kalkylbladet. Finns
 * fliken inte visas de här frågorna ändå, märkta som obesvarade.
 */
export const STANDARDFRAGOR: string[] = [
  "Hur och när betalas mitt uppskjutna arvode?",
  "Vem betalar sociala avgifter och semesterersättning när arvodet betalas ut?",
  "Gäller försäkring under inspelningen?",
  "Gäller mitt kollektivavtal (Scen & Film), och vad händer med min royalty vid återanvändning?",
  "Vad händer om jag hoppar av?",
  "Vad händer om filmen aldrig blir gjord eller såld?",
  "Vad händer med rättigheterna, och hur blir jag namngiven?",
];

/** Sheet-posterna först, därefter standardfrågor som ännu inte finns i bladet. */
export function slaIhopFaq(fran: FaqPost[]): FaqPost[] {
  const finns = new Set(fran.map((p) => p.fraga.trim().toLowerCase()));
  const saknas = STANDARDFRAGOR.filter((f) => !finns.has(f.trim().toLowerCase())).map((fraga) => ({
    fraga,
    svar: "",
  }));
  return [...fran, ...saknas];
}
