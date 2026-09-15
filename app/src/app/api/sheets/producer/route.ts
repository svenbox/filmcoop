import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllCrewMembers, getProjectSettings, getWaterfall } from "@/lib/sheets";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  if (!session.user.isProducer) {
    return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
  }

  try {
    const [project, rows, waterfall] = await Promise.all([
      getProjectSettings(),
      getAllCrewMembers(),
      getWaterfall(),
    ]);

    return NextResponse.json({ project, rows, waterfall });
  } catch (err) {
    console.error("Kunde inte hämta producent-data från Sheets", err);
    return NextResponse.json(
      { error: "Kunde inte hämta data från Sheets" },
      { status: 500 }
    );
  }
}
