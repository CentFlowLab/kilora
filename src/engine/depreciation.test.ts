import { describe, expect, it } from "vitest";
import { annualDepreciation, compoundRate, projectValue, yearsBetween } from "./depreciation";

describe("yearsBetween", () => {
  it("dá anos inteiros nos aniversários, incluindo anos bissextos", () => {
    expect(yearsBetween("2024-11-05", "2026-11-05")).toBe(2);
    expect(yearsBetween("2024-02-29", "2025-02-28")).toBe(1);
  });

  it("conta frações de mês", () => {
    expect(yearsBetween("2026-01-01", "2026-01-16")).toBeCloseTo(15 / 31 / 12, 10);
  });

  it("recusa datas ao contrário", () => {
    expect(() => yearsBetween("2026-11-05", "2026-01-01")).toThrow(RangeError);
  });
});

describe("annualDepreciation", () => {
  it("é linear com valor atual conhecido", () => {
    const result = annualDepreciation({ purchasePriceCents: 1_200_000, currentValueCents: 900_000, ownershipYears: 2 });
    expect(result).toEqual({ annualCents: 150_000, currentValueCents: 900_000, estimated: false });
  });

  it("com menos de 1 mês de posse usa a taxa inicial sobre o preço de compra", () => {
    const result = annualDepreciation({ purchasePriceCents: 1_200_000, currentValueCents: 1_190_000, ownershipYears: 0.02 });
    expect(result.annualCents).toBe(144_000);
    expect(result.estimated).toBe(true);
  });

  it("aceita outra taxa inicial", () => {
    const result = annualDepreciation({ purchasePriceCents: 1_000_000, ownershipYears: 0, defaultRatePct: 10 });
    expect(result.annualCents).toBe(100_000);
  });
});

describe("projeção composta", () => {
  it("calcula a taxa a partir de dois valores e volta a dar o valor atual", () => {
    const rate = compoundRate(1_200_000, 900_000, 2);
    expect(rate).toBeCloseTo(1 - Math.sqrt(0.75), 10);
    expect(projectValue(1_200_000, rate, 2)).toBeCloseTo(900_000, 6);
  });

  it("recusa preço ou anos a zero", () => {
    expect(() => compoundRate(0, 900_000, 2)).toThrow(RangeError);
    expect(() => compoundRate(1_200_000, 900_000, 0)).toThrow(RangeError);
  });
});
