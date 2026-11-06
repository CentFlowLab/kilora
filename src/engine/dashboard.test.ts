import { describe, expect, it } from "vitest";
import type { Vehicle } from "@/db/schemas";
import { dashboardSummary } from "./dashboard";

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

describe("dashboardSummary", () => {
  it("mostra só as categorias acima de 0 e as percentagens somam 100", () => {
    const summary = dashboardSummary(vehicle, { asOf: "2026-11-05" });
    expect(summary.categories.map((slice) => slice.category)).toEqual([
      "depreciation",
      "insurance",
      "energy",
      "maintenance",
      "taxes",
    ]);
    const total = summary.categories.reduce((sum, slice) => sum + slice.pct, 0);
    expect(total).toBeCloseTo(100, 9);
    expect(summary.categories.find((slice) => slice.category === "maintenance")?.yearCents).toBe(40_000 + 9_600);
  });

  it("um carro que valorizou não entra no gráfico com depreciação negativa", () => {
    const summary = dashboardSummary({ ...vehicle, currentValueCents: 1_300_000 }, { asOf: "2026-11-05" });
    expect(summary.result.appreciated).toBe(true);
    expect(summary.categories.some((slice) => slice.category === "depreciation")).toBe(false);
  });

  it("dá as dicas pelas regras fixas", () => {
    expect(dashboardSummary({ ...vehicle, kmPerYear: 4_000 }, { asOf: "2026-11-05" }).tips).toContain("low-km");
    expect(dashboardSummary(vehicle, { asOf: "2026-11-05" }).tips).toEqual([]);
  });
});
