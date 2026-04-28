// Overtime Cost Calculator — pure math utilities (mobile mirror of web).
//
// Brazilian context: a "remuneration" stored on `Position.monetaryValues`
// (or the deprecated `position.remunerations`) represents a MONTHLY salary.
//
// Per CLT Art. 64 the hourly rate is:
//   monthlyDivisor = workdayDecimal × 30
//   hourlyRate     = monthlySalary / monthlyDivisor
//
// Overtime cost per row is then:
//   rowCost = hourlyRate × hoursDecimal × OVERTIME_MULTIPLIERS[dayType]
//
// Multipliers follow the Sindicato dos Metalúrgicos convention:
//   WEEKDAY        → 1.60×
//   SATURDAY       → 2.00×
//   SUNDAY_HOLIDAY → 2.00×

import {
  OVERTIME_MULTIPLIERS,
  STANDARD_DIVISOR_DAYS,
  type OvertimeDayType,
} from "@/constants/overtime-multipliers";

/**
 * Parse a "HH:MM" string (e.g. "08:45", "1:30") into decimal hours.
 * Returns null when the input does not match the mask.
 */
export function parseHHMMtoDecimal(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours + minutes / 60;
}

/**
 * Build the CLT Art. 64 monthly divisor: workday × 30.
 */
export function getMonthlyDivisor(workdayDecimal: number): number {
  if (!Number.isFinite(workdayDecimal) || workdayDecimal <= 0) return 0;
  return workdayDecimal * STANDARD_DIVISOR_DAYS;
}

/**
 * Hourly rate derived from a monthly salary and a daily workday (decimal hours).
 */
export function getHourlyRate(monthlySalary: number, workdayDecimal: number): number {
  const div = getMonthlyDivisor(workdayDecimal);
  if (div === 0) return 0;
  return monthlySalary / div;
}

/**
 * Resolve the effective MONTHLY salary (R$/mês) for a position.
 *
 * Priority (mirrors web):
 *   1. monetaryValues entry with `current === true`
 *   2. monetaryValues[0]
 *   3. remunerations entry with `current === true` (legacy)
 *   4. remunerations[0]
 *   5. otherwise null
 */
export function getPositionMonthlySalary(position: any): number | null {
  if (!position) return null;

  const monetary = (position.monetaryValues ?? []) as Array<{ current?: boolean; value?: number }>;
  if (monetary.length > 0) {
    const current = monetary.find((m) => m?.current);
    if (current && typeof current.value === "number") return current.value;
    const first = monetary[0];
    if (first && typeof first.value === "number") return first.value;
  }

  const legacy = (position.remunerations ?? []) as Array<{ current?: boolean; value?: number }>;
  if (legacy.length > 0) {
    const current = legacy.find((r) => r?.current);
    if (current && typeof current.value === "number") return current.value;
    const first = legacy[0];
    if (first && typeof first.value === "number") return first.value;
  }

  return null;
}

/**
 * Compute the overtime cost for a single row.
 * Returns null when any required input is missing/invalid.
 */
export function computeOvertimeRowCost(args: {
  monthlySalary: number | null;
  workdayDecimal: number;
  hoursDecimal: number;
  dayType: OvertimeDayType;
}): number | null {
  if (args.monthlySalary == null || !Number.isFinite(args.monthlySalary) || args.monthlySalary <= 0) {
    return null;
  }
  if (!Number.isFinite(args.hoursDecimal) || args.hoursDecimal <= 0) return null;
  if (!Number.isFinite(args.workdayDecimal) || args.workdayDecimal <= 0) return null;

  const hourly = getHourlyRate(args.monthlySalary, args.workdayDecimal);
  const multiplier = OVERTIME_MULTIPLIERS[args.dayType];
  if (!Number.isFinite(hourly) || hourly <= 0) return null;
  if (!Number.isFinite(multiplier) || multiplier <= 0) return null;

  return hourly * args.hoursDecimal * multiplier;
}

/**
 * Sum of all valid (non-null, finite) row costs.
 */
export function computeTotalOvertimeCost(rowCosts: Array<number | null>): number {
  return rowCosts.reduce<number>((acc, cost) => {
    if (cost === null || !Number.isFinite(cost)) return acc;
    return acc + cost;
  }, 0);
}
