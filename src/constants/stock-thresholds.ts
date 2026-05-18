// Render-only constants for the mobile stock surfaces. The API computes
// every threshold (algorithm-spec §15 + nightly batch) — mobile only mirrors
// the band labels and badge colors so list cells line up with the web app.

import { STOCK_LEVEL } from "./enums";

/** Display label per band. Plain Portuguese, no jargon (per UX rule). */
export const STOCK_LEVEL_LABELS: Record<STOCK_LEVEL, string> = {
  [STOCK_LEVEL.NEGATIVE_STOCK]: "Negativo",
  [STOCK_LEVEL.OUT_OF_STOCK]: "Sem estoque",
  [STOCK_LEVEL.CRITICAL]: "Crítico",
  [STOCK_LEVEL.LOW]: "Baixo",
  [STOCK_LEVEL.OPTIMAL]: "Adequado",
  [STOCK_LEVEL.OVERSTOCKED]: "Excesso",
};

/** Badge text colors per band — matches the web `getStockLevelTextColor`. */
export const STOCK_LEVEL_COLORS: Record<STOCK_LEVEL, string> = {
  [STOCK_LEVEL.NEGATIVE_STOCK]: "text-neutral-500",
  [STOCK_LEVEL.OUT_OF_STOCK]: "text-red-600",
  [STOCK_LEVEL.CRITICAL]: "text-orange-500",
  [STOCK_LEVEL.LOW]: "text-yellow-500",
  [STOCK_LEVEL.OPTIMAL]: "text-green-600",
  [STOCK_LEVEL.OVERSTOCKED]: "text-purple-600",
};

/** Sort priority for filter/grouping operations. Lower is more urgent. */
export const STOCK_LEVEL_PRIORITY: Record<STOCK_LEVEL, number> = {
  [STOCK_LEVEL.NEGATIVE_STOCK]: 1,
  [STOCK_LEVEL.OUT_OF_STOCK]: 2,
  [STOCK_LEVEL.CRITICAL]: 3,
  [STOCK_LEVEL.LOW]: 4,
  [STOCK_LEVEL.OPTIMAL]: 5,
  [STOCK_LEVEL.OVERSTOCKED]: 6,
};
