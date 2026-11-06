import { addMonths, differenceInCalendarDays, differenceInMonths, getDaysInMonth, parseISO } from "date-fns";
import { assertNonNegative } from "./assert";
import { DEFAULTS } from "./rules";

/** Abaixo disto a perda observada não é fiável e usa-se a taxa inicial. */
export const MIN_OWNERSHIP_YEARS = 1 / 12;

/**
 * Anos entre duas datas yyyy-mm-dd, contados por meses de calendário
 * para que aniversários exatos deem números inteiros (2 anos = 2, não 1,998).
 */
export function yearsBetween(from: string, to: string): number {
  const start = parseISO(from);
  const end = parseISO(to);
  if (end < start) {
    throw new RangeError(`A data ${to} é anterior a ${from}`);
  }
  const months = differenceInMonths(end, start);
  const anchor = addMonths(start, months);
  const leftoverDays = differenceInCalendarDays(end, anchor);
  return (months + leftoverDays / getDaysInMonth(anchor)) / 12;
}

export interface DepreciationInput {
  /** Pelo menos um de `purchasePriceCents` e `currentValueCents` tem de existir. */
  purchasePriceCents?: number;
  currentValueCents?: number;
  /** Ausente quando não se sabe a data de compra. */
  ownershipYears?: number;
  /** Taxa usada quando falta informação. Por defeito 12 % ao ano. */
  defaultRatePct?: number;
}

/**
 * - `linear`: (compra − atual) / anos, com os dois valores e pelo menos 1 mês de posse.
 * - `compound`: só compra e anos; o valor atual estima-se com a taxa composta.
 * - `rate`: falta a data, ou há menos de 1 mês; taxa sobre o valor conhecido.
 */
export type DepreciationMethod = "linear" | "compound" | "rate";

export interface DepreciationResult {
  annualCents: number;
  currentValueCents: number;
  estimated: boolean;
  method: DepreciationMethod;
  ratePct: number;
  /** Valor sobre o qual se aplicou a taxa (método `rate`). */
  baseCents: number;
}

export function annualDepreciation(input: DepreciationInput): DepreciationResult {
  const { purchasePriceCents, currentValueCents, ownershipYears } = input;
  const ratePct = input.defaultRatePct ?? DEFAULTS.depreciationRatePct;
  assertNonNegative({ purchasePriceCents, currentValueCents, ownershipYears, ratePct });

  const knownYears = ownershipYears !== undefined && ownershipYears >= MIN_OWNERSHIP_YEARS ? ownershipYears : undefined;

  if (purchasePriceCents !== undefined && currentValueCents !== undefined && knownYears !== undefined) {
    return {
      annualCents: (purchasePriceCents - currentValueCents) / knownYears,
      currentValueCents,
      estimated: false,
      method: "linear",
      ratePct,
      baseCents: purchasePriceCents,
    };
  }

  if (purchasePriceCents !== undefined && currentValueCents === undefined && knownYears !== undefined) {
    const estimatedValue = projectValue(purchasePriceCents, ratePct / 100, knownYears);
    return {
      annualCents: (purchasePriceCents - estimatedValue) / knownYears,
      currentValueCents: estimatedValue,
      estimated: true,
      method: "compound",
      ratePct,
      baseCents: purchasePriceCents,
    };
  }

  const baseCents = currentValueCents ?? purchasePriceCents;
  if (baseCents === undefined) {
    throw new RangeError("Falta o preço de compra ou o valor atual");
  }
  return {
    annualCents: (baseCents * ratePct) / 100,
    currentValueCents: currentValueCents ?? baseCents,
    estimated: true,
    method: "rate",
    ratePct,
    baseCents,
  };
}

/** Taxa composta de perda anual para projeções: r = 1 − (atual / compra)^(1/anos). */
export function compoundRate(purchasePriceCents: number, currentValueCents: number, years: number): number {
  if (purchasePriceCents <= 0 || years <= 0) {
    throw new RangeError("O preço de compra e os anos têm de ser maiores que zero");
  }
  assertNonNegative({ currentValueCents });
  return 1 - Math.pow(currentValueCents / purchasePriceCents, 1 / years);
}

/** Valor daqui a `years` anos com perda composta `rate` (0,12 = 12 %). */
export function projectValue(valueCents: number, rate: number, years: number): number {
  return valueCents * Math.pow(1 - rate, years);
}
