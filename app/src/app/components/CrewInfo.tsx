"use client";

import type { CrewMember, FaqPost, Kontakt, ModelParams, ProjectSettings, WaterfallData } from "@/lib/sheets";
import { slaIhopFaq } from "@/lib/faq";
import { formatPercent, formatSek } from "@/lib/format";
import { computeWaterfall } from "@/lib/waterfallModel";
import { SKIVA_ETIKETT, type PersonDelar, type PoolInstallning, type Skiva } from "@/lib/pooler";
import { Tooltip } from "./Tooltip";

function standardFinansiering(params: ModelParams) {
  return {
    stod: params.stod.belopp,
    samproducent: params.samproducent.belopp,
    mg: params.distributor.belopp,
    kontant: params.kontantinsats,
  };
}

interface MinInsatsProps {
  rows: CrewMember[];
  andel: number;
  params: ModelParams;
}

/** Det viktigaste för en medverkande: vad jag ger, vad jag kan få och när. */
export function MinInsatsKort({ rows, andel, params }: MinInsatsProps) {
  const dagar = rows.reduce((s, r) => s + r.dagar, 0);
  const marknadsvarde = rows.reduce((s, r) => s + r.dagar * r.marknPrisPerDag, 0);
  const utbetalt = rows.reduce((s, r) => s + r.dagar * r.cashFeePerDag, 0);
  const uppskjutet = rows.reduce((s, r) => s + r.deferredFee, 0);
  const breakEven = computeWaterfall(params, 0, standardFinansiering(params)).breakEven;

  return (
    <div className="card">
      <div className="section-header">Din insats i korthet</div>
      <div className="wf-row">
        <span>Dagar du bidrar med</span>
        <span className="wf-value">{dagar}</span>
      </div>
      {marknadsvarde > 0 && (
        <div className="wf-row">
          <span>Ditt arbete är värt</span>
          <span className="wf-value">{formatSek(marknadsvarde)}</span>
        </div>
      )}
      <div className="wf-row">
        <span>Du får under produktionen</span>
        <span className="wf-value">{formatSek(utbetalt)}</span>
      </div>
      <div className="wf-row total">
        <span>
          Uppskjutet arvode
          <Tooltip text="Det du inte får betalt för nu utan först ur filmens intäkter. Betalas före någon vinst delas ut." />
        </span>
        <span className="wf-value">{formatSek(uppskjutet)}</span>
      </div>
      <div className="wf-row">
        <span>
          Din andel av vinsten
          <Tooltip text="Din del av teamets del av vinsten, räknad per skiva utifrån vad du bidrar med, plus eventuell tilldelning ur initiativtagarnas pool. Vinsten delas först när alla uppskjutna arvoden är betalda." />
        </span>
        <span className="wf-value">{formatPercent(andel)}</span>
      </div>
      <p className="outcome-text">
        Du får tillbaka det uppskjutna arvodet och dessutom {formatPercent(andel)} av vinsten, men
        först när filmen dragit in cirka {formatSek(breakEven)} i bruttointäkt. Dras mindre in
        betalas bara en del av arvodet, och dras ingenting in får du inget utbetalt av det
        uppskjutna. Det uppskjutna arvodet är ditt arbete som betalas senare. Kontantinsats du
        eventuellt satt in ingår inte.
      </p>
      <div className="alert">
        <strong>Din andel är preliminär.</strong> Den fastställs vid lock-punkterna och kan
        ändras om fler personer tillkommer eller om dagar justeras. Procenten är relativ: den
        kan sjunka om fler tillkommer i samma skiva.
      </div>
    </div>
  );
}

interface ScenarioProps {
  params: ModelParams;
  waterfall: WaterfallData;
  uppskjutet: number;
  andel: number;
}

/** Vad jag får, i kronor, vid olika intäktsnivåer. */
export function ScenarioTabell({ params, waterfall, uppskjutet, andel }: ScenarioProps) {
  const fin = standardFinansiering(params);
  const breakEven = computeWaterfall(params, 0, fin).breakEven;

  const nivaer = [
    { namn: "Filmen säljer inte", brutto: 0 },
    { namn: "Litet utfall", brutto: waterfall.A.bruttointakt },
    { namn: "Mellanstort utfall", brutto: waterfall.B.bruttointakt },
    { namn: "Stort utfall", brutto: waterfall.C.bruttointakt },
    { namn: "Break-even (allt betalt)", brutto: breakEven },
  ]
    .filter((n, i) => i === 0 || n.brutto > 0)
    .sort((a, b) => a.brutto - b.brutto)
    .map((n) => {
      const wf = computeWaterfall(params, n.brutto, fin);
      const uppskjutetBetalt = uppskjutet * wf.skuldAndelBetald;
      const vinst = andel * wf.crewPool;
      return { ...n, uppskjutetBetalt, vinst, totalt: uppskjutetBetalt + vinst, del: wf.skuldAndelBetald };
    });

  return (
    <div className="card">
      <div className="section-header">Vad får du vid olika intäkter?</div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Utfall</th>
              <th>Bruttointäkt</th>
              <th>Du får totalt</th>
              <th>varav uppskjutet arvode</th>
              <th>varav vinstandel</th>
              <th>Del av ditt arvode som betalas</th>
            </tr>
          </thead>
          <tbody>
            {nivaer.map((n) => (
              <tr key={n.namn}>
                <td>{n.namn}</td>
                <td>{formatSek(n.brutto)}</td>
                <td>
                  <strong>{formatSek(n.totalt)}</strong>
                </td>
                <td>{formatSek(n.uppskjutetBetalt)}</td>
                <td>{formatSek(n.vinst)}</td>
                <td>{formatPercent(n.del)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="wf-footnote">
        Beräkningar vid respektive intäktsnivå, inte en garanti. Under break-even betalas
        uppskjutna arvoden i samma andel för alla. Kontantinsats du eventuellt satt in ingår inte.
        Dra själv i reglaget under Utbetalningsordning för andra nivåer.
      </div>
    </div>
  );
}

const NOTER: Record<"lock1" | "lock2" | "lock3", string> = {
  lock1: "Din ägarandel för development, förproduktion och pilot (F1–F3) fastställs. Kan inte ändras bakåt efter detta datum.",
  lock2: "Din ägarandel för inspelningen (F4–F5) fastställs. Extra arbete efteråt kräver en daterad ändring i registret.",
  lock3: "Slutligt register (F6–F8). Grund för alla utbetalningar. Du får ett skriftligt utdrag.",
};

/** Datum för produktionen och när andelarna låses. */
export function TidslinjeKort({ project }: { project: ProjectSettings }) {
  const datum = (d: string) => d || "Inte bestämt än";
  return (
    <div className="card">
      <div className="section-header">Tidslinje</div>
      <div className="wf-row">
        <span>Start av utveckling</span>
        <span className="wf-value">{datum(project.startDevelopment)}</span>
      </div>
      <div className="wf-row">
        <span>Beräknad inspelningsstart</span>
        <span className="wf-value">{datum(project.inspelningsstart)}</span>
      </div>
      <div className="wf-row">
        <span>Beräknad leverans</span>
        <span className="wf-value">{datum(project.leverans)}</span>
      </div>
      {(
        [
          ["Green Light (Lock 1)", project.lock1, NOTER.lock1],
          ["Wrap (Lock 2)", project.lock2, NOTER.lock2],
          ["Leverans (Lock 3)", project.lock3, NOTER.lock3],
        ] as const
      ).map(([namn, d, not]) => (
        <div className="lock-row" key={namn}>
          <div className="lock-head">
            <span>{namn}</span>
            <span className="lock-date">{datum(d)}</span>
          </div>
          <p className="lock-note">{not}</p>
        </div>
      ))}
      <div className="wf-footnote">
        Uppskjutna arvoden betalas först när filmen sålts eller distribuerats. När det sker beror på
        försäljningen och kan inte utlovas i förväg. Du får ett skriftligt utdrag vid varje
        lock-punkt.
      </div>
    </div>
  );
}

interface FaqProps {
  faq: FaqPost[];
  kontakt: Kontakt | null;
  producent: string;
}

/** Frågor och svar, och vem man kontaktar. Svaren skrivs i kalkylbladets flik "Frågor och svar". */
export function FaqKort({ faq, kontakt, producent }: FaqProps) {
  const poster = slaIhopFaq(faq);
  const namn = kontakt?.namn || producent;

  return (
    <div className="card faq">
      <div className="section-header">Vanliga frågor</div>
      {poster.map((p) => (
        <details key={p.fraga}>
          <summary>{p.fraga}</summary>
          {p.svar ? (
            <p>{p.svar}</p>
          ) : (
            <p className="muted">Inte besvarat än. Fråga producenten.</p>
          )}
        </details>
      ))}
      <div className="wf-footnote">
        Hittar du inte svaret?{" "}
        {namn ? (
          <>
            Fråga {namn}
            {kontakt?.epost && (
              <>
                {" "}
                på <a href={`mailto:${kontakt.epost}`}>{kontakt.epost}</a>
              </>
            )}
            {kontakt?.telefon && <> eller {kontakt.telefon}</>}.
          </>
        ) : (
          "Fråga producenten."
        )}
      </div>
    </div>
  );
}

/** Hur teamets del av vinsten är uppdelad i pooler och skivor, och vad som är ditt. */
export function PoolKort({
  pooler,
  delar,
  andel,
  tunna = [],
}: {
  pooler: PoolInstallning;
  delar: PersonDelar;
  andel: number;
  tunna?: Skiva[];
}) {
  const rader: { namn: string; not: string; del: number; min: number }[] = [
    {
      namn: "Produktionsbolaget",
      not: "Fast, bestäms från start",
      del: pooler.produktionsbolag,
      min: 0,
    },
    {
      namn: "Initiativtagarna",
      not: "Fördelas av producenten efter development",
      del: pooler.initiativ,
      min: delar.initiativ,
    },
    ...([1, 2, 3] as Skiva[]).map((s) => ({
      namn: SKIVA_ETIKETT[s],
      not: tunna.includes(s)
        ? "Preliminär: lite planerat arbete i skivan än"
        : "Delas efter bidrag, fast efter låsningen",
      del: pooler.skivor[s],
      min: delar.skivor[s],
    })),
  ];

  return (
    <div className="card">
      <div className="section-header">
        Så delas teamets del
        <Tooltip text="Teamets del av vinsten delas i fem delar. Varje del har en fast storlek som inte krymper när senare faser tillkommer. Din andel inom en skiva fastställs vid dess lock." />
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Del</th>
            <th>Storlek</th>
            <th>Din del</th>
          </tr>
        </thead>
        <tbody>
          {rader.map((r) => (
            <tr key={r.namn}>
              <td>
                {r.namn}
                <div className="muted">{r.not}</div>
              </td>
              <td>{formatPercent(r.del)}</td>
              <td>{r.min > 0 ? formatPercent(r.min) : "—"}</td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>Din andel av teamets del</strong>
            </td>
            <td>{formatPercent(1)}</td>
            <td>
              <strong>{formatPercent(andel)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
