import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "expo-router";

interface NavigationHistoryContextType {
  canGoBack: boolean;
  goBack: () => void;
  getBackPath: () => string | null;
  clearHistory: () => void;
  pushToHistory: (path: string) => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

interface NavigationHistoryProviderProps {
  children: ReactNode;
}

export function NavigationHistoryProvider({ children }: NavigationHistoryProviderProps) {
  const [history, setHistory] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Debug logging for navigation history (only in development)
  useEffect(() => {
    if (__DEV__) {
      console.log("🧭 Navigation History:", history);
      console.log("📍 Current Path:", pathname);
    }
  }, [history, pathname]);

  // Track route changes and build history
  useEffect(() => {
    if (pathname) {
      addToHistory(pathname);
    }
  }, [pathname]);

  const addToHistory = (path: string) => {
    setHistory((prev) => {
      // Clear history when navigating to auth routes (logout scenario)
      if (path.startsWith("/(auth)")) {
        return [];
      }

      // Don't track the index route
      if (path === "/") {
        return prev;
      }

      // Don't add the same route consecutively
      if (prev.length > 0 && prev[prev.length - 1] === path) {
        return prev;
      }

      // Add current route to history
      const newHistory = [...prev, path];

      // Keep history manageable (max 20 entries)
      if (newHistory.length > 20) {
        return newHistory.slice(-20);
      }

      return newHistory;
    });
  };

  const canGoBack = history.length > 1;

  const goBack = () => {
    console.log('[NAV HISTORY] goBack called, history length:', history.length);

    if (history.length > 1) {
      // Get the previous route from our manual history tracking
      const previousRoute = history[history.length - 2];

      // Validate the previous route exists and is accessible
      if (previousRoute && !previousRoute.startsWith("/(auth)")) {
        console.log('[NAV HISTORY] Going back to:', previousRoute);
        // Update history state to remove current route
        setHistory((prev) => prev.slice(0, -1));
        // Navigate to the previous route using push instead of back
        // This is more reliable with drawer navigation
        router.push(previousRoute as any);
      } else {
        // If previous route is invalid, clear history and go to home
        console.log('[NAV HISTORY] Invalid previous route, going to home');
        setHistory([]);
        router.push("/(tabs)/home" as any);
      }
    } else {
      // Fallback to home if no history
      console.log('[NAV HISTORY] No history, going to home');
      router.push("/(tabs)/home" as any);
    }
  };

  const getBackPath = (): string | null => {
    if (history.length > 1) {
      return history[history.length - 2];
    }
    return null;
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const pushToHistory = (path: string) => {
    addToHistory(path);
  };

  const value: NavigationHistoryContextType = {
    canGoBack,
    goBack,
    getBackPath,
    clearHistory,
    pushToHistory,
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
