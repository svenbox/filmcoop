"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { CrewMember, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { formatPercent, formatSek } from "@/lib/format";
import { SCENARIO_LABELS } from "@/lib/scenarios";
import { groupByFas } from "@/lib/fas";

interface PrintResponse {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  totalPoang: number;
  samagareCount: number;
}

export default function PrintPage() {
  const { status } = useSession();
  const [data, setData] = useState<PrintResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") {
      fetch("/api/sheets/print")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setData(d);
        })
        .catch(() => setError("Kunde inte hämta data"));
    }
  }, [status]);

  useEffect(() => {
    if (data && !printed) {
      const t = setTimeout(() => {
        window.print();
        setPrinted(true);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [data, printed]);

  if (status === "loading" || (!data && !error)) {
    return <div className="loading-state">Laddar…</div>;
  }

  if (error) {
    return (
      <div className="print-page">
        <div className="alert error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { project, rows, waterfall, totalPoang, samagareCount } = data;
  const minPoang = rows.reduce((sum, r) => sum + r.poang, 0);
  const minDeferred = rows.reduce((sum, r) => sum + r.deferredFee, 0);
  const minAndel = totalPoang > 0 ? minPoang / totalPoang : 0;
  const minNamn = rows[0]?.namn || "";
  const minaRoller = Array.from(new Set(rows.map((r) => r.roll).filter(Boolean))).join(" / ");
  const idag = new Date().toLocaleDateString("sv-SE");
  const fasGrupper = groupByFas(rows);

  return (
    <div className="print-page">
      <div className="pill-bar" style={{ marginBottom: 20 }}>
        <button className="pill primary" onClick={() => window.print()}>
          Skriv ut / Spara som PDF
        </button>
      </div>

      <div className="print-header">
        <h1>{project.projektnamn || "Projekt"}</h1>
        <p>
          {minNamn}
          {minaRoller ? ` — ${minaRoller}` : ""}
        </p>
        <p className="print-date">Utskrivet {idag}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="label">Ägarandel</div>
          <div className="value">{formatPercent(minAndel)}</div>
        </div>
        <div className="stat-box">
          <div className="label">Ägarenheter</div>
          <div className="value">{minPoang.toFixed(1)}</div>
        </div>
        <div className="stat-box">
          <div className="label">Uppskjutet arvode</div>
          <div className="value">{formatSek(minDeferred)}</div>
        </div>
      </div>

      {fasGrupper.map((g) => (
        <div className="fas-section" key={g.fas}>
          <div className="section-header">
            {g.fas} — {g.label.toUpperCase() || "OKÄND FAS"}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Dagar</th>
                <th>Uppskjutet arvode</th>
                <th>Ägarenheter</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.radnummer}>
                  <td>{r.roll}</td>
                  <td>{r.dagar}</td>
                  <td>{formatSek(r.deferredFee)}</td>
                  <td>{r.poang.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card">
        <div className="section-header">Utbetalningsordning — min andel per scenario</div>
        <div className="stat-grid stat-grid-3">
          {(["A", "B", "C"] as const).map((s) => (
            <div key={s} className="stat-box">
              <div className="label">{SCENARIO_LABELS[s]}</div>
              <div className="value">{formatSek(waterfall[s].crewPool * minAndel)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">Lock-punkter</div>
        <div className="lock-row">
          <div className="lock-head">
            <span>Green Light (Lock 1)</span>
            <span className="lock-date">{project.lock1 || "—"}</span>
          </div>
        </div>
        <div className="lock-row">
          <div className="lock-head">
            <span>Wrap (Lock 2)</span>
            <span className="lock-date">{project.lock2 || "—"}</span>
          </div>
        </div>
        <div className="lock-row">
          <div className="lock-head">
            <span>Leverans (Lock 3)</span>
            <span className="lock-date">{project.lock3 || "—"}</span>
          </div>
        </div>
      </div>

      <p className="print-footnote">
        Detta utdrag är konfidentiellt. Utfärdat av {project.producent || "producenten"} via
        film.coop. Baserat på {samagareCount} samägares registrerade ägarenheter.
      </p>
    </div>
  );
}
