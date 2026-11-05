import { exceeds } from "./assert";
import { KM_THRESHOLDS, TIP_THRESHOLDS } from "./rules";

export type TipId = "compare-insurance" | "check-tyre-pressure" | "low-km" | "high-km";

export interface TipInput {
  insuranceYearCents: number;
  fixedYearCents: number;
  kmPerYear: number;
  /** Média dos últimos 3 enchimentos. */
  recentConsumptionPer100?: number | null;
  /** Média de todos os enchimentos. */
  averageConsumptionPer100?: number | null;
}

export const MAX_TIPS = 3;

/** Regras fixas da secção F2.1. Devolve no máximo 3 dicas, pela ordem da especificação. */
export function tips(input: TipInput): TipId[] {
  const result: TipId[] = [];

  if (
    input.fixedYearCents > 0 &&
    exceeds(input.insuranceYearCents / input.fixedYearCents, TIP_THRESHOLDS.insuranceShareOfFixedPct / 100)
  ) {
    result.push("compare-insurance");
  }

  const recent = input.recentConsumptionPer100;
  const average = input.averageConsumptionPer100;
  if (recent && average && exceeds((recent - average) / average, TIP_THRESHOLDS.consumptionRisePct / 100)) {
    result.push("check-tyre-pressure");
  }

  if (input.kmPerYear < KM_THRESHOLDS.lowPerYear) result.push("low-km");
  if (input.kmPerYear > KM_THRESHOLDS.highPerYear) result.push("high-km");

  return result.slice(0, MAX_TIPS);
}
