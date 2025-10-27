// Route mapping from Portuguese paths (matching web) to English folder structure (mobile physical structure)
import { routes } from '../constants';

// Complete Portuguese to English route mappings - matching web version exactly
export const portugueseToEnglishRoutes: Record<string, string> = {
  // ==================== HOME ====================
  "/": "/home",

  // ==================== ADMINISTRAÇÃO ====================
  "/administracao": "/administration",
  "/administracao/clientes": "/administration/customers",
  "/administracao/clientes/cadastrar": "/administration/customers/create",
  "/administracao/clientes/detalhes/:id": "/administration/customers/details/:id",
  "/administracao/clientes/editar/:id": "/administration/customers/edit/:id",
  "/administracao/colaboradores": "/administration/collaborators",
  "/administracao/colaboradores/cadastrar": "/administration/collaborators/create",
  "/administracao/colaboradores/detalhes/:id": "/administration/collaborators/details/:id",
  "/administracao/colaboradores/editar/:id": "/administration/collaborators/edit/:id",
  "/administracao/notificacoes": "/administration/notifications",
  "/administracao/notificacoes/cadastrar/enviar": "/administration/notifications/create/send",
  "/administracao/notificacoes/detalhes/:id": "/administration/notifications/details/:id",
  "/administracao/notificacoes/editar/:id": "/administration/notifications/edit/:id",
  "/administracao/setores": "/administration/sectors",
  "/administracao/setores/cadastrar": "/administration/sectors/create",
  "/administracao/setores/detalhes/:id": "/administration/sectors/details/:id",
  "/administracao/setores/editar/:id": "/administration/sectors/edit/:id",

  // ==================== ESTOQUE ====================
  "/estoque": "/inventory",
  "/estoque/emprestimos": "/inventory/borrows",
  "/estoque/emprestimos/cadastrar": "/inventory/borrows/create",
  "/estoque/emprestimos/detalhes/:id": "/inventory/borrows/details/:id",
  "/estoque/emprestimos/editar/:id": "/inventory/borrows/edit/:id",
  "/estoque/emprestimos/editar-lote": "/inventory/borrows/batch-edit",
  "/estoque/epi": "/inventory/ppe",
  "/estoque/epi/cadastrar": "/inventory/ppe/create",
  "/estoque/epi/detalhes/:id": "/inventory/ppe/details/:id",
  "/estoque/epi/editar/:id": "/inventory/ppe/edit/:id",
  "/estoque/epi/agendamentos": "/inventory/ppe/schedules",
  "/estoque/epi/agendamentos/cadastrar": "/inventory/ppe/schedules/create",
  "/estoque/epi/agendamentos/detalhes/:id": "/inventory/ppe/schedules/details/:id",
  "/estoque/epi/agendamentos/editar/:id": "/inventory/ppe/schedules/edit/:id",
  "/estoque/epi/entregas": "/inventory/ppe/deliveries",
  "/estoque/epi/entregas/cadastrar": "/inventory/ppe/deliveries/create",
  "/estoque/epi/entregas/detalhes/:id": "/inventory/ppe/deliveries/details/:id",
  "/estoque/epi/entregas/editar/:id": "/inventory/ppe/deliveries/edit/:id",
  "/estoque/fornecedores": "/inventory/suppliers",
  "/estoque/fornecedores/cadastrar": "/inventory/suppliers/create",
  "/estoque/fornecedores/detalhes/:id": "/inventory/suppliers/details/:id",
  "/estoque/fornecedores/editar/:id": "/inventory/suppliers/edit/:id",
  "/estoque/manutencao": "/inventory/maintenance",
  "/estoque/manutencao/cadastrar": "/inventory/maintenance/create",
  "/estoque/manutencao/detalhes/:id": "/inventory/maintenance/details/:id",
  "/estoque/manutencao/editar/:id": "/inventory/maintenance/edit/:id",
  "/estoque/manutencao/agendamentos": "/inventory/maintenance/schedules",
  "/estoque/manutencao/agendamentos/cadastrar": "/inventory/maintenance/schedules/create",
  "/estoque/manutencao/agendamentos/detalhes/:id": "/inventory/maintenance/schedules/details/:id",
  "/estoque/manutencao/agendamentos/editar/:id": "/inventory/maintenance/schedules/edit/:id",
  "/estoque/movimentacoes": "/inventory/activities",
  "/estoque/movimentacoes/cadastrar": "/inventory/activities/create",
  "/estoque/movimentacoes/detalhes/:id": "/inventory/activities/details/:id",
  "/estoque/movimentacoes/editar/:id": "/inventory/activities/edit/:id",
  "/estoque/movimentacoes/editar-lote": "/inventory/activities/batch-edit",
  "/estoque/pedidos": "/inventory/orders",
  "/estoque/pedidos/cadastrar": "/inventory/orders/create",
  "/estoque/pedidos/detalhes/:id": "/inventory/orders/details/:id",
  "/estoque/pedidos/editar/:id": "/inventory/orders/edit/:id",
  "/estoque/pedidos/agendamentos": "/inventory/orders/schedules",
  "/estoque/pedidos/agendamentos/cadastrar": "/inventory/orders/schedules/create",
  "/estoque/pedidos/agendamentos/detalhes/:id": "/inventory/orders/schedules/details/:id",
  "/estoque/pedidos/agendamentos/editar/:id": "/inventory/orders/schedules/edit/:id",
  "/estoque/pedidos/automaticos": "/inventory/orders/automatic",
  "/estoque/pedidos/automaticos/configurar": "/inventory/orders/automatic/configure",
  "/estoque/produtos": "/inventory/products",
  "/estoque/produtos/cadastrar": "/inventory/products/create",
  "/estoque/produtos/detalhes/:id": "/inventory/products/details/:id",
  "/estoque/produtos/editar/:id": "/inventory/products/edit/:id",
  "/estoque/produtos/editar-em-lote": "/inventory/products/batch-edit",
  "/estoque/produtos/categorias": "/inventory/products/categories",
  "/estoque/produtos/categorias/cadastrar": "/inventory/products/categories/create",
  "/estoque/produtos/categorias/detalhes/:id": "/inventory/products/categories/details/:id",
  "/estoque/produtos/categorias/editar/:id": "/inventory/products/categories/edit/:id",
  "/estoque/produtos/categorias/editar-em-lote": "/inventory/products/categories/batch-edit",
  "/estoque/produtos/marcas": "/inventory/products/brands",
  "/estoque/produtos/marcas/cadastrar": "/inventory/products/brands/create",
  "/estoque/produtos/marcas/detalhes/:id": "/inventory/products/brands/details/:id",
  "/estoque/produtos/marcas/editar/:id": "/inventory/products/brands/edit/:id",
  "/estoque/produtos/marcas/editar-em-lote": "/inventory/products/brands/batch-edit",
  "/estoque/retiradas-externas": "/inventory/external-withdrawals",
  "/estoque/retiradas-externas/cadastrar": "/inventory/external-withdrawals/create",
  "/estoque/retiradas-externas/detalhes/:id": "/inventory/external-withdrawals/details/:id",
  "/estoque/retiradas-externas/editar/:id": "/inventory/external-withdrawals/edit/:id",

  // ==================== PRODUÇÃO ====================
  "/producao": "/production",
  "/producao/aerografia": "/production/airbrushing",
  "/producao/aerografia/cadastrar": "/production/airbrushing/create",
  "/producao/aerografia/detalhes/:id": "/production/airbrushing/details/:id",
  "/producao/aerografia/editar/:id": "/production/airbrushing/edit/:id",
  "/producao/cronograma": "/production/schedule",
  "/producao/cronograma/cadastrar": "/production/schedule/create",
  "/producao/cronograma/detalhes/:id": "/production/schedule/details/:id",
  "/producao/cronograma/editar/:id": "/production/schedule/edit/:id",
  "/producao/em-espera": "/production/on-hold",
  "/producao/garagens": "/production/garages",
  "/producao/garagens/cadastrar": "/production/garages/create",
  "/producao/garagens/detalhes/:id": "/production/garages/details/:id",
  "/producao/garagens/editar/:id": "/production/garages/edit/:id",
  "/producao/historico": "/production/history",
  "/producao/observacoes": "/production/observations",
  "/producao/observacoes/cadastrar": "/production/observations/create",
  "/producao/observacoes/detalhes/:id": "/production/observations/details/:id",
  "/producao/observacoes/editar/:id": "/production/observations/edit/:id",
  "/producao/recorte": "/production/cutting",
  "/producao/recorte/plano-de-recorte": "/production/cutting/cutting-plan",
  "/producao/recorte/plano-de-recorte/cadastrar": "/production/cutting/cutting-plan/create",
  "/producao/recorte/plano-de-recorte/detalhes/:id": "/production/cutting/cutting-plan/details/:id",
  "/producao/recorte/plano-de-recorte/editar/:id": "/production/cutting/cutting-plan/edit/:id",
  "/producao/recorte/requisicao-de-recorte": "/production/cutting/cutting-request",
  "/producao/recorte/requisicao-de-recorte/cadastrar": "/production/cutting/cutting-request/create",
  "/producao/recorte/requisicao-de-recorte/detalhes/:id": "/production/cutting/cutting-request/details/:id",
  "/producao/recorte/requisicao-de-recorte/editar/:id": "/production/cutting/cutting-request/edit/:id",
  "/producao/ordens-de-servico": "/production/service-orders",
  "/producao/ordens-de-servico/cadastrar": "/production/service-orders/create",
  "/producao/ordens-de-servico/detalhes/:id": "/production/service-orders/details/:id",
  "/producao/ordens-de-servico/editar/:id": "/production/service-orders/edit/:id",
  "/producao/servicos": "/production/services",
  "/producao/servicos/cadastrar": "/production/services/create",
  "/producao/servicos/detalhes/:id": "/production/services/details/:id",
  "/producao/servicos/editar/:id": "/production/services/edit/:id",
  "/producao/caminhoes": "/production/trucks",
  "/producao/caminhoes/cadastrar": "/production/trucks/create",
  "/producao/caminhoes/detalhes/:id": "/production/trucks/details/:id",
  "/producao/caminhoes/editar/:id": "/production/trucks/edit/:id",
  "/producao/tintas": "/production/paints",
  "/producao/tintas/cadastrar": "/production/paints/create",
  "/producao/tintas/detalhes/:id": "/production/paints/details/:id",
  "/producao/tintas/editar/:id": "/production/paints/edit/:id",

  // ==================== PINTURA ====================
  "/pintura": "/painting",
  "/pintura/catalogo": "/painting/catalog",
  "/pintura/catalogo/detalhes/:id": "/painting/catalog/details/:id",
  "/pintura/catalogo/editar/:id": "/painting/catalog/edit/:id",
  "/pintura/catalogo-basico": "/painting/basic-catalog",
  "/pintura/catalogo-basico/detalhes/:id": "/painting/basic-catalog/details/:id",
  "/pintura/formulas": "/painting/formulas",
  "/pintura/formulas/cadastrar": "/painting/formulas/create",
  "/pintura/formulas/detalhes/:id": "/painting/formulas/details/:id",
  "/pintura/formulas/editar/:id": "/painting/formulas/edit/:id",
  "/pintura/marcas-de-tinta": "/painting/paint-brands",
  "/pintura/marcas-de-tinta/cadastrar": "/painting/paint-brands/create",
  "/pintura/marcas-de-tinta/editar/:id": "/painting/paint-brands/edit/:id",
  "/pintura/tipos-de-tinta": "/painting/paint-types",
  "/pintura/tipos-de-tinta/cadastrar": "/painting/paint-types/create",
  "/pintura/tipos-de-tinta/editar/:id": "/painting/paint-types/edit/:id",
  "/pintura/producoes": "/painting/productions",
  "/pintura/producoes/detalhes/:id": "/painting/productions/details/:id",

  // ==================== RECURSOS HUMANOS ====================
  "/recursos-humanos": "/human-resources",
  "/recursos-humanos/avisos": "/human-resources/warnings",
  "/recursos-humanos/avisos/cadastrar": "/human-resources/warnings/create",
  "/recursos-humanos/avisos/detalhes/:id": "/human-resources/warnings/details/:id",
  "/recursos-humanos/avisos/editar/:id": "/human-resources/warnings/edit/:id",
  "/recursos-humanos/calculos": "/human-resources/calculations",
  "/recursos-humanos/cargos": "/human-resources/positions",
  "/recursos-humanos/cargos/cadastrar": "/human-resources/positions/create",
  "/recursos-humanos/cargos/detalhes/:id": "/human-resources/positions/details/:id",
  "/recursos-humanos/cargos/editar/:id": "/human-resources/positions/edit/:id",
  "/recursos-humanos/controle-ponto": "/human-resources/time-control",
  "/recursos-humanos/epi": "/human-resources/ppe",
  "/recursos-humanos/epi/cadastrar": "/human-resources/ppe/create",
  "/recursos-humanos/epi/detalhes/:id": "/human-resources/ppe/details/:id",
  "/recursos-humanos/epi/editar/:id": "/human-resources/ppe/edit/:id",
  "/recursos-humanos/epi/agendamentos": "/human-resources/ppe/schedules",
  "/recursos-humanos/epi/agendamentos/cadastrar": "/human-resources/ppe/schedules/create",
  "/recursos-humanos/epi/agendamentos/detalhes/:id": "/human-resources/ppe/schedules/details/:id",
  "/recursos-humanos/epi/agendamentos/editar/:id": "/human-resources/ppe/schedules/edit/:id",
  "/recursos-humanos/epi/entregas": "/human-resources/ppe/deliveries",
  "/recursos-humanos/epi/entregas/cadastrar": "/human-resources/ppe/deliveries/create",
  "/recursos-humanos/epi/entregas/detalhes/:id": "/human-resources/ppe/deliveries/details/:id",
  "/recursos-humanos/epi/entregas/editar/:id": "/human-resources/ppe/deliveries/edit/:id",
  "/recursos-humanos/epi/tamanhos": "/human-resources/ppe/sizes",
  "/recursos-humanos/epi/tamanhos/cadastrar": "/human-resources/ppe/sizes/create",
  "/recursos-humanos/epi/tamanhos/editar/:id": "/human-resources/ppe/sizes/edit/:id",
  "/recursos-humanos/feriados": "/human-resources/holidays",
  "/recursos-humanos/feriados/cadastrar": "/human-resources/holidays/create",
  "/recursos-humanos/feriados/editar/:id": "/human-resources/holidays/edit/:id",
  "/recursos-humanos/ferias": "/human-resources/vacations",
  "/recursos-humanos/ferias/cadastrar": "/human-resources/vacations/create",
  "/recursos-humanos/ferias/detalhes/:id": "/human-resources/vacations/details/:id",
  "/recursos-humanos/folha-de-pagamento": "/human-resources/payroll",
  "/recursos-humanos/niveis-desempenho": "/human-resources/performance-levels",
  "/recursos-humanos/requisicoes": "/human-resources/requests",
  "/recursos-humanos/simulacao-bonus": "/human-resources/bonus-simulation",

  // ==================== SERVIDOR ====================
  "/servidor": "/server",
  "/servidor/backup": "/server/backup",
  "/servidor/sincronizacao-bd": "/server/database-sync",
  "/servidor/implantacoes": "/server/deployments",
  "/servidor/implantacoes/cadastrar": "/server/deployments/create",
  "/servidor/implantacoes/detalhes/:id": "/server/deployments/details/:id",
  "/servidor/logs": "/server/logs",
  "/servidor/metricas": "/server/metrics",
  "/servidor/pastas-compartilhadas": "/server/shared-folders",
  "/servidor/servicos": "/server/services",
  "/servidor/usuarios": "/server/users",
  "/servidor/usuarios/cadastrar": "/server/users/create",
  "/servidor/rate-limiting": "/server/rate-limiting",
  "/servidor/registros-de-alteracoes": "/server/change-logs",
  "/servidor/registros-de-alteracoes/detalhes/:id": "/server/change-logs/details/:id",

  // ==================== MEU PESSOAL ====================
  "/meu-pessoal": "/my-team",
  "/meu-pessoal/avisos": "/my-team/warnings",
  "/meu-pessoal/emprestimos": "/my-team/borrows",
  "/meu-pessoal/ferias": "/my-team/vacations",

  // ==================== PESSOAL ====================
  "/pessoal": "/personal",
  "/pessoal/meus-emprestimos": "/personal/my-borrows",
  "/pessoal/meus-emprestimos/detalhes/:id": "/personal/my-borrows/details/:id",
  "/pessoal/meus-feriados": "/personal/my-holidays",
  "/pessoal/meus-feriados/detalhes/:id": "/personal/my-holidays/details/:id",
  "/pessoal/minhas-notificacoes": "/personal/my-notifications",
  "/pessoal/minhas-notificacoes/detalhes/:id": "/personal/my-notifications/details/:id",
  "/pessoal/meus-epis": "/personal/my-ppes",
  "/pessoal/minhas-ferias": "/personal/my-vacations",
  "/pessoal/minhas-ferias/detalhes/:id": "/personal/my-vacations/details/:id",
  "/pessoal/minhas-advertencias": "/personal/my-warnings",
  "/pessoal/minhas-advertencias/detalhes/:id": "/personal/my-warnings/details/:id",
  "/pessoal/meu-perfil": "/personal/my-profile",
  "/pessoal/preferencias": "/personal/preferences",

  // ==================== ESTATÍSTICAS ====================
  "/estatisticas": "/statistics",
  "/estatisticas/administracao": "/statistics/administration",
  "/estatisticas/estoque": "/statistics/inventory",
  "/estatisticas/estoque/consumo": "/statistics/inventory/consumption",
  "/estatisticas/estoque/movimentacao": "/statistics/inventory/movement",
  "/estatisticas/estoque/tendencias": "/statistics/inventory/trends",
  "/estatisticas/estoque/top-itens": "/statistics/inventory/top-items",
  "/estatisticas/producao": "/statistics/production",
  "/estatisticas/recursos-humanos": "/statistics/human-resources",

  // ==================== INTEGRAÇÕES ====================
  "/integracoes": "/integrations",
  "/integracoes/secullum": "/integrations/secullum",
  "/integracoes/secullum/calculos": "/integrations/secullum/calculations",
  "/integracoes/secullum/registros-ponto": "/integrations/secullum/time-entries",
  "/integracoes/secullum/registros-ponto/detalhes/:id": "/integrations/secullum/time-entries/details/:id",
  "/integracoes/secullum/status-sincronizacao": "/integrations/secullum/sync-status",

  // ==================== FINANCEIRO ====================
  "/financeiro": "/financial",
  "/financeiro/clientes": "/financial/customers",
  "/financeiro/producao": "/financial/production",
  "/financeiro/producao/aerografia": "/financial/production/airbrushing",
  "/financeiro/producao/cronograma": "/financial/production/schedule",
  "/financeiro/producao/em-espera": "/financial/production/on-hold",
  "/financeiro/producao/historico-tarefas": "/financial/production/task-history",

  // ==================== MANUTENÇÃO STANDALONE ====================
  "/manutencao": "/maintenance",
  "/manutencao/cadastrar": "/maintenance/create",
  "/manutencao/detalhes/:id": "/maintenance/details/:id",
  "/manutencao/editar/:id": "/maintenance/edit/:id",
};

// Legacy English map for backward compatibility (will be phased out)
export const routeEnglishMap: Record<string, string> = Object.entries(portugueseToEnglishRoutes).reduce(
  (acc, [pt, en]) => {
    // Create reverse mapping for legacy code
    const cleanEn = en.replace('/home', '/');
    acc[cleanEn] = pt;
    return acc;
  },
  {} as Record<string, string>
);

// Dynamic route patterns for handling :id parameters
export const dynamicRoutePatterns: Array<{ pattern: RegExp; mapper: (match: RegExpMatchArray) => string }> = [
  // Portuguese patterns
  { pattern: /^\/(.+)\/detalhes\/(.+)$/, mapper: (match) => `/${match[1]}/details/${match[2]}` },
  { pattern: /^\/(.+)\/editar\/(.+)$/, mapper: (match) => `/${match[1]}/edit/${match[2]}` },
  { pattern: /^\/(.+)\/cadastrar$/, mapper: (match) => `/${match[1]}/create` },
];

// Main conversion function: Portuguese path to English folder path
export function getEnglishPath(portuguesePath: string): string {
  // Handle null or undefined
  if (!portuguesePath) return "/home";

  // Remove leading slash and (tabs) prefix if present
  const cleanPath = portuguesePath.replace(/^\/(\(tabs\)\/)?/, "/");

  // Handle home route special case
  if (cleanPath === "/" || cleanPath === routes.home) {
    return "/home";
  }

  // Handle dynamic segments - replace actual UUID with :id placeholder
  const pathWithPlaceholder = cleanPath.replace(/\/[a-f0-9-]{36}($|\/)/g, '/:id$1');

  // Try exact match first
  if (portugueseToEnglishRoutes[pathWithPlaceholder]) {
    const englishPath = portugueseToEnglishRoutes[pathWithPlaceholder];
    // Restore actual ID if present
    const idMatch = cleanPath.match(/\/([a-f0-9-]{36})($|\/)/);
    if (idMatch) {
      return englishPath.replace(':id', idMatch[1]);
    }
    return englishPath;
  }

  // Try partial matching for nested routes
  const segments = cleanPath.split("/").filter(Boolean);

  // Build progressively longer paths to find the best match
  for (let i = segments.length; i > 0; i--) {
    const partialPath = "/" + segments.slice(0, i).join("/");
    const partialWithPlaceholder = partialPath.replace(/\/[a-f0-9-]{36}($|\/)/g, '/:id$1');

    if (portugueseToEnglishRoutes[partialWithPlaceholder]) {
      const baseMapped = portugueseToEnglishRoutes[partialWithPlaceholder];
      const remainingSegments = segments.slice(i);

      if (remainingSegments.length > 0) {
        // Try to map remaining segments
        const remainingPath = "/" + remainingSegments.join("/");
        const mappedRemaining = getEnglishPath(remainingPath);
        return baseMapped + mappedRemaining;
      }

      return baseMapped;
    }
  }

  // If no match found, try dynamic patterns
  for (const { pattern, mapper } of dynamicRoutePatterns) {
    const match = cleanPath.match(pattern);
    if (match) {
      return mapper(match);
    }
  }

  // Last resort: return original path
  console.warn(`No mapping found for path: ${portuguesePath}`);
  return cleanPath;
}

// Reverse conversion: English folder path to Portuguese path
export function getOriginalPath(englishPath: string): string {
  // Handle undefined or null paths
  if (!englishPath) {
    console.error("getOriginalPath called with undefined or null path");
    return "/";
  }

  // Create reverse map
  const englishToPortugueseRoutes = Object.entries(portugueseToEnglishRoutes).reduce(
    (acc, [pt, en]) => {
      acc[en] = pt;
      return acc;
    },
    {} as Record<string, string>
  );

  // Remove leading slash if present
  const cleanPath = englishPath.startsWith("/") ? englishPath : `/${englishPath}`;

  // Handle home route
  if (cleanPath === "/home") {
    return "/";
  }

  // Handle dynamic segments
  const pathWithPlaceholder = cleanPath.replace(/\/[a-f0-9-]{36}($|\/)/g, '/:id$1');

  // Try exact match first
  if (englishToPortugueseRoutes[pathWithPlaceholder]) {
    const portuguesePath = englishToPortugueseRoutes[pathWithPlaceholder];
    // Restore actual ID if present
    const idMatch = cleanPath.match(/\/([a-f0-9-]{36})($|\/)/);
    if (idMatch) {
      return portuguesePath.replace(':id', idMatch[1]);
    }
    return portuguesePath;
  }

  // If not found, return original
  return cleanPath;
}

// Helper function to get title from path
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

  // First try with the original path
  let title = searchMenuItems(MENU_ITEMS, normalizedPath);

  // If not found, try converting to Portuguese path
  if (!title) {
    const portuguesePath = getOriginalPath(path);
    const normalizedPortuguese = portuguesePath.replace(/^\/+|\/+$/g, '');
    title = searchMenuItems(MENU_ITEMS, normalizedPortuguese);
  }

  return title;
}

// Helper function to convert route to mobile path format
export function routeToMobilePath(route: string): string {
  const englishPath = getEnglishPath(route);
  // Remove leading slash if present
  const cleanPath = englishPath.startsWith("/") ? englishPath.slice(1) : englishPath;
  // Add (tabs) prefix for tab routes
  return `/(tabs)/${cleanPath}`;
}

// Export reverse map for backward compatibility
export const routeReverseMap = routeEnglishMap;