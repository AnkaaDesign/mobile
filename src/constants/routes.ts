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
      create: "/administracao/colaboradores/cadastrar",
      details: (id: string) => `/administracao/colaboradores/detalhes/${id}`,
      edit: (id: string) => `/administracao/colaboradores/editar/${id}`,
      list: "/administracao/colaboradores/listar",
      root: "/administracao/colaboradores",
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
    register: "/autenticacao/registrar", // registrar-se
    resetPassword: (token: string) => `/autenticacao/redefinir-senha/${token}`, // redefinir senha com token
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
    humanResources: "/painel/recursos-humanos",
    index: "/painel",
    inventory: "/painel/estoque",
    production: "/painel/producao",
    warehouse: "/painel/almoxarifado",
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
    customers: {
      create: "/financeiro/clientes/cadastrar",
      details: (id: string) => `/financeiro/clientes/detalhes/${id}`,
      edit: (id: string) => `/financeiro/clientes/editar/${id}`,
      root: "/financeiro/clientes",
    },
    root: "/financeiro",
  },

  // Human Resources - Recursos Humanos - Human Resources
  humanResources: {
    bonus: {
      root: "/recursos-humanos/bonus",
      list: "/recursos-humanos/bonus",
      details: (id: string) => `/recursos-humanos/bonus/detalhes/${id}`,
      simulation: "/recursos-humanos/bonus/simulacao",
      performanceLevels: {
        list: "/recursos-humanos/bonus/nivel-de-performance",
        root: "/recursos-humanos/bonus/nivel-de-performance",
      },
    },
    // Legacy route for backward compatibility
    bonusSimulation: "/recursos-humanos/bonus/simulacao",
    calculations: {
      root: "/recursos-humanos/calculos",
    },
    employees: {
      create: "/recursos-humanos/colaboradores/cadastrar",
      details: (id: string) => `/recursos-humanos/colaboradores/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/colaboradores/editar/${id}`,
      list: "/recursos-humanos/colaboradores/listar",
      root: "/recursos-humanos/colaboradores",
    },
    holidays: {
      calendar: "/recursos-humanos/feriados/calendario",
      create: "/recursos-humanos/feriados/cadastrar",
      details: (id: string) => `/recursos-humanos/feriados/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/feriados/editar/${id}`,
      list: "/recursos-humanos/feriados",
      root: "/recursos-humanos/feriados",
    },
    positions: {
      create: "/recursos-humanos/cargos/cadastrar",
      details: (id: string) => `/recursos-humanos/cargos/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/cargos/editar/${id}`,
      hierarchy: "/recursos-humanos/cargos/hierarquia",
      list: "/recursos-humanos/cargos/listar",
      remunerations: (positionId: string) => `/recursos-humanos/cargos/${positionId}/remuneracoes`,
      root: "/recursos-humanos/cargos",
    },
    performanceLevels: {
      list: "/recursos-humanos/niveis-desempenho",
      root: "/recursos-humanos/niveis-desempenho",
    },
    sectors: {
      list: "/recursos-humanos/setores/listar",
      root: "/recursos-humanos/setores",
    },
    ppe: {
      create: "/recursos-humanos/epi/cadastrar",
      deliveries: {
        create: "/recursos-humanos/epi/entregas/cadastrar",
        details: (id: string) => `/recursos-humanos/epi/entregas/detalhes/${id}`,
        edit: (id: string) => `/recursos-humanos/epi/entregas/editar/${id}`,
        root: "/recursos-humanos/epi/entregas",
      },
      details: (id: string) => `/recursos-humanos/epi/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/epi/editar/${id}`,
      reports: {
        masks: "/recursos-humanos/epi/relatorios/mascaras",
        root: "/recursos-humanos/epi/relatorios",
        stock: "/recursos-humanos/epi/relatorios/estoque",
        usage: "/recursos-humanos/epi/relatorios/uso",
      },
      root: "/recursos-humanos/epi",
      schedules: {
        create: "/recursos-humanos/epi/agendamentos/cadastrar",
        details: (id: string) => `/recursos-humanos/epi/agendamentos/detalhes/${id}`,
        edit: (id: string) => `/recursos-humanos/epi/agendamentos/editar/${id}`,
        root: "/recursos-humanos/epi/agendamentos",
      },
    },
    root: "/recursos-humanos",
    timeClock: {
      root: "/recursos-humanos/controle-ponto",
    },
    vacations: {
      calendar: "/recursos-humanos/ferias/calendario",
      create: "/recursos-humanos/ferias/cadastrar",
      details: (id: string) => `/recursos-humanos/ferias/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/ferias/editar/${id}`,
      root: "/recursos-humanos/ferias",
    },
    warnings: {
      create: "/recursos-humanos/advertencias/cadastrar",
      details: (id: string) => `/recursos-humanos/advertencias/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/advertencias/editar/${id}`,
      root: "/recursos-humanos/advertencias",
    },
    payroll: {
      root: "/recursos-humanos/folha-de-pagamento",
      list: "/recursos-humanos/folha-de-pagamento",
      detail: (payrollId: string) => `/recursos-humanos/folha-de-pagamento/detalhe/${payrollId}`,
      create: "/recursos-humanos/folha-de-pagamento/criar",
      edit: (payrollId: string) => `/recursos-humanos/folha-de-pagamento/editar/${payrollId}`,
    },
    bonus: {
      root: "/recursos-humanos/bonificacoes",
      list: "/recursos-humanos/bonificacoes",
      create: "/recursos-humanos/bonificacoes/cadastrar",
      details: (id: string) => `/recursos-humanos/bonificacoes/detalhes/${id}`,
      edit: (id: string) => `/recursos-humanos/bonificacoes/editar/${id}`,
      simulation: "/recursos-humanos/simulacao-bonus",
      discounts: {
        root: "/recursos-humanos/bonificacoes-desconto",
        create: "/recursos-humanos/bonificacoes-desconto/cadastrar",
        details: (id: string) => `/recursos-humanos/bonificacoes-desconto/detalhes/${id}`,
        edit: (id: string) => `/recursos-humanos/bonificacoes-desconto/editar/${id}`,
      },
    },
    timeEntries: {
      root: "/recursos-humanos/controle-ponto",
      details: (id: string) => `/recursos-humanos/controle-ponto/detalhes/${id}`,
      list: "/recursos-humanos/controle-ponto",
    },
    timeCalculations: {
      root: "/recursos-humanos/calculos",
      list: "/recursos-humanos/calculos",
    },
    timeRequests: {
      root: "/recursos-humanos/requisicoes-ponto",
      list: "/recursos-humanos/requisicoes-ponto/listar",
    },
    syncStatus: "/recursos-humanos/status-sincronizacao-ponto",
  },

  // Inventory - Estoque - Inventory Management
  inventory: {
    externalWithdrawals: {
      create: "/estoque/retiradas-externas/cadastrar",
      details: (id: string) => `/estoque/retiradas-externas/detalhes/${id}`,
      edit: (id: string) => `/estoque/retiradas-externas/editar/${id}`,
      list: "/estoque/retiradas-externas",
      root: "/estoque/retiradas-externas",
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
      schedules: {
        create: "/estoque/manutencao/agendamentos/cadastrar",
        details: (id: string) => `/estoque/manutencao/agendamentos/detalhes/${id}`,
        edit: (id: string) => `/estoque/manutencao/agendamentos/editar/${id}`,
        root: "/estoque/manutencao/agendamentos",
      },
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
      schedules: {
        create: "/estoque/pedidos/agendamentos/cadastrar",
        details: (id: string) => `/estoque/pedidos/agendamentos/detalhes/${id}`,
        edit: (id: string) => `/estoque/pedidos/agendamentos/editar/${id}`,
        root: "/estoque/pedidos/agendamentos",
      },
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
      schedules: {
        create: "/estoque/epi/agendamentos/cadastrar",
        details: (id: string) => `/estoque/epi/agendamentos/detalhes/${id}`,
        edit: (id: string) => `/estoque/epi/agendamentos/editar/${id}`,
        list: "/estoque/epi/agendamentos/listar",
        root: "/estoque/epi/agendamentos",
      },
    },
    products: {
      stockBalance: "/estoque/produtos/balanco-estoque",
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
    ferias: {
      details: (sectorId: string, id: string) => `/meu-pessoal/ferias/${sectorId}/detalhes/${id}`,
      root: (sectorId: string) => `/meu-pessoal/ferias/${sectorId}`,
    },
    root: "/meu-pessoal",
  },

  // My Team - Meu Pessoal - Team management for leaders (simplified routes)
  myTeam: {
    borrows: "/meu-pessoal/emprestimos",
    root: "/meu-pessoal",
    vacations: "/meu-pessoal/ferias",
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
    paintBrands: {
      create: "/pintura/marcas-de-tinta/cadastrar",
      details: (id: string) => `/pintura/marcas-de-tinta/detalhes/${id}`,
      edit: (id: string) => `/pintura/marcas-de-tinta/editar/${id}`,
      list: "/pintura/marcas-de-tinta/listar",
      root: "/pintura/marcas-de-tinta",
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
    backup: "/servidor/backups/listar",
    changeLogs: {
      details: (id: string) => `/servidor/registros-de-alteracoes/detalhes/${id}`,
      root: "/servidor/registros-de-alteracoes",
    },
    databaseSync: "/servidor/sincronizacao-bd",
    deployments: {
      create: "/servidor/implantacoes/cadastrar",
      details: (id: string) => `/servidor/implantacoes/detalhes/${id}`,
      edit: (id: string) => `/servidor/implantacoes/editar/${id}`,
      root: "/servidor/implantacoes",
    },
    throttler: {
      root: "/servidor/rate-limiting",
    },
    logs: "/servidor/logs",
    metrics: "/servidor/metricas",
    root: "/servidor",
    services: "/servidor/servicos",
    sharedFolders: "/servidor/pastas-compartilhadas",
    users: {
      create: "/servidor/usuarios/cadastrar",
      root: "/servidor/usuarios",
    },
  },

  // Personal - Pessoal - Personal (User-specific data)
  personal: {
    myHolidays: {
      root: "/pessoal/feriados",
    },
    preferences: {
      root: "/pessoal/preferencias",
      notifications: "/pessoal/preferencias/notificacoes",
      privacy: "/pessoal/preferencias/privacidade",
      theme: "/pessoal/preferencias/tema",
    },
    myVacations: {
      details: (id: string) => `/pessoal/ferias/detalhes/${id}`,
      root: "/pessoal/ferias",
    },
    myPpes: {
      details: (id: string) => `/pessoal/meus-epis/detalhes/${id}`,
      request: "/pessoal/meus-epis/solicitar",
      root: "/pessoal/meus-epis",
    },
    myBorrows: {
      details: (id: string) => `/pessoal/meus-emprestimos/detalhes/${id}`,
      root: "/pessoal/meus-emprestimos",
    },
    myMovements: {
      details: (id: string) => `/pessoal/minhas-movimentacoes/detalhes/${id}`,
      root: "/pessoal/minhas-movimentacoes",
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
    root: "/pessoal",
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
      create: "/producao/cronograma/cadastrar",
      details: (id: string) => `/producao/cronograma/detalhes/${id}`,
      edit: (id: string) => `/producao/cronograma/editar/${id}`,
      list: "/producao/cronograma",
      root: "/producao/cronograma",
    },
    agenda: {
      root: "/producao/agenda",
      details: (id: string) => `/producao/cronograma/detalhes/${id}`,
    },
    serviceOrders: {
      create: "/producao/ordens-de-servico/cadastrar",
      details: (id: string) => `/producao/ordens-de-servico/detalhes/${id}`,
      edit: (id: string) => `/producao/ordens-de-servico/editar/${id}`,
      root: "/producao/ordens-de-servico",
    },
    services: {
      create: "/producao/servicos/cadastrar",
      details: (id: string) => `/producao/servicos/detalhes/${id}`,
      edit: (id: string) => `/producao/servicos/editar/${id}`,
      list: "/producao/servicos",
      root: "/producao/servicos",
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
    create: "/administracao/colaboradores/cadastrar",
    details: (id: string) => `/administracao/colaboradores/detalhes/${id}`,
    edit: (id: string) => `/administracao/colaboradores/editar/${id}`,
    root: "/administracao/colaboradores",
  },
} as const;

// Export types for type safety
export type Routes = typeof routes;
