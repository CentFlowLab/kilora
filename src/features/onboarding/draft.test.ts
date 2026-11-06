import { describe, expect, it } from "vitest";
import { vehicleSchema } from "@/db/schemas";
import { draftToVehicle, emptyDraft, needsAppreciationConfirmation, validateStep, type OnboardingDraft } from "./draft";
import { clearDraft, loadDraft, saveDraft } from "./draft-storage";

const TODAY = "2026-11-06";
const options = { id: "0b6f2c1e-6a3d-4c8e-9f41-2d7a5b9c3e10", now: new Date("2026-11-06T10:00:00Z"), defaultNickname: "O meu carro" };

/** Só os 6 campos obrigatórios. */
const minimal: OnboardingDraft = {
  ...emptyDraft(),
  fuel: "gasolina",
  purchasePrice: "12 000",
  insurance: "480",
  kmPerYear: "12000",
  consumption: "6,0",
  energyPrice: "1.759",
};

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
}

describe("validateStep", () => {
  it("com os 6 campos obrigatórios todos os passos passam", () => {
    for (const step of [1, 2, 3, 4] as const) expect(validateStep(step, minimal, TODAY)).toEqual({});
  });

  it("pede cada um dos 6 campos obrigatórios", () => {
    const empty = emptyDraft();
    expect(validateStep(1, empty, TODAY)).toEqual({ fuel: "required" });
    expect(validateStep(2, empty, TODAY)).toEqual({ purchasePrice: "requiredPriceOrValue" });
    expect(validateStep(3, empty, TODAY)).toEqual({ insurance: "required" });
    expect(validateStep(4, empty, TODAY)).toEqual({ kmPerYear: "required", consumption: "required", energyPrice: "required" });
  });

  it("o valor atual chega no lugar do preço pago", () => {
    expect(validateStep(2, { ...emptyDraft(), currentValue: "9 000" }, TODAY)).toEqual({});
  });

  it("recusa texto que não é número, datas no futuro e consumo zero", () => {
    expect(validateStep(3, { ...minimal, iuc: "abc" }, TODAY)).toEqual({ iuc: "invalid" });
    expect(validateStep(2, { ...minimal, purchaseDate: "2027-01-01" }, TODAY)).toEqual({ purchaseDate: "future" });
    expect(validateStep(4, { ...minimal, consumption: "0" }, TODAY)).toEqual({ consumption: "invalid" });
  });

  it("com crédito, pede os 4 campos do crédito", () => {
    expect(Object.keys(validateStep(2, { ...minimal, hasFinancing: true }, TODAY)).sort()).toEqual([
      "financingMonths",
      "financingPrincipal",
      "financingRate",
      "financingStart",
    ]);
  });
});

describe("draftToVehicle", () => {
  it("só com os 6 campos dá um carro válido, com os opcionais ausentes e não a 0", () => {
    const vehicle = draftToVehicle(minimal, options);
    expect(vehicleSchema.safeParse(vehicle).success).toBe(true);
    expect(vehicle.energyPriceCents).toBe(175.9);
    expect(vehicle.consumptionPer100).toBe(6);
    expect(vehicle.purchasePriceCents).toBe(1_200_000);
    expect(vehicle.nickname).toBe("O meu carro");
    expect(vehicle.maintenanceYearCents).toBeUndefined();
    expect(vehicle.tyreSetCents).toBeUndefined();
    expect(vehicle.iucYearCents).toBeUndefined();
  });

  it('os campos de dinheiro aceitam "1,85" e "1.85"', () => {
    expect(draftToVehicle({ ...minimal, energyPrice: "1,85" }, options).energyPriceCents).toBe(185);
    expect(draftToVehicle({ ...minimal, energyPrice: "1.85" }, options).energyPriceCents).toBe(185);
  });

  it("um 0 escrito continua 0 e o seguro mensal guarda-se por ano", () => {
    const vehicle = draftToVehicle({ ...minimal, maintenanceYear: "0", insurance: "40", insurancePeriod: "mes" }, options);
    expect(vehicle.maintenanceYearCents).toBe(0);
    expect(vehicle.insuranceYearCents).toBe(48_000);
  });

  it("marca e modelo dão o nome do carro", () => {
    expect(draftToVehicle({ ...minimal, brand: "Renault", model: "Clio" }, options).nickname).toBe("Renault Clio");
  });
});

describe("needsAppreciationConfirmation", () => {
  it('pergunta "Confirmas?" quando o valor atual é maior que o preço pago, até a pessoa confirmar', () => {
    const higher = { ...minimal, currentValue: "13 000" };
    expect(needsAppreciationConfirmation(higher)).toBe(true);
    expect(needsAppreciationConfirmation({ ...higher, appreciationConfirmed: true })).toBe(false);
    expect(needsAppreciationConfirmation({ ...minimal, currentValue: "9 000" })).toBe(false);
  });
});

describe("rascunho guardado", () => {
  it("volta ao passo e aos valores onde a pessoa ficou", () => {
    const storage = memoryStorage();
    saveDraft({ ...minimal, step: 3 }, storage);
    expect(loadDraft(storage)).toEqual({ ...minimal, step: 3 });
    clearDraft(storage);
    expect(loadDraft(storage)).toBeNull();
  });

  it("ignora um rascunho estragado em vez de falhar", () => {
    const storage = memoryStorage();
    storage.setItem("kilora.onboarding", "{não é json");
    expect(loadDraft(storage)).toBeNull();
    storage.setItem("kilora.onboarding", JSON.stringify({ step: 9, insurance: 5 }));
    expect(loadDraft(storage)).toMatchObject({ step: 1, insurance: "" });
  });
});
