import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook for managing column visibility with persistent storage
 *
 * This hook manages which columns are visible in a table and persists the
 * preference to AsyncStorage so it's remembered across app restarts.
 *
 * @param entityKey - Unique key for the entity (e.g., "customers", "items", "tasks")
 * @param defaultColumns - Default visible columns
 * @param allColumns - All available columns (optional, for validation)
 * @returns Column visibility state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   visibleColumns,
 *   setVisibleColumns,
 *   toggleColumn,
 *   resetToDefaults,
 *   isColumnVisible
 * } = useColumnVisibility('customers', ['name', 'email', 'phone']);
 *
 * // In your table:
 * <Table
 *   columns={allColumns.filter(col => visibleColumns.includes(col.key))}
 * />
 *
 * // In column visibility drawer:
 * <Switch
 *   value={isColumnVisible('name')}
 *   onValueChange={() => toggleColumn('name')}
 * />
 * ```
 */
export function useColumnVisibility(
  entityKey: string,
  defaultColumns: string[],
  allColumns?: string[]
) {
  const storageKey = `@column_visibility_${entityKey}`;
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;
  const isLoadedRef = useRef(false);
  const [visibleColumns, setVisibleColumnsState] = useState<Set<string>>(new Set(defaultColumns));
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted column visibility ONCE on mount (or when entityKey changes)
  useEffect(() => {
    let cancelled = false;
    isLoadedRef.current = false;

    const loadVisibility = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;

        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVisibleColumnsState(new Set(parsed));
          }
        }
      } catch (error) {
        console.error('Error loading column visibility:', error);
      } finally {
        if (!cancelled) {
          isLoadedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    loadVisibility();
    return () => { cancelled = true; };
  }, [entityKey, storageKey]);

  // Validate visible columns when allColumns changes (separate from loading)
  useEffect(() => {
    if (!isLoadedRef.current || !allColumns || allColumns.length === 0) return;

    const allColumnsSet = new Set(allColumns);
    setVisibleColumnsState((current) => {
      const valid = new Set(Array.from(current).filter(col => allColumnsSet.has(col)));
      if (valid.size === 0) {
        const result = new Set(defaultColumns);
        AsyncStorage.setItem(storageKeyRef.current, JSON.stringify(Array.from(result)));
        return result;
      }
      if (valid.size !== current.size) {
        AsyncStorage.setItem(storageKeyRef.current, JSON.stringify(Array.from(valid)));
        return valid;
      }
      return current;
    });
  }, [allColumns, defaultColumns]);

  // Persist column visibility whenever it changes
  const setVisibleColumns = useCallback(async (columns: Set<string>) => {
    try {
      setVisibleColumnsState(columns);
      await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(columns)));
    } catch (error) {
      console.error('Error saving column visibility:', error);
    }
  }, [storageKey]);

  // Toggle a single column
  const toggleColumn = useCallback(async (columnKey: string) => {
    setVisibleColumnsState(current => {
      const newColumns = new Set(current);
      if (newColumns.has(columnKey)) {
        newColumns.delete(columnKey);
      } else {
        newColumns.add(columnKey);
      }

      // Persist immediately
      AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(newColumns))).catch(error =>
        console.error('Error saving column visibility:', error)
      );

      return newColumns;
    });
  }, [storageKey]);

  // Show a column
  const showColumn = useCallback(async (columnKey: string) => {
    if (visibleColumns.has(columnKey)) return;

    const newColumns = new Set(visibleColumns);
    newColumns.add(columnKey);
    await setVisibleColumns(newColumns);
  }, [visibleColumns, setVisibleColumns]);

  // Hide a column
  const hideColumn = useCallback(async (columnKey: string) => {
    if (!visibleColumns.has(columnKey)) return;

    const newColumns = new Set(visibleColumns);
    newColumns.delete(columnKey);
    await setVisibleColumns(newColumns);
  }, [visibleColumns, setVisibleColumns]);

  // Reset to default columns
  const resetToDefaults = useCallback(async () => {
    await setVisibleColumns(new Set(defaultColumns));
  }, [defaultColumns, setVisibleColumns]);

  // Check if a column is visible
  const isColumnVisible = useCallback((columnKey: string): boolean => {
    return visibleColumns.has(columnKey);
  }, [visibleColumns]);

  // Get hidden columns
  const getHiddenColumns = useCallback((): string[] => {
    if (!allColumns) return [];
    return allColumns.filter(col => !visibleColumns.has(col));
  }, [allColumns, visibleColumns]);

  // Show all columns
  const showAllColumns = useCallback(async () => {
    if (!allColumns) return;
    await setVisibleColumns(new Set(allColumns));
  }, [allColumns, setVisibleColumns]);

  // Hide all columns (keep at least one)
  const hideAllColumns = useCallback(async () => {
    if (visibleColumns.size === 0 || !allColumns) return;
    // Keep the first default column visible
    await setVisibleColumns(new Set([defaultColumns[0]]));
  }, [defaultColumns, allColumns, visibleColumns, setVisibleColumns]);

  return {
    /** Currently visible column keys */
    visibleColumns,
    /** Set visible columns directly */
    setVisibleColumns,
    /** Toggle a column's visibility */
    toggleColumn,
    /** Show a specific column */
    showColumn,
    /** Hide a specific column */
    hideColumn,
    /** Reset to default columns */
    resetToDefaults,
    /** Check if a column is visible */
    isColumnVisible,
    /** Get hidden columns (requires allColumns) */
    getHiddenColumns,
    /** Show all columns */
    showAllColumns,
    /** Hide all columns (keeps first default) */
    hideAllColumns,
    /** Loading state */
    isLoading,
  };
}

/**
 * Hook for managing column visibility with change tracking
 *
 * This variant tracks whether columns have been modified from defaults
 * and provides a "has changes" indicator.
 *
 * @example
 * ```tsx
 * const columns = useColumnVisibilityWithTracking('items', DEFAULT_COLUMNS);
 *
 * <Button
 *   onPress={columns.resetToDefaults}
 *   disabled={!columns.hasChanges}
 * >
 *   Reset to Defaults
 * </Button>
 * ```
 */
export function useColumnVisibilityWithTracking(
  entityKey: string,
  defaultColumns: string[],
  allColumns?: string[]
) {
  const base = useColumnVisibility(entityKey, defaultColumns, allColumns);

  // Check if current columns differ from defaults
  const hasChanges = useCallback((): boolean => {
    if (base.visibleColumns.size !== defaultColumns.length) return true;

    return !defaultColumns.every(col => base.visibleColumns.has(col));
  }, [base.visibleColumns, defaultColumns]);

  return {
    ...base,
    /** Whether columns differ from defaults */
    hasChanges: hasChanges(),
  };
}

/**
 * Hook for managing column visibility with column groups
 *
 * Allows managing visibility of predefined column groups (e.g., "basic info", "contact", "metadata")
 *
 * @example
 * ```tsx
 * const columns = useColumnVisibilityWithGroups('users', {
 *   default: ['name', 'email'],
 *   groups: {
 *     basic: ['name', 'email', 'phone'],
 *     contact: ['email', 'phone', 'address'],
 *     metadata: ['createdAt', 'updatedAt'],
 *   }
 * });
 *
 * <Button onPress={() => columns.showGroup('contact')}>
 *   Show Contact Info
 * </Button>
 * ```
 */
export function useColumnVisibilityWithGroups(
  entityKey: string,
  config: {
    default: string[];
    groups: Record<string, string[]>;
    allColumns?: string[];
  }
) {
  const base = useColumnVisibility(entityKey, config.default, config.allColumns);

  // Show a predefined group of columns
  const showGroup = useCallback(async (groupKey: string) => {
    const groupColumns = config.groups[groupKey];
    if (!groupColumns) return;

    // Merge with current visible columns (don't hide others)
    const newColumns = new Set([...base.visibleColumns, ...groupColumns]);
    await base.setVisibleColumns(newColumns);
  }, [config.groups, base]);

  // Hide a predefined group of columns
  const hideGroup = useCallback(async (groupKey: string) => {
    const groupColumns = config.groups[groupKey];
    if (!groupColumns) return;

    const newColumns = new Set(Array.from(base.visibleColumns).filter(col => !groupColumns.includes(col)));
    await base.setVisibleColumns(newColumns);
  }, [config.groups, base]);

  // Show only a specific group
  const showOnlyGroup = useCallback(async (groupKey: string) => {
    const groupColumns = config.groups[groupKey];
    if (!groupColumns) return;

    await base.setVisibleColumns(new Set(groupColumns));
  }, [config.groups, base]);

  // Check if a group is fully visible
  const isGroupVisible = useCallback((groupKey: string): boolean => {
    const groupColumns = config.groups[groupKey];
    if (!groupColumns) return false;

    return groupColumns.every(col => base.visibleColumns.has(col));
  }, [config.groups, base.visibleColumns]);

  // Check if a group is partially visible
  const isGroupPartiallyVisible = useCallback((groupKey: string): boolean => {
    const groupColumns = config.groups[groupKey];
    if (!groupColumns) return false;

    return groupColumns.some(col => base.visibleColumns.has(col));
  }, [config.groups, base.visibleColumns]);

  return {
    ...base,
    /** Show columns from a group */
    showGroup,
    /** Hide columns from a group */
    hideGroup,
    /** Show only columns from a group */
    showOnlyGroup,
    /** Check if all columns in a group are visible */
    isGroupVisible,
    /** Check if some columns in a group are visible */
    isGroupPartiallyVisible,
    /** Available groups */
    groups: Object.keys(config.groups),
  };
}

/**
 * Utility to create column visibility config for common patterns
 */
export const createColumnVisibilityConfig = (options: {
  entityKey: string;
  basicColumns: string[];
  detailedColumns?: string[];
  metadataColumns?: string[];
  allColumns?: string[];
}) => {
  const { entityKey, basicColumns, detailedColumns, metadataColumns, allColumns } = options;

  return {
    entityKey,
    default: basicColumns,
    groups: {
      basic: basicColumns,
      ...(detailedColumns && { detailed: detailedColumns }),
      ...(metadataColumns && { metadata: metadataColumns }),
      ...(allColumns && { all: allColumns }),
    },
    allColumns,
  };
};
