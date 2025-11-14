import React, { ReactNode } from "react";
import { useSegments } from "expo-router";
import { SECTOR_PRIVILEGES, MENU_ITEMS} from "@/constants";
import { PrivilegeGuard } from "./privilege-guard";

interface RoutePrivilegeGuardProps {
  children: ReactNode;
  fallbackScreen?: string;
}

/**
 * Get required privilege for current route by searching navigation menu
 * Uses navigation.ts as single source of truth for privilege requirements
 */
function getRequiredPrivilegeFromNavigation(segments: string[]): SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[] | null {
  if (!segments.length) return null;

  // Build current path from segments
  const currentPath = `/(tabs)/${segments.join('/')}`;

  // Try to find matching menu item by traversing the navigation tree
  const matchedItem = findMenuItemForPath(MENU_ITEMS, currentPath, segments);

  if (matchedItem?.requiredPrivilege) {
    return matchedItem.requiredPrivilege;
  }

  // If no specific privilege found, default to BASIC (authenticated access)
  return SECTOR_PRIVILEGES.BASIC;
}

/**
 * Find menu item that matches the current path
 * Supports both exact matches and parent module matches
 */
function findMenuItemForPath(menuItems: MenuItem[], currentPath: string, segments: string[]): MenuItem | null {
  // First try exact path matching
  for (const item of menuItems) {
    if (item.path) {
      // Convert navigation path to file path for comparison
      const navPath = convertNavigationPathToFilePath(item.path);
      if (pathMatches(navPath, segments)) {
        return item;
      }
    }

    // Recursively search children
    if (item.children) {
      const childMatch = findMenuItemForPath(item.children, currentPath, segments);
      if (childMatch) return childMatch;
    }
  }

  // If no exact match, find the parent module and use its privileges
  for (const item of menuItems) {
    if (item.path) {
      const navPath = convertNavigationPathToFilePath(item.path);
      const pathSegments = navPath.split('/').filter(Boolean);

      // Check if this is a parent module (first segment matches)
      if (pathSegments.length > 0 && segments.length > 0 && pathSegments[0] === segments[0]) {
        // Check if we're in a child route of this module
        const isChildRoute = segments.length > pathSegments.length;
        if (isChildRoute || pathSegments.every((seg, i) => segments[i] === seg)) {
          return item;
        }
      }
    }

    if (item.children) {
      const childMatch = findMenuItemForPath(item.children, currentPath, segments);
      if (childMatch) return childMatch;
    }
  }

  return null;
}

/**
 * Convert navigation Portuguese path to English file path
 * Examples:
 * - /administracao/setores -> administration/sectors
 * - /estoque/produtos -> inventory/products
 * - /producao/cronograma -> production/schedule
 */
function convertNavigationPathToFilePath(navPath: string): string {
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
    'em-espera': 'on-hold',
    'historico': 'history',
    'observacoes': 'observations',
    'recorte': 'cutting',
    'plano-de-corte': 'cutting-plan',
    'requisicao-de-recorte': 'cutting-request',
    'pintura': 'painting',
    'catalogo': 'catalog',
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
    'meus-emprestimos': 'my-borrows',
    'meus-epis': 'my-ppes',
    'meus-feriados': 'my-holidays',
    'minhas-ferias': 'my-vacations',
    'minhas-notificacoes': 'my-notifications',
    'cadastrar': 'create',
    'listar': 'list',
    'detalhes': 'details',
    'editar': 'edit',
  };

  return navPath
    .split('/')
    .filter(Boolean)
    .map(segment => {
      // Remove :id parameters
      if (segment.startsWith(':')) return '[id]';
      return pathMap[segment] || segment;
    })
    .join('/');
}

/**
 * Check if a navigation path matches the current route segments
 */
function pathMatches(navPath: string, segments: string[]): boolean {
  const navSegments = navPath.split('/').filter(Boolean);

  if (navSegments.length !== segments.length) return false;

  return navSegments.every((navSeg, i) => {
    // Match exact segments or dynamic parameters
    return navSeg === segments[i] || navSeg === '[id]' || navSeg.startsWith(':');
  });
}

/**
 * Get required privilege for current route
 * Now uses navigation.ts as the single source of truth
 */
function getRequiredPrivilegeForRoute(segments: string[]): SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[] | null {
  return getRequiredPrivilegeFromNavigation(segments);
}

/**
 * Route Privilege Guard Component for Mobile
 * Automatically determines required privileges based on current route
 * Similar to web AutoPrivilegeRoute but optimized for mobile navigation
 */
export function RoutePrivilegeGuard({ children, fallbackScreen = '/(autenticacao)/entrar' }: RoutePrivilegeGuardProps) {
  const segments = useSegments();

  // Get required privilege for current route
  const requiredPrivilege = getRequiredPrivilegeForRoute(segments);

  // Use the base PrivilegeGuard with route-determined privileges
  return (
    <PrivilegeGuard requiredPrivilege={requiredPrivilege || undefined} fallbackScreen={fallbackScreen} showUnauthorized={true}>
      {children}
    </PrivilegeGuard>
  );
}

/**
 * Higher-Order Component for protecting screens
 * Usage: export default withPrivilegeGuard(MyScreen, [SECTOR_PRIVILEGES.ADMIN]);
 */
export function withPrivilegeGuard<T extends object>(
  Component: React.ComponentType<T>,
  requiredPrivilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[],
  options?: {
    requireAll?: boolean;
    fallbackScreen?: string;
    showUnauthorized?: boolean;
  },
) {
  return function ProtectedComponent(props: T) {
    return (
      <PrivilegeGuard requiredPrivilege={requiredPrivilege} requireAll={options?.requireAll} fallbackScreen={options?.fallbackScreen} showUnauthorized={options?.showUnauthorized}>
        <Component {...props} />
      </PrivilegeGuard>
    );
  };
}

