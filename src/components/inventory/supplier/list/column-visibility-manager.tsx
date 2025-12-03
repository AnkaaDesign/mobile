import { getDefaultVisibleColumnsWithTablet } from '@/lib/table-utils';

// Mobile columns (< 624px)
const MOBILE_COLUMNS = [
  "fantasyName",
  "city",
  "itemsCount"
];

// Tablet columns (>= 624px) - adds CNPJ and state
const TABLET_COLUMNS = [
  "fantasyName",
  "cnpj",
  "city",
  "state",
  "itemsCount"
];

// Function to get default visible columns for suppliers
export function getDefaultVisibleColumns(): Set<string> {
  return getDefaultVisibleColumnsWithTablet(MOBILE_COLUMNS, TABLET_COLUMNS);
}
