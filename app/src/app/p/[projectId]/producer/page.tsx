"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { CrewMember, FaqPost, ModelParams, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { slaIhopFaq } from "@/lib/faq";
import { groupByPerson, sharedEmails } from "@/lib/team";
import { groupByFas } from "@/lib/fas";
import { beraknaFordelning, STANDARD_POOLER_DATA, type PoolerData } from "@/lib/pooler";
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
  faq: FaqPost[];
  pooler?: PoolerData;
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
  const totalDeferred = rows.reduce((sum, r) => sum + r.deferredFee, 0);
  const pooler = data.pooler ?? STANDARD_POOLER_DATA;
  const fordelning = beraknaFordelning(rows, pooler);
  const team = groupByPerson(rows, pooler, fordelning);
  const initiativOfordelat = fordelning.initiativOfordelat > 0.00001;
  const tunnaSkivor = fordelning.skivor.filter((sk) => sk.tunn);
  const delade = sharedEmails(rows);
  const obokade = team.filter((m) => !m.bokad);
  const harAvtalskolumn = team.some((m) => m.avtal !== null);
  const utanAvtal = team.filter((m) => m.avtal === "nej");
  const obesvaradeFragor = slaIhopFaq(data.faq ?? []).filter((p) => !p.svar).length;
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
              obesvaradeFragor === 0 &&
              !initiativOfordelat &&
              tunnaSkivor.length === 0 &&
              pooler.varning === null &&
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
                  {pooler.varning && (
                    <li>
                      <strong>Poolerna stämmer inte.</strong> {pooler.varning}
                    </li>
                  )}
                  {tunnaSkivor.map((sk) => (
                    <li key={sk.skiva}>
                      <strong>
                        Skiva {sk.skiva} ({sk.etikett}) har lite planerat arbete än.
                      </strong>{" "}
                      Arbete där är värt {sk.relativtVarde.toFixed(1).replace(".", ",")} gånger så
                      mycket som snittet i de andra skivorna, så andelarna i skivan är
                      preliminära. Det beror oftast på att budgeten inte är komplett (t.ex. post
                      eller promotion saknas). Fyll i de planerade dagarna för skivans faser så
                      jämnar det ut sig.
                    </li>
                  ))}
                  {initiativOfordelat && (
                    <li>
                      <strong>
                        Initiativtagarnas pool är inte fullt fördelad (
                        {formatPercent(fordelning.initiativOfordelat)} av teamets del återstår).
                      </strong>{" "}
                      Fördela den som producentbeslut efter development, i fliken "Pooler" i
                      kalkylbladet{pooler.finns ? "" : " (fliken finns inte än, skriptet skapar den)"}.
                      Tills dess får ingen del av den.
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
                  {obesvaradeFragor > 0 && (
                    <li>
                      <strong>{obesvaradeFragor} vanliga frågor till crew saknar svar.</strong>{" "}
                      De visas på crewens översikt som obesvarade. Skriv svaren i fliken "Frågor och
                      svar" i kalkylbladet (skriptet skapar fliken).
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
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "7%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "20%" }} />
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
          <>
            <div className="card">
              <div className="section-header">
                Så delas teamets del
                <Tooltip text="Teamets del av nettot (det som finns kvar efter finansiärerna) delas i fem delar med fast storlek. Varje skiva delas mellan dem som arbetar i den, och är reserverad tills någon är bokad i den." />
              </div>
              <div className="wf-row">
                <span>Produktionsbolagets pool</span>
                <span className="wf-value">{formatPercent(fordelning.produktionsbolag)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Initiativtagarnas pool
                  <Tooltip text="Fördelas av producenten efter development (F1) och ändras sedan inte. Ersätter särskild tilldelning för originalidé." />
                </span>
                <span className="wf-value">{formatPercent(fordelning.initiativTotal)}</span>
              </div>
              {fordelning.initiativ.map((t) => (
                <div className="wf-row sub" key={t.namn}>
                  <span>
                    {t.namn}
                    {!t.iRegistret && <span className="muted"> · finns inte i registret</span>}
                  </span>
                  <span className="wf-value">{formatPercent(t.andel)}</span>
                </div>
              ))}
              {initiativOfordelat && (
                <div className="wf-row sub">
                  <span className="muted">Ofördelat</span>
                  <span className="wf-value">{formatPercent(fordelning.initiativOfordelat)}</span>
                </div>
              )}
              {fordelning.skivor.map((sk) => (
                <div className="wf-row" key={sk.skiva}>
                  <span>
                    Skiva {sk.skiva}: {sk.etikett}
                    {sk.reserverad && <span className="muted"> · reserverad, ingen bokad än</span>}
                    {sk.tunn && <span className="badge-warn"> · tunn skiva, preliminär</span>}
                  </span>
                  <span className="wf-value">{formatPercent(sk.andel)}</span>
                </div>
              ))}
            </div>
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
                    <td>
                      <div className="rank-row">
                        <div className="rank-bar-track">
                          <div
                            className="rank-bar-fill"
                            style={{ width: `${Math.min(100, Math.max(0, m.andel * 100))}%` }}
                          />
                        </div>
                        <span>
                          {formatPercent(m.andel)}
                          {m.preliminar && (
                            <span
                              className="muted"
                              title="Har arbete i en skiva med lite planerat arbete. Andelen är preliminär tills budgeten är komplett."
                            >
                              {" "}
                              prel.
                            </span>
                          )}
                        </span>
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
                    <strong>{formatPercent(team.reduce((sum, m) => sum + m.andel, 0))}</strong>
                  </td>
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
          </>
        )}

        {tab === "waterfall" && (
          <WaterfallTab
            params={params}
            team={team}
            antalPersoner={team.length}
          />
        )}
      </div>
    </>
  );
}
