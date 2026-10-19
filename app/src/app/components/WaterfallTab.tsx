"use client";

import { useState } from "react";
import type { ModelParams, WaterfallData } from "@/lib/sheets";
import type { TeamSummary } from "@/lib/team";
import { formatPercent, formatSek } from "@/lib/format";
import { WATERFALL_TOOLTIP } from "@/lib/scenarios";
import { computeWaterfall, type ModelResult } from "@/lib/waterfallModel";
import { ScenarioTabell } from "./CrewInfo";
import { Tooltip } from "./Tooltip";

const FIN_STEP = 25_000;

const PRESETS: { key: "A" | "B" | "C"; label: string }[] = [
  { key: "A", label: "Litet utfall" },
  { key: "B", label: "Mellanstort utfall" },
  { key: "C", label: "Stort utfall" },
];

function roundUp(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

interface SliderProps {
  label: string;
  hint?: string;
  tooltip: string;
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function MoneySlider({ label, hint, tooltip, value, max, step, onChange }: SliderProps) {
  return (
    <div className="brutto-slider">
      <div className="label-row">
        <span className="label">
          {label}
          <Tooltip text={tooltip} />
        </span>
        <span className="value">{formatSek(value)}</span>
      </div>
      {hint && <div className="slider-hint">{hint}</div>}
      <div className="slider-wrap">
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={Math.min(value, max)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <div className="range-ends">
        <span>0 kr</span>
        <span>{formatSek(max)}</span>
      </div>
    </div>
  );
}

interface Props {
  params: ModelParams;
  waterfall: WaterfallData;
  /** Producentvyn: alla personer, för väljaren "Se som". */
  team?: TeamSummary[];
  antalPersoner: number;
  /**
   * Crewvyn: den inloggades egen del. Då visas inga finansieringsreglage (det är
   * producentens verktyg för att pröva olika upplägg), men kostnad och
   * finansieringsstatus finns på crewvyns översikt.
   */
  self?: { deferredFee: number; andel: number };
}

export function WaterfallTab({ params, waterfall, team = [], antalPersoner, self }: Props) {
  const crewVy = self !== undefined;
  const [stod, setStod] = useState<number>(params.stod.belopp);
  const [samproducent, setSamproducent] = useState<number>(params.samproducent.belopp);
  const [mg, setMg] = useState<number>(params.distributor.belopp);
  const [kontant, setKontant] = useState<number>(params.kontantinsats);
  const [personKey, setPersonKey] = useState<string>(team[0]?.key ?? "");

  const finansiering = { stod, samproducent, mg, kontant };
  // Värden som inte beror på intäkten (milstolpar, break-even, andelar).
  const wf = computeWaterfall(params, 0, finansiering);
  const budgetMax = roundUp(Math.max(params.totalBudget, 500_000), FIN_STEP);
  const harFinansiarer = wf.finansiarerSkyldigt + wf.mgSkyldigt > 0;

  const vald = team.find((m) => m.key === personKey) ?? null;
  const person = self ?? (vald ? { deferredFee: vald.deferredFee, andel: vald.andel } : null);

  // Fasta intäktsnivåer: bladets tre scenarier och break-even. Finansieringsreglagen styr alla.
  const scenarier = PRESETS.map((p) => ({ namn: p.label, brutto: waterfall[p.key].bruttointakt }))
    .filter((n) => n.brutto > 0);
  const nivaer = [
    ...(scenarier.length > 0
      ? scenarier
      : [
          { namn: "Litet utfall", brutto: 500_000 },
          { namn: "Mellanstort utfall", brutto: 1_000_000 },
          { namn: "Stort utfall", brutto: 2_000_000 },
        ]),
    { namn: "Break-even", brutto: wf.breakEven },
  ]
    .filter((n) => n.brutto > 0)
    .sort((a, b) => a.brutto - b.brutto)
    .map((n) => {
      const r = computeWaterfall(params, n.brutto, finansiering);
      const segment = [
        { namn: "Distributören", varde: -r.distributionsavgift - r.mgAtervinning, klass: "seg-distributor" },
        { namn: "Tillbaka till finansiärerna", varde: -r.recoupment, klass: "seg-finansiar" },
        { namn: "Uppskjutna arvoden och egeninsats", varde: -r.deferredBetalt, klass: "seg-skuld" },
        { namn: "Vinst till teamet", varde: r.crewPool, klass: "seg-team" },
        { namn: "Vinst till finansiärerna", varde: r.finansiarspool, klass: "seg-finvinst" },
      ].filter((x) => x.varde > 0);
      const text =
        r.nettoEfterDeferred > 0
          ? `Vinst att dela ${formatSek(r.nettoEfterDeferred)}: teamet ${formatSek(r.crewPool)}` +
            (r.finansiarspool > 0 ? `, finansiärerna ${formatSek(r.finansiarspool)}` : "")
          : `Ingen vinst att dela än. ${formatPercent(r.skuldAndelBetald)} av de uppskjutna arvodena betalas.`;
      return { ...n, r, segment, text };
    });

  const legend = [
    { namn: "Distributören", klass: "seg-distributor" },
    { namn: "Tillbaka till finansiärerna", klass: "seg-finansiar" },
    { namn: "Uppskjutna arvoden och egeninsats", klass: "seg-skuld" },
    { namn: "Vinst till teamet", klass: "seg-team" },
    ...(wf.finansiarsAndel > 0 ? [{ namn: "Vinst till finansiärerna", klass: "seg-finvinst" }] : []),
  ];

  return (
    <>
      <div className="card milestones">
        <div className="section-header">
          Så går pengarna
          <Tooltip text="Intäkten betalas ut uppifrån och ned, och först när ett steg är klart går pengarna vidare till nästa. Beloppen anger bruttointäkt, alltså allt filmen tar in innan några avdrag. Det gäller oavsett hur mycket filmen drar in." />
        </div>
        <ol className="milestone-grid">
          <li>
            <span className="ms-nr">1</span>
            <div>
              <strong>Distributören</strong>
              <span>
                {formatPercent(params.distributionsavgift)} av intäkten
                {wf.mgSkyldigt > 0 && ` + minimigaranti ${formatSek(wf.mgSkyldigt)}`}
              </span>
            </div>
          </li>
          <li>
            <span className="ms-nr">2</span>
            <div>
              <strong>
                Finansiärerna
                <Tooltip text="Finansiärerna står före de uppskjutna arvodena eftersom de lägger in pengar som måste finnas för att filmen ska kunna göras, och tar den kontanta risken. Det gäller även den som lagt in kontanter i produktionen." />
              </strong>
              <span>
                {harFinansiarer
                  ? `${formatSek(wf.finansiarerSkyldigt)} tillbaka, klart vid ${formatSek(wf.finansiarerAterbetaldaVid)}`
                  : "Ingen återbetalning inlagd"}
              </span>
            </div>
          </li>
          <li>
            <span className="ms-nr">3</span>
            <div>
              <strong>Uppskjutna arvoden</strong>
              <span>
                {formatSek(wf.kvarDeferredPool)}, klart vid {formatSek(wf.breakEven)} (break-even)
              </span>
            </div>
          </li>
          <li>
            <span className="ms-nr">4</span>
            <div>
              <strong>Vinstdelning</strong>
              <span>
                Teamet {formatPercent(1 - wf.finansiarsAndel)}
                {wf.finansiarsAndel > 0 && `, finansiärer ${formatPercent(wf.finansiarsAndel)}`},
                först efter break-even
              </span>
            </div>
          </li>
        </ol>
      </div>

      {!crewVy && params.totalBudget > 0 && (
        <div className="card">
          <div className="section-header">Vad filmen kostar</div>
          <div className="wf-row total">
            <span>
              Total kostnad (budget inkl. uppskjutet)
              <Tooltip text={WATERFALL_TOOLTIP.totalKostnad} />
            </span>
            <span className="wf-value">{formatSek(params.totalBudget)}</span>
          </div>
          {params.kontantBudget > 0 && (
            <div className="wf-row">
              <span>Betalas kontant under produktionen</span>
              <span className="wf-value">{formatSek(params.kontantBudget)}</span>
            </div>
          )}
          <div className="wf-row">
            <span>Uppskjutna arvoden (betalas före vinst)</span>
            <span className="wf-value">{formatSek(params.deferredPool)}</span>
          </div>
          {params.ovrigEgeninsats > 1 && (
            <div className="wf-row">
              <span>Övrig egeninsats (betalas före vinst)</span>
              <span className="wf-value">{formatSek(params.ovrigEgeninsats)}</span>
            </div>
          )}
          <div className="wf-footnote">
            Finansiärernas andel av vinsten räknas mot den här totalen, inte bara mot de uppskjutna
            arvodena: en insats på 100 000 kr av {formatSek(params.totalBudget)} ger{" "}
            {formatPercent(100_000 / params.totalBudget)} av vinsten.
          </div>
        </div>
      )}

      {!crewVy && (
        <>
        <div className="section-header">Så finansieras filmen</div>
        <MoneySlider
          label="Kontantinsats"
          hint={`Budgetens kontantbehov: ${formatSek(params.kontantBehov)}`}
          tooltip={WATERFALL_TOOLTIP.kontant}
          value={kontant}
          max={budgetMax}
          step={FIN_STEP}
          onChange={setKontant}
        />
        <MoneySlider
          label="Samproducenter"
          tooltip={WATERFALL_TOOLTIP.samproducent}
          value={samproducent}
          max={budgetMax}
          step={FIN_STEP}
          onChange={setSamproducent}
        />
        <MoneySlider
          label="Stöd (utan anspråk på ägande)"
          tooltip={WATERFALL_TOOLTIP.stod}
          value={stod}
          max={budgetMax}
          step={FIN_STEP}
          onChange={setStod}
        />
        <MoneySlider
          label="Distributör (minimigaranti)"
          tooltip={WATERFALL_TOOLTIP.mg}
          value={mg}
          max={budgetMax}
          step={FIN_STEP}
          onChange={setMg}
        />

        </>
      )}

      <p className="wf-estimate-note">
        Antaganden: distributionsavgift {formatPercent(params.distributionsavgift)}, finansiärer
        återbetalas {params.samproducent.multiplikator.toLocaleString("sv-SE")}× (även
        kontantinsatsen). Ändras i kalkylbladet. Startvärdena kommer från tabellen Finansiärer.
      </p>

      {!crewVy && stod + samproducent + mg + kontant > 0 && (
        <div className="card">
          <div className="section-header">Vad finansieringen gör</div>
          <div className="wf-row">
            <span>
              Täcker budgetens kontantbehov
              <Tooltip text={WATERFALL_TOOLTIP.taeckerBehov} />
            </span>
            <span className="wf-value">{formatSek(wf.taeckerBehov)}</span>
          </div>
          {wf.saknasKontant > 0 && (
            <div className="wf-footnote">
              Kontantbehov som inte täcks: {formatSek(wf.saknasKontant)}
            </div>
          )}
          <div className="wf-row">
            <span>
              Arvoden som betalas kontant i stället för att skjutas upp
              <Tooltip text={WATERFALL_TOOLTIP.betalarArvoden} />
            </span>
            <span className="wf-value">{formatSek(wf.betalarArvodenKontant)}</span>
          </div>
          <div className="wf-row">
            <span>Kvar som skjuts upp</span>
            <span className="wf-value">{formatSek(wf.kvarDeferredPool)}</span>
          </div>
          {wf.finansiarsAndel > 0 && (
            <>
              <div className="section-header sub">Så delas vinsten</div>
              {wf.andelSamproducent > 0 && (
                <div className="wf-row">
                  <span>Samproducenter</span>
                  <span className="wf-value">{formatPercent(wf.andelSamproducent)}</span>
                </div>
              )}
              {wf.andelKontant > 0 && (
                <div className="wf-row">
                  <span>Kontantinsats</span>
                  <span className="wf-value">{formatPercent(wf.andelKontant)}</span>
                </div>
              )}
              {wf.andelMg > 0 && (
                <div className="wf-row">
                  <span>Distributör (fast andel)</span>
                  <span className="wf-value">{formatPercent(wf.andelMg)}</span>
                </div>
              )}
              <div className="wf-row total">
                <span>Teamet (efter ägarenheter)</span>
                <span className="wf-value">{formatPercent(1 - wf.finansiarsAndel)}</span>
              </div>
              <div className="wf-footnote">
                Finansiärernas andel = insats ÷ filmens totala kostnad (
                {formatSek(params.totalBudget)}).
              </div>
            </>
          )}
        </div>
      )}

      <div className="section-header">
        Vad händer vid olika intäkter?
        <Tooltip text="Varje stapel visar hur en bruttointäkt fördelas, från de bladets tre scenarier och break-even. Finansieringsreglagen ovan påverkar alla staplarna." />
      </div>
      <div className="card levels">
        {nivaer.map((n) => (
          <div className="level" key={n.namn}>
            <div className="level-head">
              <strong>{n.namn}</strong>
              <span>{formatSek(n.brutto)} i bruttointäkt</span>
            </div>
            <div className="stacked-bar" role="img" aria-label={`Fördelning av ${formatSek(n.brutto)}`}>
              {n.segment.map((x) => (
                <div
                  key={x.namn}
                  className={`bar-seg ${x.klass}`}
                  style={{ width: `${(x.varde / n.brutto) * 100}%` }}
                  title={`${x.namn}: ${formatSek(x.varde)} (${formatPercent(x.varde / n.brutto)})`}
                />
              ))}
            </div>
            <div className="level-foot">{n.text}</div>
          </div>
        ))}
        <ul className="bar-legend inline">
          {legend.map((l) => (
            <li key={l.namn}>
              <span className={`legend-dot ${l.klass}`} />
              {l.namn}
            </li>
          ))}
        </ul>
      </div>

      {person && (
        <ScenarioTabell
          params={params}
          waterfall={waterfall}
          uppskjutet={person.deferredFee}
          andel={person.andel}
          finansiering={finansiering}
          rubrik={crewVy ? "Vad får du vid olika intäkter?" : "Vad får en enskild person?"}
          kolumnTotal={crewVy ? "Du får totalt" : "Personen får totalt"}
          ovanfor={
            !crewVy ? (
              <label className="person-pick">
                Se som
                <select value={personKey} onChange={(e) => setPersonKey(e.target.value)}>
                  {team.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.namn} ({m.roller || "—"})
                    </option>
                  ))}
                </select>
              </label>
            ) : undefined
          }
        />
      )}

      <details className="utrakning">
        <summary>Visa hela uträkningen</summary>
        <div className="card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  {nivaer.map((n) => (
                    <th key={n.namn}>{n.namn}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Bruttointäkt", WATERFALL_TOOLTIP.bruttointakt, (r: ModelResult) => r.bruttointakt],
                    [
                      `Distributionsavgift (${formatPercent(params.distributionsavgift)})`,
                      WATERFALL_TOOLTIP.distributionsavgift,
                      (r: ModelResult) => r.distributionsavgift,
                    ],
                    ...(mg > 0
                      ? [["Minimigaranti återvinns", WATERFALL_TOOLTIP.mgAtervinning, (r: ModelResult) => r.mgAtervinning] as const]
                      : []),
                    ["Kvar efter distributören", WATERFALL_TOOLTIP.nettoEfterDistribution, (r: ModelResult) => r.nettoEfterMg],
                    ["Återbetalning till finansiärer", WATERFALL_TOOLTIP.finansiarsRecoupment, (r: ModelResult) => r.recoupment],
                    ["Kvar efter återbetalning", WATERFALL_TOOLTIP.nettoEfterFinansiar, (r: ModelResult) => r.nettoEfterRecoupment],
                    ["Uppskjutna arvoden och egeninsats", WATERFALL_TOOLTIP.deferredFeePool, (r: ModelResult) => r.deferredBetalt],
                    ["Vinst att dela", WATERFALL_TOOLTIP.nettoEfterDeferred, (r: ModelResult) => r.nettoEfterDeferred],
                    [`Teamets andel (${formatPercent(1 - wf.finansiarsAndel)})`, WATERFALL_TOOLTIP.crewPool, (r: ModelResult) => r.crewPool],
                    ...(wf.finansiarsAndel > 0
                      ? [[`Finansiärernas andel (${formatPercent(wf.finansiarsAndel)})`, WATERFALL_TOOLTIP.finansiarspool, (r: ModelResult) => r.finansiarspool] as const]
                      : []),
                  ] as const
                ).map(([etikett, tooltip, varde]) => (
                  <tr key={etikett}>
                    <td>
                      {etikett}
                      <Tooltip text={tooltip} />
                    </td>
                    {nivaer.map((n) => (
                      <td key={n.namn}>{formatSek(varde(n.r))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="wf-footnote">
            Break-even (allt återbetalt) vid {formatSek(wf.breakEven)} i bruttointäkt. Vinsten delas
            bland {antalPersoner} personer efter ägarenheter.
          </div>
        </div>
      </details>
    </>
  );
}
