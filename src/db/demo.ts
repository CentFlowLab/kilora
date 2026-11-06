import { format, subDays, subYears } from "date-fns";
import { newId } from "@/lib/uuid";
import type { KiloraDB } from "./db";
import { hasUserData, saveExpense, saveReminder, saveVehicle } from "./repo";
import type { Expense, Vehicle } from "./schemas";

const day = (date: Date) => format(date, "yyyy-MM-dd");

/**
 * Preenche um carro com os valores do exemplo da secção 5 e alguns abastecimentos,
 * só para desenvolvimento. Recusa correr se já houver dados.
 */
export async function seedDemoData(db: KiloraDB, now: Date = new Date()): Promise<Vehicle> {
  if (await hasUserData(db)) throw new Error("Já há dados neste dispositivo. Os dados de demonstração não os substituem");

  const vehicle = await saveVehicle(db, {
    id: newId(),
    nickname: "Carro de demonstração",
    year: now.getFullYear() - 6,
    fuel: "gasolina",
    purchaseDate: day(subYears(now, 2)),
    purchasePriceCents: 1_200_000,
    currentValueCents: 900_000,
    currentValueDate: day(now),
    kmPerYear: 12_000,
    consumptionPer100: 6,
    energyPriceCents: 175,
    insuranceYearCents: 48_000,
    iucYearCents: 6_000,
    inspectionPriceCents: 3_000,
    lastInspectionDate: day(subYears(now, 1)),
    maintenanceYearCents: 40_000,
    tyreSetCents: 32_000,
    tyreLifeKm: 40_000,
    createdAt: now.toISOString(),
  });

  const fills: Array<{ daysAgo: number; odometer: number; litres: number; fullTank: boolean }> = [
    { daysAgo: 60, odometer: 48_000, litres: 40, fullTank: true },
    { daysAgo: 45, odometer: 48_500, litres: 30, fullTank: true },
    { daysAgo: 30, odometer: 48_800, litres: 15, fullTank: false },
    { daysAgo: 15, odometer: 49_050, litres: 17, fullTank: true },
  ];
  for (const fill of fills) {
    const expense: Expense = {
      id: newId(),
      vehicleId: vehicle.id,
      date: day(subDays(now, fill.daysAgo)),
      type: "energia",
      amountCents: Math.round(fill.litres * 175),
      odometer: fill.odometer,
      quantity: fill.litres,
      unitPriceCents: 175,
      fullTank: fill.fullTank,
    };
    await saveExpense(db, expense);
  }

  await saveReminder(db, {
    id: newId(),
    vehicleId: vehicle.id,
    kind: "inspecao",
    dueDate: day(subDays(subYears(now, -1), 1)),
  });

  return vehicle;
}
