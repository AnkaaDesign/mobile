/**
 * Hook for lazy importing components with preload capability
 * Improves initial load time by splitting code and loading on demand
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { InteractionManager } from 'react-native';

type ComponentModule<T> = () => Promise<{ default: T }>;

interface UseLazyImportOptions {
  preload?: boolean;
  preloadDelay?: number;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (error: Error) => void;
}

export function useLazyImport<T = any>(
  importFn: ComponentModule<T>,
  options: UseLazyImportOptions = {}
) {
  const {
    preload = false,
    preloadDelay = 500,
    onLoadStart,
    onLoadComplete,
    onLoadError,
  } = options;

  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const isLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (isLoadedRef.current || loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    const loadPromise = (async () => {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      try {
        const module = await importFn();
        setComponent(() => module.default);
        isLoadedRef.current = true;
        onLoadComplete?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        onLoadError?.(error);
        console.error('[useLazyImport] Failed to load component:', error);
      } finally {
        setIsLoading(false);
        loadPromiseRef.current = null;
      }
    })();

    loadPromiseRef.current = loadPromise;
    return loadPromise;
  }, [importFn, onLoadStart, onLoadComplete, onLoadError]);

  // Preload component after interactions complete
  useEffect(() => {
    if (preload && !isLoadedRef.current) {
      const timer = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          load();
        });
      }, preloadDelay);

      return () => clearTimeout(timer);
    }
  }, [preload, preloadDelay, load]);

  return {
    Component,
    isLoading,
    error,
    load,
    isLoaded: isLoadedRef.current,
  };
}

/**
 * Hook to preload multiple components
 */
export function usePreloadComponents(
  components: Array<{
    name: string;
    import: ComponentModule<any>;
    priority?: 'high' | 'medium' | 'low';
  }>
) {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadAll = useCallback(async () => {
    setIsPreloading(true);

    // Sort by priority
    const sorted = [...components].sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return (priorityMap[a.priority || 'low'] - priorityMap[b.priority || 'low']);
    });

    // Load components in priority order
    for (const component of sorted) {
      if (!loadedComponents.has(component.name)) {
        try {
          await component.import();
          setLoadedComponents(prev => new Set(prev).add(component.name));
        } catch (error) {
          console.error(`[usePreloadComponents] Failed to preload ${component.name}:`, error);
        }
      }
    }

    setIsPreloading(false);
  }, [components, loadedComponents]);

  // Auto-preload after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        preloadAll();
      });
    }, 1000); // Wait 1 second before preloading

    return () => clearTimeout(timer);
  }, []);

  return {
    loadedComponents,
    isPreloading,
    preloadAll,
  };
}

/**
 * HOC for lazy loading components
 */
export function withLazyLoad<P extends object>(
  importFn: ComponentModule<React.ComponentType<P>>,
  LoadingComponent?: React.ComponentType,
  ErrorComponent?: React.ComponentType<{ error: Error }>
) {
  return function LazyLoadedComponent(props: P) {
    const { Component, isLoading, error, load } = useLazyImport(importFn);

    useEffect(() => {
      load();
    }, [load]);

    if (error && ErrorComponent) {
      return <ErrorComponent error={error} />;
    }

    if (isLoading || !Component) {
      return LoadingComponent ? <LoadingComponent /> : null;
    }

    return <Component {...props} />;
  };
}