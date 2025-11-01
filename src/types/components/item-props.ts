import type { ViewStyle } from "react-native";
import type { Item } from '..';
import type { UseFormReturn } from "react-hook-form";
import type { ItemCreateFormData, ItemUpdateFormData } from '@/schemas';

// List Components Props
export interface ItemListProps {
  items: Item[];
  onItemPress?: (item: Item) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
}

export interface ItemTableProps {
  items: Item[];
  onItemPress?: (item: Item) => void;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
}

export interface ItemTableRowSwipeProps {
  item: Item;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

// Filter Components Props
export interface FilterState {
  searchingFor?: string;
  status?: string[];
  categories?: string[];
  brands?: string[];
  suppliers?: string[];
  stockLevel?: "all" | "low" | "out" | "normal";
  hasActivity?: boolean;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface ItemFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export interface ItemFilterTagsProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
  style?: ViewStyle;
}

export interface ColumnVisibilityManagerProps {
  visible: boolean;
  onClose: () => void;
  columns: Array<{
    key: string;
    label: string;
    visible: boolean;
  }>;
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
}

// Status Indicators Props
export interface StockBadgeProps {
  quantity: number;
  minQuantity?: number;
  style?: ViewStyle;
}

export interface StockStatusIndicatorProps {
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  style?: ViewStyle;
}

// Detail Components Props
export interface ItemCardProps {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export interface SpecificationsCardProps {
  item: Item;
  style?: ViewStyle;
}

export interface MetricsCardProps {
  item: Item;
  style?: ViewStyle;
}

export interface ActivityHistoryCardProps {
  itemId: string;
  style?: ViewStyle;
}

export interface RelatedItemsCardProps {
  item: Item;
  onItemPress?: (item: Item) => void;
  style?: ViewStyle;
}

// Form Components Props
export interface ItemFormProps<TMode extends "create" | "edit"> {
  form: UseFormReturn<TMode extends "create" ? ItemCreateFormData : ItemUpdateFormData>;
  onSubmit: (data: TMode extends "create" ? ItemCreateFormData : ItemUpdateFormData) => void;
  isSubmitting?: boolean;
  mode: TMode;
}

export interface ItemEditFormProps {
  item: Item;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Form Input Components Props
export interface NameInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface UnicodeInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface StatusToggleProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface BrandSelectorProps<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  control: import("react-hook-form").Control<TFormData>;
  disabled?: boolean;
  required?: boolean;
}

export interface CategorySelectorProps<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  control: import("react-hook-form").Control<TFormData>;
  disabled?: boolean;
  required?: boolean;
  onCategoryChange?: (categoryId: string | undefined) => void;
}

export interface SupplierSelectorProps<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  control: import("react-hook-form").Control<TFormData>;
  disabled?: boolean;
}

export interface QuantityInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface MinQuantityInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface MaxQuantityInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface BoxQuantityInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface LeadTimeInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface PriceInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface MeasureValueInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface MeasureUnitSelectorProps<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  control: import("react-hook-form").Control<TFormData>;
  disabled?: boolean;
}

export interface BarcodeManagerProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface AssignToUserToggleProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

// PPE Configuration Props
export interface PpeConfigSectionProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface PpeTypeSelectorProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface PpeSizeSelectorProps<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  control: import("react-hook-form").Control<TFormData>;
  ppeType?: import("../../constants").PPE_TYPE;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export interface PpeDeliveryModeSelectorProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface PpeDeliveryQuantityInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}

export interface PpeAutoOrderMonthsInputProps {
  form: UseFormReturn<ItemCreateFormData | ItemUpdateFormData>;
  disabled?: boolean;
}
