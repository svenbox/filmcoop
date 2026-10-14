import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { isProducerOf } from "@/lib/access";
import { listProjects } from "@/lib/projects";
import { getCrewMembersForEmail } from "@/lib/sheets";

export interface MyProject {
  id: string;
  namn: string;
  isProducer: boolean;
  isCrew: boolean;
}

/** Projekt den inloggade har tillgång till, och i vilken roll. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const projects = await listProjects();

  const mine = await Promise.all(
    projects.map(async (p): Promise<MyProject> => {
      let isCrew = false;
      try {
        isCrew = (await getCrewMembersForEmail(p.spreadsheetId, email)).length > 0;
      } catch (err) {
        // Ett trasigt kalkylblad ska inte stoppa listan över övriga projekt.
        console.error(`Kunde inte kontrollera crew-åtkomst för projekt ${p.id}`, err);
      }
      return { id: p.id, namn: p.namn, isProducer: isProducerOf(p, email), isCrew };
    })
  );

  return NextResponse.json({
    projects: mine.filter((p) => p.isProducer || p.isCrew),
    isAdmin: isAdminEmail(email),
  });
}
