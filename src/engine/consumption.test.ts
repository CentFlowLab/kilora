import { describe, expect, it } from "vitest";
import { averageConsumption, consumptionSegments, costPer100, isAnomalous } from "./consumption";

describe("consumptionSegments", () => {
  it("exemplo da secção 13: cheio aos 10 000 km e cheio aos 10 500 km com 30 L dá 6,0 L/100 km", () => {
    const segments = consumptionSegments([
      { odometer: 10_000, quantity: 40, fullTank: true },
      { odometer: 10_500, quantity: 30, fullTank: true },
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0].per100).toBe(6);
  });

  it("um parcial entre os dois soma litros e muda o resultado", () => {
    const segments = consumptionSegments([
      { odometer: 10_000, quantity: 40, fullTank: true },
      { odometer: 10_200, quantity: 10, fullTank: false },
      { odometer: 10_500, quantity: 30, fullTank: true },
    ]);
    expect(segments[0].quantity).toBe(40);
    expect(segments[0].per100).toBe(8);
  });

  it("sem nenhum enchimento cheio não há consumo", () => {
    expect(
      consumptionSegments([
        { odometer: 10_000, quantity: 20, fullTank: false },
        { odometer: 10_300, quantity: 15, fullTank: false },
      ]),
    ).toEqual([]);
  });

  it("o primeiro cheio só serve de partida e os parciais antes dele não contam", () => {
    expect(consumptionSegments([{ odometer: 10_000, quantity: 40, fullTank: true }])).toEqual([]);
    const segments = consumptionSegments([
      { odometer: 9_800, quantity: 25, fullTank: false },
      { odometer: 10_000, quantity: 40, fullTank: true },
      { odometer: 10_500, quantity: 30, fullTank: true },
    ]);
    expect(segments[0].per100).toBe(6);
  });

  it("recusa quilómetros menores que os do registo anterior", () => {
    expect(() =>
      consumptionSegments([
        { odometer: 10_500, quantity: 30, fullTank: true },
        { odometer: 10_000, quantity: 30, fullTank: true },
      ]),
    ).toThrow(/menores que os do registo anterior/);
  });

  it("recusa quantidades zero ou negativas", () => {
    expect(() => consumptionSegments([{ odometer: 10_000, quantity: 0, fullTank: true }])).toThrow(RangeError);
  });
});

describe("averageConsumption", () => {
  const segments = consumptionSegments([
    { odometer: 0, quantity: 40, fullTank: true },
    { odometer: 500, quantity: 30, fullTank: true },
    { odometer: 1_000, quantity: 35, fullTank: true },
    { odometer: 1_500, quantity: 40, fullTank: true },
    { odometer: 2_500, quantity: 70, fullTank: true },
  ]);

  it("pondera pelos km dos últimos N enchimentos", () => {
    expect(averageConsumption(segments, 3)).toBeCloseTo((35 + 40 + 70) / 2_000 * 100, 10);
    expect(averageConsumption(segments)).toBeCloseTo((30 + 35 + 40 + 70) / 2_500 * 100, 10);
  });

  it("sem segmentos devolve null", () => {
    expect(averageConsumption([])).toBeNull();
  });
});

describe("custo e anomalias", () => {
  it("custo por 100 km a 6 L e 1,75 €/L é 10,50 €", () => {
    expect(costPer100(6, 175)).toBe(1_050);
  });

  it("assinala valores que se afastam mais de 40 % da média", () => {
    expect(isAnomalous(8.5, 6)).toBe(true);
    expect(isAnomalous(3.5, 6)).toBe(true);
    expect(isAnomalous(8.4, 6)).toBe(false);
    expect(isAnomalous(8.41, 6)).toBe(true);
    expect(isAnomalous(7, 6, 10)).toBe(true);
  });
});
