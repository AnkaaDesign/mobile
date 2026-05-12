// Centralized status color tokens for dashboard widgets.
//
// Replaces the hardcoded STATUS_TONES / STOCK_TONES / BUCKET_TONES /
// daily-ponto's `toneFor()` palettes that used to be scattered across widget
// files. Every helper takes the theme's `isDark` flag and returns dark-mode-
// appropriate hues — the previous palettes were tuned for light card
// backgrounds and failed WCAG AA contrast on dark cards.
//
// **Rule:** ZERO raw hexes in this file. Every color is sourced from
// `extendedColors` in `@/lib/theme/extended-colors` so the widget palette
// stays in lockstep with web's Tailwind shades.
//
// Strategy: Tailwind 600/700 on light, Tailwind 400/500 on dark. Foreground
// is always white-on-dark-shade for solid badges (matches web's badgeColors
// convention).
//
// Tone shape: `{ bg, fg, border, dot }`. Most consumers read `bg` for the
// pill/dot color and `fg` for the contrast text on it. `border` is identical
// to `bg` for solid badges (use a darker shade if you want an outline style).
// `dot` aliases `bg` — it exists so callers reading "the dot color of this
// status" don't have to remember which property to pull.

import {
  BORROW_STATUS,
  TASK_STATUS,
  PPE_DELIVERY_STATUS,
  INSTALLMENT_STATUS,
  BANK_SLIP_STATUS,
  TASK_QUOTE_STATUS,
  COMMISSION_STATUS,
  STOCK_LEVEL,
} from "@/constants/enums";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface Tone {
  /** Solid background color of the badge. */
  bg: string;
  /** Foreground (text) color used on top of `bg`. White for solid badges. */
  fg: string;
  /** Border color — same as `bg` for solid badges. */
  border: string;
  /** Convenience alias of `bg` — used when callers want "the dot color of
   *  this status" without having to remember which property to pull. */
  dot: string;
}

// Foreground for every solid badge — sourced from badgeColors so we don't
// hardcode "#ffffff" anywhere.
const BADGE_FG = badgeColors.primary.text;

// Central palette mapping a semantic key to a Tailwind shade for {light,dark}.
// The values are pulled live from `extendedColors`, never inlined.
type PaletteKey =
  | "red"
  | "rose"
  | "orange"
  | "amber"
  | "yellow"
  | "green"
  | "blue"
  | "cyan"
  | "indigo"
  | "violet"
  | "gray";

interface PaletteEntry {
  light: string;
  dark: string;
}

const PALETTE: Record<PaletteKey, PaletteEntry> = {
  red: { light: extendedColors.red[700], dark: extendedColors.red[500] },
  // "rose" is our severity-elevated red — darker on light, slightly more
  // saturated on dark. Kept distinct so PPE rejection / lost-borrow show
  // visibly worse than plain "error".
  rose: { light: extendedColors.red[900], dark: extendedColors.red[600] },
  orange: { light: extendedColors.orange[600], dark: extendedColors.orange[400] },
  amber: { light: extendedColors.amber[600], dark: extendedColors.amber[500] },
  yellow: { light: extendedColors.yellow[600], dark: extendedColors.yellow[400] },
  green: { light: extendedColors.green[700], dark: extendedColors.green[500] },
  blue: { light: extendedColors.blue[700], dark: extendedColors.blue[500] },
  cyan: { light: extendedColors.teal[600], dark: extendedColors.teal[400] },
  indigo: { light: extendedColors.indigo[600], dark: extendedColors.indigo[500] },
  // "violet" maps to Tailwind `purple` (we don't have a separate violet scale
  // in `extendedColors`) — purple-600/500 are the closest to web's violet.
  violet: { light: extendedColors.purple[600], dark: extendedColors.purple[500] },
  gray: { light: extendedColors.gray[500], dark: extendedColors.gray[400] },
};

function tone(key: PaletteKey, isDark: boolean): Tone {
  const c = PALETTE[key][isDark ? "dark" : "light"];
  return { bg: c, fg: BADGE_FG, border: c, dot: c };
}

const NEUTRAL: Tone = {
  bg: extendedColors.gray[500],
  fg: BADGE_FG,
  border: extendedColors.gray[500],
  dot: extendedColors.gray[500],
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

// ---------- Bank slip (financial — boleto issuance pipeline) ----------

export function toneForBankSlipStatus(
  status: BANK_SLIP_STATUS,
  isDark: boolean,
): Tone {
  switch (status) {
    case BANK_SLIP_STATUS.CREATING:
    case BANK_SLIP_STATUS.REGISTERING:
      return tone("amber", isDark);
    case BANK_SLIP_STATUS.ACTIVE:
      return tone("blue", isDark);
    case BANK_SLIP_STATUS.PAID:
      return tone("green", isDark);
    case BANK_SLIP_STATUS.OVERDUE:
      return tone("red", isDark);
    case BANK_SLIP_STATUS.CANCELLED:
      return tone("gray", isDark);
    case BANK_SLIP_STATUS.REJECTED:
    case BANK_SLIP_STATUS.ERROR:
      return tone("rose", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Task quote (financial — quote approval pipeline) ----------

export function toneForTaskQuoteStatus(
  status: TASK_QUOTE_STATUS,
  isDark: boolean,
): Tone {
  switch (status) {
    case TASK_QUOTE_STATUS.PENDING:
      return tone("amber", isDark);
    case TASK_QUOTE_STATUS.BUDGET_APPROVED:
    case TASK_QUOTE_STATUS.COMMERCIAL_APPROVED:
    case TASK_QUOTE_STATUS.BILLING_APPROVED:
      return tone("blue", isDark);
    case TASK_QUOTE_STATUS.UPCOMING:
      return tone("indigo", isDark);
    case TASK_QUOTE_STATUS.DUE:
      return tone("orange", isDark);
    case TASK_QUOTE_STATUS.PARTIAL:
      return tone("yellow", isDark);
    case TASK_QUOTE_STATUS.SETTLED:
      return tone("green", isDark);
    default:
      return NEUTRAL;
  }
}

// ---------- Commission (production — billing commission tier) ----------

export function toneForCommissionStatus(
  status: COMMISSION_STATUS,
  isDark: boolean,
): Tone {
  switch (status) {
    case COMMISSION_STATUS.NO_COMMISSION:
      return tone("gray", isDark);
    case COMMISSION_STATUS.PARTIAL_COMMISSION:
      return tone("amber", isDark);
    case COMMISSION_STATUS.FULL_COMMISSION:
      return tone("green", isDark);
    case COMMISSION_STATUS.SUSPENDED_COMMISSION:
      return tone("red", isDark);
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

// Bucket type lives in installment-table.tsx; use a string literal to avoid a
// circular import between this file and the widget.
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
