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

export const LOCK_TOOLTIP: Record<"lock1" | "lock2" | "lock3", string> = {
  lock1:
    "Lock 1, Green Light: strax innan inspelning. Ägarenheter från utveckling och förproduktion fastställs och kan inte ändras i efterhand.",
  lock2:
    "Lock 2, Wrap: sista inspelningsdagen. Ägarenheter från inspelningen fastställs.",
  lock3:
    "Lock 3, Leverans: vid godkänd leverans eller signerat distributionsavtal. Registret blir slutgiltigt och alla får ett skriftligt utdrag.",
};

export const WATERFALL_TOOLTIP: Record<string, string> = {
  bruttointakt:
    "Alla intäkter filmen genererar — försäljning av visningsrätter, streamingavtal, festivalpriser, biljettintäkter från festivalvisningar, med mera. Innan några avdrag.",
  distributionsavgift:
    "Avgiften en distributör tar för att sälja och marknadsföra filmen. Varierar med affärens storlek, vanligtvis 20–30% av bruttointäkten.",
  nettoEfterDistribution: "Vad som återstår när distributören fått sin avgift.",
  finansiarsRecoupment:
    "Återbetalning av finansiärernas insatser — inklusive kontantinsatsen — med avtalad multiplikator. Betalas proportionellt mot varandra, före uppskjutna arvoden.",
  nettoEfterFinansiar:
    "Vad som återstår när externa finansiärer fått tillbaka sitt kapital plus avkastning.",
  deferredFeePool:
    "De arvoden teamet skjutit upp under produktionen, plus övrig egeninsats i budgeten, betalas tillbaka här — innan någon vinst delas ut.",
  nettoEfterDeferred:
    "Filmens faktiska nettovinst — det som finns kvar att dela mellan team och investerare.",
  crewPool:
    "Teamets del av nettovinsten, fördelad efter ägarenheter. Utan samproducent går hela nettot till teamet.",
  finansiarspool:
    "Finansiärernas del av nettot. Samproducentens och kontantinsatsens andel motsvarar deras del av totalbudgeten, plus en eventuell fast andel för distributören som angetts i kalkylbladet. Stöd tar ingen andel.",
  stod:
    "Stöd som inte betalas tillbaka ur filmens intäkter, t.ex. produktionsstöd från Filminstitutet eller kommunalt stöd. Bidrar först till att täcka budgetens kontantbehov och sedan till att betala arvoden direkt.",
  samproducent:
    "Samproducenter, t.ex. regionala filmfonder, som går in med pengar mot att få tillbaka dem (med multiplikator) och en andel av nettovinsten i proportion till sin del av filmens totala kostnad.",
  mg:
    "Minimigaranti från en distributör: ett förskott som betalas ut före inspelning. Distributören behåller intäkterna tills förskottet är återvunnet.",
  mgAtervinning:
    "Distributören behåller intäkter efter sin avgift tills minimigarantin (gånger multiplikatorn) är återvunnen.",
  kontant:
    "Pengar som läggs in i produktionen. Räknas som vilken annan finansiär som helst: återbetalas med samproducentens villkor och tar del av nettot i proportion till sin del av filmens totala kostnad.",
  totalKostnad:
    "Filmens hela kostnad enligt budgeten: det som betalas kontant under produktionen plus det som skjuts upp (egeninsats). Finansiärernas andel av nettot räknas mot den här summan, inte bara mot de uppskjutna arvodena.",
  taeckerBehov:
    "Budgetens kontantbehov, de hårda pengar som måste finnas innan inspelning. Alla finansiärer, inklusive kontantinsatsen, bidrar till att täcka det.",
  betalarArvoden:
    "Finansiering utöver kontantbehovet används till att betala arvoden direkt. Det minskar de uppskjutna arvodena som ska återbetalas senare.",
  breakEven:
    "Bruttointäkten där alla återbetalningar och uppskjutna arvoden är täckta. Över den nivån börjar ägarandelarna ge pengar.",
};
