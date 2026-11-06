import { describe, expect, it } from "vitest";
import type { Vehicle } from "@/db/schemas";
import { annualCost } from "./cost";
import { costByCategory, explainCost, fixedVariableShare, vehicleCost, vehicleCostInput } from "./vehicle-cost";

const vehicle: Vehicle = {
  id: "0b6f2c1e-6a3d-4c8e-9f41-2d7a5b9c3e10",
  nickname: "O meu carro",
  fuel: "gasolina",
  purchaseDate: "2024-11-05",
  purchasePriceCents: 1_200_000,
  currentValueCents: 900_000,
  kmPerYear: 12_000,
  consumptionPer100: 6,
  energyPriceCents: 175,
  insuranceYearCents: 48_000,
  iucYearCents: 6_000,
  maintenanceYearCents: 40_000,
  tyreSetCents: 32_000,
  tyreLifeKm: 40_000,
  createdAt: "2026-11-05T10:00:00.000Z",
};

describe("vehicleCost", () => {
  it("conta os anos de posse até hoje e passa os campos tal como estão", () => {
    const input = vehicleCostInput(vehicle, { asOf: "2026-11-05" });
    expect(input.ownershipYears).toBe(2);
    expect(input.asOf).toBe("2026-11-05");
    expect(input).not.toHaveProperty("inspectionPriceCents");
  });

  it("dá o exemplo da secção 5 sem a inspeção (3 796 €/ano)", () => {
    const { result } = vehicleCost(vehicle, { asOf: "2026-11-05" });
    expect(result.totalYear).toBe(381_100 - 1_500);
    expect(result.missing).toEqual(["inspection"]);
  });

  it("um carro vendido congela na data de venda e usa o preço de venda", () => {
    const sold = { ...vehicle, soldDate: "2025-11-05", soldPriceCents: 1_000_000 };
    const input = vehicleCostInput(sold, { asOf: "2026-11-05" });
    expect(input.ownershipYears).toBe(1);
    expect(input.currentValueCents).toBe(1_000_000);
  });

  it("sem data de compra não conta anos de posse", () => {
    const withoutDate = { ...vehicle, purchaseDate: undefined };
    expect(vehicleCostInput(withoutDate, { asOf: "2026-11-05" }).ownershipYears).toBeUndefined();
  });

  it("um crédito acabado não entra no custo atual", () => {
    const financed: Vehicle = {
      ...vehicle,
      financing: { principalCents: 1_000_000, annualRatePct: 6, months: 24, startDate: "2020-01-01" },
    };
    expect(vehicleCost(financed, { asOf: "2026-11-05" }).result.fixed.interest).toBe(0);
  });
});

describe("costByCategory", () => {
  it("as 6 categorias somam o total", () => {
    const result = annualCost(vehicleCostInput(vehicle, { asOf: "2026-11-05" }));
    const categories = costByCategory(result);
    expect(Object.keys(categories)).toHaveLength(6);
    expect(Object.values(categories).reduce((a, b) => a + b, 0)).toBeCloseTo(result.totalYear, 6);
    expect(categories.maintenance).toBe(40_000 + 9_600);
  });
});

describe("fixedVariableShare", () => {
  it("dá o peso dos fixos e dos variáveis no total", () => {
    const result = annualCost(vehicleCostInput(vehicle, { asOf: "2026-11-05" }));
    const share = fixedVariableShare(result);
    expect(share.fixedPct + share.variablePct).toBeCloseTo(100, 10);
    expect(share.fixedPct).toBeCloseTo((204_000 / 379_600) * 100, 10);
  });
});

describe("explainCost", () => {
  it("mostra os valores usados e acaba nos números do painel", () => {
    const { input, result } = vehicleCost(vehicle, { asOf: "2026-11-05" });
    const steps = explainCost(input, result);
    expect(steps[0]).toEqual({ id: "depreciation-linear", purchase: 1_200_000, current: 900_000, years: 2, result: 150_000 });
    expect(steps.find((s) => s.id === "energy")).toEqual({ id: "energy", km: 12_000, consumption: 6, price: 175, result: 126_000 });
    expect(steps.find((s) => s.id === "total-month")?.result).toBe(result.totalMonth);
    expect(steps.find((s) => s.id === "per-km")?.result).toBe(result.perKm);
  });

  it("não mostra linhas de categorias em falta", () => {
    const withoutMaintenance = { ...vehicle, maintenanceYearCents: undefined };
    const { input, result } = vehicleCost(withoutMaintenance, { asOf: "2026-11-05" });
    expect(explainCost(input, result).some((s) => s.id === "maintenance")).toBe(false);
  });
});
