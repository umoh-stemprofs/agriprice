import { describe, expect, it } from "vitest";
import { stockValueKobo, totalQtyKg, totalStockValueKobo } from "./value";

/**
 * Estimated Market Value (docs/00-global.md §3): qtyKg x latest price per kg,
 * in integer kobo. ₦1 = 100 kobo, so 1,200 kg of maize at ₦600/kg is ₦720,000
 * = 72,000,000 kobo.
 */

describe("stock value", () => {
  it("multiplies kg by the price in kobo", () => {
    expect(stockValueKobo(1200, 60000)).toBe(72_000_000);
    expect(stockValueKobo(500, 90000)).toBe(45_000_000);
  });

  it("rounds to whole kobo when the price has a fraction", () => {
    expect(stockValueKobo(3, 100.4)).toBe(301);
    expect(stockValueKobo(3, 100.5)).toBe(302);
    expect(Number.isInteger(stockValueKobo(7, 1234.567))).toBe(true);
  });

  it("is 0 kobo when there is no stock", () => {
    expect(stockValueKobo(0, 60000)).toBe(0);
    expect(totalStockValueKobo([])).toBe(0);
  });

  it("adds the crops up, and never mixes kobo with naira", () => {
    const rows = [
      { qtyKg: 1200, priceKobo: 60000 }, // ₦720,000
      { qtyKg: 600, priceKobo: 35000 }, // ₦210,000
      { qtyKg: 350, priceKobo: 70000 }, // ₦245,000
    ];

    expect(totalStockValueKobo(rows)).toBe(117_500_000); // ₦1,175,000
    expect(totalQtyKg(rows)).toBe(2150);
  });
});
