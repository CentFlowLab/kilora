import type { Vehicle } from "@/db/schemas";
import type { CostInput, CostResult } from "./cost";
import { tips, type TipId } from "./tips";
import {
  COST_CATEGORIES,
  costByCategory,
  explainCost,
  fixedVariableShare,
  vehicleCost,
  type CostCategory,
  type ExplainStep,
  type VehicleCostOptions,
} from "./vehicle-cost";

export interface CategorySlice {
  category: CostCategory;
  yearCents: number;
  /** Percentagem do total das fatias positivas. */
  pct: number;
}

export interface DashboardSummary {
  input: CostInput;
  result: CostResult;
  /** Só as categorias acima de 0, pela ordem fixa da secção F2. */
  categories: CategorySlice[];
  share: { fixedPct: number; variablePct: number };
  tips: TipId[];
  explain: ExplainStep[];
}

export interface DashboardOptions extends VehicleCostOptions {
  recentConsumptionPer100?: number | null;
  averageConsumptionPer100?: number | null;
}

/** Tudo o que o painel mostra, já calculado. O ecrã só formata. */
export function dashboardSummary(vehicle: Vehicle, options: DashboardOptions): DashboardSummary {
  const { input, result } = vehicleCost(vehicle, options);
  const byCategory = costByCategory(result);
  const positive = COST_CATEGORIES.filter((category) => byCategory[category] > 0);
  const positiveTotal = positive.reduce((sum, category) => sum + byCategory[category], 0);

  return {
    input,
    result,
    categories: positive.map((category) => ({
      category,
      yearCents: byCategory[category],
      pct: (byCategory[category] / positiveTotal) * 100,
    })),
    share: fixedVariableShare(result),
    tips: tips({
      insuranceYearCents: result.fixed.insurance,
      fixedYearCents: result.fixedYear,
      kmPerYear: input.kmPerYear,
      recentConsumptionPer100: options.recentConsumptionPer100,
      averageConsumptionPer100: options.averageConsumptionPer100,
    }),
    explain: explainCost(input, result),
  };
}
