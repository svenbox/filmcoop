import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/access";
import { createProject, listProjects } from "@/lib/projects";
import { getServiceAccountEmail, validateSpreadsheet } from "@/lib/sheets";
import { parseProjectInput } from "./parse";

export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    projects: await listProjects(),
    serviceAccountEmail: getServiceAccountEmail(),
  });
}

export async function POST(req: Request) {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const parsed = parseProjectInput(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await validateSpreadsheet(parsed.input.spreadsheetId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kunde inte nå kalkylbladet" },
      { status: 400 }
    );
  }

  const project = await createProject(parsed.input);
  return NextResponse.json({ project }, { status: 201 });
}
