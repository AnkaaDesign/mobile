import type { Supplier } from '../../../../types';

// Column interface matching web pattern
interface SupplierColumn {
  key: string;
  header: string;
  accessor: (supplier: Supplier) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

// Function to get default visible columns for suppliers
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "fantasyName",
    "city",
    "itemsCount"
  ]);
}
