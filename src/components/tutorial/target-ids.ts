/**
 * Central registry of all tutorial target IDs. Keep this exhaustive — every
 * element the tutorial highlights must have an ID listed here.
 *
 * Scope: PRODUCTION sector users only. PRODUCTION users do NOT have access
 * to `/producao/aerografia/*` or `/producao/garagens/*` (route filter in
 * `privilege-optimized-full-fixed.tsx` excludes them), so those areas are
 * intentionally absent from this registry.
 */
export const TUTORIAL_TARGETS = {
  // Chrome (header, drawer, notification bell) — present on most screens
  chromeDrawerToggle: "chrome.drawerToggle",
  chromeNotificationsBell: "chrome.notificationsBell",
  chromeHeaderBack: "chrome.headerBack",

  // Drawer items (right-side menu) — only items that PRODUCTION users see
  drawerInicio: "drawer.inicio",
  drawerProducao: "drawer.producao",
  drawerCronograma: "drawer.cronograma",
  drawerRecorte: "drawer.recorte",
  drawerObservacoes: "drawer.observacoes",
  drawerHistorico: "drawer.historico",
  drawerPessoal: "drawer.pessoal",
  drawerPerfil: "drawer.perfil",
  drawerConfiguracoes: "drawer.configuracoes",

  // Início (home) — widget-first dashboard
  homeGreeting: "home.greeting",
  homeWidgetList: "home.widgetList",
  homeEditPanelButton: "home.editPanelButton",
  homeEditToolbar: "home.editToolbar",
  homeAddWidgetButton: "home.addWidgetButton",
  homeAddWidgetSheet: "home.addWidgetSheet",
  homeCancelEditButton: "home.cancelEditButton",
  homeSaveEditButton: "home.saveEditButton",

  // Cronograma
  cronogramaList: "cronograma.list",
  cronogramaFirstTask: "cronograma.firstTask",
  cronogramaSearch: "cronograma.search",
  cronogramaFilters: "cronograma.filters",

  // Task detail
  taskHeader: "task.header",
  taskInfoCard: "task.infoCard",
  taskDatesCard: "task.datesCard",
  taskServicesCard: "task.servicesCard",

  // Recorte
  recorteList: "recorte.list",
  recorteFirstItem: "recorte.firstItem",

  // Histórico
  historicoTabs: "historico.tabs",
  historicoList: "historico.list",

  // Observações (the "show, demo, do" flagship)
  observacoesList: "observacoes.list",
  observacoesFab: "observacoes.fab",
  observacoesFormTaskSelect: "observacoes.form.taskSelect",
  observacoesFormDescription: "observacoes.form.description",
  observacoesFormSave: "observacoes.form.save",

  // Ordens de Serviço
  ordensList: "ordens.list",

  // Notifications
  notificationsList: "notifications.list",

  // Pessoal (personal area)
  pessoalGrid: "pessoal.grid",
  pessoalPontos: "pessoal.pontos",
  pessoalFeriados: "pessoal.feriados",
  pessoalEpis: "pessoal.epis",

  // Configurações
  configList: "config.list",

  // Preferências (user dropdown → "Preferências")
  preferencesReplayButton: "preferences.replayButton",

  // Perfil
  perfilPhoto: "perfil.photo",
  perfilSizes: "perfil.sizes",
} as const;

export type TutorialTargetId =
  (typeof TUTORIAL_TARGETS)[keyof typeof TUTORIAL_TARGETS];
