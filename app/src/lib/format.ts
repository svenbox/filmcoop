export function formatSek(n: number): string {
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

export function formatPercent(n: number): string {
  return (
    (n * 100).toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
    "\u00A0%"
  );
}

export function formatUnits(n: number): string {
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
}
