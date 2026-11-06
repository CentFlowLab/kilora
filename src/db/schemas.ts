import { z } from "zod";

const id = z.uuid();
const day = z.iso.date();
const timestamp = z.iso.datetime();
/** Montantes em cêntimos inteiros. 0 é um valor dado, diferente de ausente. */
const cents = z.int().nonnegative();
const positiveCents = z.int().positive();
/** Preços por L ou kWh podem ter décimas de cêntimo (1,759 €/L = 175,9). */
const unitPriceCents = z.number().positive();
const km = z.int().nonnegative();

export const FUELS = ["gasolina", "gasoleo", "eletrico", "hibrido", "hibrido_plugin", "gpl"] as const;

export const EXPENSE_TYPES = [
  "energia",
  "manutencao",
  "reparacao",
  "pneus",
  "seguro",
  "iuc",
  "inspecao",
  "portagens",
  "estacionamento",
  "lavagem",
  "multa",
  "acessorios",
  "outros",
] as const;

export const REMINDER_KINDS = ["inspecao", "iuc", "seguro", "revisao", "pneus", "custom"] as const;

export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/webp", "image/png"] as const;

export const MAX_RECEIPT_BYTES = 1_000_000;

export const vehicleSchema = z.strictObject({
  id,
  nickname: z.string().trim().min(1).max(60),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(60).optional(),
  year: z.int().min(1900).max(2100),
  fuel: z.enum(FUELS),
  purchaseDate: day,
  purchasePriceCents: positiveCents,
  currentValueCents: cents.optional(),
  currentValueDate: day.optional(),
  odometerAtPurchase: km.optional(),
  kmPerYear: km,
  consumptionPer100: z.number().positive(),
  energyPriceCents: unitPriceCents,
  insuranceYearCents: cents,
  iucYearCents: cents,
  iucMonth: z.int().min(1).max(12).optional(),
  inspectionPriceCents: cents.optional(),
  lastInspectionDate: day.optional(),
  parkingMonthCents: cents.optional(),
  tollsMonthCents: cents.optional(),
  maintenanceYearCents: cents.optional(),
  tyreSetCents: cents.optional(),
  tyreLifeKm: z.int().positive().optional(),
  financing: z
    .strictObject({
      principalCents: positiveCents,
      annualRatePct: z.number().min(0).max(100),
      months: z.int().positive().max(240),
      startDate: day,
    })
    .optional(),
  soldDate: day.optional(),
  soldPriceCents: cents.optional(),
  createdAt: timestamp,
});

export const expenseSchema = z.strictObject({
  id,
  vehicleId: id,
  date: day,
  type: z.enum(EXPENSE_TYPES),
  amountCents: positiveCents,
  odometer: km.optional(),
  quantity: z.number().positive().optional(),
  unitPriceCents: unitPriceCents.optional(),
  fullTank: z.boolean().optional(),
  chargeKind: z.enum(["casa", "publico"]).optional(),
  note: z.string().max(500).optional(),
  receiptId: id.optional(),
  recurringId: id.optional(),
});

export const reminderSchema = z
  .strictObject({
    id,
    vehicleId: id,
    kind: z.enum(REMINDER_KINDS),
    dueDate: day.optional(),
    dueOdometer: km.optional(),
    doneAt: day.optional(),
    title: z.string().trim().min(1).max(80).optional(),
  })
  .refine((r) => r.dueDate !== undefined || r.dueOdometer !== undefined, {
    message: "O lembrete precisa de uma data ou de quilómetros",
  });

export const SETTINGS_ID = "app";

export const settingsSchema = z.strictObject({
  id: z.literal(SETTINGS_ID),
  theme: z.enum(["claro", "escuro", "auto"]),
  locale: z.literal("pt-PT"),
  opportunityCost: z.strictObject({ enabled: z.boolean(), ratePct: z.number().min(0).max(100) }),
  license: z
    .strictObject({
      key: z.string().min(1),
      status: z.enum(["ativa", "invalida", "desconhecida"]),
      lastCheck: timestamp,
    })
    .optional(),
  rulesVersion: z.string().min(1),
  schemaVersion: z.int().positive(),
});

export const receiptSchema = z.strictObject({
  id,
  mimeType: z.enum(RECEIPT_MIME_TYPES),
  bytes: z.instanceof(Uint8Array).refine((b) => b.byteLength > 0 && b.byteLength <= MAX_RECEIPT_BYTES, {
    message: `A foto tem de ter entre 1 byte e ${MAX_RECEIPT_BYTES} bytes`,
  }),
  createdAt: timestamp,
});

export type Fuel = (typeof FUELS)[number];
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export type Vehicle = z.infer<typeof vehicleSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type Reminder = z.infer<typeof reminderSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Receipt = z.infer<typeof receiptSchema>;

/**
 * Retira chaves com valor `undefined` (também dentro de objetos), para que um campo
 * em branco fique ausente na base de dados e no backup, e nunca guardado como 0.
 */
export function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T;
  if (value === null || typeof value !== "object" || ArrayBuffer.isView(value)) return value;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) result[key] = withoutUndefined(entry);
  }
  return result as T;
}
