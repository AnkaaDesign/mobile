// Route mapping from English file paths to English user-facing routes
import { routes } from '../constants';

export const routeEnglishMap: Record<string, string> = {
  // ========== CORE ROUTES ==========
  [routes.home]: "/home",

  // ========== AUTHENTICATION ROUTES ==========
  [routes.authentication.login]: "/login",
  [routes.authentication.register]: "/register",
  [routes.authentication.recoverPassword]: "/recover-password",
  [routes.authentication.verifyCode]: "/verify-code",
  [routes.authentication.verifyPasswordReset]: "/verify-password-code",
  // resetPassword is a function, handled separately

  // ========== PRODUCTION ROUTES ==========
  [routes.production.root]: "/production",
  [routes.production.airbrushings.root]: "/production/airbrushing",
  [routes.production.airbrushings.create]: "/production/airbrushing/create",
  [routes.production.airbrushings.list]: "/production/airbrushing/list",
  [routes.production.cutting.root]: "/production/cutting",
  [routes.production.cutting.create]: "/production/cutting/create",
  [routes.production.garages.root]: "/production/garages",
  [routes.production.garages.create]: "/production/garages/create",
  [routes.production.garages.list]: "/production/garages/list",
  [routes.production.history.root]: "/production/history",
  [routes.production.history.cancelled]: "/production/history/cancelled",
  [routes.production.history.completed]: "/production/history/completed",
  [routes.production.observations.root]: "/production/observations",
  [routes.production.observations.create]: "/production/observations/create",
  [routes.production.observations.list]: "/production/observations/list",
  [routes.production.schedule.root]: "/production/schedule",
  [routes.production.schedule.create]: "/production/schedule/create",
  [routes.production.schedule.list]: "/production/schedule/list",
  [routes.production.scheduleOnHold.root]: "/production/on-hold",
  [routes.production.serviceOrders.root]: "/production/service-orders",
  [routes.production.serviceOrders.create]: "/production/service-orders/create",
  [routes.production.serviceOrders.list]: "/production/service-orders/list",
  [routes.production.services.root]: "/production/services",
  [routes.production.services.create]: "/production/services/create",
  [routes.production.services.list]: "/production/services/list",
  [routes.production.settings]: "/production/settings",
  [routes.production.trucks.root]: "/production/trucks",
  [routes.production.trucks.create]: "/production/trucks/create",
  [routes.production.trucks.list]: "/production/trucks/list",

  // ========== MY TEAM ROUTES ==========
  [routes.myTeam.root]: "/my-team",
  [routes.myTeam.borrows]: "/my-team/borrows",
  [routes.myTeam.vacations]: "/my-team/vacations",
  [routes.myTeam.warnings]: "/my-team/warnings",

  // ========== MAINTENANCE ROUTES ==========
  [routes.maintenance.root]: "/maintenance",

  // ========== INVENTORY ROUTES ==========
  [routes.inventory.root]: "/inventory",
  [routes.inventory.externalWithdrawals.root]: "/inventory/external-withdrawals",
  [routes.inventory.externalWithdrawals.create]: "/inventory/external-withdrawals/create",
  [routes.inventory.externalWithdrawals.list]: "/inventory/external-withdrawals/list",
  [routes.inventory.borrows.root]: "/inventory/borrows",
  [routes.inventory.borrows.create]: "/inventory/borrows/create",
  [routes.inventory.borrows.list]: "/inventory/borrows/list",
  [routes.inventory.maintenance.root]: "/inventory/maintenance",
  [routes.inventory.maintenance.create]: "/inventory/maintenance/create",
  [routes.inventory.maintenance.list]: "/inventory/maintenance/list",
  [routes.inventory.movements.root]: "/inventory/movements",
  [routes.inventory.movements.create]: "/inventory/movements/create",
  [routes.inventory.movements.list]: "/inventory/movements/list",
  [routes.inventory.orders.root]: "/inventory/orders",
  [routes.inventory.orders.create]: "/inventory/orders/create",
  [routes.inventory.orders.list]: "/inventory/orders/list",
  [routes.inventory.orders.automatic.root]: "/inventory/orders/automatic",
  [routes.inventory.orders.automatic.configure]: "/inventory/orders/automatic/configure",
  [routes.inventory.orders.automatic.create]: "/inventory/orders/automatic/create",
  [routes.inventory.orders.automatic.list]: "/inventory/orders/automatic/list",
  [routes.inventory.orders.schedules.root]: "/inventory/orders/schedules",
  [routes.inventory.orders.schedules.create]: "/inventory/orders/schedules/create",
  [routes.inventory.orders.schedules.list]: "/inventory/orders/schedules/list",
  [routes.inventory.ppe.root]: "/inventory/ppe",
  [routes.inventory.ppe.create]: "/inventory/ppe/create",
  [routes.inventory.ppe.list]: "/inventory/ppe/list",
  [routes.inventory.ppe.deliveries.root]: "/inventory/ppe/deliveries",
  [routes.inventory.ppe.deliveries.create]: "/inventory/ppe/deliveries/create",
  [routes.inventory.ppe.deliveries.list]: "/inventory/ppe/deliveries/list",
  [routes.inventory.ppe.schedules.root]: "/inventory/ppe/schedules",
  [routes.inventory.ppe.schedules.create]: "/inventory/ppe/schedules/create",
  [routes.inventory.ppe.schedules.list]: "/inventory/ppe/schedules/list",
  [routes.inventory.products.root]: "/inventory/products",
  [routes.inventory.products.create]: "/inventory/products/create",
  [routes.inventory.products.list]: "/inventory/products/list",
  [routes.inventory.products.brands.root]: "/inventory/products/brands",
  [routes.inventory.products.brands.create]: "/inventory/products/brands/create",
  [routes.inventory.products.brands.list]: "/inventory/products/brands/list",
  [routes.inventory.products.categories.root]: "/inventory/products/categories",
  [routes.inventory.products.categories.create]: "/inventory/products/categories/create",
  [routes.inventory.products.categories.list]: "/inventory/products/categories/list",
  [routes.inventory.suppliers.root]: "/inventory/suppliers",
  [routes.inventory.suppliers.create]: "/inventory/suppliers/create",
  [routes.inventory.suppliers.list]: "/inventory/suppliers/list",

  // ========== PAINTING ROUTES ==========
  [routes.painting.root]: "/painting",
  [routes.painting.catalog.root]: "/painting/catalog",
  [routes.painting.catalog.create]: "/painting/catalog/create",
  [routes.painting.catalog.list]: "/painting/catalog/list",
  [routes.painting.paintBrands.root]: "/painting/paint-brands",
  [routes.painting.paintBrands.create]: "/painting/paint-brands/create",
  [routes.painting.paintBrands.list]: "/painting/paint-brands/list",
  [routes.painting.paintGrounds.root]: "/painting/paint-grounds",
  [routes.painting.paintGrounds.create]: "/painting/paint-grounds/create",
  [routes.painting.paintGrounds.list]: "/painting/paint-grounds/list",
  [routes.painting.paintTypes.root]: "/painting/paint-types",
  [routes.painting.paintTypes.create]: "/painting/paint-types/create",
  [routes.painting.paintTypes.list]: "/painting/paint-types/list",
  [routes.painting.productions.root]: "/painting/productions",

  // ========== DASHBOARD ROUTES ==========
  [routes.dashboard.index]: "/dashboard",
  [routes.dashboard.financial]: "/dashboard/financial",
  [routes.dashboard.humanResources]: "/dashboard/human-resources",
  [routes.dashboard.inventory]: "/dashboard/inventory",
  [routes.dashboard.production]: "/dashboard/production",
  [routes.dashboard.warehouse]: "/dashboard/warehouse",

  // ========== CATALOG ROUTES ==========
  [routes.catalog.root]: "/catalog",
  [routes.catalog.list]: "/catalog/list",

  // ========== ADMINISTRATION ROUTES ==========
  [routes.administration.root]: "/administration",
  [routes.administration.customers.root]: "/administration/customers",
  [routes.administration.customers.create]: "/administration/customers/create",
  [routes.administration.customers.list]: "/administration/customers/list",
  [routes.administration.collaborators.root]: "/administration/collaborators",
  [routes.administration.collaborators.create]: "/administration/collaborators/create",
  [routes.administration.collaborators.list]: "/administration/collaborators/list",
  [routes.administration.files.root]: "/administration/files",
  [routes.administration.files.list]: "/administration/files/list",
  [routes.administration.files.upload]: "/administration/files/upload",
  [routes.administration.files.orphans]: "/administration/files/orphans",
  [routes.administration.notifications.root]: "/administration/notifications",
  [routes.administration.notifications.create]: "/administration/notifications/create",
  [routes.administration.notifications.list]: "/administration/notifications/list",
  [routes.administration.sectors.root]: "/administration/sectors",
  [routes.administration.sectors.create]: "/administration/sectors/create",
  [routes.administration.sectors.list]: "/administration/sectors/list",

  // ========== SERVER ROUTES ==========
  [routes.server.root]: "/server",
  [routes.server.backups.root]: "/server/backups",
  [routes.server.backups.create]: "/server/backups/create",
  [routes.server.backups.list]: "/server/backups/list",
  [routes.server.changeLogs.root]: "/server/change-logs",
  [routes.server.changeLogs.list]: "/server/change-logs/list",
  [routes.server.databaseSync]: "/server/database-sync",
  [routes.server.deployments.root]: "/server/deployments",
  [routes.server.deployments.create]: "/server/deployments/create",
  [routes.server.deployments.list]: "/server/deployments/list",
  [routes.server.logs]: "/server/logs",
  [routes.server.maintenance]: "/server/maintenance",
  [routes.server.metrics]: "/server/metrics",
  [routes.server.rateLimiting]: "/server/rate-limiting",
  [routes.server.resources]: "/server/resources",
  [routes.server.services]: "/server/services",
  [routes.server.sharedFolders]: "/server/shared-folders",
  [routes.server.status]: "/server/status",
  [routes.server.systemUsers.root]: "/server/system-users",
  [routes.server.systemUsers.create]: "/server/system-users/create",
  [routes.server.systemUsers.list]: "/server/system-users/list",

  // ========== HUMAN RESOURCES ROUTES ==========
  [routes.humanResources.root]: "/human-resources",
  [routes.humanResources.bonusSimulation]: "/human-resources/bonus-simulation",
  [routes.humanResources.employees.root]: "/human-resources/employees",
  [routes.humanResources.employees.create]: "/human-resources/employees/create",
  [routes.humanResources.employees.list]: "/human-resources/employees/list",
  [routes.humanResources.holidays.root]: "/human-resources/holidays",
  [routes.humanResources.holidays.calendar]: "/human-resources/holidays/calendar",
  [routes.humanResources.holidays.create]: "/human-resources/holidays/create",
  [routes.humanResources.holidays.list]: "/human-resources/holidays/list",
  [routes.humanResources.payroll.root]: "/human-resources/payroll",
  [routes.humanResources.payroll.list]: "/human-resources/payroll/list",
  [routes.humanResources.performanceLevels.list]: "/human-resources/performance-levels/list",
  [routes.humanResources.positions.root]: "/human-resources/positions",
  [routes.humanResources.positions.create]: "/human-resources/positions/create",
  [routes.humanResources.positions.list]: "/human-resources/positions/list",
  [routes.humanResources.ppe.root]: "/human-resources/ppe",
  [routes.humanResources.ppe.create]: "/human-resources/ppe/create",
  [routes.humanResources.ppe.deliveries.root]: "/human-resources/ppe/deliveries",
  [routes.humanResources.ppe.deliveries.create]: "/human-resources/ppe/deliveries/create",
  [routes.humanResources.ppe.schedules.root]: "/human-resources/ppe/schedules",
  [routes.humanResources.ppe.schedules.create]: "/human-resources/ppe/schedules/create",
  [routes.humanResources.ppe.sizes.root]: "/human-resources/ppe/sizes",
  [routes.humanResources.ppe.sizes.create]: "/human-resources/ppe/sizes/create",
  [routes.humanResources.sectors.list]: "/human-resources/sectors/list",
  [routes.humanResources.vacations.root]: "/human-resources/vacations",
  [routes.humanResources.vacations.calendar]: "/human-resources/vacations/calendar",
  [routes.humanResources.vacations.create]: "/human-resources/vacations/create",
  [routes.humanResources.warnings.root]: "/human-resources/warnings",
  [routes.humanResources.warnings.create]: "/human-resources/warnings/create",

  // ========== PERSONAL ROUTES ==========
  [routes.personal.root]: "/personal",
  [routes.personal.myHolidays.root]: "/personal/my-holidays",
  [routes.personal.myBorrows.root]: "/personal/my-borrows",
  [routes.personal.myNotifications.root]: "/personal/my-notifications",
  [routes.personal.myNotifications.settings]: "/personal/my-notifications/settings",
  [routes.personal.myPpes.root]: "/personal/my-ppes",
  [routes.personal.myPpes.request]: "/personal/my-ppes/request",
  [routes.personal.myProfile.root]: "/personal/my-profile",
  [routes.personal.myVacations.root]: "/personal/my-vacations",
  [routes.personal.myWarnings.root]: "/personal/my-warnings",
  [routes.personal.preferences.root]: "/personal/preferences",
  [routes.personal.preferences.notifications]: "/personal/preferences/notifications",
  [routes.personal.preferences.privacy]: "/personal/preferences/privacy",
  [routes.personal.preferences.theme]: "/personal/preferences/theme",

  // ========== DETAIL PAGE ROUTES (DYNAMIC) ==========
  // These are handled dynamically by the functions but we include base patterns for reference
  // Inventory details routes
  "/estoque/produtos/detalhes": "/inventory/products/details",
  "/estoque/produtos/editar": "/inventory/products/edit",
  "/estoque/movimentacoes/detalhes": "/inventory/movements/details",
  "/estoque/movimentacoes/editar": "/inventory/movements/edit",
  "/estoque/fornecedores/detalhes": "/inventory/suppliers/details",
  "/estoque/fornecedores/editar": "/inventory/suppliers/edit",
  "/estoque/pedidos/detalhes": "/inventory/orders/details",
  "/estoque/pedidos/editar": "/inventory/orders/edit",
  "/estoque/pedidos/agendamentos/detalhes": "/inventory/orders/schedules/details",
  "/estoque/pedidos/agendamentos/editar": "/inventory/orders/schedules/edit",
  "/estoque/pedidos/automaticos/detalhes": "/inventory/orders/automatic/details",
  "/estoque/pedidos/automaticos/editar": "/inventory/orders/automatic/edit",
  "/estoque/manutencao/detalhes": "/inventory/maintenance/details",
  "/estoque/manutencao/editar": "/inventory/maintenance/edit",
  "/estoque/retiradas-externas/detalhes": "/inventory/external-withdrawals/details",
  "/estoque/retiradas-externas/editar": "/inventory/external-withdrawals/edit",
  "/estoque/epi/detalhes": "/inventory/ppe/details",
  "/estoque/epi/editar": "/inventory/ppe/edit",
  "/estoque/epi/entregas/detalhes": "/inventory/ppe/deliveries/details",
  "/estoque/epi/entregas/editar": "/inventory/ppe/deliveries/edit",
  "/estoque/epi/agendamentos/detalhes": "/inventory/ppe/schedules/details",
  "/estoque/epi/agendamentos/editar": "/inventory/ppe/schedules/edit",
  "/estoque/emprestimos/detalhes": "/inventory/borrows/details",
  "/estoque/produtos/categorias/detalhes": "/inventory/products/categories/details",
  "/estoque/produtos/categorias/editar": "/inventory/products/categories/edit",
  "/estoque/produtos/marcas/detalhes": "/inventory/products/brands/details",
  "/estoque/produtos/marcas/editar": "/inventory/products/brands/edit",

  // ========== INTEGRATIONS ROUTES ==========
  [routes.integrations.root]: "/integrations",
  [routes.integrations.secullum.root]: "/integrations/secullum",
  [routes.integrations.secullum.calculations.root]: "/integrations/secullum/calculations",
  [routes.integrations.secullum.calculations.list]: "/integrations/secullum/calculations/list",
  [routes.integrations.secullum.holidays.root]: "/integrations/secullum/holidays",
  [routes.integrations.secullum.holidays.list]: "/integrations/secullum/holidays/list",
  [routes.integrations.secullum.syncStatus]: "/integrations/secullum/sync-status",
  [routes.integrations.secullum.timeEntries.root]: "/integrations/secullum/time-entries",
  [routes.integrations.secullum.timeEntries.list]: "/integrations/secullum/time-entries/list",
};

// Dynamic route mappings for edit and detail pages
export const dynamicRoutePatterns: Array<{ pattern: RegExp; mapper: (match: RegExpMatchArray) => string }> = [
  // Edit routes
  { pattern: /^\/[^/]+\/[^/]+\/editar\/(.+)$/, mapper: (match) => match[0].replace(/\/editar\//g, "/edit/") },
  // Detail routes
  { pattern: /^\/[^/]+\/[^/]+\/detalhes\/(.+)$/, mapper: (match) => match[0].replace(/\/detalhes\//g, "/details/") },
  // Nested edit routes
  { pattern: /^\/[^/]+\/[^/]+\/[^/]+\/editar\/(.+)$/, mapper: (match) => match[0].replace(/\/editar\//g, "/edit/") },
  // Nested detail routes
  { pattern: /^\/[^/]+\/[^/]+\/[^/]+\/detalhes\/(.+)$/, mapper: (match) => match[0].replace(/\/detalhes\//g, "/details/") },
];

// Reverse mapping for navigation
export const routeReverseMap: Record<string, string> = Object.entries(routeEnglishMap).reduce((acc, [english, mapped]) => ({ ...acc, [mapped]: english }), {});

// Helper functions
export function getEnglishPath(inputPath: string): string {
  // Remove leading slash and (tabs) prefix if present
  const cleanPath = inputPath.replace(/^\/(\(tabs\)\/)?/, "/");

  // Handle home route special case
  if (cleanPath === routes.home) {
    return "/home";
  }

  // Check if it's a known static route first
  if (routeEnglishMap[cleanPath]) {
    return routeEnglishMap[cleanPath];
  }

  // Handle dynamic segments
  const pathWithoutId = cleanPath.replace(/\/[a-f0-9-]{36}$/, "");
  const id = cleanPath.match(/\/([a-f0-9-]{36})$/)?.[1];

  // Check if the path without ID is a known route
  if (routeEnglishMap[pathWithoutId]) {
    const mappedPath = routeEnglishMap[pathWithoutId];
    return id ? `${mappedPath}/${id}` : mappedPath;
  }

  // Try dynamic route patterns
  for (const { pattern, mapper } of dynamicRoutePatterns) {
    const match = cleanPath.match(pattern);
    if (match) {
      return mapper(match);
    }
  }

  // If no mapping found, return the original path
  return cleanPath;
}

export function getOriginalPath(englishPath: string): string {
  // Handle undefined or null paths
  if (!englishPath) {
    console.error("getOriginalPath called with undefined or null path");
    return "/";
  }

  // Remove leading slash if present
  const cleanPath = englishPath.startsWith("/") ? englishPath : `/${englishPath}`;

  // Handle dynamic segments
  const pathWithoutId = cleanPath.replace(/\/[a-f0-9-]{36}$/, "");
  const id = cleanPath.match(/\/([a-f0-9-]{36})$/)?.[1];

  // First try exact match
  let mappedPath = routeReverseMap[pathWithoutId];

  // If not found, try to find a partial match (for nested routes)
  if (!mappedPath) {
    // Check if we can find a base path match
    const segments = pathWithoutId.split("/").filter(Boolean);

    // Try to find the longest matching prefix
    for (let i = segments.length; i > 0; i--) {
      const partialPath = "/" + segments.slice(0, i).join("/");
      const baseMapped = routeReverseMap[partialPath];

      if (baseMapped) {
        // Found a base match, append the remaining segments
        const remainingSegments = segments.slice(i);
        mappedPath = remainingSegments.length > 0 ? `${baseMapped}/${remainingSegments.join("/")}` : baseMapped;
        break;
      }
    }
  }

  // If still not found, return the original path
  if (!mappedPath) {
    mappedPath = cleanPath;
  }

  return id ? `${mappedPath}/${id}` : mappedPath;
}

export function getEnglishTitle(inputPath: string): string {
  const englishPath = getEnglishPath(inputPath);
  const segments = englishPath.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Convert kebab-case to title case
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get screen title from MENU_ITEMS structure by matching path
 * This provides proper Portuguese titles instead of file paths
 * @param path - The route path (Portuguese or English)
 * @returns The proper Portuguese title from menu structure
 */
export function getTitleFromMenuItems(path: string): string | null {
  // Import MENU_ITEMS dynamically to avoid circular dependencies
  const { MENU_ITEMS } = require('../constants/navigation');

  // Normalize path - remove leading slash and trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  // Recursive function to search through menu items
  function searchMenuItems(items: any[], pathToMatch: string): string | null {
    for (const item of items) {
      // Normalize menu item path
      const itemPath = item.path?.replace(/^\/+|\/+$/g, '') || '';

      // Check for exact match (ignoring leading/trailing slashes)
      if (itemPath === pathToMatch) {
        return item.title;
      }

      // Check for dynamic route match (replace :id with actual ID pattern)
      if (item.isDynamic && itemPath.includes(':id')) {
        // Replace :id with UUID pattern
        const pattern = itemPath.replace(':id', '[a-f0-9-]{36}');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(pathToMatch)) {
          return item.title;
        }
      }

      // Search in children
      if (item.children && item.children.length > 0) {
        const foundInChildren = searchMenuItems(item.children, pathToMatch);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    return null;
  }

  const title = searchMenuItems(MENU_ITEMS, normalizedPath);
  return title;
}

/**
 * Get screen title with fallback to kebab-case conversion
 * Tries to find title from MENU_ITEMS first, falls back to simple conversion
 * @param path - The route path
 * @returns The screen title
 */
export function getScreenTitle(path: string): string {
  // Try to get title from menu structure first
  const menuTitle = getTitleFromMenuItems(path);
  if (menuTitle) {
    return menuTitle;
  }

  // Fallback to simple kebab-case conversion
  return getEnglishTitle(path);
}

/**
 * Navigation utility function to convert English routes to mobile navigation paths
 * @param englishPath - The English route path from routes.ts
 * @returns The mobile navigation path formatted for expo-router
 */
export function getNavigationPath(englishPath: string): string {
  const mappedPath = getEnglishPath(englishPath);

  // Handle special cases for routes without (tabs) prefix
  const authRoutes = [
    routes.authentication.login,
    routes.authentication.register,
    routes.authentication.recoverPassword,
    routes.authentication.verifyCode,
    routes.authentication.verifyPasswordReset,
  ];

  // Check if the mapped path starts with any authentication route
  const isAuthRoute = authRoutes.some((route) => mappedPath.startsWith(route));

  // Check for reset password route (which is a function)
  const resetPasswordBase = routes.authentication.resetPassword("").replace(/\/$/, "");
  const isResetPasswordRoute = mappedPath.startsWith(resetPasswordBase);

  if (isAuthRoute || isResetPasswordRoute) {
    return `/(auth)${getOriginalPath(mappedPath)}`;
  }

  // For all other routes, add the (tabs) prefix
  return `/(tabs)${getOriginalPath(mappedPath)}`;
}

/**
 * Convert route constants to mobile navigation paths
 * @param routeConstant - Route constant from @ankaa/constants routes
 * @returns The mobile navigation path formatted for expo-router
 */
export function routeToMobilePath(routeConstant: string): string {
  // Handle undefined or null route constants
  if (!routeConstant) {
    console.error("routeToMobilePath called with undefined or null route constant");
    return "/(tabs)/home";
  }

  // Handle home route special case
  if (routeConstant === routes.home) {
    return "/(tabs)/home";
  }

  // Handle authentication routes by checking if they start with authentication prefix
  const authPrefix = routes.authentication.login.split("/").slice(0, 2).join("/");
  if (routeConstant.startsWith(authPrefix)) {
    const authPath = routeEnglishMap[routeConstant];
    return authPath ? `/(auth)${authPath}` : `/(auth)${routeConstant}`;
  }

  // Handle reset password function - check if it's a reset password route
  const resetPasswordBase = routes.authentication.resetPassword("").replace(/\/$/, "");
  if (routeConstant.startsWith(resetPasswordBase)) {
    const token = routeConstant.split("/").pop();
    return `/(auth)/reset-password/${token}`;
  }

  // Extract UUID from the path if present
  const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  const uuidMatch = routeConstant.match(uuidPattern);
  const uuid = uuidMatch ? uuidMatch[0] : null;

  // Remove UUID from path to check base path
  const basePathWithoutUuid = uuid ? routeConstant.replace(`/${uuid}`, "") : routeConstant;

  // Check if base path exists in the map
  const mappedBasePath = routeEnglishMap[basePathWithoutUuid];

  if (mappedBasePath) {
    // If we have a mapped path, append the UUID if it exists
    const fullMappedPath = uuid ? `${mappedBasePath}/${uuid}` : mappedBasePath;
    return `/(tabs)${fullMappedPath}`;
  }

  // If no mapping found, try to convert Portuguese path segments to English
  // This handles dynamic routes like /estoque/produtos/detalhes/[id]
  const pathSegments = routeConstant.split("/").filter(Boolean);
  const translatedSegments = pathSegments.map((segment) => {
    // Skip UUIDs
    if (uuidPattern.test(segment)) return segment;

    // Common Portuguese to English translations for routes
    const translations: Record<string, string> = {
      administracao: "administration",
      aerografia: "airbrushing",
      agendamentos: "schedules",
      alertas: "alerts",
      almoxarifado: "warehouse",
      arquivos: "files",
      atividades: "activities",
      automaticos: "automatic",
      avisos: "warnings",
      backups: "backups",
      bonificacoes: "bonus",
      cadastrar: "create",
      calculos: "calculations",
      "calculos-ponto": "time-calculations",
      calendario: "calendar",
      caminhoes: "trucks",
      canceladas: "cancelled",
      cargos: "positions",
      catalogo: "catalog",
      categorias: "categories",
      clientes: "customers",
      colaboradores: "collaborators",
      comissoes: "commissions",
      componentes: "components",
      concluidos: "completed",
      configuracoes: "settings",
      configurar: "configure",
      consumo: "consumption",
      "controle-ponto": "time-clock",
      cronograma: "schedule",
      dashboard: "dashboard",
      detalhes: "details",
      editar: "edit",
      "em-espera": "on-hold",
      emprestimos: "borrows",
      entregas: "deliveries",
      "entregas-epi": "ppe-deliveries",
      enviar: "send",
      epi: "ppe",
      estatisticas: "statistics",
      estoque: "inventory",
      ferias: "vacations",
      feriados: "holidays",
      files: "files",
      financeiro: "financial",
      finalizadas: "completed",
      "folha-de-pagamento": "payroll",
      formulas: "formulas",
      fornecedores: "suppliers",
      fundos: "paint-grounds",
      funcionarios: "employees",
      garagens: "garages",
      geral: "general",
      historico: "history",
      holerite: "payroll",
      integracoes: "integrations",
      itens: "items",
      layouts: "layouts",
      listar: "list",
      logs: "logs",
      "logs-de-alteracao": "change-logs",
      manutencao: "maintenance",
      "marcas-de-tinta": "paint-brands",
      marcas: "brands",
      "meu-holerite": "my-payroll",
      "meu-perfil": "my-profile",
      "meu-pessoal": "my-team",
      "meus-avisos": "my-warnings",
      "meus-emprestimos": "my-borrows",
      "meus-epis": "my-ppes",
      "meus-feriados": "my-holidays",
      metricas: "metrics",
      "minhas-atividades": "my-activities",
      "minhas-comissoes": "my-commissions",
      "minhas-entregas-epi": "my-ppe-deliveries",
      "minhas-ferias": "my-vacations",
      "minhas-notificacoes": "my-notifications",
      monitoramento: "monitoring",
      movimentacao: "stock-movement",
      movimentacoes: "movements",
      "niveis-desempenho": "performance-levels",
      notificacoes: "notifications",
      observacoes: "observations",
      "ordens-de-servico": "service-orders",
      orfaos: "orphans",
      painel: "dashboard",
      pedidos: "orders",
      pessoal: "personal",
      pintura: "painting",
      "plano-de-recorte": "cutting-plan",
      preferencias: "preferences",
      privacidade: "privacy",
      producao: "production",
      producoes: "productions",
      produtos: "products",
      recorte: "cutting",
      recortes: "cuts",
      recursos: "resources",
      "recursos-humanos": "human-resources",
      "registros-de-alteracoes": "change-logs",
      "registros-ponto": "time-entries",
      remuneracoes: "remunerations",
      "requisicao-de-recorte": "cutting-request",
      requisicoes: "requisitions",
      "retiradas-externas": "external-withdrawals",
      secoes: "sections",
      secullum: "secullum",
      seguranca: "security",
      servidor: "server",
      servicos: "services",
      setores: "sectors",
      "simulacao-bonus": "bonus-simulation",
      solicitar: "request",
      "status-sincronizacao": "sync-status",
      tamanhos: "sizes",
      tema: "theme",
      tendencias: "trends",
      tintas: "paints",
      "tipos-de-tinta": "paint-types",
      "top-itens": "top-items",
      upload: "upload",
      usuarios: "users",
    };

    return translations[segment] || segment;
  });

  const translatedPath = "/" + translatedSegments.join("/");
  return `/(tabs)${translatedPath}`;
}
