import { describe, expect, it } from "vitest";
import { tips } from "./tips";

const base = { insuranceYearCents: 48_000, fixedYearCents: 205_500, kmPerYear: 12_000 };

describe("tips (regras F2.1)", () => {
  it("o exemplo da secção 5 não gera dicas", () => {
    expect(tips(base)).toEqual([]);
  });

  it("seguro acima de 30 % dos fixos sugere comparar seguros", () => {
    expect(tips({ ...base, insuranceYearCents: 70_000, fixedYearCents: 200_000 })).toEqual(["compare-insurance"]);
    expect(tips({ ...base, insuranceYearCents: 60_000, fixedYearCents: 200_000 })).toEqual([]);
  });

  it("consumo recente mais de 10 % acima da média sugere ver a pressão dos pneus", () => {
    expect(tips({ ...base, recentConsumptionPer100: 6.7, averageConsumptionPer100: 6 })).toEqual(["check-tyre-pressure"]);
    expect(tips({ ...base, recentConsumptionPer100: 6.6, averageConsumptionPer100: 6 })).toEqual([]);
    expect(tips({ ...base, recentConsumptionPer100: null, averageConsumptionPer100: 6 })).toEqual([]);
  });

  it("avisa com menos de 5 000 ou mais de 25 000 km por ano", () => {
    expect(tips({ ...base, kmPerYear: 4_000 })).toEqual(["low-km"]);
    expect(tips({ ...base, kmPerYear: 30_000 })).toEqual(["high-km"]);
    expect(tips({ ...base, kmPerYear: 5_000 })).toEqual([]);
  });

  it("devolve as dicas pela ordem da especificação, no máximo 3", () => {
    const result = tips({
      insuranceYearCents: 90_000,
      fixedYearCents: 200_000,
      kmPerYear: 3_000,
      recentConsumptionPer100: 8,
      averageConsumptionPer100: 6,
    });
    expect(result).toEqual(["compare-insurance", "check-tyre-pressure", "low-km"]);
  });
});
