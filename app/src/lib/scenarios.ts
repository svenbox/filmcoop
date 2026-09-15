export const SCENARIO_LABELS: Record<"A" | "B" | "C", string> = {
  A: "Festivalpremie",
  B: "Streamingaffär",
  C: "Stor försäljning",
};

export const KLASS_TOOLTIP: Record<string, string> = {
  A: "Nyckelkreativ funktion — 1,5× multiplikator på grundpoängen",
  B: "Avdelningsansvarig — 1,2× multiplikator",
  C: "Operativt bidrag — 1,0× multiplikator",
};

export const WATERFALL_TOOLTIP: Record<string, string> = {
  bruttointakt:
    "Alla intäkter filmen genererar — försäljning av visningsrätter, streamingavtal, festivalpriser, biljettintäkter från festivalvisningar, med mera. Innan några avdrag.",
  distributionsavgift:
    "Avgiften en distributör tar för att sälja och marknadsföra filmen. Varierar med affärens storlek, vanligtvis 20–30% av bruttointäkten.",
  nettoEfterDistribution: "Vad som återstår när distributören fått sin avgift.",
  finansiarsRecoupment:
    "Återbetalning av externa finansiärers investerade kapital, plus den avkastning som avtalats.",
  nettoEfterFinansiar:
    "Vad som återstår när externa finansiärer fått tillbaka sitt kapital plus avkastning.",
  deferredFeePool:
    "De arvoden teamet skjutit upp under produktionen betalas tillbaka här — innan någon vinst delas ut.",
  nettoEfterDeferred:
    "Filmens faktiska nettovinst — det som finns kvar att dela mellan team och investerare.",
  crewPool: "Hälften av nettovinsten, fördelad mellan crew efter ägarenheter.",
  finansiarspool: "Den andra hälften av nettovinsten, till externa equity-investerare.",
};
