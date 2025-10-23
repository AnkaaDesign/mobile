/**
 * Navigation Helper Utilities
 *
 * Provides convenient helper functions for common navigation patterns
 * that work seamlessly with the navigation history tracking system.
 */

import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useNavigationHistory } from "@/contexts/navigation-history-context";

export interface NavigateOptions {
  replace?: boolean;
  trackHistory?: boolean;
  params?: Record<string, any>;
}

/**
 * Enhanced navigation helpers with history tracking
 */
export function useNavigationHelpers() {
  const router = useRouter();
  const {
    goBack,
    canGoBack,
    navigateWithHistory,
    replaceInHistory,
    getBackPath,
    getPreviousRoute,
    isInitialRoute,
    getNavigationDepth,
  } = useNavigationHistory();

  /**
   * Navigate to a path with optional history tracking
   */
  const navigate = useCallback(
    (path: string, options: NavigateOptions = {}) => {
      const { replace = false, trackHistory = true, params } = options;

      if (replace) {
        if (trackHistory) {
          replaceInHistory(path, params);
        } else {
          router.replace(path as any);
        }
      } else {
        if (trackHistory) {
          navigateWithHistory(path, params);
        } else {
          router.push(path as any);
        }
      }
    },
    [router, navigateWithHistory, replaceInHistory]
  );

  /**
   * Navigate back with smart fallback handling
   * Falls back to home or a specified path if no history exists
   */
  const navigateBack = useCallback(
    (fallbackPath?: string) => {
      goBack(fallbackPath);
    },
    [goBack]
  );

  /**
   * Navigate to a detail page from a list page
   * Commonly used pattern: /list -> /details/[id]
   */
  const navigateToDetail = useCallback(
    (basePath: string, id: string | number, params?: Record<string, any>) => {
      const detailPath = `${basePath}/details/${id}`;
      navigateWithHistory(detailPath, { ...params, id });
    },
    [navigateWithHistory]
  );

  /**
   * Navigate to an edit page from a detail page
   * Commonly used pattern: /details/[id] -> /edit/[id]
   */
  const navigateToEdit = useCallback(
    (basePath: string, id: string | number, params?: Record<string, any>) => {
      const editPath = `${basePath}/edit/${id}`;
      navigateWithHistory(editPath, { ...params, id });
    },
    [navigateWithHistory]
  );

  /**
   * Navigate to a create page
   * Commonly used pattern: /list -> /create
   */
  const navigateToCreate = useCallback(
    (basePath: string, params?: Record<string, any>) => {
      const createPath = `${basePath}/create`;
      navigateWithHistory(createPath, params);
    },
    [navigateWithHistory]
  );

  /**
   * Navigate back to list page with smart fallback
   * Checks history for the list route, otherwise constructs it from current path
   */
  const navigateToList = useCallback(
    (basePath: string) => {
      const listPath = `${basePath}/list`;
      const previousRoute = getPreviousRoute();

      // If previous route was the list page, go back
      if (previousRoute && previousRoute.path.includes("/list")) {
        goBack(listPath);
      } else {
        // Otherwise navigate to list page
        navigateWithHistory(listPath);
      }
    },
    [navigateWithHistory, getPreviousRoute, goBack]
  );

  /**
   * Navigate to home with history reset
   */
  const navigateToHome = useCallback(() => {
    router.push("/(tabs)/home" as any);
  }, [router]);

  /**
   * Check if we can navigate back safely
   */
  const canNavigateBack = canGoBack;

  /**
   * Get the previous navigation path
   */
  const getPreviousPath = useCallback(() => {
    return getBackPath();
  }, [getBackPath]);

  /**
   * Check if we're on an initial/root route
   */
  const isRootRoute = isInitialRoute;

  /**
   * Get current navigation stack depth
   */
  const navigationDepth = getNavigationDepth();

  /**
   * Navigate with explicit history replacement
   * Useful for redirects where you don't want the intermediate page in history
   */
  const redirectTo = useCallback(
    (path: string, params?: Record<string, any>) => {
      replaceInHistory(path, params);
    },
    [replaceInHistory]
  );

  /**
   * Handle post-save navigation
   * Common pattern: after saving an edit form, go back to detail or list
   */
  const handlePostSaveNavigation = useCallback(
    (options: {
      entityId?: string | number;
      basePath: string;
      navigateToDetail?: boolean;
      fallbackToList?: boolean;
    }) => {
      const { entityId, basePath, navigateToDetail = true, fallbackToList = true } = options;

      // If we should navigate to detail and we have an ID
      if (navigateToDetail && entityId) {
        const detailPath = `${basePath}/details/${entityId}`;
        replaceInHistory(detailPath, { id: entityId });
        return;
      }

      // Otherwise, try to go back
      if (canGoBack) {
        goBack();
        return;
      }

      // Final fallback to list if enabled
      if (fallbackToList) {
        const listPath = `${basePath}/list`;
        router.push(listPath as any);
      }
    },
    [canGoBack, goBack, replaceInHistory, router]
  );

  /**
   * Handle post-delete navigation
   * Common pattern: after deleting an entity, go back to list
   */
  const handlePostDeleteNavigation = useCallback(
    (basePath: string) => {
      const listPath = `${basePath}/list`;

      // Check if we came from the list page
      const previousRoute = getPreviousRoute();
      if (previousRoute && previousRoute.path.includes("/list")) {
        goBack();
      } else {
        // Otherwise navigate directly to list
        router.push(listPath as any);
      }
    },
    [getPreviousRoute, goBack, router]
  );

  return {
    // Basic navigation
    navigate,
    navigateBack,
    navigateToHome,
    redirectTo,

    // Entity CRUD navigation patterns
    navigateToDetail,
    navigateToEdit,
    navigateToCreate,
    navigateToList,

    // Post-action navigation
    handlePostSaveNavigation,
    handlePostDeleteNavigation,

    // Navigation state queries
    canNavigateBack,
    getPreviousPath,
    isRootRoute,
    navigationDepth,
  };
}

/**
 * Hook to check if we're on a specific type of route
 */
export function useRouteType() {
  const router = useRouter();
  const { isInitialRoute } = useNavigationHistory();

  const checkRouteType = useCallback((pathname: string) => {
    return {
      isList: pathname.includes("/list"),
      isDetail: pathname.includes("/details/"),
      isEdit: pathname.includes("/edit/"),
      isCreate: pathname.includes("/create"),
      isHome: pathname === "/(tabs)/home" || pathname === "/home",
      isAuth: pathname.startsWith("/(auth)"),
      isInitial: isInitialRoute(),
    };
  }, [isInitialRoute]);

  return { checkRouteType };
}

/**
 * Hook for deep link handling with navigation history
 */
export function useDeepLinkNavigation() {
  const router = useRouter();
  const { pushToHistory, clearHistory } = useNavigationHistory();

  /**
   * Handle deep link navigation with proper history tracking
   */
  const handleDeepLink = useCallback(
    (url: string, clearExistingHistory = false) => {
      if (clearExistingHistory) {
        clearHistory();
      }

      // Extract path from URL
      // Assuming URL format: myapp://path/to/screen
      const path = url.replace(/^[a-zA-Z]+:\/\//, "");

      // Track in history
      pushToHistory(`/(tabs)/${path}`);

      // Navigate
      router.push(path as any);
    },
    [router, pushToHistory, clearHistory]
  );

  return { handleDeepLink };
}

/**
 * Hook for handling tab navigation with history
 */
export function useTabNavigation() {
  const router = useRouter();
  const { navigateWithHistory, getBackPath } = useNavigationHistory();

  /**
   * Navigate to a tab with history tracking
   */
  const navigateToTab = useCallback(
    (tabPath: string) => {
      const fullPath = `/(tabs)/${tabPath}`;
      navigateWithHistory(fullPath);
    },
    [navigateWithHistory]
  );

  /**
   * Check if switching tabs (going from one root tab to another)
   */
  const isSwitchingTabs = useCallback(
    (currentPath: string, previousPath: string | null) => {
      if (!previousPath) return false;

      // Extract base tab paths
      const currentTab = currentPath.split("/")[2]; // /(tabs)/[tab]/...
      const previousTab = previousPath.split("/")[2];

      return currentTab !== previousTab;
    },
    []
  );

  return { navigateToTab, isSwitchingTabs };
}
