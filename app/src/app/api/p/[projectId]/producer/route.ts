import { NextResponse } from "next/server";
import { authorizeProject, isProducerOf } from "@/lib/access";
import { getAllCrewMembers, getModelParams, getProjectSettings, getWaterfall } from "@/lib/sheets";

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const auth = await authorizeProject(params.projectId);
  if (!auth.ok) return auth.response;

  if (!isProducerOf(auth.project, auth.email)) {
    return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
  }

  const id = auth.project.spreadsheetId;

  try {
    const [project, rows, waterfall, modelParams] = await Promise.all([
      getProjectSettings(id),
      getAllCrewMembers(id),
      getWaterfall(id),
      getModelParams(id),
    ]);

    return NextResponse.json({ project, rows, waterfall, params: modelParams });
  } catch (err) {
    console.error("Kunde inte hämta producent-data från Sheets", err);
    return NextResponse.json(
      { error: "Kunde inte hämta data från Sheets" },
      { status: 500 }
    );
  }
}
