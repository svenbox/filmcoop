"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import type { MyProject } from "../api/projects/route";

interface ProjectsResponse {
  projects: MyProject[];
  isAdmin: boolean;
}

export default function ProjectPickerPage() {
  const { status } = useSession();
  const [data, setData] = useState<ProjectsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((d: ProjectsResponse & { error?: string }) => {
          if (d.error) {
            setError(d.error);
            return;
          }
          // Exakt ett projekt i exakt en roll: gå direkt dit.
          const only = d.projects.length === 1 ? d.projects[0] : null;
          if (only && only.isProducer !== only.isCrew) {
            window.location.replace(
              `/p/${only.id}/${only.isProducer ? "producer" : "crew"}`
            );
            return;
          }
          setData(d);
        })
        .catch(() => setError("Kunde inte hämta projekt"));
    }
  }, [status]);

  if (status === "loading" || (!data && !error)) {
    return <div className="loading-state">Laddar…</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="topbar">
        <div className="breadcrumb">
          <span>film.coop</span>
          <span>›</span>
          <strong>Projekt</strong>
        </div>
        <div className="topbar-user pill-bar">
          {data.isAdmin && (
            <a href="/admin" className="pill">
              Admin
            </a>
          )}
          <button className="pill" onClick={() => signOut()}>
            Logga ut
          </button>
        </div>
      </div>

      <div className="page">
        {data.projects.length === 0 ? (
          <div className="alert">
            Din e-postadress finns inte i något projekt än.
            {data.isAdmin && " Lägg till ett projekt under Admin."}
          </div>
        ) : (
          <div className="card">
            <div className="section-header">Dina projekt</div>
            {data.projects.map((p) => (
              <div className="wf-row" key={p.id}>
                <span>{p.namn}</span>
                <span className="pill-bar">
                  {p.isProducer && (
                    <a href={`/p/${p.id}/producer`} className="pill">
                      Producentvy
                    </a>
                  )}
                  {p.isCrew && (
                    <a href={`/p/${p.id}/crew`} className="pill">
                      Min ägarandel
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
