import type { Vehicle } from "@/db/schemas";
import { totalInterest } from "./credit";
import { annualCost, type CostInput, type CostResult } from "./cost";
import { yearsBetween } from "./depreciation";

export interface VehicleCostOptions {
  /** Hoje, em yyyy-mm-dd. Um carro vendido usa a data de venda. */
  asOf: string;
  opportunityCost?: { enabled: boolean; ratePct: number };
}

/** Passa um carro guardado para a entrada do motor. Sem contas além das datas. */
export function vehicleCostInput(vehicle: Vehicle, options: VehicleCostOptions): CostInput {
  const asOf = vehicle.soldDate ?? options.asOf;
  const ownershipYears = vehicle.purchaseDate
    ? vehicle.purchaseDate > asOf
      ? 0
      : yearsBetween(vehicle.purchaseDate, asOf)
    : undefined;

  return {
    kmPerYear: vehicle.kmPerYear,
    consumptionPer100: vehicle.consumptionPer100,
    energyPriceCents: vehicle.energyPriceCents,
    purchasePriceCents: vehicle.purchasePriceCents,
    currentValueCents: vehicle.soldDate ? (vehicle.soldPriceCents ?? vehicle.currentValueCents) : vehicle.currentValueCents,
    ownershipYears,
    insuranceYearCents: vehicle.insuranceYearCents,
    iucYearCents: vehicle.iucYearCents,
    financing: vehicle.financing,
    asOf,
    parkingMonthCents: vehicle.parkingMonthCents,
    tollsMonthCents: vehicle.tollsMonthCents,
    maintenanceYearCents: vehicle.maintenanceYearCents,
    tyreSetCents: vehicle.tyreSetCents,
    tyreLifeKm: vehicle.tyreLifeKm,
    opportunityCost: options.opportunityCost,
  };
}

export function vehicleCost(vehicle: Vehicle, options: VehicleCostOptions): { input: CostInput; result: CostResult } {
  const input = vehicleCostInput(vehicle, options);
  return { input, result: annualCost(input) };
}

export const COST_CATEGORIES = ["depreciation", "insurance", "energy", "maintenance", "taxes", "other"] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

/** As 6 categorias do gráfico circular (secção F2), em cêntimos por ano. */
export function costByCategory(result: CostResult): Record<CostCategory, number> {
  const { fixed, variable } = result;
  return {
    depreciation: fixed.depreciation,
    insurance: fixed.insurance,
    energy: variable.energy,
    maintenance: variable.maintenance + variable.tyres,
    taxes: fixed.iuc,
    other: fixed.inspection + fixed.interest + fixed.other + fixed.opportunity + variable.tolls,
  };
}

/** Peso dos fixos e dos variáveis no total, em percentagem, para a barra do painel. */
export function fixedVariableShare(result: CostResult): { fixedPct: number; variablePct: number } {
  const fixed = Math.max(result.fixedYear, 0);
  const variable = Math.max(result.variableYear, 0);
  const total = fixed + variable;
  if (total === 0) return { fixedPct: 0, variablePct: 0 };
  return { fixedPct: (fixed / total) * 100, variablePct: (variable / total) * 100 };
}

/** Valores usados em cada linha do "como é calculado?". O texto da fórmula vem das traduções. */
export type ExplainStep =
  | { id: "depreciation-linear"; purchase: number; current: number; years: number; result: number }
  | { id: "depreciation-compound"; purchase: number; ratePct: number; years: number; current: number; result: number }
  | { id: "depreciation-rate"; base: number; ratePct: number; result: number }
  | { id: "insurance"; result: number }
  | { id: "iuc"; result: number }
  | { id: "interest"; total: number; months: number; result: number }
  | { id: "other-fixed"; parkingMonth: number; result: number }
  | { id: "opportunity"; value: number; ratePct: number; result: number }
  | { id: "energy"; km: number; consumption: number; price: number; result: number }
  | { id: "maintenance"; result: number }
  | { id: "tyres"; km: number; set: number; lifeKm: number; result: number }
  | { id: "tolls"; month: number; result: number }
  | { id: "fixed-total"; result: number }
  | { id: "variable-total"; result: number }
  | { id: "total-year"; fixed: number; variable: number; result: number }
  | { id: "total-month"; year: number; result: number }
  | { id: "per-km"; year: number; km: number; result: number };

export function explainCost(input: CostInput, result: CostResult): ExplainStep[] {
  const { fixed, variable, depreciation } = result;
  const steps: ExplainStep[] = [];

  if (depreciation.method === "linear") {
    steps.push({
      id: "depreciation-linear",
      purchase: input.purchasePriceCents!,
      current: depreciation.currentValueCents,
      years: input.ownershipYears!,
      result: fixed.depreciation,
    });
  } else if (depreciation.method === "compound") {
    steps.push({
      id: "depreciation-compound",
      purchase: depreciation.baseCents,
      ratePct: depreciation.ratePct,
      years: input.ownershipYears!,
      current: depreciation.currentValueCents,
      result: fixed.depreciation,
    });
  } else {
    steps.push({ id: "depreciation-rate", base: depreciation.baseCents, ratePct: depreciation.ratePct, result: fixed.depreciation });
  }

  steps.push({ id: "insurance", result: fixed.insurance });
  if (input.iucYearCents !== undefined) steps.push({ id: "iuc", result: fixed.iuc });
  if (input.financing) {
    steps.push({ id: "interest", total: totalInterest(input.financing), months: input.financing.months, result: fixed.interest });
  }
  if (fixed.other > 0) steps.push({ id: "other-fixed", parkingMonth: input.parkingMonthCents ?? 0, result: fixed.other });
  if (fixed.opportunity > 0) {
    steps.push({ id: "opportunity", value: depreciation.currentValueCents, ratePct: input.opportunityCost!.ratePct, result: fixed.opportunity });
  }
  steps.push({ id: "fixed-total", result: result.fixedYear });

  steps.push({
    id: "energy",
    km: input.kmPerYear,
    consumption: input.consumptionPer100,
    price: input.energyPriceCents,
    result: variable.energy,
  });
  if (input.maintenanceYearCents !== undefined) steps.push({ id: "maintenance", result: variable.maintenance });
  if (input.tyreSetCents !== undefined) {
    steps.push({ id: "tyres", km: input.kmPerYear, set: input.tyreSetCents, lifeKm: result.tyreLifeKm, result: variable.tyres });
  }
  if (variable.tolls > 0) steps.push({ id: "tolls", month: input.tollsMonthCents ?? 0, result: variable.tolls });
  steps.push({ id: "variable-total", result: result.variableYear });

  steps.push({ id: "total-year", fixed: result.fixedYear, variable: result.variableYear, result: result.totalYear });
  steps.push({ id: "total-month", year: result.totalYear, result: result.totalMonth });
  if (result.perKm !== null) steps.push({ id: "per-km", year: result.totalYear, km: input.kmPerYear, result: result.perKm });

  return steps;
}
