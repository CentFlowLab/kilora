import { assertNonNegative } from "./assert";

export interface Financing {
  principalCents: number;
  annualRatePct: number;
  months: number;
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
