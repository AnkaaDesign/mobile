import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Options for useFilterState hook
 */
export interface UseFilterStateOptions<T> {
  /**
   * Unique storage key for persisting filters
   */
  key: string;

  /**
   * Default filter values
   */
  defaultFilters: T;

  /**
   * Optional callback when filters change
   */
  onChange?: (filters: T) => void;
}

/**
 * Return type for useFilterState hook
 */
export interface UseFilterStateReturn<T> {
  /**
   * Current filter values
   */
  filters: T;

  /**
   * Set all filters (replace)
   */
  setFilters: (filters: T | ((prev: T) => T)) => void;

  /**
   * Update filters (merge)
   */
  updateFilters: (updates: Partial<T>) => void;

  /**
   * Reset filters to default
   */
  resetFilters: () => void;

  /**
   * Clear a single filter (reset to default value)
   */
  clearFilter: (filterKey: keyof T) => void;

  /**
   * Check if any filters are active (different from default)
   */
  hasActiveFilters: boolean;

  /**
   * Loading state (true while loading from storage)
   */
  isLoading: boolean;
}

/**
 * Hook for managing filter state with persistent storage
 *
 * This hook manages filter state and persists it to AsyncStorage so filters
 * are remembered across app restarts. It provides a simple API for updating,
 * resetting, and clearing filters.
 *
 * @param options - Configuration options
 * @returns Filter state and control functions
 *
 * @example
 * ```tsx
 * // Define filter types
 * interface CustomerFilters {
 *   search: string;
 *   status: 'active' | 'inactive' | 'all';
 *   category: string | null;
 * }
 *
 * // Use in component
 * const {
 *   filters,
 *   updateFilters,
 *   resetFilters,
 *   hasActiveFilters,
 *   isLoading
 * } = useFilterState<CustomerFilters>({
 *   key: 'customers',
 *   defaultFilters: {
 *     search: '',
 *     status: 'all',
 *     category: null,
 *   },
 *   onChange: (filters) => {
 *     // Optional: refetch data when filters change
 *     refetch();
 *   },
 * });
 *
 * // Update filters
 * <TextInput
 *   value={filters.search}
 *   onChangeText={(text) => updateFilters({ search: text })}
 * />
 *
 * // Reset filters
 * <Button onPress={resetFilters}>
 *   Clear Filters
 * </Button>
 * ```
 */
export function useFilterState<T extends Record<string, any>>({
  key,
  defaultFilters,
  onChange,
}: UseFilterStateOptions<T>): UseFilterStateReturn<T> {
  const storageKey = `@filters_${key}`;
  const [filters, setFiltersState] = useState<T>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as T;
          setFiltersState(parsed);
        }
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFilters();
  }, [storageKey]);

  // Save filters to storage when they change (skip initial load)
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(storageKey, JSON.stringify(filters)).catch((error) =>
        console.error('Failed to save filters:', error)
      );

      // Call onChange callback if provided
      onChange?.(filters);
    }
  }, [filters, storageKey, isLoading, onChange]);

  // Set filters (replace all)
  const setFilters = useCallback((value: T | ((prev: T) => T)) => {
    setFiltersState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      return next;
    });
  }, []);

  // Update filters (merge with existing)
  const updateFilters = useCallback((updates: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, [defaultFilters]);

  // Clear a single filter (reset to default value)
  const clearFilter = useCallback((filterKey: keyof T) => {
    setFiltersState((prev) => ({
      ...prev,
      [filterKey]: defaultFilters[filterKey],
    }));
  }, [defaultFilters]);

  // Check if any filters are active (different from default)
  const hasActiveFilters = useCallback((): boolean => {
    return Object.keys(filters).some((key) => {
      const filterValue = filters[key];
      const defaultValue = defaultFilters[key];

      // Handle array comparison
      if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
        return JSON.stringify(filterValue) !== JSON.stringify(defaultValue);
      }

      // Handle object comparison
      if (typeof filterValue === 'object' && filterValue !== null &&
          typeof defaultValue === 'object' && defaultValue !== null) {
        return JSON.stringify(filterValue) !== JSON.stringify(defaultValue);
      }

      // Handle primitive comparison
      return filterValue !== defaultValue;
    });
  }, [filters, defaultFilters]);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters: hasActiveFilters(),
    isLoading,
  };
}

/**
 * Hook for managing filter state with debounced storage updates
 *
 * This variant debounces storage updates to avoid excessive writes when
 * filters change rapidly (e.g., search input).
 *
 * @param options - Configuration options
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @returns Filter state and control functions
 *
 * @example
 * ```tsx
 * const filters = useFilterStateDebounced<SearchFilters>({
 *   key: 'search',
 *   defaultFilters: { query: '' },
 * }, 300);
 *
 * // Rapid updates won't spam AsyncStorage
 * <TextInput
 *   value={filters.filters.query}
 *   onChangeText={(text) => filters.updateFilters({ query: text })}
 * />
 * ```
 */
export function useFilterStateDebounced<T extends Record<string, any>>(
  options: UseFilterStateOptions<T>,
  debounceMs: number = 500
): UseFilterStateReturn<T> {
  const { key, defaultFilters, onChange } = options;
  const storageKey = `@filters_${key}`;
  const [filters, setFiltersState] = useState<T>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as T;
          setFiltersState(parsed);
        }
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFilters();
  }, [storageKey]);

  // Debounced save to storage
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(() => {
      AsyncStorage.setItem(storageKey, JSON.stringify(filters)).catch((error) =>
        console.error('Failed to save filters:', error)
      );

      onChange?.(filters);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [filters, storageKey, isLoading, onChange, debounceMs]);

  const setFilters = useCallback((value: T | ((prev: T) => T)) => {
    setFiltersState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      return next;
    });
  }, []);

  const updateFilters = useCallback((updates: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, [defaultFilters]);

  const clearFilter = useCallback((filterKey: keyof T) => {
    setFiltersState((prev) => ({
      ...prev,
      [filterKey]: defaultFilters[filterKey],
    }));
  }, [defaultFilters]);

  const hasActiveFilters = useCallback((): boolean => {
    return Object.keys(filters).some((key) => {
      const filterValue = filters[key];
      const defaultValue = defaultFilters[key];

      if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
        return JSON.stringify(filterValue) !== JSON.stringify(defaultValue);
      }

      if (typeof filterValue === 'object' && filterValue !== null &&
          typeof defaultValue === 'object' && defaultValue !== null) {
        return JSON.stringify(filterValue) !== JSON.stringify(defaultValue);
      }

      return filterValue !== defaultValue;
    });
  }, [filters, defaultFilters]);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters: hasActiveFilters(),
    isLoading,
  };
}

/**
 * Utility to create filter state configuration for common patterns
 */
export const createFilterConfig = <T extends Record<string, any>>(options: {
  key: string;
  defaultFilters: T;
}): UseFilterStateOptions<T> => {
  return {
    key: options.key,
    defaultFilters: options.defaultFilters,
  };
};
