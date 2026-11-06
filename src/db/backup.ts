import { z } from "zod";
import { MIGRATIONS, type BackupTables, type KiloraDB, type Migration } from "./db";
import { hasUserData } from "./repo";
import {
  expenseSchema,
  receiptSchema,
  reminderSchema,
  settingsSchema,
  vehicleSchema,
  type Expense,
  type Receipt,
  type Reminder,
  type Settings,
  type Vehicle,
} from "./schemas";

export const BACKUP_APP = "kilora";

export type BackupErrorCode = "invalid-file" | "not-kilora" | "newer-version" | "invalid-data" | "existing-data";

export class BackupError extends Error {
  constructor(
    readonly code: BackupErrorCode,
    message: string,
    readonly issues: unknown[] = [],
  ) {
    super(message);
    this.name = "BackupError";
  }
}

export interface BackupData {
  vehicles: Vehicle[];
  expenses: Expense[];
  reminders: Reminder[];
  settings: Settings | null;
  receipts: Receipt[];
}

export interface ParsedBackup {
  /** Versão do esquema com que o ficheiro foi feito, antes de migrar. */
  fileSchemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

const headerSchema = z.object({
  app: z.string(),
  schemaVersion: z.int().positive(),
  data: z.record(z.string(), z.unknown()),
});

const receiptFileSchema = receiptSchema.omit({ bytes: true }).extend({ dataBase64: z.base64() });

const backupFileSchema = z.strictObject({
  app: z.literal(BACKUP_APP),
  schemaVersion: z.int().positive(),
  exportedAt: z.iso.datetime(),
  data: z.strictObject({
    vehicles: z.array(vehicleSchema),
    expenses: z.array(expenseSchema),
    reminders: z.array(reminderSchema),
    settings: settingsSchema.nullable(),
    receipts: z.array(receiptFileSchema),
  }),
});

export interface ExportOptions {
  /** Por defeito inclui as fotos dos recibos. Sem elas, as despesas perdem a ligação à foto. */
  includeReceipts?: boolean;
  now?: Date;
}

export async function exportBackup(db: KiloraDB, options: ExportOptions = {}): Promise<string> {
  const includeReceipts = options.includeReceipts ?? true;
  const [vehicles, expenses, reminders, settings, receipts] = await db.transaction(
    "r",
    [db.vehicles, db.expenses, db.reminders, db.settings, db.receipts],
    () =>
      Promise.all([
        db.vehicles.toArray(),
        db.expenses.toArray(),
        db.reminders.toArray(),
        db.settings.toArray(),
        includeReceipts ? db.receipts.toArray() : Promise.resolve([]),
      ]),
  );

  const file: z.input<typeof backupFileSchema> = {
    app: BACKUP_APP,
    schemaVersion: db.schemaVersion,
    exportedAt: (options.now ?? new Date()).toISOString(),
    data: {
      vehicles,
      expenses: includeReceipts ? expenses : expenses.map(withoutReceipt),
      reminders,
      settings: settings[0] ?? null,
      receipts: receipts.map(({ bytes, ...rest }) => ({ ...rest, dataBase64: bytesToBase64(bytes) })),
    },
  };
  return JSON.stringify(file);
}

/** Lê e valida o ficheiro inteiro, sem tocar na base de dados. */
export function parseBackup(text: string, migrations: readonly Migration[] = MIGRATIONS): ParsedBackup {
  const currentVersion = migrations[migrations.length - 1].version;

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError("invalid-file", "O ficheiro não é um backup válido");
  }

  const header = headerSchema.safeParse(raw);
  if (!header.success) throw new BackupError("invalid-file", "O ficheiro não é um backup válido");
  if (header.data.app !== BACKUP_APP) throw new BackupError("not-kilora", "O ficheiro não é um backup do Kilora");

  const fileSchemaVersion = header.data.schemaVersion;
  if (fileSchemaVersion > currentVersion) {
    throw new BackupError(
      "newer-version",
      `O backup é da versão ${fileSchemaVersion} dos dados e esta app só conhece até à ${currentVersion}`,
    );
  }

  let tables: BackupTables = header.data.data;
  for (const migration of migrations) {
    if (migration.version > fileSchemaVersion && migration.upgradeBackup) {
      tables = migration.upgradeBackup(tables);
    }
  }

  const parsed = backupFileSchema.safeParse({ ...(raw as object), schemaVersion: currentVersion, data: tables });
  if (!parsed.success) throw new BackupError("invalid-data", "O backup tem dados inválidos", parsed.error.issues);

  const { data } = parsed.data;
  const receipts = data.receipts.map(({ dataBase64, ...rest }) => {
    const receipt = receiptSchema.safeParse({ ...rest, bytes: base64ToBytes(dataBase64) });
    if (!receipt.success) throw new BackupError("invalid-data", "O backup tem uma foto inválida", receipt.error.issues);
    return receipt.data;
  });

  const result: BackupData = {
    vehicles: data.vehicles,
    expenses: data.expenses,
    reminders: data.reminders,
    settings: data.settings && { ...data.settings, schemaVersion: currentVersion },
    receipts,
  };
  assertIntegrity(result);

  return { fileSchemaVersion, exportedAt: parsed.data.exportedAt, data: result };
}

export interface RestoreOptions {
  /** Tem de ser pedido de forma explícita quando já há dados no dispositivo. */
  replaceExisting: boolean;
}

/** Substitui tudo numa só transação: ou fica o backup inteiro, ou fica tudo como estava. */
export async function restoreBackup(db: KiloraDB, backup: ParsedBackup, options: RestoreOptions): Promise<void> {
  const { data } = backup;
  await db.transaction("rw", [db.vehicles, db.expenses, db.reminders, db.settings, db.receipts], async () => {
    if (!options.replaceExisting && (await hasUserData(db))) {
      throw new BackupError("existing-data", "Já há dados neste dispositivo. Escolhe substituir tudo ou cancelar");
    }
    await Promise.all([
      db.vehicles.clear(),
      db.expenses.clear(),
      db.reminders.clear(),
      db.settings.clear(),
      db.receipts.clear(),
    ]);
    await db.vehicles.bulkAdd(data.vehicles);
    await db.receipts.bulkAdd(data.receipts);
    await db.expenses.bulkAdd(data.expenses);
    await db.reminders.bulkAdd(data.reminders);
    if (data.settings) await db.settings.add(data.settings);
  });
}

export async function importBackup(db: KiloraDB, text: string, options: RestoreOptions): Promise<ParsedBackup> {
  const backup = parseBackup(text, db.migrations);
  await restoreBackup(db, backup, options);
  return backup;
}

function assertIntegrity(data: BackupData): void {
  const problems: string[] = [];
  const unique = (name: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length) problems.push(`Há identificadores repetidos em ${name}`);
  };
  unique("carros", data.vehicles.map((v) => v.id));
  unique("despesas", data.expenses.map((e) => e.id));
  unique("lembretes", data.reminders.map((r) => r.id));
  unique("fotos", data.receipts.map((r) => r.id));

  const vehicleIds = new Set(data.vehicles.map((v) => v.id));
  const receiptIds = new Set(data.receipts.map((r) => r.id));
  for (const expense of data.expenses) {
    if (!vehicleIds.has(expense.vehicleId)) problems.push(`A despesa ${expense.id} aponta para um carro que não existe`);
    if (expense.receiptId && !receiptIds.has(expense.receiptId)) {
      problems.push(`A despesa ${expense.id} aponta para uma foto que não existe`);
    }
  }
  for (const reminder of data.reminders) {
    if (!vehicleIds.has(reminder.vehicleId)) problems.push(`O lembrete ${reminder.id} aponta para um carro que não existe`);
  }

  if (problems.length > 0) throw new BackupError("invalid-data", "O backup tem dados inconsistentes", problems);
}

function withoutReceipt(expense: Expense): Expense {
  const copy = { ...expense };
  delete copy.receiptId;
  return copy;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
