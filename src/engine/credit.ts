import { addMonths, parseISO, subMonths } from "date-fns";
import { assertNonNegative } from "./assert";

export interface Financing {
  principalCents: number;
  annualRatePct: number;
  months: number;
  /** Data da primeira prestação. Sem ela, contam-se os juros de um ano inteiro de crédito. */
  startDate?: string;
}

/** PMT = P·i / (1 − (1+i)^−n), com i a taxa mensal. Taxa zero dá P / n. */
export function monthlyPayment({ principalCents, annualRatePct, months }: Financing): number {
  assertNonNegative({ principalCents, annualRatePct });
  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError(`Número de prestações inválido: ${months}`);
  }
  const i = annualRatePct / 100 / 12;
  if (i === 0) return principalCents / months;
  return (principalCents * i) / (1 - Math.pow(1 + i, -months));
}

/** Juros totais = PMT × n − P. */
export function totalInterest(financing: Financing): number {
  return monthlyPayment(financing) * financing.months - financing.principalCents;
}

/**
 * Juros por ano (J na secção 5). É isto que entra no custo do carro, nunca a prestação:
 * o capital já está contado na depreciação.
 */
export function annualInterest(financing: Financing): number {
  return totalInterest(financing) / (financing.months / 12);
}

/** Quantas prestações caem nos 12 meses que acabam em `asOf` (inclusive). */
export function instalmentsInLast12Months(financing: Financing & { startDate: string }, asOf: string): number {
  const end = parseISO(asOf);
  const windowStart = subMonths(end, 12);
  const start = parseISO(financing.startDate);
  let count = 0;
  for (let k = 0; k < financing.months; k++) {
    const due = addMonths(start, k);
    if (due > end) break;
    if (due > windowStart) count++;
  }
  return count;
}

/**
 * Juros que entram no custo atual: juros médios por prestação × prestações dos últimos 12 meses.
 * Um crédito ativo o ano inteiro dá o mesmo que `annualInterest`; um crédito acabado dá 0.
 */
export function interestInLast12Months(financing: Financing, asOf?: string): number {
  if (!financing.startDate || !asOf) return annualInterest(financing);
  const perInstalment = totalInterest(financing) / financing.months;
  return perInstalment * instalmentsInLast12Months({ ...financing, startDate: financing.startDate }, asOf);
}
