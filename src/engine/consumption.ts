import { exceeds } from "./assert";
import { DEFAULTS } from "./rules";

export interface Fill {
  odometer: number;
  /** Litros ou kWh. */
  quantity: number;
  fullTank: boolean;
}

export interface ConsumptionSegment {
  fromOdometer: number;
  toOdometer: number;
  distanceKm: number;
  quantity: number;
  /** L/100 km ou kWh/100 km. */
  per100: number;
}

/**
 * Consumo de depósito cheio a depósito cheio. Os enchimentos chegam por ordem cronológica.
 * O primeiro cheio só serve de partida; parciais somam ao segmento seguinte.
 * Parciais antes do primeiro cheio não contam para o consumo.
 */
export function consumptionSegments(fills: readonly Fill[]): ConsumptionSegment[] {
  const segments: ConsumptionSegment[] = [];
  let lastFullOdometer: number | undefined;
  let pending = 0;
  let previousOdometer: number | undefined;

  for (const fill of fills) {
    if (!Number.isFinite(fill.quantity) || fill.quantity <= 0) {
      throw new RangeError(`Quantidade inválida aos ${fill.odometer} km: ${fill.quantity}`);
    }
    if (previousOdometer !== undefined && fill.odometer < previousOdometer) {
      throw new RangeError(
        `Os quilómetros (${fill.odometer}) são menores que os do registo anterior (${previousOdometer})`,
      );
    }
    previousOdometer = fill.odometer;

    if (lastFullOdometer === undefined) {
      if (fill.fullTank) lastFullOdometer = fill.odometer;
      continue;
    }

    pending += fill.quantity;
    if (!fill.fullTank) continue;

    const distanceKm = fill.odometer - lastFullOdometer;
    if (distanceKm > 0) {
      segments.push({
        fromOdometer: lastFullOdometer,
        toOdometer: fill.odometer,
        distanceKm,
        quantity: pending,
        per100: (pending / distanceKm) * 100,
      });
    }
    lastFullOdometer = fill.odometer;
    pending = 0;
  }

  return segments;
}

/** Média ponderada pelos km dos últimos `count` segmentos. `null` sem segmentos. */
export function averageConsumption(segments: readonly ConsumptionSegment[], count = segments.length): number | null {
  const recent = segments.slice(-count);
  const distance = recent.reduce((sum, s) => sum + s.distanceKm, 0);
  if (distance === 0) return null;
  const quantity = recent.reduce((sum, s) => sum + s.quantity, 0);
  return (quantity / distance) * 100;
}

/** Custo de energia por 100 km, em cêntimos. */
export function costPer100(per100: number, unitPriceCents: number): number {
  return per100 * unitPriceCents;
}

/** Verdadeiro quando o valor se afasta da média mais do que o limiar (40 % por defeito). */
export function isAnomalous(value: number, average: number, thresholdPct: number = DEFAULTS.consumptionAnomalyPct): boolean {
  if (average <= 0) return false;
  return exceeds(Math.abs(value - average) / average, thresholdPct / 100);
}
