// Route mapper utility to handle path normalization and naming issues

interface RouteMapping {
  menuPath: string;
  screenName: string;
  actualPath: string;
}

// Map of problematic routes that need special handling
const ROUTE_FIXES: RouteMapping[] = [
  // Fix meu-pessoal routes
  { menuPath: '/meu-pessoal', screenName: 'meu-pessoal/index', actualPath: '(tabs)/meu-pessoal/index' },
  { menuPath: '/meu-pessoal/avisos', screenName: 'meu-pessoal/advertencias', actualPath: '(tabs)/meu-pessoal/advertencias' },
  { menuPath: '/meu-pessoal/emprestimos', screenName: 'meu-pessoal/emprestimos', actualPath: '(tabs)/meu-pessoal/emprestimos' },
  { menuPath: '/meu-pessoal/ferias', screenName: 'meu-pessoal/ferias', actualPath: '(tabs)/meu-pessoal/ferias' },

  // Fix other module index routes
  { menuPath: '/producao', screenName: 'producao/index', actualPath: '(tabs)/producao/index' },
  { menuPath: '/estoque', screenName: 'estoque/index', actualPath: '(tabs)/estoque/index' },
  { menuPath: '/recursos-humanos', screenName: 'recursos-humanos/index', actualPath: '(tabs)/recursos-humanos/index' },
  { menuPath: '/administracao', screenName: 'administracao/index', actualPath: '(tabs)/administracao/index' },
  { menuPath: '/pintura', screenName: 'pintura/index', actualPath: '(tabs)/pintura/index' },
  { menuPath: '/servidor', screenName: 'servidor/index', actualPath: '(tabs)/servidor/index' },
];

/**
 * Normalizes a menu path to the correct screen name
 */
export function normalizeRouteForScreen(menuPath: string): string {
  // Remove leading slash
  let normalized = menuPath.replace(/^\//, '');

  // Check if this route needs special handling
  const fix = ROUTE_FIXES.find(r => r.menuPath === menuPath);
  if (fix) {
    return fix.screenName;
  }

  // For routes without /index, add it if it's a module root
  const moduleRoots = [
    'producao', 'estoque', 'recursos-humanos', 'administracao',
    'pintura', 'servidor', 'meu-pessoal'
  ];

  if (moduleRoots.includes(normalized) && !normalized.endsWith('/index')) {
    return `${normalized}/index`;
  }

  return normalized;
}

/**
 * Converts a screen name to the actual file path
 */
export function getActualRoutePath(screenName: string): string {
  const fix = ROUTE_FIXES.find(r => r.screenName === screenName);
  if (fix) {
    return fix.actualPath;
  }

  // Default: add (tabs) prefix
  return `(tabs)/${screenName}`;
}

/**
 * Gets the correct screen name from a pathname
 */
export function getScreenNameFromPath(pathname: string): string {
  // Remove (tabs) prefix if present
  let cleaned = pathname.replace(/^\/(tabs\/)?/, '');

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/$/, '');

  // If empty, it's the home route
  if (!cleaned || cleaned === 'inicio') {
    return 'inicio';
  }

  return cleaned;
}

/**
 * Checks if a route should be lazy loaded
 */
export function shouldLazyLoad(screenName: string): boolean {
  // Core routes that should always be loaded
  const alwaysLoaded = [
    'inicio',
    'configuracoes',
    'meu-perfil',
  ];

  return !alwaysLoaded.includes(screenName);
}

/**
 * Gets the module name for a given route
 */
export function getModuleForRoute(screenName: string): string | null {
  if (screenName.startsWith('producao')) return 'production';
  if (screenName.startsWith('estoque')) return 'inventory';
  if (screenName.startsWith('recursos-humanos')) return 'hr';
  if (screenName.startsWith('administracao')) return 'admin';
  if (screenName.startsWith('meu-pessoal')) return 'personal';
  if (screenName.startsWith('pessoal')) return 'personal';
  if (screenName.startsWith('pintura')) return 'painting';
  if (screenName.startsWith('servidor')) return 'server';

  return null;
}

/**
 * Batch registers routes for better performance
 */
export function batchRegisterRoutes(routes: string[]): Map<string, string> {
  const routeMap = new Map<string, string>();

  routes.forEach(route => {
    const normalized = normalizeRouteForScreen(route);
    const actualPath = getActualRoutePath(normalized);
    routeMap.set(normalized, actualPath);
  });

  return routeMap;
}

/**
 * Performance optimization: Precompile route regex patterns
 */
const DYNAMIC_ROUTE_PATTERN = /\[([^\]]+)\]/g;

export function isDynamicRoute(path: string): boolean {
  return DYNAMIC_ROUTE_PATTERN.test(path);
}

export function extractDynamicParams(path: string): string[] {
  const params: string[] = [];
  let match;

  while ((match = DYNAMIC_ROUTE_PATTERN.exec(path)) !== null) {
    params.push(match[1]);
  }

  return params;
}