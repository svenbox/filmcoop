import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginButton } from "./LoginButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect(session.user.isProducer ? "/producer" : "/crew");
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>{process.env.PROJECT_NAME || "film.coop"}</h1>
        <p>Logga in med ditt Google-konto för att se din ägarandel.</p>
        <LoginButton />
      </div>
    </div>
  );
}
