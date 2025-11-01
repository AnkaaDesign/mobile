import type { SharedValue } from "react-native-reanimated";

// Toast Hook Types
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "success" | "error" | "warning" | "info";
}

// Animation Cleanup Hook Types
export interface AnimationConfig {
  name: string;
  value: SharedValue<number>;
  autoCleanup?: boolean;
}

export interface UseAnimationCleanupReturn {
  registerAnimation: (config: AnimationConfig) => void;
  unregisterAnimation: (name: string) => void;
  cleanupAnimation: (name: string) => void;
  cleanupAllAnimations: () => void;
  isAnimationRegistered: (name: string) => boolean;
}

// Item Filters Hook Types - matches ItemGetManyFormData schema
export interface ItemFilters {
  // Search filter
  searchingFor?: string;

  // Boolean filters
  isActive?: boolean;
  shouldAssignToUser?: boolean;
  hasBarcode?: boolean;
  hasSupplier?: boolean;
  hasActivities?: boolean;
  hasBorrows?: boolean;

  // Stock level boolean filters
  normalStock?: boolean;
  lowStock?: boolean;
  criticalStock?: boolean;
  outOfStock?: boolean;
  overStock?: boolean;
  nearReorderPoint?: boolean;
  noReorderPoint?: boolean;
  hasMaxQuantity?: boolean;
  negativeStock?: boolean;

  // Array filters
  stockLevels?: string[];
  itemIds?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  barcodes?: string[];
  names?: string[];
  abcCategories?: string[];
  xyzCategories?: string[];

  // Range filters
  quantityRange?: {
    min?: number;
    max?: number;
  };
  icmsRange?: {
    min?: number;
    max?: number;
  };
  ipiRange?: {
    min?: number;
    max?: number;
  };
  monthlyConsumptionRange?: {
    min?: number;
    max?: number;
  };
}

// Haptic Form Hook Types
export interface UseHapticFormReturn {
  handleFieldBlur: (hasError: boolean) => Promise<void>;
  handleFieldChange: (isValid: boolean) => Promise<void>;
  handleSwitchToggle: (value: boolean) => Promise<void>;
  handleSliderChange: (value: number, min: number, max: number) => Promise<void>;
  handleValidationError: (fieldCount: number) => Promise<void>;
  handleStepChange: (direction: "forward" | "backward") => Promise<void>;
}

// Haptic List Hook Types
export interface UseHapticListReturn {
  handleItemPress: (item: any) => Promise<void>;
  handleItemLongPress: (item: any) => Promise<void>;
  handleItemSwipe: (direction: "left" | "right") => Promise<void>;
  handleReorder: (action: "pickup" | "drop") => Promise<void>;
  handleScroll: (event: any) => Promise<void>;
}
