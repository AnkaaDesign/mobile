// Overtime multipliers — Brazilian metallurgical syndicate convention
// (Sindicato dos Metalúrgicos do ABC / SP).
//
// Hourly rate is derived per CLT Art. 64:
//   monthlyDivisor = workdayDecimal × 30
//   hourlyRate     = monthlySalary / monthlyDivisor
//
// rowCost = hourlyRate × hoursDecimal × OVERTIME_MULTIPLIERS[dayType]

export const OVERTIME_DAY_TYPE = {
  WEEKDAY: "WEEKDAY",
  SATURDAY: "SATURDAY",
  SUNDAY_HOLIDAY: "SUNDAY_HOLIDAY",
} as const;

export type OvertimeDayType = (typeof OVERTIME_DAY_TYPE)[keyof typeof OVERTIME_DAY_TYPE];

export const OVERTIME_MULTIPLIERS: Record<OvertimeDayType, number> = {
  WEEKDAY: 1.6,
  SATURDAY: 2.0,
  SUNDAY_HOLIDAY: 2.0,
};

export const OVERTIME_DAY_TYPE_LABELS: Record<OvertimeDayType, string> = {
  WEEKDAY: "Semana",
  SATURDAY: "Sábado",
  SUNDAY_HOLIDAY: "Domingo / Feriado",
};

export const STANDARD_WORKDAY = "08:45";
export const STANDARD_DIVISOR_DAYS = 30;
