// Complete route structure for Ankaa Brazilian manufacturing management system
// Updated to match navigation menu structure exactly
export const routes = {
  // Administration - Administração - Administration
  administration: {
    customers: {
      create: "/administracao/clientes/cadastrar",
      details: (id: string) => `/administracao/clientes/detalhes/${id}`,
      edit: (id: string) => `/administracao/clientes/editar/${id}`,
      list: "/administracao/clientes/listar",
      root: "/administracao/clientes",
    },
    collaborators: {
      create: "/departamento-pessoal/colaboradores/cadastrar",
      details: (id: string) => `/departamento-pessoal/colaboradores/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/colaboradores/editar/${id}`,
      list: "/departamento-pessoal/colaboradores/listar",
      root: "/departamento-pessoal/colaboradores",
    },
    files: {
      details: (id: string) => `/administracao/arquivos/detalhes/${id}`,
      list: "/administracao/arquivos/listar",
      orphans: "/administracao/arquivos/orfaos",
      root: "/administracao/arquivos",
      upload: "/administracao/arquivos/upload",
    },
    notifications: {
      create: "/administracao/notificacoes/cadastrar/enviar",
      details: (id: string) => `/administracao/notificacoes/detalhes/${id}`,
      edit: (id: string) => `/administracao/notificacoes/editar/${id}`,
      list: "/administracao/notificacoes/listar",
      root: "/administracao/notificacoes",
    },
    messages: {
      root: "/administracao/mensagens",
      list: "/administracao/mensagens/listar",
      create: "/administracao/mensagens/cadastrar",
      details: (id: string) => `/administracao/mensagens/detalhes/${id}`,
      edit: (id: string) => `/administracao/mensagens/editar/${id}`,
    },
    root: "/administracao",
    sectors: {
      create: "/administracao/setores/cadastrar",
      details: (id: string) => `/administracao/setores/detalhes/${id}`,
      edit: (id: string) => `/administracao/setores/editar/${id}`,
      list: "/administracao/setores/listar",
      root: "/administracao/setores",
    },
    users: {
      create: "/administracao/usuarios/cadastrar",
      details: (id: string) => `/administracao/usuarios/detalhes/${id}`,
      edit: (id: string) => `/administracao/usuarios/editar/${id}`,
      list: "/administracao/usuarios/listar",
      root: "/administracao/usuarios",
    },
    changeLogs: {
      details: (id: string) => `/administracao/registros-de-alteracoes/detalhes/${id}`,
      list: "/administracao/registros-de-alteracoes/listar",
      root: "/administracao/registros-de-alteracoes",
    },
    responsibles: {
      root: "/administracao/responsaveis",
      list: "/administracao/responsaveis/listar",
      create: "/administracao/responsaveis/cadastrar",
      details: (id: string) => `/administracao/responsaveis/detalhes/${id}`,
      edit: (id: string) => `/administracao/responsaveis/editar/${id}`,
    },
    monitoring: {
      dashboard: "/administracao/monitoramento/dashboard",
      root: "/administracao/monitoramento",
      metrics: {
        list: "/administracao/monitoramento/metricas",
        root: "/administracao/monitoramento/metricas",
      },
      alerts: {
        list: "/administracao/monitoramento/alertas",
        root: "/administracao/monitoramento/alertas",
      },
      logs: {
        list: "/administracao/monitoramento/logs",
        root: "/administracao/monitoramento/logs",
      },
    },
  },

  // Authentication - Rotas de autenticação
  authentication: {
    login: "/autenticacao/entrar", // fazer login
    recoverPassword: "/autenticacao/recuperar-senha", // recuperar senha
    resetPassword: (token: string) => `/autenticacao/redefinir-senha/${token}`, // redefinir senha com token
    changePassword: "/autenticacao/alterar-senha", // troca de senha obrigatória (requirePasswordChange)
    verifyCode: "/autenticacao/verificar-codigo", // código de verificação (unificado)
    verifyPasswordReset: "/autenticacao/verificar-redefinicao-senha", // verificação de redefinição de senha
  },

  // Basic Catalog - Catálogo Básico - Basic catalog access for leaders (removed - now unified with painting.catalog)
  // catalog: {
  //   details: (id: string) => `/pintura/catalogo/detalhes/${id}`,
  //   list: "/catalogo/listar",
  //   root: "/pintura/catalogo-basico",
  // },

  // Dashboard - Painéis de Controle
  dashboard: {
    financial: "/painel/financeiro",
    personnelDepartment: "/painel/departamento-pessoal",
    index: "/painel",
    inventory: "/painel/estoque",
    production: "/painel/producao",
    warehouse: "/painel/almoxarifado",
    root: "/painel",
  },

  // Notifications - top-level tab (modal-style screen)
  notifications: {
    root: "/notifications",
    list: "/notifications",
    details: (id: string) => `/notifications/${id}`,
  },

  // Customers - Alias for administration customers for backward compatibility
  customers: {
    create: "/administracao/clientes/cadastrar",
    details: (id: string) => `/administracao/clientes/detalhes/${id}`,
    edit: (id: string) => `/administracao/clientes/editar/${id}`,
    list: "/administracao/clientes/listar",
    root: "/administracao/clientes",
  },

  // Favorites - Favoritos - User Favorites
  favorites: "/favoritos",

  // Home - Página inicial
  home: "/",

  // Profile - Perfil - User Profile
  profile: {
    root: "/perfil",
    edit: "/perfil/editar",
  },

  // Financial - Financeiro - Financial Management
  financial: {
    billing: {
      root: "/financeiro/faturamento",
      list: "/financeiro/faturamento/listar",
      details: (id: string) => `/financeiro/faturamento/detalhes/${id}`,
    },
    budget: {
      root: "/financeiro/orcamento",
      list: "/financeiro/orcamento/listar",
      create: "/financeiro/orcamento/cadastrar",
      details: (taskId: string) => `/financeiro/orcamento/detalhes/${taskId}`,
    },
    customers: {
      create: "/financeiro/clientes/cadastrar",
      details: (id: string) => `/financeiro/clientes/detalhes/${id}`,
      edit: (id: string) => `/financeiro/clientes/editar/${id}`,
      root: "/financeiro/clientes",
    },
    nfse: {
      root: "/financeiro/notas-fiscais",
      list: "/financeiro/notas-fiscais/listar",
      details: (id: string) => `/financeiro/notas-fiscais/detalhes/${id}`,
    },
    root: "/financeiro",
  },

  // Personnel Department - Departamento Pessoal - Personnel Department
  personnelDepartment: {
    bonus: {
      root: "/departamento-pessoal/bonus",
      list: "/departamento-pessoal/bonus",
      details: (id: string) => `/departamento-pessoal/bonus/detalhes/${id}`,
      simulation: "/departamento-pessoal/bonus/simulacao",
      performanceLevels: {
        list: "/departamento-pessoal/bonus/nivel-de-performance",
        root: "/departamento-pessoal/bonus/nivel-de-performance",
      },
    },
    // Legacy route for backward compatibility
    bonusSimulation: "/departamento-pessoal/bonus/simulacao",
    calculations: {
      root: "/departamento-pessoal/calculos",
    },
    employees: {
      create: "/departamento-pessoal/colaboradores/cadastrar",
      details: (id: string) => `/departamento-pessoal/colaboradores/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/colaboradores/editar/${id}`,
      list: "/departamento-pessoal/colaboradores/listar",
      root: "/departamento-pessoal/colaboradores",
    },
    holidays: {
      calendar: "/departamento-pessoal/feriados/calendario",
      create: "/departamento-pessoal/feriados/cadastrar",
      details: (id: string) => `/departamento-pessoal/feriados/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/feriados/editar/${id}`,
      list: "/departamento-pessoal/feriados",
      root: "/departamento-pessoal/feriados",
    },
    positions: {
      create: "/departamento-pessoal/cargos/cadastrar",
      details: (id: string) => `/departamento-pessoal/cargos/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/cargos/editar/${id}`,
      hierarchy: "/departamento-pessoal/cargos/hierarquia",
      list: "/departamento-pessoal/cargos/listar",
      remunerations: (positionId: string) => `/departamento-pessoal/cargos/${positionId}/remuneracoes`,
      root: "/departamento-pessoal/cargos",
    },
    performanceLevels: {
      list: "/departamento-pessoal/niveis-desempenho",
      root: "/departamento-pessoal/niveis-desempenho",
    },
    sectors: {
      list: "/departamento-pessoal/setores/listar",
      root: "/departamento-pessoal/setores",
    },
    ppe: {
      deliveries: {
        create: "/departamento-pessoal/epi/entregas/cadastrar",
        details: (id: string) => `/departamento-pessoal/epi/entregas/detalhes/${id}`,
        edit: (id: string) => `/departamento-pessoal/epi/entregas/editar/${id}`,
        root: "/departamento-pessoal/epi/entregas",
      },
    },
    root: "/departamento-pessoal",
    timeClock: {
      root: "/departamento-pessoal/controle-ponto",
    },
    warnings: {
      create: "/departamento-pessoal/advertencias/cadastrar",
      details: (id: string) => `/departamento-pessoal/advertencias/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/advertencias/editar/${id}`,
      root: "/departamento-pessoal/advertencias",
    },
    vacations: {
      details: (id: string) => `/departamento-pessoal/ferias/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/ferias/editar/${id}`,
      list: "/departamento-pessoal/ferias/listar",
      root: "/departamento-pessoal/ferias",
    },
    // Medicina do Trabalho (Área Andressa, Part E). Mirrors web occupational-health.
    occupationalHealth: {
      root: "/departamento-pessoal/medicina",
      // ASO / Exames ocupacionais
      medicalExams: {
        create: "/departamento-pessoal/medicina/aso/cadastrar",
        details: (id: string) => `/departamento-pessoal/medicina/aso/detalhes/${id}`,
        edit: (id: string) => `/departamento-pessoal/medicina/aso/editar/${id}`,
        list: "/departamento-pessoal/medicina/aso/listar",
        root: "/departamento-pessoal/medicina/aso",
      },
      // Exames periódicos / a vencer
      periodicExams: {
        list: "/departamento-pessoal/medicina/exames-periodicos/listar",
        root: "/departamento-pessoal/medicina/exames-periodicos",
      },
      // Afastamentos
      leaves: {
        create: "/departamento-pessoal/medicina/afastamentos/cadastrar",
        details: (id: string) => `/departamento-pessoal/medicina/afastamentos/detalhes/${id}`,
        edit: (id: string) => `/departamento-pessoal/medicina/afastamentos/editar/${id}`,
        list: "/departamento-pessoal/medicina/afastamentos/listar",
        root: "/departamento-pessoal/medicina/afastamentos",
      },
      // CAT — Comunicação de Acidente de Trabalho
      workAccidents: {
        create: "/departamento-pessoal/medicina/cat/cadastrar",
        details: (id: string) => `/departamento-pessoal/medicina/cat/detalhes/${id}`,
        edit: (id: string) => `/departamento-pessoal/medicina/cat/editar/${id}`,
        list: "/departamento-pessoal/medicina/cat/listar",
        root: "/departamento-pessoal/medicina/cat",
      },
    },
    payroll: {
      root: "/departamento-pessoal/folha-de-pagamento",
      list: "/departamento-pessoal/folha-de-pagamento",
      detail: (payrollId: string) => `/departamento-pessoal/folha-de-pagamento/detalhe/${payrollId}`,
      create: "/departamento-pessoal/folha-de-pagamento/criar",
      edit: (payrollId: string) => `/departamento-pessoal/folha-de-pagamento/editar/${payrollId}`,
    },
    bonifications: {
      root: "/departamento-pessoal/bonificacoes",
      list: "/departamento-pessoal/bonificacoes",
      create: "/departamento-pessoal/bonificacoes/cadastrar",
      details: (id: string) => `/departamento-pessoal/bonificacoes/detalhes/${id}`,
      edit: (id: string) => `/departamento-pessoal/bonificacoes/editar/${id}`,
      simulation: "/departamento-pessoal/simulacao-bonus",
      discounts: {
        root: "/departamento-pessoal/bonificacoes-desconto",
        create: "/departamento-pessoal/bonificacoes-desconto/cadastrar",
        details: (id: string) => `/departamento-pessoal/bonificacoes-desconto/detalhes/${id}`,
        edit: (id: string) => `/departamento-pessoal/bonificacoes-desconto/editar/${id}`,
      },
    },
    timeEntries: {
      root: "/departamento-pessoal/controle-ponto",
      details: (id: string) => `/departamento-pessoal/controle-ponto/detalhes/${id}`,
      list: "/departamento-pessoal/controle-ponto",
    },
    timeCalculations: {
      root: "/departamento-pessoal/calculos",
      list: "/departamento-pessoal/calculos",
    },
    timeRequests: {
      root: "/departamento-pessoal/requisicoes",
      list: "/departamento-pessoal/requisicoes/listar",
    },
    syncStatus: "/departamento-pessoal/status-sincronizacao-ponto",
  },

  // Inventory - Estoque - Inventory Management
  inventory: {
    externalOperations: {
      create: "/estoque/operacoes-externas/cadastrar",
      details: (id: string) => `/estoque/operacoes-externas/detalhes/${id}`,
      edit: (id: string) => `/estoque/operacoes-externas/editar/${id}`,
      list: "/estoque/operacoes-externas",
      root: "/estoque/operacoes-externas",
    },
    borrows: {
      create: "/estoque/emprestimos/cadastrar",
      details: (id: string) => `/estoque/emprestimos/detalhes/${id}`,
      edit: (id: string) => `/estoque/emprestimos/editar/${id}`,
      import: "/estoque/emprestimos/importar",
      list: "/estoque/emprestimos",
      root: "/estoque/emprestimos",
    },
    maintenance: {
      create: "/estoque/manutencao/cadastrar",
      details: (id: string) => `/estoque/manutencao/detalhes/${id}`,
      edit: (id: string) => `/estoque/manutencao/editar/${id}`,
      list: "/estoque/manutencao/listar",
      root: "/estoque/manutencao",
    },
    activities: {
      create: "/estoque/movimentacoes/cadastrar",
      details: (id: string) => `/estoque/movimentacoes/detalhes/${id}`,
      edit: (id: string) => `/estoque/movimentacoes/editar/${id}`,
      list: "/estoque/movimentacoes",
      root: "/estoque/movimentacoes",
    },
    orders: {
      automatic: {
        configure: "/estoque/pedidos/automaticos/configurar",
        create: "/estoque/pedidos/automaticos/cadastrar",
        details: (id: string) => `/estoque/pedidos/automaticos/detalhes/${id}`,
        edit: (id: string) => `/estoque/pedidos/automaticos/editar/${id}`,
        list: "/estoque/pedidos/automaticos/listar",
        root: "/estoque/pedidos/automaticos",
      },
      items: {
        add: (orderId: string) => `/estoque/pedidos/${orderId}/itens/adicionar`,
        details: (orderId: string, itemId: string) => `/estoque/pedidos/${orderId}/itens/detalhes/${itemId}`,
        edit: (orderId: string, itemId: string) => `/estoque/pedidos/${orderId}/itens/editar/${itemId}`,
        list: (orderId: string) => `/estoque/pedidos/${orderId}/itens`,
      },
      create: "/estoque/pedidos/cadastrar",
      details: (id: string) => `/estoque/pedidos/detalhes/${id}`,
      edit: (id: string) => `/estoque/pedidos/editar/${id}`,
      list: "/estoque/pedidos",
      root: "/estoque/pedidos",
    },
    ppe: {
      create: "/estoque/epi/cadastrar",
      list: "/estoque/epi/listar",
      deliveries: {
        create: "/estoque/epi/entregas/cadastrar",
        details: (id: string) => `/estoque/epi/entregas/detalhes/${id}`,
        edit: (id: string) => `/estoque/epi/entregas/editar/${id}`,
        list: "/estoque/epi/entregas/listar",
        root: "/estoque/epi/entregas",
      },
      details: (id: string) => `/estoque/epi/detalhes/${id}`,
      edit: (id: string) => `/estoque/epi/editar/${id}`,
      root: "/estoque/epi",
    },
    products: {
      stockBalance: "/estoque/balanco",
      brands: {
        create: "/estoque/produtos/marcas/cadastrar",
        details: (id: string) => `/estoque/produtos/marcas/detalhes/${id}`,
        edit: (id: string) => `/estoque/produtos/marcas/editar/${id}`,
        list: "/estoque/produtos/marcas",
        root: "/estoque/produtos/marcas",
      },
      categories: {
        create: "/estoque/produtos/categorias/cadastrar",
        details: (id: string) => `/estoque/produtos/categorias/detalhes/${id}`,
        edit: (id: string) => `/estoque/produtos/categorias/editar/${id}`,
        list: "/estoque/produtos/categorias",
        root: "/estoque/produtos/categorias",
      },
      create: "/estoque/produtos/cadastrar",
      details: (id: string) => `/estoque/produtos/detalhes/${id}`,
      edit: (id: string) => `/estoque/produtos/editar/${id}`,
      list: "/estoque/produtos",
      root: "/estoque/produtos",
    },
    root: "/estoque",
    suppliers: {
      create: "/estoque/fornecedores/cadastrar",
      details: (id: string) => `/estoque/fornecedores/detalhes/${id}`,
      edit: (id: string) => `/estoque/fornecedores/editar/${id}`,
      root: "/estoque/fornecedores",
    },
    warehouseLocations: {
      create: "/estoque/localizacoes/cadastrar",
      details: (id: string) => `/estoque/localizacoes/detalhes/${id}`,
      edit: (id: string) => `/estoque/localizacoes/editar/${id}`,
      root: "/estoque/localizacoes",
    },
  },

  maintenance: {
    create: "/manutencao/cadastrar",
    details: (id: string) => `/manutencao/detalhes/${id}`,
    edit: (id: string) => `/manutencao/editar/${id}`,
    root: "/manutencao",
  },

  // Meu Pessoal - Sector Employee Management for Leaders
  meuPessoal: {
    avisos: {
      details: (sectorId: string, id: string) => `/meu-pessoal/avisos/${sectorId}/detalhes/${id}`,
      root: (sectorId: string) => `/meu-pessoal/avisos/${sectorId}`,
    },
    emprestimos: {
      details: (sectorId: string, id: string) => `/meu-pessoal/emprestimos/${sectorId}/detalhes/${id}`,
      root: (sectorId: string) => `/meu-pessoal/emprestimos/${sectorId}`,
    },
    root: "/meu-pessoal",
  },

  // My Team - Meu Pessoal - Team management for leaders (simplified routes)
  myTeam: {
    borrows: "/meu-pessoal/emprestimos",
    root: "/meu-pessoal",
    warnings: "/meu-pessoal/avisos",
  },

  // Painting - Pintura - Paint Management
  painting: {
    catalog: {
      create: "/pintura/catalogo/cadastrar",
      details: (id: string) => `/pintura/catalogo/detalhes/${id}`,
      edit: (id: string) => `/pintura/catalogo/editar/${id}`,
      formulaDetails: (paintId: string, formulaId: string) => `/pintura/catalogo/detalhes/${paintId}/formulas/detalhes/${formulaId}`,
      formulas: (paintId: string) => `/pintura/catalogo/detalhes/${paintId}/formulas`,
      list: "/pintura/catalogo/listar",
      root: "/pintura/catalogo",
    },
    components: {
      create: "/pintura/componentes/cadastrar",
      details: (id: string) => `/pintura/componentes/detalhes/${id}`,
      edit: (id: string) => `/pintura/componentes/editar/${id}`,
      list: "/pintura/componentes/listar",
      root: "/pintura/componentes",
    },
    formulas: {
      create: "/pintura/formulas/cadastrar",
      details: (id: string) => `/pintura/formulas/detalhes/${id}`,
      edit: (id: string) => `/pintura/formulas/editar/${id}`,
      list: "/pintura/formulas/listar",
      root: "/pintura/formulas",
    },
    formulations: {
      create: "/pintura/formulacoes/cadastrar",
      details: (id: string) => `/pintura/formulacoes/detalhes/${id}`,
      edit: (id: string) => `/pintura/formulacoes/editar/${id}`,
      list: "/pintura/formulacoes/listar",
      root: "/pintura/formulacoes",
    },
    paintTypes: {
      create: "/pintura/tipos-de-tinta/cadastrar",
      details: (id: string) => `/pintura/tipos-de-tinta/detalhes/${id}`,
      edit: (id: string) => `/pintura/tipos-de-tinta/editar/${id}`,
      list: "/pintura/tipos-de-tinta/listar",
      root: "/pintura/tipos-de-tinta",
    },
    // Alias for paintTypes (canonical convention: <domain>.<entity>)
    types: {
      create: "/pintura/tipos-de-tinta/cadastrar",
      details: (id: string) => `/pintura/tipos-de-tinta/detalhes/${id}`,
      edit: (id: string) => `/pintura/tipos-de-tinta/editar/${id}`,
      list: "/pintura/tipos-de-tinta/listar",
      root: "/pintura/tipos-de-tinta",
    },
    paintBrands: {
      create: "/pintura/marcas-de-tinta/cadastrar",
      details: (id: string) => `/pintura/marcas-de-tinta/detalhes/${id}`,
      edit: (id: string) => `/pintura/marcas-de-tinta/editar/${id}`,
      list: "/pintura/marcas-de-tinta/listar",
      root: "/pintura/marcas-de-tinta",
    },
    // Alias for paintBrands (canonical convention: <domain>.<entity>)
    brands: {
      create: "/pintura/marcas-de-tinta/cadastrar",
      details: (id: string) => `/pintura/marcas-de-tinta/detalhes/${id}`,
      edit: (id: string) => `/pintura/marcas-de-tinta/editar/${id}`,
      list: "/pintura/marcas-de-tinta/listar",
      root: "/pintura/marcas-de-tinta",
    },
    // Basic Catalog - leaders / unprivileged read-only catalog access
    basicCatalog: {
      list: "/pintura/catalogo-basico/listar",
      details: (id: string) => `/pintura/catalogo-basico/detalhes/${id}`,
      root: "/pintura/catalogo-basico",
    },
    productions: {
      create: "/pintura/producoes/cadastrar",
      details: (id: string) => `/pintura/producoes/detalhes/${id}`,
      edit: (id: string) => `/pintura/producoes/editar/${id}`,
      root: "/pintura/producoes",
    },
    root: "/pintura",
  },

  // Server - Servidor - Server Management
  server: {
    root: "/servidor",
    backup: "/servidor/backups/listar",
    backupCreate: "/servidor/backups/cadastrar",
    backupSchedule: "/servidor/backups/agendamentos",
    backupDetails: (id: string) => `/servidor/backups/detalhes/${id}`,
    backups: {
      root: "/servidor/backups",
      list: "/servidor/backups/listar",
      create: "/servidor/backups/cadastrar",
      details: (id: string) => `/servidor/backups/detalhes/${id}`,
      schedule: "/servidor/backups/agendamentos",
    },
    metrics: "/servidor/metricas",
    services: "/servidor/services",
    fileManager: "/servidor/file-manager",
  },

  // Personal - Pessoal - Personal (User-specific data)
  // NOTE: existing screens under (tabs)/pessoal/* are flat index.tsx files
  // (no `/listar` sub-route). Routes here intentionally point to the index.
  personal: {
    root: "/pessoal",
    myHolidays: {
      root: "/pessoal/meus-feriados",
      list: "/pessoal/meus-feriados",
      details: (id: string) => `/pessoal/meus-feriados/detalhes/${id}`,
    },
    myWarnings: {
      root: "/pessoal/minhas-advertencias",
      list: "/pessoal/minhas-advertencias",
      details: (id: string) => `/pessoal/minhas-advertencias/detalhes/${id}`,
    },
    myPoints: {
      root: "/pessoal/meus-pontos",
      list: "/pessoal/meus-pontos",
      justifyAbsence: "/pessoal/meus-pontos/justificar-ausencia",
      adjustEntry: "/pessoal/meus-pontos/ajustar-ponto",
      includeEntry: "/pessoal/meus-pontos/incluir-ponto",
    },
    myMessages: {
      root: "/pessoal/minhas-mensagens",
      list: "/pessoal/minhas-mensagens",
      details: (id: string) => `/pessoal/minhas-mensagens/detalhes/${id}`,
    },
    preferences: {
      root: "/pessoal/preferencias",
      notifications: "/pessoal/preferencias/notificacoes",
      privacy: "/pessoal/preferencias/privacidade",
      theme: "/pessoal/preferencias/tema",
    },
    myPpes: {
      details: (id: string) => `/pessoal/meus-epis/detalhes/${id}`,
      request: "/pessoal/meus-epis/solicitar",
      root: "/pessoal/meus-epis",
      list: "/pessoal/meus-epis",
    },
    myBorrows: {
      details: (id: string) => `/pessoal/meus-emprestimos/detalhes/${id}`,
      root: "/pessoal/meus-emprestimos",
      list: "/pessoal/meus-emprestimos",
    },
    myMovements: {
      details: (id: string) => `/pessoal/minhas-movimentacoes/detalhes/${id}`,
      root: "/pessoal/minhas-movimentacoes",
      list: "/pessoal/minhas-movimentacoes",
    },
    myBonuses: {
      root: "/pessoal/meu-bonus",
      current: "/pessoal/meu-bonus",
      details: (id: string) => `/pessoal/meu-bonus/detalhes/${id}`,
      history: "/pessoal/meu-bonus/historico",
      simulation: "/pessoal/meu-bonus/simulacao",
    },
    // Legacy routes for backward compatibility
    myBonusesLegacy: {
      details: (id: string) => `/pessoal/meus-bonus/detalhes/${id}`,
      root: "/pessoal/meus-bonus",
      simulation: "/pessoal/simulacao-bonus",
    },
  },

  // Production - Produção - Production Management
  production: {
    airbrushings: {
      create: "/producao/aerografia/cadastrar",
      details: (id: string) => `/producao/aerografia/detalhes/${id}`,
      edit: (id: string) => `/producao/aerografia/editar/${id}`,
      list: "/producao/aerografia/listar",
      root: "/producao/aerografia",
    },
    cutting: {
      create: "/producao/recorte/cadastrar",
      details: (id: string) => `/producao/recorte/detalhes/${id}`,
      list: "/producao/recorte",
      root: "/producao/recorte",
    },
    history: {
      root: "/producao/historico",
      details: (id: string) => `/producao/historico/detalhes/${id}`,
    },
    observations: {
      create: "/producao/observacoes/cadastrar",
      details: (id: string) => `/producao/observacoes/detalhes/${id}`,
      edit: (id: string) => `/producao/observacoes/editar/${id}`,
      list: "/producao/observacoes",
      root: "/producao/observacoes",
    },
    root: "/producao",
    // Note: 'schedule' property name is kept for backward compatibility but routes point to 'cronograma'
    schedule: {
      details: (id: string) => `/producao/cronograma/detalhes/${id}`,
      edit: (id: string) => `/producao/cronograma/editar/${id}`,
      list: "/producao/cronograma",
      /**
       * Cronograma multi-context list helper.
       * Encodes the calling context as a `from` query param so the destination
       * screen can render appropriate breadcrumbs / back behavior without
       * pathname-sniffing.
       *
       * Usage: `nav.push(mobileRoute(routes.production.schedule.listFrom({ from: 'agenda' })))`
       */
      listFrom: ({ from }: { from: "agenda" | "historico" | "tarefa" }) =>
        `/producao/cronograma?from=${from}`,
      root: "/producao/cronograma",
    },
    agenda: {
      root: "/producao/agenda",
      create: "/producao/agenda/cadastrar",
      details: (id: string) => `/producao/agenda/detalhes/${id}`,
      // Note: path uses 'precificacao' to match Expo Router filesystem directory; property renamed to 'quote'
      quote: (id: string) => `/producao/agenda/precificacao/${id}`,
    },
    serviceOrders: {
      create: "/producao/ordens-de-servico/cadastrar",
      details: (id: string) => `/producao/ordens-de-servico/detalhes/${id}`,
      edit: (id: string) => `/producao/ordens-de-servico/editar/${id}`,
      root: "/producao/ordens-de-servico",
    },
    trucks: {
      create: "/producao/caminhoes/cadastrar",
      details: (id: string) => `/producao/caminhoes/detalhes/${id}`,
      edit: (id: string) => `/producao/caminhoes/editar/${id}`,
      list: "/producao/caminhoes",
      root: "/producao/caminhoes",
    },
  },

  // Users - Alias for administration users (collaborators) for backward compatibility
  users: {
    create: "/departamento-pessoal/colaboradores/cadastrar",
    details: (id: string) => `/departamento-pessoal/colaboradores/detalhes/${id}`,
    edit: (id: string) => `/departamento-pessoal/colaboradores/editar/${id}`,
    root: "/departamento-pessoal/colaboradores",
  },
} as const;

// Export types for type safety
export type Routes = typeof routes;
