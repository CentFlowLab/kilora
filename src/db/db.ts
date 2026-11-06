import Dexie, { type EntityTable, type Transaction } from "dexie";
import type { Expense, Receipt, Reminder, Settings, Vehicle } from "./schemas";

export const TABLES = ["vehicles", "expenses", "reminders", "settings", "receipts"] as const;
export type TableName = (typeof TABLES)[number];

export type BackupTables = Record<string, unknown[] | unknown>;

/**
 * Uma migração numerada. `stores` só aceita texto: apagar uma tabela no Dexie
 * exige `null`, e isso fica impossível por tipo. As migrações nunca apagam dados.
 */
export interface Migration {
  version: number;
  stores: Partial<Record<TableName, string>> & Record<string, string>;
  /** Transforma os dados guardados no dispositivo ao subir de versão. */
  upgrade?: (tx: Transaction) => PromiseLike<unknown> | void;
  /** A mesma transformação aplicada a um backup de versão anterior antes de o importar. */
  upgradeBackup?: (data: BackupTables) => BackupTables;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    stores: {
      vehicles: "id, createdAt",
      expenses: "id, vehicleId, date, type, [vehicleId+date], receiptId",
      reminders: "id, vehicleId",
      settings: "id",
      receipts: "id",
    },
  },
];

export const DB_NAME = "kilora";

export class KiloraDB extends Dexie {
  vehicles!: EntityTable<Vehicle, "id">;
  expenses!: EntityTable<Expense, "id">;
  reminders!: EntityTable<Reminder, "id">;
  settings!: EntityTable<Settings, "id">;
  receipts!: EntityTable<Receipt, "id">;

  readonly migrations: readonly Migration[];
  readonly schemaVersion: number;

  constructor(name: string = DB_NAME, migrations: readonly Migration[] = MIGRATIONS) {
    super(name);
    assertMigrationOrder(migrations);
    this.migrations = migrations;
    this.schemaVersion = migrations[migrations.length - 1].version;
    for (const migration of migrations) {
      const version = this.version(migration.version).stores(migration.stores);
      if (migration.upgrade) version.upgrade(migration.upgrade);
    }
  }
}

function assertMigrationOrder(migrations: readonly Migration[]): void {
  if (migrations.length === 0) throw new Error("Tem de haver pelo menos uma migração");
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(`As migrações têm de ser numeradas 1, 2, 3…: encontrada ${migration.version} na posição ${index + 1}`);
    }
  });
}

let instance: KiloraDB | undefined;

/** A base de dados da app. Só existe no navegador. */
export function getDb(): KiloraDB {
  instance ??= new KiloraDB();
  return instance;
}
