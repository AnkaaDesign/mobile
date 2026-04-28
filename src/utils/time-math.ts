/**
 * Time arithmetic utilities for the Calculadora de Horas tool (mobile mirror).
 *
 * All values are kept in MINUTES internally. Negative totals are allowed
 * (the operator carries the sign for inputs; results may go negative).
 *
 * Inputs accepted by the parser:
 *   - "HH:MM"   e.g. "08:30"
 *   - "H:MM"    e.g. "8:30"
 *   - "HHMM"    e.g. "0830" (4 digits, no separator)
 *   - Surrounding whitespace is trimmed.
 *   - Hours may exceed 24 (e.g. "25:30" = 1530 minutes) since these are durations.
 *
 * Inputs rejected (return null):
 *   - Empty string after trim
 *   - Non-numeric characters other than the single ":" separator
 *   - Minutes >= 60
 *   - Negative inputs (sign comes from operator)
 */

export type TimeOperation = { operator: "+" | "-"; minutes: number };

/**
 * Parse a HH:MM-style string into total minutes.
 * Returns null on invalid input.
 */
export function parseHHMM(input: string): number | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (raw.length === 0) return null;

  // Reject explicit signs — sign comes from the operator, not the value.
  if (raw.startsWith("-") || raw.startsWith("+")) return null;

  let hoursStr: string;
  let minutesStr: string;

  if (raw.includes(":")) {
    const parts = raw.split(":");
    if (parts.length !== 2) return null;
    hoursStr = parts[0];
    minutesStr = parts[1];
    if (hoursStr.length === 0 || minutesStr.length === 0) return null;
    if (minutesStr.length > 2) return null;
  } else {
    // Bare digits — must be exactly 4 digits (HHMM) to disambiguate.
    if (!/^\d{4}$/.test(raw)) return null;
    hoursStr = raw.slice(0, 2);
    minutesStr = raw.slice(2);
  }

  if (!/^\d+$/.test(hoursStr) || !/^\d+$/.test(minutesStr)) return null;

  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes >= 60) return null;
  if (hours < 0 || minutes < 0) return null;

  return hours * 60 + minutes;
}

/**
 * Break a (possibly negative) total in minutes into a presentation object.
 *
 * `display` is always "HH:MM" with the time-of-day portion (mod 24h) when there
 * are positive day rollovers; otherwise it shows the absolute hours/minutes.
 * The `days` value carries any positive overflow days (negative results report
 * `days = 0` and the consumer should rely on the sign).
 */
export function formatHHMM(totalMinutes: number): {
  sign: "+" | "-";
  hours: string;
  minutes: string;
  days: number;
  display: string;
} {
  const safe = Number.isFinite(totalMinutes) ? Math.trunc(totalMinutes) : 0;
  const sign: "+" | "-" = safe < 0 ? "-" : "+";
  const abs = Math.abs(safe);

  if (sign === "+") {
    const days = Math.floor(abs / (24 * 60));
    const remainder = abs - days * 24 * 60;
    const hours = Math.floor(remainder / 60);
    const minutes = remainder % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    return { sign, hours: hh, minutes: mm, days, display: `${hh}:${mm}` };
  }

  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return { sign, hours: hh, minutes: mm, days: 0, display: `${hh}:${mm}` };
}

/**
 * Sum a list of operations, optionally starting from `initial` minutes.
 * `null` initial is treated as 0 (pure duration sum).
 */
export function sumOperations(
  initial: number | null,
  ops: ReadonlyArray<TimeOperation>,
): number {
  let total = initial ?? 0;
  for (const op of ops) {
    if (!Number.isFinite(op.minutes)) continue;
    total += op.operator === "-" ? -op.minutes : op.minutes;
  }
  return total;
}

/**
 * Convert minutes into decimal hours (e.g. 825 -> 13.75).
 */
export function minutesToDecimalHours(totalMinutes: number): number {
  if (!Number.isFinite(totalMinutes)) return 0;
  return totalMinutes / 60;
}

// ---------------------------------------------------------------------------
// Calculator-style expression evaluator
// ---------------------------------------------------------------------------

/**
 * Result of evaluating a calculator expression.
 *
 * Working unit is MINUTES (integer). Negative results are allowed (subtraction
 * may go below zero). Hours may exceed 24 (e.g. 25:00) since these are
 * durations, not clock times.
 */
export type EvalResult =
  | { ok: true; minutes: number }
  | { ok: false; error: string };

/** Operators recognised by the calculator. */
type CalcOperator = "+" | "-" | "*" | "/";

interface CalcToken {
  /** Minutes value of the literal (or the scalar for *,/ — caller decides). */
  minutes: number;
  /** Whether this token had a colon (i.e. is a TIME literal). */
  isTime: boolean;
}

/**
 * Tokenize a calculator expression into a sequence:
 *   value, op, value, op, value, ...
 *
 * Returns null on malformed input.
 */
function tokenize(
  input: string,
): Array<CalcToken | CalcOperator> | null {
  const trimmed = input.replace(/\s+/g, "");
  if (trimmed.length === 0) return null;

  const out: Array<CalcToken | CalcOperator> = [];
  let buf = "";

  const flushBuffer = (): boolean => {
    if (buf.length === 0) return false;
    const hasColon = buf.includes(":");
    if (hasColon) {
      const parsed = parseHHMM(buf);
      if (parsed === null) return false;
      out.push({ minutes: parsed, isTime: true });
    } else {
      // Pure digits → minutes
      if (!/^\d+$/.test(buf)) return false;
      const n = Number(buf);
      if (!Number.isFinite(n)) return false;
      out.push({ minutes: n, isTime: false });
    }
    buf = "";
    return true;
  };

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch >= "0" && ch <= "9") {
      buf += ch;
      continue;
    }
    if (ch === ":") {
      // Colon must appear inside a digit run, only once.
      if (buf.length === 0 || buf.includes(":")) return null;
      buf += ch;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      if (!flushBuffer()) return null;
      out.push(ch);
      continue;
    }
    // Any other character → malformed
    return null;
  }
  if (!flushBuffer()) return null;

  return out;
}

/**
 * Evaluate a calculator-style expression and return the total in minutes.
 *
 * Semantics:
 *  - Digits without a colon are MINUTES (so "30" = 30 minutes).
 *  - "HH:MM" is a TIME literal converted to minutes.
 *  - "+", "-" are time arithmetic.
 *  - "*", "/" are scalar — the right-hand side is treated as a raw number
 *    regardless of colon (e.g. "01:30 * 2" = 90 * 2 = 180 minutes; "01:30"
 *    on the RHS would be evaluated as 90 too, but treated as a scalar — it
 *    multiplies by the numeric value of the minute count).
 *  - Evaluation is strictly LEFT-TO-RIGHT (no operator precedence) to match
 *    the keypad calculator UX.
 *  - Division by zero → "Erro".
 */
export function evaluateTimeExpression(input: string): EvalResult {
  const tokens = tokenize(input);
  if (tokens === null || tokens.length === 0) {
    return { ok: false, error: "Erro" };
  }

  // Must alternate: value, op, value, op, ...
  // First token must be a value (object), last must be a value.
  if (typeof tokens[0] === "string") {
    return { ok: false, error: "Erro" };
  }
  if (typeof tokens[tokens.length - 1] === "string") {
    return { ok: false, error: "Erro" };
  }

  // Two operators in a row → invalid
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    const aIsOp = typeof a === "string";
    const bIsOp = typeof b === "string";
    if (aIsOp && bIsOp) return { ok: false, error: "Erro" };
    if (!aIsOp && !bIsOp) return { ok: false, error: "Erro" };
  }

  // Reduce left-to-right.
  let acc = (tokens[0] as CalcToken).minutes;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i] as CalcOperator;
    const rhs = tokens[i + 1] as CalcToken;
    switch (op) {
      case "+":
        acc = acc + rhs.minutes;
        break;
      case "-":
        acc = acc - rhs.minutes;
        break;
      case "*":
        // RHS is a scalar: use raw numeric value as-is.
        acc = acc * rhs.minutes;
        break;
      case "/":
        if (rhs.minutes === 0) return { ok: false, error: "Erro" };
        acc = acc / rhs.minutes;
        break;
    }
  }

  // Round to integer minutes (calculator works in whole minutes).
  const minutes = Math.trunc(acc);
  if (!Number.isFinite(minutes)) return { ok: false, error: "Erro" };
  return { ok: true, minutes };
}

/**
 * Format a (possibly negative) minute value as a calculator-style display.
 *
 *   90  -> "01:30"
 *  -330 -> "-05:30"
 *  1500 -> "25:00"   (hours may exceed 24)
 */
export function formatCalcMinutes(totalMinutes: number): string {
  const safe = Number.isFinite(totalMinutes) ? Math.trunc(totalMinutes) : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
