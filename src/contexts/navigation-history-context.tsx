import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { usePathname, useRouter, useNavigation } from "expo-router";
import { useNavigationState } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NAVIGATION_HISTORY_KEY = "@navigation_history";
const MAX_HISTORY_SIZE = 50;
const INITIAL_ROUTES = ["/(tabs)/home"];

interface NavigationEntry {
  path: string;
  timestamp: number;
  params?: Record<string, any>;
}

interface NavigationHistoryContextType {
  canGoBack: boolean;
  goBack: (fallbackPath?: string) => void;
  getBackPath: () => string | null;
  clearHistory: () => void;
  pushToHistory: (path: string, params?: Record<string, any>) => void;
  getHistory: () => NavigationEntry[];
  getPreviousRoute: () => NavigationEntry | null;
  isInitialRoute: () => boolean;
  navigateWithHistory: (path: string, params?: Record<string, any>) => void;
  replaceInHistory: (path: string, params?: Record<string, any>) => void;
  getNavigationDepth: () => number;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

interface NavigationHistoryProviderProps {
  children: ReactNode;
}

export function NavigationHistoryProvider({ children }: NavigationHistoryProviderProps) {
  const [history, setHistory] = useState<NavigationEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigation();
  const isInitialMount = useRef(true);
  const lastProcessedPath = useRef<string | null>(null);

  // Use React Navigation's native state to determine if we can go back
  // This is more reliable than maintaining our own history
  const navigationState = useNavigationState((state) => state);
  const canGoBackNative = navigation?.canGoBack?.() ?? false;

  // Hydrate history from AsyncStorage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(NAVIGATION_HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Filter out stale entries (older than 24 hours)
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const validEntries = parsed.filter((entry: NavigationEntry) => entry.timestamp > dayAgo);
          setHistory(validEntries);
          if (__DEV__) {
            console.log("🧭 Hydrated navigation history:", validEntries.length, "entries");
          }
        }
      } catch (error) {
        console.error("Failed to load navigation history:", error);
      } finally {
        setIsHydrated(true);
      }
    };
    loadHistory();
  }, []);

  // Persist history to AsyncStorage whenever it changes
  useEffect(() => {
    if (isHydrated && history.length > 0) {
      AsyncStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(history)).catch((error) => {
        console.error("Failed to persist navigation history:", error);
      });
    }
  }, [history, isHydrated]);

  // Debug logging for navigation history (only in development)
  useEffect(() => {
    if (__DEV__ && isHydrated) {
      console.log("🧭 Navigation History:", history.map(h => h.path));
      console.log("📍 Current Path:", pathname);
      console.log("📊 History Depth:", history.length);
      console.log("🔙 Can Go Back (Native):", canGoBackNative);
      console.log("📱 Navigation State Routes:", navigationState?.routes?.length);
    }
  }, [history, pathname, isHydrated, canGoBackNative, navigationState]);

  // Track route changes and build history
  useEffect(() => {
    if (!isHydrated) return;

    // Skip if this is the same path we just processed
    if (pathname === lastProcessedPath.current) {
      return;
    }

    if (pathname && pathname !== "/") {
      lastProcessedPath.current = pathname;
      addToHistory(pathname);
    }
  }, [pathname, isHydrated]);

  const addToHistory = useCallback((path: string, params?: Record<string, any>) => {
    setHistory((prev) => {
      // Clear history when navigating to auth routes (logout scenario)
      if (path.startsWith("/(auth)")) {
        AsyncStorage.removeItem(NAVIGATION_HISTORY_KEY).catch(() => {});
        return [];
      }

      // Don't track the index route
      if (path === "/" || path === "") {
        return prev;
      }

      // Don't add the same route consecutively (unless params changed)
      if (prev.length > 0) {
        const lastEntry = prev[prev.length - 1];
        const samePathAndParams =
          lastEntry.path === path &&
          JSON.stringify(lastEntry.params) === JSON.stringify(params);

        if (samePathAndParams) {
          return prev;
        }
      }

      // Create new navigation entry
      const newEntry: NavigationEntry = {
        path,
        timestamp: Date.now(),
        params,
      };

      // Add current route to history
      const newHistory = [...prev, newEntry];

      // Keep history manageable
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }

      return newHistory;
    });
  }, []);

  // Use React Navigation's native canGoBack instead of our own history length
  // This ensures we respect the actual navigation stack
  const canGoBack = canGoBackNative;

  const goBack = useCallback((fallbackPath?: string) => {
    if (__DEV__) {
      console.log('[NAV HISTORY] goBack called');
      console.log('[NAV HISTORY] Can go back (native):', canGoBackNative);
      console.log('[NAV HISTORY] History length:', history.length);
      console.log('[NAV HISTORY] Current pathname:', pathname);
    }

    // Always use React Navigation's native back if available
    if (canGoBackNative) {
      if (__DEV__) {
        console.log('[NAV HISTORY] Using native router.back()');
      }

      // Update our history to match (for getBackPath reference)
      setHistory((prev) => prev.slice(0, -1));

      // Use native back navigation - let React Navigation handle the stack
      try {
        router.back();
      } catch (error) {
        console.error('[NAV HISTORY] router.back() failed:', error);
        // Fallback to previous path if we have it in history
        if (history.length > 1) {
          const previousEntry = history[history.length - 2];
          router.push(previousEntry.path as any);
        } else {
          const destination = fallbackPath || "/(tabs)/home";
          router.push(destination as any);
        }
      }
    } else {
      // No native navigation stack available
      if (__DEV__) {
        console.log('[NAV HISTORY] No native navigation stack available');
      }

      // Try to use our own history as fallback
      if (history.length > 1) {
        const previousEntry = history[history.length - 2];
        if (previousEntry && !previousEntry.path.startsWith("/(auth)")) {
          if (__DEV__) {
            console.log('[NAV HISTORY] Using history fallback, going to:', previousEntry.path);
          }
          setHistory((prev) => prev.slice(0, -1));
          router.push(previousEntry.path as any);
        } else {
          const destination = fallbackPath || "/(tabs)/home";
          setHistory([]);
          router.push(destination as any);
        }
      } else {
        // No history and no native stack - go to fallback or home
        if (__DEV__) {
          console.log('[NAV HISTORY] No history available, going to fallback or home');
        }
        const destination = fallbackPath || "/(tabs)/home";
        router.push(destination as any);
      }
    }
  }, [canGoBackNative, history, router, pathname]);

  const getBackPath = useCallback((): string | null => {
    if (history.length > 1) {
      return history[history.length - 2].path;
    }
    return null;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(NAVIGATION_HISTORY_KEY).catch(() => {});
  }, []);

  const pushToHistory = useCallback((path: string, params?: Record<string, any>) => {
    addToHistory(path, params);
  }, [addToHistory]);

  const getHistory = useCallback((): NavigationEntry[] => {
    return [...history];
  }, [history]);

  const getPreviousRoute = useCallback((): NavigationEntry | null => {
    if (history.length > 1) {
      return history[history.length - 2];
    }
    return null;
  }, [history]);

  const isInitialRoute = useCallback((): boolean => {
    return history.length <= 1 || INITIAL_ROUTES.includes(pathname);
  }, [history.length, pathname]);

  const navigateWithHistory = useCallback((path: string, params?: Record<string, any>) => {
    addToHistory(path, params);
    router.push(path as any);
  }, [addToHistory, router]);

  const replaceInHistory = useCallback((path: string, params?: Record<string, any>) => {
    setHistory((prev) => {
      if (prev.length === 0) {
        return [{
          path,
          timestamp: Date.now(),
          params,
        }];
      }

      // Replace the last entry with the new one
      const newHistory = [...prev];
      newHistory[newHistory.length - 1] = {
        path,
        timestamp: Date.now(),
        params,
      };
      return newHistory;
    });
    router.replace(path as any);
  }, [router]);

  const getNavigationDepth = useCallback((): number => {
    return history.length;
  }, [history.length]);

  const value: NavigationHistoryContextType = {
    canGoBack,
    goBack,
    getBackPath,
    clearHistory,
    pushToHistory,
    getHistory,
    getPreviousRoute,
    isInitialRoute,
    navigateWithHistory,
    replaceInHistory,
    getNavigationDepth,
  };

  return <NavigationHistoryContext.Provider value={value}>{children}</NavigationHistoryContext.Provider>;
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (context === undefined) {
    throw new Error("useNavigationHistory must be used within a NavigationHistoryProvider");
  }
  return context;
}
