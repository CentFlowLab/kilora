/** `share > limit` sem falsos positivos por arredondamento quando a parte é exatamente o limite. */
export function exceeds(share: number, limit: number): boolean {
  return share - limit > 1e-9;
}

export function assertNonNegative(values: Record<string, number | undefined>): void {
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`Valor inválido em ${name}: ${value}`);
    }
  }
}
