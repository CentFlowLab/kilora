import { describe, expect, it } from "vitest";
import { t } from "./index";

describe("t", () => {
  it("lê um texto pela chave", () => {
    expect(t("app.name")).toBe("Kilora");
  });

  it("falha quando a chave não é um texto", () => {
    // @ts-expect-error chave que aponta para um grupo, não para um texto
    expect(() => t("app")).toThrow("Texto em falta: app");
  });
});
