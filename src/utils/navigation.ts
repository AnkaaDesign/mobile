// packages/utils/src/navigation.ts
// Navigation utility functions moved from constants package

import { SECTOR_PRIVILEGES, TABLER_ICONS, type MenuItem } from '../constants';

// Define minimal user interface for navigation
interface NavigationUser {
  sector?: {
    privileges?: SECTOR_PRIVILEGES;
  };
  position?: {
    sector?: {
      privileges?: SECTOR_PRIVILEGES;
    };
  };
}

/**
 * Get filtered menu for a specific user and platform
 */
export function getFilteredMenuForUser(menuItems: MenuItem[], user: NavigationUser, platform: "web" | "mobile"): MenuItem[] {
  let filteredMenu = filterMenuByPlatform(menuItems, platform);

  // Apply privilege filtering if user has sector/privileges
  const userPrivilege = user?.sector?.privileges || user?.position?.sector?.privileges;
  if (userPrivilege) {
    filteredMenu = filterMenuByPrivileges(filteredMenu, userPrivilege as SECTOR_PRIVILEGES);
  }

  return filteredMenu;
}

/**
 * Get Tabler icon name for a given icon key
 */
export function getTablerIcon(iconKey: string): string {
  const icon = TABLER_ICONS[iconKey as keyof typeof TABLER_ICONS];
  if (!icon) return iconKey; // Return original if not found
  return icon;
}

/**
 * Backward compatibility function - maps to getTablerIcon
 * @deprecated Use getTablerIcon instead
 */
export function getIconoirIcon(iconKey: string): string {
  return getTablerIcon(iconKey);
}

/**
 * Check if user has access to menu item based on privilege requirements
 * Uses exact matching for menu display (following web behavior)
 * Note: This differs from route guards which use hierarchical checking
 */
function hasMenuItemAccess(item: MenuItem, userPrivilege?: SECTOR_PRIVILEGES): boolean {
  // If no privilege required, show to all
  if (!item.requiredPrivilege) return true;

  // If user has no privilege, hide privileged items
  if (!userPrivilege) return false;

  // Handle array of privileges (OR logic)
  if (Array.isArray(item.requiredPrivilege)) {
    // User needs to have EXACTLY one of the specified privileges for menu display
    // This matches web sidebar behavior where menu items show for specific roles
    return item.requiredPrivilege.includes(userPrivilege);
  }

  // Handle single privilege - exact match for menu display
  // Menu items are shown only to users with the exact privilege specified
  return userPrivilege === item.requiredPrivilege;
}

/**
 * Filter menu items based on user privileges
 * Now supports both single privileges and arrays of privileges
 */
export function filterMenuByPrivileges(menuItems: MenuItem[], userPrivilege?: SECTOR_PRIVILEGES): MenuItem[] {
  return menuItems
    .filter((item) => hasMenuItemAccess(item, userPrivilege))
    .map((item) => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: filterMenuByPrivileges(item.children, userPrivilege),
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove items with no children after filtering
      if (item.children && item.children.length === 0) return false;
      return true;
    });
}

/**
 * Filter menu items by platform
 * Respects the excludeFromMobile flag to hide specific items on mobile
 */
export function filterMenuByPlatform(menuItems: MenuItem[], platform: "web" | "mobile"): MenuItem[] {
  return menuItems
    .filter((item) => {
      // Exclude items marked as excludeFromMobile when on mobile platform
      if (platform === "mobile" && item.excludeFromMobile) {
        return false;
      }
      return true;
    })
    .map((item) => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: filterMenuByPlatform(item.children, platform),
        };
      }
      return item;
    });
}

/**
 * Get control panel items (dashboards for each domain)
 */
export function getControlPanelItems(menuItems: MenuItem[]): MenuItem[] {
  const controlPanels: MenuItem[] = [];

  function extractControlPanels(items: MenuItem[]) {
    items.forEach((item) => {
      if (item.isControlPanel) {
        controlPanels.push(item);
      }
      if (item.children) {
        extractControlPanels(item.children);
      }
    });
  }

  extractControlPanels(menuItems);
  return controlPanels;
}

/**
 * Get flattened list of all routes
 */
export function getAllRoutes(menuItems: MenuItem[]): string[] {
  const routes: string[] = [];

  function extractRoutes(items: MenuItem[]) {
    items.forEach((item) => {
      if (item.path && !item.isDynamic) {
        routes.push(item.path);
      }
      if (item.children) {
        extractRoutes(item.children);
      }
    });
  }

  extractRoutes(menuItems);
  return routes;
}

/**
 * Find menu item by path
 */
export function findMenuItemByPath(menuItems: MenuItem[], path: string): MenuItem | null {
  for (const item of menuItems) {
    if (item.path === path) return item;

    if (item.children) {
      const found = findMenuItemByPath(item.children, path);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get breadcrumb items for a given path
 */
export function getBreadcrumbs(menuItems: MenuItem[], path: string): MenuItem[] {
  const breadcrumbs: MenuItem[] = [];

  function matchPath(menuPath: string, actualPath: string): boolean {
    // Exact match
    if (menuPath === actualPath) return true;

    // Dynamic route match
    if (menuPath.includes(":")) {
      // Convert route pattern to regex
      // /estoque/produtos/detalhes/:id -> /estoque/produtos/detalhes/[^/]+
      const pattern = menuPath.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(actualPath);
    }

    return false;
  }

  function findPath(items: MenuItem[], currentPath: MenuItem[] = []): boolean {
    for (const item of items) {
      const newPath = [...currentPath, item];

      if (item.path && matchPath(item.path, path)) {
        breadcrumbs.push(...newPath);
        return true;
      }

      if (item.children) {
        if (findPath(item.children, newPath)) {
          return true;
        }
      }
    }
    return false;
  }

  findPath(menuItems);
  return breadcrumbs;
}

/**
 * Get menu items for a specific domain
 */
export function getMenuItemsByDomain(menuItems: MenuItem[], domain: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === domain);
}

/**
 * Get title for current route from navigation menu
 * Converts English file path to Portuguese navigation title
 */
export function getTitleForRoute(menuItems: MenuItem[], routePath: string): string | null {
  // Clean up route path - remove (tabs) prefix and leading/trailing slashes
  const cleanPath = routePath
    .replace(/^\(tabs\)\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean);

  // Try to find matching menu item
  const matchedItem = findMenuItemByRoute(menuItems, cleanPath);

  return matchedItem?.title || null;
}

/**
 * Find menu item by matching route segments
 * Handles Portuguese to English path conversion
 */
function findMenuItemByRoute(menuItems: MenuItem[], routeSegments: string[]): MenuItem | null {
  for (const item of menuItems) {
    if (item.path) {
      // Convert Portuguese navigation path to English segments for comparison
      const navSegments = convertPortuguesePathToEnglish(item.path);

      if (segmentsMatch(navSegments, routeSegments)) {
        return item;
      }
    }

    // Recursively search children
    if (item.children) {
      const childMatch = findMenuItemByRoute(item.children, routeSegments);
      if (childMatch) return childMatch;
    }
  }

  return null;
}

/**
 * Convert Portuguese navigation path to English segments
 */
function convertPortuguesePathToEnglish(portuguesePath: string): string[] {
  const pathMap: Record<string, string> = {
    'administracao': 'administration',
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
  };

  return portuguesePath
    .split('/')
    .filter(Boolean)
    .map(segment => {
      // Handle dynamic parameters
      if (segment.startsWith(':')) return '[id]';
      return pathMap[segment] || segment;
    });
}

/**
 * Check if navigation segments match route segments
 */
function segmentsMatch(navSegments: string[], routeSegments: string[]): boolean {
  if (navSegments.length !== routeSegments.length) return false;

  return navSegments.every((navSeg, i) => {
    const routeSeg = routeSegments[i];

    // Exact match
    if (navSeg === routeSeg) return true;

    // Dynamic parameter match (e.g., [id] matches any UUID or string)
    if (navSeg === '[id]' && routeSeg) return true;
    if (navSeg.startsWith(':') && routeSeg) return true;

    // Check if route segment looks like a UUID or ID
    if (navSeg === '[id]' && /^[a-f0-9-]{36}$/.test(routeSeg)) return true;
    if (navSeg === '[id]' && /^\[id\]$/.test(routeSeg)) return true;

    return false;
  });
}

/**
 * Check if user has access to a specific menu item
 * Uses exact matching for menu display (following web behavior)
 * Note: For route access control, use privilege utils with hierarchical checking
 */
export function hasAccessToMenuItem(item: MenuItem, userPrivilege?: SECTOR_PRIVILEGES): boolean {
  if (!item.requiredPrivilege) return true;
  if (!userPrivilege) return false;

  // Handle array of privileges (OR logic)
  if (Array.isArray(item.requiredPrivilege)) {
    // User needs to have EXACTLY one of the specified privileges for menu display
    // This matches web sidebar behavior where specific menu items show for certain roles
    return item.requiredPrivilege.includes(userPrivilege);
  }

  // Handle single privilege - exact match for menu display
  return userPrivilege === item.requiredPrivilege;
}
