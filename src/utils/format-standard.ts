/**
 * Standardized Formatting Utilities for Mobile Application
 * Ensures consistency with web platform
 */

const CURRENCY_DECIMAL_PLACES = 2;

/**
 * Standard percentage formatter - always use 1 decimal place unless specified
 * @param value - Percentage value (e.g., 68.5 for 68.5%)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Commission percentage - always 2 decimals
 */
export function formatCommissionPercentage(value: number): string {
  return formatPercentage(value, 2);
}

/**
 * Formula ratio percentage - always 1 decimal
 */
export function formatRatioPercentage(value: number): string {
  return formatPercentage(value, 1);
}

/**
 * Progress percentage - always 0 decimals
 */
export function formatProgressPercentage(value: number): string {
  return formatPercentage(value, 0);
}

/**
 * Currency formatter with proper rounding (matches backend precision)
 */
export function formatCurrencyPrecise(value: number, locale: string = "pt-BR", currency: string = "BRL"): string {
  const rounded = Math.round(value * 100) / 100; // Match backend roundCurrency()
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: CURRENCY_DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY_DECIMAL_PLACES,
  }).format(rounded);
}

/**
 * Duration formatter - standardized format
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration (e.g., "2d 14h 30m")
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (remainingMinutes > 0 || parts.length === 0) parts.push(`${remainingMinutes}m`);

  return parts.join(" ");
}

/**
 * Duration formatter - web-compatible format
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration (e.g., "02:14:30")
 */
export function formatDurationWeb(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(String(days).padStart(2, "0"));
  parts.push(String(remainingHours).padStart(2, "0"));
  parts.push(String(remainingMinutes).padStart(2, "0"));

  return parts.join(":");
}

/**
 * Density formatter - always 3 decimals for technical precision
 */
export function formatDensity(value: number): string {
  return Number(value).toFixed(3);
}

/**
 * Number formatter with specified decimals
 */
export function formatNumberWithDecimals(value: number, decimals: number = 2, locale: string = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Tax/ICMS/IPI formatter - display as percentage with 2 decimal places
 */
export function formatTaxPercentage(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
}

/**
 * Quantity formatter with Brazilian locale
 * Auto-detects: integers show no decimals, fractional shows 2 decimals
 * Pass explicit decimals to override
 */
export function formatQuantity(value: number, decimals?: number): string {
  if (decimals !== undefined) {
    return formatNumberWithDecimals(value, decimals, "pt-BR");
  }
  if (value % 1 === 0) {
    return new Intl.NumberFormat("pt-BR").format(value);
  }
  return formatNumberWithDecimals(value, 2, "pt-BR");
}
