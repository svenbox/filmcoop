"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { CrewMember, ModelParams, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { groupByPerson, sharedEmails } from "@/lib/team";
import { groupByFas } from "@/lib/fas";
import { formatPercent, formatSek } from "@/lib/format";
import { NavPills } from "../../../components/NavPills";
import { Tooltip } from "../../../components/Tooltip";
import { GRUPP_HEADER_TOOLTIP, LOCK_TOOLTIP } from "@/lib/scenarios";
import { EkonomiKort } from "../../../components/EkonomiKort";
import { WaterfallTab } from "../../../components/WaterfallTab";

interface ProducerResponse {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  params: ModelParams;
}

type Tab = "oversikt" | "crew" | "team" | "waterfall";

export default function ProducerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { status } = useSession();
  const [data, setData] = useState<ProducerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("oversikt");

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") {
      fetch(`/api/p/${projectId}/producer`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else {
            setData(d);
          }
        })
        .catch(() => setError("Kunde inte hämta data"));
    }
  }, [status, projectId]);

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

  const { project, rows, params } = data;
  const totalDagar = rows.reduce((sum, r) => sum + r.dagar, 0);
  const totalPoang = rows.reduce((sum, r) => sum + r.poang, 0);
  const totalDeferred = rows.reduce((sum, r) => sum + r.deferredFee, 0);
  const team = groupByPerson(rows);
  const delade = sharedEmails(rows);
  const obokade = team.filter((m) => !m.bokad);
  const harAvtalskolumn = team.some((m) => m.avtal !== null);
  const utanAvtal = team.filter((m) => m.avtal === "nej");
  const saknadeLock = [
    ["Lock 1", project.lock1],
    ["Lock 2", project.lock2],
    ["Lock 3", project.lock3],
  ]
    .filter(([, datum]) => !datum)
    .map(([namn]) => namn);
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
        <div className="topbar-user pill-bar">
          <NavPills />
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
          Rader per fas
          <span className="badge-count">{rows.length}</span>
        </button>
        <button
          className={`tab-btn ${tab === "team" ? "active" : ""}`}
          onClick={() => setTab("team")}
        >
          Personer och andelar
          <span className="badge-count">{team.length}</span>
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
                <div className="label">Antal personer</div>
                <div className="value">{team.length}</div>
                {obokade.length > 0 && (
                  <div className="muted">varav {obokade.length} inte bokade än</div>
                )}
              </div>
              <div className="stat-box">
                <div className="label">Totalt antal dagar</div>
                <div className="value">{totalDagar}</div>
              </div>
              <div className="stat-box">
                <div className="label">Totalt antal ägarenheter</div>
                <div className="value">{totalPoang.toFixed(1)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Uppskjutna arvoden</div>
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
                <span>
                  Green Light (Lock 1)
                  <Tooltip text={LOCK_TOOLTIP.lock1} />
                </span>
                <span className="wf-value">{project.lock1 || "—"}</span>
              </div>
              <div className="wf-row">
                <span>
                  Wrap (Lock 2)
                  <Tooltip text={LOCK_TOOLTIP.lock2} />
                </span>
                <span className="wf-value">{project.lock2 || "—"}</span>
              </div>
              <div className="wf-row">
                <span>
                  Leverans (Lock 3)
                  <Tooltip text={LOCK_TOOLTIP.lock3} />
                </span>
                <span className="wf-value">{project.lock3 || "—"}</span>
              </div>
            </div>

            <EkonomiKort params={params} />

            <div className="card">
              <div className="section-header">Att göra</div>
              {obokade.length === 0 &&
              saknadeLock.length === 0 &&
              utanAvtal.length === 0 &&
              harAvtalskolumn ? (
                <p className="muted">Inget att göra just nu.</p>
              ) : (
                <ul className="todo-list">
                  {obokade.length > 0 && (
                    <li>
                      <strong>{obokade.length} personer är inte bokade än</strong> ({obokade
                        .map((m) => m.namn)
                        .join(", ")}). De syns i listorna och räknas med i andelarna, men kan
                      inte logga in förrän deras egen e-postadress lagts in i kalkylbladet.
                    </li>
                  )}
                  {!harAvtalskolumn && (
                    <li>
                      <strong>Avtalsstatus följs inte än.</strong> Lägg till kolumnen "Avtal"
                      (JA/NEJ) i Egeninsats & Poäng för att se vem som skrivit under
                      rättighetsöverlåtelse och Participation Agreement.
                    </li>
                  )}
                  {utanAvtal.length > 0 && (
                    <li>
                      <strong>{utanAvtal.length} personer saknar signerat avtal</strong> (
                      {utanAvtal.map((m) => m.namn).join(", ")}). Produktionsbolaget måste
                      äga rättigheterna för att kunna representera filmen, och
                      ägarandelen regleras i Participation Agreement.
                    </li>
                  )}
                  {saknadeLock.length > 0 && (
                    <li>
                      <strong>Datum saknas för {saknadeLock.join(", ")}.</strong> Lock-punkterna
                      fastställer ägarandelarna vid tre tidpunkter. Utan datum är inget låst och
                      andelarna kan fortfarande ändras.
                    </li>
                  )}
                </ul>
              )}
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
                  <table className="data-table fixed">
                    <colgroup>
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "19%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "17%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Namn</th>
                        <th>Roll</th>
                        <th>
                          Grupp
                          <Tooltip text={GRUPP_HEADER_TOOLTIP} />
                        </th>
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
                          <td>{r.epost && !delade.has(r.epost.trim().toLowerCase()) ? (
                              r.epost
                            ) : (
                              <span className="muted">Ej bokad än</span>
                            )}</td>
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
                  <th>
                    Grupp
                    <Tooltip text={GRUPP_HEADER_TOOLTIP} />
                  </th>
                  <th>Ägarenheter</th>
                  <th>Andel</th>
                  <th>Uppskjutet arvode</th>
                  {harAvtalskolumn && (
                    <th>
                      Avtal
                      <Tooltip text="Signerat avtal: rättighetsöverlåtelse till produktionsbolaget och Participation Agreement som reglerar ägarandelen. Styrs av kolumnen Avtal i kalkylbladet." />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {team.map((m, i) => (
                  <tr key={m.key}>
                    <td>{i + 1}</td>
                    <td>
                      {m.namn}
                      {!m.bokad && <span className="muted"> · ej bokad än</span>}
                    </td>
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
                            style={{ width: `${Math.min(100, Math.max(0, m.andel * 100))}%` }}
                          />
                        </div>
                        <span>{formatPercent(m.andel)}</span>
                      </div>
                    </td>
                    <td>{formatSek(m.deferredFee)}</td>
                    {harAvtalskolumn && (
                      <td>
                        {m.avtal === "ja" ? (
                          "✓ Signerat"
                        ) : (
                          <span className="muted">Saknas</span>
                        )}
                      </td>
                    )}
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
                  {harAvtalskolumn && (
                    <td>
                      {team.filter((m) => m.avtal === "ja").length} av {team.length}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === "waterfall" && (
          <WaterfallTab
            params={params}
            waterfall={data.waterfall}
            team={team}
            antalPersoner={team.length}
          />
        )}
      </div>
    </>
  );
}
