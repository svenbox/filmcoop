"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { CrewMember, FaqPost, Kontakt, ModelParams, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { formatPercent, formatSek } from "@/lib/format";
import { GRUPP_HEADER_TOOLTIP, GRUPP_TOOLTIP } from "@/lib/scenarios";
import { groupByFas } from "@/lib/fas";
import { OnboardingModal } from "../../../components/OnboardingModal";
import { NavPills } from "../../../components/NavPills";
import { Tooltip } from "../../../components/Tooltip";
import { EkonomiKort } from "../../../components/EkonomiKort";
import { FaqKort, MinInsatsKort, PoolKort, ScenarioTabell, TidslinjeKort } from "../../../components/CrewInfo";
import { WaterfallTab } from "../../../components/WaterfallTab";
import type { PersonDelar, PoolInstallning, Skiva } from "@/lib/pooler";

interface MeResponse {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  params: ModelParams;
  kontakt: Kontakt | null;
  faq: FaqPost[];
  samagareCount: number;
  minAndel: number;
  minDelar: PersonDelar;
  pooler: PoolInstallning;
  poolerVarning: string | null;
  tunnaSkivor: Skiva[];
}

type Tab = "oversikt" | "rader" | "waterfall";


export default function CrewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { status } = useSession();
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("oversikt");

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") {
      fetch(`/api/p/${projectId}/me`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setData(d);
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

  const { project, rows, waterfall, params, kontakt, faq, samagareCount, minAndel, minDelar, pooler, tunnaSkivor } = data;
  const minDagar = rows.reduce((sum, r) => sum + r.dagar, 0);
  const minDeferred = rows.reduce((sum, r) => sum + r.deferredFee, 0);
  const minAvtal: "ja" | "nej" | null = rows.every((r) => r.avtal === null)
    ? null
    : rows.every((r) => r.avtal === "ja")
      ? "ja"
      : "nej";
  const preliminar = tunnaSkivor.some((sk) => minDelar.skivor[sk] > 0);
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
          <NavPills />
          <a href={`/p/${projectId}/print`} target="_blank" rel="noopener noreferrer" className="pill">
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
          Min insats
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
            <MinInsatsKort rows={rows} andel={minAndel} params={params} />

            <div className="stat-grid">
              <div className="stat-box">
                <div className="label">
                  Din ägarandel
                  <Tooltip text="Din procentandel av teamets del av vinsten. Den räknas per skiva utifrån vad du bidrar med, plus eventuell tilldelning ur initiativtagarnas pool." />
                </div>
                <div className="value">{formatPercent(minAndel)}</div>
                <div className="muted">
                  {preliminar ? "preliminär: budgeten är inte komplett än" : "preliminär tills dina faser låses"}
                </div>
              </div>
              <div className="stat-box">
                <div className="label">
                  Dina dagar
                  <Tooltip text="Antal arbetsdagar du är bokad för, summerat över alla faser." />
                </div>
                <div className="value">{minDagar}</div>
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

            <PoolKort pooler={pooler} delar={minDelar} andel={minAndel} tunna={tunnaSkivor} />

            <ScenarioTabell
              params={params}
              waterfall={waterfall}
              uppskjutet={minDeferred}
              andel={minAndel}
            />

            {minAvtal !== null && (
              <div className="card">
                <div className="section-header">Ditt avtal</div>
                <div className="wf-row">
                  <span>
                    Rättighetsöverlåtelse och Participation Agreement
                    <Tooltip text="Produktionsbolaget äger rättigheterna till filmen så att den kan säljas och representeras. Din ägarandel är en avtalad rätt till andel av intäkterna och regleras i Participation Agreement." />
                  </span>
                  <span className="wf-value">
                    {minAvtal === "ja" ? "✓ Signerat" : "Inte signerat än"}
                  </span>
                </div>
                {minAvtal === "nej" && (
                  <div className="wf-footnote">
                    Kontakta producenten för att få avtalet. Din ägarandel är dokumenterad i
                    portalen, men det är avtalet som gör den bindande.
                  </div>
                )}
              </div>
            )}

            <EkonomiKort params={params} />

            <TidslinjeKort project={project} />

            <FaqKort faq={faq} kontakt={kontakt} producent={project.producent} />
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
                  <table className="data-table fixed">
                    <colgroup>
                      <col style={{ width: "34%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "21%" }} />
                      <col style={{ width: "21%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Roll</th>
                        <th>
                          Grupp
                          <Tooltip text={GRUPP_HEADER_TOOLTIP} />
                        </th>
                        <th>Dagar</th>
                        <th>Utbetalt dagarvode</th>
                        <th>
                          Uppskjutet arvode
                          <Tooltip text="Uppskjutet arvode — skillnaden mellan ditt marknadspris och vad som betalas ut nu. Betalas tillbaka ur filmens intäkter före vinst." />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.radnummer}>
                          <td>{r.roll}</td>
                          <td>
                            <span className="klass-badge">{r.klass}</span>
                            <Tooltip text={GRUPP_TOOLTIP[r.klass] || "Funktionsgrupp"} />
                          </td>
                          <td>{r.dagar}</td>
                          <td>{formatSek(r.cashFeePerDag)}</td>
                          <td>{formatSek(r.deferredFee)}</td>
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
              </div>
            )}
          </>
        )}

        {tab === "waterfall" && (
          <WaterfallTab
            params={params}
            antalPersoner={samagareCount}
            self={{ deferredFee: minDeferred, andel: minAndel }}
          />
        )}
      </div>
    </>
  );
}
