export const SCENARIO_LABELS: Record<"A" | "B" | "C", string> = {
  A: "Festivalpremie",
  B: "Streamingaffär",
  C: "Stor försäljning",
};

export const GRUPP_HEADER_TOOLTIP =
  "Gruppen avgör inte vem som är viktigast — den speglar hur unikt ersättbart ansvaret är i just den här produktionen.";

export const GRUPP_TOOLTIP: Record<string, string> = {
  A: "Nyckelkreativ — unikt konstnärligt eller kreativt ansvar som inte kan delegeras. Multiplikator 1,5×.",
  B: "Avdelningsansvarig — leder en avdelning med eget budget- och personalansvar. Multiplikator 1,2×.",
  C: "Crew — gör produktionen möjlig i praktiken. Gäller även statister och enstaka replikroller. Multiplikator 1,0×.",
};

export const WATERFALL_TOOLTIP: Record<string, string> = {
  bruttointakt:
    "Alla intäkter filmen genererar — försäljning av visningsrätter, streamingavtal, festivalpriser, biljettintäkter från festivalvisningar, med mera. Innan några avdrag.",
  distributionsavgift:
    "Avgiften en distributör tar för att sälja och marknadsföra filmen. Varierar med affärens storlek, vanligtvis 20–30% av bruttointäkten.",
  nettoEfterDistribution: "Vad som återstår när distributören fått sin avgift.",
  finansiarsRecoupment:
    "Återbetalning av er kontantinsats (med premie) och samproducenters investering (med avtalad multiplikator). Betalas proportionellt mot varandra, före uppskjutna arvoden.",
  nettoEfterFinansiar:
    "Vad som återstår när externa finansiärer fått tillbaka sitt kapital plus avkastning.",
  deferredFeePool:
    "De arvoden teamet skjutit upp under produktionen betalas tillbaka här — innan någon vinst delas ut.",
  nettoEfterDeferred:
    "Filmens faktiska nettovinst — det som finns kvar att dela mellan team och investerare.",
  crewPool:
    "Teamets del av nettovinsten, fördelad efter ägarenheter. Utan samproducent går hela nettot till teamet.",
  finansiarspool:
    "Samproducentens del av nettot motsvarar dess andel av totalbudgeten, plus eventuella fasta andelar för stöd eller distributör som angetts i kalkylbladet.",
  stod:
    "Stöd som inte betalas tillbaka ur filmens intäkter, t.ex. produktionsstöd från Filminstitutet eller kommunalt stöd. Minskar först er kontantinsats och sedan behovet av att skjuta upp arvoden.",
  samproducent:
    "Samproducent eller regional filmfond som går in med pengar mot att få tillbaka dem (med multiplikator) och en andel av nettovinsten i proportion till sin del av budgeten.",
  mg:
    "Minimigaranti från en distributör: ett förskott som betalas ut före inspelning. Distributören behåller intäkterna tills förskottet är återvunnet.",
  mgAtervinning:
    "Distributören behåller intäkter efter sin avgift tills minimigarantin (gånger multiplikatorn) är återvunnen.",
  ersatterKontant:
    "Finansieringen används först till att minska de hårda pengar producent och regissör annars måste gå in med.",
  betalarArvoden:
    "Finansiering utöver kontantbehovet används till att betala arvoden direkt. Det minskar de uppskjutna arvodena som ska återbetalas senare.",
  breakEven:
    "Bruttointäkten där alla återbetalningar och uppskjutna arvoden är täckta. Över den nivån börjar ägarandelarna ge pengar.",
};
