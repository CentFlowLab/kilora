import { assertNonNegative } from "./assert";

export type BreakevenResult =
  | { kind: "km"; kmPerYear: number }
  | { kind: "alternative-always-cheaper" };

/**
 * km* = F / (c_alt − c_var): a partir destes km por ano o carro compensa.
 * Se a alternativa custa por km o mesmo ou menos que o carro, é sempre mais barata.
 */
export function breakevenKm(
  fixedYearCents: number,
  carVariablePerKmCents: number,
  alternativePerKmCents: number,
): BreakevenResult {
  assertNonNegative({ fixedYearCents, carVariablePerKmCents, alternativePerKmCents });
  const margin = alternativePerKmCents - carVariablePerKmCents;
  if (margin <= 0) return { kind: "alternative-always-cheaper" };
  return { kind: "km", kmPerYear: fixedYearCents / margin };
}
