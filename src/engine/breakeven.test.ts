import { describe, expect, it } from "vitest";
import { breakevenKm } from "./breakeven";

describe("breakevenKm", () => {
  it("km* = fixos / (custo da alternativa − custo variável do carro)", () => {
    expect(breakevenKm(205_500, 15, 40)).toEqual({ kind: "km", kmPerYear: 8_220 });
  });

  it("quando a alternativa custa o mesmo ou menos por km, é sempre mais barata", () => {
    expect(breakevenKm(205_500, 15, 15)).toEqual({ kind: "alternative-always-cheaper" });
    expect(breakevenKm(205_500, 15, 10)).toEqual({ kind: "alternative-always-cheaper" });
  });

  it("recusa valores negativos", () => {
    expect(() => breakevenKm(-1, 15, 40)).toThrow(RangeError);
  });
});
