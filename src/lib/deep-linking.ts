import { Linking } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =====================================================
// Route Mapping Configuration
// =====================================================

/**
 * Maps entity types to their corresponding mobile routes
 * This ensures consistent navigation across the app
 */
export const ROUTE_MAP = {
  // Production Routes
  Task: '/(tabs)/producao/tarefas/detalhes/[id]',
  ServiceOrder: '/(tabs)/producao/ordens-de-servico/detalhes/[id]',
  Service: '/(tabs)/producao/servicos/detalhes/[id]',
  Airbrushing: '/(tabs)/producao/aerografia/detalhes/[id]',
  Cut: '/(tabs)/producao/recorte/detalhes/[id]',
  Observation: '/(tabs)/producao/observacoes/detalhes/[id]',
  Paint: '/(tabs)/producao/tintas/detalhes/[id]',

  // Inventory Routes
  Order: '/(tabs)/estoque/pedidos/detalhes/[id]',
  Item: '/(tabs)/estoque/produtos/detalhes/[id]',
  Borrow: '/(tabs)/estoque/emprestimos/detalhes/[id]',
  ExternalWithdrawal: '/(tabs)/estoque/retiradas-externas/detalhes/[id]',
  Maintenance: '/(tabs)/estoque/manutencao/detalhes/[id]',
  Activity: '/(tabs)/estoque/movimentacoes/detalhes/[id]',
  Supplier: '/(tabs)/estoque/fornecedores/detalhes/[id]',
  Brand: '/(tabs)/estoque/produtos/marcas/detalhes/[id]',
  Category: '/(tabs)/estoque/produtos/categorias/detalhes/[id]',

  // HR Routes
  Employee: '/(tabs)/recursos-humanos/funcionarios/detalhes/[id]',
  Bonus: '/(tabs)/recursos-humanos/bonus/detalhes/[id]',
  Warning: '/(tabs)/recursos-humanos/advertencias/detalhes/[id]',
  Vacation: '/(tabs)/recursos-humanos/ferias/detalhes/[id]',
  Holiday: '/(tabs)/recursos-humanos/feriados/detalhes/[id]',
  TimeRecord: '/(tabs)/recursos-humanos/controle-ponto/detalhes/[id]',
  Position: '/(tabs)/recursos-humanos/cargos/detalhes/[id]',

  // Administration Routes
  User: '/(tabs)/administracao/usuarios/detalhes/[id]',
  Customer: '/(tabs)/administracao/clientes/detalhes/[id]',
  Sector: '/(tabs)/administracao/setores/detalhes/[id]',
  Notification: '/(tabs)/administracao/notificacoes/detalhes/[id]',
  ChangeLog: '/(tabs)/administracao/registros-de-alteracoes/detalhes/[id]',

  // Painting Routes
  PaintFormula: '/(tabs)/pintura/formulas/detalhes/[id]',
  PaintCatalog: '/(tabs)/pintura/catalogo/detalhes/[id]',
  PaintBrand: '/(tabs)/pintura/marcas-de-tinta/detalhes/[id]',
  PaintProduction: '/(tabs)/pintura/producoes/detalhes/[id]',

  // Personal Routes (Employee's own data)
  MyBonus: '/(tabs)/pessoal/meus-bonus/detalhes/[id]',
  MyBorrow: '/(tabs)/pessoal/meus-emprestimos/detalhes/[id]',
  MyWarning: '/(tabs)/pessoal/minhas-advertencias/detalhes/[id]',
  MyVacation: '/(tabs)/pessoal/minhas-ferias/detalhes/[id]',
  MyHoliday: '/(tabs)/pessoal/meus-feriados/detalhes/[id]',
  MyNotification: '/(tabs)/pessoal/minhas-notificacoes/detalhes/[id]',

  // Catalog
  CatalogItem: '/(tabs)/catalogo/detalhes/[id]',

  // Financial
  FinancialCustomer: '/(tabs)/financeiro/clientes/detalhes/[id]',
} as const;

/**
 * Maps simplified entity types to full entity types
 * Used for parsing shortened deep link URLs
 */
export const ENTITY_ALIAS_MAP: Record<string, keyof typeof ROUTE_MAP> = {
  task: 'Task',
  tasks: 'Task',
  'service-order': 'ServiceOrder',
  'service-orders': 'ServiceOrder',
  'ordem-servico': 'ServiceOrder',
  service: 'Service',
  services: 'Service',
  servico: 'Service',
  servicos: 'Service',
  airbrushing: 'Airbrushing',
  aerografia: 'Airbrushing',
  cut: 'Cut',
  cuts: 'Cut',
  recorte: 'Cut',
  observation: 'Observation',
  observations: 'Observation',
  observacao: 'Observation',
  observacoes: 'Observation',
  paint: 'Paint',
  paints: 'Paint',
  tinta: 'Paint',
  tintas: 'Paint',
  order: 'Order',
  orders: 'Order',
  pedido: 'Order',
  pedidos: 'Order',
  item: 'Item',
  items: 'Item',
  produto: 'Item',
  produtos: 'Item',
  borrow: 'Borrow',
  borrows: 'Borrow',
  emprestimo: 'Borrow',
  emprestimos: 'Borrow',
  withdrawal: 'ExternalWithdrawal',
  withdrawals: 'ExternalWithdrawal',
  'external-withdrawal': 'ExternalWithdrawal',
  retirada: 'ExternalWithdrawal',
  retiradas: 'ExternalWithdrawal',
  maintenance: 'Maintenance',
  manutencao: 'Maintenance',
  activity: 'Activity',
  activities: 'Activity',
  movimentacao: 'Activity',
  movimentacoes: 'Activity',
  supplier: 'Supplier',
  suppliers: 'Supplier',
  fornecedor: 'Supplier',
  fornecedores: 'Supplier',
  employee: 'Employee',
  employees: 'Employee',
  funcionario: 'Employee',
  funcionarios: 'Employee',
  bonus: 'Bonus',
  warning: 'Warning',
  warnings: 'Warning',
  advertencia: 'Warning',
  advertencias: 'Warning',
  vacation: 'Vacation',
  vacations: 'Vacation',
  ferias: 'Vacation',
  holiday: 'Holiday',
  holidays: 'Holiday',
  feriado: 'Holiday',
  feriados: 'Holiday',
  user: 'User',
  users: 'User',
  usuario: 'User',
  usuarios: 'User',
  customer: 'Customer',
  customers: 'Customer',
  cliente: 'Customer',
  clientes: 'Customer',
  sector: 'Sector',
  sectors: 'Sector',
  setor: 'Sector',
  setores: 'Sector',
  notification: 'Notification',
  notifications: 'Notification',
  notificacao: 'Notification',
  notificacoes: 'Notification',
};

// =====================================================
// Deep Link Parsing
// =====================================================

export interface ParsedDeepLink {
  route: string;
  params?: Record<string, any>;
  requiresAuth?: boolean;
}

/**
 * Custom URL parser for deep links
 * Handles both custom schemes (ankaadesign://) and HTTPS URLs
 */
function parseUrl(url: string): { hostname: string | null; path: string | null; queryParams: Record<string, any> } {
  try {
    // Remove leading/trailing whitespace
    url = url.trim();

    // Extract query parameters first
    const [urlWithoutQuery, queryString] = url.split('?');
    const queryParams: Record<string, any> = {};

    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      });
    }

    // Parse the main URL parts
    // Handle custom scheme (ankaadesign://...) and HTTPS
    const schemeMatch = urlWithoutQuery.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);

    if (schemeMatch) {
      const scheme = schemeMatch[1];
      const afterScheme = urlWithoutQuery.substring(schemeMatch[0].length);

      // Split into hostname and path
      const firstSlash = afterScheme.indexOf('/');

      let hostname: string | null = null;
      let path: string | null = null;

      if (firstSlash === -1) {
        // No path, just hostname (e.g., ankaadesign://notification)
        hostname = afterScheme || null;
      } else {
        // Has both hostname and path
        hostname = afterScheme.substring(0, firstSlash) || null;
        path = afterScheme.substring(firstSlash) || null;
      }

      return { hostname, path, queryParams };
    }

    // Fallback for malformed URLs
    return { hostname: null, path: urlWithoutQuery, queryParams };
  } catch (error) {
    console.error('[Deep Link] Error in parseUrl:', error);
    return { hostname: null, path: null, queryParams: {} };
  }
}

/**
 * Parses a deep link URL and extracts route and parameters
 *
 * Supported URL formats:
 * - Custom scheme: ankaadesign://producao/tasks/123
 * - Universal link: https://ankaadesign.com/app/producao/tasks/123
 * - Entity type: ankaadesign://task/123
 * - Notification: ankaadesign://notification?type=Task&id=123
 *
 * @param url - The deep link URL to parse
 * @returns Parsed route information with navigation params
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  try {
    console.log('[Deep Link] Parsing URL:', url);

    // Parse the URL
    const parsed = parseUrl(url);
    console.log('[Deep Link] Parsed URL:', JSON.stringify(parsed, null, 2));

    const { hostname, path, queryParams } = parsed;

    // Handle notification deep links
    if (hostname === 'notification' || path?.includes('notification')) {
      return parseNotificationLink(queryParams);
    }

    // Handle entity type shortcuts (e.g., ankaadesign://task/123)
    if (hostname && ENTITY_ALIAS_MAP[hostname.toLowerCase()]) {
      const entityType = ENTITY_ALIAS_MAP[hostname.toLowerCase()];
      const route = ROUTE_MAP[entityType];

      if (route && path) {
        const id = path.replace(/^\//, '').split('/')[0];
        if (id) {
          console.log('[Deep Link] Entity shortcut matched:', { entityType, id });
          return {
            route: route.replace('[id]', id),
            params: { id },
            requiresAuth: true,
          };
        }
      }
    }

    // Handle full path routes (e.g., ankaadesign://producao/tasks/123)
    if (path) {
      const pathSegments = path.replace(/^\//, '').split('/');

      // Try to match path patterns
      if (pathSegments.length >= 2) {
        const section = pathSegments[0]; // e.g., 'producao', 'estoque', 'inventory'
        const entityPath = pathSegments[1]; // e.g., 'tasks', 'orders'
        const id = pathSegments[2]; // entity ID

        // Try to find matching route
        const entityType = ENTITY_ALIAS_MAP[entityPath.toLowerCase()];
        if (entityType && id) {
          const route = ROUTE_MAP[entityType];
          console.log('[Deep Link] Path pattern matched:', { section, entityPath, entityType, id });

          return {
            route: route.replace('[id]', id),
            params: { id },
            requiresAuth: true,
          };
        }
      }
    }

    // Handle web universal links (https://ankaadesign.com/app/...)
    if (hostname === 'ankaadesign.com' || hostname === 'www.ankaadesign.com') {
      if (path?.startsWith('/app/')) {
        const appPath = path.replace('/app/', '');
        return parseDeepLink(`ankaadesign://${appPath}`);
      }
    }

    console.warn('[Deep Link] No route matched for URL:', url);

    // Default fallback to home
    return { route: '/(tabs)', requiresAuth: false };
  } catch (error) {
    console.error('[Deep Link] Error parsing URL:', error);
    return { route: '/(tabs)', requiresAuth: false };
  }
}

/**
 * Parses notification-specific deep links
 * Format: ankaadesign://notification?type=Task&id=123
 */
function parseNotificationLink(queryParams?: Record<string, any>): ParsedDeepLink {
  if (!queryParams || !queryParams.type || !queryParams.id) {
    console.warn('[Deep Link] Invalid notification link params:', queryParams);
    return { route: '/(tabs)/pessoal/minhas-notificacoes', requiresAuth: true };
  }

  const entityType = queryParams.type as keyof typeof ROUTE_MAP;
  const id = queryParams.id;

  const route = ROUTE_MAP[entityType];
  if (route) {
    console.log('[Deep Link] Notification link matched:', { entityType, id });
    return {
      route: route.replace('[id]', id),
      params: { id },
      requiresAuth: true,
    };
  }

  // Fallback to notifications list
  return { route: '/(tabs)/pessoal/minhas-notificacoes', requiresAuth: true };
}

// =====================================================
// Deep Link Navigation
// =====================================================

const PENDING_DEEP_LINK_KEY = '@ankaa/pending_deep_link';

/**
 * Handles navigation for a deep link URL
 * If user is not authenticated and route requires auth, stores the link for later
 *
 * @param url - The deep link URL to navigate to
 * @param isAuthenticated - Whether the user is currently authenticated
 */
export async function handleDeepLink(url: string, isAuthenticated: boolean = false) {
  try {
    console.log('[Deep Link] Handling URL:', url, 'Auth:', isAuthenticated);

    const { route, params, requiresAuth } = parseDeepLink(url);

    // If route requires auth but user is not authenticated
    if (requiresAuth && !isAuthenticated) {
      console.log('[Deep Link] Storing pending deep link for after login');
      await storePendingDeepLink(url);

      // Navigate to login
      router.replace('/(autenticacao)/login');
      return;
    }

    // Navigate to the parsed route
    console.log('[Deep Link] Navigating to:', route, 'Params:', params);

    if (params) {
      router.push({ pathname: route as any, params });
    } else {
      router.push(route as any);
    }
  } catch (error) {
    console.error('[Deep Link] Error handling deep link:', error);
    // Fallback to home on error
    router.push('/(tabs)');
  }
}

/**
 * Stores a pending deep link to be processed after user logs in
 */
export async function storePendingDeepLink(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, url);
    console.log('[Deep Link] Stored pending deep link:', url);
  } catch (error) {
    console.error('[Deep Link] Error storing pending deep link:', error);
  }
}

/**
 * Retrieves and processes any pending deep link after user logs in
 *
 * @param isAuthenticated - Whether the user is now authenticated
 */
export async function processPendingDeepLink(isAuthenticated: boolean): Promise<void> {
  try {
    const pendingUrl = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);

    if (pendingUrl && isAuthenticated) {
      console.log('[Deep Link] Processing pending deep link:', pendingUrl);

      // Clear the pending link
      await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);

      // Small delay to ensure auth state is fully updated
      setTimeout(() => {
        handleDeepLink(pendingUrl, true);
      }, 500);
    }
  } catch (error) {
    console.error('[Deep Link] Error processing pending deep link:', error);
  }
}

/**
 * Clears any stored pending deep link
 */
export async function clearPendingDeepLink(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
    console.log('[Deep Link] Cleared pending deep link');
  } catch (error) {
    console.error('[Deep Link] Error clearing pending deep link:', error);
  }
}

// =====================================================
// Deep Link Generation
// =====================================================

/**
 * Generates a deep link URL for a specific entity
 *
 * @param entityType - The type of entity (must be in ROUTE_MAP)
 * @param id - The entity ID
 * @returns A deep link URL string
 */
export function generateDeepLink(entityType: keyof typeof ROUTE_MAP, id: string | number): string {
  const entityKey = entityType.toLowerCase();

  // Find the alias for the entity type (use first match)
  const alias = Object.entries(ENTITY_ALIAS_MAP).find(
    ([_, value]) => value === entityType
  )?.[0] || entityKey;

  return `ankaadesign://${alias}/${id}`;
}

/**
 * Generates a universal link (HTTPS) for a specific entity
 *
 * @param entityType - The type of entity (must be in ROUTE_MAP)
 * @param id - The entity ID
 * @returns A universal link URL string
 */
export function generateUniversalLink(entityType: keyof typeof ROUTE_MAP, id: string | number): string {
  const entityKey = entityType.toLowerCase();

  // Find the alias for the entity type (use first match)
  const alias = Object.entries(ENTITY_ALIAS_MAP).find(
    ([_, value]) => value === entityType
  )?.[0] || entityKey;

  return `https://ankaadesign.com/app/${alias}/${id}`;
}

/**
 * Generates a notification deep link
 *
 * @param entityType - The type of entity being notified about
 * @param id - The entity ID
 * @returns A notification deep link URL string
 */
export function generateNotificationLink(entityType: keyof typeof ROUTE_MAP, id: string | number): string {
  return `ankaadesign://notification?type=${entityType}&id=${id}`;
}
