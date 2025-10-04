import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ItemGetManyFormData } from '../schemas';

// Storage key for persisting filters
const ITEM_FILTERS_STORAGE_KEY = "@ankaa/item-filters";

// Default filter state
const DEFAULT_FILTERS: ItemFilters = {
  searchingFor: "",
  isActive: true,
  shouldAssignToUser: undefined,
  hasBarcode: undefined,
  hasSupplier: undefined,
  hasActivities: undefined,
  hasBorrows: undefined,
  normalStock: undefined,
  lowStock: undefined,
  criticalStock: undefined,
  outOfStock: undefined,
  overStock: undefined,
  nearReorderPoint: undefined,
  noReorderPoint: undefined,
  hasMaxQuantity: undefined,
  negativeStock: undefined,
  stockLevels: [],
  itemIds: [],
  brandIds: [],
  categoryIds: [],
  supplierIds: [],
  barcodes: [],
  names: [],
  abcCategories: [],
  xyzCategories: [],
  quantityRange: undefined,
  taxRange: undefined,
  monthlyConsumptionRange: undefined,
};

// Type for the filter state - matches ItemGetManyFormData schema
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
  taxRange?: {
    min?: number;
    max?: number;
  };
  monthlyConsumptionRange?: {
    min?: number;
    max?: number;
  };
}

export function useItemFilters() {
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);

  // Load filters from AsyncStorage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const storedFilters = await AsyncStorage.getItem(ITEM_FILTERS_STORAGE_KEY);
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);
          setFilters({ ...DEFAULT_FILTERS, ...parsedFilters });
        }
      } catch (error) {
        console.error("Error loading item filters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilters();
  }, []);

  // Save filters to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(ITEM_FILTERS_STORAGE_KEY, JSON.stringify(filters)).catch((error) => {
        console.error("Error saving item filters:", error);
      });
    }
  }, [filters, isLoading]);

  // Update a single filter value
  const updateFilter = useCallback(<K extends keyof ItemFilters>(key: K, value: ItemFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((updates: Partial<ItemFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(async () => {
    setFilters(DEFAULT_FILTERS);
    try {
      await AsyncStorage.removeItem(ITEM_FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error("Error resetting item filters:", error);
    }
  }, []);

  // Reset a specific filter to its default value
  const resetFilter = useCallback(<K extends keyof ItemFilters>(key: K) => {
    setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  // Check if any filters are active (different from defaults)
  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some((key) => {
      const filterKey = key as keyof ItemFilters;
      const currentValue = filters[filterKey];
      const defaultValue = DEFAULT_FILTERS[filterKey];

      // Handle arrays
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return currentValue.length !== defaultValue.length;
      }

      // Handle objects (range filters)
      if (typeof currentValue === "object" && currentValue !== null && typeof defaultValue === "object" && defaultValue !== null) {
        return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
      }

      // Handle primitive values
      return currentValue !== defaultValue;
    });
  }, [filters]);

  // Convert filters to API query parameters
  const getQueryParams = useCallback((): Partial<ItemGetManyFormData> => {
    const queryParams: Partial<ItemGetManyFormData> = {};

    // Add each filter if it has a value different from default
    Object.entries(filters).forEach(([key, value]) => {
      const filterKey = key as keyof ItemFilters;
      const defaultValue = DEFAULT_FILTERS[filterKey];

      // Skip if value is same as default
      if (value === defaultValue) return;

      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) return;

      // Skip undefined range filters
      if (filterKey.includes("Range") && (!value || (typeof value === "object" && !value.min && !value.max))) return;

      // Add to query params
      queryParams[filterKey] = value as any;
    });

    return queryParams;
  }, [filters]);

  // Toggle a boolean filter
  const toggleFilter = useCallback((key: keyof ItemFilters) => {
    setFilters((prev) => {
      const currentValue = prev[key];
      if (typeof currentValue === "boolean") {
        return { ...prev, [key]: !currentValue };
      }
      // If undefined, set to true
      return { ...prev, [key]: true };
    });
  }, []);

  // Add/remove item from array filter
  const toggleArrayItem = useCallback(<K extends keyof ItemFilters>(key: K, item: string) => {
    setFilters((prev) => {
      const currentArray = prev[key] as string[] | undefined;
      if (!Array.isArray(currentArray)) {
        return { ...prev, [key]: [item] };
      }

      const newArray = currentArray.includes(item) ? currentArray.filter((i) => i !== item) : [...currentArray, item];

      return { ...prev, [key]: newArray };
    });
  }, []);

  return {
    filters,
    isLoading,
    updateFilter,
    updateFilters,
    resetFilters,
    resetFilter,
    hasActiveFilters,
    getQueryParams,
    toggleFilter,
    toggleArrayItem,
  };
}
