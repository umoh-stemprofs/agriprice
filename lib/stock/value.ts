/**
 * Estimated Market Value (docs/00-global.md §3, "EMV").
 * EMV(item) = qtyKg x latest price per kg, in integer kobo. Pure functions so
 * the maths is tested once and every screen uses the same numbers.
 */

export function stockValueKobo(qtyKg: number, priceKobo: number): number {
  return Math.round(qtyKg * priceKobo);
}

export interface StockValueRow {
  qtyKg: number;
  priceKobo: number;
}

export function totalStockValueKobo(rows: readonly StockValueRow[]): number {
  return rows.reduce((sum, row) => sum + stockValueKobo(row.qtyKg, row.priceKobo), 0);
}

export function totalQtyKg(rows: readonly { qtyKg: number }[]): number {
  return rows.reduce((sum, row) => sum + row.qtyKg, 0);
}
