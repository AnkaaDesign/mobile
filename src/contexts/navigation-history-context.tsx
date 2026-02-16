import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import { InteractionManager } from "react-native";
import { navigationDebugger, getExpectedBackRoute, logNavigationStack } from '@/utils/navigation-debugger';

interface NavigationHistoryContextType {
  canGoBack: boolean;
  goBack: () => void;
  getBackPath: () => string | null;
  clearHistory: () => void;
  pushToHistory: (path: string) => void;
  resetScreenState: (screenName: string) => void;
  registerScreenReset: (screenName: string, resetFn: () => void) => void;
  unregisterScreenReset: (screenName: string) => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

interface NavigationHistoryProviderProps {
  children: ReactNode;
}

export function NavigationHistoryProvider({ children }: NavigationHistoryProviderProps) {
  const [history, setHistory] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef<string>("");
  const currentPathnameRef = useRef(pathname);
  useEffect(() => { currentPathnameRef.current = pathname; }, [pathname]);

  // Store screen reset functions for managing state persistence
  const screenResetFunctions = useRef<Map<string, () => void>>(new Map());

  // Track route changes and handle state resets
  useEffect(() => {
    if (pathname && pathname !== previousPathname.current) {
      // Log the route change
      navigationDebugger.trackRouteChange(previousPathname.current || '/', pathname);

      // When navigating away from a form, reset its state
      const previousScreen = previousPathname.current;
      if (previousScreen && shouldResetOnLeave(previousScreen)) {
        const resetFn = screenResetFunctions.current.get(previousScreen);
        if (resetFn) {
          // Defer reset to avoid state update during render
          InteractionManager.runAfterInteractions(() => {
            resetFn();
          });
        }
      }

      previousPathname.current = pathname;

      // Only track non-auth routes in history
      if (!pathname.startsWith("/(autenticacao)") && pathname !== "/") {
        setHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1] === pathname) {
            return prev;
          }
          const newHistory = [...prev, pathname].slice(-10); // Keep last 10 for better navigation
          logNavigationStack(newHistory, pathname);
          return newHistory;
        });
      }
    }
  }, [pathname]);

  // Helper to determine if a screen should reset when left
  const shouldResetOnLeave = (screenPath: string): boolean => {
    // Reset forms when navigating away to prevent stale data
    if (screenPath.includes("/cadastrar") || screenPath.includes("/editar")) {
      return true;
    }
    // Don't reset list filters/search unless explicitly requested
    if (screenPath.includes("/listar")) {
      return false;
    }
    return false;
  };

  // Use native router.canGoBack() instead of custom history
  const canGoBack = router.canGoBack();

  const goBack = useCallback(() => {
    // Track where we should go back to
    console.log('🔙 [NAV-CONTEXT] goBack called');
    console.log('🔙 [NAV-CONTEXT] Current path:', currentPathnameRef.current);
    console.log('🔙 [NAV-CONTEXT] History:', history);

    // If we have history, use it to navigate back properly
    if (history.length > 1) {
      const previousPath = history[history.length - 2];
      console.log('🔙 [NAV-CONTEXT] Going to previous in history:', previousPath);
      router.push(previousPath as any);
    } else if (router.canGoBack()) {
      console.log('🔙 [NAV-CONTEXT] No history, using router.back()');
      router.back();
    } else {
      console.log('🔙 [NAV-CONTEXT] Cannot go back');
    }
  }, [router, history]);

  const getBackPath = useCallback((): string | null => {
    // Return the previous route from history if available
    if (router.canGoBack() && history.length > 1) {
      return history[history.length - 2];
    }
    return null;
  }, [history, router]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const pushToHistory = useCallback((path: string) => {
    if (!path.startsWith("/(autenticacao)") && path !== "/") {
      setHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === path) {
          return prev;
        }
        return [...prev, path].slice(-5);
      });
    }
  }, []);

  const resetScreenState = useCallback((screenName: string) => {
    const resetFn = screenResetFunctions.current.get(screenName);
    if (resetFn) {
      InteractionManager.runAfterInteractions(() => {
        resetFn();
      });
    }
  }, []);

  const registerScreenReset = useCallback((screenName: string, resetFn: () => void) => {
    screenResetFunctions.current.set(screenName, resetFn);
  }, []);

  const unregisterScreenReset = useCallback((screenName: string) => {
    screenResetFunctions.current.delete(screenName);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo<NavigationHistoryContextType>(
    () => ({
      canGoBack,
      goBack,
      getBackPath,
      clearHistory,
      pushToHistory,
      resetScreenState,
      registerScreenReset,
      unregisterScreenReset,
    }),
    [canGoBack, goBack, getBackPath, clearHistory, pushToHistory, resetScreenState, registerScreenReset, unregisterScreenReset]
  );

  return <NavigationHistoryContext.Provider value={value}>{children}</NavigationHistoryContext.Provider>;
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (context === undefined) {
    throw new Error("useNavigationHistory must be used within a NavigationHistoryProvider");
  }
  return context;
}
