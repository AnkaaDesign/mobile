/**
 * Central registry of all tutorial target IDs. Every element the tutorial
 * highlights must have an ID listed here.
 *
 * Scope: PRODUCTION sector users (with conditional branching for team
 * leaders via `user.ledSector`). PRODUCTION users do NOT have direct
 * routing access to `/producao/aerografia/*` (blocked at the route filter).
 * Garage drawer entry exists but the route is blocked — flagged elsewhere.
 */
export const TUTORIAL_TARGETS = {
  // ──────────────────────────────────────────────────────────────────────
  // Chrome (header, drawer toggle, notification bell, back button)
  // ──────────────────────────────────────────────────────────────────────
  chromeDrawerToggle: "chrome.drawerToggle",
  chromeNotificationsBell: "chrome.notificationsBell",
  chromeHeaderBack: "chrome.headerBack",
  chromeHeaderTitle: "chrome.headerTitle",

  // ──────────────────────────────────────────────────────────────────────
  // Drawer items — only items visible to PRODUCTION users
  // ──────────────────────────────────────────────────────────────────────
  drawerInicio: "drawer.inicio",
  drawerProducao: "drawer.producao",
  drawerCronograma: "drawer.cronograma",
  drawerRecorte: "drawer.recorte",
  drawerObservacoes: "drawer.observacoes",
  drawerHistorico: "drawer.historico",
  drawerPessoal: "drawer.pessoal",
  drawerMinhaEquipe: "drawer.minhaEquipe",
  drawerPerfil: "drawer.perfil",
  drawerConfiguracoes: "drawer.configuracoes",

  // ──────────────────────────────────────────────────────────────────────
  // Início (home) — widget dashboard
  // ──────────────────────────────────────────────────────────────────────
  homeGreeting: "home.greeting",
  homeFavorites: "home.favorites",
  homeWidgetList: "home.widgetList",
  homeEditPanelButton: "home.editPanelButton",
  homeEditToolbar: "home.editToolbar",
  homeAddWidgetButton: "home.addWidgetButton",
  homeAddWidgetSheet: "home.addWidgetSheet",
  homeAddWidgetCatalogTarefas: "home.addWidgetSheet.tarefas",
  homeCancelEditButton: "home.cancelEditButton",
  homeSaveEditButton: "home.saveEditButton",
  homeFirstWidgetTile: "home.firstWidgetTile",
  homeWidgetMoreActions: "home.widgetMoreActions",

  // ──────────────────────────────────────────────────────────────────────
  // Cronograma list
  // ──────────────────────────────────────────────────────────────────────
  cronogramaList: "cronograma.list",
  cronogramaFirstTask: "cronograma.firstTask",
  cronogramaSearch: "cronograma.search",
  cronogramaFilters: "cronograma.filters",
  cronogramaFilterTags: "cronograma.filterTags",
  cronogramaColumnVisibility: "cronograma.columnVisibility",
  cronogramaStatusBadge: "cronograma.statusBadge",
  cronogramaPriorityIndicator: "cronograma.priorityIndicator",
  cronogramaDeadlineBadge: "cronograma.deadlineBadge",
  cronogramaSwipeAction: "cronograma.swipeAction",

  // ──────────────────────────────────────────────────────────────────────
  // Task detail (production-user view, plus leader-only sections)
  // ──────────────────────────────────────────────────────────────────────
  taskHeader: "task.header",
  taskInfoCard: "task.infoCard",
  taskCustomerCard: "task.customerCard",
  taskDatesCard: "task.datesCard",
  taskForecastHistoryToggle: "task.forecastHistoryToggle",
  taskTruckLayout: "task.truckLayout", // leader-only
  taskServicesCard: "task.servicesCard",
  taskServiceObservationIndicator: "task.serviceObservationIndicator",
  taskPaintsCard: "task.paintsCard",
  taskLogoPaintsCard: "task.logoPaintsCard",
  taskGroundPaintsCard: "task.groundPaintsCard",
  taskArtworksGallery: "task.artworksGallery",
  taskBaseFilesGallery: "task.baseFilesGallery",
  taskProjectFilesGallery: "task.projectFilesGallery",
  taskCutsTable: "task.cutsTable",
  taskAirbrushingsTable: "task.airbrushingsTable",
  taskObservationsTable: "task.observationsTable",
  taskObservationCard: "task.observationCard",
  taskDossie: "task.dossie", // leader-only
  taskChangelog: "task.changelog", // leader-only
  taskCommissionBadge: "task.commissionBadge",
  taskClearedBadge: "task.clearedBadge",

  // ──────────────────────────────────────────────────────────────────────
  // Recorte (cuts)
  // ──────────────────────────────────────────────────────────────────────
  recorteList: "recorte.list",
  recorteFirstItem: "recorte.firstItem",
  recorteStatusFilter: "recorte.statusFilter",
  recorteTypeFilter: "recorte.typeFilter",
  recorteSwipeRequest: "recorte.swipeRequest", // leader-only
  recorteSwipeStart: "recorte.swipeStart",
  recorteSwipeComplete: "recorte.swipeComplete",
  cutDetailHeader: "cut.detailHeader",
  cutDetailFile: "cut.detailFile",
  cutDetailParent: "cut.detailParent",
  cutRequestModal: "cut.requestModal",

  // ──────────────────────────────────────────────────────────────────────
  // Histórico
  // ──────────────────────────────────────────────────────────────────────
  historicoTabs: "historico.tabs",
  historicoList: "historico.list",
  historicoConcluidosTab: "historico.concluidos",
  historicoCanceladosTab: "historico.cancelados",

  // ──────────────────────────────────────────────────────────────────────
  // Observações
  // ──────────────────────────────────────────────────────────────────────
  observacoesList: "observacoes.list",
  observacoesFirstItem: "observacoes.firstItem",
  observacoesFab: "observacoes.fab", // admin-only (production user just sees absence)
  observacoesFormTaskSelect: "observacoes.form.taskSelect",
  observacoesFormDescription: "observacoes.form.description",
  observacoesFormSave: "observacoes.form.save",
  observacaoDetailDescription: "observacao.detail.description",
  observacaoDetailFiles: "observacao.detail.files",

  // ──────────────────────────────────────────────────────────────────────
  // Ordens de Serviço
  // ──────────────────────────────────────────────────────────────────────
  ordensList: "ordens.list",
  ordemStatusBadge: "ordem.statusBadge",

  // ──────────────────────────────────────────────────────────────────────
  // Notifications
  // ──────────────────────────────────────────────────────────────────────
  notificationsList: "notifications.list",
  notificationsMarkAll: "notifications.markAll",
  notificationsFirstItem: "notifications.firstItem",
  // Synthetic target — the dim backdrop strip to the LEFT of the right-side
  // notifications drawer. Registered manually by CombinedDrawerContent
  // (no real RN element exists for the backdrop) so the tutorial can teach
  // "tap here to close the panel".
  notificationsCloseBackdrop: "notifications.closeBackdrop",

  // ──────────────────────────────────────────────────────────────────────
  // Pessoal hub + sub-screens
  // ──────────────────────────────────────────────────────────────────────
  pessoalGrid: "pessoal.grid",
  pessoalGridCardPontos: "pessoal.gridCard.pontos",
  pessoalGridCardFeriados: "pessoal.gridCard.feriados",
  pessoalGridCardEpis: "pessoal.gridCard.epis",
  pessoalGridCardMensagens: "pessoal.gridCard.mensagens",
  pessoalGridCardAdvertencias: "pessoal.gridCard.advertencias",
  pessoalGridCardEmprestimos: "pessoal.gridCard.emprestimos",
  pessoalGridCardMovimentacoes: "pessoal.gridCard.movimentacoes",
  pessoalGridCardBonus: "pessoal.gridCard.bonus",

  pessoalPontos: "pessoal.pontos",
  pessoalPontosMonthSelector: "pessoal.pontos.monthSelector",
  pessoalPontosColumnToggle: "pessoal.pontos.columnToggle",
  pessoalPontosJustifyButton: "pessoal.pontos.justifyButton",
  pessoalPontosAdjustButton: "pessoal.pontos.adjustButton",
  pessoalPontosJustifyPage: "pessoal.pontos.justifyPage",
  pessoalPontosAdjustPage: "pessoal.pontos.adjustPage",
  pessoalPontosJustifyFirstRow: "pessoal.pontos.justifyFirstRow",
  pessoalPontosJustifyForm: "pessoal.pontos.justifyForm",
  pessoalPontosJustifyMotivo: "pessoal.pontos.justifyMotivo",
  pessoalPontosJustifyObservacao: "pessoal.pontos.justifyObservacao",
  pessoalPontosJustifySubmit: "pessoal.pontos.justifySubmit",
  pessoalPontosAdjustDate: "pessoal.pontos.adjustDate",
  pessoalPontosAdjustFirstSlot: "pessoal.pontos.adjustFirstSlot",
  pessoalPontosAdjustSubmit: "pessoal.pontos.adjustSubmit",

  pessoalFeriados: "pessoal.feriados",
  pessoalFeriadosFirstItem: "pessoal.feriados.firstItem",

  pessoalEpis: "pessoal.epis",
  pessoalEpisFirstItem: "pessoal.epis.firstItem",
  pessoalEpisRequestButton: "pessoal.epis.requestButton",
  pessoalEpisRequestForm: "pessoal.epis.requestForm",
  pessoalEpisDetailSign: "pessoal.epis.detailSign",
  pessoalEpisBiometric: "pessoal.epis.biometric",

  pessoalMensagens: "pessoal.mensagens",
  pessoalMensagensFirstItem: "pessoal.mensagens.firstItem",

  pessoalAdvertencias: "pessoal.advertencias",
  pessoalAdvertenciasFirstItem: "pessoal.advertencias.firstItem",

  pessoalEmprestimos: "pessoal.emprestimos",
  pessoalEmprestimosFirstItem: "pessoal.emprestimos.firstItem",

  pessoalMovimentacoes: "pessoal.movimentacoes",
  pessoalMovimentacoesFirstItem: "pessoal.movimentacoes.firstItem",

  pessoalBonus: "pessoal.bonus",
  pessoalBonusRules: "pessoal.bonus.rules",
  pessoalBonusPeriodCard: "pessoal.bonus.periodCard",
  pessoalBonusAmount: "pessoal.bonus.amount",
  pessoalBonusBase: "pessoal.bonus.base",
  pessoalBonusDiscounts: "pessoal.bonus.discounts",
  pessoalBonusNet: "pessoal.bonus.net",
  pessoalBonusPerformance: "pessoal.bonus.performance",
  pessoalBonusCommission: "pessoal.bonus.commission",
  pessoalBonusNavSimulacao: "pessoal.bonus.navSimulacao",
  pessoalBonusNavHistorico: "pessoal.bonus.navHistorico",
  pessoalBonusSimulacaoControls: "pessoal.bonus.simulacao.controls",
  pessoalBonusHistoricoList: "pessoal.bonus.historico.list",
  pessoalBonusHistoricoFirstEntry: "pessoal.bonus.historico.firstEntry",

  // Perfil
  perfilAddress: "perfil.address",

  // Avatar dropdown in side drawer
  drawerAvatarButton: "drawer.avatarButton",
  drawerThemeToggle: "drawer.themeToggle",
  drawerLogout: "drawer.logout",

  // Notifications preferences screen
  notifPrefsLegend: "notifPrefs.legend",
  notifPrefsFirstSection: "notifPrefs.firstSection",
  notifPrefsChannelToggles: "notifPrefs.channelToggles",
  notifPrefsSaveButton: "notifPrefs.saveButton",

  // ──────────────────────────────────────────────────────────────────────
  // Minha Equipe (team leader only)
  // ──────────────────────────────────────────────────────────────────────
  meuPessoalGrid: "meuPessoal.grid",
  meuPessoalUsuarios: "meuPessoal.usuarios",
  meuPessoalEpis: "meuPessoal.epis",
  meuPessoalAdvertencias: "meuPessoal.advertencias",
  meuPessoalMovimentacoes: "meuPessoal.movimentacoes",
  meuPessoalCalculos: "meuPessoal.calculos",
  meuPessoalEmprestimos: "meuPessoal.emprestimos",

  // ──────────────────────────────────────────────────────────────────────
  // Configurações + Preferências
  // ──────────────────────────────────────────────────────────────────────
  configList: "config.list",
  preferencesGrid: "preferences.grid",
  preferencesThemeCard: "preferences.themeCard",
  preferencesNotificationsCard: "preferences.notificationsCard",
  preferencesPrivacyCard: "preferences.privacyCard",
  preferencesReplayButton: "preferences.replayButton",

  // ──────────────────────────────────────────────────────────────────────
  // Perfil
  // ──────────────────────────────────────────────────────────────────────
  perfilPhoto: "perfil.photo",
  perfilName: "perfil.name",
  perfilContact: "perfil.contact",
  perfilSizes: "perfil.sizes",
  perfilAddress: "perfil.address",
  perfilSaveButton: "perfil.saveButton",

  // ──────────────────────────────────────────────────────────────────────
  // Cross-cutting (gesture cheat sheet, file viewer)
  // ──────────────────────────────────────────────────────────────────────
  gestureRefreshIndicator: "gesture.refresh",
  gestureSwipeRow: "gesture.swipeRow",
  gestureLongPress: "gesture.longPress",
  fileViewer: "fileViewer",
} as const;

export type TutorialTargetId =
  (typeof TUTORIAL_TARGETS)[keyof typeof TUTORIAL_TARGETS];
