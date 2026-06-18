import { router } from 'expo-router';
import type { Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEB_BASE_URL, WEB_DOMAIN, WEB_DOMAIN_WWW } from '../config/urls';

// =====================================================
// Route Mapping Configuration
// =====================================================

/**
 * Maps entity types to their corresponding mobile routes
 * This ensures consistent navigation across the app
 */
export const ROUTE_MAP = {
  // Production Routes
  // Task uses unified route that works regardless of task status (agenda/cronograma/historico)
  Task: '/(tabs)/producao/tarefa/[id]',
  ServiceOrder: '/(tabs)/producao/ordens-de-servico/detalhes/[id]',
  Airbrushing: '/(tabs)/producao/aerografia/detalhes/[id]',
  Cut: '/(tabs)/producao/recorte/detalhes/[id]',
  Observation: '/(tabs)/producao/observacoes/detalhes/[id]',
  Paint: '/(tabs)/producao/tintas/detalhes/[id]',

  // Inventory Routes
  Order: '/(tabs)/estoque/pedidos/detalhes/[id]',
  Item: '/(tabs)/estoque/produtos/detalhes/[id]',
  Borrow: '/(tabs)/estoque/emprestimos/detalhes/[id]',
  ExternalOperation: '/(tabs)/estoque/operacoes-externas/detalhes/[id]',
  Maintenance: '/(tabs)/estoque/manutencao/detalhes/[id]',
  Activity: '/(tabs)/estoque/movimentacoes/detalhes/[id]',
  Supplier: '/(tabs)/estoque/fornecedores/detalhes/[id]',
  Brand: '/(tabs)/estoque/produtos/marcas/detalhes/[id]',
  Category: '/(tabs)/estoque/produtos/categorias/detalhes/[id]',

  // HR Routes
  Employee: '/(tabs)/recursos-humanos/funcionarios/detalhes/[id]',
  Bonus: '/(tabs)/recursos-humanos/bonus/detalhes/[id]',
  Warning: '/(tabs)/recursos-humanos/advertencias/detalhes/[id]',
  Holiday: '/(tabs)/recursos-humanos/feriados/detalhes/[id]',
  TimeRecord: '/(tabs)/recursos-humanos/controle-ponto/detalhes/[id]',
  Position: '/(tabs)/recursos-humanos/cargos/detalhes/[id]',
  Vacation: '/(tabs)/recursos-humanos/ferias/detalhes/[id]',
  // Coletiva (vacation-group) is retired from the UI; map to the same individual
  // vacation detail so legacy notifications still resolve.
  VacationGroup: '/(tabs)/recursos-humanos/ferias/detalhes/[id]',
  Leave: '/(tabs)/recursos-humanos/medicina/afastamentos/detalhes/[id]',
  Termination: '/(tabs)/recursos-humanos/rescisoes/detalhes/[id]',
  Admission: '/(tabs)/recursos-humanos/admissoes/detalhes/[id]',

  // Administration Routes
  User: '/(tabs)/administracao/usuarios/detalhes/[id]',
  Customer: '/(tabs)/administracao/clientes/detalhes/[id]',
  Sector: '/(tabs)/administracao/setores/detalhes/[id]',
  Notification: '/(tabs)/administracao/notificacoes/detalhes/[id]',
  ChangeLog: '/(tabs)/administracao/registros-de-alteracoes/detalhes/[id]',

  // Painting Routes
  PaintFormula: '/(tabs)/pintura/formulas/detalhes/[id]',
  PaintCatalog: '/(tabs)/pintura/catalogo/detalhes/[id]',
  PaintBrand: '/(tabs)/pintura/marcas-de-tinta/detalhes/[id]',
  PaintProduction: '/(tabs)/pintura/producoes/detalhes/[id]',

  // Personal Routes (Employee's own data)
  MyBonus: '/(tabs)/pessoal/meu-bonus/detalhes/[id]',
  MyBorrow: '/(tabs)/pessoal/meus-emprestimos/detalhes/[id]',
  MyWarning: '/(tabs)/pessoal/minhas-advertencias/detalhes/[id]',
  MyHoliday: '/(tabs)/pessoal/meus-feriados/detalhes/[id]',
  MyNotification: '/(tabs)/pessoal/minhas-notificacoes/detalhes/[id]',
  PpeDelivery: '/(tabs)/pessoal/meus-epis/detalhes/[id]',

  // Catalog
  CatalogItem: '/(tabs)/catalogo/detalhes/[id]',

  // Financial
  FinancialCustomer: '/(tabs)/financeiro/clientes/detalhes/[id]',

  // Message (personal inbox - list route, no [id] segment)
  Message: '/(tabs)/pessoal/minhas-mensagens',
  // Questionnaire (self-fill, personal domain - list route, no [id] segment)
  Questionnaire: '/(tabs)/pessoal/questionarios',
  // Assessment / competency evaluation (no dedicated mobile detail page yet - notifications list)
  Assessment: '/(tabs)/pessoal/minhas-notificacoes',
  // Reconciliation run (no dedicated mobile page yet - notifications list)
  ReconciliationRun: '/(tabs)/pessoal/minhas-notificacoes',
  // Order schedule detail screen
  OrderSchedule: '/(tabs)/estoque/pedidos/agendamentos/detalhes/[id]',
  // Maintenance schedule detail screen
  MaintenanceSchedule: '/(tabs)/estoque/manutencao/agendamentos/detalhes/[id]',
  // Task quote / budget (id is the taskId; orcamento detail screen is detalhes/[taskId])
  TaskQuote: '/(tabs)/financeiro/orcamento/detalhes/[taskId]',
  // Secullum solicitation (RH approvers review under calculos; employee self-service is meus-pontos)
  SecullumSolicitacao: '/(tabs)/recursos-humanos/calculos',
  // Secullum assinatura — HR notification when an employee signs or rejects their cartão-ponto
  SecullumAssinatura: '/(tabs)/recursos-humanos/calculos',
  // Financial / billing (faturamento) detail screen
  Financial: '/(tabs)/financeiro/faturamento/detalhes/[id]',
  // NFS-e document detail screen
  NfseDocument: '/(tabs)/financeiro/notas-fiscais/detalhes/[id]',
  // Time entry / clock-in (personal screen, no [id] segment)
  TimeEntry: '/(tabs)/pessoal/meus-pontos',
  // Payroll (folha de pagamento list screen, no [id] segment)
  Payroll: '/(tabs)/recursos-humanos/folha-de-pagamento',
  // Secullum payroll (same folha de pagamento screen)
  SecullumPayroll: '/(tabs)/recursos-humanos/folha-de-pagamento',
  // Bank slip / fatura (id is the taskId for these notifications; faturamento detail is detalhes/[id])
  BankSlip: '/(tabs)/financeiro/faturamento/detalhes/[id]',
} as const;

/**
 * Maps list page types to their corresponding mobile routes
 * Used for navigating to list pages (e.g., from daily stock summary notification)
 * These routes don't require an [id] parameter
 */
export const LIST_ROUTE_MAP = {
  // Inventory List Pages
  items: '/(tabs)/estoque/produtos',
  orders: '/(tabs)/estoque/pedidos',
  suppliers: '/(tabs)/estoque/fornecedores',
  activities: '/(tabs)/estoque/movimentacoes',
  borrows: '/(tabs)/estoque/emprestimos',

  // Production List Pages
  tasks: '/(tabs)/producao/agenda',
  serviceOrders: '/(tabs)/producao/ordens-de-servico',

  // HR List Pages
  employees: '/(tabs)/recursos-humanos/funcionarios',

  // Administration List Pages
  users: '/(tabs)/administracao/usuarios',
  customers: '/(tabs)/administracao/clientes',
  notifications: '/(tabs)/pessoal/minhas-notificacoes',

  // Personal List Pages
  myPpes: '/(tabs)/pessoal/meus-epis',
} as const;

/**
 * Maps list page aliases to their route keys
 * Used for parsing list page deep links (without entity ID)
 */
export const LIST_ALIAS_MAP: Record<string, keyof typeof LIST_ROUTE_MAP> = {
  // Item/Product list
  items: 'items',
  produtos: 'items',
  products: 'items',

  // Order list
  orders: 'orders',
  pedidos: 'orders',

  // Task list
  tasks: 'tasks',
  tarefas: 'tasks',
  agenda: 'tasks',

  // Service Order list
  'service-orders': 'serviceOrders',
  'ordens-de-servico': 'serviceOrders',

  // Supplier list
  suppliers: 'suppliers',
  fornecedores: 'suppliers',

  // Activity/Movement list
  activities: 'activities',
  movimentacoes: 'activities',

  // Borrow list
  borrows: 'borrows',
  emprestimos: 'borrows',

  // Employee list
  employees: 'employees',
  funcionarios: 'employees',

  // User list
  users: 'users',
  usuarios: 'users',

  // Customer list
  customers: 'customers',
  clientes: 'customers',

  // Notifications list
  notifications: 'notifications',
  notificacoes: 'notifications',

};

/**
 * Maps simplified entity types to full entity types
 * Used for parsing shortened deep link URLs
 */
export const ENTITY_ALIAS_MAP: Record<string, keyof typeof ROUTE_MAP> = {
  // Uppercase variants for API compatibility (API sends TASK, ORDER, etc.)
  TASK: 'Task',
  ORDER: 'Order',
  SERVICE_ORDER: 'ServiceOrder',
  SERVICEORDER: 'ServiceOrder',
  AIRBRUSHING: 'Airbrushing',
  CUT: 'Cut',
  OBSERVATION: 'Observation',
  PAINT: 'Paint',
  ITEM: 'Item',
  BORROW: 'Borrow',
  EXTERNAL_OPERATION: 'ExternalOperation',
  EXTERNALOPERATION: 'ExternalOperation',
  MAINTENANCE: 'Maintenance',
  ACTIVITY: 'Activity',
  SUPPLIER: 'Supplier',
  EMPLOYEE: 'Employee',
  BONUS: 'Bonus',
  WARNING: 'Warning',
  HOLIDAY: 'Holiday',
  TIME_RECORD: 'TimeRecord',
  TIMERECORD: 'TimeRecord',
  VACATION: 'Vacation',
  VACATION_GROUP: 'VacationGroup',
  VACATIONGROUP: 'VacationGroup',
  LEAVE: 'Leave',
  TERMINATION: 'Termination',
  ADMISSION: 'Admission',
  USER: 'User',
  CUSTOMER: 'Customer',
  SECTOR: 'Sector',
  NOTIFICATION: 'Notification',
  CHANGE_LOG: 'ChangeLog',
  CHANGELOG: 'ChangeLog',
  PAINT_FORMULA: 'PaintFormula',
  PAINTFORMULA: 'PaintFormula',
  PAINT_CATALOG: 'PaintCatalog',
  PAINTCATALOG: 'PaintCatalog',
  PAINT_BRAND: 'PaintBrand',
  PAINTBRAND: 'PaintBrand',
  PAINT_PRODUCTION: 'PaintProduction',
  PAINTPRODUCTION: 'PaintProduction',
  BRAND: 'Brand',
  CATEGORY: 'Category',
  POSITION: 'Position',
  CATALOG_ITEM: 'CatalogItem',
  CATALOGITEM: 'CatalogItem',
  FINANCIAL_CUSTOMER: 'FinancialCustomer',
  FINANCIALCUSTOMER: 'FinancialCustomer',
  PPE_DELIVERY: 'PpeDelivery',
  PPEDELIVERY: 'PpeDelivery',
  MY_PPE: 'PpeDelivery',
  MYPPE: 'PpeDelivery',
  MESSAGE: 'Message',
  QUESTIONNAIRE: 'Questionnaire',
  ASSESSMENT: 'Assessment',
  RECONCILIATION_RUN: 'ReconciliationRun',
  RECONCILIATIONRUN: 'ReconciliationRun',
  ORDER_SCHEDULE: 'OrderSchedule',
  ORDERSCHEDULE: 'OrderSchedule',
  TASK_QUOTE: 'TaskQuote',
  TASKQUOTE: 'TaskQuote',
  SECULLUM_SOLICITACAO: 'SecullumSolicitacao',
  SECULLUMSOLICITACAO: 'SecullumSolicitacao',
  SECULLUM_ASSINATURA: 'SecullumAssinatura',
  PAYROLL: 'Payroll',
  SECULLUM_PAYROLL: 'SecullumPayroll',
  SECULLUMPAYROLL: 'SecullumPayroll',
  BANK_SLIP: 'BankSlip',
  BANKSLIP: 'BankSlip',
  FINANCIAL: 'Financial',
  TIME_ENTRY: 'TimeEntry',
  TIMEENTRY: 'TimeEntry',
  MAINTENANCE_SCHEDULE: 'MaintenanceSchedule',
  MAINTENANCESCHEDULE: 'MaintenanceSchedule',
  NFSE: 'NfseDocument',
  NFSE_DOCUMENT: 'NfseDocument',
  NFSEDOCUMENT: 'NfseDocument',

  // PascalCase variants (for direct entity type matching)
  Task: 'Task',
  Order: 'Order',
  ServiceOrder: 'ServiceOrder',
  Airbrushing: 'Airbrushing',
  Cut: 'Cut',
  Observation: 'Observation',
  Paint: 'Paint',
  Item: 'Item',
  Borrow: 'Borrow',
  ExternalOperation: 'ExternalOperation',
  Maintenance: 'Maintenance',
  Activity: 'Activity',
  Supplier: 'Supplier',
  Employee: 'Employee',
  Bonus: 'Bonus',
  Warning: 'Warning',
  Holiday: 'Holiday',
  TimeRecord: 'TimeRecord',
  Vacation: 'Vacation',
  VacationGroup: 'VacationGroup',
  Leave: 'Leave',
  Termination: 'Termination',
  Admission: 'Admission',
  User: 'User',
  Customer: 'Customer',
  Sector: 'Sector',
  Notification: 'Notification',
  ChangeLog: 'ChangeLog',
  PaintFormula: 'PaintFormula',
  PaintCatalog: 'PaintCatalog',
  PaintBrand: 'PaintBrand',
  PaintProduction: 'PaintProduction',
  Brand: 'Brand',
  Category: 'Category',
  Position: 'Position',
  CatalogItem: 'CatalogItem',
  FinancialCustomer: 'FinancialCustomer',
  PpeDelivery: 'PpeDelivery',
  MyPpe: 'PpeDelivery',
  Message: 'Message',
  Questionnaire: 'Questionnaire',
  Assessment: 'Assessment',
  ReconciliationRun: 'ReconciliationRun',
  OrderSchedule: 'OrderSchedule',
  MaintenanceSchedule: 'MaintenanceSchedule',
  TaskQuote: 'TaskQuote',
  SecullumSolicitacao: 'SecullumSolicitacao',
  SecullumAssinatura: 'SecullumAssinatura',
  Payroll: 'Payroll',
  SecullumPayroll: 'SecullumPayroll',
  BankSlip: 'BankSlip',
  Financial: 'Financial',
  TimeEntry: 'TimeEntry',
  NfseDocument: 'NfseDocument',

  // Lowercase variants (existing)
  task: 'Task',
  tasks: 'Task',
  'service-order': 'ServiceOrder',
  'service-orders': 'ServiceOrder',
  'ordem-servico': 'ServiceOrder',
  airbrushing: 'Airbrushing',
  aerografia: 'Airbrushing',
  cut: 'Cut',
  cuts: 'Cut',
  recorte: 'Cut',
  observation: 'Observation',
  observations: 'Observation',
  observacao: 'Observation',
  observacoes: 'Observation',
  paint: 'Paint',
  paints: 'Paint',
  tinta: 'Paint',
  tintas: 'Paint',
  order: 'Order',
  orders: 'Order',
  pedido: 'Order',
  pedidos: 'Order',
  item: 'Item',
  items: 'Item',
  produto: 'Item',
  produtos: 'Item',
  borrow: 'Borrow',
  borrows: 'Borrow',
  emprestimo: 'Borrow',
  emprestimos: 'Borrow',
  withdrawal: 'ExternalOperation',
  withdrawals: 'ExternalOperation',
  'external-operation': 'ExternalOperation',
  retirada: 'ExternalOperation',
  retiradas: 'ExternalOperation',
  maintenance: 'Maintenance',
  manutencao: 'Maintenance',
  activity: 'Activity',
  activities: 'Activity',
  movimentacao: 'Activity',
  movimentacoes: 'Activity',
  supplier: 'Supplier',
  suppliers: 'Supplier',
  fornecedor: 'Supplier',
  fornecedores: 'Supplier',
  employee: 'Employee',
  employees: 'Employee',
  funcionario: 'Employee',
  funcionarios: 'Employee',
  bonus: 'Bonus',
  warning: 'Warning',
  warnings: 'Warning',
  advertencia: 'Warning',
  advertencias: 'Warning',
  holiday: 'Holiday',
  holidays: 'Holiday',
  feriado: 'Holiday',
  feriados: 'Holiday',
  vacation: 'Vacation',
  vacations: 'Vacation',
  feria: 'Vacation',
  ferias: 'Vacation',
  'vacation-group': 'VacationGroup',
  leave: 'Leave',
  leaves: 'Leave',
  afastamento: 'Leave',
  afastamentos: 'Leave',
  termination: 'Termination',
  terminations: 'Termination',
  rescisao: 'Termination',
  rescisoes: 'Termination',
  admission: 'Admission',
  admissions: 'Admission',
  admissao: 'Admission',
  admissoes: 'Admission',
  user: 'User',
  users: 'User',
  usuario: 'User',
  usuarios: 'User',
  customer: 'Customer',
  customers: 'Customer',
  cliente: 'Customer',
  clientes: 'Customer',
  sector: 'Sector',
  sectors: 'Sector',
  setor: 'Sector',
  setores: 'Sector',
  notification: 'Notification',
  notifications: 'Notification',
  notificacao: 'Notification',
  notificacoes: 'Notification',

  // PPE routes
  'ppe-delivery': 'PpeDelivery',
  'ppe-deliveries': 'PpeDelivery',
  ppe_delivery: 'PpeDelivery',
  ppe_deliveries: 'PpeDelivery',
  'entrega-epi': 'PpeDelivery',
  'entregas-epi': 'PpeDelivery',
  'meu-epi': 'PpeDelivery',
  'meus-epis': 'PpeDelivery',

  // Message routes
  message: 'Message',
  messages: 'Message',
  mensagem: 'Message',
  mensagens: 'Message',

  // Questionnaire routes
  questionnaire: 'Questionnaire',
  questionnaires: 'Questionnaire',
  questionario: 'Questionnaire',
  questionarios: 'Questionnaire',

  // Assessment / competency evaluation routes
  assessment: 'Assessment',
  assessments: 'Assessment',
  avaliacao: 'Assessment',
  avaliacoes: 'Assessment',

  // Reconciliation run routes
  'reconciliation-run': 'ReconciliationRun',
  reconciliationrun: 'ReconciliationRun',
  conciliacao: 'ReconciliationRun',

  // Order schedule routes
  'order-schedule': 'OrderSchedule',
  orderschedule: 'OrderSchedule',
  'agendamento-pedido': 'OrderSchedule',
  'agendamentos-pedido': 'OrderSchedule',

  // Task quote / budget routes
  'task-quote': 'TaskQuote',
  taskquote: 'TaskQuote',
  orcamento: 'TaskQuote',
  orcamentos: 'TaskQuote',

  // Secullum solicitation routes
  'secullum-solicitacao': 'SecullumSolicitacao',
  secullumsolicitacao: 'SecullumSolicitacao',
  secullum: 'SecullumSolicitacao',

  // Payroll routes (folha de pagamento screen)
  payroll: 'Payroll',
  'folha-de-pagamento': 'Payroll',
  'folha-pagamento': 'Payroll',
  'secullum-payroll': 'SecullumPayroll',
  secullum_payroll: 'SecullumPayroll',
  secullumpayroll: 'SecullumPayroll',

  // Bank slip / fatura routes (id is the parent taskId; faturamento detail screen)
  'bank-slip': 'BankSlip',
  bank_slip: 'BankSlip',
  bankslip: 'BankSlip',
  fatura: 'BankSlip',
  faturas: 'BankSlip',
  boleto: 'BankSlip',
  boletos: 'BankSlip',

  // Financial / billing routes
  financial: 'Financial',
  faturamento: 'Financial',

  // Time entry / clock-in routes
  'time-entry': 'TimeEntry',
  time_entry: 'TimeEntry',
  timeentry: 'TimeEntry',
  'meus-pontos': 'TimeEntry',

  // Maintenance schedule routes
  'maintenance-schedule': 'MaintenanceSchedule',
  maintenance_schedule: 'MaintenanceSchedule',
  maintenanceschedule: 'MaintenanceSchedule',
  'agendamento-manutencao': 'MaintenanceSchedule',

  // Order schedule underscore variant
  order_schedule: 'OrderSchedule',

  // NFS-e document routes
  nfse: 'NfseDocument',
  'nfse-document': 'NfseDocument',
  nfse_document: 'NfseDocument',
  nfsedocument: 'NfseDocument',
  'nota-fiscal': 'NfseDocument',
  'notas-fiscais': 'NfseDocument',
};

// =====================================================
// Deep Link Parsing
// =====================================================

export interface ParsedDeepLink {
  route: string;
  params?: Record<string, any>;
  requiresAuth?: boolean;
}

/**
 * Replaces the dynamic segment of a route template with a concrete id.
 *
 * Most routes use the `[id]` param, but some screens declare a differently
 * named param (e.g. orcamento uses `detalhes/[taskId]`). A naive
 * `route.replace('[id]', id)` would leave a literal `[taskId]` segment and the
 * navigation would fail. This helper substitutes whichever single `[param]`
 * token the route declares so the resolved path matches the actual screen file.
 */
export function fillRouteParam(route: string, id: string): string {
  // Replace any single [param] token (e.g. [id], [taskId], [orderId]) with the id.
  return route.replace(/\[[^/\]]+\]/, id);
}

/**
 * Custom URL parser for deep links
 * Handles both custom schemes (ankaadesign://) and HTTPS URLs
 */
function parseUrl(url: string): { hostname: string | null; path: string | null; queryParams: Record<string, any> } {
  try {
    // Remove leading/trailing whitespace
    url = url.trim();

    // Extract query parameters first
    const [urlWithoutQuery, queryString] = url.split('?');
    const queryParams: Record<string, any> = {};

    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      });
    }

    // Parse the main URL parts
    // Handle custom scheme (ankaadesign://...) and HTTPS
    const schemeMatch = urlWithoutQuery.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);

    if (schemeMatch) {
      const scheme = schemeMatch[1];
      const afterScheme = urlWithoutQuery.substring(schemeMatch[0].length);

      // Split into hostname and path
      const firstSlash = afterScheme.indexOf('/');

      let hostname: string | null = null;
      let path: string | null = null;

      if (firstSlash === -1) {
        // No path, just hostname (e.g., ankaadesign://notification)
        hostname = afterScheme || null;
      } else {
        // Has both hostname and path
        hostname = afterScheme.substring(0, firstSlash) || null;
        path = afterScheme.substring(firstSlash) || null;
      }

      return { hostname, path, queryParams };
    }

    // Fallback for malformed URLs
    return { hostname: null, path: urlWithoutQuery, queryParams };
  } catch (error) {
    console.error('[Deep Link] Error in parseUrl:', error);
    return { hostname: null, path: null, queryParams: {} };
  }
}

/**
 * Parses a deep link URL and extracts route and parameters
 *
 * Supported URL formats:
 * - Custom scheme: ankaadesign://producao/tasks/123
 * - Universal link: https://ankaadesign.com/app/producao/tasks/123
 * - Entity type: ankaadesign://task/123
 * - Notification: ankaadesign://notification?type=Task&id=123
 *
 * @param url - The deep link URL to parse
 * @returns Parsed route information with navigation params
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  try {
    console.log('[Deep Link] Parsing URL:', url);

    // Ignore Expo development URLs - they're not real deep links
    if (url.startsWith('exp://')) {
      console.log('[Deep Link] Ignoring Expo development URL');
      return { route: '', requiresAuth: false };
    }

    // Parse the URL
    const parsed = parseUrl(url);
    console.log('[Deep Link] Parsed URL:', JSON.stringify(parsed, null, 2));

    const { hostname, path, queryParams } = parsed;

    // Handle notification deep links
    if (hostname === 'notification' || path?.includes('notification')) {
      return parseNotificationLink(queryParams);
    }

    // Handle list page shortcuts (e.g., ankaadesign://items - without ID)
    // This is used for notifications that link to filtered list views
    if (hostname && LIST_ALIAS_MAP[hostname.toLowerCase()]) {
      const listKey = LIST_ALIAS_MAP[hostname.toLowerCase()];
      const listRoute = LIST_ROUTE_MAP[listKey];

      if (listRoute) {
        console.log('[Deep Link] List page shortcut matched:', { listKey, route: listRoute });
        return {
          route: listRoute,
          requiresAuth: true,
        };
      }
    }

    // Handle entity type shortcuts (e.g., ankaadesign://task/123)
    if (hostname && ENTITY_ALIAS_MAP[hostname.toLowerCase()]) {
      const entityType = ENTITY_ALIAS_MAP[hostname.toLowerCase()];
      const route = ROUTE_MAP[entityType];

      if (route && path) {
        const id = path.replace(/^\//, '').split('/')[0];
        if (id) {
          console.log('[Deep Link] Entity shortcut matched:', { entityType, id });
          return {
            route: fillRouteParam(route, id),
            params: { id },
            requiresAuth: true,
          };
        }
      }

      // If no path/ID provided, check if there's a list page for this entity
      // This handles cases like ankaadesign://item (without ID) → item list
      const singularToPlural: Record<string, string> = {
        item: 'items',
        order: 'orders',
        task: 'tasks',
        supplier: 'suppliers',
        activity: 'activities',
        borrow: 'borrows',
        employee: 'employees',
        user: 'users',
        customer: 'customers',
        notification: 'notifications',
      };

      const pluralAlias = singularToPlural[hostname.toLowerCase()];
      if (pluralAlias && LIST_ALIAS_MAP[pluralAlias]) {
        const listKey = LIST_ALIAS_MAP[pluralAlias];
        const listRoute = LIST_ROUTE_MAP[listKey];
        if (listRoute) {
          console.log('[Deep Link] Singular entity without ID → list page:', { listKey, route: listRoute });
          return {
            route: listRoute,
            requiresAuth: true,
          };
        }
      }
    }

    // Handle full path routes (e.g., ankaadesign://producao/tasks/123)
    if (path) {
      const pathSegments = path.replace(/^\//, '').split('/');

      // Web path pattern mapping for /section/page/detalhes/id format
      // These are web paths that don't follow the simple /section/entity/id pattern
      const WEB_PATH_TO_ENTITY: Record<string, keyof typeof ROUTE_MAP> = {
        // Task pages (cronograma, agenda, historico all lead to task detail)
        'producao/cronograma': 'Task',
        'producao/agenda': 'Task',
        'producao/historico': 'Task',
        'producao/tarefa': 'Task',
        // Item/Product pages
        'estoque/produtos': 'Item',
        'estoque/pedidos': 'Order',
        'estoque/emprestimos': 'Borrow',
        'estoque/fornecedores': 'Supplier',
        'estoque/movimentacoes': 'Activity',
        'estoque/manutencao': 'Maintenance',
        'estoque/operacoes-externas': 'ExternalOperation',
        // Pre-rename URLs (retiradas externas) resolve to the renamed screen
        'estoque/retiradas-externas': 'ExternalOperation',
        // HR pages
        'recursos-humanos/funcionarios': 'Employee',
        'recursos-humanos/bonus': 'Bonus',
        'recursos-humanos/advertencias': 'Warning',
        // Web "avisos" pages are warnings (mobile screen is advertencias)
        'recursos-humanos/avisos': 'Warning',
        'recursos-humanos/feriados': 'Holiday',
        'recursos-humanos/folha-de-pagamento': 'Payroll',
        // Administration pages
        'administracao/usuarios': 'User',
        'administracao/clientes': 'Customer',
        'administracao/setores': 'Sector',
        'administracao/notificacoes': 'Notification',
        // Painting pages
        'pintura/formulas': 'PaintFormula',
        'pintura/catalogo': 'PaintCatalog',
        'pintura/marcas-de-tinta': 'PaintBrand',
        'pintura/producoes': 'PaintProduction',
        // Financial pages
        'financeiro/faturamento': 'Financial',
        'financeiro/orcamento': 'TaskQuote',
        'financeiro/notas-fiscais': 'NfseDocument',
        // No dedicated reconciliation screen on mobile — notifications list
        'financeiro/conciliacao': 'ReconciliationRun',
        // Personal pages (employee's own data)
        'pessoal/meus-pontos': 'TimeEntry',
        'pessoal/mensagens': 'Message',
        'pessoal/minhas-mensagens': 'Message',
        'pessoal/minhas-advertencias': 'MyWarning',
        'pessoal/questionarios': 'Questionnaire',
        'pessoal/meus-epis': 'PpeDelivery',
      };

      // Special cases for 3-segment web paths that the generic 2-segment
      // lookup would mis-parse (e.g. /estoque/pedidos/agendamentos/detalhes/:id
      // would match 'estoque/pedidos' → Order with id='agendamentos').
      if (pathSegments.length >= 3) {
        const twoKey = `${pathSegments[0]}/${pathSegments[1]}`.toLowerCase();
        const seg2 = pathSegments[2]?.toLowerCase();
        const sub = pathSegments[3];
        const subId = sub === 'detalhes' || sub === 'details' ? pathSegments[4] : sub;

        // Order/Maintenance schedule pages
        if (seg2 === 'agendamentos') {
          const SCHEDULE_ENTITY: Record<string, keyof typeof ROUTE_MAP> = {
            'estoque/pedidos': 'OrderSchedule',
            'estoque/manutencao': 'MaintenanceSchedule',
          };
          const scheduleEntity = SCHEDULE_ENTITY[twoKey];
          if (scheduleEntity) {
            const scheduleRoute = ROUTE_MAP[scheduleEntity];
            if (subId) {
              console.log('[Deep Link] Schedule web path matched:', { twoKey, scheduleEntity, id: subId });
              return {
                route: fillRouteParam(scheduleRoute, subId),
                params: { id: subId },
                requiresAuth: true,
              };
            }
            // No id — fall back to the agendamentos list screen
            const scheduleListRoute = scheduleRoute.replace(/\/detalhes\/\[[^\]]+\]$/, '');
            console.log('[Deep Link] Schedule web path matched (no id, list):', { twoKey, scheduleListRoute });
            return { route: scheduleListRoute, requiresAuth: true };
          }
        }

        // PPE delivery admin pages: /estoque/epi/entregas[/detalhes/:id]
        if (`${twoKey}/${seg2}` === 'estoque/epi/entregas') {
          if (subId) {
            console.log('[Deep Link] PPE delivery web path matched:', { id: subId });
            return {
              route: `/(tabs)/estoque/epi/entregas/detalhes/${subId}`,
              params: { id: subId },
              requiresAuth: true,
            };
          }
          return { route: '/(tabs)/estoque/epi/entregas', requiresAuth: true };
        }
      }

      // Try to match web path patterns: /section/page[/detalhes/:id | /:id]
      if (pathSegments.length >= 2) {
        const webPathKey = `${pathSegments[0]}/${pathSegments[1]}`;
        const entityType = WEB_PATH_TO_ENTITY[webPathKey.toLowerCase()];

        if (entityType) {
          const route = ROUTE_MAP[entityType];
          // The literal 'detalhes'/'details' segment is NOT the id —
          // for /section/page/detalhes/:id the id is at index 3.
          const sub = pathSegments[2];
          const id = sub === 'detalhes' || sub === 'details' ? pathSegments[3] : sub;

          if (id && route.includes('[')) {
            console.log('[Deep Link] Web path pattern matched:', { webPathKey, entityType, id });
            return {
              route: fillRouteParam(route, id),
              params: { id },
              requiresAuth: true,
            };
          }

          // No id (or static route): navigate to the list/personal screen
          if (!route.includes('[')) {
            console.log('[Deep Link] Web path matched (static route):', { webPathKey, entityType, route });
            return { route, requiresAuth: true };
          }

          // Detail route but no id in the path — fall back to the parent list screen
          const listRoute = route.replace(/\/detalhes\/\[[^\]]+\]$/, '');
          if (!listRoute.includes('[')) {
            console.log('[Deep Link] Web path matched (no id, parent list):', { webPathKey, entityType, listRoute });
            return { route: listRoute, requiresAuth: true };
          }
        }
      }

      // Fallback: Try to match simpler path patterns (/section/entity/id or /section/entity/detalhes/id)
      if (pathSegments.length >= 2) {
        const section = pathSegments[0]; // e.g., 'producao', 'estoque', 'inventory'
        const entityPath = pathSegments[1]; // e.g., 'tasks', 'orders'
        // The literal 'detalhes'/'details' segment is NOT the id
        const id =
          pathSegments[2] === 'detalhes' || pathSegments[2] === 'details'
            ? pathSegments[3]
            : pathSegments[2]; // entity ID

        // Try to find matching route
        const entityType = ENTITY_ALIAS_MAP[entityPath.toLowerCase()];
        if (entityType && id) {
          const route = ROUTE_MAP[entityType];
          console.log('[Deep Link] Path pattern matched:', { section, entityPath, entityType, id });

          return {
            route: fillRouteParam(route, id),
            params: { id },
            requiresAuth: true,
          };
        }
      }
    }

    // Handle web universal links (https://<domain>/...)
    if (hostname === WEB_DOMAIN || hostname === WEB_DOMAIN_WWW) {
      // Handle paths with /app/ prefix
      if (path?.startsWith('/app/')) {
        const appPath = path.replace('/app/', '');
        return parseDeepLink(`ankaadesign://${appPath}`);
      }
      // Handle direct paths without /app/ prefix
      if (path && path !== '/') {
        const appPath = path.replace(/^\//, '');
        return parseDeepLink(`ankaadesign://${appPath}`);
      }
    }

    console.warn('[Deep Link] No route matched for URL:', url);

    // Default fallback to home
    return { route: '/(tabs)', requiresAuth: false };
  } catch (error) {
    console.error('[Deep Link] Error parsing URL:', error);
    return { route: '/(tabs)', requiresAuth: false };
  }
}

/**
 * Parses notification-specific deep links
 * Format: ankaadesign://notification?type=Task&id=123
 */
function parseNotificationLink(queryParams?: Record<string, any>): ParsedDeepLink {
  if (!queryParams || !queryParams.type || !queryParams.id) {
    console.warn('[Deep Link] Invalid notification link params:', queryParams);
    return { route: '/(tabs)/pessoal/minhas-notificacoes', requiresAuth: true };
  }

  const entityType = queryParams.type as keyof typeof ROUTE_MAP;
  const id = queryParams.id;

  const route = ROUTE_MAP[entityType];
  if (route) {
    console.log('[Deep Link] Notification link matched:', { entityType, id });
    return {
      route: fillRouteParam(route, id),
      params: { id },
      requiresAuth: true,
    };
  }

  // Fallback to notifications list
  return { route: '/(tabs)/pessoal/minhas-notificacoes', requiresAuth: true };
}

// =====================================================
// Deep Link Navigation
// =====================================================

const PENDING_DEEP_LINK_KEY = '@ankaa/pending_deep_link';

/**
 * Handles navigation for a deep link URL
 * If user is not authenticated and route requires auth, stores the link for later
 *
 * @param url - The deep link URL to navigate to
 * @param isAuthenticated - Whether the user is currently authenticated
 */
export async function handleDeepLink(url: string, isAuthenticated: boolean = false) {
  try {
    console.log('[Deep Link] Handling URL:', url, 'Auth:', isAuthenticated);

    const { route, params, requiresAuth } = parseDeepLink(url);

    // If route is empty, the URL should be ignored (e.g., Expo dev URLs)
    if (!route) {
      console.log('[Deep Link] Ignoring URL - no route to navigate');
      return;
    }

    // If route requires auth but user is not authenticated
    if (requiresAuth && !isAuthenticated) {
      console.log('[Deep Link] Storing pending deep link for after login');
      await storePendingDeepLink(url);

      // Navigate to login
      router.replace('/(autenticacao)/login' as Href);
      return;
    }

    // Navigate to the parsed route
    console.log('[Deep Link] Navigating to:', route, 'Params:', params);

    if (params) {
      router.push({ pathname: route, params } as Href);
    } else {
      router.push(route as Href);
    }
  } catch (error) {
    console.error('[Deep Link] Error handling deep link:', error);
    // Fallback to home on error
    router.push('/(tabs)' as Href);
  }
}

/**
 * Stores a pending deep link to be processed after user logs in
 */
export async function storePendingDeepLink(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, url);
    console.log('[Deep Link] Stored pending deep link:', url);
  } catch (error) {
    console.error('[Deep Link] Error storing pending deep link:', error);
  }
}

/**
 * Retrieves and processes any pending deep link after user logs in
 *
 * @param isAuthenticated - Whether the user is now authenticated
 */
export async function processPendingDeepLink(isAuthenticated: boolean): Promise<void> {
  try {
    const pendingUrl = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);

    if (pendingUrl && isAuthenticated) {
      console.log('[Deep Link] Processing pending deep link:', pendingUrl);

      // Clear the pending link
      await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);

      // Small delay to ensure auth state is fully updated
      setTimeout(() => {
        handleDeepLink(pendingUrl, true);
      }, 500);
    }
  } catch (error) {
    console.error('[Deep Link] Error processing pending deep link:', error);
  }
}

/**
 * Clears any stored pending deep link
 */
export async function clearPendingDeepLink(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
    console.log('[Deep Link] Cleared pending deep link');
  } catch (error) {
    console.error('[Deep Link] Error clearing pending deep link:', error);
  }
}

// =====================================================
// Deep Link Generation
// =====================================================

/**
 * Generates a deep link URL for a specific entity
 *
 * @param entityType - The type of entity (must be in ROUTE_MAP)
 * @param id - The entity ID
 * @returns A deep link URL string
 */
export function generateDeepLink(entityType: keyof typeof ROUTE_MAP, id: string | number): string {
  const entityKey = entityType.toLowerCase();

  // Find the alias for the entity type (use first match)
  const alias = Object.entries(ENTITY_ALIAS_MAP).find(
    ([_, value]) => value === entityType
  )?.[0] || entityKey;

  return `ankaadesign://${alias}/${id}`;
}

/**
 * Generates a universal link (HTTPS) for a specific entity
 *
 * @param entityType - The type of entity (must be in ROUTE_MAP)
 * @param id - The entity ID
 * @returns A universal link URL string
 */
export function generateUniversalLink(entityType: keyof typeof ROUTE_MAP, id: string | number): string {
  const entityKey = entityType.toLowerCase();

  // Find the alias for the entity type (use first match)
  const alias = Object.entries(ENTITY_ALIAS_MAP).find(
    ([_, value]) => value === entityType
  )?.[0] || entityKey;

  return `${WEB_BASE_URL}/${alias}/${id}`;
}

/**
 * Generates a notification deep link
 *
 * @param entityType - The type of entity being notified about
 * @param id - The entity ID
 * @returns A notification deep link URL string
 */
export function generateNotificationLink(entityType: keyof typeof ROUTE_MAP, id: string | number): string {
  return `ankaadesign://notification?type=${entityType}&id=${id}`;
}

// =====================================================
// Notification Navigation Resolution (shared by push
// handler, notification drawer and notification screens)
// =====================================================

/**
 * Loose validation for URLs that are already expo-router paths
 * (e.g. "/(tabs)/estoque/operacoes-externas/detalhes/abc").
 * These can be pushed to the router directly without parsing.
 */
export function isExpoRouterPath(url: string): boolean {
  return (
    typeof url === 'string' &&
    url.startsWith('/(tabs)') &&
    !url.includes('://') &&
    !/\s/.test(url) &&
    // Must not contain an unfilled [param] segment
    !url.includes('[')
  );
}

/** True for http(s) URLs that are NOT our own web domain. */
function isExternalHttpUrl(url: string): boolean {
  return (
    (url.startsWith('http://') || url.startsWith('https://')) &&
    !url.includes('ankaadesign.com.br')
  );
}

/**
 * Extract a navigable mobile URL from a notification actionUrl.
 * Handles multiple formats:
 * 1. Direct mobile URL: "ankaadesign://task/123"
 * 2. Expo-router path: "/(tabs)/estoque/pedidos/detalhes/123"
 * 3. Embedded JSON: 'http://localhost:5173{"web":"...", "mobile":"ankaadesign://...", "universalLink":"..."}'
 * 4. JSON object with mobile field: {"web":"...", "mobile":"ankaadesign://...", "universalLink":"..."}
 */
export function extractMobileUrlFromActionUrl(actionUrl: string): string | null {
  try {
    // Already a mobile deep link or an expo-router path
    if (actionUrl.startsWith('ankaadesign://') || actionUrl.startsWith('/(tabs)')) {
      return actionUrl;
    }

    // Try to find embedded JSON in the URL (API sends malformed data like "http://localhost:5173{...}")
    const jsonStartIndex = actionUrl.indexOf('{');
    if (jsonStartIndex !== -1) {
      const jsonString = actionUrl.substring(jsonStartIndex);
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.mobile && typeof parsed.mobile === 'string') {
          return parsed.mobile;
        }
        if (parsed.universalLink && typeof parsed.universalLink === 'string') {
          return parsed.universalLink;
        }
      } catch {
        // JSON parse failed, continue to other methods
      }
    }

    // Try parsing the whole string as JSON
    try {
      const parsed = JSON.parse(actionUrl);
      if (parsed.mobile && typeof parsed.mobile === 'string') {
        return parsed.mobile;
      }
      if (parsed.universalLink && typeof parsed.universalLink === 'string') {
        return parsed.universalLink;
      }
    } catch {
      // Not valid JSON
    }

    // Return original URL as fallback (might be a web path / universal link)
    return actionUrl;
  } catch (error) {
    console.error('[Deep Link] Error extracting mobile URL from actionUrl:', error);
    return null;
  }
}

export interface NotificationNavSource {
  /** Direct mobile URL set by the backend (data.mobileUrl / metadata.mobileUrl) */
  mobileUrl?: string | null;
  /** Entity type from notification data/metadata (e.g. 'TASK', 'Order') */
  entityType?: string | null;
  /** Entity id from notification data/metadata */
  entityId?: string | null;
  /** Parent task id (used to redirect SERVICE_ORDER notifications to the Task screen) */
  taskId?: string | null;
  /** Raw actionUrl (may contain embedded JSON) */
  actionUrl?: string | null;
}

export type ResolvedNotificationNav =
  | { kind: 'route'; route: string }
  | { kind: 'external'; url: string };

/**
 * Resolves where a notification tap should navigate.
 *
 * Priority order:
 * 1. Explicit expo-router mobileUrl ("/(tabs)/...") — most specific, pushed as-is.
 * 2. entityType + entityId mapping via ENTITY_ALIAS_MAP/ROUTE_MAP
 *    (SERVICE_ORDER redirects to the parent Task when taskId is available).
 * 3. mobileUrl parsed as a deep link (custom scheme / universal link).
 * 4. actionUrl: extracted mobile URL (handles embedded JSON blobs), accepted
 *    directly when it is an expo-router path, otherwise parsed as a deep link.
 *
 * Returns null when nothing navigable was found — callers decide the fallback.
 */
export function resolveNotificationNavigation(source: NotificationNavSource): ResolvedNotificationNav | null {
  const { mobileUrl, taskId, actionUrl } = source;

  // Priority 1: explicit expo-router path provided by the API.
  // This is MORE specific than the generic entity mapping (e.g. warnings:
  // entity map sends employees to the ADMIN warnings screen while mobileUrl
  // carries "/(tabs)/pessoal/minhas-advertencias/detalhes/:id").
  if (mobileUrl && isExpoRouterPath(mobileUrl)) {
    return { kind: 'route', route: mobileUrl };
  }

  // Priority 2: entityType + entityId mapping
  if (source.entityType && source.entityId) {
    let entityType = source.entityType;
    let entityId = source.entityId;

    // SERVICE_ORDER notifications navigate to the parent Task when possible —
    // service orders are viewed within the task on mobile.
    if (
      (entityType === 'SERVICE_ORDER' || entityType === 'ServiceOrder' || entityType === 'SERVICEORDER') &&
      taskId
    ) {
      entityType = 'TASK';
      entityId = taskId;
    }

    const mappedEntityType = ENTITY_ALIAS_MAP[entityType] || ENTITY_ALIAS_MAP[entityType.toLowerCase()];
    const route = mappedEntityType ? ROUTE_MAP[mappedEntityType] : undefined;
    if (route) {
      return { kind: 'route', route: fillRouteParam(route, entityId) };
    }
  }

  // Priority 3: mobileUrl parsed as a deep link
  if (mobileUrl && typeof mobileUrl === 'string' && mobileUrl.length > 0) {
    if (isExternalHttpUrl(mobileUrl)) {
      return { kind: 'external', url: mobileUrl };
    }
    const parsed = parseDeepLink(mobileUrl);
    if (parsed.route && parsed.route !== '/(tabs)') {
      return { kind: 'route', route: parsed.route };
    }
  }

  // Priority 4: actionUrl (may contain embedded JSON with the mobile URL)
  if (actionUrl && typeof actionUrl === 'string' && actionUrl.length > 0) {
    const extracted = extractMobileUrlFromActionUrl(actionUrl);
    if (extracted) {
      if (isExpoRouterPath(extracted)) {
        return { kind: 'route', route: extracted };
      }
      if (isExternalHttpUrl(extracted)) {
        return { kind: 'external', url: extracted };
      }
      const parsed = parseDeepLink(extracted);
      if (parsed.route && parsed.route !== '/(tabs)') {
        return { kind: 'route', route: parsed.route };
      }
    }
  }

  return null;
}
