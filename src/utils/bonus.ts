// mobile/src/utils/bonus.ts
//
// Bonus PERIOD helpers only. The bonus VALUE algorithm lives exclusively on the
// API (salary-based logistic model — BonusCalculationService, v2-logistic). The
// mobile app must NEVER compute bonuses, discounts, or payroll values on the
// client: the simulators POST to /bonus/simulate and /bonuses/my-bonus-simulate,
// and every other screen displays the server-provided baseBonus / netBonus.
//
// The legacy Excel "position-cascade" bonus formula and the client-side
// discount/payroll calculators that used to live here were removed so there is
// exactly one bonus algorithm across api, web, and mobile.

/**
 * Start date of a bonus/payroll period (day 26 of the previous month).
 * Period runs from the 26th of the previous month to the 25th of the current.
 * @returns Start date at 00:00:00.000 local time.
 */
export function getBonusPeriodStart(year: number, month: number): Date {
  if (month === 1) {
    return new Date(year - 1, 11, 26, 0, 0, 0, 0); // Dec 26 of previous year local
  }
  return new Date(year, month - 2, 26, 0, 0, 0, 0); // Day 26 of previous month local
}

/**
 * End date of a bonus/payroll period (day 25 of the current month).
 * @returns End date at 23:59:59.999 local time.
 */
export function getBonusPeriodEnd(year: number, month: number): Date {
  return new Date(year, month - 1, 25, 23, 59, 59, 999); // Day 25 of current month local
}

/**
 * Bonus/payroll period dates (26th of previous month → 25th of current month).
 */
export function getBonusPeriod(year: number, month: number): { startDate: Date; endDate: Date } {
  return {
    startDate: getBonusPeriodStart(year, month),
    endDate: getBonusPeriodEnd(year, month),
  };
}
