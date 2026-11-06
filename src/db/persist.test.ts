import { describe, expect, it } from "vitest";
import { requestPersistentStorage } from "./persist";

const storage = (persisted: boolean, granted: boolean) =>
  ({ persisted: async () => persisted, persist: async () => granted }) as unknown as StorageManager;

describe("requestPersistentStorage", () => {
  it("não volta a pedir quando já está garantido", async () => {
    expect(await requestPersistentStorage(storage(true, false))).toBe("persisted");
  });

  it("devolve o que o navegador decidir", async () => {
    expect(await requestPersistentStorage(storage(false, true))).toBe("persisted");
    expect(await requestPersistentStorage(storage(false, false))).toBe("denied");
  });

  it("sem suporte não falha", async () => {
    expect(await requestPersistentStorage(null)).toBe("unsupported");
  });
});
