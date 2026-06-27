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
  requiresOpenQuestionnaire?: boolean; // Only show if the user has at least one non-submitted questionnaire entry
  hidden?: boolean; // Temporarily hide this item (and its subtree) from navigation regardless of other conditions
  sortOrder?: number; // Custom sort order (lower numbers appear first, items without sortOrder are sorted alphabetically after items with sortOrder)
}

export const NAVIGATION_MENU: MenuItem[] = [
  // HOME - Pagina Inicial (Excecao - sempre primeiro)
  {
    id: "home",
    title: "Início",
    icon: "home",
    path: "/",
  },

  // NOTE: Notifications removed from root menu - accessed via header popover (like web version)
  // Personal notifications: click bell icon in header -> popover -> "Ver todas"
  // Admin notifications management: /administracao/notificacoes

  // ADMINISTRACAO
  {
    id: "administracao",
    title: "Administração",
    icon: "briefcase",
    path: "/administracao",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
    children: [
      // NOTE: "Colaboradores" was moved out of Administração into the
      // "Departamento Pessoal" group below, mirroring the web nav consolidation.
      {
        id: "notificacoes-admin",
        title: "Notificações",
        icon: "notification",
        path: "/administracao/notificacoes",
        children: [
          { id: "notificacoes-admin-cadastrar", title: "Cadastrar", icon: "external", path: "/administracao/notificacoes/cadastrar/enviar" },
          { id: "notificacoes-admin-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/notificacoes/detalhes/:id", isDynamic: true },
          { id: "notificacoes-admin-editar", title: "Editar", icon: "edit", path: "/administracao/notificacoes/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "mensagens-admin",
        title: "Mensagens",
        icon: "message",
        path: "/administracao/mensagens",
        children: [
          { id: "mensagens-admin-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/mensagens/cadastrar" },
          { id: "mensagens-admin-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/mensagens/detalhes/:id", isDynamic: true },
          { id: "mensagens-admin-editar", title: "Editar", icon: "edit", path: "/administracao/mensagens/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "minhas-mensagens-admin",
        title: "Minhas Mensagens",
        icon: "message",
        path: "/pessoal/minhas-mensagens",
        requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
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

  // CATALOGO - View-only for Designers, Team Leaders, Commercial, Logistic, Production Manager.
  // NOT ADMIN or WAREHOUSE - they access the full (manageable) catalog via the Pintura menu,
  // so including them here would duplicate the entry in their drawer.
  {
    id: "catalogo",
    title: "Catálogo",
    icon: "palette",
    path: "/catalogo",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, TEAM_LEADER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER],
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
        title: "Empréstimos",
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
        // Read-only on mobile: the map is view-only (create/edit live on the web).
        // Tapping a structure opens its contents in a sheet, so there are no sub-routes.
        id: "localizacoes",
        title: "Localizações",
        icon: "location",
        path: "/estoque/localizacoes",
      },
      {
        id: "manutencao",
        title: "Manutenção",
        icon: "maintenance",
        path: "/estoque/manutencao",
        children: [
          { id: "manutencao-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/manutencao/cadastrar" },
          { id: "manutencao-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/manutencao/detalhes/:id", isDynamic: true },
          { id: "manutencao-editar", title: "Editar", icon: "edit", path: "/estoque/manutencao/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "movimentacoes",
        title: "Movimentações",
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
          { id: "produtos-balanco-estoque", title: "Balanço de Estoque", icon: "scale", path: "/estoque/balanco" },
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
        id: "operacoes-externas",
        title: "Operações Externas",
        icon: "external",
        path: "/estoque/operacoes-externas",
        requiredPrivilege: SECTOR_PRIVILEGES.ADMIN, // ADMIN-only (stricter than inherited estoque WAREHOUSE|ADMIN)
        children: [
          { id: "operacoes-externas-cadastrar", title: "Cadastrar", icon: "plus", path: "/estoque/operacoes-externas/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "operacoes-externas-detalhes", title: "Detalhes", icon: "eye", path: "/estoque/operacoes-externas/detalhes/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "operacoes-externas-editar", title: "Editar", icon: "edit", path: "/estoque/operacoes-externas/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
    ],
  },

  // MANUTENCAO
  {
    id: "manutencao",
    title: "Manutenção",
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
  // Only visible to users who are sector leaders (have ledSector relation)
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
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ACCOUNTING],
    children: [
      { id: "meus-feriados", title: "Feriados", icon: "holiday", path: "/pessoal/meus-feriados" },
      // Questionarios - self-fill, visible to ALL users (no requiredPrivilege),
      // but only while the user has at least one non-submitted (open) entry.
      { id: "meus-questionarios", title: "Questionários", icon: "clipboardList", path: "/pessoal/questionarios", requiresOpenQuestionnaire: true },
      { id: "minhas-mensagens", title: "Minhas Mensagens", icon: "message", path: "/pessoal/minhas-mensagens" },
      {
        id: "meu-bonus",
        title: "Meu Bônus",
        icon: "dollarSign",
        path: "/pessoal/meu-bonus",
        requiresBonifiable: true, // Sole gate: show only if user's position is bonifiable (CLT + ACTIVE + bonifiable)
        children: [
          { id: "meu-bonus-historico", title: "Histórico", icon: "history", path: "/pessoal/meu-bonus/historico", requiresBonifiable: true },
          { id: "meu-bonus-simulacao", title: "Simulação", icon: "calculator", path: "/pessoal/meu-bonus/simulacao", requiresBonifiable: true },
          { id: "meu-bonus-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meu-bonus/detalhes/:id", isDynamic: true, requiresBonifiable: true },
        ],
      },
      {
        id: "meus-emprestimos",
        title: "Meus Empréstimos",
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
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ACCOUNTING], // NOT for DESIGNER (matches web)
        children: [
          { id: "meus-epis-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meus-epis/detalhes/:id", isDynamic: true },
          { id: "meus-epis-solicitar", title: "Solicitar EPI", icon: "plus", path: "/pessoal/meus-epis/request", isDynamic: true },
        ],
      },
      {
        id: "meus-pontos",
        title: "Meus Pontos",
        icon: "fingerprint",
        path: "/pessoal/meus-pontos",
        children: [
          { id: "meus-pontos-incluir", title: "Incluir Ponto", icon: "map-pin-plus", path: "/pessoal/meus-pontos/incluir-ponto" },
          { id: "meus-pontos-ajustar", title: "Ajustar Ponto", icon: "clock-edit", path: "/pessoal/meus-pontos/ajustar-ponto" },
          { id: "meus-pontos-justificar", title: "Justificar Ausência", icon: "calendar-off", path: "/pessoal/meus-pontos/justificar-ausencia" },
          { id: "meus-pontos-assinaturas", title: "Assinatura de Ponto", icon: "file-check", path: "/pessoal/meus-pontos/assinaturas" },
        ],
      },
      {
        id: "minhas-advertencias",
        title: "Minhas Advertências",
        icon: "alertTriangle",
        path: "/pessoal/minhas-advertencias",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ACCOUNTING], // NOT for DESIGNER (matches web)
        children: [{ id: "minhas-advertencias-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-advertencias/detalhes/:id", isDynamic: true }],
      },
      {
        id: "minhas-movimentacoes",
        title: "Minhas Movimentações",
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
      { id: "catalogo", title: "Catálogo", icon: "palette", path: "/pintura/catalogo" },
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
        title: "Produções",
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
    title: "Produção",
    icon: "factory",
    path: "/producao",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "aerografia",
        title: "Aerografia",
        icon: "paintBrush",
        path: "/producao/aerografia",
        // Aerografia is not available to WAREHOUSE on mobile.
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "aerografia-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/aerografia/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "aerografia-detalhes", title: "Detalhes", icon: "eye", path: "/producao/aerografia/detalhes/:id", isDynamic: true },
          { id: "aerografia-editar", title: "Editar", icon: "edit", path: "/producao/aerografia/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
      { id: "agenda", title: "Agenda", icon: "clipboard-list", path: "/producao/agenda", requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN] },
      { id: "garagens", title: "Barracões", icon: "warehouse", path: "/producao/garagens", requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN] },
      {
        id: "cronograma",
        title: "Cronograma",
        icon: "calendarStats",
        path: "/producao/cronograma",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "cronograma-detalhes", title: "Detalhes", icon: "eye", path: "/producao/cronograma/detalhes/:id", isDynamic: true },
          { id: "cronograma-editar", title: "Editar", icon: "edit", path: "/producao/cronograma/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "cronograma-cadastrar", title: "Nova Tarefa", icon: "plus", path: "/producao/cronograma/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
        ],
      },
      { id: "historico", title: "Histórico", icon: "history", path: "/producao/historico", requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.ADMIN] },
      {
        id: "observacoes",
        title: "Observações",
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
        // Single unified Recorte list (/producao/recorte → redirects to /listar).
        // The old "Plano de Recorte" / "Requisição de Recorte" sub-entries were
        // stale links copied from the web's two-page split — mobile never built
        // those screens, so they pointed to non-existent routes.
        id: "recorte",
        title: "Recorte",
        icon: "scissors",
        path: "/producao/recorte",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.PLOTTING, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "recorte-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/recorte/cadastrar" },
          { id: "recorte-detalhes", title: "Detalhes", icon: "eye", path: "/producao/recorte/detalhes/:id", isDynamic: true },
        ],
      },
    ],
  },

  // DEPARTAMENTO PESSOAL (mirrors web's consolidated "Departamento Pessoal" section).
  // Mobile keeps all screens under /departamento-pessoal/* (paths intentionally unchanged).
  {
    id: "departamento-pessoal",
    title: "Departamento Pessoal",
    icon: "users",
    path: "/departamento-pessoal",
    requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ACCOUNTING],
    children: [
      {
        id: "dp-colaboradores",
        title: "Colaboradores",
        icon: "user",
        path: "/departamento-pessoal/colaboradores",
        // Moved here from Administração to mirror web/api's Departamento Pessoal.
        // Screen files live under app/(tabs)/departamento-pessoal/colaboradores.
        requiredPrivilege: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "dp-colaboradores-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/colaboradores/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "dp-colaboradores-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/colaboradores/detalhes/:id", isDynamic: true },
          { id: "dp-colaboradores-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/colaboradores/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "warnings",
        title: "Advertências",
        icon: "alertTriangle",
        path: "/departamento-pessoal/advertencias",
        children: [
          { id: "warnings-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/advertencias/cadastrar" },
          { id: "warnings-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/advertencias/detalhes/:id", isDynamic: true },
          { id: "warnings-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/advertencias/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "bonus",
        title: "Bônus",
        icon: "coins",
        path: "/departamento-pessoal/bonus/listar",
        // Gated like the web "Gratificações" group ([ACCOUNTING, HR, ADMIN]) so the
        // bonus pages don't leak to other sectors now that they're visible again.
        requiredPrivilege: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "nivel-de-performance", title: "Nível de Performance", icon: "trendingUp", path: "/departamento-pessoal/bonus/nivel-de-performance" },
          { id: "simulacao-bonus", title: "Simulação de Bônus", icon: "calculator", path: "/departamento-pessoal/bonus/simulacao" },
        ],
      },
      // CONTROLE DE PONTO — full sub-view structure mirroring the web's 6 tabs.
      // ("Cálculos de Ponto" removed — it duplicated Controle de Ponto.)
      // (Cargos moved into "Salários e Cargos" below to match the web grouping.)
      {
        id: "controle-ponto",
        title: "Controle de Ponto",
        icon: "fingerprint",
        path: "/departamento-pessoal/controle-ponto",
        children: [
          { id: "controle-ponto-colaborador", title: "Visualização Colaborador", icon: "user", path: "/departamento-pessoal/controle-ponto/colaborador" },
          { id: "controle-ponto-dia", title: "Visualização Dia", icon: "calendarEvent", path: "/departamento-pessoal/controle-ponto/dia" },
          { id: "controle-ponto-edicao", title: "Edição", icon: "edit", path: "/departamento-pessoal/controle-ponto/edicao" },
          { id: "controle-ponto-ausencias", title: "Ausências", icon: "timeOff", path: "/departamento-pessoal/controle-ponto/ausencias" },
          { id: "controle-ponto-fechamento", title: "Fechamento", icon: "checkCircle", path: "/departamento-pessoal/controle-ponto/fechamento" },
          { id: "controle-ponto-requisicoes", title: "Requisições", icon: "clipboardList", path: "/departamento-pessoal/requisicoes-ponto/listar" },
        ],
      },
      {
        id: "feriados",
        title: "Feriados",
        icon: "holiday",
        path: "/departamento-pessoal/feriados",
        children: [
          { id: "feriados-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/feriados/cadastrar" },
          { id: "feriados-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/feriados/editar/:id", isDynamic: true },
        ],
      },
      // { id: "folha-de-pagamento", title: "Folha de Pagamento", icon: "payroll", path: "/departamento-pessoal/folha-de-pagamento" }, // Temporarily hidden for testing
      { id: "requisicoes", title: "Requisições", icon: "clipboardList", path: "/departamento-pessoal/requisicoes" },

      // ============================================================
      // DEPARTAMENTO PESSOAL (Área Andressa) — mirrors web departamento-pessoal,
      // but mobile keeps all screens under /departamento-pessoal/*.
      // Gated for ACCOUNTING/HR/ADMIN like the equivalent web nav.
      // (Admissões / Rescisões / Salários e Cargos / Benefícios are web-only —
      // intentionally removed from mobile.)
      // ============================================================
      {
        id: "rh-ferias",
        title: "Férias",
        icon: "beach",
        path: "/departamento-pessoal/ferias/listar",
        // Match the screen-level gates (cadastrar/editar require HR/ADMIN; detalhes
        // also allows ACCOUNTING). Nav was ACCOUNTING-only, hiding it from HR/ADMIN.
        requiredPrivilege: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "rh-ferias-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/ferias/cadastrar" },
          { id: "rh-ferias-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/ferias/detalhes/:id", isDynamic: true },
          { id: "rh-ferias-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/ferias/editar/:id", isDynamic: true },
        ],
      },
    ],
  },

  // ============================================================
  // DEPARTAMENTO PESSOAL — PRODUCTION_MANAGER group.
  // Mirrors the web PM "Departamento Pessoal" menu group: PM gains
  // Férias / Advertências (create/read/update — delete stays ADMIN-only).
  // (Admissões / Rescisões are web-only — intentionally removed from mobile.)
  // Separate section because the main DP section above excludes PM, and the
  // mobile menu filter has no ADMIN/PM bypass on a privilege-gated parent.
  // ============================================================
  {
    id: "dp-production-manager",
    title: "Departamento Pessoal",
    icon: "users",
    path: "/departamento-pessoal/ferias/listar",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION_MANAGER],
    children: [
      {
        id: "pm-ferias",
        title: "Férias",
        icon: "beach",
        path: "/departamento-pessoal/ferias/listar",
        children: [
          { id: "pm-ferias-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/ferias/cadastrar" },
          { id: "pm-ferias-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/ferias/detalhes/:id", isDynamic: true },
          { id: "pm-ferias-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/ferias/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "pm-advertencias",
        title: "Advertências",
        icon: "alertTriangle",
        path: "/departamento-pessoal/advertencias",
        children: [
          { id: "pm-advertencias-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/advertencias/cadastrar" },
          { id: "pm-advertencias-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/advertencias/detalhes/:id", isDynamic: true },
          { id: "pm-advertencias-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/advertencias/editar/:id", isDynamic: true },
        ],
      },
    ],
  },

  // ============================================================
  // MEDICINA DO TRABALHO (Área Andressa) — new top-level group.
  // Mobile screens live under /departamento-pessoal/medicina/*.
  // Gated for ACCOUNTING/HR/ADMIN like the equivalent web nav.
  // ============================================================
  {
    id: "medicina-do-trabalho",
    title: "Medicina do Trabalho",
    icon: "safety",
    path: "/departamento-pessoal/medicina/aso/listar",
    // ACCOUNTING-only: new accounting-sector group. HR/ADMIN keep their original
    // Departamento Pessoal menu unchanged. (Page-level route privileges stay open.)
    requiredPrivilege: [SECTOR_PRIVILEGES.ACCOUNTING],
    children: [
      {
        id: "mt-epi-entregas",
        title: "Entrega de EPIs",
        icon: "truck",
        path: "/departamento-pessoal/epi/entregas",
        children: [
          { id: "mt-epi-entregas-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/epi/entregas/cadastrar" },
          { id: "mt-epi-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/epi/entregas/detalhes/:id", isDynamic: true },
          { id: "mt-epi-entregas-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/epi/entregas/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "mt-aso",
        title: "ASO / Exames",
        icon: "clipboardList",
        path: "/departamento-pessoal/medicina/aso/listar",
        children: [
          { id: "mt-aso-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/medicina/aso/cadastrar" },
          { id: "mt-aso-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/medicina/aso/detalhes/:id", isDynamic: true },
          { id: "mt-aso-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/medicina/aso/editar/:id", isDynamic: true },
        ],
      },
      { id: "mt-exames-periodicos", title: "Exames Periódicos", icon: "calendarStats", path: "/departamento-pessoal/medicina/exames-periodicos/listar" },
      {
        id: "mt-afastamentos",
        title: "Afastamentos",
        icon: "calendar",
        path: "/departamento-pessoal/medicina/afastamentos/listar",
        children: [
          { id: "mt-afastamentos-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/medicina/afastamentos/cadastrar" },
          { id: "mt-afastamentos-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/medicina/afastamentos/detalhes/:id", isDynamic: true },
          { id: "mt-afastamentos-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/medicina/afastamentos/editar/:id", isDynamic: true },
        ],
      },
      {
        id: "mt-cat",
        title: "CAT",
        icon: "clipboardList",
        path: "/departamento-pessoal/medicina/cat/listar",
        children: [
          { id: "mt-cat-cadastrar", title: "Cadastrar", icon: "plus", path: "/departamento-pessoal/medicina/cat/cadastrar" },
          { id: "mt-cat-detalhes", title: "Detalhes", icon: "eye", path: "/departamento-pessoal/medicina/cat/detalhes/:id", isDynamic: true },
          { id: "mt-cat-editar", title: "Editar", icon: "edit", path: "/departamento-pessoal/medicina/cat/editar/:id", isDynamic: true },
        ],
      },
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
          { id: "servidor-backups-agendamentos", title: "Agendamentos", icon: "clock", path: "/servidor/backups/agendamentos" },
          { id: "servidor-backups-detalhes", title: "Detalhes", icon: "eye", path: "/servidor/backups/detalhes/:id", isDynamic: true },
        ],
      },
      { id: "servidor-gerenciador-de-arquivos", title: "Gerenciador de Arquivos", icon: "sharedFolders", path: "/servidor/file-manager" },
      { id: "servidor-metricas", title: "Métricas do Sistema", icon: "systemMetrics", path: "/servidor/metricas" },
      { id: "servidor-servicos", title: "Serviços do Sistema", icon: "services", path: "/servidor/services" },
    ],
  },

  // ============================================================
  // FINANCEIRO - Financial Management
  // Accessible to FINANCIAL, COMMERCIAL, and ADMIN users
  // ============================================================
  {
    id: "financeiro",
    title: "Financeiro",
    icon: "currency-dollar",
    path: "/financeiro",
    requiredPrivilege: [SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.ACCOUNTING],
    children: [
      {
        id: "faturamento",
        title: "Faturamento",
        icon: "receipt",
        path: "/financeiro/faturamento",
        requiredPrivilege: [SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "faturamento-detalhes", title: "Detalhes", icon: "eye", path: "/financeiro/faturamento/detalhes/:id", isDynamic: true },
        ],
      },
      {
        id: "orcamentos",
        title: "Orçamentos",
        icon: "calculator",
        path: "/financeiro/orcamento",
        requiredPrivilege: [SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "orcamento-detalhes", title: "Detalhes", icon: "eye", path: "/financeiro/orcamento/detalhes/:taskId", isDynamic: true },
        ],
      },
      {
        id: "notas-fiscais",
        title: "Notas Fiscais",
        icon: "fileInvoice",
        path: "/financeiro/notas-fiscais",
        requiredPrivilege: [SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.ACCOUNTING],
        children: [
          { id: "notas-fiscais-detalhes", title: "Detalhes", icon: "eye", path: "/financeiro/notas-fiscais/detalhes/:id", isDynamic: true },
        ],
      },
      {
        id: "financeiro-clientes",
        title: "Clientes",
        icon: "users",
        path: "/financeiro/clientes",
        requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER],
        children: [
          { id: "financeiro-clientes-cadastrar", title: "Cadastrar", icon: "plus", path: "/financeiro/clientes/cadastrar" },
          { id: "financeiro-clientes-detalhes", title: "Detalhes", icon: "eye", path: "/financeiro/clientes/detalhes/:id", isDynamic: true },
          { id: "financeiro-clientes-editar", title: "Editar", icon: "edit", path: "/financeiro/clientes/editar/:id", isDynamic: true },
          {
            id: "financeiro-responsaveis",
            title: "Responsáveis",
            icon: "users",
            path: "/administracao/responsaveis",
            requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL],
            children: [
              { id: "financeiro-responsaveis-cadastrar", title: "Cadastrar", icon: "plus", path: "/administracao/responsaveis/cadastrar" },
              { id: "financeiro-responsaveis-detalhes", title: "Detalhes", icon: "eye", path: "/administracao/responsaveis/detalhes/:id", isDynamic: true },
              { id: "financeiro-responsaveis-editar", title: "Editar", icon: "edit", path: "/administracao/responsaveis/editar/:id", isDynamic: true },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // MINHAS MENSAGENS - Direct access for roles without "Pessoal" group
  // (FINANCIAL, LOGISTIC, COMMERCIAL, MAINTENANCE, HUMAN_RESOURCES)
  // Note: ADMIN gets "Minhas Mensagens" inside the Administração menu (like web)
  // ============================================================
  {
    id: "minhas-mensagens-direct",
    title: "Minhas Mensagens",
    icon: "message",
    path: "/pessoal/minhas-mensagens",
    requiredPrivilege: [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.MAINTENANCE, SECTOR_PRIVILEGES.HUMAN_RESOURCES],
  },

  // ============================================================
  // TOP-LEVEL MENU ITEMS FOR DESIGNER, FINANCIAL, LOGISTIC, AND PRODUCTION_MANAGER
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

  // Barracões - Direct access for LOGISTIC, PRODUCTION_MANAGER, and COMMERCIAL (matches web)
  {
    id: "barracoes-direct",
    title: "Barracões",
    icon: "warehouse",
    path: "/producao/garagens",
    requiredPrivilege: [SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL],
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

  // Clientes - Direct access for FINANCIAL, LOGISTIC, PRODUCTION_MANAGER, and COMMERCIAL
  {
    id: "clientes-direct",
    title: "Clientes",
    icon: "users",
    path: "/administracao/clientes",
    requiredPrivilege: [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER],
  },

  // Faturamento - Direct access for FINANCIAL (matches web)
  {
    id: "faturamento-direct",
    title: "Faturamento",
    icon: "receipt",
    path: "/financeiro/faturamento",
    requiredPrivilege: SECTOR_PRIVILEGES.FINANCIAL,
    children: [
      { id: "faturamento-detalhes-direct", title: "Detalhes", icon: "eye", path: "/financeiro/faturamento/detalhes/:id", isDynamic: true },
    ],
  },

  // Notas Fiscais - Direct access for FINANCIAL (matches web)
  {
    id: "notas-fiscais-direct",
    title: "Notas Fiscais",
    icon: "fileInvoice",
    path: "/financeiro/notas-fiscais",
    requiredPrivilege: SECTOR_PRIVILEGES.FINANCIAL,
    children: [
      { id: "notas-fiscais-detalhes-direct", title: "Detalhes", icon: "eye", path: "/financeiro/notas-fiscais/detalhes/:id", isDynamic: true },
    ],
  },

  // Orçamentos - Direct access for FINANCIAL (matches web)
  {
    id: "orcamentos-direct",
    title: "Orçamentos",
    icon: "calculator",
    path: "/financeiro/orcamento",
    requiredPrivilege: SECTOR_PRIVILEGES.FINANCIAL,
    children: [
      { id: "orcamento-detalhes-direct", title: "Detalhes", icon: "eye", path: "/financeiro/orcamento/detalhes/:taskId", isDynamic: true },
    ],
  },

  // Cronograma - Direct access for DESIGNER, LOGISTIC, PRODUCTION_MANAGER, COMMERCIAL, PLOTTING
  {
    id: "cronograma-direct",
    title: "Cronograma",
    icon: "calendarStats",
    path: "/producao/cronograma",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.PLOTTING],
  },

  // Agenda - Direct access for DESIGNER, FINANCIAL, LOGISTIC, PRODUCTION_MANAGER, COMMERCIAL (NOT ADMIN - admin accesses via Producao menu)
  {
    id: "agenda-direct",
    title: "Agenda",
    icon: "clipboard-list",
    path: "/producao/agenda",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL],
  },

  // Gerenciador de Arquivos - Direct access for COMMERCIAL (ADMIN accesses via Servidor)
  {
    id: "gerenciador-de-arquivos",
    title: "Gerenciador de Arquivos",
    icon: "sharedFolders",
    path: "/servidor/file-manager",
    requiredPrivilege: SECTOR_PRIVILEGES.COMMERCIAL,
  },

  // Historico - Direct access for DESIGNER, FINANCIAL, LOGISTIC, PRODUCTION_MANAGER, COMMERCIAL, PLOTTING
  {
    id: "historico-direct",
    title: "Histórico",
    icon: "history",
    path: "/producao/historico",
    requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.PLOTTING],
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
      { id: "recorte-cadastrar-direct", title: "Cadastrar", icon: "plus", path: "/producao/recorte/cadastrar" },
      { id: "recorte-detalhes-direct", title: "Detalhes", icon: "eye", path: "/producao/recorte/detalhes/:id", isDynamic: true },
    ],
  },

  // ============================================================
  // PRODUCTION USER DIRECT ACCESS ITEMS
  // These are shown at root level for PRODUCTION users only (not ADMIN)
  // since ADMIN already sees these items inside the "Producao" menu
  // ============================================================

  // Barracões removed for PRODUCTION users — the route filter in
  // privilege-layout.tsx blocks `/producao/garagens/*` for the
  // PRODUCTION privilege, so showing this drawer entry led to a dead link.
  // Garages are visible to LOGISTIC/PRODUCTION_MANAGER/COMMERCIAL via the
  // separate menu group higher in this file.

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
    title: "Histórico",
    icon: "history",
    path: "/producao/historico",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION],
    sortOrder: 30,
  },

  // Observacoes - Direct access for PRODUCTION users (not ADMIN - they see it in Producao menu)
  {
    id: "observacoes-production",
    title: "Observações",
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
      { id: "recorte-detalhes-production", title: "Detalhes", icon: "eye", path: "/producao/recorte/detalhes/:id", isDynamic: true },
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
      { id: "meus-questionarios-production", title: "Questionários", icon: "clipboardList", path: "/pessoal/questionarios", requiresOpenQuestionnaire: true },
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
        title: "Meus Empréstimos",
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
      {
        id: "meus-pontos-production",
        title: "Meus Pontos",
        icon: "fingerprint",
        path: "/pessoal/meus-pontos",
        children: [
          { id: "meus-pontos-incluir-production", title: "Incluir Ponto", icon: "map-pin-plus", path: "/pessoal/meus-pontos/incluir-ponto" },
          { id: "meus-pontos-ajustar-production", title: "Ajustar Ponto", icon: "clock-edit", path: "/pessoal/meus-pontos/ajustar-ponto" },
          { id: "meus-pontos-justificar-production", title: "Justificar Ausência", icon: "calendar-off", path: "/pessoal/meus-pontos/justificar-ausencia" },
          { id: "meus-pontos-assinaturas-production", title: "Assinatura de Ponto", icon: "file-check", path: "/pessoal/meus-pontos/assinaturas" },
        ],
      },
      {
        id: "minhas-advertencias-production",
        title: "Minhas Advertências",
        icon: "alertTriangle",
        path: "/pessoal/minhas-advertencias",
        children: [{ id: "minhas-advertencias-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-advertencias/detalhes/:id", isDynamic: true }],
      },
      {
        id: "minhas-movimentacoes-production",
        title: "Minhas Movimentações",
        icon: "movement",
        path: "/pessoal/minhas-movimentacoes",
        children: [{ id: "minhas-movimentacoes-detalhes-production", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-movimentacoes/detalhes/:id", isDynamic: true }],
      },
    ],
  },

  // ============================================================
  // AUXILIAR DE SERVIÇOS GERAIS (MAINTENANCE) PERSONAL ITEMS
  // Direct (flat) access at root — like the DESIGNER pattern, but the full
  // "Pessoal" set. Every entry is gated SOLELY to [SECTOR_PRIVILEGES.MAINTENANCE]
  // so no other sector inherits these root items.
  // Notes:
  //  - "Minhas Mensagens" is intentionally NOT repeated here: MAINTENANCE already
  //    gets it at root via `minhas-mensagens-direct` (avoids a duplicate entry).
  //  - The Manutenção menu (gated to [MAINTENANCE]) is kept untouched — additive.
  //  - All /pessoal/* routes are globally reachable in the route guard
  //    (privilege-layout.tsx), so none of these are dead links.
  // ============================================================
  {
    id: "meus-feriados-maintenance",
    title: "Feriados",
    icon: "holiday",
    path: "/pessoal/meus-feriados",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
  },
  {
    id: "meus-questionarios-maintenance",
    title: "Questionários",
    icon: "clipboardList",
    path: "/pessoal/questionarios",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    requiresOpenQuestionnaire: true,
  },
  // Meu Bônus intentionally omitted: the Auxiliar de Serviços Gerais position is
  // never bonifiable, so the bonus pages never apply to this sector.
  {
    id: "meus-emprestimos-maintenance",
    title: "Meus Empréstimos",
    icon: "loan",
    path: "/pessoal/meus-emprestimos",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    children: [{ id: "meus-emprestimos-detalhes-maintenance", title: "Detalhes", icon: "eye", path: "/pessoal/meus-emprestimos/detalhes/:id", isDynamic: true }],
  },
  {
    id: "meus-epis-maintenance",
    title: "Meus EPIs",
    icon: "helmet",
    path: "/pessoal/meus-epis",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    children: [
      { id: "meus-epis-detalhes-maintenance", title: "Detalhes", icon: "eye", path: "/pessoal/meus-epis/detalhes/:id", isDynamic: true },
      { id: "meus-epis-solicitar-maintenance", title: "Solicitar EPI", icon: "plus", path: "/pessoal/meus-epis/request", isDynamic: true },
    ],
  },
  {
    id: "meus-pontos-maintenance",
    title: "Meus Pontos",
    icon: "fingerprint",
    path: "/pessoal/meus-pontos",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    children: [
      { id: "meus-pontos-incluir-maintenance", title: "Incluir Ponto", icon: "map-pin-plus", path: "/pessoal/meus-pontos/incluir-ponto" },
      { id: "meus-pontos-ajustar-maintenance", title: "Ajustar Ponto", icon: "clock-edit", path: "/pessoal/meus-pontos/ajustar-ponto" },
      { id: "meus-pontos-justificar-maintenance", title: "Justificar Ausência", icon: "calendar-off", path: "/pessoal/meus-pontos/justificar-ausencia" },
      { id: "meus-pontos-assinaturas-maintenance", title: "Assinatura de Ponto", icon: "file-check", path: "/pessoal/meus-pontos/assinaturas" },
    ],
  },
  {
    id: "minhas-advertencias-maintenance",
    title: "Minhas Advertências",
    icon: "alertTriangle",
    path: "/pessoal/minhas-advertencias",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    children: [{ id: "minhas-advertencias-detalhes-maintenance", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-advertencias/detalhes/:id", isDynamic: true }],
  },
  {
    id: "minhas-movimentacoes-maintenance",
    title: "Minhas Movimentações",
    icon: "movement",
    path: "/pessoal/minhas-movimentacoes",
    requiredPrivilege: [SECTOR_PRIVILEGES.MAINTENANCE],
    children: [{ id: "minhas-movimentacoes-detalhes-maintenance", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-movimentacoes/detalhes/:id", isDynamic: true }],
  },
];

// Export the menu items for use in applications
export const MENU_ITEMS = NAVIGATION_MENU;
