/**
 * Pure math helpers for the Paint Mix Calculator.
 *
 * Side-effect free. No I/O. Safe to unit-test.
 *
 * Pricing assumption: Item prices are stored in BRL per LITER. The mix
 * calculator scales each component proportionally based on its part-ratio
 * relative to the sum of all part-ratios.
 */

export interface SlotInput {
  /** User-defined parts (e.g. 3 for varnish, 1 for catalyst). */
  ratio: number;
  /** BRL per liter for the chosen item, or null if not selected / no price. */
  pricePerLiter: number | null;
}

export interface SlotResult {
  /** Volume in liters (rounded to 3 decimals). */
  volumeLiters: number;
  /** Volume in milliliters (rounded to integer). */
  volumeMl: number;
  /** Cost in BRL (null if pricePerLiter is null). */
  cost: number | null;
}

/**
 * Round to N decimal places using round-half-away-from-zero.
 */
function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Compute per-slot volumes and costs for a target total volume.
 *
 * Edge cases:
 * - Sum of ratios <= 0: every slot returns zero volume / zero cost.
 * - Negative ratios are clamped to 0 (treated as "no parts").
 * - Negative target volume is clamped to 0.
 * - When pricePerLiter is null, the slot's `cost` is null (incomplete cost).
 */
export function computeSlotVolumes(
  slots: SlotInput[],
  totalLiters: number,
): SlotResult[] {
  const safeTotal = Number.isFinite(totalLiters) && totalLiters > 0 ? totalLiters : 0;
  const safeRatios = slots.map((s) =>
    Number.isFinite(s.ratio) && s.ratio > 0 ? s.ratio : 0,
  );
  const totalRatio = safeRatios.reduce((sum, r) => sum + r, 0);

  if (totalRatio <= 0 || safeTotal <= 0) {
    return slots.map(() => ({ volumeLiters: 0, volumeMl: 0, cost: 0 }));
  }

  return slots.map((slot, idx) => {
    const fraction = safeRatios[idx] / totalRatio;
    const liters = safeTotal * fraction;
    const ml = liters * 1000;
    const cost =
      slot.pricePerLiter == null || !Number.isFinite(slot.pricePerLiter)
        ? null
        : roundTo(liters * slot.pricePerLiter, 2);

    return {
      volumeLiters: roundTo(liters, 3),
      volumeMl: Math.round(ml),
      cost,
    };
  });
}

/**
 * Sum of all slot costs.
 *
 * Returns null if ANY slot cost is null (i.e. the cost is incomplete because
 * an item is unselected or has no current price).
 */
export function computeTotalCost(results: SlotResult[]): number | null {
  if (results.length === 0) return 0;
  let total = 0;
  for (const r of results) {
    if (r.cost == null) return null;
    total += r.cost;
  }
  return roundTo(total, 2);
}

/**
 * Cost per liter of the resulting mix.
 *
 * Returns null when total cost is null or total volume is zero.
 */
export function computeCostPerLiter(
  totalCost: number | null,
  totalLiters: number,
): number | null {
  if (totalCost == null) return null;
  if (!Number.isFinite(totalLiters) || totalLiters <= 0) return null;
  return roundTo(totalCost / totalLiters, 2);
}
