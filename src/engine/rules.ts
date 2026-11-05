/**
 * Valores iniciais e limiares da secção 5 da especificação.
 * As regras legais (inspeção por idade, mês do IUC) entram na Etapa 5,
 * depois de confirmadas nas fontes oficiais (IMT e Portal das Finanças).
 */

export const RULES_VERSION = "2026-11-05";

export const DEFAULTS = {
  tyreLifeKm: 40_000,
  depreciationRatePct: 12,
  opportunityCostRatePct: 3,
  consumptionAnomalyPct: 40,
} as const;

export const KM_THRESHOLDS = {
  lowPerYear: 5_000,
  highPerYear: 25_000,
} as const;

export const TIP_THRESHOLDS = {
  insuranceShareOfFixedPct: 30,
  consumptionRisePct: 10,
} as const;
