import type { Fuel, Vehicle } from "@/db/schemas";
import { parseDecimal, parseEurosToCents, parseInteger, parseUnitPriceToCents } from "@/lib/format";

export const STEPS = [1, 2, 3, 4] as const;
export type Step = (typeof STEPS)[number];

/** O que a pessoa escreveu, tal como escreveu. Só vira número ao guardar o carro. */
export interface OnboardingDraft {
  step: Step;
  fuel?: Fuel;
  brand: string;
  model: string;
  year: string;
  purchasePrice: string;
  purchaseDate: string;
  currentValue: string;
  /** A pessoa confirmou que o valor atual é maior que o preço pago. */
  appreciationConfirmed: boolean;
  hasFinancing: boolean;
  financingPrincipal: string;
  financingRate: string;
  financingMonths: string;
  financingStart: string;
  insurance: string;
  insurancePeriod: "ano" | "mes";
  iuc: string;
  lastInspectionDate: string;
  parkingMonth: string;
  kmPerYear: string;
  consumption: string;
  energyPrice: string;
  tollsMonth: string;
  maintenanceYear: string;
  tyreSet: string;
}

export type DraftField = Exclude<keyof OnboardingDraft, "step" | "appreciationConfirmed" | "hasFinancing" | "insurancePeriod">;

export function emptyDraft(): OnboardingDraft {
  return {
    step: 1,
    brand: "",
    model: "",
    year: "",
    purchasePrice: "",
    purchaseDate: "",
    currentValue: "",
    appreciationConfirmed: false,
    hasFinancing: false,
    financingPrincipal: "",
    financingRate: "",
    financingMonths: "",
    financingStart: "",
    insurance: "",
    insurancePeriod: "ano",
    iuc: "",
    lastInspectionDate: "",
    parkingMonth: "",
    kmPerYear: "",
    consumption: "",
    energyPrice: "",
    tollsMonth: "",
    maintenanceYear: "",
    tyreSet: "",
  };
}

export type FieldError = "required" | "invalid" | "requiredPriceOrValue" | "tooOld" | "future";

const blank = (text: string) => text.trim() === "";

/** Opcional: em branco é válido; se escrito, tem de ser número. */
function optionalNumber(text: string, parse: (t: string) => number | null): FieldError | undefined {
  if (blank(text)) return undefined;
  return parse(text) === null ? "invalid" : undefined;
}

function requiredPositive(text: string, parse: (t: string) => number | null): FieldError | undefined {
  if (blank(text)) return "required";
  const value = parse(text);
  return value === null || value <= 0 ? "invalid" : undefined;
}

function requiredNonNegative(text: string, parse: (t: string) => number | null): FieldError | undefined {
  if (blank(text)) return "required";
  return parse(text) === null ? "invalid" : undefined;
}

function optionalDate(text: string, today: string): FieldError | undefined {
  if (blank(text)) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "invalid";
  return text > today ? "future" : undefined;
}

/** Erros do passo indicado. Só os 6 campos da especificação são obrigatórios. */
export function validateStep(step: Step, draft: OnboardingDraft, today: string): Partial<Record<DraftField, FieldError>> {
  const errors: Partial<Record<DraftField, FieldError>> = {};
  const set = (field: DraftField, error: FieldError | undefined) => {
    if (error) errors[field] = error;
  };

  if (step === 1) {
    if (!draft.fuel) errors.fuel = "required";
    if (!blank(draft.year)) {
      const year = parseInteger(draft.year);
      if (year === null) errors.year = "invalid";
      else if (year < 1900) errors.year = "tooOld";
      else if (year > Number(today.slice(0, 4)) + 1) errors.year = "future";
    }
  }

  if (step === 2) {
    if (blank(draft.purchasePrice) && blank(draft.currentValue)) {
      errors.purchasePrice = "requiredPriceOrValue";
    } else {
      set("purchasePrice", blank(draft.purchasePrice) ? undefined : requiredPositive(draft.purchasePrice, parseEurosToCents));
      set("currentValue", optionalNumber(draft.currentValue, parseEurosToCents));
    }
    set("purchaseDate", optionalDate(draft.purchaseDate, today));
    if (draft.hasFinancing) {
      set("financingPrincipal", requiredPositive(draft.financingPrincipal, parseEurosToCents));
      set("financingRate", requiredNonNegative(draft.financingRate, parseDecimal));
      set("financingMonths", requiredPositive(draft.financingMonths, parseInteger));
      if (blank(draft.financingStart)) errors.financingStart = "required";
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.financingStart)) errors.financingStart = "invalid";
    }
  }

  if (step === 3) {
    set("insurance", requiredNonNegative(draft.insurance, parseEurosToCents));
    set("iuc", optionalNumber(draft.iuc, parseEurosToCents));
    set("lastInspectionDate", optionalDate(draft.lastInspectionDate, today));
    set("parkingMonth", optionalNumber(draft.parkingMonth, parseEurosToCents));
  }

  if (step === 4) {
    set("kmPerYear", requiredNonNegative(draft.kmPerYear, parseInteger));
    set("consumption", requiredPositive(draft.consumption, parseDecimal));
    set("energyPrice", requiredPositive(draft.energyPrice, parseUnitPriceToCents));
    set("tollsMonth", optionalNumber(draft.tollsMonth, parseEurosToCents));
    set("maintenanceYear", optionalNumber(draft.maintenanceYear, parseEurosToCents));
    set("tyreSet", optionalNumber(draft.tyreSet, parseEurosToCents));
  }

  return errors;
}

/** Verdadeiro quando o valor atual é maior que o preço pago e a pessoa ainda não confirmou. */
export function needsAppreciationConfirmation(draft: OnboardingDraft): boolean {
  const purchase = parseEurosToCents(draft.purchasePrice);
  const current = parseEurosToCents(draft.currentValue);
  return purchase !== null && current !== null && current > purchase && !draft.appreciationConfirmed;
}

function optional<T>(text: string, parse: (t: string) => T | null): T | undefined {
  return blank(text) ? undefined : (parse(text) ?? undefined);
}

/**
 * Passa o rascunho para um carro. Os campos em branco ficam ausentes, nunca 0.
 * O seguro mensal guarda-se por ano (12 prestações).
 */
export function draftToVehicle(
  draft: OnboardingDraft,
  { id, now, defaultNickname }: { id: string; now: Date; defaultNickname: string },
): Vehicle {
  if (!draft.fuel) throw new Error("Falta o combustível");
  const insurance = parseEurosToCents(draft.insurance) ?? 0;
  const nickname = [draft.brand.trim(), draft.model.trim()].filter(Boolean).join(" ") || defaultNickname;
  const kmPerYear = parseInteger(draft.kmPerYear);
  const consumption = parseDecimal(draft.consumption);
  const energyPrice = parseUnitPriceToCents(draft.energyPrice);
  if (kmPerYear === null || consumption === null || energyPrice === null) {
    throw new Error("Faltam os dados de uso");
  }

  return {
    id,
    nickname,
    brand: blank(draft.brand) ? undefined : draft.brand.trim(),
    model: blank(draft.model) ? undefined : draft.model.trim(),
    year: optional(draft.year, parseInteger),
    fuel: draft.fuel,
    purchaseDate: blank(draft.purchaseDate) ? undefined : draft.purchaseDate,
    purchasePriceCents: optional(draft.purchasePrice, parseEurosToCents),
    currentValueCents: optional(draft.currentValue, parseEurosToCents),
    currentValueDate: blank(draft.currentValue) ? undefined : now.toISOString().slice(0, 10),
    kmPerYear,
    consumptionPer100: consumption,
    energyPriceCents: energyPrice,
    insuranceYearCents: draft.insurancePeriod === "mes" ? insurance * 12 : insurance,
    iucYearCents: optional(draft.iuc, parseEurosToCents),
    lastInspectionDate: blank(draft.lastInspectionDate) ? undefined : draft.lastInspectionDate,
    parkingMonthCents: optional(draft.parkingMonth, parseEurosToCents),
    tollsMonthCents: optional(draft.tollsMonth, parseEurosToCents),
    maintenanceYearCents: optional(draft.maintenanceYear, parseEurosToCents),
    tyreSetCents: optional(draft.tyreSet, parseEurosToCents),
    financing: draft.hasFinancing
      ? {
          principalCents: parseEurosToCents(draft.financingPrincipal)!,
          annualRatePct: parseDecimal(draft.financingRate)!,
          months: parseInteger(draft.financingMonths)!,
          startDate: draft.financingStart,
        }
      : undefined,
    createdAt: now.toISOString(),
  };
}
