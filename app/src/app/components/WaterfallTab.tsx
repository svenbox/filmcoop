"use client";

import { useState } from "react";
import type { ModelParams, WaterfallData } from "@/lib/sheets";
import type { TeamSummary } from "@/lib/team";
import { formatPercent, formatSek } from "@/lib/format";
import { WATERFALL_TOOLTIP } from "@/lib/scenarios";
import { computeWaterfall, type ModelResult } from "@/lib/waterfallModel";
import { Tooltip } from "./Tooltip";

const BRUTTO_STEP = 25_000;
const FIN_STEP = 25_000;

const PRESETS: { key: "A" | "B" | "C"; label: string }[] = [
  { key: "A", label: "Litet utfall" },
  { key: "B", label: "Mellanstort utfall" },
  { key: "C", label: "Stort utfall" },
];

function roundUp(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

interface Marker {
  value: number;
  label: string;
}

interface SliderProps {
  label: string;
  hint?: string;
  tooltip: string;
  value: number;
  max: number;
  step: number;
  markers?: Marker[];
  onChange: (v: number) => void;
}

function MoneySlider({ label, hint, tooltip, value, max, step, markers, onChange }: SliderProps) {
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
        {markers
          ?.filter((m) => m.value > 0 && m.value <= max)
          .map((m) => (
            <span
              key={m.label}
              className="slider-marker"
              style={{ left: `${(m.value / max) * 100}%` }}
              title={`${m.label}: ${formatSek(m.value)}`}
            >
              <span className="slider-marker-label">{m.label}</span>
            </span>
          ))}
      </div>
      <div className="range-ends">
        <span>0 kr</span>
        <span>{formatSek(max)}</span>
      </div>
    </div>
  );
}

/** En mening på vanlig svenska om vad som händer vid vald intäkt. */
function utfallSomText(wf: ModelResult, brutto: number): string {
  if (brutto <= 0) return "Dra i reglaget för att se vad som händer vid olika intäkter.";

  const avDistributor = -wf.distributionsavgift - wf.mgAtervinning;
  const delar: string[] = [];
  if (avDistributor > 0) delar.push(`${formatSek(avDistributor)} till distributören`);
  if (-wf.recoupment > 0) delar.push(`${formatSek(-wf.recoupment)} tillbaka till finansiärerna`);

  const inledning = `Vid ${formatSek(brutto)} i bruttointäkt`;
  const forst =
    delar.length > 0 ? `${inledning} går ${delar.join(" och ")}.` : `${inledning}:`;

  if (wf.skuldAndelBetald < 0.9999) {
    return (
      `${forst} De uppskjutna arvodena och övrig egeninsats betalas till ` +
      `${formatPercent(wf.skuldAndelBetald)}, och teamet får ingen vinstandel än. ` +
      `Det krävs ${formatSek(wf.breakEven)} för att allt ska vara betalt.`
    );
  }

  return (
    `${forst} Alla uppskjutna arvoden och övrig egeninsats är betalda. ` +
    `Det som blir över, ${formatSek(wf.nettoEfterDeferred)}, delas mellan teamet ` +
    `(${formatSek(wf.crewPool)}) och finansiärerna (${formatSek(wf.finansiarspool)}).`
  );
}

interface Props {
  params: ModelParams;
  waterfall: WaterfallData;
  /** Producentvyn: alla personer, för väljaren "Se som". */
  team?: TeamSummary[];
  antalPersoner: number;
  /**
   * Crewvyn: den inloggades egen del. När den anges visas inga kostnads- eller
   * finansieringsdetaljer (ramverket §9: crew ser utbetalningsordningen men inte
   * den fullständiga budgeten).
   */
  self?: { deferredFee: number; andel: number };
}

export function WaterfallTab({ params, waterfall, team = [], antalPersoner, self }: Props) {
  const crewVy = self !== undefined;
  const [brutto, setBrutto] = useState<number>(1_000_000);
  const [stod, setStod] = useState<number>(params.stod.belopp);
  const [samproducent, setSamproducent] = useState<number>(params.samproducent.belopp);
  const [mg, setMg] = useState<number>(params.distributor.belopp);
  const [kontant, setKontant] = useState<number>(params.kontantinsats);
  const [personKey, setPersonKey] = useState<string>(team[0]?.key ?? "");

  const wf = computeWaterfall(params, brutto, { stod, samproducent, mg, kontant });
  const presetVarden = PRESETS.map((p) => ({ ...p, value: waterfall[p.key].bruttointakt })).filter(
    (p) => p.value > 0
  );
  const budgetMax = roundUp(Math.max(params.totalBudget, 500_000), FIN_STEP);
  const bruttoMax = roundUp(
    Math.max(2_000_000, wf.breakEven * 2, ...presetVarden.map((p) => p.value)),
    250_000
  );

  const harFinansiarer = wf.finansiarerSkyldigt + wf.mgSkyldigt > 0;
  const vald = team.find((m) => m.key === personKey) ?? null;
  const person = self ?? (vald ? { deferredFee: vald.deferredFee, andel: vald.andel } : null);
  const personUppskjutet = person ? person.deferredFee * wf.skuldAndelBetald : 0;
  const personVinst = person ? person.andel * wf.crewPool : 0;

  const stapel = [
    { namn: "Distributören", varde: -wf.distributionsavgift - wf.mgAtervinning, klass: "seg-distributor" },
    { namn: "Tillbaka till finansiärerna", varde: -wf.recoupment, klass: "seg-finansiar" },
    { namn: "Uppskjutna arvoden och egeninsats", varde: -wf.deferredBetalt, klass: "seg-skuld" },
    { namn: "Vinst till teamet", varde: wf.crewPool, klass: "seg-team" },
    { namn: "Vinst till finansiärerna", varde: wf.finansiarspool, klass: "seg-finvinst" },
  ].filter((s) => s.varde > 0);

  return (
    <>
      <div className="card milestones">
        <div className="section-header">Så går pengarna — i vilken ordning</div>
        <p className="section-intro">
          Det här gäller oavsett hur mycket filmen drar in. Intäkten betalas ut uppifrån och ned,
          och först när ett steg är klart går pengarna vidare till nästa. Beloppen anger
          bruttointäkt, alltså allt filmen tar in innan några avdrag.
        </p>
        <ol className="milestone-list">
          <li>
            <strong>Distributören tar sin avgift</strong>
            <span>
              {formatPercent(params.distributionsavgift)} av varje intäkt
              {wf.mgSkyldigt > 0 &&
                `, och återvinner först sin minimigaranti (${formatSek(wf.mgSkyldigt)})`}
              .
            </span>
          </li>
          <li>
            <strong>Finansiärerna får tillbaka sin insats</strong>
            <span>
              {harFinansiarer
                ? `${formatSek(wf.finansiarerSkyldigt)} med avtalad återbetalning. Klart vid ${formatSek(wf.finansiarerAterbetaldaVid)} i bruttointäkt.`
                : "Ingen finansiering med återbetalning är inlagd."}
            </span>
          </li>
          <li>
            <strong>Uppskjutna arvoden och övrig egeninsats betalas</strong>
            <span>
              {formatSek(wf.kvarDeferredPool)} ska betalas ur intäkterna. Klart vid{" "}
              {formatSek(wf.breakEven)} i bruttointäkt (break-even).
            </span>
          </li>
          <li>
            <strong>Därefter delas vinsten</strong>
            <span>
              Teamet får {formatPercent(1 - wf.finansiarsAndel)} efter ägarenheter
              {wf.finansiarsAndel > 0
                ? ` och finansiärerna ${formatPercent(wf.finansiarsAndel)}`
                : ""}
              . Före break-even får teamet ingen vinstandel.
            </span>
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
          hint={`Budgetens kontantbehov: ${formatSek(params.kontantinsats)}`}
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

      <div className="section-header">Utforska: vad händer vid olika intäkter?</div>
      {presetVarden.length > 0 && (
        <div className="preset-row pill-bar">
          {presetVarden.map((p) => (
            <button
              key={p.key}
              className={`pill ${brutto === p.value ? "primary" : ""}`}
              onClick={() => setBrutto(p.value)}
            >
              {p.label} · {formatSek(p.value)}
            </button>
          ))}
        </div>
      )}
      <MoneySlider
        label="Bruttointäkt"
        hint="Allt filmen tar in från försäljning, visningar och stöd som ska betalas tillbaka, innan några avdrag."
        tooltip={WATERFALL_TOOLTIP.bruttointakt}
        value={brutto}
        max={bruttoMax}
        step={BRUTTO_STEP}
        markers={[
          ...(harFinansiarer
            ? [{ value: wf.finansiarerAterbetaldaVid, label: "Finansiärer klara" }]
            : []),
          { value: wf.breakEven, label: "Break-even" },
        ]}
        onChange={setBrutto}
      />

      <div className="card outcome">
        <p className="outcome-text">{utfallSomText(wf, brutto)}</p>

        {brutto > 0 && stapel.length > 0 && (
          <>
            <div className="stacked-bar" role="img" aria-label="Fördelning av bruttointäkten">
              {stapel.map((s) => (
                <div
                  key={s.namn}
                  className={`bar-seg ${s.klass}`}
                  style={{ width: `${(s.varde / brutto) * 100}%` }}
                  title={`${s.namn}: ${formatSek(s.varde)}`}
                />
              ))}
            </div>
            <ul className="bar-legend">
              {stapel.map((s) => (
                <li key={s.namn}>
                  <span className={`legend-dot ${s.klass}`} />
                  {s.namn}
                  <span className="legend-value">
                    {formatSek(s.varde)} ({formatPercent(s.varde / brutto)})
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {person && (
        <div className="card">
          <div className="section-header">
            {crewVy ? "Vad får du?" : "Vad får en enskild person?"}
          </div>
          {!crewVy && (
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
          )}
          <div className="wf-row">
            <span>
              Uppskjutet arvode som betalas
              <Tooltip text="Personens uppskjutna arvode betalas i samma ordning som alla andras: de får samma andel av sitt arvode betald som hela poolen. Vid för låg intäkt betalas bara en del." />
            </span>
            <span className="wf-value">
              {formatSek(personUppskjutet)} av {formatSek(person.deferredFee)}
            </span>
          </div>
          <div className="wf-row">
            <span>
              Andel av vinsten ({formatPercent(person.andel)} av teamets del)
              <Tooltip text="Personens ägarenheter delat med alla ägarenheter. Vinsten delas först när alla uppskjutna arvoden är betalda." />
            </span>
            <span className="wf-value">{formatSek(personVinst)}</span>
          </div>
          <div className="wf-row total">
            <span>
              {crewVy ? "Totalt för dig" : "Totalt"} vid {formatSek(brutto)} i bruttointäkt
            </span>
            <span className="wf-value">{formatSek(personUppskjutet + personVinst)}</span>
          </div>
          <div className="wf-footnote">
            {crewVy
              ? "Kontantinsats du eventuellt satt in ingår inte."
              : "Kontantinsats som personen eventuellt satt in ingår inte."}
          </div>
        </div>
      )}

      <details className="utrakning">
        <summary>Visa hela uträkningen</summary>
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
                Distributörens minimigaranti återvinns
                <Tooltip text={WATERFALL_TOOLTIP.mgAtervinning} />
              </span>
              <span className="wf-value">{formatSek(wf.mgAtervinning)}</span>
            </div>
          )}
          <div className="wf-row">
            <span>
              Kvar efter distributören
              <Tooltip text={WATERFALL_TOOLTIP.nettoEfterDistribution} />
            </span>
            <span className="wf-value">{formatSek(wf.nettoEfterMg)}</span>
          </div>
          <div className="wf-row">
            <span>
              Återbetalning till finansiärer
              <Tooltip text={WATERFALL_TOOLTIP.finansiarsRecoupment} />
            </span>
            <span className="wf-value">{formatSek(wf.recoupment)}</span>
          </div>
          {wf.recoupmentKontant > 0 && (
            <div className="wf-footnote">varav kontantinsats: {formatSek(wf.recoupmentKontant)}</div>
          )}
          {wf.recoupmentSamproducent > 0 && (
            <div className="wf-footnote">
              varav samproducenter: {formatSek(wf.recoupmentSamproducent)}
            </div>
          )}
          {wf.recoupmentStod > 0 && (
            <div className="wf-footnote">varav stöd: {formatSek(wf.recoupmentStod)}</div>
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
              Uppskjutna arvoden och egeninsats
              <Tooltip text={WATERFALL_TOOLTIP.deferredFeePool} />
            </span>
            <span className="wf-value">{formatSek(wf.deferredBetalt)}</span>
          </div>
          <div className="wf-row">
            <span>
              Vinst att dela
              <Tooltip text={WATERFALL_TOOLTIP.nettoEfterDeferred} />
            </span>
            <span className="wf-value">{formatSek(wf.nettoEfterDeferred)}</span>
          </div>
          <div className="wf-row total">
            <span>
              Teamets andel ({formatPercent(1 - wf.finansiarsAndel)})
              <Tooltip text={WATERFALL_TOOLTIP.crewPool} />
            </span>
            <span className="wf-value">{formatSek(wf.crewPool)}</span>
          </div>
          <div className="wf-footnote">
            ← fördelas bland {antalPersoner} personer efter ägarenheter
          </div>
          {wf.finansiarsAndel > 0 && (
            <div className="wf-row total">
              <span>
                Finansiärernas andel ({formatPercent(wf.finansiarsAndel)})
                <Tooltip text={WATERFALL_TOOLTIP.finansiarspool} />
              </span>
              <span className="wf-value">{formatSek(wf.finansiarspool)}</span>
            </div>
          )}
          {wf.finansiarspoolKontant > 0 && (
            <div className="wf-footnote">
              varav kontantinsats: {formatSek(wf.finansiarspoolKontant)}
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
      </details>
    </>
  );
}
