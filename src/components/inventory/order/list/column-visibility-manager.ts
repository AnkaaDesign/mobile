import type { Order } from '../../../../types';
import { getDefaultVisibleColumnsWithTablet } from '@/lib/table-utils';

// Column interface matching web pattern
export interface OrderColumn {
  key: string;
  header: string;
  accessor: (order: Order) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

// Mobile columns (< 624px)
const MOBILE_COLUMNS = [
  "description",
  "supplier.fantasyName",
  "status",
  "totalPrice"
];

// Tablet columns (>= 624px) - adds items count and forecast
const TABLET_COLUMNS = [
  "description",
  "supplier.fantasyName",
  "status",
  "itemsCount",
  "forecast",
  "totalPrice"
];

// Function to get default visible columns for orders
export function getDefaultVisibleColumns(): Set<string> {
  return getDefaultVisibleColumnsWithTablet(MOBILE_COLUMNS, TABLET_COLUMNS);
}
