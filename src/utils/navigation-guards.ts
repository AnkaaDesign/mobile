/**
 * Navigation Guards System
 *
 * Provides comprehensive route validation, safety checks, and error handling
 * for navigation operations in the mobile application.
 *
 * Features:
 * - Route existence validation
 * - Invalid navigation detection
 * - Safe navigation helpers
 * - Navigation logging and debugging
 * - Error recovery mechanisms
 */

import { router } from "expo-router";
import { MENU_ITEMS, type MenuItem } from "@/constants";
import { routes } from "@/constants/routes";

// ==================== TYPES ====================

export interface NavigationValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedRoute?: string;
}

export interface NavigationAttempt {
  route: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface RouteInfo {
  path: string;
  exists: boolean;
  isDynamic: boolean;
  requiresAuth: boolean;
  requiredPrivilege?: string | string[];
}

// ==================== CONFIGURATION ====================

const NAVIGATION_CONFIG = {
  // Enable debug logging
  enableLogging: __DEV__,

  // Maximum navigation history to keep
  maxHistorySize: 50,

  // Default fallback routes
  fallbackRoutes: {
    authenticated: "/(tabs)/home",
    unauthenticated: "/(auth)/login",
    error: "/(tabs)/home",
  },

  // Routes that should not be validated (system routes)
  skipValidation: [
    "/",
    "/(tabs)",
    "/(auth)",
    "/_sitemap",
    "/+not-found",
  ],
} as const;

// ==================== STATE ====================

// Track navigation attempts for debugging
const navigationHistory: NavigationAttempt[] = [];

// Cache of valid routes for performance
let validRoutesCache: Set<string> | null = null;
let dynamicRoutePatterns: RegExp[] | null = null;

// ==================== LOGGING ====================

/**
 * Log navigation events (only in development)
 */
function logNavigation(type: string, message: string, data?: any) {
  if (!NAVIGATION_CONFIG.enableLogging) return;

  const timestamp = new Date().toISOString();
  const prefix = `[NAV GUARD ${type}]`;

  console.log(`${prefix} ${timestamp}: ${message}`, data || "");
}

/**
 * Log navigation error
 */
function logNavigationError(message: string, error?: any) {
  console.error(`[NAV GUARD ERROR] ${message}`, error || "");
}

// ==================== ROUTE VALIDATION ====================

/**
 * Build cache of valid routes from menu items and routes constants
 */
function buildValidRoutesCache(): void {
  if (validRoutesCache && dynamicRoutePatterns) return;

  validRoutesCache = new Set<string>();
  dynamicRoutePatterns = [];

  // Add routes from menu items
  function extractRoutes(items: MenuItem[]) {
    for (const item of items) {
      if (item.path) {
        if (item.isDynamic) {
          // Convert dynamic route to regex pattern
          // /producao/cronograma/detalhes/:id -> /producao/cronograma/detalhes/[^/]+
          const pattern = item.path.replace(/:[^/]+/g, "[^/]+");
          dynamicRoutePatterns!.push(new RegExp(`^${pattern}$`));
        } else {
          validRoutesCache!.add(item.path);
        }
      }

      if (item.children) {
        extractRoutes(item.children);
      }
    }
  }

  extractRoutes(MENU_ITEMS);

  // Add system routes
  NAVIGATION_CONFIG.skipValidation.forEach(route => validRoutesCache!.add(route));

  // Add routes from routes constant (extract all route values)
  function extractConstantRoutes(obj: any, prefix = "") {
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "string") {
        // Convert Portuguese route to file path format
        const filePath = convertPortugueseToFilePath(value);
        validRoutesCache!.add(filePath);
        validRoutesCache!.add(value); // Also add original
      } else if (typeof value === "function") {
        // Dynamic route function - extract pattern
        try {
          const sampleId = "00000000-0000-0000-0000-000000000000";
          const samplePath = value(sampleId);
          const pattern = samplePath.replace(sampleId, "[^/]+");
          dynamicRoutePatterns!.push(new RegExp(`^${pattern}$`));
        } catch (e) {
          // Ignore extraction errors
        }
      } else if (typeof value === "object" && value !== null) {
        extractConstantRoutes(value, prefix ? `${prefix}.${key}` : key);
      }
    }
  }

  extractConstantRoutes(routes);

  logNavigation("INIT", "Route cache built", {
    staticRoutes: validRoutesCache.size,
    dynamicPatterns: dynamicRoutePatterns.length,
  });
}

/**
 * Convert Portuguese route to English file path
 */
function convertPortugueseToFilePath(route: string): string {
  const pathMap: Record<string, string> = {
    'administracao': 'administration',
    'autenticacao': 'auth',
    'clientes': 'customers',
    'colaboradores': 'employees',
    'setores': 'sectors',
    'notificacoes': 'notifications',
    'registros-de-alteracoes': 'change-logs',
    'estoque': 'inventory',
    'emprestimos': 'loans',
    'fornecedores': 'suppliers',
    'manutencao': 'maintenance',
    'movimentacoes': 'movements',
    'pedidos': 'orders',
    'produtos': 'products',
    'categorias': 'categories',
    'marcas': 'brands',
    'retiradas-externas': 'external-withdrawals',
    'agendamentos': 'schedules',
    'automaticos': 'automatic',
    'epi': 'ppe',
    'entregas': 'deliveries',
    'tamanhos': 'sizes',
    'producao': 'production',
    'aerografia': 'airbrushing',
    'cronograma': 'schedule',
    'em-espera': 'on-hold',
    'garagens': 'garages',
    'historico': 'history',
    'observacoes': 'observations',
    'recorte': 'cutting',
    'pintura': 'painting',
    'catalogo': 'catalog',
    'catalogo-basico': 'catalog',
    'marcas-de-tinta': 'paint-brands',
    'tipos-de-tinta': 'paint-types',
    'producoes': 'productions',
    'recursos-humanos': 'human-resources',
    'avisos': 'warnings',
    'cargos': 'positions',
    'controle-ponto': 'time-clock',
    'feriados': 'holidays',
    'ferias': 'vacations',
    'folha-de-pagamento': 'payroll',
    'niveis-desempenho': 'performance-levels',
    'requisicoes': 'requisitions',
    'simulacao-bonus': 'bonus-simulation',
    'calculos': 'calculations',
    'integracoes': 'integrations',
    'secullum': 'secullum',
    'registros-ponto': 'time-entries',
    'status-sincronizacao': 'sync-status',
    'meu-pessoal': 'my-team',
    'atividades': 'activities',
    'usuarios': 'users',
    'calculos-ponto': 'time-calculations',
    'pessoal': 'personal',
    'meus-avisos': 'my-warnings',
    'meus-emprestimos': 'my-loans',
    'meus-epis': 'my-ppes',
    'meus-feriados': 'my-holidays',
    'minhas-ferias': 'my-vacations',
    'minhas-notificacoes': 'my-notifications',
    'cadastrar': 'create',
    'listar': 'list',
    'detalhes': 'details',
    'editar': 'edit',
    'financeiro': 'financial',
    'servidor': 'server',
    'entrar': 'login',
    'registrar': 'register',
    'recuperar-senha': 'recover-password',
    'redefinir-senha': 'reset-password',
    'verificar-codigo': 'verify-code',
  };

  return route
    .split('/')
    .filter(Boolean)
    .map(segment => {
      // Handle dynamic parameters
      if (segment.startsWith(':')) return '[id]';
      return pathMap[segment] || segment;
    })
    .join('/');
}

/**
 * Check if a route exists in the application
 */
export function routeExists(route: string): boolean {
  // Build cache if needed
  if (!validRoutesCache || !dynamicRoutePatterns) {
    buildValidRoutesCache();
  }

  // Skip validation for system routes
  if (NAVIGATION_CONFIG.skipValidation.includes(route)) {
    return true;
  }

  // Normalize route
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;

  // Check static routes
  if (validRoutesCache!.has(normalizedRoute)) {
    return true;
  }

  // Check dynamic routes
  for (const pattern of dynamicRoutePatterns!) {
    if (pattern.test(normalizedRoute)) {
      return true;
    }
  }

  // Try converting Portuguese to English
  const convertedRoute = convertPortugueseToFilePath(normalizedRoute);
  if (validRoutesCache!.has(convertedRoute)) {
    return true;
  }

  // Check with (tabs) prefix
  const tabsRoute = `/(tabs)${normalizedRoute}`;
  if (validRoutesCache!.has(tabsRoute)) {
    return true;
  }

  return false;
}

/**
 * Validate a route before navigation
 */
export function validateRoute(route: string): NavigationValidationResult {
  // Empty route check
  if (!route || route.trim() === "") {
    return {
      isValid: false,
      reason: "Route cannot be empty",
      suggestedRoute: NAVIGATION_CONFIG.fallbackRoutes.authenticated,
    };
  }

  // Check if route exists
  if (!routeExists(route)) {
    logNavigationError("Invalid route attempted", { route });
    return {
      isValid: false,
      reason: "Route does not exist in the application",
      suggestedRoute: NAVIGATION_CONFIG.fallbackRoutes.authenticated,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Get information about a route
 */
export function getRouteInfo(route: string): RouteInfo {
  const exists = routeExists(route);
  const isDynamic = route.includes("/:") || route.includes("[id]");
  const requiresAuth = !route.startsWith("/(auth)");

  // Find menu item for privilege info
  let requiredPrivilege: string | string[] | undefined;

  function findMenuItem(items: MenuItem[], path: string): MenuItem | null {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children) {
        const found = findMenuItem(item.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  const menuItem = findMenuItem(MENU_ITEMS, route);
  if (menuItem?.requiredPrivilege) {
    requiredPrivilege = menuItem.requiredPrivilege as any;
  }

  return {
    path: route,
    exists,
    isDynamic,
    requiresAuth,
    requiredPrivilege,
  };
}

// ==================== SAFE NAVIGATION ====================

/**
 * Safely navigate to a route with validation
 */
export function safeNavigate(route: string, options?: { replace?: boolean }): boolean {
  logNavigation("ATTEMPT", "Safe navigation", { route, options });

  // Validate route
  const validation = validateRoute(route);

  // Track attempt
  const attempt: NavigationAttempt = {
    route,
    timestamp: new Date(),
    success: validation.isValid,
    error: validation.reason,
  };

  navigationHistory.push(attempt);

  // Keep history size manageable
  if (navigationHistory.length > NAVIGATION_CONFIG.maxHistorySize) {
    navigationHistory.shift();
  }

  // If invalid, try suggested route
  if (!validation.isValid) {
    logNavigationError(
      `Navigation blocked: ${validation.reason}`,
      { route, suggested: validation.suggestedRoute }
    );

    if (validation.suggestedRoute) {
      logNavigation("FALLBACK", "Using suggested route", validation.suggestedRoute);

      if (options?.replace) {
        router.replace(validation.suggestedRoute as any);
      } else {
        router.push(validation.suggestedRoute as any);
      }
    }

    return false;
  }

  // Navigate
  try {
    if (options?.replace) {
      router.replace(route as any);
    } else {
      router.push(route as any);
    }

    logNavigation("SUCCESS", "Navigation completed", { route });
    return true;
  } catch (error) {
    logNavigationError("Navigation failed", { route, error });

    // Update attempt with error
    attempt.success = false;
    attempt.error = error instanceof Error ? error.message : String(error);

    // Try fallback
    try {
      router.push(NAVIGATION_CONFIG.fallbackRoutes.error as any);
    } catch (fallbackError) {
      logNavigationError("Fallback navigation failed", fallbackError);
    }

    return false;
  }
}

/**
 * Safely navigate back with fallback
 */
export function safeGoBack(fallbackRoute?: string): void {
  logNavigation("BACK", "Safe back navigation");

  try {
    // Check if we can go back
    if (router.canGoBack()) {
      router.back();
      logNavigation("SUCCESS", "Back navigation completed");
    } else {
      // Use fallback
      const fallback = fallbackRoute || NAVIGATION_CONFIG.fallbackRoutes.authenticated;
      logNavigation("FALLBACK", "Cannot go back, using fallback", fallback);
      router.replace(fallback as any);
    }
  } catch (error) {
    logNavigationError("Back navigation failed", error);

    // Try fallback
    const fallback = fallbackRoute || NAVIGATION_CONFIG.fallbackRoutes.authenticated;
    try {
      router.replace(fallback as any);
    } catch (fallbackError) {
      logNavigationError("Fallback navigation failed", fallbackError);
    }
  }
}

/**
 * Safely replace current route
 */
export function safeReplace(route: string): boolean {
  return safeNavigate(route, { replace: true });
}

// ==================== NAVIGATION DEBUGGING ====================

/**
 * Get navigation history for debugging
 */
export function getNavigationHistory(): NavigationAttempt[] {
  return [...navigationHistory];
}

/**
 * Get failed navigation attempts
 */
export function getFailedNavigations(): NavigationAttempt[] {
  return navigationHistory.filter(attempt => !attempt.success);
}

/**
 * Clear navigation history
 */
export function clearNavigationHistory(): void {
  navigationHistory.length = 0;
  logNavigation("CLEAR", "Navigation history cleared");
}

/**
 * Get navigation statistics
 */
export function getNavigationStats() {
  const total = navigationHistory.length;
  const successful = navigationHistory.filter(a => a.success).length;
  const failed = total - successful;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    recentFailures: getFailedNavigations().slice(-5),
  };
}

/**
 * Export debug information
 */
export function debugNavigation() {
  const stats = getNavigationStats();

  console.log("=== NAVIGATION DEBUG INFO ===");
  console.log("Statistics:", stats);
  console.log("Recent History:", navigationHistory.slice(-10));
  console.log("Valid Routes Cache Size:", validRoutesCache?.size || 0);
  console.log("Dynamic Patterns Count:", dynamicRoutePatterns?.length || 0);
  console.log("============================");

  return {
    stats,
    history: navigationHistory,
    config: NAVIGATION_CONFIG,
  };
}

// ==================== ROUTE HELPERS ====================

/**
 * Check if a route is a detail/edit/create page
 */
export function isDetailRoute(route: string): boolean {
  return route.includes("/details/") ||
         route.includes("/detalhes/") ||
         route.includes("/edit/") ||
         route.includes("/editar/") ||
         route.includes("/create") ||
         route.includes("/cadastrar");
}

/**
 * Check if a route is a list page
 */
export function isListRoute(route: string): boolean {
  return route.endsWith("/list") ||
         route.endsWith("/listar") ||
         (!isDetailRoute(route) && !route.includes("/[id]"));
}

/**
 * Get parent route from a detail route
 */
export function getParentRoute(route: string): string | null {
  // Remove trailing segments like /details/id, /edit/id, /create
  const segments = route.split("/").filter(Boolean);

  // Remove last segment if it's an ID (UUID pattern)
  if (segments.length > 0 && /^[a-f0-9-]{36}$/i.test(segments[segments.length - 1])) {
    segments.pop();
  }

  // Remove action segment (details, edit, create, etc.)
  const actionSegments = ["details", "detalhes", "edit", "editar", "create", "cadastrar"];
  if (segments.length > 0 && actionSegments.includes(segments[segments.length - 1])) {
    segments.pop();
  }

  // Rebuild route
  if (segments.length === 0) {
    return null;
  }

  return "/" + segments.join("/");
}

/**
 * Build dynamic route with parameters
 */
export function buildRoute(template: string, params: Record<string, string>): string {
  let route = template;

  for (const [key, value] of Object.entries(params)) {
    route = route.replace(`:${key}`, value).replace(`[${key}]`, value);
  }

  return route;
}

// ==================== INITIALIZATION ====================

// Build cache on import
buildValidRoutesCache();
