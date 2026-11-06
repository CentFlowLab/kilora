import type { Fuel } from "@/db/schemas";
import type { ExplainStep } from "@/engine/vehicle-cost";
import { t } from "@/i18n";
import { formatEuros, formatNumber, formatPerKm, formatUnitPrice } from "@/lib/format";

/** Escreve uma linha do "como é calculado?". Só formata valores que o motor já calculou. */
export function explainLine(step: ExplainStep, fuel: Fuel): string {
  const euros = (cents: number) => formatEuros(cents);
  const years = (value: number) => formatNumber(value, value % 1 === 0 ? 0 : 1);
  const key = `explain.steps.${step.id}` as const;

  switch (step.id) {
    case "depreciation-linear":
      return t(key, { purchase: euros(step.purchase), current: euros(step.current), years: years(step.years), result: euros(step.result) });
    case "depreciation-compound":
      return t(key, {
        purchase: euros(step.purchase),
        current: euros(step.current),
        rate: formatNumber(step.ratePct, 1),
        years: years(step.years),
        result: euros(step.result),
      });
    case "depreciation-rate":
      return t(key, { base: euros(step.base), rate: formatNumber(step.ratePct, 1), result: euros(step.result) });
    case "interest":
      return t(key, { total: euros(step.total), months: step.months, result: euros(step.result) });
    case "other-fixed":
      return t(key, { parkingMonth: euros(step.parkingMonth), result: euros(step.result) });
    case "opportunity":
      return t(key, { rate: formatNumber(step.ratePct, 1), value: euros(step.value), result: euros(step.result) });
    case "energy":
      return t(key, {
        km: formatNumber(step.km),
        consumption: formatNumber(step.consumption, 1),
        unit: fuel === "eletrico" ? t("units.kwh") : t("units.litre"),
        price: formatUnitPrice(step.price),
        result: euros(step.result),
      });
    case "tyres":
      return t(key, { km: formatNumber(step.km), set: euros(step.set), lifeKm: formatNumber(step.lifeKm), result: euros(step.result) });
    case "tolls":
      return t(key, { month: euros(step.month), result: euros(step.result) });
    case "total-year":
      return t(key, { fixed: euros(step.fixed), variable: euros(step.variable), result: euros(step.result) });
    case "total-month":
      return t(key, { year: euros(step.year), result: euros(step.result) });
    case "per-km":
      return t(key, { year: euros(step.year), km: formatNumber(step.km), result: formatPerKm(step.result, true) });
    case "insurance":
    case "iuc":
    case "maintenance":
    case "fixed-total":
    case "variable-total":
      return t(key, { result: euros(step.result) });
  }
}
