// packages/utils/src/navigation.ts
// Navigation utility functions moved from constants package

import { SECTOR_PRIVILEGES, TABLER_ICONS, USER_STATUS, type MenuItem } from '../constants';

// Define minimal user interface for navigation
export interface NavigationUser {
  status?: string;
  sector?: {
    privileges?: SECTOR_PRIVILEGES;
  };
  position?: {
    bonifiable?: boolean;
    sector?: {
      privileges?: SECTOR_PRIVILEGES;
    };
  };
  managedSector?: {
    id?: string;
  } | null;
}

/**
 * Sort menu items by sortOrder (if defined) then alphabetically by title
 * Keeps "Inicio" (home) as the first item
 * Items with sortOrder are grouped together and sorted by their sortOrder value
 * Items without sortOrder are sorted alphabetically after items with sortOrder
 * Recursively sorts children as well
 */
function sortMenuItemsAlphabetically(menuItems: MenuItem[]): MenuItem[] {
  return [...menuItems]
    .sort((a, b) => {
      // "Inicio" (home) always comes first
      if (a.id === 'home') return -1;
      if (b.id === 'home') return 1;

      // If both have sortOrder, sort by sortOrder
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }

      // Items with sortOrder come before items without
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;

      // Sort alphabetically by title (case-insensitive)
      return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    })
    .map(item => {
      // Recursively sort children
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: sortMenuItemsAlphabetically(item.children),
        };
      }
      return item;
    });
}

/**
 * Get filtered menu for a specific user and platform
 */
export function getFilteredMenuForUser(menuItems: MenuItem[], user: NavigationUser | undefined, platform: "web" | "mobile"): MenuItem[] {
  let filteredMenu = filterMenuByPlatform(menuItems, platform);

  // Apply privilege and team leader filtering
  const userPrivilege = user?.sector?.privileges || user?.position?.sector?.privileges;
  const isTeamLeader = Boolean(user?.managedSector?.id);

  filteredMenu = filterMenuByPrivilegesAndTeamLeader(filteredMenu, userPrivilege, isTeamLeader);

  // Apply bonifiable filtering - hide menu items that require bonifiable position
  // User must be EFFECTED and have a bonifiable position to see bonus-related menus
  const isBonifiable = user?.status === USER_STATUS.EFFECTED && (user?.position?.bonifiable ?? false);
  filteredMenu = filterMenuByBonifiable(filteredMenu, isBonifiable);

  // Sort menu items alphabetically (keeping "Inicio" first)
  filteredMenu = sortMenuItemsAlphabetically(filteredMenu);

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
 * Check if user has access to menu item based on privilege requirements and team leader status
 * Uses exact matching for menu display (following web behavior)
 * TEAM_LEADER is a virtual privilege - checked via user.managedSector relationship
 * Note: This differs from route guards which use hierarchical checking
 */
function hasMenuItemAccess(item: MenuItem, userPrivilege?: SECTOR_PRIVILEGES, isTeamLeader: boolean = false): boolean {
  // If no privilege required, show to all
  if (!item.requiredPrivilege) return true;

  // Handle array of privileges (OR logic)
  if (Array.isArray(item.requiredPrivilege)) {
    // Check if TEAM_LEADER is in the required privileges and user is a team leader
    if (item.requiredPrivilege.includes(SECTOR_PRIVILEGES.TEAM_LEADER) && isTeamLeader) {
      return true;
    }

    // If user has no privilege, hide privileged items (unless they're a team leader and that's allowed)
    if (!userPrivilege) return false;

    // User needs to have EXACTLY one of the specified privileges for menu display
    // Filter out TEAM_LEADER since it's handled above via isTeamLeader check
    const regularPrivileges: SECTOR_PRIVILEGES[] = item.requiredPrivilege.filter(p => p !== SECTOR_PRIVILEGES.TEAM_LEADER);
    return regularPrivileges.includes(userPrivilege);
  }

  // Handle single privilege
  // Check if the required privilege is TEAM_LEADER
  if (item.requiredPrivilege === SECTOR_PRIVILEGES.TEAM_LEADER) {
    return isTeamLeader;
  }

  // If user has no privilege, hide privileged items
  if (!userPrivilege) return false;

  // Exact match for menu display
  // Menu items are shown only to users with the exact privilege specified
  return userPrivilege === item.requiredPrivilege;
}

/**
 * Filter menu items based on user privileges and team leader status
 * Now supports both single privileges and arrays of privileges
 */
export function filterMenuByPrivilegesAndTeamLeader(menuItems: MenuItem[], userPrivilege?: SECTOR_PRIVILEGES, isTeamLeader: boolean = false): MenuItem[] {
  return menuItems
    .filter((item) => hasMenuItemAccess(item, userPrivilege, isTeamLeader))
    .map((item) => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: filterMenuByPrivilegesAndTeamLeader(item.children, userPrivilege, isTeamLeader),
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
 * Filter menu items based on user privileges
 * Now supports both single privileges and arrays of privileges
 * @deprecated Use filterMenuByPrivilegesAndTeamLeader instead
 */
export function filterMenuByPrivileges(menuItems: MenuItem[], userPrivilege?: SECTOR_PRIVILEGES): MenuItem[] {
  return filterMenuByPrivilegesAndTeamLeader(menuItems, userPrivilege, false);
}

/**
 * Filter menu items based on bonifiable position requirement
 * Hides menu items that require a bonifiable position if the user's position is not bonifiable
 */
export function filterMenuByBonifiable(menuItems: MenuItem[], isBonifiable: boolean): MenuItem[] {
  return menuItems
    .filter((item) => {
      // If item requires bonifiable and user is not bonifiable, hide it
      if (item.requiresBonifiable && !isBonifiable) {
        return false;
      }
      return true;
    })
    .map((item) => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: filterMenuByBonifiable(item.children, isBonifiable),
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
      if (platform === "mobile" && ('excludeFromMobile' in item && item.excludeFromMobile)) {
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
    'emprestimos': 'borrows',
    'fornecedores': 'suppliers',
    'manutencao': 'maintenance',
    'movimentacoes': 'activities',
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
    'agenda': 'agenda',
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
    'pessoal': 'personal',
    'meus-avisos': 'my-warnings',
    'meus-emprestimos': 'my-borrows',
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
 * TEAM_LEADER is a virtual privilege - checked via user.managedSector relationship
 * Note: For route access control, use privilege utils with hierarchical checking
 */
export function hasAccessToMenuItem(item: MenuItem, userPrivilege?: SECTOR_PRIVILEGES, isTeamLeader: boolean = false): boolean {
  // If no privilege required, show to all
  if (!item.requiredPrivilege) return true;

  // Handle array of privileges (OR logic)
  if (Array.isArray(item.requiredPrivilege)) {
    // Check if TEAM_LEADER is in the required privileges and user is a team leader
    if (item.requiredPrivilege.includes(SECTOR_PRIVILEGES.TEAM_LEADER) && isTeamLeader) {
      return true;
    }

    // If user has no privilege, hide privileged items (unless they're a team leader and that's allowed)
    if (!userPrivilege) return false;

    // User needs to have EXACTLY one of the specified privileges for menu display
    // Filter out TEAM_LEADER since it's handled above via isTeamLeader check
    const regularPrivileges: SECTOR_PRIVILEGES[] = item.requiredPrivilege.filter(p => p !== SECTOR_PRIVILEGES.TEAM_LEADER);
    return regularPrivileges.includes(userPrivilege);
  }

  // Handle single privilege
  // Check if the required privilege is TEAM_LEADER
  if (item.requiredPrivilege === SECTOR_PRIVILEGES.TEAM_LEADER) {
    return isTeamLeader;
  }

  // If user has no privilege, hide privileged items
  if (!userPrivilege) return false;

  // Exact match for menu display
  return userPrivilege === item.requiredPrivilege;
}
