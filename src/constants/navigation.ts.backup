import { SECTOR_PRIVILEGES } from "./enums";

export interface MenuItem {
  id: string;
  title: string;
  icon: string; // Icon name (generic, will be mapped to platform-specific icons)
  path?: string;
  children?: MenuItem[];
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]; // Support single privilege or array
  isControlPanel?: boolean; // Indicates if this is a control panel/dashboard
  isDynamic?: boolean; // Indicates if this is a dynamic route
  excludeFromMobile?: boolean; // Exclude this item from mobile navigation
  isContextual?: boolean; // Indicates if this is a contextual menu item added dynamically
}

// Comprehensive Tabler icon mapping for Brazilian manufacturing system
// Updated with verified @tabler/icons-react and @tabler/icons-react-native icon names
export const TABLER_ICONS = {
  // ==================== MAIN NAVIGATION ====================
  dashboard: "IconDashboard",
  menu: "IconMenu2",
  home: "IconHome",

  // ==================== DOMAIN MODULE ICONS ====================
  // Production
  factory: "IconBuilding",
  production: "IconTool", // More manufacturing-appropriate
  manufacturing: "IconTool",

  // Inventory/Stock
  package: "IconPackage",
  inventory: "IconBox", // Better represents inventory data/statistics
  warehouse: "IconBuildingWarehouse",

  // Paint/Painting
  paintBrush: "IconBrush", // More appropriate for paint brush functionality
  paint: "IconPalette",

  // Human Resources
  users: "IconUsers",
  hr: "IconBriefcase", // More appropriate for HR department management

  // Administration
  cog: "IconSettings",
  admin: "IconShield", // More universal administrative icon

  // Personal
  userCircle: "IconUserCircle",
  personal: "IconUser",

  // Analytics/Statistics
  barChart: "IconChartBar",
  analytics: "IconChartLine",

  // ==================== PRODUCTION MANAGEMENT ====================
  // Task Status
  play: "IconPlayerPlay",
  pause: "IconPlayerPause",
  stop: "IconPlayerStop",
  clock: "IconClock",
  pending: "IconClock",
  inProgress: "IconPlayerPlay",
  onHold: "IconPlayerPause",
  completed: "IconCircleCheck",
  cancelled: "IconX",

  // Production Tools
  scissors: "IconScissors",
  cutting: "IconScissors",
  garage: "IconBuildingWarehouse",
  truck: "IconTruck",
  serviceWrench: "IconTool",
  maintenance: "IconTools",

  // Documentation
  clipboard: "IconClipboard",
  clipboardList: "IconClipboardList", // More consistent with clipboard concept
  note: "IconNote",
  history: "IconHistory", // Better represents historical data

  // ==================== INVENTORY MANAGEMENT ====================
  // Products and Items
  box: "IconBox",
  item: "IconPackage",
  products: "IconPackages",

  // Categories and Organization
  tags: "IconTags",
  category: "IconFolder",
  brand: "IconBadge", // More appropriate for brand representation

  // Suppliers and Orders
  suppliers: "IconUsers", // Better represents supplier relationships
  supplier: "IconTruck",
  orders: "IconClipboardList", // Better represents order management
  order: "IconFileText",
  shoppingCart: "IconShoppingCart",

  // Scheduling and Automation
  calendar: "IconCalendar",
  calendarTime: "IconCalendarTime",
  schedule: "IconCalendarPlus",
  automation: "IconBolt",

  // Movement and Activities
  packageSearch: "IconSearch", // Better for inventory search
  activity: "IconActivity",
  movement: "IconArrowsUpDown",

  // External Operations
  external: "IconSend", // More appropriate for external operations
  withdrawal: "IconArrowUp", // Better represents withdrawal/outgoing items

  // Safety Equipment (PPE)
  shield: "IconShield", // Better represents safety verification
  hardHat: "IconHelmet",
  safety: "IconShieldCheck",
  helmet: "IconHelmet",

  // Borrowing/Lending
  borrowing: "IconArrowsExchange", // Better represents borrowing cycle
  return: "IconArrowLeft", // For returning borrowed items

  // Sizing
  sizes: "IconRuler",
  measurements: "IconRuler2",

  // ==================== PAINT MANAGEMENT ====================
  // Paint Types and Colors
  palette: "IconPalette",
  droplet: "IconDroplet",
  color: "IconColorSwatch",

  // Production and Formulas
  beaker: "IconFlask",
  formula: "IconCalculator",
  mixing: "IconFlask",

  // Catalog
  catalog: "IconBook",
  swatch: "IconColorPicker",

  // ==================== HUMAN RESOURCES ====================
  // People Management
  user: "IconUser",
  employee: "IconUser",
  userCheck: "IconUserCheck",
  team: "IconUsers",

  // Organization Structure
  building: "IconBuilding",
  sector: "IconBuildingBank",
  position: "IconBadge",
  briefcaseUser: "IconBriefcase",
  briefcase: "IconBriefcase",

  // Time Management
  vacation: "IconBeach", // More appropriate for time off
  holiday: "IconCalendarEvent", // Standard calendar for holidays
  timeOff: "IconCalendarMinus",

  // Communication
  warning: "IconAlertTriangle",
  announcement: "IconSpeakerphone",
  notice: "IconBell",

  // Payments
  dollarSign: "IconCurrencyDollar",
  salary: "IconCurrencyDollar",
  payroll: "IconReceipt", // Icon for payroll

  // Job Openings
  jobOpening: "IconBriefcase",
  vacancy: "IconUserPlus",

  // ==================== ADMINISTRATION ====================
  // Customer Management
  customers: "IconUsers",
  customer: "IconUserCircle",
  client: "IconUser",

  // Document Management
  files: "IconFolders",
  folders: "IconFolders",
  document: "IconFileText",
  archive: "IconArchive",
  databaseImport: "IconDatabaseImport",

  // System Management
  auditLog: "IconList", // Better represents audit verification
  log: "IconListDetails", // Better for system logs/statistics
  system: "IconDeviceDesktop",

  // Integrations
  api: "IconApi",
  database: "IconDatabase",
  sync: "IconRefresh",
  refresh: "IconRefresh",
  calculator: "IconCalculator",

  // Notifications
  bell: "IconBell",
  notification: "IconBellRinging",
  alert: "IconAlertCircle",

  // ==================== PERSONAL/USER INTERFACE ====================
  // Profile Management
  profile: "IconUserCircle",
  account: "IconUserCircle",

  // Personal Tasks and Items
  myTasks: "IconList",
  myVacations: "IconCalendarEvent",
  myBorrows: "IconPackage",
  myPpes: "IconShieldCheck",
  myNotifications: "IconBellRinging",

  // Preferences and Settings
  preferences: "IconSettings",
  theme: "IconPalette",
  privacy: "IconLock",
  configuration: "IconSettings",

  // ==================== STATISTICS AND ANALYTICS ====================
  // Chart Types
  pieChart: "IconChartPie", // Better chart representation
  lineChart: "IconChartLine",
  areaChart: "IconChartArea",

  // Trends and Performance
  trendingUp: "IconTrendingUp",
  trendingDown: "IconTrendingDown",
  performance: "IconBolt",
  efficiency: "IconChartBar",

  // Financial Metrics
  revenue: "IconCurrencyDollar",
  profit: "IconTrendingUp",
  cost: "IconCalculator",
  financial: "IconCurrencyDollar",

  // ==================== COMMON ACTIONS ====================
  // CRUD Operations
  plus: "IconPlus",
  add: "IconPlus",
  create: "IconPlus",
  edit: "IconEdit",
  update: "IconRefresh",
  trash: "IconTrash",
  delete: "IconTrash",
  details: "IconEye",
  view: "IconEye",
  list: "IconList",

  // Favorites
  star: "IconStar",
  starFilled: "IconStarFilled",
  favorites: "IconStar",

  // Data Operations
  search: "IconSearch",
  filter: "IconFilter",
  sort: "IconArrowsSort",

  // File Operations
  download: "IconDownload",
  upload: "IconUpload",
  import: "IconFileImport",
  export: "IconFileExport",

  // ==================== STATUS INDICATORS ====================
  // Success/Failure
  check: "IconCheck",
  checkCircle: "IconCircleCheck",
  x: "IconX",
  xCircle: "IconCircleX",

  // Information
  info: "IconInfoCircle",
  help: "IconHelp",
  question: "IconQuestionMark",

  // Warnings and Errors
  warningTriangle: "IconAlertTriangle",
  error: "IconAlertCircle",

  // ==================== FORM AND INPUT ====================
  // Visibility
  eye: "IconEye",
  eyeOff: "IconEyeOff",

  // Selection
  radio: "IconCircle",
  checkbox: "IconCheck",

  // ==================== NAVIGATION CONTROLS ====================
  // Directional
  chevronRight: "IconChevronRight",
  chevronLeft: "IconChevronLeft",
  chevronDown: "IconChevronDown",
  chevronUp: "IconChevronUp",

  // Actions
  back: "IconArrowLeft",
  forward: "IconArrowRight",

  // ==================== LOADING AND STATES ====================
  loader: "IconLoader",
  loading: "IconLoader",

  // ==================== AUTENTICAÇÃO ====================
  login: "IconLogin",
  logOut: "IconLogout",
  register: "IconUserPlus",
  forgotPassword: "IconKey",
  resetPassword: "IconRefresh",
  verify: "IconShieldCheck",

  // ==================== BRAZILIAN BUSINESS CONTEXT ====================
  // Documents
  cpf: "IconId",
  cnpj: "IconBuildingBank",

  // Geographic
  location: "IconMapPin",
  address: "IconHome",

  // Communication
  phone: "IconPhone",
  email: "IconMail",

  // ==================== SERVER MANAGEMENT ====================
  server: "IconServer",
  services: "IconSettings",
  systemUsers: "IconUserCog",
  sharedFolders: "IconFolderShare",
  systemMetrics: "IconChartLine",
  systemLogs: "IconFileText",
  rocket: "IconRocket",
  deployment: "IconRocket",

  // ==================== SPECIALIZED TOOLS ====================
  // Configuration Tools
  userCog: "IconUserCog",
  systemCog: "IconSettings",

  // Quality Control
  quality: "IconShieldCheck",
  inspection: "IconSearch",

  // Reporting
  report: "IconFileReport",
  print: "IconPrinter",

  // ==================== UTILITIES ====================
  // Common UI Elements
  more: "IconDots",
  options: "IconMenu2",
  fullscreen: "IconMaximize",

  // File Types
  fileText: "IconFileText",
  image: "IconPhoto",
  video: "IconVideo",

  // Time and Date
  time: "IconClock",
  date: "IconCalendar",
  timer: "IconClock",
  timeTracking: "IconClockHour4",
  clockIn: "IconPlayerPlay",
  clockOut: "IconPlayerPause",

  // ==================== MOBILE SPECIFIC ====================
  // Mobile Navigation
  hamburger: "IconMenu2",
  bottomTab: "IconDots",

  // Mobile Actions
  share: "IconShare",

  // ==================== STATUS SPECIFIC ====================
  // Task Statuses
  statusPending: "IconClock",
  statusInProgress: "IconPlayerPlay",
  statusCompleted: "IconCircleCheck",
  statusCancelled: "IconX",
  statusOnHold: "IconPlayerPause",

  // Order Statuses
  statusCreated: "IconCirclePlus",
  statusReceived: "IconCircleCheck",
  statusFulfilled: "IconTruck",

  // User Statuses
  statusActive: "IconUser",
  statusInactive: "IconUserX",
  statusActivate: "IconCircleCheck",
  statusDeactivate: "IconCircleX",

  // General Statuses
  statusEnabled: "IconCheck",
  statusDisabled: "IconX",

  // Priority Levels
  priorityLow: "IconArrowDown",
  priorityMedium: "IconMinus",
  priorityHigh: "IconArrowUp",
  priorityCritical: "IconAlertTriangle",

  // ==================== ENTITY SPECIFIC ====================

  // PPE Related
  ppeDelivered: "IconCircleCheck",
  ppePending: "IconClock",
  ppeExpired: "IconAlertTriangle",

  // Paint Related
  paintMixed: "IconCircleCheck",
  paintPending: "IconClock",

  // ==================== SETTINGS CATEGORIES ====================
  settingsGeneral: "IconSettings",
  settingsAccount: "IconUserCog",
  settingsNotifications: "IconBellRinging",
  settingsPrivacy: "IconLock",
  settingsTheme: "IconPalette",
  settingsSecurity: "IconShield",

  // ==================== ADDITIONAL ICONS ====================
  approve: "IconCircleCheck",
  reject: "IconCircleX",
  send: "IconSend",
  orphan: "IconFolderX",
  components: "IconPuzzle",
  entity: "IconDatabase",
  spotCheck: "IconEye",
} as const;

export const NAVIGATION_MENU: MenuItem[] = [
  // HOME - Página Inicial (Exceção - sempre primeiro - sem restrição de privilégio)
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
    path: "/administration",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "clientes",
        title: "Clientes",
        icon: "users",
        path: "/administration/customers",
        requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "clientes-cadastrar", title: "Cadastrar", icon: "plus", path: "/administration/customers/create", requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
          { id: "clientes-detalhes", title: "Detalhes", icon: "eye", path: "/administration/customers/details/:id", isDynamic: true, requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
          { id: "clientes-editar", title: "Editar", icon: "edit", path: "/administration/customers/edit/:id", isDynamic: true, requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
          { id: "clientes-listar", title: "Listar", icon: "list", path: "/administration/customers/list", requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] },
        ],
      },

      {
        id: "colaboradores",
        title: "Colaboradores",
        icon: "user",
        path: "/administration/collaborators",
        children: [
          { id: "colaboradores-cadastrar", title: "Cadastrar", icon: "plus", path: "/administration/collaborators/create", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "colaboradores-detalhes", title: "Detalhes", icon: "eye", path: "/administration/collaborators/details/:id", isDynamic: true },
          { id: "colaboradores-editar", title: "Editar", icon: "edit", path: "/administration/collaborators/edit/:id", isDynamic: true },
          { id: "colaboradores-listar", title: "Listar", icon: "list", path: "/administration/collaborators/list" },
        ],
      },

      {
        id: "notificacoes-admin",
        title: "Notificações",
        icon: "notification",
        path: "/administration/notifications",
        children: [
          { id: "notificacoes-admin-cadastrar", title: "Cadastrar", icon: "external", path: "/administration/notifications/create/send" },
          { id: "notificacoes-admin-detalhes", title: "Detalhes", icon: "eye", path: "/administration/notifications/details/:id", isDynamic: true },
          { id: "notificacoes-admin-editar", title: "Editar", icon: "edit", path: "/administration/notifications/edit/:id", isDynamic: true },
          { id: "notificacoes-admin-listar", title: "Listar", icon: "list", path: "/administration/notifications/list" },
        ],
      },

      {
        id: "setores",
        title: "Setores",
        icon: "building",
        path: "/administration/sectors/list",
        children: [
          { id: "setores-cadastrar", title: "Cadastrar", icon: "plus", path: "/administration/sectors/create", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "setores-detalhes", title: "Detalhes", icon: "eye", path: "/administration/sectors/details/:id", isDynamic: true },
          { id: "setores-editar", title: "Editar", icon: "edit", path: "/administration/sectors/edit/:id", isDynamic: true },
        ],
      },

      {
        id: "arquivos-admin",
        title: "Arquivos",
        icon: "folder",
        path: "/administration/files",
        children: [
          { id: "arquivos-upload", title: "Upload", icon: "upload", path: "/administration/files/upload" },
          { id: "arquivos-detalhes", title: "Detalhes", icon: "eye", path: "/administration/files/details/:id", isDynamic: true },
          { id: "arquivos-listar", title: "Listar", icon: "list", path: "/administration/files/list" },
          { id: "arquivos-orfaos", title: "Órfãos", icon: "warning", path: "/administration/files/orphans" },
        ],
      },

      {
        id: "registros-alteracoes-admin",
        title: "Registros de Alterações",
        icon: "auditLog",
        path: "/administration/change-logs",
        children: [
          { id: "registros-detalhes", title: "Detalhes", icon: "eye", path: "/administration/change-logs/details/:id", isDynamic: true },
          { id: "registros-entidade", title: "Por Entidade", icon: "search", path: "/administration/change-logs/entity/:entityType/:entityId", isDynamic: true },
          { id: "registros-listar", title: "Listar", icon: "list", path: "/administration/change-logs/list" },
        ],
      },
    ],
  },

  // FINANCEIRO
  {
    id: "financeiro",
    title: "Financeiro",
    icon: "financial",
    path: "/financeiro",
    requiredPrivilege: SECTOR_PRIVILEGES.FINANCIAL,
    children: [
      {
        id: "clientes-financeiro",
        title: "Clientes",
        icon: "users",
        path: "/financeiro/clientes",
      },
      {
        id: "producao-financeiro",
        title: "Produção",
        icon: "factory",
        path: "/financeiro/producao",
        children: [
          {
            id: "aerografia-financeiro",
            title: "Aerografia",
            icon: "paintBrush",
            path: "/financeiro/producao/aerografia",
          },
          {
            id: "cronograma-financeiro",
            title: "Cronograma",
            icon: "clock",
            path: "/financeiro/producao/cronograma",
          },
          {
            id: "em-espera-financeiro",
            title: "Em Espera",
            icon: "pause",
            path: "/financeiro/producao/em-espera",
          },
          {
            id: "historico-tarefas-financeiro",
            title: "Histórico de Tarefas",
            icon: "history",
            path: "/financeiro/producao/historico-tarefas",
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
    path: "/inventory",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "emprestimos",
        title: "Empréstimos",
        icon: "borrowing",
        path: "/inventory/borrows",
        children: [
          { id: "emprestimos-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/borrows/create" },
          { id: "emprestimos-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/borrows/details/:id", isDynamic: true },
          { id: "emprestimos-editar-lote", title: "Editar em Lote", icon: "edit", path: "/inventory/borrows/batch-edit", excludeFromMobile: true },
          { id: "emprestimos-listar", title: "Listar", icon: "list", path: "/inventory/borrows/list" },
        ],
      },

      {
        id: "epi-estoque",
        title: "EPI",
        icon: "shield",
        path: "/inventory/ppe",
        children: [
          { id: "epi-estoque-listar", title: "Listar", icon: "list", path: "/inventory/ppe/list" },
          { id: "epi-estoque-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/ppe/create" },
          { id: "epi-estoque-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/ppe/details/:id", isDynamic: true },
          { id: "epi-estoque-editar", title: "Editar", icon: "edit", path: "/inventory/ppe/edit/:id", isDynamic: true },
          {
            id: "epi-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/inventory/ppe/schedules",
            children: [
              {
                id: "agendamentos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/inventory/ppe/schedules/create",
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/ppe/schedules/details/:id", isDynamic: true },
              {
                id: "agendamentos-editar",
                title: "Editar",
                icon: "edit",
                path: "/inventory/ppe/schedules/edit/:id",
                isDynamic: true,
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "agendamentos-listar", title: "Listar", icon: "list", path: "/inventory/ppe/schedules/list" },
            ],
          },
          {
            id: "epi-entregas",
            title: "Entregas",
            icon: "truck",
            path: "/inventory/ppe/deliveries",
            children: [
              {
                id: "epi-entregas-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/inventory/ppe/deliveries/create",
              },
              { id: "epi-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/ppe/deliveries/details/:id", isDynamic: true },
              {
                id: "epi-entregas-editar",
                title: "Editar",
                icon: "edit",
                path: "/inventory/ppe/deliveries/edit/:id",
                isDynamic: true,
              },
              { id: "epi-entregas-listar", title: "Listar", icon: "list", path: "/inventory/ppe/deliveries/list" },
            ],
          },
        ],
      },

      {
        id: "fornecedores",
        title: "Fornecedores",
        icon: "users",
        path: "/inventory/suppliers",
        children: [
          { id: "fornecedores-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/suppliers/create" },
          { id: "fornecedores-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/suppliers/details/:id", isDynamic: true },
          { id: "fornecedores-editar", title: "Editar", icon: "edit", path: "/inventory/suppliers/edit/:id", isDynamic: true },
          { id: "fornecedores-listar", title: "Listar", icon: "list", path: "/inventory/suppliers/list" },
        ],
      },

      {
        id: "manutencao",
        title: "Manutenção",
        icon: "maintenance",
        path: "/inventory/maintenance",
        children: [
          {
            id: "manutencao-agendamentos",
            title: "Agendamentos",
            icon: "calendar",
            path: "/inventory/maintenance/schedules",
            children: [
              { id: "agendamentos-manutencao-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/maintenance/schedules/create" },
              { id: "agendamentos-manutencao-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/maintenance/schedules/details/:id", isDynamic: true },
              { id: "agendamentos-manutencao-editar", title: "Editar", icon: "edit", path: "/inventory/maintenance/schedules/edit/:id", isDynamic: true },
              { id: "agendamentos-manutencao-listar", title: "Listar", icon: "list", path: "/inventory/maintenance/schedules/list" },
            ],
          },
          { id: "manutencao-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/maintenance/create" },
          { id: "manutencao-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/maintenance/details/:id", isDynamic: true },
          { id: "manutencao-editar", title: "Editar", icon: "edit", path: "/inventory/maintenance/edit/:id", isDynamic: true },
          { id: "manutencao-listar", title: "Listar", icon: "list", path: "/inventory/maintenance/list" },
        ],
      },

      {
        id: "movimentacoes",
        title: "Movimentações",
        icon: "movement",
        path: "/inventory/activities",
        children: [
          { id: "movimentacoes-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/activities/create" },
          { id: "movimentacoes-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/activities/details/:id", isDynamic: true },
          { id: "movimentacoes-editar", title: "Editar", icon: "edit", path: "/inventory/activities/edit/:id", isDynamic: true },
          { id: "movimentacoes-editar-lote", title: "Editar em Lote", icon: "edit", path: "/inventory/activities/batch-edit", excludeFromMobile: true },
          { id: "movimentacoes-listar", title: "Listar", icon: "list", path: "/inventory/activities/list" },
        ],
      },

      {
        id: "pedidos",
        title: "Pedidos",
        icon: "clipboardList",
        path: "/inventory/orders",
        children: [
          {
            id: "pedidos-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/inventory/orders/schedules",
            children: [
              {
                id: "agendamentos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/inventory/orders/schedules/create",
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/orders/schedules/details/:id", isDynamic: true },
              {
                id: "agendamentos-editar",
                title: "Editar",
                icon: "edit",
                path: "/inventory/orders/schedules/edit/:id",
                isDynamic: true,
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "pedidos-agendamentos-listar", title: "Listar", icon: "list", path: "/inventory/orders/schedules/list" },
            ],
          },

          {
            id: "pedidos-automaticos",
            title: "Automáticos",
            icon: "automation",
            path: "/inventory/orders/automatic",
            children: [
              {
                id: "automaticos-configurar",
                title: "Configurar",
                icon: "cog",
                path: "/inventory/orders/automatic/configure",
                requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
              },
              { id: "pedidos-automaticos-listar", title: "Listar", icon: "list", path: "/inventory/orders/automatic/list" },
            ],
          },
          { id: "pedidos-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/orders/create", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "pedidos-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/orders/details/:id", isDynamic: true },
          { id: "pedidos-editar", title: "Editar", icon: "edit", path: "/inventory/orders/edit/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "pedidos-listar", title: "Listar", icon: "list", path: "/inventory/orders/list" },
        ],
      },

      {
        id: "produtos",
        title: "Produtos",
        icon: "package",
        path: "/inventory/products",
        children: [
          { id: "produtos-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/products/create" },

          {
            id: "produtos-categorias",
            title: "Categorias",
            icon: "tags",
            path: "/inventory/products/categories",
            children: [
              { id: "categorias-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/products/categories/create" },
              { id: "categorias-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/products/categories/details/:id", isDynamic: true },
              { id: "categorias-editar", title: "Editar", icon: "edit", path: "/inventory/products/categories/edit/:id", isDynamic: true },
              { id: "categorias-editar-em-lote", title: "Editar em Lote", icon: "edit", path: "/inventory/products/categories/batch-edit", excludeFromMobile: true },
              { id: "categorias-listar", title: "Listar", icon: "list", path: "/inventory/products/categories/list" },
            ],
          },

          { id: "produtos-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/products/details/:id", isDynamic: true },
          { id: "produtos-editar", title: "Editar", icon: "edit", path: "/inventory/products/edit/:id", isDynamic: true },
          { id: "produtos-editar-em-lote", title: "Editar em Lote", icon: "edit", path: "/inventory/products/batch-edit", excludeFromMobile: true },
          { id: "produtos-listar", title: "Listar", icon: "list", path: "/inventory/products/list" },

          {
            id: "produtos-marcas",
            title: "Marcas",
            icon: "brand", // Marca
            path: "/inventory/products/brands",
            children: [
              { id: "marcas-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/products/brands/create" },
              { id: "marcas-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/products/brands/details/:id", isDynamic: true },
              { id: "marcas-editar", title: "Editar", icon: "edit", path: "/inventory/products/brands/edit/:id", isDynamic: true },
              { id: "marcas-editar-em-lote", title: "Editar em Lote", icon: "edit", path: "/inventory/products/brands/batch-edit", excludeFromMobile: true },
              { id: "marcas-listar", title: "Listar", icon: "list", path: "/inventory/products/brands/list" },
            ],
          },
        ],
      },

      {
        id: "retiradas-externas",
        title: "Retiradas Externas",
        icon: "external",
        path: "/inventory/external-withdrawals",
        children: [
          { id: "retiradas-externas-cadastrar", title: "Cadastrar", icon: "plus", path: "/inventory/external-withdrawals/create" },
          { id: "retiradas-externas-detalhes", title: "Detalhes", icon: "eye", path: "/inventory/external-withdrawals/details/:id", isDynamic: true },
          { id: "retiradas-externas-editar", title: "Editar", icon: "edit", path: "/inventory/external-withdrawals/edit/:id", isDynamic: true },
          { id: "retiradas-externas-listar", title: "Listar", icon: "list", path: "/inventory/external-withdrawals/list" },
        ],
      },
    ],
  },

  // INTEGRAÇÕES
  {
    id: "integracoes",
    title: "Integrações",
    icon: "api", // Will need to be mapped to a valid icon
    path: "/integracoes",
    requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
    children: [
      {
        id: "integracoes-secullum",
        title: "Secullum",
        icon: "database",
        path: "/integracoes/secullum",
        children: [
          {
            id: "integracoes-secullum-calculos",
            title: "Cálculos de Ponto",
            icon: "calculator",
            path: "/integracoes/secullum/calculos",
          },
          {
            id: "integracoes-secullum-registros-ponto",
            title: "Registros de Ponto",
            icon: "clock",
            path: "/integracoes/secullum/registros-ponto",
            children: [
              {
                id: "integracoes-secullum-registros-ponto-detalhes",
                title: "Detalhes",
                icon: "eye",
                path: "/integracoes/secullum/registros-ponto/detalhes/:id",
                isDynamic: true,
              },
            ],
          },
          {
            id: "integracoes-secullum-status-sincronizacao",
            title: "Status de Sincronização",
            icon: "refresh",
            path: "/integracoes/secullum/status-sincronizacao",
          },
        ],
      },
    ],
  },

  // MANUTENÇÃO
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

  // MEU PESSOAL - Gestão de colaboradores do setor (apenas para LEADER)
  {
    id: "meu-pessoal",
    title: "Meu Pessoal",
    icon: "team",
    path: "/meu-pessoal",
    requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
    children: [
      {
        id: "avisos-equipe",
        title: "Advertências",
        icon: "warning",
        path: "/meu-pessoal/avisos",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
      {
        id: "emprestimos-equipe",
        title: "Empréstimos",
        icon: "borrowing",
        path: "/meu-pessoal/emprestimos",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
      {
        id: "atividades-equipe",
        title: "Atividades",
        icon: "activity",
        path: "/meu-pessoal/atividades",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
      {
        id: "entregas-epi-equipe",
        title: "Entregas de EPI",
        icon: "safety",
        path: "/meu-pessoal/entregas-epi",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
      {
        id: "usuarios-equipe",
        title: "Usuários",
        icon: "users",
        path: "/meu-pessoal/usuarios",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
      {
        id: "recortes-equipe",
        title: "Recortes",
        icon: "cutting",
        path: "/meu-pessoal/recortes",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
      {
        id: "calculos-ponto-equipe",
        title: "Cálculos de Ponto",
        icon: "calculator",
        path: "/meu-pessoal/calculos-ponto",
        requiredPrivilege: SECTOR_PRIVILEGES.LEADER,
      },
    ],
  },

  // PESSOAL
  {
    id: "pessoal",
    title: "Pessoal",
    icon: "userCircle",
    path: "/pessoal",
    requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.MAINTENANCE],
    children: [
      {
        id: "meus-avisos",
        title: "Meus Avisos",
        icon: "announcement",
        path: "/pessoal/meus-avisos",
        children: [{ id: "meus-avisos-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meus-avisos/detalhes/:id", isDynamic: true }],
      },

      {
        id: "meus-emprestimos",
        title: "Meus Empréstimos",
        icon: "box",
        path: "/pessoal/meus-emprestimos",
        children: [{ id: "meus-emprestimos-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/meus-emprestimos/detalhes/:id", isDynamic: true }],
      },

      {
        id: "meus-epis",
        title: "Meus EPIs",
        icon: "safety",
        path: "/pessoal/meus-epis",
        children: [{ id: "meus-epis-solicitar", title: "Solicitar EPI", icon: "plus", path: "/pessoal/meus-epis/solicitar" }],
      },

      {
        id: "meus-feriados",
        title: "Meus Feriados",
        icon: "calendar",
        path: "/pessoal/meus-feriados",
      },


      {
        id: "minhas-ferias",
        title: "Minhas Férias",
        icon: "calendar",
        path: "/pessoal/minhas-ferias",
        children: [{ id: "minhas-ferias-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-ferias/detalhes/:id", isDynamic: true }],
      },

      {
        id: "minhas-notificacoes",
        title: "Minhas Notificações",
        icon: "notification",
        path: "/pessoal/minhas-notificacoes",
        children: [{ id: "minhas-notificacoes-detalhes", title: "Detalhes", icon: "eye", path: "/pessoal/minhas-notificacoes/detalhes/:id", isDynamic: true }],
      },
    ],
  },

  // PINTURA
  {
    id: "pintura",
    title: "Pintura",
    icon: "palette",
    path: "/painting",
    requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
    children: [
      {
        id: "catalogo",
        title: "Catálogo",
        icon: "catalog",
        path: "/painting/catalog",
        requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          {
            id: "catalogo-listar",
            title: "Listar",
            icon: "list",
            path: "/painting/catalog/list",
            requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
          },
          {
            id: "catalogo-cadastrar",
            title: "Cadastrar",
            icon: "plus",
            path: "/painting/catalog/create",
            requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
          },
          {
            id: "catalogo-detalhes",
            title: "Detalhes",
            icon: "eye",
            path: "/painting/catalog/details/:id",
            isDynamic: true,
            children: [
              {
                id: "catalogo-formula-detalhes",
                title: "Detalhes da Fórmula",
                icon: "eye",
                path: "/painting/formulas/:formulaId/components/details/:id",
                isDynamic: true,
                requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
              },
              {
                id: "catalogo-formulas",
                title: "Fórmulas",
                icon: "beaker",
                path: "/painting/formulas/:formulaId/components/list",
                isDynamic: true,
                requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
              },
            ],
          },
          {
            id: "catalogo-editar",
            title: "Editar",
            icon: "edit",
            path: "/painting/catalog/edit/:id",
            isDynamic: true,
            requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
          },
        ],
      },

      {
        id: "marcas-de-tinta",
        title: "Marcas de Tinta",
        icon: "brand",
        path: "/painting/paint-brands",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "marcas-tinta-cadastrar", title: "Cadastrar", icon: "plus", path: "/painting/paint-brands/create" },
          { id: "marcas-tinta-editar", title: "Editar", icon: "edit", path: "/painting/paint-brands/edit/:id", isDynamic: true },
          { id: "marcas-tinta-listar", title: "Listar", icon: "list", path: "/painting/paint-brands/list" },
        ],
      },

      {
        id: "producoes-pintura",
        title: "Produções",
        icon: "building",
        path: "/painting/productions",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "producoes-detalhes", title: "Detalhes", icon: "eye", path: "/painting/productions/details/:id", isDynamic: true },
          { id: "producoes-listar", title: "Listar", icon: "list", path: "/painting/productions/list" },
        ],
      },

      {
        id: "tipos-de-tinta",
        title: "Tipos de Tinta",
        icon: "tags",
        path: "/painting/paint-types",
        requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "tipos-tinta-cadastrar", title: "Cadastrar", icon: "plus", path: "/painting/paint-types/create" },
          { id: "tipos-tinta-editar", title: "Editar", icon: "edit", path: "/painting/paint-types/edit/:id", isDynamic: true },
          { id: "tipos-tinta-listar", title: "Listar", icon: "list", path: "/painting/paint-types/list" },
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
        id: "aerografia",
        title: "Aerografia",
        icon: "paintBrush",
        path: "/producao/aerografia",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN],
        children: [
          {
            id: "aerografia-cadastrar",
            title: "Cadastrar",
            icon: "plus",
            path: "/producao/aerografia/cadastrar",
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          { id: "aerografia-detalhes", title: "Detalhes", icon: "eye", path: "/producao/aerografia/detalhes/:id", isDynamic: true },
          {
            id: "aerografia-editar",
            title: "Editar",
            icon: "edit",
            path: "/producao/aerografia/editar/:id",
            isDynamic: true,
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          { id: "aerografia-listar", title: "Listar", icon: "list", path: "/producao/aerografia/listar" },
        ],
      },

      {
        id: "cronograma",
        title: "Cronograma",
        icon: "clock",
        path: "/producao/cronograma",
        children: [
          {
            id: "cronograma-detalhes",
            title: "Detalhes",
            icon: "eye",
            path: "/producao/cronograma/detalhes/:id",
            isDynamic: true,
          },
          {
            id: "cronograma-editar",
            title: "Editar",
            icon: "edit",
            path: "/producao/cronograma/editar/:id",
            isDynamic: true,
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          {
            id: "cronograma-cadastrar",
            title: "Nova Tarefa",
            icon: "plus",
            path: "/producao/cronograma/cadastrar",
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          { id: "cronograma-listar", title: "Listar", icon: "list", path: "/producao/cronograma/listar" },
        ],
      },

      {
        id: "cronograma-em-espera",
        title: "Em Espera",
        icon: "pause",
        path: "/producao/em-espera",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN],
      },

      {
        id: "garagens",
        title: "Garagens",
        icon: "warehouse",
        path: "/producao/garagens",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN],
        children: [
          {
            id: "garagens-cadastrar",
            title: "Cadastrar",
            icon: "plus",
            path: "/producao/garagens/cadastrar",
            requiredPrivilege: [SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN],
          },
          {
            id: "garagens-detalhes",
            title: "Detalhes",
            icon: "eye",
            path: "/producao/garagens/detalhes/:id",
            isDynamic: true,
          },
          {
            id: "garagens-editar",
            title: "Editar",
            icon: "edit",
            path: "/producao/garagens/editar/:id",
            isDynamic: true,
            requiredPrivilege: [SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN],
          },
          { id: "garagens-listar", title: "Listar", icon: "list", path: "/producao/garagens/listar" },
        ],
      },

      {
        id: "historico",
        title: "Histórico",
        icon: "history",
        path: "/producao/historico",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      },

      {
        id: "observacoes",
        title: "Observações",
        icon: "note",
        path: "/producao/observacoes",
        children: [
          {
            id: "observacoes-cadastrar",
            title: "Cadastrar",
            icon: "plus",
            path: "/producao/observacoes/cadastrar",
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          { id: "observacoes-detalhes", title: "Detalhes", icon: "eye", path: "/producao/observacoes/detalhes/:id", isDynamic: true },
          {
            id: "observacoes-editar",
            title: "Editar",
            icon: "edit",
            path: "/producao/observacoes/editar/:id",
            isDynamic: true,
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          { id: "observacoes-listar", title: "Listar", icon: "list", path: "/producao/observacoes/listar" },
        ],
      },

      {
        id: "recorte",
        title: "Recorte",
        icon: "scissors",
        path: "/producao/recorte",
        requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN],
        children: [
          { id: "recorte-listar", title: "Listar", icon: "list", path: "/producao/recorte/listar" },
          {
            id: "recorte-plano",
            title: "Plano de Corte",
            icon: "scissors",
            path: "/producao/recorte/plano-de-corte",
            children: [
              { id: "plano-corte-listar", title: "Listar", icon: "list", path: "/producao/recorte/plano-de-corte/listar" },
              { id: "plano-corte-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/recorte/plano-de-corte/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
              { id: "plano-corte-detalhes", title: "Detalhes", icon: "eye", path: "/producao/recorte/plano-de-corte/detalhes/:id", isDynamic: true },
              { id: "plano-corte-editar", title: "Editar", icon: "edit", path: "/producao/recorte/plano-de-corte/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
            ],
          },
          {
            id: "recorte-requisicao",
            title: "Requisição de Corte",
            icon: "clipboardList",
            path: "/producao/recorte/requisicao-de-recorte",
            children: [
              { id: "requisicao-recorte-listar", title: "Listar", icon: "list", path: "/producao/recorte/requisicao-de-recorte/listar" },
              { id: "requisicao-recorte-cadastrar", title: "Cadastrar", icon: "plus", path: "/producao/recorte/requisicao-de-recorte/cadastrar", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
              { id: "requisicao-recorte-detalhes", title: "Detalhes", icon: "eye", path: "/producao/recorte/requisicao-de-recorte/detalhes/:id", isDynamic: true },
              { id: "requisicao-recorte-editar", title: "Editar", icon: "edit", path: "/producao/recorte/requisicao-de-recorte/editar/:id", isDynamic: true, requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
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
    path: "/human-resources",
    requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES],
    children: [
      {
        id: "warnings",
        title: "Advertências",
        icon: "announcement",
        path: "/human-resources/warnings",
        children: [
          { id: "warnings-cadastrar", title: "Cadastrar", icon: "plus", path: "/human-resources/warnings/create" },
          { id: "warnings-detalhes", title: "Detalhes", icon: "eye", path: "/human-resources/warnings/details/:id", isDynamic: true },
          { id: "warnings-editar", title: "Editar", icon: "edit", path: "/human-resources/warnings/edit/:id", isDynamic: true },
          { id: "warnings-listar", title: "Listar", icon: "list", path: "/human-resources/warnings/list" },
        ],
      },
      {
        id: "calculos",
        title: "Cálculos",
        icon: "dollarSign",
        path: "/human-resources/calculations",
      },
      {
        id: "cargos",
        title: "Cargos",
        icon: "briefcase",
        path: "/human-resources/positions",
        children: [
          { id: "cargos-cadastrar", title: "Cadastrar", icon: "plus", path: "/human-resources/positions/create", requiredPrivilege: SECTOR_PRIVILEGES.ADMIN },
          { id: "cargos-detalhes", title: "Detalhes", icon: "eye", path: "/human-resources/positions/details/:id", isDynamic: true },
          { id: "cargos-editar", title: "Editar", icon: "edit", path: "/human-resources/positions/edit/:id", isDynamic: true },
          { id: "cargos-listar", title: "Listar", icon: "list", path: "/human-resources/positions/list" },
        ],
      },
      {
        id: "controle-ponto",
        title: "Controle de Ponto",
        icon: "clock",
        path: "/human-resources/time-clock",
      },

      {
        id: "epi-rh",
        title: "EPI",
        icon: "safety",
        path: "/human-resources/ppe",
        children: [
          {
            id: "epi-rh-agendamentos",
            title: "Agendamentos",
            icon: "schedule",
            path: "/human-resources/ppe/schedules",
            children: [
              {
                id: "epi-rh-agendamentos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/human-resources/ppe/schedules/create",
              },
              { id: "epi-rh-agendamentos-detalhes", title: "Detalhes", icon: "eye", path: "/human-resources/ppe/schedules/details/:id", isDynamic: true },
              {
                id: "epi-rh-agendamentos-editar",
                title: "Editar",
                icon: "edit",
                path: "/human-resources/ppe/schedules/edit/:id",
                isDynamic: true,
              },
              { id: "epi-rh-agendamentos-listar", title: "Listar", icon: "list", path: "/human-resources/ppe/schedules/list" },
            ],
          },
          { id: "epi-rh-cadastrar", title: "Cadastrar", icon: "plus", path: "/human-resources/ppe/create" },
          { id: "epi-rh-detalhes", title: "Detalhes", icon: "eye", path: "/human-resources/ppe/details/:id", isDynamic: true },
          { id: "epi-rh-editar", title: "Editar", icon: "edit", path: "/human-resources/ppe/edit/:id", isDynamic: true },
          { id: "epi-rh-listar", title: "Listar", icon: "list", path: "/human-resources/ppe/list" },

          {
            id: "epi-rh-entregas",
            title: "Entregas",
            icon: "truck",
            path: "/human-resources/ppe/deliveries",
            children: [
              {
                id: "epi-rh-entregas-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/human-resources/ppe/deliveries/create",
              },
              { id: "epi-rh-entregas-detalhes", title: "Detalhes", icon: "eye", path: "/human-resources/ppe/deliveries/details/:id", isDynamic: true },
              { id: "epi-rh-entregas-editar", title: "Editar", icon: "edit", path: "/human-resources/ppe/deliveries/edit/:id", isDynamic: true },
              { id: "epi-rh-entregas-listar", title: "Listar", icon: "list", path: "/human-resources/ppe/deliveries/list" },
            ],
          },

          {
            id: "epi-rh-tamanhos",
            title: "Tamanhos",
            icon: "sizes",
            path: "/human-resources/ppe/sizes",
            children: [
              {
                id: "epi-rh-tamanhos-cadastrar",
                title: "Cadastrar",
                icon: "plus",
                path: "/human-resources/ppe/sizes/create",
              },
              { id: "epi-rh-tamanhos-editar", title: "Editar", icon: "edit", path: "/human-resources/ppe/sizes/edit/:id", isDynamic: true },
              { id: "epi-rh-tamanhos-listar", title: "Listar", icon: "list", path: "/human-resources/ppe/sizes/list" },
            ],
          },
        ],
      },

      {
        id: "feriados",
        title: "Feriados",
        icon: "calendar",
        path: "/human-resources/holidays",
        children: [
          { id: "feriados-cadastrar", title: "Cadastrar", icon: "plus", path: "/human-resources/holidays/create" },
          { id: "feriados-editar", title: "Editar", icon: "edit", path: "/human-resources/holidays/edit/:id", isDynamic: true },
          { id: "feriados-listar", title: "Listar", icon: "list", path: "/human-resources/holidays/list" },
        ],
      },

      {
        id: "ferias",
        title: "Férias",
        icon: "calendar",
        path: "/human-resources/vacations",
        children: [
          { id: "ferias-cadastrar", title: "Cadastrar", icon: "plus", path: "/human-resources/vacations/create" },
          { id: "ferias-detalhes", title: "Detalhes", icon: "eye", path: "/human-resources/vacations/details/:id", isDynamic: true },
          { id: "ferias-listar", title: "Listar", icon: "list", path: "/human-resources/vacations/list" },
        ],
      },

      {
        id: "folha-de-pagamento",
        title: "Folha de Pagamento",
        icon: "payroll",
        path: "/human-resources/payroll",
      },
      {
        id: "niveis-desempenho",
        title: "Níveis de Desempenho",
        icon: "trendingUp",
        path: "/human-resources/performance-levels",
      },
      {
        id: "requisicoes",
        title: "Requisições",
        icon: "clipboardList",
        path: "/human-resources/requisitions",
      },
      {
        id: "simulacao-bonus",
        title: "Simulação de Bônus",
        icon: "calculator",
        path: "/human-resources/bonus-simulation",
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
        id: "servidor-backup",
        title: "Backup do Sistema",
        icon: "databaseImport",
        path: "/servidor/backup",
      },
      {
        id: "registros-de-alteracoes",
        title: "Registros de Alterações",
        icon: "auditLog",
        path: "/servidor/registros-de-alteracoes/listar",
      },
      {
        id: "servidor-implantacoes",
        title: "Implantações",
        icon: "rocket",
        path: "/servidor/implantacoes",
        children: [
          { id: "servidor-implantacoes-cadastrar", title: "Cadastrar", icon: "plus", path: "/servidor/implantacoes/cadastrar" },
          { id: "servidor-implantacoes-detalhes", title: "Detalhes", icon: "eye", path: "/servidor/implantacoes/detalhes/:id", isDynamic: true },
        ],
      },
      {
        id: "servidor-logs",
        title: "Logs do Sistema",
        icon: "systemLogs",
        path: "/servidor/logs",
      },
      {
        id: "servidor-metricas",
        title: "Métricas do Sistema",
        icon: "systemMetrics",
        path: "/servidor/metricas",
      },
      {
        id: "servidor-pastas-compartilhadas",
        title: "Pastas Compartilhadas",
        icon: "sharedFolders",
        path: "/servidor/pastas-compartilhadas",
      },
      {
        id: "servidor-servicos",
        title: "Serviços do Sistema",
        icon: "services",
        path: "/servidor/servicos",
      },
      {
        id: "servidor-usuarios",
        title: "Usuários do Sistema",
        icon: "systemUsers",
        path: "/servidor/usuarios",
        children: [{ id: "servidor-usuarios-cadastrar", title: "Criar Usuário", icon: "plus", path: "/servidor/usuarios/cadastrar" }],
      },
    ],
  },
];

// Export the menu items for use in applications
export const MENU_ITEMS = NAVIGATION_MENU;
