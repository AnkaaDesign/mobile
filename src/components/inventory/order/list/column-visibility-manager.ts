import type { Order } from '../../../../types';

// Column interface matching web pattern
export interface OrderColumn {
  key: string;
  header: string;
  accessor: (order: Order) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

// Function to get default visible columns for orders
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "description",
    "supplier.fantasyName",
    "status",
    "totalPrice"
  ]);
}
