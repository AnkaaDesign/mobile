import { createContext, useContext, useEffect, useCallback, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import { InteractionManager, BackHandler, Platform } from "react-native";
import { navigationDebugger, logNavigationStack } from '@/utils/navigation-debugger';

interface GoBackOptions {
  fallbackRoute?: string;
}

interface NavigationHistoryContextType {
  canGoBack: () => boolean;
  goBack: (options?: GoBackOptions) => void;
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

// Known action segments that should be stripped along with their dynamic parameter
const ACTION_SEGMENTS = ['detalhes', 'editar', 'layout', 'precificacao', 'copiar-de', 'checkin-checkout'];

/**
 * Compute a parent route from the current pathname when history is empty.
 * Examples:
 *   /producao/garagens          → /(tabs)/producao
 *   /producao/agenda/detalhes/123 → /(tabs)/producao/agenda
 *   /administracao/clientes/editar/abc → /(tabs)/administracao/clientes
 *   /administracao/clientes/cadastrar  → /(tabs)/administracao/clientes
 *   /producao/cronograma/copiar-de/123 → /(tabs)/producao/cronograma
 *   /financeiro/faturamento/listar     → /(tabs)/financeiro
 *   /producao                   → /(tabs)/inicio
 */
function computeParentRoute(pathname: string): string {
  // Strip the /(tabs) prefix for easier manipulation
  let path = pathname.replace(/^\/\(tabs\)\//, '/').replace(/^\//, '');

  // Split into segments
  const segments = path.split('/').filter(Boolean);

  if (segments.length <= 1) {
    // Already at a top-level section — go home
    return '/(tabs)/inicio';
  }

  // Strip /listar — its parent directory is always an index redirect, so go up two levels
  if (segments[segments.length - 1] === 'listar') {
    const parent = segments.slice(0, -2);
    if (parent.length === 0) {
      return '/(tabs)/inicio';
    }
    return '/(tabs)/' + parent.join('/');
  }

  // Strip /cadastrar suffix (and nested cadastrar like /cadastrar/enviar)
  const cadastrarIndex = segments.indexOf('cadastrar');
  if (cadastrarIndex !== -1) {
    const parent = segments.slice(0, cadastrarIndex);
    if (parent.length === 0) {
      return '/(tabs)/inicio';
    }
    return '/(tabs)/' + parent.join('/');
  }

  // Strip action segments (detalhes/[id], editar/[id], layout/[id], etc.)
  for (const action of ACTION_SEGMENTS) {
    const actionIndex = segments.indexOf(action);
    if (actionIndex !== -1) {
      // Strip the action segment and everything after it (the dynamic id)
      const parent = segments.slice(0, actionIndex);
      if (parent.length === 0) {
        return '/(tabs)/inicio';
      }
      return '/(tabs)/' + parent.join('/');
    }
  }

  // Default: strip the last segment
  segments.pop();
  if (segments.length === 0) {
    return '/(tabs)/inicio';
  }
  return '/(tabs)/' + segments.join('/');
}

/**
 * Smartly add a path to the history stack, handling:
 * 1. Redirects: sub-route of last entry AND happened quickly (auto-redirect from index.tsx)
 * 2. Edit/create returns: path matches second-to-last → pop intermediate entry
 *    (e.g., [list, detail/123, edit/123] + detail/123 → [list, detail/123])
 * 3. Normal navigation: just push
 *
 * @param isQuickTransition - true if the transition happened within 500ms of the
 *   previous one, suggesting an automatic index.tsx redirect rather than user navigation.
 *   Without this guard, navigating from /agenda to /agenda/detalhes/123 would be
 *   mistakenly treated as a redirect (because the detail path starts with the list path).
 */
function addToHistory(prev: string[], newPath: string, isQuickTransition: boolean): string[] {
  const lastEntry = prev.length > 0 ? prev[prev.length - 1] : null;

  // Detect redirect: sub-route of last entry AND happened very quickly.
  // index.tsx redirects (e.g., /observacoes → /observacoes/listar) happen within
  // a single render cycle (<50ms). User navigations (tap → animation → render)
  // always take longer. Only replace if both conditions are met.
  if (isQuickTransition && lastEntry && newPath.startsWith(lastEntry + '/')) {
    return [...prev.slice(0, -1), newPath].slice(-10);
  }

  // Detect edit/create return: if new path matches second-to-last entry,
  // the user completed an action (detail→edit→save→detail). Remove the
  // intermediate entry to keep the stack clean.
  if (prev.length >= 2 && prev[prev.length - 2] === newPath) {
    return prev.slice(0, -1);
  }

  // Normal push
  return [...prev, newPath].slice(-10);
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
  // Timestamp of last history update — used to distinguish auto-redirects from user nav
  const lastHistoryUpdateTime = useRef<number>(0);

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
          const now = Date.now();
          const isQuickTransition = (now - lastHistoryUpdateTime.current) < 500;
          historyRef.current = addToHistory(prev, pathname, isQuickTransition);
          lastHistoryUpdateTime.current = now;
          logNavigationStack(historyRef.current, pathname);
        }
      }
    }
  }, [pathname]);

  const goBack = useCallback((options?: GoBackOptions) => {
    const currentHistory = historyRef.current;
    const r = routerRef.current;

    if (currentHistory.length > 1) {
      const previousPath = currentHistory[currentHistory.length - 2];
      // Remove current from history
      historyRef.current = currentHistory.slice(0, -1);
      // Use navigate() instead of replace() — navigate() properly switches
      // the active screen in Drawer/Tab navigators (replace only swaps the
      // current stack entry but doesn't change which Drawer screen is active)
      r.navigate(previousPath as any);
    } else if (options?.fallbackRoute) {
      // No history but explicit fallback provided — use it
      r.navigate(options.fallbackRoute as any);
    } else {
      // Compute parent route from current pathname
      const current = currentPathnameRef.current;
      const parentRoute = computeParentRoute(current);
      r.navigate(parentRoute as any);
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
        // Manual push is never an auto-redirect
        historyRef.current = addToHistory(prev, path, false);
        lastHistoryUpdateTime.current = Date.now();
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

  // Global Android back button handler — uses custom history for correct navigation.
  // Registered early (low priority in LIFO order), so modal/loading handlers registered
  // later by child providers will take precedence when active.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const current = currentPathnameRef.current;
      // At home/auth/root screens, let default behavior handle (exit app or system back)
      if (
        current === '/(tabs)/inicio' ||
        current === '/inicio' ||
        current === '/' ||
        current.startsWith('/(autenticacao)')
      ) {
        return false;
      }
      goBack();
      return true;
    });

    return () => subscription.remove();
  }, [goBack]);

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
