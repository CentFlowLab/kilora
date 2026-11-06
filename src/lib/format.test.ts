import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatEuros,
  formatList,
  formatPerKm,
  formatUnitPrice,
  formatWholeEuros,
  parseDecimal,
  parseEurosToCents,
  parseInteger,
  parseUnitPriceToCents,
} from "./format";

const nbsp = (text: string) => text.replace(/ /g, "\u00A0");

describe("formatação pt-PT", () => {
  it("vírgula decimal, espaço nos milhares e € depois do número", () => {
    expect(formatEuros(31_758.33)).toBe(nbsp("317,58 €"));
    expect(formatEuros(381_100)).toBe(nbsp("3 811,00 €"));
    expect(formatWholeEuros(1_200_000)).toBe(nbsp("12 000 €"));
  });

  it("preços por litro com 3 casas", () => {
    expect(formatUnitPrice(175.9)).toBe(nbsp("1,759 €"));
    expect(formatUnitPrice(175)).toBe(nbsp("1,750 €"));
  });

  it("datas por extenso e listas com «e»", () => {
    expect(formatDate("2026-11-05")).toBe("5 de novembro de 2026");
    expect(formatList(["manutenção", "pneus", "IUC"])).toBe("manutenção, pneus e IUC");
    expect(formatList(["inspeção"])).toBe("inspeção");
  });

  it("custo por km com 2 casas, e 3 em detalhe", () => {
    expect(formatPerKm(31.7583)).toBe(nbsp("0,32 €"));
    expect(formatPerKm(31.7583, true)).toBe(nbsp("0,318 €"));
  });
});

describe("leitura de números", () => {
  it('aceita "1,85" e "1.85"', () => {
    expect(parseDecimal("1,85")).toBe(1.85);
    expect(parseDecimal("1.85")).toBe(1.85);
  });

  it("num preço por litro, um só separador é decimal, mesmo com 3 casas", () => {
    expect(parseDecimal("1,759")).toBe(1.759);
    expect(parseDecimal("1.759")).toBe(1.759);
    expect(parseUnitPriceToCents("1.759")).toBe(175.9);
  });

  it("em euros e inteiros, um separador seguido de 3 algarismos é de milhares", () => {
    expect(parseEurosToCents("12.000")).toBe(1_200_000);
    expect(parseEurosToCents("12,000")).toBe(1_200_000);
    expect(parseEurosToCents("1.85")).toBe(185);
    expect(parseEurosToCents("1,8")).toBe(180);
    expect(parseInteger("12.000")).toBe(12_000);
    expect(parseInteger("2.019")).toBe(2_019);
  });

  it("espaços e vários separadores contam como milhares", () => {
    expect(parseDecimal("12 000")).toBe(12_000);
    expect(parseDecimal("12.000,50")).toBe(12_000.5);
    expect(parseDecimal("12,000.50")).toBe(12_000.5);
    expect(parseDecimal("1.200.000")).toBe(1_200_000);
    expect(parseDecimal("317,58 €")).toBe(317.58);
  });

  it("recusa o que não é número", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("-5")).toBeNull();
    expect(parseDecimal("1,2,3,4.5.6")).toBeNull();
  });

  it("converte para cêntimos sem erros de arredondamento", () => {
    expect(parseEurosToCents("317,58")).toBe(31_758);
    expect(parseEurosToCents("0,29")).toBe(29);
    expect(parseEurosToCents("12 000")).toBe(1_200_000);
    expect(parseUnitPriceToCents("1,759")).toBe(175.9);
    expect(parseUnitPriceToCents("1.75")).toBe(175);
    expect(parseInteger("12.500,4")).toBe(12_500);
  });
});
