const LOCALE = "pt-PT";

function formatter(minimumFractionDigits: number, maximumFractionDigits = minimumFractionDigits) {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: "always",
  });
}

const twoDecimals = formatter(2);
const integer = formatter(0);

/** Espaços dos milhares do Intl (U+00A0 e U+202F) passam a espaço normal sem quebra. */
function normalizeSpaces(text: string): string {
  return text.replace(/[\u202F\u00A0]/g, "\u00A0");
}

/** 31758.33 cêntimos → "317,58 €". */
export function formatEuros(cents: number, fractionDigits = 2): string {
  const value = Math.round(cents) / 100;
  const text = fractionDigits === 2 ? twoDecimals.format(value) : formatter(fractionDigits).format(value);
  return normalizeSpaces(`${text}\u00A0€`);
}

/** Euros sem cêntimos, para valores grandes: "3 811 €". */
export function formatWholeEuros(cents: number): string {
  return normalizeSpaces(`${integer.format(Math.round(cents / 100))}\u00A0€`);
}

/** Custo por km em cêntimos → "0,32 €" (2 casas) ou "0,318 €" em detalhe (3 casas). */
export function formatPerKm(centsPerKm: number, detail = false): string {
  const digits = detail ? 3 : 2;
  return normalizeSpaces(`${formatter(digits).format(centsPerKm / 100)}\u00A0€`);
}

/** Preço por L ou kWh, com 3 casas: 175,9 cêntimos → "1,759 €". */
export function formatUnitPrice(cents: number): string {
  return normalizeSpaces(`${formatter(3).format(cents / 100)}\u00A0€`);
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return normalizeSpaces(formatter(0, fractionDigits).format(value));
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-11-05" → "5 de novembro de 2026". */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

const listFormatter = new Intl.ListFormat(LOCALE, { style: "long", type: "conjunction" });

/** ["manutenção", "pneus", "IUC"] → "manutenção, pneus e IUC". */
export function formatList(items: string[]): string {
  return listFormatter.format(items);
}

/**
 * Lê números escritos à portuguesa ou à inglesa: "1,85", "1.85", "12 000", "12.000,50".
 * Com um só separador, é o decimal (os preços de combustível têm 3 casas: "1.759"), exceto com
 * `threeDigitsAreThousands`: aí "12.000" é doze mil. Serve para euros e inteiros, que nunca têm 3 casas.
 * Com vários, o último é o decimal e os restantes são de milhares. Devolve `null` se não for número.
 */
export function parseDecimal(input: string, { threeDigitsAreThousands = false } = {}): number | null {
  const text = input.trim().replace(/[\s\u00A0\u202F]/g, "").replace(/€$/, "");
  if (!/^\d[\d.,]*$|^[.,]\d+$/.test(text)) return null;

  const separators = text.match(/[.,]/g) ?? [];
  let normalized = text;
  if (separators.length === 1 && threeDigitsAreThousands && /^\d{1,3}[.,]\d{3}$/.test(text)) {
    normalized = text.replace(/[.,]/, "");
  } else if (separators.length === 1) {
    normalized = text.replace(/[.,]/, ".");
  } else if (separators.length > 1) {
    const last = Math.max(text.lastIndexOf("."), text.lastIndexOf(","));
    const lastIsDecimal = separators.filter((s) => s === text[last]).length === 1;
    const integerPart = lastIsDecimal ? text.slice(0, last) : text;
    const decimalPart = lastIsDecimal ? text.slice(last + 1) : "";
    if (!/^\d{1,3}([.,]\d{3})+$/.test(integerPart) || new Set(integerPart.match(/[.,]/g)).size > 1) return null;
    normalized = integerPart.replace(/[.,]/g, "") + (lastIsDecimal ? `.${decimalPart}` : "");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** "317,58" → 31758 cêntimos; "12.000" → 1 200 000 cêntimos. */
export function parseEurosToCents(input: string): number | null {
  const value = parseDecimal(input, { threeDigitsAreThousands: true });
  return value === null ? null : Math.round(value * 100);
}

/** Preço por L ou kWh: "1,759" → 175,9 cêntimos (até décimas de cêntimo). */
export function parseUnitPriceToCents(input: string): number | null {
  const value = parseDecimal(input);
  return value === null ? null : Math.round(value * 1000) / 10;
}

export function parseInteger(input: string): number | null {
  const value = parseDecimal(input, { threeDigitsAreThousands: true });
  return value === null ? null : Math.round(value);
}
