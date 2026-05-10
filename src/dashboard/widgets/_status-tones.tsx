// Centralized status color tokens for dashboard widgets.
//
// Replaces hardcoded STATUS_TONES / STOCK_TONES / BUCKET_TONES /
// daily-ponto's toneFor() palettes scattered across widget files. Every
// helper takes the theme's `isDark` flag and returns dark-mode-appropriate
// hues — the previous palettes were tuned for light card backgrounds and
// failed WCAG AA contrast on dark cards.
//
// Strategy: Tailwind 600/700 on light, Tailwind 400/500 on dark. Foreground
// is always white-on-dark-shade to keep contrast simple.

import {
  BORROW_STATUS,
  TASK_STATUS,
  PPE_DELIVERY_STATUS,
  INSTALLMENT_STATUS,
  STOCK_LEVEL,
} from "@/constants/enums";

export interface Tone {
  bg: string;
  fg: string;
  border: string;
}

const WHITE = "#ffffff";

// Central palette. Each row is { light, dark } — "light" used when isDark=false,
// "dark" used when isDark=true. Foreground is always white for solid badges.
const PALETTE = {
  red:    { light: "#b91c1c", dark: "#ef4444" }, // red-700  / red-500
  rose:   { light: "#7f1d1d", dark: "#dc2626" }, // red-900  / red-600  (severe)
  orange: { light: "#ea580c", dark: "#fb923c" }, // orange-600 / orange-400
  amber:  { light: "#d97706", dark: "#f59e0b" }, // amber-600 / amber-500
  yellow: { light: "#ca8a04", dark: "#facc15" }, // yellow-600 / yellow-400
  green:  { light: "#15803d", dark: "#22c55e" }, // green-700 / green-500
  blue:   { light: "#1d4ed8", dark: "#3b82f6" }, // blue-700  / blue-500
  cyan:   { light: "#0891b2", dark: "#22d3ee" }, // cyan-600  / cyan-400
  indigo: { light: "#4f46e5", dark: "#6366f1" }, // indigo-600 / indigo-500
  violet: { light: "#7c3aed", dark: "#8b5cf6" }, // violet-600 / violet-500
  gray:   { light: "#6b7280", dark: "#9ca3af" }, // gray-500  / gray-400
} as const;

type PaletteKey = keyof typeof PALETTE;

function tone(key: PaletteKey, isDark: boolean): Tone {
  const c = PALETTE[key][isDark ? "dark" : "light"];
  return { bg: c, fg: WHITE, border: c };
}

const NEUTRAL: Tone = {
  bg: "#737373",
  fg: WHITE,
  border: "#737373",
};

// ---------- Borrow (loan tracking) ----------

export function toneForBorrowStatus(status: BORROW_STATUS, isDark: boolean): Tone {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return tone("blue", isDark);
    case BORROW_STATUS.RETURNED:
      return tone("green", isDark);
    case BORROW_STATUS.OVERDUE:
      return tone("red", isDark);
    case BORROW_STATUS.LOST:
      return tone("rose", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Task (production) ----------

export function toneForTaskStatus(status: TASK_STATUS, isDark: boolean): Tone {
  switch (status) {
    case TASK_STATUS.PREPARATION:
      return tone("orange", isDark);
    case TASK_STATUS.WAITING_PRODUCTION:
      return tone("gray", isDark);
    case TASK_STATUS.IN_PRODUCTION:
      return tone("blue", isDark);
    case TASK_STATUS.COMPLETED:
      return tone("green", isDark);
    case TASK_STATUS.CANCELLED:
      return tone("red", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- PPE delivery (HR) ----------

export function toneForPpeDeliveryStatus(
  status: PPE_DELIVERY_STATUS,
  isDark: boolean,
): Tone {
  switch (status) {
    case PPE_DELIVERY_STATUS.PENDING:
      return tone("amber", isDark);
    case PPE_DELIVERY_STATUS.APPROVED:
      return tone("blue", isDark);
    case PPE_DELIVERY_STATUS.WAITING_SIGNATURE:
      return tone("orange", isDark);
    case PPE_DELIVERY_STATUS.DELIVERED:
      return tone("cyan", isDark);
    case PPE_DELIVERY_STATUS.COMPLETED:
      return tone("green", isDark);
    case PPE_DELIVERY_STATUS.REPROVED:
    case PPE_DELIVERY_STATUS.SIGNATURE_REJECTED:
      return tone("red", isDark);
    case PPE_DELIVERY_STATUS.CANCELLED:
      return tone("gray", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Installment (financial) ----------

export function toneForInstallmentStatus(
  status: INSTALLMENT_STATUS,
  isDark: boolean,
): Tone {
  switch (status) {
    case INSTALLMENT_STATUS.PENDING:
      return tone("amber", isDark);
    case INSTALLMENT_STATUS.PROCESSING:
      return tone("blue", isDark);
    case INSTALLMENT_STATUS.PAID:
      return tone("green", isDark);
    case INSTALLMENT_STATUS.OVERDUE:
      return tone("red", isDark);
    case INSTALLMENT_STATUS.CANCELLED:
      return tone("gray", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Stock level (inventory) ----------

export function toneForStockLevel(level: STOCK_LEVEL, isDark: boolean): Tone {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return tone("rose", isDark);
    case STOCK_LEVEL.OUT_OF_STOCK:
      return tone("red", isDark);
    case STOCK_LEVEL.CRITICAL:
      return tone("red", isDark);
    case STOCK_LEVEL.LOW:
      return tone("amber", isDark);
    case STOCK_LEVEL.OPTIMAL:
      return tone("green", isDark);
    case STOCK_LEVEL.OVERSTOCKED:
      return tone("blue", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Installment-table buckets (due-date filter chips) ----------

// Bucket type lives in installment-table.tsx; use string literal to avoid
// a circular import between this file and the widget.
export type InstallmentBucket =
  | "all"
  | "overdue"
  | "today"
  | "tomorrow"
  | "next-7-days"
  | "next-30-days"
  | "this-month";

export function toneForBucket(bucket: InstallmentBucket, isDark: boolean): Tone {
  switch (bucket) {
    case "all":
      return tone("gray", isDark);
    case "overdue":
      return tone("red", isDark);
    case "today":
      return tone("orange", isDark);
    case "tomorrow":
      return tone("amber", isDark);
    case "next-7-days":
      return tone("yellow", isDark);
    case "next-30-days":
      return tone("blue", isDark);
    case "this-month":
      return tone("indigo", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Daily-ponto category labels ----------

// Secullum returns category titles like "Faltas", "Atrasos", "Horas Extras",
// etc. Map by substring match — the API isn't typed, so a switch on enum is
// not possible. Order matters: more specific keywords first.
export function toneForPontoCategory(title: string, isDark: boolean): Tone {
  const t = title.toLowerCase();
  if (t.includes("falta")) return tone("red", isDark);
  if (t.includes("atras")) return tone("amber", isDark);
  if (t.includes("hora extra") || t.includes("ext")) return tone("blue", isDark);
  if (t.includes("present") || t.includes("trabalh")) return tone("green", isDark);
  if (t.includes("férias") || t.includes("ferias") || t.includes("ausê")) {
    return tone("violet", isDark);
  }
  if (t.includes("compens")) return tone("cyan", isDark);
  return tone("gray", isDark);
}
