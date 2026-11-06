import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { newId } from "./uuid";

describe("newId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("dá um uuid válido mesmo sem crypto.randomUUID (http na rede local)", () => {
    const { getRandomValues } = crypto;
    vi.stubGlobal("crypto", { getRandomValues: getRandomValues.bind(crypto) });
    const ids = Array.from({ length: 50 }, newId);
    for (const id of ids) expect(z.uuid().safeParse(id).success).toBe(true);
    expect(new Set(ids).size).toBe(50);
  });
});
