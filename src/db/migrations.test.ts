import { describe, expect, it } from "vitest";
import { exportBackup, parseBackup } from "./backup";
import { KiloraDB, MIGRATIONS, TABLES, type Migration } from "./db";
import { FULL_VEHICLE, SPARSE_VEHICLE } from "./fixtures";

/**
 * Uma versão 2 só de teste: o campo `name` dos carros passa a chamar-se `nickname`.
 * Serve para provar que o mecanismo sobe de versão sem perder nada.
 */
const OLD_V1: Migration = { ...MIGRATIONS[0] };
const TEST_V2: Migration = {
  version: 2,
  stores: { expenses: "id, vehicleId, date, type, [vehicleId+date], receiptId, odometer" },
  upgrade: (tx) =>
    tx
      .table("vehicles")
      .toCollection()
      .modify((vehicle: Record<string, unknown>) => {
        vehicle.nickname = vehicle.name;
        delete vehicle.name;
      }),
  upgradeBackup: (data) => ({
    ...data,
    vehicles: (data.vehicles as Record<string, unknown>[]).map(({ name, ...rest }) => ({ ...rest, nickname: name })),
  }),
};

function asOldFormat({ nickname, ...rest }: typeof FULL_VEHICLE) {
  return { ...rest, name: nickname };
}

describe("migrações", () => {
  it("subir de versão mantém todos os registos e todos os campos", async () => {
    const name = `test-${crypto.randomUUID()}`;
    const old = new KiloraDB(name, [OLD_V1]);
    const oldRows = [asOldFormat(FULL_VEHICLE), asOldFormat(SPARSE_VEHICLE)];
    await old.table("vehicles").bulkAdd(oldRows);
    await old.table("expenses").add({ id: "e1", vehicleId: FULL_VEHICLE.id, date: "2026-11-01", type: "lavagem", amountCents: 800 });
    old.close();

    const upgraded = new KiloraDB(name, [OLD_V1, TEST_V2]);
    const vehicles = await upgraded.vehicles.orderBy("createdAt").toArray();
    expect(vehicles).toStrictEqual([FULL_VEHICLE, SPARSE_VEHICLE]);
    expect(await upgraded.expenses.where("odometer").above(0).count()).toBe(0);
    expect(await upgraded.expenses.count()).toBe(1);
    expect(upgraded.schemaVersion).toBe(2);
    await upgraded.delete();
  });

  it("um backup da versão antiga é migrado ao importar, sem perder nada", async () => {
    const old = new KiloraDB(`test-${crypto.randomUUID()}`, [OLD_V1]);
    await old.vehicles.bulkAdd([FULL_VEHICLE, SPARSE_VEHICLE]);
    const file = JSON.parse(await exportBackup(old));
    file.data.vehicles = file.data.vehicles.map(asOldFormat);
    await old.delete();

    const backup = parseBackup(JSON.stringify(file), [OLD_V1, TEST_V2]);
    expect(backup.fileSchemaVersion).toBe(1);
    expect(backup.data.vehicles).toStrictEqual([FULL_VEHICLE, SPARSE_VEHICLE].sort((a, b) => a.id.localeCompare(b.id)));
  });

  it("as migrações reais estão numeradas a partir de 1 e nunca apagam tabelas", async () => {
    MIGRATIONS.forEach((migration, index) => {
      expect(migration.version).toBe(index + 1);
      for (const spec of Object.values(migration.stores)) expect(typeof spec).toBe("string");
    });

    const db = new KiloraDB(`test-${crypto.randomUUID()}`);
    await db.open();
    expect(db.tables.map((t) => t.name).sort()).toStrictEqual([...TABLES].sort());
    await db.delete();
  });

  it("recusa migrações fora de ordem", () => {
    expect(() => new KiloraDB("x", [{ ...TEST_V2 }])).toThrow(/numeradas/);
  });
});
