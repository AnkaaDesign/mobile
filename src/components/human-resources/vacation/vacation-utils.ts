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

/** Maps a vacation status to a Badge variant (no VACATION entry in getBadgeVariant). */
export function vacationStatusVariant(status: VACATION_STATUS): string {
  switch (status) {
    case VACATION_STATUS.OPEN:
      return "pending";
    case VACATION_STATUS.SCHEDULED:
      return "inProgress";
    case VACATION_STATUS.IN_PROGRESS:
      return "active";
    case VACATION_STATUS.PAID:
      return "completed";
    case VACATION_STATUS.EXPIRED:
      return "expired";
    default:
      return "default";
  }
}
