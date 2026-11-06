import { KiloraDB } from "./db";
import type { Expense, Receipt, Reminder, Settings, Vehicle } from "./schemas";

export function testDb(migrations?: ConstructorParameters<typeof KiloraDB>[1]): KiloraDB {
  return new KiloraDB(`test-${crypto.randomUUID()}`, migrations);
}

export const FULL_VEHICLE: Vehicle = {
  id: "0b6f2c1e-6a3d-4c8e-9f41-2d7a5b9c3e10",
  nickname: "O meu Golf",
  brand: "Volkswagen",
  model: "Golf",
  year: 2018,
  fuel: "gasoleo",
  purchaseDate: "2024-11-05",
  purchasePriceCents: 1_200_000,
  currentValueCents: 900_000,
  currentValueDate: "2026-11-05",
  odometerAtPurchase: 80_000,
  kmPerYear: 12_000,
  consumptionPer100: 5.4,
  energyPriceCents: 165.9,
  insuranceYearCents: 48_000,
  iucYearCents: 6_000,
  iucMonth: 3,
  inspectionPriceCents: 3_000,
  lastInspectionDate: "2026-03-10",
  parkingMonthCents: 0,
  tollsMonthCents: 2_500,
  maintenanceYearCents: 0,
  tyreSetCents: 32_000,
  tyreLifeKm: 45_000,
  financing: { principalCents: 1_000_000, annualRatePct: 6, months: 60, startDate: "2024-11-05" },
  createdAt: "2026-11-05T10:00:00.000Z",
};

/** Só os campos obrigatórios: manutenção e pneus em branco. */
export const SPARSE_VEHICLE: Vehicle = {
  id: "5d1e8f3a-2b4c-4d6e-8a9b-0c1d2e3f4a5b",
  nickname: "Carro da mãe",
  year: 2012,
  fuel: "gasolina",
  purchaseDate: "2020-06-01",
  purchasePriceCents: 650_000,
  kmPerYear: 4_000,
  consumptionPer100: 6.8,
  energyPriceCents: 175,
  insuranceYearCents: 32_000,
  iucYearCents: 11_000,
  createdAt: "2026-11-05T10:05:00.000Z",
};

export const RECEIPT: Receipt = {
  id: "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d",
  mimeType: "image/jpeg",
  bytes: Uint8Array.from({ length: 2_048 }, (_, i) => i % 256),
  createdAt: "2026-11-01T18:30:00.000Z",
};

export const EXPENSES: Expense[] = [
  {
    id: "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
    vehicleId: FULL_VEHICLE.id,
    date: "2026-11-01",
    type: "energia",
    amountCents: 4_977,
    odometer: 101_200,
    quantity: 30,
    unitPriceCents: 165.9,
    fullTank: true,
    note: "Bomba da rotunda",
    receiptId: RECEIPT.id,
  },
  {
    id: "2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
    vehicleId: SPARSE_VEHICLE.id,
    date: "2026-10-20",
    type: "lavagem",
    amountCents: 800,
  },
];

export const REMINDERS: Reminder[] = [
  { id: "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7b", vehicleId: FULL_VEHICLE.id, kind: "inspecao", dueDate: "2027-03-10" },
  { id: "4f5a6b7c-8d9e-4f0a-9b2c-3d4e5f6a7b8c", vehicleId: SPARSE_VEHICLE.id, kind: "revisao", dueOdometer: 120_000 },
];

export const SETTINGS: Settings = {
  id: "app",
  theme: "escuro",
  locale: "pt-PT",
  opportunityCost: { enabled: true, ratePct: 3 },
  license: { key: "ABC-123", status: "ativa", lastCheck: "2026-11-04T09:00:00.000Z" },
  rulesVersion: "2026-11-05",
  schemaVersion: 1,
};
