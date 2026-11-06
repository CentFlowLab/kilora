import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BackupError, exportBackup, importBackup, parseBackup } from "./backup";
import type { KiloraDB } from "./db";
import { EXPENSES, FULL_VEHICLE, RECEIPT, REMINDERS, SETTINGS, SPARSE_VEHICLE, testDb } from "./fixtures";
import { saveExpense, saveReceipt, saveReminder, saveSettings, saveVehicle } from "./repo";

const NOW = new Date("2026-11-05T12:00:00.000Z");

async function fill(db: KiloraDB) {
  await saveVehicle(db, FULL_VEHICLE);
  await saveVehicle(db, SPARSE_VEHICLE);
  await saveReceipt(db, RECEIPT);
  for (const expense of EXPENSES) await saveExpense(db, expense);
  for (const reminder of REMINDERS) await saveReminder(db, reminder);
  await saveSettings(db, SETTINGS);
}

async function snapshot(db: KiloraDB) {
  return {
    vehicles: await db.vehicles.toArray(),
    expenses: await db.expenses.toArray(),
    reminders: await db.reminders.toArray(),
    settings: await db.settings.toArray(),
    receipts: await db.receipts.toArray(),
  };
}

async function expectRejects(promise: Promise<unknown>, code: BackupError["code"]) {
  await expect(promise).rejects.toSatisfy((error) => error instanceof BackupError && error.code === code);
}

let source: KiloraDB;
let target: KiloraDB;

beforeEach(async () => {
  source = testDb();
  target = testDb();
  await fill(source);
});

afterEach(async () => {
  await source.delete();
  await target.delete();
});

describe("ida e volta", () => {
  it("exportar e importar num dispositivo limpo devolve exatamente os mesmos dados", async () => {
    const file = await exportBackup(source, { now: NOW });
    await importBackup(target, file, { replaceExisting: false });

    expect(await snapshot(target)).toStrictEqual(await snapshot(source));
    expect(await exportBackup(target, { now: NOW })).toBe(file);
  });

  it("os campos em branco continuam ausentes e o 0 escrito continua 0", async () => {
    await importBackup(target, await exportBackup(source), { replaceExisting: false });

    const sparse = await target.vehicles.get(SPARSE_VEHICLE.id);
    expect(sparse).not.toHaveProperty("maintenanceYearCents");
    expect(sparse).not.toHaveProperty("tyreSetCents");
    expect(sparse).not.toHaveProperty("currentValueCents");

    const full = await target.vehicles.get(FULL_VEHICLE.id);
    expect(full?.maintenanceYearCents).toBe(0);
    expect(full?.parkingMonthCents).toBe(0);
  });

  it("as fotos voltam byte a byte", async () => {
    await importBackup(target, await exportBackup(source), { replaceExisting: false });
    const receipt = await target.receipts.get(RECEIPT.id);
    expect(receipt?.bytes).toStrictEqual(RECEIPT.bytes);
  });

  it("sem fotos, o backup continua válido e as despesas perdem só a ligação à foto", async () => {
    await importBackup(target, await exportBackup(source, { includeReceipts: false }), { replaceExisting: false });
    expect(await target.receipts.count()).toBe(0);
    const expense = await target.expenses.get(EXPENSES[0].id);
    expect(expense).not.toHaveProperty("receiptId");
    expect(expense?.amountCents).toBe(EXPENSES[0].amountCents);
  });
});

describe("tudo ou nada", () => {
  it("um único registo inválido recusa o ficheiro inteiro sem gravar nada", async () => {
    const file = JSON.parse(await exportBackup(source));
    file.data.expenses[1].amountCents = -5;

    await expectRejects(importBackup(target, JSON.stringify(file), { replaceExisting: false }), "invalid-data");
    expect(await snapshot(target)).toStrictEqual({ vehicles: [], expenses: [], reminders: [], settings: [], receipts: [] });
  });

  it("uma despesa ligada a um carro que não existe recusa o ficheiro", async () => {
    const file = JSON.parse(await exportBackup(source));
    file.data.vehicles = file.data.vehicles.filter((v: { id: string }) => v.id !== SPARSE_VEHICLE.id);

    await expectRejects(importBackup(target, JSON.stringify(file), { replaceExisting: false }), "invalid-data");
    expect(await target.vehicles.count()).toBe(0);
  });

  it("uma falha a meio da gravação desfaz tudo e deixa os dados antigos intactos", async () => {
    await saveVehicle(target, { ...SPARSE_VEHICLE, nickname: "Dados antigos" });
    const before = await snapshot(target);

    let created = 0;
    target.expenses.hook("creating", () => {
      created += 1;
      if (created === 2) throw new Error("Falha simulada a meio da importação");
    });

    await expect(importBackup(target, await exportBackup(source), { replaceExisting: true })).rejects.toThrow(
      "Falha simulada",
    );
    expect(await snapshot(target)).toStrictEqual(before);
  });
});

describe("dados que já existem", () => {
  it("sem escolha explícita, recusa e não apaga nada", async () => {
    await saveVehicle(target, { ...SPARSE_VEHICLE, nickname: "Dados antigos" });
    const before = await snapshot(target);

    await expectRejects(importBackup(target, await exportBackup(source), { replaceExisting: false }), "existing-data");
    expect(await snapshot(target)).toStrictEqual(before);
  });

  it("com substituir, fica só o conteúdo do backup", async () => {
    await saveVehicle(target, { ...SPARSE_VEHICLE, id: crypto.randomUUID(), nickname: "Dados antigos" });

    await importBackup(target, await exportBackup(source), { replaceExisting: true });
    expect(await snapshot(target)).toStrictEqual(await snapshot(source));
  });

  it("só as definições não contam como dados da pessoa", async () => {
    await saveSettings(target, { ...SETTINGS, theme: "claro" });
    await importBackup(target, await exportBackup(source), { replaceExisting: false });
    expect((await target.settings.toArray())[0].theme).toBe("escuro");
  });
});

describe("ficheiros recusados", () => {
  it("backup de versão mais recente que a app é recusado com mensagem clara", async () => {
    const file = JSON.parse(await exportBackup(source));
    file.schemaVersion = 99;

    expect(() => parseBackup(JSON.stringify(file))).toThrow(/versão 99 .* só conhece até à 1/);
    await expectRejects(importBackup(target, JSON.stringify(file), { replaceExisting: false }), "newer-version");
    expect(await target.vehicles.count()).toBe(0);
  });

  it("ficheiro que não é JSON ou não é do Kilora", () => {
    expect(() => parseBackup("isto não é json")).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify({ app: "fuelio", schemaVersion: 1, data: {} }))).toThrow(
      "não é um backup do Kilora",
    );
  });

  it("campos desconhecidos são recusados", async () => {
    const file = JSON.parse(await exportBackup(source));
    file.data.vehicles[0].plate = "AA-00-AA";
    expect(() => parseBackup(JSON.stringify(file))).toThrow(BackupError);
  });
});
