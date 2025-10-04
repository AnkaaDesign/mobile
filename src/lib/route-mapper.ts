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
  [routes.production.schedule.root]: "/production/schedule",
  [routes.production.schedule.create]: "/production/schedule/create",
  [routes.production.scheduleOnHold.root]: "/production/schedule/on-hold",
  [routes.production.history.root]: "/production/history",
  [routes.production.history.completed]: "/production/history/completed",
  [routes.production.history.cancelled]: "/production/history/cancelled",
  [routes.production.cutting.root]: "/production/cutting",
  [routes.production.cutting.create]: "/production/cutting/create",
  [routes.production.garages.root]: "/production/garages/list",
  [routes.production.garages.create]: "/production/garages/create",
  [routes.production.serviceOrders.root]: "/production/service-orders/list",
  [routes.production.serviceOrders.create]: "/production/service-orders/create",
  [routes.production.observations.root]: "/production/observations/list",
  [routes.production.observations.create]: "/production/observations/create",

  // ========== INVENTORY ROUTES ==========
  [routes.inventory.root]: "/inventory",
  [routes.inventory.movements.root]: "/inventory/movements/list",
  [routes.inventory.movements.create]: "/inventory/movements/create",
  [routes.inventory.products.root]: "/inventory/products",
  // Note: routes.inventory.products.list has same value as root, so it's handled by the root mapping
  [routes.inventory.products.create]: "/inventory/products/create",
  [routes.inventory.products.categories.root]: "/inventory/products/categories/list",
  [routes.inventory.products.categories.create]: "/inventory/products/categories/create",
  [routes.inventory.products.brands.root]: "/inventory/products/brands/list",
  [routes.inventory.products.brands.create]: "/inventory/products/brands/create",
  [routes.inventory.suppliers.root]: "/inventory/suppliers/list",
  [routes.inventory.suppliers.create]: "/inventory/suppliers/create",
  [routes.inventory.orders.root]: "/inventory/orders/list",
  [routes.inventory.orders.create]: "/inventory/orders/create",
  [routes.inventory.orders.schedules.root]: "/inventory/orders/schedules/list",
  [routes.inventory.orders.schedules.create]: "/inventory/orders/schedules/create",
  [routes.inventory.orders.automatic.root]: "/inventory/orders/automatic",
  [routes.inventory.orders.automatic.configure]: "/inventory/orders/automatic/configure",
  // Note: routes.inventory.orders.automatic.create and .list are functions, not strings
  // [routes.inventory.orders.automatic.create]: "/inventory/orders/automatic/create",
  // [routes.inventory.orders.automatic.list]: "/inventory/orders/automatic/list",
  [routes.inventory.maintenance.root]: "/inventory/maintenance/list",
  [routes.inventory.maintenance.create]: "/inventory/maintenance/create",
  [routes.inventory.externalWithdrawals.root]: "/inventory/external-withdrawals/list",
  [routes.inventory.externalWithdrawals.create]: "/inventory/external-withdrawals/create",
  [routes.inventory.ppe.root]: "/inventory/ppe/list",
  [routes.inventory.ppe.create]: "/inventory/ppe/create",
  [routes.inventory.ppe.deliveries.root]: "/inventory/ppe/deliveries/list",
  [routes.inventory.ppe.deliveries.create]: "/inventory/ppe/deliveries/create",
  [routes.inventory.ppe.schedules.root]: "/inventory/ppe/schedules/list",
  [routes.inventory.ppe.schedules.create]: "/inventory/ppe/schedules/create",
  [routes.inventory.loans.root]: "/inventory/loans/list",
  [routes.inventory.loans.create]: "/inventory/loans/create",

  // ========== PAINTING ROUTES ==========
  [routes.painting.root]: "/painting",
  [routes.painting.catalog.root]: "/painting/catalog",
  [routes.painting.catalog.create]: "/painting/catalog/create",
  [routes.painting.productions.root]: "/painting/productions",
  [routes.painting.paintTypes.root]: "/painting/paint-types/list",
  [routes.painting.paintTypes.create]: "/painting/paint-types/create",

  // ========== ADMINISTRATION ROUTES ==========
  [routes.administration.root]: "/administration",
  [routes.administration.customers.root]: "/administration/customers/list",
  [routes.administration.customers.create]: "/administration/customers/create",
  [routes.administration.collaborators.root]: "/administration/employees/list",
  [routes.administration.collaborators.create]: "/administration/employees/create",
  [routes.administration.changeLogs.root]: "/administration/change-logs/list",
  [routes.administration.files.root]: "/administration/files",
  [routes.administration.files.upload]: "/administration/files/upload",
  [routes.administration.files.orphans]: "/administration/files/orphans",
  [routes.administration.sectors.root]: "/administration/sectors",
  [routes.administration.sectors.create]: "/administration/sectors/create",
  [routes.administration.notifications.root]: "/administration/notifications",
  [routes.administration.notifications.create]: "/administration/notifications/create",

  // ========== HUMAN RESOURCES ROUTES ==========
  [routes.humanResources.root]: "/human-resources",
  [routes.humanResources.positions.root]: "/human-resources/positions",
  [routes.humanResources.positions.create]: "/human-resources/positions/create",
  [routes.humanResources.vacations.root]: "/human-resources/vacations/list",
  [routes.humanResources.vacations.create]: "/human-resources/vacations/create",
  [routes.humanResources.vacations.calendar]: "/human-resources/vacations/calendar",
  [routes.humanResources.holidays.root]: "/human-resources/holidays",
  [routes.humanResources.holidays.calendar]: "/human-resources/holidays/calendar",
  [routes.humanResources.warnings.root]: "/human-resources/warnings/list",
  [routes.humanResources.warnings.create]: "/human-resources/warnings/create",
  [routes.humanResources.ppe.root]: "/human-resources/ppe/list",
  [routes.humanResources.ppe.create]: "/human-resources/ppe/create",
  [routes.humanResources.ppe.deliveries.root]: "/human-resources/ppe/deliveries/list",
  [routes.humanResources.ppe.deliveries.create]: "/human-resources/ppe/deliveries/create",
  [routes.humanResources.ppe.schedules.root]: "/human-resources/ppe/schedules/list",
  [routes.humanResources.ppe.schedules.create]: "/human-resources/ppe/schedules/create",
  [routes.humanResources.ppe.sizes.root]: "/human-resources/ppe/sizes/list",
  [routes.humanResources.ppe.sizes.create]: "/human-resources/ppe/sizes/create",

  // ========== PERSONAL ROUTES ==========
  [routes.personal.root]: "/personal",
  [routes.personal.myProfile.root]: "/personal/my-profile",
  [routes.personal.myVacations.root]: "/personal/my-vacations",
  [routes.personal.myHolidays.root]: "/personal/my-holidays",
  [routes.personal.myLoans.root]: "/personal/my-loans",
  [routes.personal.myPpes.root]: "/personal/my-ppes",
  [routes.personal.myPpes.request]: "/personal/my-ppes/request",
  [routes.personal.myWarnings.root]: "/personal/my-warnings",
  [routes.personal.myNotifications.root]: "/personal/my-notifications",
  [routes.personal.preferences.root]: "/personal/preferences",

  // ========== STATISTICS ROUTES ==========
  [routes.statistics.root]: "/statistics",
  [routes.statistics.production]: "/statistics/production",
  [routes.statistics.administration]: "/statistics/administration",
  [routes.statistics.humanResources]: "/statistics/human-resources",
  [routes.statistics.inventory]: "/statistics/inventory",

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
  "/estoque/emprestimos/detalhes": "/inventory/loans/details",
  "/estoque/produtos/categorias/detalhes": "/inventory/products/categories/details",
  "/estoque/produtos/categorias/editar": "/inventory/products/categories/edit",
  "/estoque/produtos/marcas/detalhes": "/inventory/products/brands/details",
  "/estoque/produtos/marcas/editar": "/inventory/products/brands/edit",

  // ========== INTEGRATIONS ROUTES ==========
  [routes.integrations.root]: "/integrations",
  [routes.integrations.secullum.root]: "/integrations/secullum",
  [routes.integrations.secullum.timeEntries.root]: "/integrations/secullum/time-entries/list",
  [routes.integrations.secullum.calculations]: "/integrations/secullum/calculations/list",
  [routes.integrations.secullum.syncStatus]: "/integrations/secullum/sync-status",
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
      estoque: "inventory",
      produtos: "products",
      detalhes: "details",
      editar: "edit",
      cadastrar: "create",
      listar: "list",
      categorias: "categories",
      marcas: "brands",
      fornecedores: "suppliers",
      pedidos: "orders",
      automaticos: "automatic",
      movimentacoes: "movements",
      manutencao: "maintenance",
      emprestimos: "loans",
      "retiradas-externas": "external-withdrawals",
      epi: "ppe",
      entregas: "deliveries",
      agendamentos: "schedules",
      producao: "production",
      cronograma: "schedule",
      "em-espera": "on-hold",
      historico: "history",
      finalizadas: "completed",
      canceladas: "cancelled",
      recorte: "cutting",
      "plano-de-recorte": "cutting-plan",
      "requisicao-de-recorte": "cutting-request",
      garagens: "garages",
      "ordens-de-servico": "service-orders",
      observacoes: "observations",
      pintura: "painting",
      catalogo: "catalog",
      producoes: "productions",
      "tipos-de-tinta": "paint-types",
      administracao: "administration",
      comissoes: "commissions",
      clientes: "customers",
      funcionarios: "employees",
      "logs-de-alteracao": "change-logs",
      arquivos: "files",
      setores: "sectors",
      notificacoes: "notifications",
      "recursos-humanos": "human-resources",
      cargos: "positions",
      ferias: "vacations",
      feriados: "holidays",
      advertencias: "warnings",
      tamanhos: "sizes",
      pessoal: "personal",
      "meu-perfil": "my-profile",
      "minhas-comissoes": "my-commissions",
      "minhas-ferias": "my-vacations",
      "meus-feriados": "my-holidays",
      "meus-emprestimos": "my-loans",
      "meus-epis": "my-ppes",
      "minhas-advertencias": "my-warnings",
      "minhas-notificacoes": "my-notifications",
      preferencias: "preferences",
      estatisticas: "statistics",
      integracoes: "integrations",
      secullum: "secullum",
      "registros-ponto": "time-entries",
      calculos: "calculations",
      "status-sincronizacao": "sync-status",
    };

    return translations[segment] || segment;
  });

  const translatedPath = "/" + translatedSegments.join("/");
  return `/(tabs)${translatedPath}`;
}
