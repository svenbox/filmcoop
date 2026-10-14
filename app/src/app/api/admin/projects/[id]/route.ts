import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/access";
import { deleteProject, getProject, updateProject } from "@/lib/projects";
import { forgetDoc, validateSpreadsheet } from "@/lib/sheets";
import { parseProjectInput } from "../parse";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const existing = await getProject(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Projektet finns inte" }, { status: 404 });
  }

  const parsed = parseProjectInput(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.input.spreadsheetId !== existing.spreadsheetId) {
    try {
      await validateSpreadsheet(parsed.input.spreadsheetId);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Kunde inte nå kalkylbladet" },
        { status: 400 }
      );
    }
    forgetDoc(existing.spreadsheetId);
  }

  const project = await updateProject(params.id, parsed.input);
  return NextResponse.json({ project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const existing = await getProject(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Projektet finns inte" }, { status: 404 });
  }

  await deleteProject(params.id);
  forgetDoc(existing.spreadsheetId);
  return NextResponse.json({ ok: true });
}
