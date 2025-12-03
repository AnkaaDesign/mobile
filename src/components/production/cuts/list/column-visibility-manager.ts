import { getDefaultVisibleColumnsWithTablet } from '@/lib/table-utils';

// Mobile columns (< 624px)
const MOBILE_COLUMNS = [
  "task",
  "filename",
  "status"
];

// Tablet columns (>= 624px) - adds createdAt (iniciado em)
const TABLET_COLUMNS = [
  "filename",
  "task",
  "status",
  "createdAt"
];

/**
 * Get default visible columns for cuts table
 */
export function getDefaultVisibleColumns(): Set<string> {
  return getDefaultVisibleColumnsWithTablet(MOBILE_COLUMNS, TABLET_COLUMNS);
}

/**
 * Get default visible columns as array (for prop defaults)
 */
export function getDefaultVisibleColumnKeys(): string[] {
  return Array.from(getDefaultVisibleColumns());
}
