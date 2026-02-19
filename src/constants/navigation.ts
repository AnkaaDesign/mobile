import { SECTOR_PRIVILEGES, TEAM_LEADER } from "./enums";

export type PrivilegeValue = SECTOR_PRIVILEGES | typeof TEAM_LEADER;

export type { MenuItem };
interface MenuItem {
  id: string;
  title: string;
  icon: string; // Icon name (generic, will be mapped to platform-specific icons)
  path?: string;
  children?: MenuItem[];
  requiredPrivilege?: PrivilegeValue | PrivilegeValue[]; // Support single privilege or array (use TEAM_LEADER for team leader access)
  isControlPanel?: boolean; // Indicates if this is a control panel/dashboard
  isDynamic?: boolean; // Indicates if this is a dynamic route
  onlyInStaging?: boolean; // Only show in staging environment
  isContextual?: boolean; // Indicates if this is a contextual menu item
  requiresBonifiable?: boolean; // Only show if user's position is bonifiable
  sortOrder?: number; // Custom sort order (lower numbers appear first, items without sortOrder are sorted alphabetically after items with sortOrder)
}

export const NAVIGATION_MENU: MenuItem[] = [
  // HOME - Pagina Inicial (Excecao - sempre primeiro)
  {
    id: "home",
    title: "Inicio",
    icon: "home",
    path: "/",
  },

  // NOTE: Notifications removed from root menu - accessed via header popover (like web version)
  // Personal notifications: click bell icon in header -> popover -> "Ver todas"
  // Admin notifications management: /administracao/notificacoes

  // ADMINISTRACAO
  {
    id: "administracao",
    title: "Administracao",
    icon: "briefcase",
    path: "/administracao",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "clientes",
        title: "Clientes",
        icon: "users",
        path: "/administracao/clientes",
        requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL],
        children: [
          { id: "clientes-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/clientes/cadastrar" },
          { id: "clientes-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/clientes/detalhes/:id", isDynamic: true },
          { id: "clientes-editar", title: "Editar", icon: "edit", path: "/administracao/clientes/editar/:id", isDynamic: true },
          {
            id: "representantes",
            title: "Representantes",
            icon: "users",
            path: "/administracao/representantes",
            children: [
              { id: "representantes-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/representantes/cadastrar" },
              { id: "representantes-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/representantes/detalhes/:id", isDynamic: true },
              { id: "representantes-editar", title: "Editar", icon: "edit", path: "/administracao/representantes/editar/:id", isDynamic: true },
            ],
          },
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
        ],
      },
      {
        id: "notificacoes-admin",
        title: "Notificacoes",
        icon: "notification",
        path: "/administracao/notificacoes",
        children: [
          { id: "notificacoes-admin-cadastrar", title: "Cadastrar", icon: "external", path: "/administracao/notificacoes/cadastrar/enviar" },
          { id: "notificacoes-admin-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/notificacoes/detalhes/:id", isDynamic: true },
          { id: "notificacoes-admin-editar", title: "Editar", icon: "edit", path: "/administracao/notificacoes/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "setores",
        title: "Setores",
        icon: "building",
        path: "/administracao/setores",
        children: [
          { id: "setores-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/setores/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "setores-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/setores/detalhes/:id", isDynamic: true },
          { id: "setores-editar", title: "Editar", icon: "edit", path: "/administracao/setores/editar/:id", isDynamic: true },
        ],
      },
    ],
  },

  // CATALOGO - View-only for Designers, Team Leaders, Warehouse, Commercial, Logistic (NOT ADMIN - admin accesses via Pintura menu)
  // sortOrder: 15 places it alphabetically between Barracões (10) and Cronograma (20) for PRODUCTION + TEAM_LEADER users
  {
    id: "catalogo",
    title: "Catalogo",
    icon: "palette",
    path: "/catalogo",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.DESIGNER, TEAM_LEADER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC],
    sortOrder: 15,
    children: [{ id: "catalogo-detalhes", title: "Detalhes", icon: "eye", path: "/catalogo/detalhes/:id", isDynamic: true }],
  },

  // ESTOQUE
  {
    id: "estoque",
    title: "Estoque",
    icon: "packages",
    path: "/estoque",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "emprestimos",
        title: "Emprestimos",
        icon: "borrowing",
        path: "/estoque/emprestimos",
        children: [
          { id: "emprestimos-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/emprestimos/cadastrar" },
          { id: "emprestimos-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/emprestimos/detalhes/:id", isDynamic: true },
        ],
      },
      {
        id: "epi-estoque",
        title: "EPI",
        icon: "helmet",
        path: "/estoque/epi",
        children: [
          {
            id: "epi-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/estoque/epi/agendamentos",
            children: [
              { id: "agendamentos-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/epi/agendamentos/cadastrar", requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES] },
              { id: "agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/epi/agendamentos/detalhes/:id", isDynamic: true },
              { id: "agendamentos-editar", title: "Editar", icon: "edit", path: "/estoque/epi/agendamentos/editar/:id", isDynamic: true, requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES] },
            ],
          },
          { id: "epi-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/epi/cadastrar" },
          { id: "epi-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/epi/detalhes/:id", isDynamic: true },
          { id: "epi-editar", title: "Editar", icon: "edit", path: "/estoque/epi/editar/:id", isDynamic: true },
          {
            id: "epi-entregas",
            title: "Entregas",
            icon: "truck",
            path: "/estoque/epi/entregas",
            children: [
              { id: "epi-entregas-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/epi/entregas/cadastrar" },
              { id: "epi-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/epi/entregas/detalhes/:id", isDynamic: true },
              { id: "v-entregas-editar", title: "Editar", icon: "edit", path: "/estoque/epi/entregas/editar/:id", isDynamic: true },
            ],
          },
        ],
      },
      {
        id: "fornecedores",
        title: "Fornecedores",
        icon: "users",
        path: "/estoque/fornecedores",
        children: [
          { id: "fornecedores-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/fornecedores/cadastrar" },
          { id: "fornecedores-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/fornecedores/detalhes/:id", isDynamic: true },
          { id: "fornecedores-editar", title: "Editar", icon: "edit", path: "/estoque/fornecedores/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "manutencao",
        title: "Manutencao",
        icon: "maintenance",
        path: "/estoque/manutencao",
        children: [
          {
            id: "manutencao-agendamentos",
            title: "Agendamentos",
            icon: "calendar",
            path: "/estoque/manutencao/agendamentos",
            children: [
              { id: "agendamentos-manutencao-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/manutencao/agendamentos/cadastrar" },
              { id: "agendamentos-manutencao-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/manutencao/agendamentos/detalhes/:id", isDynamic: true },
              { id: "agendamentos-manutencao-editar", title: "Editar", icon: "edit", path: "/estoque/manutencao/agendamentos/editar/:id", isDynamic: true },
            ],
          },
          { id: "manutencao-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/manutencao/cadastrar" },
          { id: "manutencao-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/manutencao/detalhes/:id", isDynamic: true },
          { id: "manutencao-editar", title: "Editar", icon: "edit", path: "/estoque/manutencao/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "movimentacoes",
        title: "Movimentacoes",
        icon: "movement",
        path: "/estoque/movimentacoes",
        children: [
          { id: "movimentacoes-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/movimentacoes/cadastrar" },
          { id: "movimentacoes-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/movimentacoes/detalhes/:id", isDynamic: true },
          { id: "movimentacoes-editar", title: "Editar", icon: "edit", path: "/estoque/movimentacoes/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "pedidos",
        title: "Pedidos",
        icon: "clipboardList",
        path: "/estoque/pedidos",
        children: [
          {
            id: "pedidos-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/estoque/pedidos/agendamentos",
            children: [
              { id: "agendamentos-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/pedidos/agendamentos/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
              { id: "agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/pedidos/agendamentos/detalhes/:id", isDynamic: true },
              { id: "agendamentos-editar", title: "Editar", icon: "edit", path: "/estoque/pedidos/agendamentos/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
            ],
          },
          {
            id: "pedidos-automaticos",
            title: "Automaticos",
            icon: "automation",
            path: "/estoque/pedidos/automaticos",
            children: [
              { id: "automaticos-configurar", title: "Configurar", icon: "cog", path: "/estoque/pedidos/automaticos/configurar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
            ],
          },
          { id: "pedidos-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/pedidos/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "pedidos-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/pedidos/detalhes/:id", isDynamic: true },
          { id: "pedidos-editar", title: "Editar", icon: "edit", path: "/estoque/pedidos/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
      {
        id: "produtos",
        title: "Produtos",
        icon: "package",
        path: "/estoque/produtos",
        children: [
          { id: "produtos-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/produtos/cadastrar" },
          {
            id: "produtos-categorias",
            title: "Categorias",
            icon: "tags",
            path: "/estoque/produtos/categorias",
            children: [
              { id: "categorias-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/produtos/categorias/cadastrar" },
              { id: "categorias-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/produtos/categorias/detalhes/:id", isDynamic: true },
              { id: "categorias-editar", title: "Editar", icon: "edit", path: "/estoque/produtos/categorias/editar/:id", isDynamic: true },
            ],
          },
          { id: "produtos-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/produtos/detalhes/:id", isDynamic: true },
          { id: "produtos-editar", title: "Editar", icon: "edit", path: "/estoque/produtos/editar/:id", isDynamic: true },
          { id: "produtos-balanco-estoque", title: "Balanco de Estoque", icon: "scale", path: "/estoque/produtos/balanco-estoque" },
          {
            id: "produtos-marcas",
            title: "Marcas",
            icon: "brand",
            path: "/estoque/produtos/marcas",
            children: [
              { id: "marcas-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/produtos/marcas/cadastrar" },
              { id: "marcas-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/produtos/marcas/detalhes/:id", isDynamic: true },
              { id: "marcas-editar", title: "Editar", icon: "edit", path: "/estoque/produtos/marcas/editar/:id", isDynamic: true },
            ],
          },
        ],
      },
      {
        id: "retiradas-externas",
        title: "Retiradas Externas",
        icon: "external",
        path: "/estoque/retiradas-externas",
        children: [
          { id: "retiradas-externas-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/retiradas-externas/cadastrar" },
          { id: "retiradas-externas-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/retiradas-externas/detalhes/:id", isDynamic: true },
          { id: "retiradas-externas-editar", title: "Editar", icon: "edit", path: "/estoque/retiradas-externas/editar/:id", isDynamic: true },
        ],
      },
    ],
  },

  // MANUTENCAO
  {
    id: "manutencao",
    title: "Manutencao",
    icon: "maintenance",
    path: "/manutencao",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    children: [
      { id: "manutencao-cadastrar", title: "Cadastrar", icon: "plus", path: "/manutencao/cadastrar" },
      { id: "manutencao-detalhes", title: "Detalhes", icon: "eye", path: "/manutencao/detalhes/:id", isDynamic: true },
      { id: "manutencao-editar", title: "Editar", icon: "edit", path: "/manutencao/editar/:id", isDynamic: true },
    ],
  },

  // MINHA EQUIPE (for team leaders - manages their sector's staff)
  // Only visible to users who are sector managers (have managedSector relation)
  // sortOrder: 35 places it alphabetically between Historico (30) and Observacoes (40) for PRODUCTION + TEAM_LEADER users
  {
    id: "minha-equipe",
    title: "Minha Equipe",
    icon: "team",
    path: "/meu-pessoal",
    requiredPrivilege: [TEAM_LEADER], // Only visible to sector managers
    sortOrder: 35,
    children: [
      { id: "membros-equipe", title: "Membros", icon: "users", path: "/meu-pessoal/usuarios" },
      { id: "emprestimos-equipe", title: "Empréstimos", icon: "loan", path: "/meu-pessoal/emprestimos" },
      { id: "ferias-equipe", title: "Férias", icon: "calendarWeek", path: "/meu-pessoal/ferias" },
      { id: "advertencias-equipe", title: "Advertências", icon: "alertTriangle", path: "/meu-pessoal/advertencias" },
      { id: "epis-equipe", title: "Entregas de EPI", icon: "helmet", path: "/meu-pessoal/epis" },
      { id: "movimentacoes-equipe", title: "Movimentações", icon: "activity", path: "/meu-pessoal/movimentacoes" },
      { id: "calculos-equipe", title: "Controle de Ponto", icon: "fingerprint", path: "/meu-pessoal/calculos" },
    ],
  },

  // PESSOAL - For WAREHOUSE and PLOTTING users - NOT DESIGNER (Designer has flat menu like web)
  // Note: PRODUCTION users see Pessoal at root level after production items (see bottom of file)
  {
    id: "pessoal",
    title: "Pessoal",
    icon: "userCircle",
    path: "/pessoal",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING],
    children: [
      { id: "meus-feriados", title: "Feriados", icon: "holiday", path: "/pessoal/meus-feriados" },
      { id: "minhas-mensagens", title: "Minhas Mensagens", icon: "message", path: "/pessoal/minhas-mensagens" },
      {
        id: "meu-bonus",
        title: "Meu Bônus",
        icon: "dollarSign",
        path: "/pessoal/meu-bonus",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING], // NOT available for DESIGNER
        requiresBonifiable: true, // Only show if user's position is bonifiable
        children: [
          { id: "meu-bonus-historico", title: "Histórico", icon: "history", path: "/pessoal/meu-bonus/historico", requiresBonifiable: true },
          { id: "meu-bonus-simulacao", title: "Simulação", icon: "calculator", path: "/pessoal/meu-bonus/simulacao", requiresBonifiable: true },
          { id: "meu-bonus-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meu-bonus/detalhes/:id", isDynamic: true, requiresBonifiable: true },
        ],
      },
      {
        id: "meus-emprestimos",
        title: "Meus Emprestimos",
        icon: "loan",
        path: "/pessoal/meus-emprestimos",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING], // NOT for DESIGNER (matches web)
        children: [{ id: "meus-emprestimos-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meus-emprestimos/detalhes/:id", isDynamic: true }],
      },
      {
        id: "meus-epis",
        title: "Meus EPIs",
        icon: "helmet",
        path: "/pessoal/meus-epis",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING], // NOT for DESIGNER (matches web)
        children: [
          { id: "meus-epis-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meus-epis/detalhes/:id", isDynamic: true },
          { id: "meus-epis-solicitar", title: "Solicitar EPI", icon: "plus", path: "/pessoal/meus-epis/request", isDynamic: true },
        ],
      },
      { id: "meus-pontos", title: "Meus Pontos", icon: "fingerprint", path: "/pessoal/meus-pontos" },
      {
        id: "minhas-advertencias",
        title: "Minhas Advertencias",
        icon: "alertTriangle",
        path: "/pessoal/minhas-advertencias",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING], // NOT for DESIGNER (matches web)
        children: [{ id: "minhas-advertencias-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-advertencias/detalhes/:id", isDynamic: true }],
      },
      {
        id: "minhas-ferias",
        title: "Minhas Férias",
        icon: "calendarWeek",
        path: "/pessoal/minhas-ferias",
        children: [{ id: "minhas-ferias-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-ferias/detalhes/:id", isDynamic: true }],
      },
      {
        id: "minhas-movimentacoes",
        title: "Minhas Movimentacoes",
        icon: "movement",
        path: "/pessoal/minhas-movimentacoes",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING], // NOT for DESIGNER (matches web)
        children: [{ id: "minhas-movimentacoes-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-movimentacoes/detalhes/:id", isDynamic: true }],
      },
    ],
  },

  // PINTURA - Not available to LEADER or DESIGNER (they use the separate Catalogo menu)
  {
    id: "pintura",
    title: "Pintura",
    icon: "paint",
    path: "/pintura",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      { id: "catalogo", title: "Catalogo", icon: "palette", path: "/pintura/catalogo" },
      {
        id: "marcas-de-tinta",
        title: "Marcas de Tinta",
        icon: "brand",
        path: "/pintura/marcas-de-tinta",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "marcas-tinta-cadastrar", title: "Cadastrar", icon: "plus", path: "/pintura/marcas-de-tinta/cadastrar" },
          { id: "marcas-tinta-editar", title: "Editar", icon: "edit", path: "/pintura/marcas-de-tinta/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "producoes-pintura",
        title: "Producoes",
        icon: "colorPicker",
        path: "/pintura/producoes",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [{ id: "producoes-detalhes", title: "Detalhes", icon: "eye", path: "/pintura/producoes/detalhes/:id", isDynamic: true }],
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
        ],
      },
    ],
  },

  // PRODUCAO - Note: PRODUCTION users see direct access items at root level instead of this grouped menu
  {
    id: "producao",
    title: "Producao",
    icon: "factory",
    path: "/producao",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "aerografia",
        title: "Aerografia",
        icon: "paintBrush",
        path: "/producao/aerografia",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "aerografia-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/aerografia/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "aerografia-detalhes", title: "Detalhes", icon: "eye", path: "/producao/aerografia/detalhes/:id", isDynamic: true },
          { id: "aerografia-editar", title: "Editar", icon: "edit", path: "/producao/aerografia/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
      { id: "agenda", title: "Agenda", icon: "clipboard-list", path: "/producao/agenda", requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN] },
      { id: "garagens", title: "Barracões", icon: "warehouse", path: "/producao/garagens", requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN] },
      {
        id: "cronograma",
        title: "Cronograma",
        icon: "calendarStats",
        path: "/producao/cronograma",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "cronograma-detalhes", title: "Detalhes", icon: "eye", path: "/producao/cronograma/detalhes/:id", isDynamic: true },
          { id: "cronograma-editar", title: "Editar", icon: "edit", path: "/producao/cronograma/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "cronograma-cadastrar", title: "Nova Tarefa", icon: "plus", path: "/producao/cronograma/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
      { id: "historico", title: "Historico", icon: "history", path: "/producao/historico", requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ADMIN] },
      {
        id: "observacoes",
        title: "Observacoes",
        icon: "note",
        path: "/producao/observacoes",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "observacoes-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/observacoes/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "observacoes-detalhes", title: "Detalhes", icon: "eye", path: "/producao/observacoes/detalhes/:id", isDynamic: true },
          { id: "observacoes-editar", title: "Editar", icon: "edit", path: "/producao/observacoes/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
      {
        id: "recorte",
        title: "Recorte",
        icon: "scissors",
        path: "/producao/recorte",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.ADMIN],
        children: [
          {
            id: "plano-de-recorte",
            title: "Plano de Recorte",
            icon: "clipboard",
            path: "/producao/recorte/plano-de-recorte/listar",
            children: [
              { id: "plano-de-recorte-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/recorte/plano-de-recorte/cadastrar" },
              { id: "plano-de-recorte-detalhes", title: "Detalhes", icon: "eye", path: "/producao/recorte/plano-de-recorte/detalhes/:id", isDynamic: true },
              { id: "plano-de-recorte-editar", title: "Editar", icon: "edit", path: "/producao/recorte/plano-de-recorte/editar/:id", isDynamic: true },
            ],
          },
          {
            id: "requisicao-de-recorte",
            title: "Requisicao de Recorte",
            icon: "clipboard",
            path: "/producao/recorte/requisicao-de-recorte/listar",
            children: [
              { id: "requisicao-de-recorte-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/recorte/requisicao-de-recorte/cadastrar" },
              { id: "requisicao-de-recorte-detalhes", title: "Detalhes", icon: "eye", path: "/producao/recorte/requisicao-de-recorte/detalhes/:id", isDynamic: true },
              { id: "requisicao-de-recorte-editar", title: "Editar", icon: "edit", path: "/producao/recorte/requisicao-de-recorte/editar/:id", isDynamic: true },
            ],
          },
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
        id: "warnings",
        title: "Advertencias",
        icon: "alertTriangle",
        path: "/recursos-humanos/advertencias",
        children: [
          { id: "warnings-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/advertencias/cadastrar" },
          { id: "warnings-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/advertencias/detalhes/:id", isDynamic: true },
          { id: "warnings-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/advertencias/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "bonus",
        title: "Bônus",
        icon: "coins",
        path: "/recursos-humanos/bonus/listar",
        children: [
          { id: "nivel-de-performance", title: "Nível de Performance", icon: "trendingUp", path: "/recursos-humanos/bonus/nivel-de-performance" },
          { id: "simulacao-bonus", title: "Simulação de Bônus", icon: "calculator", path: "/recursos-humanos/bonus/simulacao" },
        ],
      },
      { id: "calculos", title: "Cálculos de Ponto", icon: "deviceIpadDollar", path: "/recursos-humanos/calculos" },
      {
        id: "cargos",
        title: "Cargos",
        icon: "briefcase",
        path: "/recursos-humanos/cargos",
        children: [
          { id: "cargos-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/cargos/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "cargos-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/cargos/detalhes/:id", isDynamic: true },
          { id: "cargos-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/cargos/editar/:id", isDynamic: true },
        ],
      },
      { id: "controle-ponto", title: "Controle de Ponto", icon: "fingerprint", path: "/recursos-humanos/controle-ponto" },
      {
        id: "epi-rh",
        title: "EPI",
        icon: "helmet",
        path: "/recursos-humanos/epi",
        children: [
          {
            id: "epi-rh-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/recursos-humanos/epi/agendamentos",
            children: [
              { id: "epi-rh-agendamentos-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/epi/agendamentos/cadastrar" },
              { id: "epi-rh-agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/epi/agendamentos/detalhes/:id", isDynamic: true },
              { id: "epi-rh-agendamentos-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/epi/agendamentos/editar/:id", isDynamic: true },
            ],
          },
          { id: "epi-rh-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/epi/cadastrar" },
          { id: "epi-rh-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/epi/detalhes/:id", isDynamic: true },
          { id: "epi-rh-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/epi/editar/:id", isDynamic: true },
          {
            id: "epi-rh-entregas",
            title: "Entregas",
            icon: "truck",
            path: "/recursos-humanos/epi/entregas",
            children: [
              { id: "epi-rh-entregas-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/epi/entregas/cadastrar" },
              { id: "epi-rh-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/epi/entregas/detalhes/:id", isDynamic: true },
              { id: "epi-rh-entregas-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/epi/entregas/editar/:id", isDynamic: true },
            ],
          },
        ],
      },
      {
        id: "feriados",
        title: "Feriados",
        icon: "holiday",
        path: "/recursos-humanos/feriados",
        children: [
          { id: "feriados-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/feriados/cadastrar" },
          { id: "feriados-editar", title: "Editar", icon: "edit", path: "/recursos-humanos/feriados/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "ferias",
        title: "Ferias",
        icon: "calendarWeek",
        path: "/recursos-humanos/ferias",
        children: [
          { id: "ferias-cadastrar", title: "Cadastrar", icon: "plus", path: "/recursos-humanos/ferias/cadastrar" },
          { id: "ferias-detalhes", title: "Detalhes", icon: "eye", path: "/recursos-humanos/ferias/detalhes/:id", isDynamic: true },
        ],
      },
      // { id: "folha-de-pagamento", title: "Folha de Pagamento", icon: "payroll", path: "/recursos-humanos/folha-de-pagamento" }, // Temporarily hidden for testing
      { id: "requisicoes", title: "Requisicoes", icon: "clipboardList", path: "/recursos-humanos/requisicoes" },
    ],
  },

  // SERVIDOR
  {
    id: "servidor",
    title: "Servidor",
    icon: "server",
    path: "/servidor",
    requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
    children: [
      {
        id: "servidor-backups",
        title: "Backups",
        icon: "databaseImport",
        path: "/servidor/backups",
        children: [
          { id: "servidor-backups-listar", title: "Listar", icon: "list", path: "/servidor/backups/listar" },
          { id: "servidor-backups-cadastrar", title: "Criar Backup", icon: "plus", path: "/servidor/backups/cadastrar" },
          { id: "servidor-backups-detalhes", title: "Detalhes", icon: "eye", path: "/servidor/backups/detalhes/:id", isDynamic: true },
        ],
      },
      {
        id: "servidor-implantacoes",
        title: "Implantacoes",
        icon: "rocket",
        path: "/servidor/implantacoes",
        children: [
          { id: "servidor-implantacoes-cadastrar", title: "Cadastrar", icon: "plus", path: "/servidor/implantacoes/cadastrar" },
          { id: "servidor-implantacoes-detalhes", title: "Detalhes", icon: "eye", path: "/servidor/implantacoes/detalhes/:id", isDynamic: true },
        ],
      },
      { id: "servidor-logs", title: "Logs do Sistema", icon: "systemLogs", path: "/servidor/logs" },
      { id: "servidor-metricas", title: "Metricas do Sistema", icon: "systemMetrics", path: "/servidor/metricas" },
      { id: "servidor-pastas-compartilhadas", title: "Pastas Compartilhadas", icon: "sharedFolders", path: "/servidor/shared-folders" },
      { id: "servidor-rate-limiting", title: "Rate Limiting", icon: "shield", path: "/servidor/rate-limiting" },
      {
        id: "registros-de-alteracoes",
        title: "Registros de Alteracoes",
        icon: "auditLog",
        path: "/servidor/registros-de-alteracoes",
        children: [
          { id: "registros-listar", title: "Listar", icon: "list", path: "/servidor/registros-de-alteracoes/listar" },
          { id: "registros-detalhes", title: "Detalhes", icon: "eye", path: "/servidor/registros-de-alteracoes/detalhes/:id", isDynamic: true },
        ],
      },
      { id: "servidor-servicos", title: "Servicos do Sistema", icon: "services", path: "/servidor/services" },
      { id: "servidor-sincronizacao-bd", title: "Sincronizacao BD", icon: "repeat", path: "/servidor/database-sync", onlyInStaging: true },
      {
        id: "servidor-usuarios",
        title: "Usuarios do Sistema",
        icon: "systemUsers",
        path: "/servidor/usuarios",
        children: [{ id: "servidor-usuarios-cadastrar", title: "Criar Usuario", icon: "plus", path: "/servidor/usuarios/cadastrar" }],
      },
    ],
  },

  // ============================================================
  // MINHAS MENSAGENS - Direct access for roles without "Pessoal" group
  // (ADMIN, FINANCIAL, LOGISTIC, COMMERCIAL, MAINTENANCE, HUMAN_RESOURCES)
  // ============================================================
  {
    id: "minhas-mensagens-direct",
    title: "Minhas Mensagens",
    icon: "message",
    path: "/pessoal/minhas-mensagens",
    requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.MAINTENANCE, SECTOR_PRIVILEGES.HUMAN_RESOURCES],
  },

  // ============================================================
  // TOP-LEVEL MENU ITEMS FOR DESIGNER, FINANCIAL, AND LOGISTIC
  // (Direct access shortcuts - kept at end after main menu items)
  // ============================================================

  // Aerografia - Direct access for FINANCIAL and COMMERCIAL (matches web)
  {
    id: "aerografia-direct",
    title: "Aerografia",
    icon: "paintBrush",
    path: "/producao/aerografia",
    requiredPrivilege: [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL],
  },

  // Barracões - Direct access for LOGISTIC and COMMERCIAL (matches web)
  {
    id: "barracoes-direct",
    title: "Barracões",
    icon: "warehouse",
    path: "/producao/garagens",
    requiredPrivilege: [SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL],
  },

  // Observações - Direct access for COMMERCIAL (matches web)
  {
    id: "observacoes-direct",
    title: "Observações",
    icon: "note",
    path: "/producao/observacoes",
    requiredPrivilege: [SECTOR_PRIVILEGES.COMMERCIAL],
  },

  // Catalogo de Tintas - Direct access removed for DESIGNER (they use the view-only "/catalogo" menu)
  // Keep this for other roles that might need direct paint catalog access in the future
  // {
  //   id: "catalogo-tintas-direct",
  //   title: "Catalogo de Tintas",
  //   icon: "palette",
  //   path: "/pintura/catalogo",
  //   requiredPrivilege: [],
  // },

  // Clientes - Direct access for FINANCIAL, LOGISTIC, and COMMERCIAL
  {
    id: "clientes-direct",
    title: "Clientes",
    icon: "users",
    path: "/administracao/clientes",
    requiredPrivilege: [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL],
  },


  // Cronograma - Direct access for DESIGNER, LOGISTIC, COMMERCIAL, PLOTTING
  {
    id: "cronograma-direct",
    title: "Cronograma",
    icon: "calendarStats",
    path: "/producao/cronograma",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.PLOTTING],
  },

  // Agenda - Direct access for DESIGNER, FINANCIAL, LOGISTIC, COMMERCIAL (NOT ADMIN - admin accesses via Producao menu)
  {
    id: "agenda-direct",
    title: "Agenda",
    icon: "clipboard-list",
    path: "/producao/agenda",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL],
  },

  // Historico - Direct access for DESIGNER, FINANCIAL, LOGISTIC, COMMERCIAL, PLOTTING
  {
    id: "historico-direct",
    title: "Historico",
    icon: "history",
    path: "/producao/historico",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.PLOTTING],
  },

  // ============================================================
  // DESIGNER PERSONAL ITEMS - Direct access at root (matches web structure)
  // These are flat menu items instead of being inside "Pessoal" group
  // ============================================================

  // Feriados - Direct access for DESIGNER only (at root level like web)
  {
    id: "feriados-direct",
    title: "Feriados",
    icon: "holiday",
    path: "/pessoal/meus-feriados",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER],
  },

  // Minhas Férias - Direct access for DESIGNER only (at root level like web)
  {
    id: "minhas-ferias-direct",
    title: "Minhas Férias",
    icon: "calendarWeek",
    path: "/pessoal/minhas-ferias",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER],
    children: [{ id: "minhas-ferias-detalhes-direct", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-ferias/detalhes/:id", isDynamic: true }],
  },

  // Minhas Mensagens - Direct access for DESIGNER only (at root level like web)
  {
    id: "minhas-mensagens-direct-designer",
    title: "Minhas Mensagens",
    icon: "message",
    path: "/pessoal/minhas-mensagens",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER],
  },

  // Meus Pontos - Direct access for DESIGNER only (at root level like web)
  {
    id: "meus-pontos-direct",
    title: "Meus Pontos",
    icon: "fingerprint",
    path: "/pessoal/meus-pontos",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER],
  },

  // Recorte - Direct access for PLOTTING only (not for DESIGNER - matches web structure)
  {
    id: "recorte-direct",
    title: "Recorte",
    icon: "scissors",
    path: "/producao/recorte",
    requiredPrivilege: [SECTOR_PRIVILEGES.PLOTTING],
    children: [
      {
        id: "plano-de-recorte-direct",
        title: "Plano de Recorte",
        icon: "clipboard",
        path: "/producao/recorte/plano-de-recorte/listar",
        children: [
          { id: "plano-de-recorte-cadastrar-direct", title: "Cadastrar", icon: "plus", path: "/producao/recorte/plano-de-recorte/cadastrar" },
          { id: "plano-de-recorte-detalhes-direct", title: "Detalhes", icon: "eye", path: "/producao/recorte/plano-de-recorte/detalhes/:id", isDynamic: true },
          { id: "plano-de-recorte-editar-direct", title: "Editar", icon: "edit", path: "/producao/recorte/plano-de-recorte/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "requisicao-de-recorte-direct",
        title: "Requisicao de Recorte",
        icon: "clipboard",
        path: "/producao/recorte/requisicao-de-recorte/listar",
        children: [
          { id: "requisicao-de-recorte-cadastrar-direct", title: "Cadastrar", icon: "plus", path: "/producao/recorte/requisicao-de-recorte/cadastrar" },
          { id: "requisicao-de-recorte-detalhes-direct", title: "Detalhes", icon: "eye", path: "/producao/recorte/requisicao-de-recorte/detalhes/:id", isDynamic: true },
          { id: "requisicao-de-recorte-editar-direct", title: "Editar", icon: "edit", path: "/producao/recorte/requisicao-de-recorte/editar/:id", isDynamic: true },
        ],
      },
    ],
  },

  // ============================================================
  // PRODUCTION USER DIRECT ACCESS ITEMS
  // These are shown at root level for PRODUCTION users only (not ADMIN)
  // since ADMIN already sees these items inside the "Producao" menu
  // ============================================================

  // Barracões - Direct access for PRODUCTION users (not ADMIN - they see it in Producao menu)
  {
    id: "barracoes-production",
    title: "Barracões",
    icon: "warehouse",
    path: "/producao/garagens",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 10,
  },

  // Cronograma - Direct access for PRODUCTION users (not ADMIN - they see it in Producao menu)
  {
    id: "cronograma-production",
    title: "Cronograma",
    icon: "calendarStats",
    path: "/producao/cronograma",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 20,
    children: [
      { id: "cronograma-detalhes-production", title: "Detalhes", icon: "eye", path: "/producao/cronograma/detalhes/:id", isDynamic: true },
    ],
  },

  // Historico - Direct access for PRODUCTION users (not ADMIN - they see it in Producao menu)
  {
    id: "historico-production",
    title: "Historico",
    icon: "history",
    path: "/producao/historico",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 30,
  },

  // Observacoes - Direct access for PRODUCTION users (not ADMIN - they see it in Producao menu)
  {
    id: "observacoes-production",
    title: "Observacoes",
    icon: "note",
    path: "/producao/observacoes",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 40,
    children: [
      { id: "observacoes-detalhes-production", title: "Detalhes", icon: "eye", path: "/producao/observacoes/detalhes/:id", isDynamic: true },
    ],
  },

  // Recorte - Direct access for PRODUCTION users (not ADMIN - they see it in Producao menu)
  {
    id: "recorte-production",
    title: "Recorte",
    icon: "scissors",
    path: "/producao/recorte",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 60,
    children: [
      {
        id: "plano-de-recorte-production",
        title: "Plano de Recorte",
        icon: "clipboard",
        path: "/producao/recorte/plano-de-recorte/listar",
        children: [
          { id: "plano-de-recorte-detalhes-production", title: "Detalhes", icon: "eye", path: "/producao/recorte/plano-de-recorte/detalhes/:id", isDynamic: true },
        ],
      },
      {
        id: "requisicao-de-recorte-production",
        title: "Requisicao de Recorte",
        icon: "clipboard",
        path: "/producao/recorte/requisicao-de-recorte/listar",
        children: [
          { id: "requisicao-de-recorte-detalhes-production", title: "Detalhes", icon: "eye", path: "/producao/recorte/requisicao-de-recorte/detalhes/:id", isDynamic: true },
        ],
      },
    ],
  },

  // Pessoal - Direct access for PRODUCTION users (placed after production items to keep them together)
  {
    id: "pessoal-production",
    title: "Pessoal",
    icon: "userCircle",
    path: "/pessoal",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 50,
    children: [
      { id: "meus-feriados-production", title: "Feriados", icon: "holiday", path: "/pessoal/meus-feriados" },
      { id: "minhas-mensagens-production", title: "Minhas Mensagens", icon: "message", path: "/pessoal/minhas-mensagens" },
      {
        id: "meu-bonus-production",
        title: "Meu Bônus",
        icon: "dollarSign",
        path: "/pessoal/meu-bonus",
        requiresBonifiable: true,
        children: [
          { id: "meu-bonus-historico-production", title: "Histórico", icon: "history", path: "/pessoal/meu-bonus/historico", requiresBonifiable: true },
          { id: "meu-bonus-simulacao-production", title: "Simulação", icon: "calculator", path: "/pessoal/meu-bonus/simulacao", requiresBonifiable: true },
          { id: "meu-bonus-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/meu-bonus/detalhes/:id", isDynamic: true, requiresBonifiable: true },
        ],
      },
      {
        id: "meus-emprestimos-production",
        title: "Meus Emprestimos",
        icon: "loan",
        path: "/pessoal/meus-emprestimos",
        children: [{ id: "meus-emprestimos-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/meus-emprestimos/detalhes/:id", isDynamic: true }],
      },
      {
        id: "meus-epis-production",
        title: "Meus EPIs",
        icon: "helmet",
        path: "/pessoal/meus-epis",
        children: [
          { id: "meus-epis-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/meus-epis/detalhes/:id", isDynamic: true },
          { id: "meus-epis-solicitar-production", title: "Solicitar EPI", icon: "plus", path: "/pessoal/meus-epis/request", isDynamic: true },
        ],
      },
      { id: "meus-pontos-production", title: "Meus Pontos", icon: "fingerprint", path: "/pessoal/meus-pontos" },
      {
        id: "minhas-advertencias-production",
        title: "Minhas Advertencias",
        icon: "alertTriangle",
        path: "/pessoal/minhas-advertencias",
        children: [{ id: "minhas-advertencias-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-advertencias/detalhes/:id", isDynamic: true }],
      },
      {
        id: "minhas-ferias-production",
        title: "Minhas Férias",
        icon: "calendarWeek",
        path: "/pessoal/minhas-ferias",
        children: [{ id: "minhas-ferias-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-ferias/detalhes/:id", isDynamic: true }],
      },
      {
        id: "minhas-movimentacoes-production",
        title: "Minhas Movimentacoes",
        icon: "movement",
        path: "/pessoal/minhas-movimentacoes",
        children: [{ id: "minhas-movimentacoes-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-movimentacoes/detalhes/:id", isDynamic: true }],
      },
    ],
  },
];

// Export the menu items for use in applications
export const MENU_ITEMS = NAVIGATION_MENU;
