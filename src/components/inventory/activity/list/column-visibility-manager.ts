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

// Save column visibility to AsyncStorage
export async function saveColumnVisibility(visibleColumns: Set<string>): Promise<void> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('@column_visibility_activities', JSON.stringify(Array.from(visibleColumns)));
  } catch (error) {
    console.error('Error saving column visibility:', error);
  }
}

// Load column visibility from AsyncStorage
export async function loadColumnVisibility(): Promise<Set<string>> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const stored = await AsyncStorage.getItem('@column_visibility_activities');
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return new Set(parsed);
      }
    }
  } catch (error) {
    console.error('Error loading column visibility:', error);
  }
  return getDefaultVisibleColumns();
}
