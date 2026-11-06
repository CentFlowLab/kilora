import { describe, expect, it } from "vitest";
import { annualInterest, instalmentsInLast12Months, interestInLast12Months, monthlyPayment, totalInterest } from "./credit";

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

  describe("juros dos últimos 12 meses", () => {
    const dated = { ...loan, startDate: "2024-01-15" };

    it("um crédito já acabado dá 0", () => {
      expect(instalmentsInLast12Months(dated, "2030-06-01")).toBe(0);
      expect(interestInLast12Months(dated, "2030-06-01")).toBe(0);
    });

    it("um crédito ativo o ano inteiro dá os juros anuais", () => {
      expect(instalmentsInLast12Months(dated, "2026-06-01")).toBe(12);
      expect(interestInLast12Months(dated, "2026-06-01")).toBeCloseTo(annualInterest(loan), 6);
    });

    it("um crédito que começou há 3 meses conta só 3 prestações", () => {
      expect(instalmentsInLast12Months(dated, "2024-03-20")).toBe(3);
      expect(interestInLast12Months(dated, "2024-03-20")).toBeCloseTo((totalInterest(loan) / 60) * 3, 6);
    });

    it("um crédito que acaba a meio da janela conta só as prestações que faltavam", () => {
      // 60 prestações a partir de 2024-01-15: a última é a 2028-12-15.
      // Entre 2028-04-01 e 2029-04-01 caem as de abril a dezembro de 2028.
      expect(instalmentsInLast12Months(dated, "2029-04-01")).toBe(9);
    });

    it("um crédito que ainda não começou dá 0", () => {
      expect(interestInLast12Months(dated, "2023-12-31")).toBe(0);
    });

    it("sem data de início conta um ano inteiro, como antes", () => {
      expect(interestInLast12Months(loan, "2030-06-01")).toBeCloseTo(annualInterest(loan), 6);
    });
  });

  it("recusa número de prestações inválido e valores negativos", () => {
    expect(() => monthlyPayment({ ...loan, months: 0 })).toThrow(RangeError);
    expect(() => monthlyPayment({ ...loan, months: 12.5 })).toThrow(RangeError);
    expect(() => monthlyPayment({ ...loan, annualRatePct: -1 })).toThrow(RangeError);
  });
});
