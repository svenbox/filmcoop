import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { isAdminEmail } from "./admin";
import { getProject, type Project } from "./projects";

/** Producent för projektet, eller admin (admin får se alla projekt). */
export function isProducerOf(project: Project, email: string): boolean {
  return (
    project.producerEmails.includes(email.trim().toLowerCase()) ||
    isAdminEmail(email)
  );
}

type Authorized =
  | { ok: true; email: string; project: Project }
  | { ok: false; response: NextResponse };

/** Gemensam inloggnings- och projektkontroll för /api/p/[projectId]/*. */
export async function authorizeProject(projectId: string): Promise<Authorized> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Ej inloggad" }, { status: 401 }),
    };
  }

  const project = await getProject(projectId);
  if (!project) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Projektet finns inte" }, { status: 404 }),
    };
  }

  return { ok: true, email, project };
}

/** Kontroll för /api/admin/*. */
export async function authorizeAdmin(): Promise<
  { ok: true; email: string } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Ej inloggad" }, { status: 401 }),
    };
  }
  if (!isAdminEmail(email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 }),
    };
  }
  return { ok: true, email };
}
