import { parseEmails, parseSpreadsheetId, type ProjectInput } from "@/lib/projects";

type Parsed = { ok: true; input: ProjectInput } | { ok: false; error: string };

/** Validerar och normaliserar formulärdata för att skapa/ändra ett projekt. */
export function parseProjectInput(body: unknown): Parsed {
  const b = (body ?? {}) as Record<string, unknown>;

  const namn = typeof b.namn === "string" ? b.namn.trim() : "";
  if (!namn) return { ok: false, error: "Projektnamn saknas" };

  const spreadsheetId = parseSpreadsheetId(
    typeof b.spreadsheet === "string" ? b.spreadsheet : ""
  );
  if (!spreadsheetId) {
    return { ok: false, error: "Ogiltig länk eller ID till kalkylbladet" };
  }

  const producerEmails = parseEmails(
    typeof b.producerEmails === "string" ? b.producerEmails : ""
  );
  const invalid = producerEmails.find((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (invalid) return { ok: false, error: `Ogiltig e-postadress: ${invalid}` };

  return { ok: true, input: { namn, spreadsheetId, producerEmails } };
}
