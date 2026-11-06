import { format, addDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { KiloraDB } from "./db";
import { seedDemoData } from "./demo";
import { EXPENSES, FULL_VEHICLE, RECEIPT, REMINDERS, SPARSE_VEHICLE, testDb } from "./fixtures";
import {
  ValidationError,
  deleteVehicle,
  getSettings,
  hasUserData,
  saveExpense,
  saveReceipt,
  saveReminder,
  saveVehicle,
} from "./repo";

let db: KiloraDB;

beforeEach(() => {
  db = testDb();
});

afterEach(async () => {
  await db.delete();
});

describe("gravações validadas", () => {
  it("um campo em branco fica ausente, nunca 0 nem undefined", async () => {
    await saveVehicle(db, { ...SPARSE_VEHICLE, maintenanceYearCents: undefined, tyreSetCents: undefined });
    const stored = await db.vehicles.get(SPARSE_VEHICLE.id);
    expect(stored).toStrictEqual(SPARSE_VEHICLE);
    expect(Object.keys(stored!)).not.toContain("maintenanceYearCents");
  });

  it("um 0 escrito pela pessoa continua a ser 0", async () => {
    await saveVehicle(db, FULL_VEHICLE);
    expect((await db.vehicles.get(FULL_VEHICLE.id))?.maintenanceYearCents).toBe(0);
  });

  it("dados inválidos nunca entram na base", async () => {
    await expect(saveVehicle(db, { ...FULL_VEHICLE, insuranceYearCents: -1 })).rejects.toThrow(ValidationError);
    await expect(saveVehicle(db, { ...FULL_VEHICLE, purchaseDate: "05/11/2024" })).rejects.toThrow(ValidationError);
    await expect(saveVehicle(db, { ...FULL_VEHICLE, plate: "AA-00-AA" } as never)).rejects.toThrow(ValidationError);
    await expect(saveVehicle(db, { ...FULL_VEHICLE, maintenanceYearCents: 12.5 })).rejects.toThrow(ValidationError);
    expect(await db.vehicles.count()).toBe(0);
  });

  it("despesas: recusa data no futuro, valor zero e carro inexistente", async () => {
    await saveVehicle(db, SPARSE_VEHICLE);
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const expense = EXPENSES[1];
    await expect(saveExpense(db, { ...expense, date: tomorrow })).rejects.toThrow("futuro");
    await expect(saveExpense(db, { ...expense, amountCents: 0 })).rejects.toThrow(ValidationError);
    await expect(saveExpense(db, { ...expense, vehicleId: FULL_VEHICLE.id })).rejects.toThrow("carro");
    await expect(saveExpense(db, { ...EXPENSES[0], vehicleId: SPARSE_VEHICLE.id })).rejects.toThrow("foto");
    expect(await db.expenses.count()).toBe(0);
  });

  it("lembretes: aceitam data no futuro mas precisam de data ou quilómetros", async () => {
    await saveVehicle(db, FULL_VEHICLE);
    await saveReminder(db, REMINDERS[0]);
    await expect(saveReminder(db, { id: crypto.randomUUID(), vehicleId: FULL_VEHICLE.id, kind: "pneus" })).rejects.toThrow(
      ValidationError,
    );
  });

  it("fotos: recusa ficheiros vazios ou acima do limite", async () => {
    await expect(saveReceipt(db, { ...RECEIPT, bytes: new Uint8Array() })).rejects.toThrow(ValidationError);
    await expect(saveReceipt(db, { ...RECEIPT, bytes: new Uint8Array(1_000_001) })).rejects.toThrow(ValidationError);
  });
});

describe("outras operações", () => {
  it("apagar um carro apaga as suas despesas, lembretes e fotos, e nada dos outros", async () => {
    await saveVehicle(db, FULL_VEHICLE);
    await saveVehicle(db, SPARSE_VEHICLE);
    await saveReceipt(db, RECEIPT);
    for (const expense of EXPENSES) await saveExpense(db, expense);
    for (const reminder of REMINDERS) await saveReminder(db, reminder);

    await deleteVehicle(db, FULL_VEHICLE.id);
    expect(await db.vehicles.toArray()).toStrictEqual([SPARSE_VEHICLE]);
    expect(await db.expenses.toArray()).toStrictEqual([EXPENSES[1]]);
    expect(await db.reminders.toArray()).toStrictEqual([REMINDERS[1]]);
    expect(await db.receipts.count()).toBe(0);
  });

  it("as definições de origem não são gravadas só por serem lidas", async () => {
    expect((await getSettings(db)).theme).toBe("auto");
    expect(await db.settings.count()).toBe(0);
  });

  it("os dados de demonstração preenchem um carro e recusam escrever por cima", async () => {
    await seedDemoData(db);
    expect(await hasUserData(db)).toBe(true);
    expect(await db.expenses.count()).toBe(4);
    await expect(seedDemoData(db)).rejects.toThrow("Já há dados");
    expect(await db.vehicles.count()).toBe(1);
  });
});
