import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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


  // Track route changes and build history
  useEffect(() => {
    if (pathname) {
      addToHistory(pathname);
    }
  }, [pathname]);

  const addToHistory = (path: string) => {
    setHistory((prev) => {
      // Clear history when navigating to auth routes (logout scenario)
      if (path.startsWith("/(autenticacao)")) {
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
    if (history.length > 1) {
      const previousRoute = history[history.length - 2];
      if (previousRoute && !previousRoute.startsWith("/(autenticacao)")) {
        setHistory((prev) => prev.slice(0, -1));
        router.push(previousRoute as any);
      } else {
        setHistory([]);
        router.push("/(tabs)/inicio" as any);
      }
    } else {
      router.push("/(tabs)/inicio" as any);
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
