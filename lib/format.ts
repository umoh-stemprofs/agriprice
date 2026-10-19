/**
 * Display formatting. Money stays integer kobo everywhere and becomes naira
 * only here, at the edge (docs/00-global.md §2).
 */

export function formatNaira(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

export function formatKg(qtyKg: number): string {
  return `${qtyKg.toLocaleString("en-NG")} kg`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}
