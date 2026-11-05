import { describe, expect, it } from "vitest";
import { annualCost, type CostInput } from "./cost";
import { annualInterest, monthlyPayment } from "./credit";

/** Exemplo para testes da secção 5 da especificação. Valores em cêntimos. */
const SPEC_EXAMPLE: CostInput = {
  purchasePriceCents: 1_200_000,
  currentValueCents: 900_000,
  ownershipYears: 2,
  insuranceYearCents: 48_000,
  iucYearCents: 6_000,
  inspectionPriceCents: 3_000,
  inspectionIntervalYears: 2,
  kmPerYear: 12_000,
  consumptionPer100: 6,
  energyPriceCents: 175,
  maintenanceYearCents: 40_000,
  tyreSetCents: 32_000,
  tyreLifeKm: 40_000,
};

const euros = (cents: number) => Math.round(cents) / 100;

describe("annualCost: exemplo da secção 5", () => {
  const result = annualCost(SPEC_EXAMPLE);

  it("dá 317,58 € por mês e 0,3176 € por km", () => {
    expect(euros(result.totalMonth)).toBe(317.58);
    expect(Number((result.perKm! / 100).toFixed(4))).toBe(0.3176);
  });

  it("confere cada linha da tabela de resultados", () => {
    expect(result.fixed.depreciation).toBe(150_000);
    expect(result.fixed.inspection).toBe(1_500);
    expect(result.fixedYear).toBe(205_500);
    expect(result.variable.energy).toBe(126_000);
    expect(result.variable.tyres).toBe(9_600);
    expect(result.variableYear).toBe(175_600);
    expect(result.totalYear).toBe(381_100);
  });

  it("não marca nada como estimado quando todos os valores foram dados", () => {
    expect(result.estimated).toEqual([]);
  });
});

describe("annualCost: crédito", () => {
  const financing = { principalCents: 1_000_000, annualRatePct: 6, months: 60 };
  const withoutCredit = annualCost(SPEC_EXAMPLE);
  const withCredit = annualCost({ ...SPEC_EXAMPLE, financing });
  const difference = withCredit.totalYear - withoutCredit.totalYear;

  it("soma só os juros anuais", () => {
    expect(withCredit.fixed.interest).toBeCloseTo(annualInterest(financing), 6);
    expect(difference).toBeCloseTo(annualInterest(financing), 6);
  });

  it("nunca soma a prestação inteira", () => {
    const yearOfPayments = monthlyPayment(financing) * 12;
    expect(difference).toBeLessThan(yearOfPayments);
    expect(withCredit.totalYear).not.toBeCloseTo(withoutCredit.totalYear + yearOfPayments, 0);
  });

  it("com taxa zero não acrescenta nada", () => {
    const zeroRate = annualCost({ ...SPEC_EXAMPLE, financing: { ...financing, annualRatePct: 0 } });
    expect(zeroRate.totalYear).toBe(withoutCredit.totalYear);
  });
});

describe("annualCost: casos extremos", () => {
  it("com zero km por ano mostra só €/mês, sem €/km", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, kmPerYear: 0 });
    expect(result.perKm).toBeNull();
    expect(result.variablePerKm).toBeNull();
    expect(result.variable.energy).toBe(0);
    expect(result.variable.tyres).toBe(0);
    expect(result.totalMonth).toBeGreaterThan(0);
  });

  it("carro com menos de 1 mês não divide por zero e marca a depreciação como estimada", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, ownershipYears: 0 });
    expect(Number.isFinite(result.fixed.depreciation)).toBe(true);
    expect(result.fixed.depreciation).toBe(144_000);
    expect(result.estimated).toContain("depreciation");
  });

  it("sem valor atual usa 12 % ao ano, marcado como estimado", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, currentValueCents: undefined });
    expect(result.estimated).toContain("depreciation");
    expect(result.fixed.depreciation).toBeCloseTo((1_200_000 - 1_200_000 * 0.88 ** 2) / 2, 6);
  });

  it("sem vida dos pneus usa 40 000 km, marcado como estimado", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, tyreLifeKm: undefined });
    expect(result.variable.tyres).toBe(9_600);
    expect(result.estimated).toContain("tyreLife");
  });

  it("manutenção e pneus em branco contam 0 € e ficam assinalados como em falta", () => {
    expect(annualCost(SPEC_EXAMPLE).missing).toEqual([]);
    const result = annualCost({ ...SPEC_EXAMPLE, maintenanceYearCents: undefined, tyreSetCents: undefined });
    expect(result.variable.maintenance).toBe(0);
    expect(result.variable.tyres).toBe(0);
    expect(result.missing).toEqual(["maintenance", "tyres"]);
  });

  it("manutenção escrita como 0 € é um valor dado, não está em falta", () => {
    expect(annualCost({ ...SPEC_EXAMPLE, maintenanceYearCents: 0 }).missing).toEqual([]);
  });

  it("um carro que valorizou dá depreciação negativa, sem a esconder", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, currentValueCents: 1_300_000 });
    expect(result.fixed.depreciation).toBe(-50_000);
    expect(result.estimated).not.toContain("depreciation");
  });

  it("recusa valores negativos", () => {
    expect(() => annualCost({ ...SPEC_EXAMPLE, insuranceYearCents: -1 })).toThrow(RangeError);
    expect(() => annualCost({ ...SPEC_EXAMPLE, kmPerYear: -100 })).toThrow(RangeError);
  });

  it("recusa preço de inspeção sem intervalo", () => {
    expect(() => annualCost({ ...SPEC_EXAMPLE, inspectionIntervalYears: undefined })).toThrow(RangeError);
  });
});

describe("annualCost: opções", () => {
  it("o custo de oportunidade, quando ligado, soma valor atual × taxa", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, opportunityCost: { enabled: true, ratePct: 3 } });
    expect(result.fixed.opportunity).toBe(27_000);
    expect(annualCost({ ...SPEC_EXAMPLE, opportunityCost: { enabled: false, ratePct: 3 } }).fixed.opportunity).toBe(0);
  });

  it("garagem mensal e portagens mensais entram como fixos e variáveis", () => {
    const result = annualCost({ ...SPEC_EXAMPLE, parkingMonthCents: 5_000, tollsMonthCents: 2_000 });
    expect(result.fixed.other).toBe(60_000);
    expect(result.variable.tolls).toBe(24_000);
  });

  it("híbrido plug-in mistura as duas energias pela percentagem elétrica", () => {
    const result = annualCost({
      ...SPEC_EXAMPLE,
      electricMode: { sharePct: 50, consumptionPer100: 16, energyPriceCents: 20 },
    });
    const fuel = 126_000;
    const electric = (12_000 * 16 * 20) / 100;
    expect(result.variable.energy).toBe(fuel / 2 + electric / 2);
  });
});
