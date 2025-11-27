import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook for persisting state to AsyncStorage with automatic sync
 *
 * Similar to useState but automatically persists changes to AsyncStorage.
 * Includes debouncing to prevent excessive writes and automatic loading on mount.
 *
 * @param key - The storage key to use
 * @param defaultValue - The default value if no stored value exists
 * @param debounceMs - Milliseconds to debounce storage writes (default: 500)
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = usePersistedState<'light' | 'dark'>('@theme', 'light');
 * const [filters, setFilters] = usePersistedState('@filters', { search: '', category: null });
 * ```
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 500
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load initial value from storage
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null && isMountedRef.current) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`[usePersistedState:${key}] Failed to load:`, error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadState();

    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [key]);

  // Debounced save to storage
  useEffect(() => {
    if (isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`[usePersistedState:${key}] Failed to save:`, error);
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, key, debounceMs, isLoading]);

  return [state, setState, isLoading];
}

/**
 * Hook for reading and writing individual values to AsyncStorage
 *
 * Provides functions to get/set/remove storage values without automatic sync.
 * Useful for one-off storage operations or manual control over when to persist.
 *
 * @example
 * ```tsx
 * const storage = useStorageValue();
 *
 * // Get a value
 * const theme = await storage.getValue('@theme');
 *
 * // Set a value
 * await storage.setValue('@theme', 'dark');
 *
 * // Remove a value
 * await storage.removeValue('@theme');
 *
 * // Check if exists
 * const hasTheme = await storage.hasValue('@theme');
 * ```
 */
export function useStorageValue() {
  const getValue = useCallback(async <T,>(key: string): Promise<T | null> => {
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`[useStorageValue:${key}] Failed to get:`, error);
      return null;
    }
  }, []);

  const setValue = useCallback(async <T,>(key: string, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[useStorageValue:${key}] Failed to set:`, error);
      return false;
    }
  }, []);

  const removeValue = useCallback(async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[useStorageValue:${key}] Failed to remove:`, error);
      return false;
    }
  }, []);

  const hasValue = useCallback(async (key: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`[useStorageValue:${key}] Failed to check:`, error);
      return false;
    }
  }, []);

  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('[useStorageValue] Failed to clear all:', error);
      return false;
    }
  }, []);

  const getAllKeys = useCallback(async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('[useStorageValue] Failed to get all keys:', error);
      return [];
    }
  }, []);

  return {
    getValue,
    setValue,
    removeValue,
    hasValue,
    clearAll,
    getAllKeys,
  };
}

/**
 * Storage key constants for common app state
 */
export const STORAGE_KEYS = {
  // User preferences
  THEME: '@ankaa:theme',
  LANGUAGE: '@ankaa:language',

  // UI preferences
  SIDEBAR_COLLAPSED: '@ankaa:sidebar-collapsed',
  TABLE_PAGE_SIZE: '@ankaa:table-page-size',

  // Filter states (entity-specific)
  FILTERS_ITEMS: '@ankaa:filters:items',
  FILTERS_TASKS: '@ankaa:filters:tasks',
  FILTERS_CUSTOMERS: '@ankaa:filters:customers',
  FILTERS_SUPPLIERS: '@ankaa:filters:suppliers',
  FILTERS_ACTIVITIES: '@ankaa:filters:activities',
  FILTERS_PAYROLLS: '@ankaa:filters:payrolls',
  FILTERS_VACATIONS: '@ankaa:filters:vacations',

  // Form drafts
  DRAFT_ORDER: '@ankaa:draft:order',
  DRAFT_WITHDRAWAL: '@ankaa:draft:withdrawal',
  DRAFT_TASK: '@ankaa:draft:task',

  // Navigation state
  NAV_LAST_ROUTE: '@ankaa:nav:last-route',
  NAV_HISTORY: '@ankaa:nav:history',

  // Column visibility
  COLUMNS_ITEMS: '@ankaa:columns:items',
  COLUMNS_TASKS: '@ankaa:columns:tasks',
  COLUMNS_ACTIVITIES: '@ankaa:columns:activities',

  // Auth (legacy - prefer using auth-context)
  TOKEN: '@ankaa:token',
  USER_DATA: '@ankaa:user-data',
} as const;
