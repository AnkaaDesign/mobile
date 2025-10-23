/**
 * Route validation utility to prevent navigation warnings
 *
 * This utility helps validate routes before navigation attempts,
 * preventing "No route named X exists in nested children" warnings.
 */

// List of all registered routes in the application
// This should match the existingScreens array in _layout.tsx
export const REGISTERED_ROUTES = new Set([
  // Core screens
  "home",
  "settings",

  // Production Module
  "production",
  "production/airbrushing",
  "production/airbrushing/create",
  "production/airbrushing/details/[id]",
  "production/airbrushing/edit/[id]",
  "production/airbrushing/list",
  "production/schedule",
  "production/schedule/create",
  "production/schedule/details/[id]",
  "production/schedule/edit/[id]",
  "production/schedule/list",
  "production/schedule/on-hold",
  "production/history",
  "production/history/cancelled",
  "production/history/completed",
  "production/cutting",
  "production/cutting/list",
  "production/cutting/cutting-plan/create",
  "production/cutting/cutting-plan/details/[id]",
  "production/cutting/cutting-plan/edit/[id]",
  "production/cutting/cutting-plan/list",
  "production/cutting/cutting-request/create",
  "production/cutting/cutting-request/details/[id]",
  "production/cutting/cutting-request/edit/[id]",
  "production/cutting/cutting-request/list",
  "production/garages/create",
  "production/garages/details/[id]",
  "production/garages/edit/[id]",
  "production/garages/list",
  "production/observations/create",
  "production/observations/details/[id]",
  "production/observations/edit/[id]",
  "production/observations/list",
  "production/paints/create",
  "production/paints/details/[id]",
  "production/paints/edit/[id]",
  "production/paints/list",
  "production/service-orders/create",
  "production/service-orders/details/[id]",
  "production/service-orders/edit/[id]",
  "production/service-orders/list",
  "production/services",
  "production/services/create",
  "production/services/details/[id]",
  "production/services/edit/[id]",
  "production/services/list",
  "production/trucks",
  "production/trucks/create",
  "production/trucks/details/[id]",
  "production/trucks/edit/[id]",
  "production/trucks/list",

  // Inventory Module
  "inventory",
  "inventory/movements/create",
  "inventory/movements/details/[id]",
  "inventory/movements/edit/[id]",
  "inventory/movements/list",
  "inventory/products",
  "inventory/products/create",
  "inventory/products/details/[id]",
  "inventory/products/edit/[id]",
  "inventory/products/list",
  "inventory/products/categories/create",
  "inventory/products/categories/details/[id]",
  "inventory/products/categories/edit/[id]",
  "inventory/products/categories/list",
  "inventory/products/brands/create",
  "inventory/products/brands/details/[id]",
  "inventory/products/brands/edit/[id]",
  "inventory/products/brands/list",
  "inventory/suppliers/create",
  "inventory/suppliers/details/[id]",
  "inventory/suppliers/edit/[id]",
  "inventory/suppliers/list",
  "inventory/orders/create",
  "inventory/orders/details/[id]",
  "inventory/orders/edit/[id]",
  "inventory/orders/list",
  "inventory/orders/[orderId]/items/list",
  "inventory/orders/automatic",
  "inventory/orders/automatic/configure",
  "inventory/orders/automatic/list",
  "inventory/orders/schedules/create",
  "inventory/orders/schedules/details/[id]",
  "inventory/orders/schedules/edit/[id]",
  "inventory/orders/schedules/list",
  "inventory/maintenance/create",
  "inventory/maintenance/details/[id]",
  "inventory/maintenance/edit/[id]",
  "inventory/maintenance/list",
  "inventory/external-withdrawals/create",
  "inventory/external-withdrawals/details/[id]",
  "inventory/external-withdrawals/edit/[id]",
  "inventory/external-withdrawals/list",
  "inventory/ppe/create",
  "inventory/ppe/details/[id]",
  "inventory/ppe/edit/[id]",
  "inventory/ppe/list",
  "inventory/ppe/schedules/create",
  "inventory/ppe/schedules/details/[id]",
  "inventory/ppe/schedules/edit/[id]",
  "inventory/ppe/schedules/list",
  "inventory/ppe/deliveries/create",
  "inventory/ppe/deliveries/details/[id]",
  "inventory/ppe/deliveries/edit/[id]",
  "inventory/ppe/deliveries/list",
  "inventory/borrows/create",
  "inventory/borrows/details/[id]",
  "inventory/borrows/edit/[id]",
  "inventory/borrows/list",

  // Painting Module
  "painting",
  "painting/catalog",
  "painting/catalog/create",
  "painting/catalog/details/[id]",
  "painting/catalog/edit/[id]",
  "painting/catalog/list",
  "painting/formulas",
  "painting/formulas/create",
  "painting/formulas/details/[id]",
  "painting/formulas/edit/[id]",
  "painting/formulas/list",
  "painting/formulas/[formulaId]/components/list",
  "painting/paint-brands",
  "painting/paint-brands/create",
  "painting/paint-brands/details/[id]",
  "painting/paint-brands/edit/[id]",
  "painting/paint-brands/list",
  "painting/paint-types",
  "painting/paint-types/create",
  "painting/paint-types/details/[id]",
  "painting/paint-types/edit/[id]",
  "painting/paint-types/list",
  "painting/productions",
  "painting/productions/create",
  "painting/productions/details/[id]",
  "painting/productions/edit/[id]",
  "painting/productions/list",

  // Administration Module
  "administration",
  "administration/collaborators",
  "administration/collaborators/create",
  "administration/collaborators/details/[id]",
  "administration/collaborators/edit/[id]",
  "administration/collaborators/list",
  "administration/customers",
  "administration/customers/create",
  "administration/customers/details/[id]",
  "administration/customers/list",
  "administration/files",
  "administration/files/details/[id]",
  "administration/files/list",
  "administration/files/orphans",
  "administration/files/upload",
  "administration/notifications",
  "administration/notifications/create",
  "administration/notifications/create/send",
  "administration/notifications/list",
  "administration/sectors",
  "administration/sectors/create",
  "administration/sectors/details/[id]",
  "administration/sectors/edit/[id]",
  "administration/sectors/list",
  "administration/users",
  "administration/users/details/[id]",
  "administration/users/list",

  // Server Module
  "server",
  "server/backups",
  "server/backups/create",
  "server/backups/details/[id]",
  "server/backups/list",
  "server/change-logs",
  "server/change-logs/details/[id]",
  "server/change-logs/entity/[entityType]/[entityId]",
  "server/change-logs/list",
  "server/database-sync",
  "server/deployments",
  "server/deployments/details/[id]",
  "server/logs",
  "server/maintenance",
  "server/rate-limiting",
  "server/resources",
  "server/services",
  "server/shared-folders",
  "server/status",
  "server/system-users",

  // Human Resources Module
  "human-resources",
  "human-resources/employees/create",
  "human-resources/employees/details/[id]",
  "human-resources/employees/edit/[id]",
  "human-resources/employees/list",
  "human-resources/ppe/create",
  "human-resources/ppe/details/[id]",
  "human-resources/ppe/edit/[id]",
  "human-resources/ppe/list",
  "human-resources/ppe/deliveries/create",
  "human-resources/ppe/deliveries/details/[id]",
  "human-resources/ppe/deliveries/edit/[id]",
  "human-resources/ppe/deliveries/list",
  "human-resources/ppe/schedules/create",
  "human-resources/ppe/schedules/details/[id]",
  "human-resources/ppe/schedules/edit/[id]",
  "human-resources/ppe/schedules/list",
  "human-resources/ppe/sizes/create",
  "human-resources/ppe/sizes/details/[id]",
  "human-resources/ppe/sizes/edit/[id]",
  "human-resources/ppe/sizes/list",
  "human-resources/holidays",
  "human-resources/holidays/create",
  "human-resources/holidays/details/[id]",
  "human-resources/holidays/edit/[id]",
  "human-resources/holidays/list",
  "human-resources/holidays/calendar",
  "human-resources/payroll",
  "human-resources/payroll/create",
  "human-resources/payroll/details/[id]",
  "human-resources/payroll/edit/[id]",
  "human-resources/payroll/[userId]",
  "human-resources/payroll/list",
  "human-resources/performance-levels/create",
  "human-resources/performance-levels/details/[id]",
  "human-resources/performance-levels/edit/[id]",
  "human-resources/performance-levels/list",
  "human-resources/positions",
  "human-resources/positions/create",
  "human-resources/positions/details/[id]",
  "human-resources/positions/edit/[id]",
  "human-resources/positions/list",
  "human-resources/positions/[positionId]/remunerations",
  "human-resources/sectors",
  "human-resources/sectors/create",
  "human-resources/sectors/details/[id]",
  "human-resources/sectors/edit/[id]",
  "human-resources/sectors/list",
  "human-resources/vacations/create",
  "human-resources/vacations/details/[id]",
  "human-resources/vacations/list",
  "human-resources/vacations/calendar",
  "human-resources/warnings/create",
  "human-resources/warnings/details/[id]",
  "human-resources/warnings/edit/[id]",
  "human-resources/warnings/list",

  // Personal Module
  "personal",
  "personal/my-profile",
  "personal/my-holidays",
  "personal/my-borrows",
  "personal/my-borrows/details/[id]",
  "personal/my-notifications",
  "personal/my-notifications/details/[id]",
  "personal/my-ppes",
  "personal/my-ppes/request",
  "personal/my-vacations",
  "personal/my-vacations/details/[id]",
  "personal/my-warnings",
  "personal/my-warnings/details/[id]",
  "personal/preferences",

  // Integrations Module
  "integrations",
  "integrations/index",
  "integrations/secullum",
  "integrations/secullum/index",
  "integrations/secullum/sync-status",
  "integrations/secullum/calculations",
  "integrations/secullum/calculations/index",
  "integrations/secullum/calculations/list",
  "integrations/secullum/time-entries",
  "integrations/secullum/time-entries/index",
  "integrations/secullum/time-entries/list",
  "integrations/secullum/time-entries/details/[id]",

  // My Team Module
  "my-team",
  "my-team/index",
  "my-team/borrows",
  "my-team/vacations",
  "my-team/warnings",
]);

/**
 * Validates if a route exists in the registered routes
 * @param route - The route path to validate (e.g., "human-resources/performance-levels/edit/123")
 * @returns true if the route exists, false otherwise
 */
export function isRouteRegistered(route: string): boolean {
  // Remove leading slash and (tabs) prefix if present
  const cleanRoute = route.replace(/^\/?\(tabs\)\//, "");

  // Check exact match first
  if (REGISTERED_ROUTES.has(cleanRoute)) {
    return true;
  }

  // Check if it matches a dynamic route pattern
  // Replace any UUID or numeric segments with [id] or other dynamic patterns
  const dynamicRoute = cleanRoute.replace(/\/[0-9a-f-]+(?=\/|$)/gi, "/[id]");

  if (REGISTERED_ROUTES.has(dynamicRoute)) {
    return true;
  }

  // Also check for [userId], [formulaId], etc.
  const specialDynamicRoute = cleanRoute
    .replace(/\/[0-9a-f-]+(?=\/remunerations|$)/gi, "/[positionId]")
    .replace(/\/[0-9a-f-]+(?=\/components|$)/gi, "/[formulaId]")
    .replace(/\/[0-9a-f-]+(?=\/items|$)/gi, "/[orderId]");

  if (REGISTERED_ROUTES.has(specialDynamicRoute)) {
    return true;
  }

  return false;
}

/**
 * Gets the fallback route when a route doesn't exist
 * @returns The home route path
 */
export function getFallbackRoute(): string {
  return "/(tabs)/home";
}

/**
 * Validates a route and returns either the route or a fallback
 * @param route - The route to validate
 * @returns The validated route or fallback route
 */
export function validateRoute(route: string): string {
  if (isRouteRegistered(route)) {
    return route;
  }

  console.warn(`[Route Validator] Route "${route}" is not registered. Falling back to home.`);
  return getFallbackRoute();
}

/**
 * Safe navigation helper that validates routes before navigation
 * @param router - The expo router instance
 * @param route - The route to navigate to
 * @param fallbackToHome - Whether to fallback to home if route doesn't exist (default: true)
 */
export function safeNavigate(
  router: { push: (route: string) => void },
  route: string,
  fallbackToHome: boolean = true
): void {
  const cleanRoute = route.startsWith("/(tabs)/") ? route : `/(tabs)/${route}`;

  if (isRouteRegistered(cleanRoute)) {
    try {
      router.push(cleanRoute);
    } catch (error) {
      console.error(`[Route Validator] Failed to navigate to "${route}":`, error);
      if (fallbackToHome) {
        router.push(getFallbackRoute());
      }
    }
  } else {
    console.warn(`[Route Validator] Route "${route}" is not registered.`);
    if (fallbackToHome) {
      router.push(getFallbackRoute());
    }
  }
}
