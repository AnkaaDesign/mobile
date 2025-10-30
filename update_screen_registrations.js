// Script to generate Portuguese screen registrations for _layout.tsx

const fs = require('fs');
const path = require('path');

// Translation mappings
const translations = {
  // Modules
  'production': 'producao',
  'inventory': 'estoque',
  'administration': 'administracao',
  'painting': 'pintura',
  'server': 'servidor',
  'human-resources': 'recursos-humanos',
  'personal': 'pessoal',
  'integrations': 'integracoes',
  'my-team': 'meu-pessoal',
  'financial': 'financeiro',
  'statistics': 'estatisticas',

  // Actions
  'create': 'cadastrar',
  'edit': 'editar',
  'details': 'detalhes',
  'list': 'listar',

  // Specific terms
  'airbrushing': 'aerografia',
  'schedule': 'cronograma',
  'cutting': 'recorte',
  'cutting-plan': 'plano-de-recorte',
  'cutting-request': 'requisicao-de-recorte',
  'garages': 'garagens',
  'observations': 'observacoes',
  'paints': 'tintas',
  'service-orders': 'ordens-de-servico',
  'services': 'servicos',
  'trucks': 'caminhoes',
  'history': 'historico',
  'activities': 'movimentacoes',
  'movements': 'movimentacoes',
  'products': 'produtos',
  'categories': 'categorias',
  'brands': 'marcas',
  'suppliers': 'fornecedores',
  'orders': 'pedidos',
  'automatic': 'automaticos',
  'schedules': 'agendamentos',
  'maintenance': 'manutencao',
  'external-withdrawals': 'retiradas-externas',
  'ppe': 'epi',
  'borrows': 'emprestimos',
  'catalog': 'catalogo',
  'formulas': 'formulas',
  'paint-brands': 'marcas-de-tinta',
  'paint-types': 'tipos-de-tinta',
  'productions': 'producoes',
  'collaborators': 'colaboradores',
  'customers': 'clientes',
  'files': 'arquivos',
  'notifications': 'notificacoes',
  'sectors': 'setores',
  'change-logs': 'registros-de-alteracoes',
  'backups': 'backups',
  'deployments': 'implantacoes',
  'employees': 'funcionarios',
  'holidays': 'feriados',
  'payroll': 'folha-de-pagamento',
  'performance-levels': 'niveis-de-desempenho',
  'positions': 'cargos',
  'vacations': 'ferias',
  'warnings': 'advertencias',
  'secullum': 'secullum',
  'sync-status': 'status-sincronizacao',
  'time-records': 'registros-ponto',
  'deliveries': 'entregas',
  'components': 'componentes',
  'send': 'enviar',
  'items': 'items'
};

function translatePath(englishPath) {
  let portuguesePath = englishPath;

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

  for (const eng of sortedKeys) {
    const pt = translations[eng];
    // Replace whole words only (bounded by / or string boundaries)
    portuguesePath = portuguesePath.replace(new RegExp(`(^|/)${eng}(/|$)`, 'g'), `$1${pt}$2`);
  }

  return portuguesePath;
}

// Read the original screen list from the file
const layoutPath = path.join(__dirname, 'src/app/(tabs)/_layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Extract the screen registrations
const screenRegex = /{ name: "([^"]+)", title: "([^"]+)" },?/g;
let match;
const screens = [];

while ((match = screenRegex.exec(layoutContent)) !== null) {
  const englishName = match[1];
  const title = match[2];
  const portugueseName = translatePath(englishName);

  if (englishName !== portugueseName) {
    screens.push({
      english: englishName,
      portuguese: portugueseName,
      title: title
    });
  }
}

console.log('Found', screens.length, 'screens to translate');
console.log('\n// Sample translations:');
screens.slice(0, 10).forEach(s => {
  console.log(`//   ${s.english} → ${s.portuguese}`);
});

console.log('\n\nGenerate updated screen list? This script is for analysis only.');
