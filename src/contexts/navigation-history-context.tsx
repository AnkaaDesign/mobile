import { createContext, useContext, useEffect, useCallback, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import { InteractionManager } from "react-native";
import { navigationDebugger, logNavigationStack } from '@/utils/navigation-debugger';

interface NavigationHistoryContextType {
  canGoBack: () => boolean;
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

// Helper to determine if a screen should reset when left
function shouldResetOnLeave(screenPath: string): boolean {
  if (screenPath.includes("/cadastrar") || screenPath.includes("/editar")) {
    return true;
  }
  return false;
}

export function NavigationHistoryProvider({ children }: NavigationHistoryProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  // ALL state lives in refs — no useState, no re-renders
  const historyRef = useRef<string[]>([]);
  const previousPathname = useRef<string>("");
  const currentPathnameRef = useRef(pathname);

  // Store screen reset functions
  const screenResetFunctions = useRef<Map<string, () => void>>(new Map());

  // Update current pathname ref (no state update, no re-render)
  useEffect(() => {
    currentPathnameRef.current = pathname;
  }, [pathname]);

  // Track route changes and handle state resets
  useEffect(() => {
    if (pathname && pathname !== previousPathname.current) {
      navigationDebugger.trackRouteChange(previousPathname.current || '/', pathname);

      // Reset form state when navigating away
      const previousScreen = previousPathname.current;
      if (previousScreen && shouldResetOnLeave(previousScreen)) {
        const resetFn = screenResetFunctions.current.get(previousScreen);
        if (resetFn) {
          InteractionManager.runAfterInteractions(() => {
            resetFn();
          });
        }
      }

      previousPathname.current = pathname;

      // Track non-auth routes in history (ref-only, no state update)
      if (!pathname.startsWith("/(autenticacao)") && pathname !== "/") {
        const prev = historyRef.current;
        if (prev.length === 0 || prev[prev.length - 1] !== pathname) {
          historyRef.current = [...prev, pathname].slice(-10);
          logNavigationStack(historyRef.current, pathname);
        }
      }
    }
  }, [pathname]);

  const goBack = useCallback(() => {
    const currentHistory = historyRef.current;
    const r = routerRef.current;

    if (currentHistory.length > 1) {
      const previousPath = currentHistory[currentHistory.length - 2];
      // Remove current from history
      historyRef.current = currentHistory.slice(0, -1);
      r.replace(previousPath as any);
    } else if (r.canGoBack()) {
      r.back();
    }
  }, []);

  const getBackPath = useCallback((): string | null => {
    const currentHistory = historyRef.current;
    if (currentHistory.length > 1) {
      return currentHistory[currentHistory.length - 2];
    }
    return null;
  }, []);

  const canGoBack = useCallback((): boolean => {
    return historyRef.current.length > 1 || routerRef.current.canGoBack();
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);

  const pushToHistory = useCallback((path: string) => {
    if (!path.startsWith("/(autenticacao)") && path !== "/") {
      const prev = historyRef.current;
      if (prev.length === 0 || prev[prev.length - 1] !== path) {
        historyRef.current = [...prev, path].slice(-10);
      }
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

  // Stable ref for context value — created once, never changes
  const valueRef = useRef<NavigationHistoryContextType>({
    canGoBack,
    goBack,
    getBackPath,
    clearHistory,
    pushToHistory,
    resetScreenState,
    registerScreenReset,
    unregisterScreenReset,
  });

  return <NavigationHistoryContext.Provider value={valueRef.current}>{children}</NavigationHistoryContext.Provider>;
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (context === undefined) {
    throw new Error("useNavigationHistory must be used within a NavigationHistoryProvider");
  }
  return context;
}
