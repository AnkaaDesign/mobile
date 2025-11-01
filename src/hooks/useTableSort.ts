import { useState, useCallback } from 'react';
import { TableSortUtils, SortConfig, SortDirection } from '../lib/sort-utils';

/**
 * Hook for managing table sort state
 *
 * This hook provides a consistent interface for sorting across all list pages.
 * It handles single-column and multi-column sorting with toggle behavior.
 *
 * @param defaultSort - Initial sort configuration(s)
 * @param maxSorts - Maximum number of simultaneous sorts (default: 3)
 * @param multiSortByDefault - Enable multi-sort by default (default: false)
 * @returns Sort state and control functions
 *
 * @example
 * ```tsx
 * const { sortConfigs, handleSort, getSortDirection, buildOrderBy } = useTableSort(
 *   [{ column: "name", direction: "asc", order: 0 }],
 *   3 // Allow up to 3 simultaneous sorts
 * );
 *
 * // In your table header:
 * <TableHeader
 *   onPress={() => handleSort("name")}
 *   sortDirection={getSortDirection("name")}
 * />
 *
 * // In your API query:
 * const queryParams = {
 *   orderBy: buildOrderBy(),
 *   ...otherParams
 * };
 * ```
 */
export function useTableSort(
  defaultSort: SortConfig[] = [],
  maxSorts = 3,
  multiSortByDefault = false
) {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>(defaultSort);

  /**
   * Handle sort toggle for a column
   * Cycles through: ASC → DESC → No Sort (for single sort)
   * or ASC → DESC → Keep Sort (for multi-sort)
   */
  const handleSort = useCallback((columnKey: string, options?: { multiSort?: boolean }) => {
    const enableMultiSort = options?.multiSort ?? multiSortByDefault;

    setSortConfigs((current) => {
      const newConfigs = TableSortUtils.toggleColumnSort(current, columnKey, {
        multiSort: enableMultiSort,
        replaceExisting: !enableMultiSort,
      });

      // Limit number of sorts
      return newConfigs.slice(0, maxSorts);
    });
  }, [multiSortByDefault, maxSorts]);

  /**
   * Clear sort for a specific column or all columns
   */
  const clearSort = useCallback((columnKey?: string) => {
    setSortConfigs((current) => TableSortUtils.clearSort(current, columnKey));
  }, []);

  /**
   * Get sort direction for a specific column
   */
  const getSortDirection = useCallback((columnKey: string): SortDirection | null => {
    return TableSortUtils.getSortDirection(sortConfigs, columnKey);
  }, [sortConfigs]);

  /**
   * Get sort order (0-based) for a specific column
   */
  const getSortOrder = useCallback((columnKey: string): number | null => {
    return TableSortUtils.getSortOrder(sortConfigs, columnKey);
  }, [sortConfigs]);

  /**
   * Check if a column is currently sorted
   */
  const isSorted = useCallback((columnKey: string): boolean => {
    return TableSortUtils.hasActiveSort(sortConfigs, columnKey);
  }, [sortConfigs]);

  /**
   * Get all actively sorted columns
   */
  const getActiveSortColumns = useCallback((): string[] => {
    return TableSortUtils.getActiveSortColumns(sortConfigs);
  }, [sortConfigs]);

  /**
   * Build orderBy object for API calls
   * Converts columnKey to field name using the provided mapping
   *
   * @param fieldMapping - Maps column keys to database field names
   * @param defaultOrderBy - Default ordering if no sorts active
   *
   * @example
   * ```tsx
   * const orderBy = buildOrderBy({
   *   name: "fantasyName",
   *   createdDate: "createdAt",
   *   status: "statusOrder"
   * }, { fantasyName: "asc" });
   *
   * // Result: { fantasyName: "asc" } or [{ fantasyName: "asc" }, { statusOrder: "desc" }]
   * ```
   */
  const buildOrderBy = useCallback((
    fieldMapping: Record<string, string> = {},
    defaultOrderBy?: Record<string, SortDirection> | Record<string, SortDirection>[]
  ): Record<string, SortDirection> | Record<string, SortDirection>[] => {
    if (sortConfigs.length === 0) {
      return defaultOrderBy || {};
    }

    // Map column keys to field names
    const mappedConfigs = sortConfigs.map(config => {
      const fieldName = fieldMapping[config.columnKey] || config.columnKey;
      return { [fieldName]: config.direction };
    });

    // Return single object for single sort, array for multiple sorts
    return mappedConfigs.length === 1 ? mappedConfigs[0] : mappedConfigs;
  }, [sortConfigs]);

  /**
   * Reset sort to default
   */
  const resetToDefault = useCallback(() => {
    setSortConfigs(defaultSort);
  }, [defaultSort]);

  /**
   * Set sort configs directly (for advanced use cases)
   */
  const setSortConfigsDirectly = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs.slice(0, maxSorts));
  }, [maxSorts]);

  return {
    /** Current sort configurations */
    sortConfigs,
    /** Toggle sort for a column */
    handleSort,
    /** Clear sort (all or specific column) */
    clearSort,
    /** Get sort direction for a column */
    getSortDirection,
    /** Get sort order number for a column */
    getSortOrder,
    /** Check if column is sorted */
    isSorted,
    /** Get all sorted columns */
    getActiveSortColumns,
    /** Build orderBy object for API */
    buildOrderBy,
    /** Reset to default sort */
    resetToDefault,
    /** Set sort configs directly */
    setSortConfigs: setSortConfigsDirectly,
  };
}

/**
 * Hook for managing sort state with automatic mapping
 *
 * This is a simpler version that handles common column→field mappings automatically
 *
 * @example
 * ```tsx
 * const sort = useSimpleTableSort({
 *   defaultColumn: "name",
 *   defaultDirection: "asc",
 *   columnToFieldMap: {
 *     name: "fantasyName",
 *     createdDate: "createdAt"
 *   }
 * });
 *
 * // Automatically builds correct orderBy
 * const queryParams = {
 *   orderBy: sort.orderBy, // No manual mapping needed!
 * };
 * ```
 */
export function useSimpleTableSort(config: {
  defaultColumn?: string;
  defaultDirection?: SortDirection;
  columnToFieldMap?: Record<string, string>;
  maxSorts?: number;
}) {
  const {
    defaultColumn,
    defaultDirection = "asc",
    columnToFieldMap = {},
    maxSorts = 3,
  } = config;

  const defaultSort = defaultColumn
    ? [{ columnKey: defaultColumn, direction: defaultDirection, order: 0 }]
    : [];

  const {
    sortConfigs,
    handleSort,
    clearSort,
    getSortDirection,
    getSortOrder,
    isSorted,
    getActiveSortColumns,
    resetToDefault,
    setSortConfigs,
  } = useTableSort(defaultSort, maxSorts);

  // Automatically build orderBy with field mapping
  const orderBy = useCallback(() => {
    if (sortConfigs.length === 0) {
      if (defaultColumn) {
        const fieldName = columnToFieldMap[defaultColumn] || defaultColumn;
        return { [fieldName]: defaultDirection };
      }
      return {};
    }

    const mappedConfigs = sortConfigs.map(config => {
      const fieldName = columnToFieldMap[config.columnKey] || config.columnKey;
      return { [fieldName]: config.direction };
    });

    return mappedConfigs.length === 1 ? mappedConfigs[0] : mappedConfigs;
  }, [sortConfigs, defaultColumn, defaultDirection, columnToFieldMap]);

  return {
    sortConfigs,
    handleSort,
    clearSort,
    getSortDirection,
    getSortOrder,
    isSorted,
    getActiveSortColumns,
    resetToDefault,
    setSortConfigs,
    /** Pre-built orderBy object ready for API */
    orderBy: orderBy(),
  };
}

/**
 * Hook for sort state that syncs with URL/navigation params
 * Useful for deep linking and preserving sort state
 *
 * @example
 * ```tsx
 * import { useSearchParams } from 'expo-router';
 *
 * const sort = useSortWithNavigation(useSearchParams());
 *
 * // Sort state is automatically saved to URL
 * // Restored when user navigates back
 * ```
 */
export function useSortWithNavigation(
  searchParams: URLSearchParams,
  updateSearchParams: (params: Record<string, string>) => void,
  options: {
    paramKey?: string;
    defaultSort?: SortConfig[];
    maxSorts?: number;
  } = {}
) {
  const {
    paramKey = "sort",
    defaultSort = [],
    maxSorts = 3,
  } = options;

  // Parse initial sort from URL
  const initialSort = TableSortUtils.parseSortFromUrl(searchParams.get(paramKey)) || defaultSort;

  const {
    sortConfigs,
    handleSort: baseHandleSort,
    clearSort: baseClearSort,
    getSortDirection,
    getSortOrder,
    isSorted,
    getActiveSortColumns,
    buildOrderBy,
    resetToDefault,
    setSortConfigs: baseSeTConfigs,
  } = useTableSort(initialSort, maxSorts);

  // Sync to URL whenever sort changes
  const syncToUrl = useCallback((configs: SortConfig[]) => {
    const serialized = TableSortUtils.serializeSortForUrl(configs);
    if (serialized) {
      updateSearchParams({ [paramKey]: serialized });
    } else {
      // Remove param if no sorts
      const newParams = Object.fromEntries(searchParams.entries());
      delete newParams[paramKey];
      updateSearchParams(newParams);
    }
  }, [searchParams, updateSearchParams, paramKey]);

  const handleSort = useCallback((columnKey: string, options?: { multiSort?: boolean }) => {
    baseHandleSort(columnKey, options);
    syncToUrl(sortConfigs);
  }, [baseHandleSort, syncToUrl, sortConfigs]);

  const clearSort = useCallback((columnKey?: string) => {
    baseClearSort(columnKey);
    syncToUrl(sortConfigs);
  }, [baseClearSort, syncToUrl, sortConfigs]);

  const setSortConfigs = useCallback((configs: SortConfig[]) => {
    baseSeTConfigs(configs);
    syncToUrl(configs);
  }, [baseSeTConfigs, syncToUrl]);

  return {
    sortConfigs,
    handleSort,
    clearSort,
    getSortDirection,
    getSortOrder,
    isSorted,
    getActiveSortColumns,
    buildOrderBy,
    resetToDefault,
    setSortConfigs,
  };
}
