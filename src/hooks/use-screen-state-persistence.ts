/**
 * Hook for managing screen state persistence
 * Allows screens to maintain state when navigating away and optionally reset when needed
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useNavigationHistory } from '@/contexts/navigation-history-context';

interface ScreenStatePersistenceOptions {
  screenName: string;
  resetOnFormSubmit?: boolean;
  resetOnLogout?: boolean;
  persistFilters?: boolean;
  persistSearch?: boolean;
  persistScroll?: boolean;
}

interface ScreenState<T = any> {
  filters?: T;
  search?: string;
  scrollPosition?: number;
  formData?: any;
  [key: string]: any;
}

export function useScreenStatePersistence<T = any>(options: ScreenStatePersistenceOptions) {
  const pathname = usePathname();
  const { registerScreenReset, unregisterScreenReset, resetScreenState } = useNavigationHistory();

  // Store the screen state
  const stateRef = useRef<ScreenState<T>>({});
  const previousPathname = useRef<string>('');

  // Helper to determine if we should persist state for this navigation
  const shouldPersistState = useCallback((fromPath: string, toPath: string) => {
    // Don't persist when navigating to auth screens
    if (toPath.startsWith('/(autenticacao)')) {
      return false;
    }

    // Don't persist when submitting forms (going from form to list/detail)
    if ((fromPath.includes('/cadastrar') || fromPath.includes('/editar')) &&
        !toPath.includes('/cadastrar') && !toPath.includes('/editar')) {
      return !options.resetOnFormSubmit;
    }

    // Persist filters and search in list screens if enabled
    if (fromPath.includes('/listar') && options.persistFilters) {
      return true;
    }

    return false;
  }, [options]);

  // Save current state
  const saveState = useCallback((state: Partial<ScreenState<T>>) => {
    stateRef.current = { ...stateRef.current, ...state };
  }, []);

  // Get saved state
  const getState = useCallback((): ScreenState<T> => {
    return stateRef.current;
  }, []);

  // Reset state manually
  const resetState = useCallback(() => {
    stateRef.current = {};
  }, []);

  // Register reset function with navigation context
  useEffect(() => {
    const resetFn = () => {
      if (!shouldPersistState(previousPathname.current, pathname)) {
        resetState();
      }
    };

    registerScreenReset(options.screenName, resetFn);

    return () => {
      unregisterScreenReset(options.screenName);
    };
  }, [options.screenName, registerScreenReset, unregisterScreenReset, resetState, shouldPersistState, pathname]);

  // Track pathname changes
  useEffect(() => {
    previousPathname.current = pathname;
  }, [pathname]);

  return {
    saveState,
    getState,
    resetState,
    isStatePersisted: () => Object.keys(stateRef.current).length > 0,
  };
}

/**
 * Hook specifically for list screens with filters and search
 */
export function useListStatePersistence<TFilters = any>() {
  const pathname = usePathname();
  const screenName = pathname.replace(/\//g, '_');

  const { saveState, getState, resetState, isStatePersisted } = useScreenStatePersistence<TFilters>({
    screenName,
    persistFilters: true,
    persistSearch: true,
    persistScroll: true,
    resetOnFormSubmit: false,
  });

  const saveFilters = useCallback((filters: TFilters) => {
    saveState({ filters });
  }, [saveState]);

  const saveSearch = useCallback((search: string) => {
    saveState({ search });
  }, [saveState]);

  const saveScrollPosition = useCallback((position: number) => {
    saveState({ scrollPosition: position });
  }, [saveState]);

  const getFilters = useCallback((): TFilters | undefined => {
    return getState().filters;
  }, [getState]);

  const getSearch = useCallback((): string => {
    return getState().search || '';
  }, [getState]);

  const getScrollPosition = useCallback((): number => {
    return getState().scrollPosition || 0;
  }, [getState]);

  return {
    // Save functions
    saveFilters,
    saveSearch,
    saveScrollPosition,

    // Get functions
    getFilters,
    getSearch,
    getScrollPosition,

    // Utility functions
    resetState,
    isStatePersisted,
  };
}

/**
 * Hook specifically for form screens
 */
export function useFormStatePersistence<TFormData = any>() {
  const pathname = usePathname();
  const screenName = pathname.replace(/\//g, '_');

  const { saveState, getState, resetState, isStatePersisted } = useScreenStatePersistence<TFormData>({
    screenName,
    resetOnFormSubmit: true, // Forms should reset after successful submission
    persistFilters: false,
    persistSearch: false,
  });

  const saveFormData = useCallback((data: TFormData) => {
    saveState({ formData: data });
  }, [saveState]);

  const getFormData = useCallback((): TFormData | undefined => {
    return getState().formData;
  }, [getState]);

  const clearFormOnSuccess = useCallback(() => {
    resetState();
  }, [resetState]);

  return {
    saveFormData,
    getFormData,
    clearFormOnSuccess,
    isStatePersisted,
  };
}