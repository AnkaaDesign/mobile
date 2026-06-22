// Férias (Departamento Pessoal) — Part C. Mobile-side display/validation helpers.
// These mirror the api business rules for preview purposes only; the API remains
// the source of truth (it recomputes entitledDays + validates periods on write).

import { VACATION_STATUS } from "@/constants/enums";

/**
 * Art. 130 CLT scale — entitled vacation days by number of unjustified
 * absences in the período aquisitivo.
 *   0–5  → 30 | 6–14 → 24 | 15–23 → 18 | 24–32 → 12 | >32 → 0
 */
export function entitledDaysForAbsences(absences: number): number {
  const a = Math.max(0, Math.floor(absences || 0));
  if (a <= 5) return 30;
  if (a <= 14) return 24;
  if (a <= 23) return 18;
  if (a <= 32) return 12;
  return 0;
}

/** Days until concessivo expiry (art. 137). Negative → expired. null → no date. */
export function daysUntilConcessiveEnd(concessiveEnd?: Date | string | null): number | null {
  if (!concessiveEnd) return null;
  const end = new Date(concessiveEnd);
  if (isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export type VacationExpiryLevel = "expired" | "expiring" | "ok" | null;

/** Concessivo expiry alert level. PAID vacations never alert. */
export function concessiveExpiryLevel(args: {
  concessiveEnd?: Date | string | null;
  status?: VACATION_STATUS;
}): VacationExpiryLevel {
  if (args.status === VACATION_STATUS.PAID) return null;
  const days = daysUntilConcessiveEnd(args.concessiveEnd);
  if (days === null) return null;
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "ok";
}

const FINAL_STATUSES: VACATION_STATUS[] = [VACATION_STATUS.PAID, VACATION_STATUS.EXPIRED];

/** A vacation in a terminal state (PAID / EXPIRED). Mirrors web. */
export function isVacationFinal(v: { status: VACATION_STATUS }): boolean {
  return FINAL_STATUSES.includes(v.status);
}

/**
 * Concessivo already expired (art. 137) — vacation owed in dobro. Mirrors web
 * `isConcessiveExpired`: true when isDouble, when status === EXPIRED, or when the
 * concessivo date is past (and not yet finalized).
 */
export function isConcessiveExpired(v: { concessiveEnd?: Date | string | null; status: VACATION_STATUS; isDouble?: boolean }): boolean {
  if (v.isDouble) return true;
  if (v.status === VACATION_STATUS.EXPIRED) return true;
  if (isVacationFinal(v)) return false;
  const days = daysUntilConcessiveEnd(v.concessiveEnd);
  return days !== null && days < 0;
}

/**
 * Concessivo expiring soon (≤60 dias) but not yet expired/finalized. Mirrors web
 * `isConcessiveExpiringSoon`.
 */
export function isConcessiveExpiringSoon(v: { concessiveEnd?: Date | string | null; status: VACATION_STATUS; isDouble?: boolean }): boolean {
  if (isVacationFinal(v)) return false;
  if (v.isDouble) return false;
  const days = daysUntilConcessiveEnd(v.concessiveEnd);
  return days !== null && days >= 0 && days <= 60;
}

/**
 * Centralized vacation status → Badge variant color map.
 * SCHEDULED = warning/amber, PAID = success/green, EXPIRED = error/red.
 */
export const VACATION_STATUS_VARIANTS: Record<VACATION_STATUS, string> = {
  [VACATION_STATUS.SCHEDULED]: "warning",
  [VACATION_STATUS.PAID]: "success",
  [VACATION_STATUS.EXPIRED]: "error",
};

/** Maps a vacation status to a Badge variant (no VACATION entry in getBadgeVariant). */
export function vacationStatusVariant(status: VACATION_STATUS): string {
  return VACATION_STATUS_VARIANTS[status] ?? "default";
}

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * "Em gozo" — computed display state (never stored). True when the vacation is
 * SCHEDULED and today falls within [startDate, startDate + days - 1].
 */
export function isVacationInProgress(v: {
  status: VACATION_STATUS;
  startDate?: Date | string | null;
  days?: number | null;
}): boolean {
  if (v.status !== VACATION_STATUS.SCHEDULED || !v.startDate) return false;
  const start = new Date(v.startDate);
  if (isNaN(start.getTime())) return false;
  const days = v.days ?? 0;
  if (days <= 0) return false;
  const today = startOfDay(new Date());
  const gozoStart = startOfDay(start);
  const gozoEnd = startOfDay(new Date(gozoStart.getTime() + (days - 1) * 24 * 60 * 60 * 1000));
  return today >= gozoStart && today <= gozoEnd;
}
