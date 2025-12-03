// Column visibility manager for borrow table
// Provides default visible columns following the same pattern as item table
import { getDefaultVisibleColumnsWithTablet } from '@/lib/table-utils';

// Mobile columns (< 624px)
const MOBILE_COLUMNS = [
  "item.name",
  "user.name",
  "status"
];

// Tablet columns (>= 624px) - adds date
const TABLET_COLUMNS = [
  "item.name",
  "user.name",
  "status",
  "createdAt"
];

export function getDefaultVisibleColumns(): Set<string> {
  return getDefaultVisibleColumnsWithTablet(MOBILE_COLUMNS, TABLET_COLUMNS);
}
