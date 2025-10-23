/**
 * useNavigationGuard Hook
 *
 * React hook that provides safe navigation with guards and validation
 * for use in components throughout the application.
 *
 * Features:
 * - Safe navigation functions
 * - Route validation
 * - Navigation state tracking
 * - Error handling
 * - Debug information
 */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "expo-router";
import {
  safeNavigate,
  safeGoBack,
  safeReplace,
  routeExists,
  validateRoute,
  getRouteInfo,
  getParentRoute,
  isDetailRoute,
  isListRoute,
  buildRoute,
  getNavigationStats,
  type NavigationValidationResult,
  type RouteInfo,
} from "@/utils/navigation-guards";

export interface UseNavigationGuardResult {
  // Navigation functions
  navigate: (route: string) => boolean;
  goBack: (fallbackRoute?: string) => void;
  replace: (route: string) => boolean;

  // Validation functions
  canNavigateTo: (route: string) => boolean;
  validateRoute: (route: string) => NavigationValidationResult;
  getRouteInfo: (route: string) => RouteInfo;

  // Route helpers
  isDetailRoute: (route?: string) => boolean;
  isListRoute: (route?: string) => boolean;
  getParentRoute: (route?: string) => string | null;
  buildRoute: (template: string, params: Record<string, string>) => string;

  // Current route info
  currentRoute: string;
  currentRouteInfo: RouteInfo;

  // Debug info
  getStats: () => ReturnType<typeof getNavigationStats>;
}

/**
 * Hook for safe navigation with guards
 *
 * @example
 * ```tsx
 * const { navigate, canNavigateTo, goBack } = useNavigationGuard();
 *
 * // Safe navigation with validation
 * const handleNavigate = () => {
 *   if (canNavigateTo('/producao/cronograma')) {
 *     navigate('/producao/cronograma');
 *   }
 * };
 *
 * // Safe back navigation with fallback
 * const handleBack = () => {
 *   goBack('/(tabs)/home');
 * };
 * ```
 */
export function useNavigationGuard(): UseNavigationGuardResult {
  const pathname = usePathname();
  const router = useRouter();

  // ==================== NAVIGATION FUNCTIONS ====================

  /**
   * Navigate to a route with validation
   */
  const navigate = useCallback((route: string): boolean => {
    return safeNavigate(route);
  }, []);

  /**
   * Navigate back safely with fallback
   */
  const goBack = useCallback((fallbackRoute?: string) => {
    safeGoBack(fallbackRoute);
  }, []);

  /**
   * Replace current route with validation
   */
  const replace = useCallback((route: string): boolean => {
    return safeReplace(route);
  }, []);

  // ==================== VALIDATION FUNCTIONS ====================

  /**
   * Check if navigation to route is possible
   */
  const canNavigateTo = useCallback((route: string): boolean => {
    return routeExists(route);
  }, []);

  /**
   * Validate route wrapper
   */
  const validateRouteWrapper = useCallback((route: string): NavigationValidationResult => {
    return validateRoute(route);
  }, []);

  /**
   * Get route info wrapper
   */
  const getRouteInfoWrapper = useCallback((route: string): RouteInfo => {
    return getRouteInfo(route);
  }, []);

  // ==================== ROUTE HELPERS ====================

  /**
   * Check if route (or current route) is a detail route
   */
  const isDetailRouteWrapper = useCallback((route?: string): boolean => {
    return isDetailRoute(route || pathname);
  }, [pathname]);

  /**
   * Check if route (or current route) is a list route
   */
  const isListRouteWrapper = useCallback((route?: string): boolean => {
    return isListRoute(route || pathname);
  }, [pathname]);

  /**
   * Get parent route of route (or current route)
   */
  const getParentRouteWrapper = useCallback((route?: string): string | null => {
    return getParentRoute(route || pathname);
  }, [pathname]);

  /**
   * Build route from template
   */
  const buildRouteWrapper = useCallback((template: string, params: Record<string, string>): string => {
    return buildRoute(template, params);
  }, []);

  // ==================== CURRENT ROUTE INFO ====================

  /**
   * Get info about current route
   */
  const currentRouteInfo = useMemo(() => {
    return getRouteInfo(pathname);
  }, [pathname]);

  // ==================== DEBUG ====================

  /**
   * Get navigation statistics
   */
  const getStats = useCallback(() => {
    return getNavigationStats();
  }, []);

  // ==================== RETURN ====================

  return {
    // Navigation functions
    navigate,
    goBack,
    replace,

    // Validation functions
    canNavigateTo,
    validateRoute: validateRouteWrapper,
    getRouteInfo: getRouteInfoWrapper,

    // Route helpers
    isDetailRoute: isDetailRouteWrapper,
    isListRoute: isListRouteWrapper,
    getParentRoute: getParentRouteWrapper,
    buildRoute: buildRouteWrapper,

    // Current route info
    currentRoute: pathname,
    currentRouteInfo,

    // Debug info
    getStats,
  };
}

/**
 * Hook for guarded back navigation
 *
 * Provides a safe back function with automatic fallback
 *
 * @param fallbackRoute - Route to use if back navigation is not possible
 *
 * @example
 * ```tsx
 * const goBack = useGuardedBack('/(tabs)/home');
 *
 * <Button onPress={goBack}>Back</Button>
 * ```
 */
export function useGuardedBack(fallbackRoute: string = "/(tabs)/home") {
  const { goBack } = useNavigationGuard();

  return useCallback(() => {
    goBack(fallbackRoute);
  }, [goBack, fallbackRoute]);
}

/**
 * Hook for building dynamic routes
 *
 * Provides helpers for working with parameterized routes
 *
 * @example
 * ```tsx
 * const { toDetail, toEdit, toCreate } = useDynamicRoutes('/producao/cronograma');
 *
 * // Navigate to detail: /producao/cronograma/detalhes/123
 * navigate(toDetail('123'));
 *
 * // Navigate to edit: /producao/cronograma/editar/123
 * navigate(toEdit('123'));
 *
 * // Navigate to create: /producao/cronograma/cadastrar
 * navigate(toCreate());
 * ```
 */
export function useDynamicRoutes(basePath: string) {
  const { buildRoute } = useNavigationGuard();

  const toDetail = useCallback((id: string) => {
    return `${basePath}/details/${id}`;
  }, [basePath]);

  const toEdit = useCallback((id: string) => {
    return `${basePath}/edit/${id}`;
  }, [basePath]);

  const toCreate = useCallback(() => {
    return `${basePath}/create`;
  }, [basePath]);

  const toList = useCallback(() => {
    return basePath;
  }, [basePath]);

  const withParams = useCallback((template: string, params: Record<string, string>) => {
    return buildRoute(template, params);
  }, [buildRoute]);

  return {
    toDetail,
    toEdit,
    toCreate,
    toList,
    withParams,
  };
}

/**
 * Hook for route existence checking
 *
 * Returns whether a route exists in the application
 *
 * @example
 * ```tsx
 * const exists = useRouteExists('/producao/cronograma');
 *
 * if (!exists) {
 *   console.warn('Route does not exist');
 * }
 * ```
 */
export function useRouteExists(route: string): boolean {
  return useMemo(() => routeExists(route), [route]);
}

/**
 * Hook for conditional navigation
 *
 * Provides navigation that only happens if a condition is met
 *
 * @example
 * ```tsx
 * const { navigate, canNavigate } = useConditionalNavigation('/admin', hasAdminAccess);
 *
 * <Button
 *   onPress={navigate}
 *   disabled={!canNavigate}
 * >
 *   Go to Admin
 * </Button>
 * ```
 */
export function useConditionalNavigation(route: string, condition: boolean) {
  const { navigate: baseNavigate, canNavigateTo } = useNavigationGuard();

  const navigate = useCallback(() => {
    if (condition && canNavigateTo(route)) {
      return baseNavigate(route);
    }
    return false;
  }, [condition, canNavigateTo, route, baseNavigate]);

  return {
    navigate,
    canNavigate: condition && canNavigateTo(route),
    route,
  };
}
