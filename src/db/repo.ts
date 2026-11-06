import { format } from "date-fns";
import type { z } from "zod";
import { RULES_VERSION } from "@/engine/rules";
import type { KiloraDB } from "./db";
import {
  SETTINGS_ID,
  expenseSchema,
  receiptSchema,
  reminderSchema,
  settingsSchema,
  vehicleSchema,
  withoutUndefined,
  type Expense,
  type Receipt,
  type Reminder,
  type Settings,
  type Vehicle,
} from "./schemas";

export class ValidationError extends Error {
  constructor(
    message: string,
    readonly issues: unknown[] = [],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function parse<S extends z.ZodType>(schema: S, value: unknown, what: string): z.output<S> {
  const result = schema.safeParse(withoutUndefined(value));
  if (!result.success) throw new ValidationError(`Dados inválidos em ${what}`, result.error.issues);
  return result.data;
}

export async function saveVehicle(db: KiloraDB, vehicle: Vehicle): Promise<Vehicle> {
  const valid = parse(vehicleSchema, vehicle, "carro");
  await db.vehicles.put(valid);
  return valid;
}

export async function saveExpense(db: KiloraDB, expense: Expense): Promise<Expense> {
  const valid = parse(expenseSchema, expense, "despesa");
  if (valid.date > today()) throw new ValidationError("A data da despesa não pode ser no futuro");
  await db.transaction("rw", db.vehicles, db.expenses, db.receipts, async () => {
    if (!(await db.vehicles.get(valid.vehicleId))) throw new ValidationError("O carro desta despesa não existe");
    if (valid.receiptId && !(await db.receipts.get(valid.receiptId))) {
      throw new ValidationError("A foto do recibo desta despesa não existe");
    }
    await db.expenses.put(valid);
  });
  return valid;
}

export async function saveReminder(db: KiloraDB, reminder: Reminder): Promise<Reminder> {
  const valid = parse(reminderSchema, reminder, "lembrete");
  await db.transaction("rw", db.vehicles, db.reminders, async () => {
    if (!(await db.vehicles.get(valid.vehicleId))) throw new ValidationError("O carro deste lembrete não existe");
    await db.reminders.put(valid);
  });
  return valid;
}

export async function saveReceipt(db: KiloraDB, receipt: Receipt): Promise<Receipt> {
  const valid = parse(receiptSchema, receipt, "foto do recibo");
  await db.receipts.put(valid);
  return valid;
}

export function defaultSettings(schemaVersion: number): Settings {
  return {
    id: SETTINGS_ID,
    theme: "auto",
    locale: "pt-PT",
    opportunityCost: { enabled: false, ratePct: 3 },
    rulesVersion: RULES_VERSION,
    schemaVersion,
  };
}

/** As definições guardadas, ou as de origem se ainda não houver nenhuma. Não grava nada. */
export async function getSettings(db: KiloraDB): Promise<Settings> {
  return (await db.settings.get(SETTINGS_ID)) ?? defaultSettings(db.schemaVersion);
}

export async function saveSettings(db: KiloraDB, settings: Settings): Promise<Settings> {
  const valid = parse(settingsSchema, settings, "definições");
  await db.settings.put(valid);
  return valid;
}

/** Apaga o carro e tudo o que lhe pertence, numa só transação. */
export async function deleteVehicle(db: KiloraDB, vehicleId: string): Promise<void> {
  await db.transaction("rw", db.vehicles, db.expenses, db.reminders, db.receipts, async () => {
    const expenses = await db.expenses.where("vehicleId").equals(vehicleId).toArray();
    const receiptIds = expenses.flatMap((e) => (e.receiptId ? [e.receiptId] : []));
    await db.receipts.bulkDelete(receiptIds);
    await db.expenses.where("vehicleId").equals(vehicleId).delete();
    await db.reminders.where("vehicleId").equals(vehicleId).delete();
    await db.vehicles.delete(vehicleId);
  });
}

/** Verdadeiro quando há dados da pessoa (as definições sozinhas não contam). */
export async function hasUserData(db: KiloraDB): Promise<boolean> {
  const counts = await Promise.all([db.vehicles.count(), db.expenses.count(), db.reminders.count(), db.receipts.count()]);
  return counts.some((count) => count > 0);
}
