import { assertNonNegative } from "./assert";
import { interestInLast12Months, type Financing } from "./credit";
import { annualDepreciation, type DepreciationResult } from "./depreciation";
import { DEFAULTS } from "./rules";

export interface CostInput {
  kmPerYear: number;
  /** L/100 km ou kWh/100 km. Num híbrido plug-in, o consumo do modo a combustível. */
  consumptionPer100: number;
  /** Preço por L ou kWh. */
  energyPriceCents: number;
  /** Só híbridos plug-in: parte dos km feitos em modo elétrico. */
  electricMode?: { sharePct: number; consumptionPer100: number; energyPriceCents: number };

  /** Pelo menos um de `purchasePriceCents` e `currentValueCents`. */
  purchasePriceCents?: number;
  currentValueCents?: number;
  /** Ausente quando não se sabe a data de compra. */
  ownershipYears?: number;
  depreciationRatePct?: number;

  insuranceYearCents: number;
  iucYearCents?: number;
  inspectionPriceCents?: number;
  inspectionIntervalYears?: number;
  financing?: Financing;
  /** Dia de referência (yyyy-mm-dd) para contar só os juros dos últimos 12 meses. */
  asOf?: string;
  parkingMonthCents?: number;
  otherFixedYearCents?: number;
  opportunityCost?: { enabled: boolean; ratePct: number };

  tollsMonthCents?: number;
  maintenanceYearCents?: number;
  tyreSetCents?: number;
  tyreLifeKm?: number;
}

export interface FixedCosts {
  depreciation: number;
  insurance: number;
  iuc: number;
  inspection: number;
  interest: number;
  other: number;
  opportunity: number;
}

export interface VariableCosts {
  energy: number;
  maintenance: number;
  tyres: number;
  tolls: number;
}

export type EstimatedField = "depreciation" | "tyreLife";

/** Categorias sem valor inicial: contam 0 € e o ecrã tem de o dizer. */
export type MissingField = "maintenance" | "tyres" | "iuc" | "inspection";

/** Todos os valores em cêntimos por ano, sem arredondar. Arredonda-se só ao mostrar. */
export interface CostResult {
  fixed: FixedCosts;
  variable: VariableCosts;
  fixedYear: number;
  variableYear: number;
  totalYear: number;
  totalMonth: number;
  /** `null` quando os km por ano são zero: não há custo por km. */
  perKm: number | null;
  /** Custo variável por km (energia, manutenção e pneus), para o ponto de equilíbrio. */
  variablePerKm: number | null;
  depreciation: DepreciationResult;
  /** Vida dos pneus usada (a indicada ou a inicial). */
  tyreLifeKm: number;
  estimated: EstimatedField[];
  missing: MissingField[];
  /** A depreciação é negativa: o carro vale mais do que custou. */
  appreciated: boolean;
}

export function annualCost(input: CostInput): CostResult {
  assertNonNegative({
    kmPerYear: input.kmPerYear,
    consumptionPer100: input.consumptionPer100,
    energyPriceCents: input.energyPriceCents,
    insuranceYearCents: input.insuranceYearCents,
    iucYearCents: input.iucYearCents,
    inspectionPriceCents: input.inspectionPriceCents,
    parkingMonthCents: input.parkingMonthCents,
    otherFixedYearCents: input.otherFixedYearCents,
    tollsMonthCents: input.tollsMonthCents,
    maintenanceYearCents: input.maintenanceYearCents,
    tyreSetCents: input.tyreSetCents,
  });

  const estimated: EstimatedField[] = [];
  const km = input.kmPerYear;

  const depreciation = annualDepreciation({
    purchasePriceCents: input.purchasePriceCents,
    currentValueCents: input.currentValueCents,
    ownershipYears: input.ownershipYears,
    defaultRatePct: input.depreciationRatePct,
  });
  if (depreciation.estimated) estimated.push("depreciation");

  const opportunityRate = input.opportunityCost?.enabled ? input.opportunityCost.ratePct : 0;

  const fixed: FixedCosts = {
    depreciation: depreciation.annualCents,
    insurance: input.insuranceYearCents,
    iuc: input.iucYearCents ?? 0,
    inspection: annualizedInspection(input.inspectionPriceCents, input.inspectionIntervalYears),
    interest: input.financing ? interestInLast12Months(input.financing, input.asOf) : 0,
    other: (input.parkingMonthCents ?? 0) * 12 + (input.otherFixedYearCents ?? 0),
    opportunity: (depreciation.currentValueCents * opportunityRate) / 100,
  };

  const tyreLifeKm = input.tyreLifeKm ?? DEFAULTS.tyreLifeKm;
  let tyres = 0;
  if (input.tyreSetCents) {
    if (input.tyreLifeKm === undefined) estimated.push("tyreLife");
    if (tyreLifeKm <= 0) throw new RangeError(`Vida dos pneus inválida: ${tyreLifeKm}`);
    tyres = (km * input.tyreSetCents) / tyreLifeKm;
  }

  const variable: VariableCosts = {
    energy: annualEnergy(input),
    maintenance: input.maintenanceYearCents ?? 0,
    tyres,
    tolls: (input.tollsMonthCents ?? 0) * 12,
  };

  const fixedYear = sum(Object.values(fixed));
  const variableYear = sum(Object.values(variable));
  const totalYear = fixedYear + variableYear;

  return {
    fixed,
    variable,
    fixedYear,
    variableYear,
    totalYear,
    totalMonth: totalYear / 12,
    perKm: km > 0 ? totalYear / km : null,
    variablePerKm: km > 0 ? (variable.energy + variable.maintenance + variable.tyres) / km : null,
    depreciation,
    tyreLifeKm,
    estimated,
    missing: missingFields(input),
    appreciated: depreciation.annualCents < 0,
  };
}

function missingFields(input: CostInput): MissingField[] {
  const missing: MissingField[] = [];
  if (input.maintenanceYearCents === undefined) missing.push("maintenance");
  if (input.tyreSetCents === undefined) missing.push("tyres");
  if (input.iucYearCents === undefined) missing.push("iuc");
  if (input.inspectionPriceCents === undefined) missing.push("inspection");
  return missing;
}

function annualizedInspection(priceCents?: number, intervalYears?: number): number {
  if (!priceCents) return 0;
  if (!intervalYears || intervalYears <= 0) {
    throw new RangeError("Falta o intervalo da inspeção em anos");
  }
  return priceCents / intervalYears;
}

function annualEnergy(input: CostInput): number {
  const km = input.kmPerYear;
  const fuel = (km * input.consumptionPer100 * input.energyPriceCents) / 100;
  const electric = input.electricMode;
  if (!electric) return fuel;

  assertNonNegative({
    sharePct: electric.sharePct,
    electricConsumptionPer100: electric.consumptionPer100,
    electricEnergyPriceCents: electric.energyPriceCents,
  });
  if (electric.sharePct > 100) throw new RangeError(`Percentagem elétrica inválida: ${electric.sharePct}`);
  const share = electric.sharePct / 100;
  const electricCost = (km * electric.consumptionPer100 * electric.energyPriceCents) / 100;
  return fuel * (1 - share) + electricCost * share;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
