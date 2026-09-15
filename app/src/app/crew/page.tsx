"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import type { CrewMember, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { formatPercent, formatSek } from "@/lib/format";
import { KLASS_TOOLTIP, WATERFALL_TOOLTIP } from "@/lib/scenarios";
import { groupByFas } from "@/lib/fas";
import { interpolateWaterfall } from "@/lib/waterfallSlider";
import { OnboardingModal } from "../components/OnboardingModal";
import { Tooltip } from "../components/Tooltip";

interface MeResponse {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  totalPoang: number;
  samagareCount: number;
}

type Tab = "oversikt" | "rader" | "waterfall";

const BRUTTO_MAX = 10_000_000;
const BRUTTO_STEP = 50_000;

export default function CrewPage() {
  const { status } = useSession();
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("oversikt");
  const [brutto, setBrutto] = useState<number>(2_000_000);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") {
      fetch("/api/sheets/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setData(d);
        })
        .catch(() => setError("Kunde inte hämta data"));
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

  const { project, rows, waterfall, totalPoang, samagareCount } = data;
  const minPoang = rows.reduce((sum, r) => sum + r.poang, 0);
  const minDagar = rows.reduce((sum, r) => sum + r.dagar, 0);
  const minDeferred = rows.reduce((sum, r) => sum + r.deferredFee, 0);
  const minAndel = totalPoang > 0 ? minPoang / totalPoang : 0;
  const scenarioData = interpolateWaterfall(waterfall, brutto);
  const minDelAvCrewPool = scenarioData.crewPool * minAndel;
  const minNamn = rows[0]?.namn || "";
  const minaRoller = Array.from(new Set(rows.map((r) => r.roll).filter(Boolean))).join(" / ");
  const fasGrupper = groupByFas(rows);

  return (
    <>
      <OnboardingModal projektnamn={project.projektnamn} />

      <div className="topbar">
        <div className="breadcrumb">
          <span>film.coop</span>
          <span>›</span>
          <strong>{project.projektnamn || "Projekt"}</strong>
          {minNamn && (
            <>
              <span>›</span>
              <strong>{minNamn}</strong>
              {minaRoller && <span>({minaRoller})</span>}
            </>
          )}
        </div>
        <div className="topbar-user pill-bar">
          <a href="/print" target="_blank" rel="noopener noreferrer" className="pill">
            Skriv ut utdrag
          </a>
          <button className="pill" onClick={() => signOut()}>
            Logga ut
          </button>
        </div>
      </div>

      <div className="tab-row">
        <button
          className={`tab-btn ${tab === "oversikt" ? "active" : ""}`}
          onClick={() => setTab("oversikt")}
        >
          Översikt
        </button>
        <button
          className={`tab-btn ${tab === "rader" ? "active" : ""}`}
          onClick={() => setTab("rader")}
        >
          Mitt bidrag
          <span className="badge-count">{rows.length}</span>
        </button>
        <button
          className={`tab-btn ${tab === "waterfall" ? "active" : ""}`}
          onClick={() => setTab("waterfall")}
        >
          Utbetalningsordning
        </button>
      </div>

      <div className="page">
        {tab === "oversikt" && (
          <>
            <div className="stat-grid">
              <div className="stat-box">
                <div className="label">
                  Din ägarandel
                  <Tooltip text="Din procentandel av den pool som fördelas bland alla i teamet. Baseras på dina ägarenheter delat med teamets totala ägarenheter." />
                </div>
                <div className="value">{formatPercent(minAndel)}</div>
              </div>
              <div className="stat-box">
                <div className="label">
                  Dina ägarenheter
                  <Tooltip text="Ägarenheter du tjänat in. Beräknas utifrån antal arbetsdagar × poäng per fas × din funktionsmultiplikator." />
                </div>
                <div className="value">{minPoang.toFixed(1)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Produktionsbolag</div>
                <div className="value">{project.produktionsbolag || "—"}</div>
              </div>
              <div className="stat-box">
                <div className="label">Producent</div>
                <div className="value">{project.producent || "—"}</div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">Lock-punkter</div>
              <div className="lock-row">
                <div className="lock-head">
                  <span>Green Light (Lock 1)</span>
                  <span className="lock-date">{project.lock1 || "—"}</span>
                </div>
                <p className="lock-note">
                  Din ägarandel för Development och Pre-produktion fastslås.
                  Andelen kan inte ändras bakåt i tiden efter detta datum.
                </p>
              </div>
              <div className="lock-row">
                <div className="lock-head">
                  <span>Wrap (Lock 2)</span>
                  <span className="lock-date">{project.lock2 || "—"}</span>
                </div>
                <p className="lock-note">Din ägarandel för Inspelningsfasen fastslås.</p>
              </div>
              <div className="lock-row">
                <div className="lock-head">
                  <span>Leverans (Lock 3)</span>
                  <span className="lock-date">{project.lock3 || "—"}</span>
                </div>
                <p className="lock-note">Slutgiltigt register fastslås. Grund för alla utbetalningar.</p>
              </div>
            </div>
          </>
        )}

        {tab === "rader" && (
          <>
            {fasGrupper.map((g) => (
              <div className="fas-section" key={g.fas}>
                <div className="section-header">
                  {g.fas} — {g.label.toUpperCase() || "OKÄND FAS"}
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll</th>
                        <th>Klass</th>
                        <th>Dagar</th>
                        <th>Utbetalt dagarvode</th>
                        <th>
                          Uppskjutet arvode
                          <Tooltip text="Uppskjutet arvode — skillnaden mellan ditt marknadspris och vad som betalas ut nu. Betalas tillbaka ur filmens intäkter före vinst." />
                        </th>
                        <th>Ägarenheter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.radnummer}>
                          <td>{r.roll}</td>
                          <td>
                            <span className="klass-badge">{r.klass}</span>
                            <Tooltip text={KLASS_TOOLTIP[r.klass] || "Funktionsklass"} />
                          </td>
                          <td>{r.dagar}</td>
                          <td>{formatSek(r.cashFeePerDag)}</td>
                          <td>{formatSek(r.deferredFee)}</td>
                          <td>{r.poang.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {rows.length > 1 && (
              <div className="card">
                <div className="wf-row total">
                  <span>Totalt, alla faser</span>
                  <span className="wf-value"></span>
                </div>
                <div className="wf-row">
                  <span>Dagar</span>
                  <span className="wf-value">{minDagar}</span>
                </div>
                <div className="wf-row">
                  <span>Uppskjutet arvode</span>
                  <span className="wf-value">{formatSek(minDeferred)}</span>
                </div>
                <div className="wf-row">
                  <span>Ägarenheter</span>
                  <span className="wf-value">{minPoang.toFixed(1)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "waterfall" && (
          <>
            <p className="section-intro">
              Så här fördelas filmens intäkter — i denna ordning. Dra i
              reglaget för att se vad din andel kan bli värd vid olika
              intäktsnivåer.
            </p>

            <div className="brutto-slider">
              <div className="label-row">
                <span className="label">
                  Bruttointäkt
                  <Tooltip text={WATERFALL_TOOLTIP.bruttointakt} />
                </span>
                <span className="value">{formatSek(brutto)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={BRUTTO_MAX}
                step={BRUTTO_STEP}
                value={brutto}
                onChange={(e) => setBrutto(Number(e.target.value))}
              />
              <div className="range-ends">
                <span>0 kr</span>
                <span>{formatSek(BRUTTO_MAX)}</span>
              </div>
            </div>

            <p className="wf-estimate-note">
              Räknat genom att interpolera mellan de tre scenarierna som
              finns i kalkylbladet — en uppskattning, inte en ny
              affärsformel.
            </p>

            <div className="card">
              <div className="wf-row">
                <span>
                  Bruttointäkt
                  <Tooltip text={WATERFALL_TOOLTIP.bruttointakt} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.bruttointakt)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Distributionsavgift
                  <Tooltip text={WATERFALL_TOOLTIP.distributionsavgift} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.distributionsavgift)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Kvar efter distribution
                  <Tooltip text={WATERFALL_TOOLTIP.nettoEfterDistribution} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.nettoEfterDistribution)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Investerarens återbetalning
                  <Tooltip text={WATERFALL_TOOLTIP.finansiarsRecoupment} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.finansiarsRecoupment)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Kvar efter investerare
                  <Tooltip text={WATERFALL_TOOLTIP.nettoEfterFinansiar} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.nettoEfterFinansiar)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Uppskjutna arvoden
                  <Tooltip text={WATERFALL_TOOLTIP.deferredFeePool} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.deferredFeePool)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Kvar efter löner
                  <Tooltip text={WATERFALL_TOOLTIP.nettoEfterDeferred} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.nettoEfterDeferred)}</span>
              </div>
              <div className="wf-row total">
                <span>
                  Teamets andel (50% av netto)
                  <Tooltip text={WATERFALL_TOOLTIP.crewPool} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.crewPool)}</span>
              </div>
              <div className="wf-footnote">
                ← fördelas bland {samagareCount} samägare efter ägarenheter
              </div>
              <div className="wf-row highlight">
                <span>Din del ({formatPercent(minAndel)} av teamets andel)</span>
                <span className="wf-value">{formatSek(minDelAvCrewPool)}</span>
              </div>
            </div>

            {scenarioData.crewPool === 0 && (
              <div className="alert">
                Teamets andel är 0 kr vid den här intäktsnivån eftersom de
                uppskjutna arvodena är lika stora som eller större än vad som
                finns kvar efter investerare — det finns inget överskott kvar
                att dela ut ännu.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
