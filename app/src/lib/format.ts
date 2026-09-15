export function formatSek(n: number): string {
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

export function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + "%";
}
