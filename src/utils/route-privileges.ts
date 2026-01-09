import { SECTOR_PRIVILEGES } from '@/constants';

/**
 * Centralized route privilege mappings for mobile app
 * Maps Expo Router file-based routes to required privileges
 * Supports both single privilege and arrays (OR logic - user needs ANY of the privileges)
 */
export const ROUTE_PRIVILEGES: Record<
  string,
  keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[]
> = {
  // =====================
  // AUTH & HOME ROUTES
  // =====================
  
  // Authentication routes - public
  '/(autenticacao)/entrar': 'BASIC',
  '/(autenticacao)/registrar': 'BASIC',
  '/(autenticacao)/recuperar-senha': 'BASIC',
  '/(autenticacao)/verificar-codigo': 'BASIC',
  '/(autenticacao)/redefinir-senha/[token]': 'BASIC',
  
  // Home - Basic access
  '/(tabs)/inicio': 'BASIC',
  
  // =====================
  // ADMINISTRAÇÃO
  // =====================
  
  '/(tabs)/administracao': 'ADMIN',
  '/(tabs)/administracao/clientes': ['ADMIN', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/administracao/clientes/listar': ['ADMIN', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/administracao/clientes/cadastrar': ['ADMIN', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/administracao/clientes/detalhes/[id]': ['ADMIN', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/administracao/clientes/editar/[id]': ['ADMIN', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/administracao/clientes/editar-em-lote': ['ADMIN', 'FINANCIAL', 'COMMERCIAL'],
  
  '/(tabs)/administracao/colaboradores': 'HUMAN_RESOURCES',
  '/(tabs)/administracao/colaboradores/listar': 'HUMAN_RESOURCES',
  '/(tabs)/administracao/colaboradores/cadastrar': 'ADMIN',
  '/(tabs)/administracao/colaboradores/detalhes/[id]': 'HUMAN_RESOURCES',
  '/(tabs)/administracao/colaboradores/editar/[id]': 'HUMAN_RESOURCES',
  
  '/(tabs)/administracao/setores': 'ADMIN',
  '/(tabs)/administracao/notificacoes': 'ADMIN',
  '/(tabs)/administracao/registros-de-alteracoes': 'ADMIN',
  '/(tabs)/administracao/arquivos': 'ADMIN',
  
  // =====================
  // ESTOQUE (INVENTORY)
  // =====================
  
  '/(tabs)/estoque': 'WAREHOUSE',
  
  // Products
  '/(tabs)/estoque/produtos': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/listar': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/editar/[id]': 'WAREHOUSE',
  
  // Categories
  '/(tabs)/estoque/produtos/categorias': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/categorias/listar': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/categorias/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/categorias/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/categorias/editar/[id]': 'WAREHOUSE',
  
  // Brands
  '/(tabs)/estoque/produtos/marcas': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/marcas/listar': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/marcas/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/marcas/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/produtos/marcas/editar/[id]': 'WAREHOUSE',
  
  // Suppliers
  '/(tabs)/estoque/fornecedores': 'WAREHOUSE',
  '/(tabs)/estoque/fornecedores/listar': 'WAREHOUSE',
  '/(tabs)/estoque/fornecedores/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/fornecedores/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/fornecedores/editar/[id]': 'WAREHOUSE',
  
  // Orders
  '/(tabs)/estoque/pedidos': 'WAREHOUSE',
  '/(tabs)/estoque/pedidos/listar': 'WAREHOUSE',
  '/(tabs)/estoque/pedidos/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/pedidos/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/pedidos/editar/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/pedidos/[orderId]/items': 'WAREHOUSE',
  
  // Maintenance
  '/(tabs)/estoque/manutencao': ['WAREHOUSE', 'MAINTENANCE', 'ADMIN'],
  '/(tabs)/estoque/manutencao/listar': ['WAREHOUSE', 'MAINTENANCE', 'ADMIN'],
  '/(tabs)/estoque/manutencao/cadastrar': ['WAREHOUSE', 'MAINTENANCE', 'ADMIN'],
  '/(tabs)/estoque/manutencao/detalhes/[id]': ['WAREHOUSE', 'MAINTENANCE', 'ADMIN'],
  '/(tabs)/estoque/manutencao/editar/[id]': ['WAREHOUSE', 'MAINTENANCE', 'ADMIN'],
  
  // PPE
  '/(tabs)/estoque/epi': 'WAREHOUSE',
  '/(tabs)/estoque/epi/listar': 'WAREHOUSE',
  '/(tabs)/estoque/epi/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/epi/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/epi/editar/[id]': 'WAREHOUSE',
  
  // Loans (Emprestimos)
  '/(tabs)/estoque/emprestimos': 'WAREHOUSE',
  '/(tabs)/estoque/emprestimos/listar': 'WAREHOUSE',
  '/(tabs)/estoque/emprestimos/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/emprestimos/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/emprestimos/editar/[id]': 'WAREHOUSE',
  
  // External Withdrawals
  '/(tabs)/estoque/retiradas-externas': 'WAREHOUSE',
  '/(tabs)/estoque/retiradas-externas/listar': 'WAREHOUSE',
  '/(tabs)/estoque/retiradas-externas/cadastrar': 'WAREHOUSE',
  '/(tabs)/estoque/retiradas-externas/detalhes/[id]': 'WAREHOUSE',
  '/(tabs)/estoque/retiradas-externas/editar/[id]': 'WAREHOUSE',
  
  // Movements
  '/(tabs)/estoque/movimentacoes': 'WAREHOUSE',
  '/(tabs)/estoque/movimentacoes/listar': 'WAREHOUSE',
  
  // =====================
  // PRODUÇÃO (PRODUCTION)
  // =====================
  
  '/(tabs)/producao': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL'],

  // Schedule (Cronograma) - PLOTTING and COMMERCIAL have access - NO CREATE
  '/(tabs)/producao/cronograma': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL'],
  '/(tabs)/producao/cronograma/listar': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL'],
  '/(tabs)/producao/cronograma/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/cronograma/editar/[id]': ['PRODUCTION', 'WAREHOUSE', 'FINANCIAL', 'LOGISTIC', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/cronograma/operacoes-em-lote': ['PRODUCTION', 'WAREHOUSE'],

  // History - PLOTTING and COMMERCIAL have access
  '/(tabs)/producao/historico': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL'],
  '/(tabs)/producao/historico/listar': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL'],
  '/(tabs)/producao/historico/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'LOGISTIC', 'PLOTTING', 'COMMERCIAL', 'ADMIN'],

  // Agenda - COMMERCIAL has access - Only ADMIN can create
  '/(tabs)/producao/agenda': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/agenda/index': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/agenda/cadastrar': ['ADMIN'],
  '/(tabs)/producao/agenda/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE', 'DESIGNER', 'FINANCIAL', 'COMMERCIAL', 'ADMIN'],

  // Airbrushings (Aerografia) - COMMERCIAL has access
  '/(tabs)/producao/aerografia': ['PRODUCTION', 'WAREHOUSE', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/producao/aerografia/listar': ['PRODUCTION', 'WAREHOUSE', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/producao/aerografia/cadastrar': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/aerografia/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE', 'FINANCIAL', 'COMMERCIAL'],
  '/(tabs)/producao/aerografia/editar/[id]': ['PRODUCTION', 'WAREHOUSE'],
  
  // Cutting (Recorte) - Now accessible by PLOTTING sector
  '/(tabs)/producao/recorte': ['PRODUCTION', 'PLOTTING', 'DESIGNER', 'ADMIN'],
  '/(tabs)/producao/recorte/listar': ['PRODUCTION', 'PLOTTING', 'DESIGNER', 'ADMIN'],
  '/(tabs)/producao/recorte/plano-de-recorte/cadastrar': ['PRODUCTION', 'PLOTTING'],
  '/(tabs)/producao/recorte/plano-de-recorte/detalhes/[id]': ['PRODUCTION', 'PLOTTING', 'DESIGNER', 'ADMIN'],
  '/(tabs)/producao/recorte/plano-de-recorte/editar/[id]': ['PRODUCTION', 'PLOTTING'],
  '/(tabs)/producao/recorte/plano-de-recorte/listar': ['PRODUCTION', 'PLOTTING', 'DESIGNER', 'ADMIN'],
  
  // Garages - COMMERCIAL has access
  '/(tabs)/producao/garagens': ['PRODUCTION', 'LOGISTIC', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/garagens/listar': ['PRODUCTION', 'LOGISTIC', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/garagens/cadastrar': ['PRODUCTION', 'ADMIN'],
  '/(tabs)/producao/garagens/detalhes/[id]': ['PRODUCTION', 'LOGISTIC', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/producao/garagens/editar/[id]': ['PRODUCTION', 'ADMIN'],

  // Observations - COMMERCIAL has access
  '/(tabs)/producao/observacoes': ['PRODUCTION', 'WAREHOUSE', 'COMMERCIAL'],
  '/(tabs)/producao/observacoes/listar': ['PRODUCTION', 'WAREHOUSE', 'COMMERCIAL'],
  '/(tabs)/producao/observacoes/cadastrar': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/observacoes/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE', 'COMMERCIAL'],
  '/(tabs)/producao/observacoes/editar/[id]': ['PRODUCTION', 'WAREHOUSE'],
  
  // Trucks (Caminhões)
  '/(tabs)/producao/caminhoes': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/caminhoes/listar': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/caminhoes/cadastrar': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/caminhoes/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/caminhoes/editar/[id]': ['PRODUCTION', 'WAREHOUSE'],
  
  // Service Orders (Ordens de Serviço)
  '/(tabs)/producao/ordens-de-servico': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/ordens-de-servico/listar': ['PRODUCTION', 'WAREHOUSE'],
  
  // Services (Serviços)
  '/(tabs)/producao/servicos': ['PRODUCTION', 'WAREHOUSE'],
  
  // Paints (Tintas) - under production
  '/(tabs)/producao/tintas': ['PRODUCTION', 'WAREHOUSE'],
  '/(tabs)/producao/tintas/listar': ['PRODUCTION', 'WAREHOUSE'],
  
  // =====================
  // PINTURA (PAINT)
  // =====================
  
  '/(tabs)/pintura': ['WAREHOUSE', 'DESIGNER', 'COMMERCIAL', 'ADMIN'],

  // Catalog (Catálogo) - COMMERCIAL has access
  '/(tabs)/pintura/catalogo': ['WAREHOUSE', 'DESIGNER', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/pintura/catalogo/listar': ['WAREHOUSE', 'DESIGNER', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/pintura/catalogo/cadastrar': ['WAREHOUSE', 'ADMIN'],
  '/(tabs)/pintura/catalogo/detalhes/[id]': ['WAREHOUSE', 'DESIGNER', 'COMMERCIAL', 'ADMIN'],
  '/(tabs)/pintura/catalogo/editar/[id]': ['WAREHOUSE', 'ADMIN'],

  // Formulas
  '/(tabs)/pintura/formulas': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/formulas/listar': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/formulas/cadastrar': ['WAREHOUSE', 'ADMIN'], // CRITICAL: Mobile needs this screen
  '/(tabs)/pintura/formulas/detalhes/[id]': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/formulas/editar/[id]': ['WAREHOUSE', 'ADMIN'], // CRITICAL: Mobile needs this screen

  // Paint Brands
  '/(tabs)/pintura/marcas-de-tinta': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/marcas-de-tinta/listar': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/marcas-de-tinta/cadastrar': ['WAREHOUSE', 'ADMIN'],
  '/(tabs)/pintura/marcas-de-tinta/detalhes/[id]': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/marcas-de-tinta/editar/[id]': ['WAREHOUSE', 'ADMIN'],

  // Paint Types
  '/(tabs)/pintura/tipos-de-tinta': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/tipos-de-tinta/listar': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/tipos-de-tinta/cadastrar': ['WAREHOUSE', 'ADMIN'],
  '/(tabs)/pintura/tipos-de-tinta/detalhes/[id]': ['WAREHOUSE', 'DESIGNER', 'ADMIN'],
  '/(tabs)/pintura/tipos-de-tinta/editar/[id]': ['WAREHOUSE', 'ADMIN'],

  // Paint Productions
  '/(tabs)/pintura/producoes': ['PRODUCTION', 'WAREHOUSE', 'ADMIN'],
  '/(tabs)/pintura/producoes/listar': ['PRODUCTION', 'WAREHOUSE', 'ADMIN'],
  '/(tabs)/pintura/producoes/detalhes/[id]': ['PRODUCTION', 'WAREHOUSE', 'ADMIN'],
  
  // =====================
  // RECURSOS HUMANOS (HR)
  // =====================
  
  '/(tabs)/recursos-humanos': 'HUMAN_RESOURCES',
  
  // Employees (Funcionários)
  '/(tabs)/recursos-humanos/funcionarios': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/funcionarios/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/funcionarios/cadastrar': 'ADMIN',
  '/(tabs)/recursos-humanos/funcionarios/detalhes/[id]': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/funcionarios/editar/[id]': 'HUMAN_RESOURCES',
  
  // PPE
  '/(tabs)/recursos-humanos/epi': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/epi/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/epi/detalhes/[id]': 'HUMAN_RESOURCES',
  
  // Holidays
  '/(tabs)/recursos-humanos/feriados': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/feriados/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/feriados/cadastrar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/feriados/detalhes/[id]': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/feriados/editar/[id]': 'HUMAN_RESOURCES',
  
  // Vacations
  '/(tabs)/recursos-humanos/ferias': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/ferias/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/ferias/cadastrar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/ferias/detalhes/[id]': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/ferias/editar/[id]': 'HUMAN_RESOURCES',
  
  // Warnings
  '/(tabs)/recursos-humanos/advertencias': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/advertencias/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/advertencias/cadastrar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/advertencias/detalhes/[id]': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/advertencias/editar/[id]': 'HUMAN_RESOURCES',
  
  // Positions
  '/(tabs)/recursos-humanos/cargos': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/cargos/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/cargos/cadastrar': 'ADMIN',
  '/(tabs)/recursos-humanos/cargos/detalhes/[id]': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/cargos/editar/[id]': 'HUMAN_RESOURCES',
  
  // Sectors
  '/(tabs)/recursos-humanos/setores': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/setores/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/setores/cadastrar': 'ADMIN',
  
  // Payroll
  '/(tabs)/recursos-humanos/folha-de-pagamento': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/folha-de-pagamento/listar': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/folha-de-pagamento/detalhes/[id]': 'HUMAN_RESOURCES',
  
  // Performance Levels
  '/(tabs)/recursos-humanos/niveis-de-desempenho': 'HUMAN_RESOURCES',
  '/(tabs)/recursos-humanos/niveis-de-desempenho/listar': 'HUMAN_RESOURCES',
  
  // =====================
  // PESSOAL (PERSONAL)
  // =====================
  
  '/(tabs)/pessoal': 'BASIC',
  '/(tabs)/pessoal/my-profile': 'BASIC',
  '/(tabs)/pessoal/my-holidays': 'BASIC',
  '/(tabs)/pessoal/my-borrows': 'BASIC',
  '/(tabs)/pessoal/my-notifications': 'BASIC',
  '/(tabs)/pessoal/my-ppes': 'BASIC',
  '/(tabs)/pessoal/my-vacations': 'BASIC',
  '/(tabs)/pessoal/my-warnings': 'BASIC',
  '/(tabs)/pessoal/preferences': 'BASIC',
  
  // =====================
  // MEU PESSOAL (MY TEAM) - Requires being a team leader (having managedSector)
  // =====================

  '/(tabs)/meu-pessoal': 'BASIC', // Access is controlled by isTeamLeader check, not privilege
  '/(tabs)/meu-pessoal/emprestimos': 'BASIC',
  '/(tabs)/meu-pessoal/ferias': 'BASIC',
  '/(tabs)/meu-pessoal/advertencias': 'BASIC',
  
  // =====================
  // SERVIDOR (SERVER)
  // =====================

  '/(tabs)/servidor': 'ADMIN',
  '/(tabs)/servidor/backups': 'ADMIN',
  '/(tabs)/servidor/backups/listar': 'ADMIN',
  '/(tabs)/servidor/backups/cadastrar': 'ADMIN',
  '/(tabs)/servidor/backups/detalhes': 'ADMIN',
  '/servidor/backups/listar': 'ADMIN',
  '/(tabs)/servidor/registros-de-alteracoes': 'ADMIN',
  '/(tabs)/servidor/implantacoes': 'ADMIN',
  '/(tabs)/servidor/logs': 'ADMIN',
  '/(tabs)/servidor/database-sync': 'ADMIN',
  '/(tabs)/servidor/rate-limiting': 'ADMIN',
  '/(tabs)/servidor/usuarios': 'ADMIN',
  '/(tabs)/servidor/servicos': 'ADMIN',
  '/(tabs)/servidor/shared-folders': 'ADMIN',
  
  // =====================
  // INTEGRACOES (INTEGRATIONS)
  // =====================
  
  '/(tabs)/integracoes': 'ADMIN',
  '/(tabs)/integracoes/secullum': 'ADMIN',
  '/(tabs)/integracoes/secullum/calculos': 'ADMIN',
  '/(tabs)/integracoes/secullum/registros-ponto': 'ADMIN',
  '/(tabs)/integracoes/secullum/requisicoes': 'ADMIN',
  
  // =====================
  // CONFIGURAÇÕES (SETTINGS)
  // =====================
  
  '/(tabs)/configuracoes': 'BASIC',
  
  // =====================
  // CATALOG (standalone) - For team leaders only
  // =====================

  '/(tabs)/catalogo': 'BASIC', // Access is controlled by isTeamLeader check, not privilege
};

/**
 * Get required privilege(s) for a route
 * Returns single privilege or array of privileges
 * For unmatched routes, defaults to ADMIN (safe default)
 */
export function getRequiredPrivilegeForRoute(
  pathname: string
): keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[] {
  // Remove query params if present
  const cleanPath = pathname.split('?')[0];
  
  // First check for exact match
  if (ROUTE_PRIVILEGES[cleanPath]) {
    return ROUTE_PRIVILEGES[cleanPath];
  }
  
  // Then check for dynamic routes with [id], [token], etc. parameters
  const dynamicRoutes = Object.entries(ROUTE_PRIVILEGES)
    .filter(([routePattern]) => routePattern.includes('['))
    .sort(([a], [b]) => b.length - a.length); // Sort by specificity (longer patterns first)
  
  for (const [routePattern, privilege] of dynamicRoutes) {
    // Convert Expo Router pattern to regex: /producao/cronograma/detalhes/[id] -> /producao/cronograma/detalhes/[^/]+
    const regexPattern = routePattern
      .replace(/\[([^\]]+)\]/g, '[^/]+') // Replace [id], [token], etc. with regex
      .replace(/\//g, '\\/'); // Escape forward slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(cleanPath)) {
      return privilege;
    }
  }
  
  // Default to ADMIN for unmatched routes (safe default)
  return 'ADMIN';
}

/**
 * Check if a route requires specific privileges (beyond BASIC)
 */
export function routeRequiresPrivilege(pathname: string): boolean {
  const requiredPrivilege = getRequiredPrivilegeForRoute(pathname);
  
  if (Array.isArray(requiredPrivilege)) {
    return requiredPrivilege.some((privilege) => privilege !== 'BASIC');
  }
  
  return requiredPrivilege !== 'BASIC';
}

/**
 * Check if a route requires admin privileges
 */
export function routeRequiresAdmin(pathname: string): boolean {
  const requiredPrivilege = getRequiredPrivilegeForRoute(pathname);
  
  if (Array.isArray(requiredPrivilege)) {
    return requiredPrivilege.includes('ADMIN');
  }
  
  return requiredPrivilege === 'ADMIN';
}

/**
 * Get privilege display text for UI
 */
export function getPrivilegeDisplayText(
  privilege: keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[]
): string {
  if (Array.isArray(privilege)) {
    return privilege.join(' ou '); // "WAREHOUSE ou ADMIN"
  }
  return privilege;
}

/**
 * Helper function for development/debugging
 */
export function getRoutePrivilegeInfo(pathname: string) {
  const privilege = getRequiredPrivilegeForRoute(pathname);
  return {
    route: pathname,
    privilege,
    isArray: Array.isArray(privilege),
    requiresPrivilege: routeRequiresPrivilege(pathname),
    requiresAdmin: routeRequiresAdmin(pathname),
    displayText: getPrivilegeDisplayText(privilege),
  };
}
