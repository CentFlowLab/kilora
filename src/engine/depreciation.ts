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
  purchasePriceCents: number;
  currentValueCents?: number;
  ownershipYears: number;
  /** Taxa usada quando não há valor atual. Por defeito 12 % ao ano. */
  defaultRatePct?: number;
}

export interface DepreciationResult {
  annualCents: number;
  currentValueCents: number;
  estimated: boolean;
}

/** Depreciação linear do passado: (compra − atual) / anos de posse. */
export function annualDepreciation(input: DepreciationInput): DepreciationResult {
  const { purchasePriceCents, currentValueCents, ownershipYears } = input;
  const ratePct = input.defaultRatePct ?? DEFAULTS.depreciationRatePct;
  assertNonNegative({ purchasePriceCents, ownershipYears, ratePct });

  if (ownershipYears < MIN_OWNERSHIP_YEARS) {
    const annualCents = (purchasePriceCents * ratePct) / 100;
    return {
      annualCents,
      currentValueCents: currentValueCents ?? purchasePriceCents,
      estimated: true,
    };
  }

  if (currentValueCents === undefined) {
    const estimatedValue = projectValue(purchasePriceCents, ratePct / 100, ownershipYears);
    return {
      annualCents: (purchasePriceCents - estimatedValue) / ownershipYears,
      currentValueCents: estimatedValue,
      estimated: true,
    };
  }

  assertNonNegative({ currentValueCents });
  return {
    annualCents: (purchasePriceCents - currentValueCents) / ownershipYears,
    currentValueCents,
    estimated: false,
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