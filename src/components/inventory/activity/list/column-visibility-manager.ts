import type { Activity } from '../../../../types';
import { getDefaultVisibleColumnsWithTablet } from '@/lib/table-utils';

// Column interface matching the table pattern
export interface ActivityColumn {
  key: string;
  header: string;
  accessor: (activity: Activity) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

// Mobile columns (< 624px)
const MOBILE_COLUMNS = [
  "item.name",
  "user.name",
  "quantity"
];

// Tablet columns (>= 624px) - adds date
const TABLET_COLUMNS = [
  "item.name",
  "user.name",
  "quantity",
  "createdAt"
];

// Function to get default visible columns for activities
export function getDefaultVisibleColumns(): Set<string> {
  return getDefaultVisibleColumnsWithTablet(MOBILE_COLUMNS, TABLET_COLUMNS);
}

// Function to get all available column keys
export function getAllColumnKeys(): string[] {
  return [
    "operation",
    "item.uniCode",
    "item.name",
    "quantity",
    "reason",
    "user.name",
    "order.id",
    "createdAt",
  ];
}

// Save column visibility to AsyncStorage or other persistence layer
export async function saveColumnVisibility(visibleColumns: Set<string>): Promise<void> {
  // TODO: Implement persistence if needed
  // For now, we'll just use in-memory state
  console.log("Saving column visibility:", Array.from(visibleColumns));
}

// Load column visibility from AsyncStorage or other persistence layer
export async function loadColumnVisibility(): Promise<Set<string>> {
  // TODO: Implement persistence if needed
  // For now, return default columns
  return getDefaultVisibleColumns();
}
