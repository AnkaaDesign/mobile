#!/usr/bin/env node
/**
 * Navigation Path Fixer
 * Converts Portuguese navigation paths to English paths that match actual files
 */

const pathMappings = {
  // Main sections
  'administracao': 'administration',
  'pintura': 'painting',
  'recursos-humanos': 'human-resources',
  'estoque': 'inventory',
  'producao': 'production',
  'pessoal': 'personal',
  'servidor': 'server',
  'integracoes': 'integrations',
  'meu-pessoal': 'my-team',
  'manutencao': 'maintenance',
  'financeiro': 'financial',

  // Subsections
  'clientes': 'customers',
  'colaboradores': 'collaborators',
  'usuarios': 'users', // Note: Should be removed (duplicate of colaboradores)
  'notificacoes': 'notifications',
  'setores': 'sectors',
  'arquivos': 'files',
  'registros-de-alteracoes': 'change-logs',

  // Painting
  'catalogo': 'catalog',
  'marcas-de-tinta': 'paint-brands',
  'tipos-de-tinta': 'paint-types',
  'producoes': 'productions',
  'formulas': 'formulas',

  // Human Resources
  'epi': 'ppe',
  'agendamentos': 'schedules',
  'entregas': 'deliveries',
  'tamanhos': 'sizes',
  'feriados': 'holidays',
  'ferias': 'vacations',
  'avisos': 'warnings',
  'cargos': 'positions',
  'controle-ponto': 'time-clock',
  'folha-de-pagamento': 'payroll',
  'niveis-desempenho': 'performance-levels',
  'calculos': 'calculations',
  'requisicoes': 'requisitions',
  'simulacao-bonus': 'bonus-simulation',

  // Inventory
  'emprestimos': 'borrows',
  'fornecedores': 'suppliers',
  'manutencao': 'maintenance',
  'movimentacoes': 'activities',
  'pedidos': 'orders',
  'produtos': 'products',
  'categorias': 'categories',
  'marcas': 'brands',
  'retiradas-externas': 'external-withdrawals',
  'automaticos': 'automatic',

  // Production
  'aerografia': 'airbrushing',
  'cronograma': 'schedule',
  'em-espera': 'on-hold',
  'garagens': 'garages',
  'historico': 'history',
  'observacoes': 'observations',
  'recorte': 'cutting',
  'servicos': 'services',
  'ordens-de-servico': 'service-orders',
  'caminhoes': 'trucks',

  // Personal
  'meus-avisos': 'my-warnings',
  'meus-emprestimos': 'my-borrows',
  'meus-epis': 'my-ppes',
  'meus-feriados': 'my-holidays',
  'minhas-ferias': 'my-vacations',
  'minhas-notificacoes': 'my-notifications',
  'meu-perfil': 'my-profile',
  'preferencias': 'preferences',

  // Server
  'backup': 'backups',
  'implantacoes': 'deployments',
  'logs': 'logs',
  'metricas': 'metrics',
  'pastas-compartilhadas': 'shared-folders',

  // Integrations
  'secullum': 'secullum',
  'registros-ponto': 'time-entries',
  'status-sincronizacao': 'sync-status',

  // Actions
  'cadastrar': 'create',
  'listar': 'list',
  'detalhes': 'details',
  'editar': 'edit',
  'enviar': 'send',
};

/**
 * Convert Portuguese path to English
 */
function convertPath(portuguesePath) {
  if (portuguesePath === '/') return '/';

  const segments = portuguesePath.split('/').filter(Boolean);
  const englishSegments = segments.map(segment => {
    // Handle dynamic segments
    if (segment.startsWith(':')) return segment;

    // Look up in mappings
    return pathMappings[segment] || segment;
  });

  return '/' + englishSegments.join('/');
}

// Test some paths
const testPaths = [
  '/administracao',
  '/administracao/colaboradores/listar',
  '/pintura/catalogo/detalhes/:id',
  '/recursos-humanos/epi/entregas/cadastrar',
  '/estoque/produtos/marcas/listar',
  '/producao/cronograma/cadastrar',
];

console.log('='.repeat(80));
console.log('PATH CONVERSION TEST');
console.log('='.repeat(80));
console.log('');

testPaths.forEach(path => {
  const converted = convertPath(path);
  console.log(`Portuguese: ${path}`);
  console.log(`English:    ${converted}`);
  console.log('');
});

console.log('='.repeat(80));
console.log('');
console.log('To use this in navigation.ts:');
console.log('1. Replace all Portuguese paths with their English equivalents');
console.log('2. Use the mapping above for reference');
console.log('3. Test each navigation item after update');
console.log('');
console.log('Example:');
console.log('  BEFORE: path: "/administracao/colaboradores/listar"');
console.log('  AFTER:  path: "/administration/collaborators/list"');
console.log('');
