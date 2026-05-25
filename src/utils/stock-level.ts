// Mobile mirror of the API stock-level classifier (algorithm-spec §15).
// The API is authoritative — components should prefer the `stockLevel` field
// returned by endpoints. This utility exists for client-side ad-hoc renders
// (cards, badges, list previews) where a fresh classification is needed
// against locally edited quantity values.

import { ITEM_CATEGORY_TYPE, STOCK_LEVEL } from "../constants";

/** LOW band upper bound = reorderPoint × this multiplier (spec §15.1). */
const STOCK_LEVEL_LOW_MULTIPLIER = 1.2;

/**
 * Spec §15 band classifier. Active pending orders do NOT shift thresholds —
 * surface a "pedido em aberto" badge separately in the UI instead.
 *
 * The legacy 4th positional `hasActiveOrder` argument is accepted but ignored
 * to keep existing callers compiling. Pass `categoryType` to enable the TOOL
 * short-circuit (spec §15.2).
 *
 * @param quantity Current stock quantity
 * @param reorderPoint Minimum stock level that triggers reorder (null if not configured)
 * @param maxQuantity Maximum stock level (null if not configured)
 * @param _hasActiveOrder IGNORED — kept for backward compatibility. Render
 *   pending-order state as a separate UI overlay.
 * @param categoryType When `ITEM_CATEGORY_TYPE.TOOL`, qty > 0 always returns OPTIMAL
 * @param incomingOrderedQuantity Quantity already on open orders. CRITICAL/LOW
 *   bands classify on "effective stock" (quantity + incoming) so an item with a
 *   pending order is not flagged critical; OVERSTOCKED still uses physical qty.
 * @returns The appropriate stock level
 */
export function determineStockLevel(
  quantity: number,
  reorderPoint: number | null,
  maxQuantity: number | null,
  _hasActiveOrder: boolean = false,
  categoryType: ITEM_CATEGORY_TYPE | null = null,
  incomingOrderedQuantity: number = 0,
): STOCK_LEVEL {
  if (!Number.isFinite(quantity)) return STOCK_LEVEL.OPTIMAL;

  if (categoryType === ITEM_CATEGORY_TYPE.TOOL) {
    return quantity > 0 ? STOCK_LEVEL.OPTIMAL : STOCK_LEVEL.OUT_OF_STOCK;
  }

  if (quantity < 0) return STOCK_LEVEL.NEGATIVE_STOCK;
  if (quantity === 0) return STOCK_LEVEL.OUT_OF_STOCK;

  // No signal yet (mc=0 → rp=0 and max=0): can't classify CRITICAL/LOW/OVERSTOCKED.
  const hasReorderSignal = reorderPoint !== null && reorderPoint > 0;
  const hasMaxSignal = maxQuantity !== null && maxQuantity > 0;
  if (!hasReorderSignal && !hasMaxSignal) return STOCK_LEVEL.OPTIMAL;

  // Effective stock counts open orders toward the reorder bands (spec §15.1).
  const incoming = Math.max(0, incomingOrderedQuantity || 0);
  const effective = quantity + incoming;

  if (hasReorderSignal && effective <= (reorderPoint as number)) return STOCK_LEVEL.CRITICAL;
  if (
    hasReorderSignal &&
    effective <= (reorderPoint as number) * STOCK_LEVEL_LOW_MULTIPLIER
  )
    return STOCK_LEVEL.LOW;
  // OVERSTOCKED stays on physical quantity (incoming not yet received).
  if (hasMaxSignal && quantity > (maxQuantity as number)) return STOCK_LEVEL.OVERSTOCKED;
  return STOCK_LEVEL.OPTIMAL;
}

/**
 * Returns the Tailwind CSS color class for a given stock level
 * @param level The stock level
 * @returns Tailwind color class
 */
export function getStockLevelColor(level: STOCK_LEVEL): string {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return "text-red-700 bg-red-100";
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "text-red-600 bg-red-50";
    case STOCK_LEVEL.CRITICAL:
      return "text-orange-600 bg-orange-50";
    case STOCK_LEVEL.LOW:
      return "text-yellow-600 bg-yellow-50";
    case STOCK_LEVEL.OPTIMAL:
      return "text-green-600 bg-green-50";
    case STOCK_LEVEL.OVERSTOCKED:
      return "text-blue-600 bg-blue-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Returns only the text color class for a given stock level (without background)
 * @param level The stock level
 * @returns Tailwind text color class
 */
export function getStockLevelTextColor(level: STOCK_LEVEL): string {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return "text-neutral-500";
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "text-red-600";
    case STOCK_LEVEL.CRITICAL:
      return "text-orange-500";
    case STOCK_LEVEL.LOW:
      return "text-yellow-500";
    case STOCK_LEVEL.OPTIMAL:
      return "text-green-600";
    case STOCK_LEVEL.OVERSTOCKED:
      return "text-purple-600";
    default:
      return "text-neutral-500";
  }
}

/**
 * Returns icon information for a given stock level
 * @param level The stock level
 * @returns Object with icon name and rotation
 */
export function getStockLevelIcon(level: STOCK_LEVEL): { name: string; rotation?: number } {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return { name: "exclamation-triangle", rotation: 0 };
    case STOCK_LEVEL.OUT_OF_STOCK:
      return { name: "package-off", rotation: 0 };
    case STOCK_LEVEL.CRITICAL:
      return { name: "alert-circle", rotation: 0 };
    case STOCK_LEVEL.LOW:
      return { name: "trending-down", rotation: 0 };
    case STOCK_LEVEL.OPTIMAL:
      return { name: "check-circle", rotation: 0 };
    case STOCK_LEVEL.OVERSTOCKED:
      return { name: "trending-up", rotation: 0 };
    default:
      return { name: "help-circle", rotation: 0 };
  }
}

/**
 * Checks if the stock level is in a healthy state
 * @param level The stock level
 * @returns true if stock is healthy (OPTIMAL or OVERSTOCKED)
 */
export function isStockHealthy(level: STOCK_LEVEL): boolean {
  return level === STOCK_LEVEL.OPTIMAL || level === STOCK_LEVEL.OVERSTOCKED;
}

/**
 * Gets the priority level based on stock level (for sorting or alerts)
 * @param level The stock level
 * @returns Priority number (lower is more urgent)
 */
export function getStockLevelPriority(level: STOCK_LEVEL): number {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return 1;
    case STOCK_LEVEL.OUT_OF_STOCK:
      return 2;
    case STOCK_LEVEL.CRITICAL:
      return 3;
    case STOCK_LEVEL.LOW:
      return 4;
    case STOCK_LEVEL.OPTIMAL:
      return 5;
    case STOCK_LEVEL.OVERSTOCKED:
      return 6;
    default:
      return 999;
  }
}

/**
 * Alias for determineStockLevel for backwards compatibility
 * @deprecated Use determineStockLevel instead
 */
export const getStockLevel = determineStockLevel;

/**
 * Gets a descriptive message for the stock level
 * @param level The stock level
 * @param quantity The current quantity
 * @param reorderPoint The reorder point (if configured)
 * @returns A descriptive message in Portuguese
 */
export function getStockLevelMessage(level: STOCK_LEVEL, quantity: number, reorderPoint: number | null): string {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return `Estoque negativo (${quantity}). Verifique possíveis erros de lançamento.`;
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "Item sem estoque. Necessário reposição urgente.";
    case STOCK_LEVEL.CRITICAL:
      return reorderPoint !== null
        ? `Estoque crítico. Quantidade (${quantity}) está em ou abaixo do ponto de pedido (${reorderPoint}).`
        : `Estoque crítico com ${quantity} unidades.`;
    case STOCK_LEVEL.LOW:
      return reorderPoint !== null
        ? `Estoque baixo. Quantidade (${quantity}) está logo acima do ponto de pedido (${reorderPoint}).`
        : `Estoque baixo com ${quantity} unidades.`;
    case STOCK_LEVEL.OPTIMAL:
      return `Estoque em nível adequado com ${quantity} unidades.`;
    case STOCK_LEVEL.OVERSTOCKED:
      return `Excesso de estoque com ${quantity} unidades. Considere revisar os níveis máximos.`;
    default:
      return `Nível de estoque desconhecido.`;
  }
}
