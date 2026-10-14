import { NextResponse } from "next/server";
import { authorizeProject } from "@/lib/access";
import { getMyEquityData } from "@/lib/equity";

/** Samma data som /api/p/[projectId]/me, för det utskrivbara personliga utdraget. */
export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const auth = await authorizeProject(params.projectId);
  if (!auth.ok) return auth.response;

  try {
    const data = await getMyEquityData(auth.project.spreadsheetId, auth.email);

    if (!data) {
      return NextResponse.json(
        { error: "Din e-post finns inte i registret" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Kunde inte hämta utdrag från Sheets", err);
    return NextResponse.json(
      { error: "Kunde inte hämta data från Sheets" },
      { status: 500 }
    );
  }
}
