import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyEquityData } from "@/lib/equity";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  try {
    const data = await getMyEquityData(session.user.email);

    if (!data) {
      return NextResponse.json(
        { error: "Din e-post finns inte i registret" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Kunde inte hämta crew-data från Sheets", err);
    return NextResponse.json(
      { error: "Kunde inte hämta data från Sheets" },
      { status: 500 }
    );
  }
}
