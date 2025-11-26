/**
 * Filter Icon Mapping Utility
 *
 * Centralized mapping of filter keys/types to their corresponding icons.
 * This ensures consistent icon usage across all filter components.
 */

import { ComponentType } from 'react';
import {
  IconSearch,
  IconEye,
  IconUser,
  IconUsers,
  IconPackage,
  IconTags,
  IconChartBar,
  IconCalendar,
  IconClock,
  IconTruck,
  IconFolder,
  IconBrandAsana,
  IconMapPin,
  IconRuler,
  IconCurrencyDollar,
  IconPercentage,
  IconAlertCircle,
  IconToggleRight,
  IconSelector,
  IconBuilding,
  IconBriefcase,
  IconCheckbox,
  IconFilter,
  IconArrowsExchange,
  IconTrendingUp,
  IconTrendingDown,
  IconFileText,
  IconClipboardList,
  IconTool,
  IconBuildingWarehouse,
  IconTruckDelivery,
  IconPalette,
  IconBrush,
  IconReceipt,
  IconFileInvoice,
  IconShieldCheck,
  IconBeach,
  IconAlertTriangle,
  IconCategory,
  IconHash,
  IconListNumbers,
  IconSortAscending,
  IconTarget,
  IconBinary,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';

/**
 * Icon component type
 */
export type FilterIconComponent = ComponentType<IconProps>;

/**
 * Filter key to icon mapping
 * Maps common filter keys to their appropriate icons
 */
export const FILTER_KEY_ICON_MAP: Record<string, FilterIconComponent> = {
  // Search/Text filters
  searchingFor: IconSearch,
  search: IconSearch,
  name: IconSearch,
  description: IconFileText,

  // User/People filters
  userId: IconUser,
  userIds: IconUsers,
  user: IconUser,
  users: IconUsers,
  collaborator: IconUser,
  collaborators: IconUsers,
  employeeId: IconUser,
  employeeIds: IconUsers,

  // Status filters
  status: IconAlertCircle,
  isActive: IconToggleRight,
  active: IconToggleRight,
  inactive: IconToggleRight,

  // Date filters
  createdAt: IconCalendar,
  updatedAt: IconCalendar,
  deletedAt: IconCalendar,
  startDate: IconCalendar,
  endDate: IconCalendar,
  dateRange: IconCalendar,
  date: IconCalendar,
  createdDate: IconCalendar,
  forecastDateRange: IconCalendar,
  forecastDate: IconCalendar,
  deadline: IconClock,

  // Item/Product filters
  itemIds: IconPackage,
  itemId: IconPackage,
  item: IconPackage,
  items: IconPackage,
  productId: IconPackage,
  productIds: IconPackage,

  // Category filters
  categoryIds: IconFolder,
  categoryId: IconFolder,
  category: IconFolder,
  categories: IconFolder,

  // Brand filters
  brandIds: IconBrandAsana,
  brandId: IconBrandAsana,
  brand: IconBrandAsana,
  brands: IconBrandAsana,

  // Supplier filters
  supplierIds: IconTruck,
  supplierId: IconTruck,
  supplier: IconTruck,
  suppliers: IconTruck,

  // Location filters
  state: IconMapPin,
  states: IconMapPin,
  city: IconMapPin,
  cities: IconMapPin,
  location: IconMapPin,

  // Numeric/Range filters
  quantityRange: IconRuler,
  quantity: IconRuler,
  priceRange: IconCurrencyDollar,
  price: IconCurrencyDollar,
  totalPrice: IconCurrencyDollar,
  icmsRange: IconPercentage,
  icms: IconPercentage,
  ipiRange: IconPercentage,
  ipi: IconPercentage,
  monthlyConsumptionRange: IconChartBar,
  monthlyConsumption: IconChartBar,

  // Stock filters
  stockLevel: IconBuildingWarehouse,
  stockLevels: IconBuildingWarehouse,
  stock: IconBuildingWarehouse,

  // Organization filters
  sectorId: IconBuilding,
  sectorIds: IconBuilding,
  sector: IconBuilding,
  sectors: IconBuilding,

  // Position/Role filters
  positionId: IconBriefcase,
  positionIds: IconBriefcase,
  position: IconBriefcase,
  positions: IconBriefcase,

  // Operation filters
  operation: IconArrowsExchange,
  operations: IconArrowsExchange,
  operationType: IconArrowsExchange,

  // Activity filters
  reason: IconClipboardList,
  reasons: IconClipboardList,
  activityReason: IconClipboardList,

  // Paint/Color filters
  paintType: IconPalette,
  paintTypes: IconPalette,
  paintBrand: IconBrush,
  paintBrands: IconBrush,
  color: IconPalette,
  colors: IconPalette,

  // PPE/Equipment filters
  ppeType: IconShieldCheck,
  ppeTypes: IconShieldCheck,
  equipment: IconTool,
  equipmentType: IconTool,

  // Vacation filters
  vacationType: IconBeach,
  vacationTypes: IconBeach,
  vacation: IconBeach,

  // Warning/Alert filters
  severity: IconAlertTriangle,
  severities: IconAlertTriangle,
  warningType: IconAlertTriangle,

  // Order filters
  orderId: IconFileInvoice,
  orderIds: IconFileInvoice,
  order: IconFileInvoice,

  // Task filters
  taskId: IconClipboardList,
  taskIds: IconClipboardList,
  task: IconClipboardList,

  // Measure filters
  measureUnit: IconRuler,
  measureType: IconRuler,
  measure: IconRuler,

  // General filters
  tags: IconTags,
  tag: IconTags,
  priority: IconTarget,
  type: IconCategory,
  types: IconCategory,
  count: IconHash,
  number: IconListNumbers,
  sort: IconSortAscending,

  // Boolean filters
  hasBarcode: IconBinary,
  hasSupplier: IconToggleRight,
  hasActivities: IconToggleRight,
  hasBorrows: IconToggleRight,
  shouldAssignToUser: IconUser,

  // Visibility filters
  showInactive: IconEye,
  includeInactive: IconEye,
  visibility: IconEye,
};

/**
 * Filter type to icon mapping
 * Maps filter data types to default icons
 */
export const FILTER_TYPE_ICON_MAP: Record<string, FilterIconComponent> = {
  string: IconSearch,
  number: IconHash,
  boolean: IconToggleRight,
  date: IconCalendar,
  dateRange: IconCalendar,
  select: IconSelector,
  multiSelect: IconSelector,
  range: IconRuler,
};

/**
 * Get icon for a filter by key
 *
 * @param filterKey - The filter key (e.g., 'searchingFor', 'userId', 'status')
 * @param filterType - Optional filter type for fallback
 * @returns The appropriate icon component
 *
 * @example
 * ```tsx
 * const Icon = getFilterIcon('searchingFor'); // Returns IconSearch
 * <Icon size={20} color={colors.primary} />
 * ```
 */
export function getFilterIcon(
  filterKey: string,
  filterType?: string
): FilterIconComponent {
  // Try to get icon by filter key first
  const icon = FILTER_KEY_ICON_MAP[filterKey];
  if (icon) return icon;

  // Fallback to filter type
  if (filterType && FILTER_TYPE_ICON_MAP[filterType]) {
    return FILTER_TYPE_ICON_MAP[filterType];
  }

  // Default fallback
  return IconFilter;
}

/**
 * Check if a filter key has a mapped icon
 *
 * @param filterKey - The filter key to check
 * @returns True if the key has a mapped icon
 */
export function hasFilterIcon(filterKey: string): boolean {
  return filterKey in FILTER_KEY_ICON_MAP;
}

/**
 * Get all available filter icon keys
 *
 * @returns Array of all filter keys that have icon mappings
 */
export function getAvailableFilterIconKeys(): string[] {
  return Object.keys(FILTER_KEY_ICON_MAP);
}

/**
 * Register a custom filter icon mapping
 * Useful for domain-specific filters
 *
 * @param filterKey - The filter key
 * @param icon - The icon component
 *
 * @example
 * ```tsx
 * registerFilterIcon('customFilter', IconCustom);
 * ```
 */
export function registerFilterIcon(
  filterKey: string,
  icon: FilterIconComponent
): void {
  FILTER_KEY_ICON_MAP[filterKey] = icon;
}

/**
 * Batch register multiple filter icon mappings
 *
 * @param mappings - Object with filter keys and their icons
 *
 * @example
 * ```tsx
 * registerFilterIcons({
 *   customFilter1: IconCustom1,
 *   customFilter2: IconCustom2,
 * });
 * ```
 */
export function registerFilterIcons(
  mappings: Record<string, FilterIconComponent>
): void {
  Object.entries(mappings).forEach(([key, icon]) => {
    FILTER_KEY_ICON_MAP[key] = icon;
  });
}
