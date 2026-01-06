import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

// Type for filter configuration
interface FilterConfig<T> {
  schema: z.ZodSchema<T>;
  defaultValue?: T;
  debounceMs?: number;
}

/**
 * Mobile-compatible URL filters hook
 * Uses local state instead of URL parameters for React Native compatibility
 * Maintains the same API as the web version for consistency
 */
export function useUrlFilters<T extends Record<string, any>>(filterConfigs: { [K in keyof T]: FilterConfig<T[K]> }): {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K] | undefined) => void;
  setFilters: (filters: Partial<T>) => void;
  resetFilter: <K extends keyof T>(key: K) => void;
  resetFilters: () => void;
  isFilterActive: <K extends keyof T>(key: K) => boolean;
  activeFilterCount: number;
  getFilter: <K extends keyof T>(key: K) => T[K] | undefined;
} {
  // Use a Map to store separate timeout for each field
  const debounceTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Initialize state with default values
  const initialState = useMemo(() => {
    const result = {} as T;
    for (const [key, config] of Object.entries(filterConfigs) as Array<[keyof T, FilterConfig<any>]>) {
      if (config.defaultValue !== undefined) {
        result[key] = config.defaultValue;
      }
    }
    return result;
  }, [filterConfigs]);

  const [filterState, setFilterState] = useState<Partial<T>>(initialState);

  // Use ref to track current filter values for stable references
  const filtersRef = useRef<T>({} as T);

  // Compute filters from state
  const filters = useMemo(() => {
    const result = {} as T;

    for (const [key, config] of Object.entries(filterConfigs) as Array<[keyof T, FilterConfig<any>]>) {
      const stateValue = filterState[key];

      // Use state value if valid, otherwise use default
      if (stateValue !== undefined) {
        result[key] = stateValue;
      } else if (config.defaultValue !== undefined) {
        result[key] = config.defaultValue;
      }
    }

    return result;
  }, [filterState, filterConfigs]);

  // Update ref after filters are computed
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Update state immediately or with debouncing (per field)
  const updateState = useCallback(
    (updater: (prevState: Partial<T>) => Partial<T>, debounceMs?: number, fieldKey?: string) => {
      const doUpdate = () => {
        setFilterState((prev) => {
          const newState = updater(prev);
          // Only update if state actually changed
          if (JSON.stringify(prev) !== JSON.stringify(newState)) {
            return newState;
          }
          return prev;
        });
      };

      if (debounceMs !== undefined && debounceMs > 0 && fieldKey) {
        // Clear existing timeout for this specific field
        const existingTimeout = debounceTimeoutsRef.current.get(fieldKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout for this field
        const newTimeout = setTimeout(() => {
          doUpdate();
          // Clean up the timeout from the map after it executes
          debounceTimeoutsRef.current.delete(fieldKey);
        }, debounceMs);

        debounceTimeoutsRef.current.set(fieldKey, newTimeout);
      } else {
        // Update immediately
        doUpdate();
      }
    },
    [],
  );

  // Set a single filter
  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K] | undefined) => {
      const config = filterConfigs[key];

      // Validate the value first
      if (value !== undefined) {
        const result = config.schema.safeParse(value);
        if (!result.success) {
          console.warn(`Invalid filter value for "${String(key)}":`, result.error);
          return;
        }
      }

      // Determine debounce time - use filter-specific or none (immediate)
      const debounceMs = config.debounceMs;

      updateState(
        (_prevState) => {
          const newState = { ..._prevState };

          if (value === undefined) {
            delete newState[key];
          } else {
            newState[key] = value;
          }

          return newState;
        },
        debounceMs,
        String(key),
      );
    },
    [filterConfigs, updateState],
  );

  // Set multiple filters at once
  const setFilters = useCallback(
    (newFilters: Partial<T>) => {
      // For batch updates, use immediate update (no debouncing)
      updateState((_prevState) => {
        const newState = { ..._prevState };

        for (const [key, value] of Object.entries(newFilters) as Array<[keyof T, any]>) {
          const config = filterConfigs[key];
          if (!config) continue;

          // Validate the value
          if (value !== undefined) {
            const result = config.schema.safeParse(value);
            if (!result.success) {
              console.warn(`Invalid filter value for "${String(key)}":`, result.error);
              continue;
            }
          }

          if (value === undefined) {
            delete newState[key];
          } else {
            newState[key] = value;
          }
        }

        return newState;
      }, 0); // Immediate update for batch operations
    },
    [filterConfigs, updateState],
  );

  // Reset a single filter
  const resetFilter = useCallback(
    <K extends keyof T>(key: K) => {
      updateState((_prevState) => {
        const newState = { ..._prevState };
        delete newState[key];
        return newState;
      }, 0); // Immediate update for reset
    },
    [updateState],
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    updateState((_prevState) => {
      const newState: Partial<T> = {};
      // Keep only default values
      for (const [key, config] of Object.entries(filterConfigs) as Array<[keyof T, FilterConfig<any>]>) {
        if (config.defaultValue !== undefined) {
          newState[key] = config.defaultValue;
        }
      }
      return newState;
    }, 0); // Immediate update for reset
  }, [filterConfigs, updateState]);

  // Check if a filter is active (different from default)
  const isFilterActive = useCallback(
    <K extends keyof T>(key: K): boolean => {
      const currentValue = filters[key];
      const defaultValue = filterConfigs[key]?.defaultValue;

      if (currentValue === undefined && defaultValue === undefined) return false;
      if (currentValue === undefined || defaultValue === undefined) return true;

      // Deep comparison for objects/arrays
      return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
    },
    [filters, filterConfigs],
  );

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filterConfigs).filter((key) => isFilterActive(key as keyof T)).length;
  }, [filterConfigs, isFilterActive]);

  // Get current filter value from ref (stable reference)
  const getFilter = useCallback(<K extends keyof T>(key: K): T[K] | undefined => {
    return filtersRef.current[key];
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      debounceTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      debounceTimeoutsRef.current.clear();
    };
  }, []);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilter,
    resetFilters,
    isFilterActive,
    activeFilterCount,
    getFilter,
  };
}

// Common filter schemas for reuse
export const commonFilterSchemas = {
  // String filters
  search: z.string().min(1),
  status: z.string(),

  // Number filters
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  minPrice: z.coerce.number().min(0),
  maxPrice: z.coerce.number().min(0),

  // Date filters
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),

  // Boolean filters
  isActive: z.coerce.boolean(),
  showDeleted: z.coerce.boolean(),

  // Array filters
  categories: z.array(z.string()),
  tags: z.array(z.string()),

  // Enum filters
  sortBy: z.enum(["name", "date", "price"]),
  sortOrder: z.enum(["asc", "desc"]),
};
