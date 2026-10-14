import type { ModelParams } from "@/lib/sheets";
import { formatPercent, formatSek } from "@/lib/format";
import { Tooltip } from "./Tooltip";

/** Filmens ekonomi i korthet: total kostnad och hur den är finansierad. */
export function EkonomiKort({ params }: { params: ModelParams }) {
  const skjutsUpp = params.deferredPool + params.ovrigEgeninsats;
  const finansiering = [
    { namn: "Kontantinsats", belopp: params.kontantinsats },
    { namn: "Samproducenter", belopp: params.samproducent.belopp },
    { namn: "Stöd", belopp: params.stod.belopp },
    { namn: "Distributör (minimigaranti)", belopp: params.distributor.belopp },
  ].filter((f) => f.belopp > 0);
  const totaltFinansierat = finansiering.reduce((sum, f) => sum + f.belopp, 0);
  const saknas = Math.max(0, params.kontantBehov - totaltFinansierat);
  const overskott = Math.max(0, totaltFinansierat - params.kontantBehov);

  if (params.totalBudget <= 0) return null;

  return (
    <div className="card">
      <div className="section-header">Filmens ekonomi</div>
      <div className="wf-row total">
        <span>
          Total kostnad
          <Tooltip text="Filmens hela budget: det som betalas med pengar under produktionen plus det som skjuts upp (egeninsats), alltså arbete som betalas först när filmen drar in pengar." />
        </span>
        <span className="wf-value">{formatSek(params.totalBudget)}</span>
      </div>
      <div className="wf-row">
        <span>Betalas kontant under produktionen</span>
        <span className="wf-value">{formatSek(params.kontantBehov)}</span>
      </div>
      <div className="wf-row">
        <span>
          Skjuts upp och betalas ur intäkterna
          <Tooltip text="Uppskjutna arvoden och övrig egeninsats. De betalas tillbaka före någon vinst delas ut." />
        </span>
        <span className="wf-value">
          {formatSek(skjutsUpp)} ({formatPercent(skjutsUpp / params.totalBudget)})
        </span>
      </div>

      <div className="section-header sub">Finansiering av kontantbudgeten</div>
      {finansiering.length === 0 ? (
        <p className="muted">Ingen finansiering är registrerad än.</p>
      ) : (
        finansiering.map((f) => (
          <div className="wf-row" key={f.namn}>
            <span>{f.namn}</span>
            <span className="wf-value">{formatSek(f.belopp)}</span>
          </div>
        ))
      )}
      <div className="wf-row total">
        <span>Status</span>
        <span className="wf-value">
          {saknas > 0
            ? `Saknas ${formatSek(saknas)}`
            : overskott > 0
              ? `Fullt finansierad, ${formatSek(overskott)} över`
              : "Fullt finansierad"}
        </span>
      </div>
      <div className="wf-footnote">
        Kontantbudgeten är de kostnader som måste betalas med pengar under produktionen. Resten av
        budgeten är arbete som betalas först ur filmens intäkter.
      </div>
    </div>
  );
}
