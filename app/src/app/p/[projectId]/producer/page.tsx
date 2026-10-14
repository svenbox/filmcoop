"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { CrewMember, ModelParams, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { groupByPerson } from "@/lib/team";
import { groupByFas } from "@/lib/fas";
import { formatPercent, formatSek } from "@/lib/format";
import { WATERFALL_TOOLTIP } from "@/lib/scenarios";
import { computeWaterfall } from "@/lib/waterfallModel";
import { NavPills } from "../../../components/NavPills";
import { Tooltip } from "../../../components/Tooltip";

interface ProducerResponse {
  project: ProjectSettings;
  rows: CrewMember[];
  waterfall: WaterfallData;
  params: ModelParams;
}

type Tab = "oversikt" | "crew" | "team" | "waterfall";

const BRUTTO_STEP = 25_000;
const FIN_STEP = 25_000;

function roundUp(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

interface SliderProps {
  label: string;
  tooltip: string;
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function MoneySlider({ label, tooltip, value, max, step, onChange }: SliderProps) {
  return (
    <div className="brutto-slider">
      <div className="label-row">
        <span className="label">
          {label}
          <Tooltip text={tooltip} />
        </span>
        <span className="value">{formatSek(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={Math.min(value, max)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range-ends">
        <span>0 kr</span>
        <span>{formatSek(max)}</span>
      </div>
    </div>
  );
}

export default function ProducerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { status } = useSession();
  const [data, setData] = useState<ProducerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("oversikt");
  const [brutto, setBrutto] = useState<number>(1_000_000);
  const [stod, setStod] = useState<number>(0);
  const [samproducent, setSamproducent] = useState<number>(0);
  const [mg, setMg] = useState<number>(0);

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
            if (d.params) {
              setStod(d.params.stod.belopp);
              setSamproducent(d.params.samproducent.belopp);
              setMg(d.params.distributor.belopp);
            }
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
  const wf = computeWaterfall(params, brutto, { stod, samproducent, mg });
  const budgetMax = roundUp(Math.max(params.totalBudget, 500_000), FIN_STEP);
  const bruttoMax = roundUp(Math.max(2_000_000, wf.breakEven * 2), 250_000);
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
                        <th>Grupp</th>
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
                  <th>Grupp</th>
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
            <MoneySlider
              label="Bruttointäkt"
              tooltip={WATERFALL_TOOLTIP.bruttointakt}
              value={brutto}
              max={bruttoMax}
              step={BRUTTO_STEP}
              onChange={setBrutto}
            />

            <div className="section-header">Finansiering</div>
            <MoneySlider
              label="Stöd (SFI, kommun m.fl.)"
              tooltip={WATERFALL_TOOLTIP.stod}
              value={stod}
              max={budgetMax}
              step={FIN_STEP}
              onChange={setStod}
            />
            <MoneySlider
              label="Samproducent / regional filmfond"
              tooltip={WATERFALL_TOOLTIP.samproducent}
              value={samproducent}
              max={budgetMax}
              step={FIN_STEP}
              onChange={setSamproducent}
            />
            <MoneySlider
              label="Distributör (minimigaranti)"
              tooltip={WATERFALL_TOOLTIP.mg}
              value={mg}
              max={budgetMax}
              step={FIN_STEP}
              onChange={setMg}
            />

            <p className="wf-estimate-note">
              Beräknat direkt från kalkylbladets parametrar (distributionsavgift,
              kontantinsats och uppskjutna arvoden). Kontantinsatsen räknas som en
              vanlig finansiär, med samproducentens villkor. Startvärdena för
              finansieringen hämtas från tabellen Finansiärer i Waterfall Simulering.
            </p>

            {stod + samproducent + mg > 0 && (
              <div className="card">
                <div className="section-header">Så används finansieringen</div>
                <div className="wf-row">
                  <span>
                    Ersätter er kontantinsats
                    <Tooltip text={WATERFALL_TOOLTIP.ersatterKontant} />
                  </span>
                  <span className="wf-value">{formatSek(wf.ersatterKontant)}</span>
                </div>
                <div className="wf-row">
                  <span>
                    Arvoden som betalas kontant i stället för att skjutas upp
                    <Tooltip text={WATERFALL_TOOLTIP.betalarArvoden} />
                  </span>
                  <span className="wf-value">{formatSek(wf.betalarArvodenKontant)}</span>
                </div>
                <div className="wf-row">
                  <span>Kvar att skjuta upp</span>
                  <span className="wf-value">{formatSek(wf.kvarDeferredPool)}</span>
                </div>
              </div>
            )}

            <div className="card">
              <div className="wf-row">
                <span>
                  Bruttointäkt
                  <Tooltip text={WATERFALL_TOOLTIP.bruttointakt} />
                </span>
                <span className="wf-value">{formatSek(wf.bruttointakt)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Distributionsavgift ({formatPercent(params.distributionsavgift)})
                  <Tooltip text={WATERFALL_TOOLTIP.distributionsavgift} />
                </span>
                <span className="wf-value">{formatSek(wf.distributionsavgift)}</span>
              </div>
              {mg > 0 && (
                <div className="wf-row">
                  <span>
                    Distributörens MG återvinns
                    <Tooltip text={WATERFALL_TOOLTIP.mgAtervinning} />
                  </span>
                  <span className="wf-value">{formatSek(wf.mgAtervinning)}</span>
                </div>
              )}
              <div className="wf-row">
                <span>
                  Kvar efter distribution
                  <Tooltip text={WATERFALL_TOOLTIP.nettoEfterDistribution} />
                </span>
                <span className="wf-value">{formatSek(wf.nettoEfterMg)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Återbetalning kontantinsats och finansiärer
                  <Tooltip text={WATERFALL_TOOLTIP.finansiarsRecoupment} />
                </span>
                <span className="wf-value">{formatSek(wf.recoupment)}</span>
              </div>
              {wf.recoupmentKontant > 0 && (
                <div className="wf-footnote">
                  varav kontantinsats från producent och regissör: {formatSek(wf.recoupmentKontant)}
                </div>
              )}
              {wf.recoupmentSamproducent > 0 && (
                <div className="wf-footnote">
                  varav samproducent: {formatSek(wf.recoupmentSamproducent)}
                </div>
              )}
              {wf.recoupmentStod > 0 && (
                <div className="wf-footnote">
                  varav stöd: {formatSek(wf.recoupmentStod)}
                </div>
              )}
              <div className="wf-row">
                <span>
                  Kvar efter återbetalning
                  <Tooltip text={WATERFALL_TOOLTIP.nettoEfterFinansiar} />
                </span>
                <span className="wf-value">{formatSek(wf.nettoEfterRecoupment)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Uppskjutna arvoden
                  <Tooltip text={WATERFALL_TOOLTIP.deferredFeePool} />
                </span>
                <span className="wf-value">{formatSek(wf.deferredBetalt)}</span>
              </div>
              <div className="wf-row">
                <span>
                  Nettovinst
                  <Tooltip text={WATERFALL_TOOLTIP.nettoEfterDeferred} />
                </span>
                <span className="wf-value">{formatSek(wf.nettoEfterDeferred)}</span>
              </div>
              <div className="wf-row total">
                <span>
                  Teamets andel ({formatPercent(1 - wf.finansiarsAndel)} av netto)
                  <Tooltip text={WATERFALL_TOOLTIP.crewPool} />
                </span>
                <span className="wf-value">{formatSek(wf.crewPool)}</span>
              </div>
              <div className="wf-footnote">
                ← fördelas bland {team.length} samägare efter ägarenheter
              </div>
              {wf.finansiarsAndel > 0 && (
                <div className="wf-row total">
                  <span>
                    Finansiärernas andel ({formatPercent(wf.finansiarsAndel)} av netto)
                    <Tooltip text={WATERFALL_TOOLTIP.finansiarspool} />
                  </span>
                  <span className="wf-value">{formatSek(wf.finansiarspool)}</span>
                </div>
              )}
              {wf.finansiarspoolKontant > 0 && (
                <div className="wf-footnote">
                  varav kontantinsats från producent och regissör:{" "}
                  {formatSek(wf.finansiarspoolKontant)}
                </div>
              )}
              <div className="wf-row">
                <span>
                  Break-even (allt återbetalt)
                  <Tooltip text={WATERFALL_TOOLTIP.breakEven} />
                </span>
                <span className="wf-value">{formatSek(wf.breakEven)}</span>
              </div>
            </div>

            {wf.crewPool === 0 && (
              <div className="alert">
                Teamets andel är 0 kr vid den här intäktsnivån. Först
                återbetalas kontantinsats och finansiärer, sedan de uppskjutna
                arvodena — ägarandelarna ger pengar först över cirka{" "}
                {formatSek(wf.breakEven)} i bruttointäkt.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
