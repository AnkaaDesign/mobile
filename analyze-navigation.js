#!/usr/bin/env node
/**
 * Comprehensive Navigation Analysis Script
 *
 * This script analyzes the navigation menu and identifies:
 * 1. All navigation paths defined in constants/navigation.ts
 * 2. Expected file paths for each navigation item
 * 3. Whether those files actually exist
 * 4. All mismatches and missing files
 */

const fs = require('fs');
const path = require('path');

// SECTOR_PRIVILEGES enum (from constants/enums.ts)
const SECTOR_PRIVILEGES = {
  PRODUCTION: "PRODUCTION",
  DESIGNER: "DESIGNER",
  LOGISTIC: "LOGISTIC",
  FINANCIAL: "FINANCIAL",
  LEADER: "LEADER",
  HUMAN_RESOURCES: "HUMAN_RESOURCES",
  WAREHOUSE: "WAREHOUSE",
  ADMIN: "ADMIN",
  MAINTENANCE: "MAINTENANCE",
};

// Parse the navigation menu from the constants file
const NAVIGATION_MENU = [
  // HOME
  {
    id: "home",
    title: "Início",
    icon: "home",
    path: "/",
  },

  // ADMINISTRAÇÃO
  {
    id: "administracao",
    title: "Administração",
    icon: "cog",
    path: "/administracao",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "clientes",
        title: "Clientes",
        icon: "users",
        path: "/administracao/clientes",
        requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "clientes-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/clientes/cadastrar", requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
          { id: "clientes-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/clientes/detalhes/:id", isDynamic: true, requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
          { id: "clientes-editar", title: "Editar", icon: "edit", path: "/administracao/clientes/editar/:id", isDynamic: true, requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
          { id: "clientes-listar", title: "Listar", icon: "list", path: "/administracao/clientes/listar", requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
        ],
      },

      {
        id: "colaboradores",
        title: "Colaboradores",
        icon: "user",
        path: "/administracao/colaboradores",
        children: [
          { id: "colaboradores-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/colaboradores/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "colaboradores-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/colaboradores/detalhes/:id", isDynamic: true },
          { id: "colaboradores-editar", title: "Editar", icon: "edit", path: "/administracao/colaboradores/editar/:id", isDynamic: true },
          { id: "colaboradores-listar", title: "Listar", icon: "list", path: "/administracao/colaboradores/listar" },
        ],
      },

      {
        id: "usuarios",
        title: "Usuários",
        icon: "users",
        path: "/administracao/usuarios",
        requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "usuarios-listar", title: "Listar", icon: "list", path: "/administracao/usuarios/listar" },
        ],
      },

      {
        id: "notificacoes-admin",
        title: "Notificações",
        icon: "notification",
        path: "/administracao/notificacoes",
        children: [
          { id: "notificacoes-admin-cadastrar", title: "Cadastrar", icon: "external", path: "/administracao/notificacoes/cadastrar/enviar" },
          { id: "notificacoes-admin-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/notificacoes/detalhes/:id", isDynamic: true },
          { id: "notificacoes-admin-editar", title: "Editar", icon: "edit", path: "/administracao/notificacoes/editar/:id", isDynamic: true },
          { id: "notificacoes-admin-listar", title: "Listar", icon: "list", path: "/administracao/notificacoes/listar" },
        ],
      },

      {
        id: "setores",
        title: "Setores",
        icon: "building",
        path: "/administracao/setores/listar",
        children: [
          { id: "setores-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/setores/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "setores-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/setores/detalhes/:id", isDynamic: true },
          { id: "setores-editar", title: "Editar", icon: "edit", path: "/administracao/setores/editar/:id", isDynamic: true },
        ],
      },
    ],
  },

  // PINTURA
  {
    id: "pintura",
    title: "Pintura",
    icon: "palette",
    path: "/pintura",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "catalogo",
        title: "Catálogo",
        icon: "catalog",
        path: "/pintura/catalogo",
        requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          {
            id: "catalogo-listar",
            title: "Listar",
            icon: "list",
            path: "/pintura/catalogo/listar",
            requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
          },
          {
            id: "catalogo-cadastrar",
            title: "Cadastrar",
            icon: "plus",
            path: "/pintura/catalogo/cadastrar",
            requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
          },
          {
            id: "catalogo-detalhes",
            title: "Detalhes",
            icon: "eye",
            path: "/pintura/catalogo/detalhes/:id",
            isDynamic: true,
            children: [
              {
                id: "catalogo-formula-detalhes",
                title: "Detalhes da Fórmula",
                icon: "eye",
                path: "/pintura/catalogo/detalhes/:paintId/formulas/detalhes/:formulaId",
                isDynamic: true,
                requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
              },
              {
                id: "catalogo-formulas",
                title: "Fórmulas",
                icon: "beaker",
                path: "/pintura/catalogo/detalhes/:paintId/formulas",
                isDynamic: true,
                requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
              },
            ],
          },
          {
            id: "catalogo-editar",
            title: "Editar",
            icon: "edit",
            path: "/pintura/catalogo/editar/:id",
            isDynamic: true,
            requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
          },
        ],
      },

      {
        id: "marcas-de-tinta",
        title: "Marcas de Tinta",
        icon: "brand",
        path: "/pintura/marcas-de-tinta",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "marcas-tinta-cadastrar", title: "Cadastrar", icon: "plus", path: "/pintura/marcas-de-tinta/cadastrar" },
          { id: "marcas-tinta-editar", title: "Editar", icon: "edit", path: "/pintura/marcas-de-tinta/editar/:id", isDynamic: true },
          { id: "marcas-tinta-listar", title: "Listar", icon: "list", path: "/pintura/marcas-de-tinta/listar" },
        ],
      },

      {
        id: "producoes-pintura",
        title: "Produções",
        icon: "building",
        path: "/pintura/producoes",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "producoes-detalhes", title: "Detalhes", icon: "eye", path: "/pintura/producoes/detalhes/:id", isDynamic: true },
          { id: "producoes-listar", title: "Listar", icon: "list", path: "/pintura/producoes/listar" },
        ],
      },

      {
        id: "tipos-de-tinta",
        title: "Tipos de Tinta",
        icon: "tags",
        path: "/pintura/tipos-de-tinta",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "tipos-tinta-cadastrar", title: "Cadastrar", icon: "plus", path: "/pintura/tipos-de-tinta/cadastrar" },
          { id: "tipos-tinta-editar", title: "Editar", icon: "edit", path: "/pintura/tipos-de-tinta/editar/:id", isDynamic: true },
          { id: "tipos-tinta-listar", title: "Listar", icon: "list", path: "/pintura/tipos-de-tinta/listar" },
        ],
      },
    ],
  },

  // RECURSOS HUMANOS
  {
    id: "recursos-humanos",
    title: "Recursos Humanos",
    icon: "users",
    path: "/recursos-humanos",
    requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES],
    children: [
      {
        id: "epi-rh",
        title: "EPI",
        icon: "safety",
        path: "/recursos-humanos/epi",
        children: [
          {
            id: "epi-rh-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/recursos-humanos/epi/agendamentos",
            children: [
              {
                id: "epi-rh-agendamentos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/recursos-humanos/epi/agendamentos/cadastrar",
              },
              { id: "epi-rh-agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/epi/agendamentos/detalhes/:id", isDynamic: true },
              {
                id: "epi-rh-agendamentos-editar",
                title: "Editar",
                icon: "edit",
                path: "/recursos-humanos/epi/agendamentos/editar/:id",
                isDynamic: true,
              },
              { id: "epi-rh-agendamentos-listar", title: "Listar", icon: "list", path: "/recursos-humanos/epi/agendamentos/listar" },
            ],
          },
          { id: "epi-rh-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/epi/cadastrar" },
          { id: "epi-rh-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/epi/detalhes/:id", isDynamic: true },
          { id: "epi-rh-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/epi/editar/:id", isDynamic: true },
          { id: "epi-rh-listar", title: "Listar", icon: "list", path: "/recursos-humanos/epi/listar" },

          {
            id: "epi-rh-entregas",
            title: "Entregas",
            icon: "truck",
            path: "/recursos-humanos/epi/entregas",
            children: [
              {
                id: "epi-rh-entregas-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/recursos-humanos/epi/entregas/cadastrar",
              },
              { id: "epi-rh-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/epi/entregas/detalhes/:id", isDynamic: true },
              { id: "epi-rh-entregas-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/epi/entregas/editar/:id", isDynamic: true },
              { id: "epi-rh-entregas-listar", title: "Listar", icon: "list", path: "/recursos-humanos/epi/entregas/listar" },
            ],
          },

          {
            id: "epi-rh-tamanhos",
            title: "Tamanhos",
            icon: "sizes",
            path: "/recursos-humanos/epi/tamanhos",
            children: [
              {
                id: "epi-rh-tamanhos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/recursos-humanos/epi/tamanhos/cadastrar",
              },
              { id: "epi-rh-tamanhos-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/epi/tamanhos/editar/:id", isDynamic: true },
              { id: "epi-rh-tamanhos-listar", title: "Listar", icon: "list", path: "/recursos-humanos/epi/tamanhos/listar" },
            ],
          },
        ],
      },
    ],
  },

  // ESTOQUE
  {
    id: "estoque",
    title: "Estoque",
    icon: "box",
    path: "/estoque",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "epi-estoque",
        title: "EPI",
        icon: "shield",
        path: "/estoque/epi",
        children: [
          { id: "epi-estoque-listar", title: "Listar", icon: "list", path: "/estoque/epi/listar" },
          { id: "epi-estoque-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/epi/cadastrar" },
          { id: "epi-estoque-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/epi/detalhes/:id", isDynamic: true },
          { id: "epi-estoque-editar", title: "Editar", icon: "edit", path: "/estoque/epi/editar/:id", isDynamic: true },
          {
            id: "epi-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/estoque/epi/agendamentos",
            children: [
              {
                id: "agendamentos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/estoque/epi/agendamentos/cadastrar",
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/epi/agendamentos/detalhes/:id", isDynamic: true },
              {
                id: "agendamentos-editar",
                title: "Editar",
                icon: "edit",
                path: "/estoque/epi/agendamentos/editar/:id",
                isDynamic: true,
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "agendamentos-listar", title: "Listar", icon: "list", path: "/estoque/epi/agendamentos/listar" },
            ],
          },
          {
            id: "epi-entregas",
            title: "Entregas",
            icon: "truck",
            path: "/estoque/epi/entregas",
            children: [
              {
                id: "epi-entregas-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/estoque/epi/entregas/cadastrar",
              },
              { id: "epi-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/epi/entregas/detalhes/:id", isDynamic: true },
              {
                id: "epi-entregas-editar",
                title: "Editar",
                icon: "edit",
                path: "/estoque/epi/entregas/editar/:id",
                isDynamic: true,
              },
              { id: "epi-entregas-listar", title: "Listar", icon: "list", path: "/estoque/epi/entregas/listar" },
            ],
          },
        ],
      },
    ],
  },

  // PRODUÇÃO
  {
    id: "producao",
    title: "Produção",
    icon: "factory",
    path: "/producao",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "historico",
        title: "Histórico",
        icon: "history",
        path: "/producao/historico",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      },
    ],
  },
];

// Convert navigation path to file path
function navPathToFilePath(navPath) {
  if (navPath === '/') {
    return 'src/app/(tabs)/home.tsx';
  }

  // Remove leading slash
  const cleanPath = navPath.replace(/^\//, '');

  // Replace :id with [id]
  const filePathSegments = cleanPath.split('/').map(segment => {
    if (segment === ':id' || segment === ':paintId' || segment === ':formulaId' || segment === ':orderId') {
      return '[id]';
    }
    if (segment.startsWith(':')) {
      // Handle other dynamic segments
      return `[${segment.slice(1)}]`;
    }
    return segment;
  });

  return `src/app/(tabs)/${filePathSegments.join('/')}.tsx`;
}

// Recursively extract all navigation paths
function extractAllPaths(menuItems, results = []) {
  for (const item of menuItems) {
    if (item.path) {
      results.push({
        id: item.id,
        title: item.title,
        path: item.path,
        expectedFile: navPathToFilePath(item.path),
        isDynamic: item.isDynamic || false,
      });
    }
    if (item.children) {
      extractAllPaths(item.children, results);
    }
  }
  return results;
}

// Check if file exists
function fileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

// Main analysis function
function analyzeNavigation() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE NAVIGATION ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  const allPaths = extractAllPaths(NAVIGATION_MENU);

  console.log(`Total navigation items: ${allPaths.length}`);
  console.log('');

  const missingFiles = [];
  const existingFiles = [];
  const duplicateNavigationItems = new Map();

  // Check for duplicate navigation paths
  const pathCounts = {};
  for (const item of allPaths) {
    if (!pathCounts[item.path]) {
      pathCounts[item.path] = [];
    }
    pathCounts[item.path].push(item);
  }

  // Find duplicates
  for (const [path, items] of Object.entries(pathCounts)) {
    if (items.length > 1) {
      duplicateNavigationItems.set(path, items);
    }
  }

  // Check each path
  for (const item of allPaths) {
    const exists = fileExists(item.expectedFile);

    if (exists) {
      existingFiles.push(item);
    } else {
      missingFiles.push(item);
    }
  }

  // Print results
  console.log('ANALYSIS RESULTS:');
  console.log('-'.repeat(80));
  console.log(`✓ Files that exist: ${existingFiles.length}`);
  console.log(`✗ Files that are MISSING: ${missingFiles.length}`);
  console.log('');

  if (duplicateNavigationItems.size > 0) {
    console.log('DUPLICATE NAVIGATION PATHS:');
    console.log('-'.repeat(80));
    for (const [path, items] of duplicateNavigationItems.entries()) {
      console.log(`\nPath: ${path}`);
      console.log('  Used by:');
      items.forEach(item => {
        console.log(`    - ${item.id}: ${item.title}`);
      });
    }
    console.log('');
  }

  if (missingFiles.length > 0) {
    console.log('MISSING FILES DETAILS:');
    console.log('-'.repeat(80));
    console.log('');

    // Group by section
    const bySection = {};
    for (const item of missingFiles) {
      const section = item.path.split('/')[1] || 'root';
      if (!bySection[section]) {
        bySection[section] = [];
      }
      bySection[section].push(item);
    }

    for (const [section, items] of Object.entries(bySection)) {
      console.log(`\n[${section.toUpperCase()}] - ${items.length} missing files`);
      console.log('-'.repeat(80));
      for (const item of items) {
        console.log(`  ✗ ${item.title} (${item.id})`);
        console.log(`    Navigation path: ${item.path}`);
        console.log(`    Expected file:   ${item.expectedFile}`);
        console.log(`    Dynamic: ${item.isDynamic}`);
        console.log('');
      }
    }
  }

  // Check for usuarios vs colaboradores issue
  console.log('\nUSUARIOS vs COLABORADORES ANALYSIS:');
  console.log('-'.repeat(80));
  const usuariosItems = allPaths.filter(item => item.path.includes('usuarios'));
  const colaboradoresItems = allPaths.filter(item => item.path.includes('colaboradores'));

  console.log(`Found ${usuariosItems.length} navigation items with 'usuarios' in path:`);
  usuariosItems.forEach(item => {
    console.log(`  - ${item.path} (${item.title})`);
  });

  console.log(`\nFound ${colaboradoresItems.length} navigation items with 'colaboradores' in path:`);
  colaboradoresItems.forEach(item => {
    console.log(`  - ${item.path} (${item.title}) - File exists: ${fileExists(item.expectedFile) ? '✓' : '✗'}`);
  });

  console.log('\n');
  console.log('='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

// Run the analysis
analyzeNavigation();
