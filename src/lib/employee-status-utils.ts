import { USER_STATUS } from "@/constants";

/**
 * Interface for time duration breakdown
 */
export interface TimeDuration {
  years: number;
  months: number;
  days: number;
}

/**
 * Calculates the difference between two dates in years, months, and days
 * @param startDate - The start date
 * @param endDate - The end date (defaults to current date)
 * @returns Object with years, months, and days
 */
export function calculateTimeDuration(startDate: Date, endDate: Date = new Date()): TimeDuration {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Adjust for negative days
  if (days < 0) {
    months--;
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += previousMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Calculates the number of days remaining until a target date
 * @param targetDate - The target date
 * @param fromDate - The date to calculate from (defaults to current date)
 * @returns Number of days remaining (can be negative if past due)
 */
export function calculateDaysRemaining(targetDate: Date, fromDate: Date = new Date()): number {
  const target = new Date(targetDate);
  const from = new Date(fromDate);

  // Reset time to midnight for accurate day calculation
  target.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - from.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Adds a specified number of days to a date
 * @param date - The base date
 * @param days - Number of days to add
 * @returns The new date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a time duration in Portuguese
 * @param duration - The time duration object
 * @param options - Formatting options
 * @returns Formatted string in Portuguese
 */
export function formatDurationInPortuguese(
  duration: TimeDuration,
  options: {
    includeYears?: boolean;
    includeMonths?: boolean;
    includeDays?: boolean;
    compact?: boolean;
  } = {}
): string {
  const {
    includeYears = true,
    includeMonths = true,
    includeDays = true,
    compact = false,
  } = options;

  const parts: string[] = [];

  if (includeYears && duration.years > 0) {
    parts.push(
      compact
        ? `${duration.years}a`
        : `${duration.years} ${duration.years === 1 ? 'ano' : 'anos'}`
    );
  }

  if (includeMonths && duration.months > 0) {
    parts.push(
      compact
        ? `${duration.months}m`
        : `${duration.months} ${duration.months === 1 ? 'mês' : 'meses'}`
    );
  }

  if (includeDays && duration.days > 0) {
    parts.push(
      compact
        ? `${duration.days}d`
        : `${duration.days} ${duration.days === 1 ? 'dia' : 'dias'}`
    );
  }

  if (parts.length === 0) {
    return compact ? '0d' : '0 dias';
  }

  return parts.join(' ');
}

/**
 * Formats days remaining in Portuguese
 * @param days - Number of days
 * @returns Formatted string
 */
export function formatDaysRemainingInPortuguese(days: number): string {
  if (days < 0) {
    const absDays = Math.abs(days);
    return `${absDays} ${absDays === 1 ? 'dia' : 'dias'} atrás`;
  }

  return `${days} ${days === 1 ? 'dia' : 'dias'} restantes`;
}

/**
 * Interface for employee with status dates
 */
export interface EmployeeWithStatusDates {
  status: USER_STATUS;
  admissional: Date | null;
  exp1StartAt: Date | null;
  exp1EndAt: Date | null;
  exp2StartAt: Date | null;
  exp2EndAt: Date | null;
  dismissedAt: Date | null;
}

/**
 * Generates the status text with time information for an employee
 * @param employee - Employee object with status and date fields
 * @returns Status text with time duration/remaining
 */
export function getEmployeeStatusText(employee: EmployeeWithStatusDates): string {
  const now = new Date();

  switch (employee.status) {
    case USER_STATUS.EXPERIENCE_PERIOD_1: {
      if (!employee.exp1StartAt) {
        return 'Experiência 1/2 (45 dias)';
      }

      // Calculate end date (45 days from start)
      const endDate = employee.exp1EndAt || addDays(new Date(employee.exp1StartAt), 45);
      const daysRemaining = calculateDaysRemaining(endDate, now);

      if (daysRemaining < 0) {
        return `Experiência 1/2 (${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'dia' : 'dias'} vencido)`;
      }

      return `Experiência 1/2 (${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes)`;
    }

    case USER_STATUS.EXPERIENCE_PERIOD_2: {
      if (!employee.exp2StartAt) {
        return 'Experiência 2/2 (45 dias)';
      }

      // Calculate end date (45 days from start)
      const endDate = employee.exp2EndAt || addDays(new Date(employee.exp2StartAt), 45);
      const daysRemaining = calculateDaysRemaining(endDate, now);

      if (daysRemaining < 0) {
        return `Experiência 2/2 (${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'dia' : 'dias'} vencido)`;
      }

      return `Experiência 2/2 (${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes)`;
    }

    case USER_STATUS.EFFECTED: {
      if (!employee.admissional) {
        return 'Efetivado';
      }

      const duration = calculateTimeDuration(new Date(employee.admissional), now);
      const formattedDuration = formatDurationInPortuguese(duration);

      return `Efetivado (${formattedDuration})`;
    }

    case USER_STATUS.DISMISSED: {
      if (!employee.dismissedAt) {
        return 'Desligado';
      }

      const duration = calculateTimeDuration(new Date(employee.dismissedAt), now);
      const formattedDuration = formatDurationInPortuguese(duration);

      return `Desligado (${formattedDuration})`;
    }

    default:
      return 'Status desconhecido';
  }
}

/**
 * Gets a shorter version of the status text for compact displays
 * @param employee - Employee object with status and date fields
 * @returns Compact status text
 */
export function getEmployeeStatusTextCompact(employee: EmployeeWithStatusDates): string {
  const now = new Date();

  switch (employee.status) {
    case USER_STATUS.EXPERIENCE_PERIOD_1: {
      if (!employee.exp1StartAt) {
        return 'Exp 1/2';
      }

      const endDate = employee.exp1EndAt || addDays(new Date(employee.exp1StartAt), 45);
      const daysRemaining = calculateDaysRemaining(endDate, now);

      if (daysRemaining < 0) {
        return `Exp 1/2 (${Math.abs(daysRemaining)}d vencido)`;
      }

      return `Exp 1/2 (${daysRemaining}d)`;
    }

    case USER_STATUS.EXPERIENCE_PERIOD_2: {
      if (!employee.exp2StartAt) {
        return 'Exp 2/2';
      }

      const endDate = employee.exp2EndAt || addDays(new Date(employee.exp2StartAt), 45);
      const daysRemaining = calculateDaysRemaining(endDate, now);

      if (daysRemaining < 0) {
        return `Exp 2/2 (${Math.abs(daysRemaining)}d vencido)`;
      }

      return `Exp 2/2 (${daysRemaining}d)`;
    }

    case USER_STATUS.EFFECTED: {
      if (!employee.admissional) {
        return 'Efetivado';
      }

      const duration = calculateTimeDuration(new Date(employee.admissional), now);
      const formattedDuration = formatDurationInPortuguese(duration, { compact: true });

      return `Efetivado (${formattedDuration})`;
    }

    case USER_STATUS.DISMISSED: {
      if (!employee.dismissedAt) {
        return 'Desligado';
      }

      const duration = calculateTimeDuration(new Date(employee.dismissedAt), now);
      const formattedDuration = formatDurationInPortuguese(duration, { compact: true });

      return `Desligado (${formattedDuration})`;
    }

    default:
      return 'Desconhecido';
  }
}
