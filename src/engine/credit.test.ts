import { describe, expect, it } from "vitest";
import { annualInterest, monthlyPayment, totalInterest } from "./credit";

describe("crédito", () => {
  // 10 000 € a 6 % em 60 meses: prestação de 193,33 € e 1 599,68 € de juros
  // (valores de referência de qualquer calculadora de amortização francesa).
  const loan = { principalCents: 1_000_000, annualRatePct: 6, months: 60 };

  it("calcula a prestação mensal", () => {
    expect(Math.round(monthlyPayment(loan))).toBe(19_333);
  });

  it("calcula os juros totais e por ano", () => {
    expect(Math.round(totalInterest(loan))).toBe(159_968);
    expect(annualInterest(loan)).toBeCloseTo(totalInterest(loan) / 5, 6);
  });

  it("com taxa zero a prestação é o capital a dividir pelas prestações e não há juros", () => {
    const zero = { principalCents: 1_200_000, annualRatePct: 0, months: 48 };
    expect(monthlyPayment(zero)).toBe(25_000);
    expect(totalInterest(zero)).toBe(0);
    expect(annualInterest(zero)).toBe(0);
  });

  it("recusa número de prestações inválido e valores negativos", () => {
    expect(() => monthlyPayment({ ...loan, months: 0 })).toThrow(RangeError);
    expect(() => monthlyPayment({ ...loan, months: 12.5 })).toThrow(RangeError);
    expect(() => monthlyPayment({ ...loan, annualRatePct: -1 })).toThrow(RangeError);
  });
});
