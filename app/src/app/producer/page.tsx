"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import type { CrewMember, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { groupByPerson } from "@/lib/team";
import { groupByFas } from "@/lib/fas";
import { formatPercent, formatSek } from "@/lib/format";
import { WATERFALL_TOOLTIP } from "@/lib/scenarios";
import { interpolateWaterfall } from "@/lib/waterfallSlider";
import { Tooltip } from "../components/Tooltip";

interface ProducerResponse {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
}

type Tab = "oversikt" | "crew" | "team" | "waterfall";

const BRUTTO_MAX = 10_000_000;
const BRUTTO_STEP = 50_000;

export default function ProducerPage() {
  const { status } = useSession();
  const [data, setData] = useState<ProducerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("oversikt");
  const [brutto, setBrutto] = useState<number>(2_000_000);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") {
      fetch("/api/sheets/producer")
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

  const { project, rows, waterfall } = data;
  const totalDagar = rows.reduce((sum, r) => sum + r.dagar, 0);
  const totalPoang = rows.reduce((sum, r) => sum + r.poang, 0);
  const totalDeferred = rows.reduce((sum, r) => sum + r.deferredFee, 0);
  const scenarioData = interpolateWaterfall(waterfall, brutto);
  const team = groupByPerson(rows);
  const fasGrupper = groupByFas(rows);

  return (
    <>
      <div className="topbar">
        <div className="breadcrumb">
          <span>film.coop</span>
          <span>›</span>
          <strong>{project.projektnamn || "Projekt"}</strong>
          <span>›</span>
          <span>Producent</span>
        </div>
        <div className="topbar-user">
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
          className={`tab-btn ${tab === "crew" ? "active" : ""}`}
          onClick={() => setTab("crew")}
        >
          Crew
          <span className="badge-count">{rows.length}</span>
        </button>
        <button
          className={`tab-btn ${tab === "team" ? "active" : ""}`}
          onClick={() => setTab("team")}
        >
          Team
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
                <div className="label">Antal crew</div>
                <div className="value">{rows.length}</div>
              </div>
              <div className="stat-box">
                <div className="label">Totalt antal dagar</div>
                <div className="value">{totalDagar}</div>
              </div>
              <div className="stat-box">
                <div className="label">Total poäng</div>
                <div className="value">{totalPoang.toFixed(1)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Total deferred fee</div>
                <div className="value">{formatSek(totalDeferred)}</div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">Projekt</div>
              <div className="wf-row">
                <span>Produktionsbolag</span>
                <span className="wf-value">{project.produktionsbolag || "—"}</span>
              </div>
              <div className="wf-row">
                <span>Producent</span>
                <span className="wf-value">{project.producent || "—"}</span>
              </div>
              <div className="wf-row">
                <span>Green Light (Lock 1)</span>
                <span className="wf-value">{project.lock1 || "—"}</span>
              </div>
              <div className="wf-row">
                <span>Wrap (Lock 2)</span>
                <span className="wf-value">{project.lock2 || "—"}</span>
              </div>
              <div className="wf-row">
                <span>Leverans (Lock 3)</span>
                <span className="wf-value">{project.lock3 || "—"}</span>
              </div>
            </div>
          </>
        )}

        {tab === "crew" && (
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
                        <th>Namn</th>
                        <th>Roll</th>
                        <th>Klass</th>
                        <th>Dagar</th>
                        <th>Utbetalt dagarvode</th>
                        <th>Markn.pris/dag</th>
                        <th>Uppskjutet arvode</th>
                        <th>Ägarenheter</th>
                        <th>E-post</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.radnummer}>
                          <td>{r.namn}</td>
                          <td>{r.roll}</td>
                          <td>
                            <span className="klass-badge">{r.klass}</span>
                          </td>
                          <td>{r.dagar}</td>
                          <td>{formatSek(r.cashFeePerDag)}</td>
                          <td>{formatSek(r.marknPrisPerDag)}</td>
                          <td>{formatSek(r.deferredFee)}</td>
                          <td>{r.poang.toFixed(1)}</td>
                          <td>{r.epost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "team" && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Namn</th>
                  <th>Roll</th>
                  <th>Klass</th>
                  <th>Ägarenheter</th>
                  <th>Andel</th>
                  <th>Uppskjutet arvode</th>
                </tr>
              </thead>
              <tbody>
                {team.map((m, i) => (
                  <tr key={m.epost}>
                    <td>{i + 1}</td>
                    <td>{m.namn}</td>
                    <td>{m.roller}</td>
                    <td>
                      <span className="klass-badge">{m.klass}</span>
                    </td>
                    <td>{m.poang.toFixed(1)}</td>
                    <td>
                      <div className="rank-row">
                        <div className="rank-bar-track">
                          <div
                            className="rank-bar-fill"
                            style={{ width: formatPercent(m.andel) }}
                          />
                        </div>
                        <span>{formatPercent(m.andel)}</span>
                      </div>
                    </td>
                    <td>{formatSek(m.deferredFee)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <strong>Totalt</strong>
                  </td>
                  <td>
                    <strong>{team.reduce((sum, m) => sum + m.poang, 0).toFixed(1)}</strong>
                  </td>
                  <td></td>
                  <td>
                    <strong>{formatSek(team.reduce((sum, m) => sum + m.deferredFee, 0))}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === "waterfall" && (
          <>
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
                ← fördelas bland {team.length} samägare efter ägarenheter
              </div>
              <div className="wf-row total">
                <span>
                  Investerarnas andel (50% av netto)
                  <Tooltip text={WATERFALL_TOOLTIP.finansiarspool} />
                </span>
                <span className="wf-value">{formatSek(scenarioData.finansiarspool)}</span>
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
