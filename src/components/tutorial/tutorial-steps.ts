import { TUTORIAL_TARGETS } from "./target-ids";
import type { TutorialStep, TutorialUserContext } from "./types";

/**
 * Tutorial step library for PRODUCTION sector users.
 *
 * The order of steps mirrors the natural workflow a production user follows
 * through the app: home → cronograma → task detail → recortes → histórico →
 * observações → pessoal → configurações → perfil → gestures cheat sheet.
 *
 * Conditional steps (leader-only screens like Layout, Dossiê, Changelog,
 * Cut request, Minha Equipe) are tagged with `condition: ctx => ctx.isLeader`
 * and filtered out at start time when the current user has no `ledSector`.
 *
 * Three step kinds:
 *   - `narration`   — full-screen tooltip, advance with CTA.
 *   - `showcase`    — spotlight + Continuar to advance.
 *   - `interactive` — spotlight that blocks until the user performs
 *                     `expectedAction` (tap, drawer-open, input, submit).
 */

const ROUTES = {
  inicio: "/(tabs)/inicio",
  cronograma: "/(tabs)/producao/cronograma",
  recorte: "/(tabs)/producao/recorte",
  historico: "/(tabs)/producao/historico",
  historicoConcluidos: "/(tabs)/producao/historico/concluidos",
  historicoCancelados: "/(tabs)/producao/historico/cancelados",
  observacoes: "/(tabs)/producao/observacoes",
  ordens: "/(tabs)/producao/ordens-de-servico",
  pessoal: "/(tabs)/pessoal",
  pessoalPontos: "/(tabs)/pessoal/meus-pontos",
  pessoalPontosJustificar: "/(tabs)/pessoal/meus-pontos/justificar-ausencia",
  pessoalPontosAjustar: "/(tabs)/pessoal/meus-pontos/ajustar-ponto",
  pessoalFeriados: "/(tabs)/pessoal/meus-feriados",
  pessoalEpis: "/(tabs)/pessoal/meus-epis",
  pessoalMensagens: "/(tabs)/pessoal/minhas-mensagens",
  pessoalAdvertencias: "/(tabs)/pessoal/minhas-advertencias",
  pessoalEmprestimos: "/(tabs)/pessoal/meus-emprestimos",
  pessoalMovimentacoes: "/(tabs)/pessoal/minhas-movimentacoes",
  pessoalBonus: "/(tabs)/pessoal/meu-bonus",
  pessoalBonusSimulacao: "/(tabs)/pessoal/meu-bonus/simulacao",
  pessoalBonusHistorico: "/(tabs)/pessoal/meu-bonus/historico",
  meuPessoal: "/(tabs)/meu-pessoal",
  configuracoes: "/(tabs)/configuracoes",
  preferencias: "/(tabs)/pessoal/preferencias",
  perfil: "/(tabs)/perfil",
  notificationPreferences: "/(tabs)/perfil/notification-preferences",
} as const;

// First mock missing-day date, matching `mockSecullumMissingDays[0]` in
// `tutorial-mocks.ts` (offset(-3) — three days ago). Used as the dynamic
// route segment for the Justificar Ausência form steps so the dev step
// picker can jump straight to the form page during testing.
function justifyFormRoute(): string {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `/(tabs)/pessoal/meus-pontos/justificar-ausencia/${yyyy}-${mm}-${dd}`;
}

const leaderOnly = (ctx: TutorialUserContext) => ctx.isLeader;
const bonifiableOnly = (ctx: TutorialUserContext) => ctx.isBonifiable;

export function buildTutorialSteps(_ctx?: TutorialUserContext): TutorialStep[] {
  const steps: TutorialStep[] = [];

  // ═══ ACT 1 — Boas-vindas ════════════════════════════════════════════════
  steps.push({
    id: "welcome",
    kind: "narration",
    title: "Bem-vindo(a) à Ankaa!",
    description:
      "Vamos fazer um tour completo pelo aplicativo. Você vai conhecer a tela inicial, o cronograma, suas tarefas, recortes, observações, sua área pessoal e muito mais. O tutorial é interativo — em alguns passos você precisará tocar exatamente onde o destaque amarelo indicar.",
    placement: "center",
    ctaLabel: "Começar tour",
  });

  steps.push({
    id: "tutorial-pacing",
    kind: "narration",
    title: "Como funciona o tutorial",
    description:
      "Toque em Continuar para avançar passos explicativos. Quando aparecer um destaque pulsante amarelo, é uma ação interativa: toque exatamente no local destacado para prosseguir. Você pode encerrar a qualquer momento tocando em Pular no topo do balão.",
    placement: "center",
  });

  // ═══ ACT 2 — Início / Dashboard de Widgets ══════════════════════════════
  steps.push({
    id: "home-greeting",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeGreeting,
    title: "Cabeçalho personalizado",
    description:
      "Aqui você vê uma saudação com seu nome, a data atual em tempo real e um pequeno relógio. É a primeira coisa que aparece sempre que você abre o app.",
    placement: "bottom",
  });

  // The Favoritos widget lives in the dashboard. Spotlight ONLY that tile,
  // wired via dashboard-grid.tsx → GridCell when instance.widgetId === "home.favorites".
  steps.push({
    id: "home-favorites",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeFavorites,
    title: "Atalhos favoritos",
    description:
      "Este widget Favoritos guarda os caminhos que você usa com mais frequência. Você pode adicionar ou remover atalhos a partir de qualquer tela tocando no ícone de estrela.",
    placement: "top",
  });

  steps.push({
    id: "home-widgets-intro",
    kind: "narration",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeWidgetList,
    title: "Sua dashboard de widgets",
    description:
      "O Início é totalmente personalizável: cada cartão abaixo é um widget. Você pode adicionar, remover, redimensionar e reorganizar livremente. Há widgets para tarefas em produção, ponto, mensagens, anotações rápidas e muito mais.",
    placement: "top",
  });

  steps.push({
    id: "home-edit-panel",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeEditPanelButton,
    title: "Toque em Editar",
    description:
      "Para personalizar a dashboard, primeiro entre no modo de edição. Toque no botão Editar destacado.",
    placement: "bottom",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no botão Editar",
  });

  steps.push({
    id: "home-edit-toolbar",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeEditToolbar,
    title: "Barra de edição",
    description:
      "Você está em modo de edição. A barra mostra três botões: Adicionar (novo widget), Descartar em vermelho (cancela tudo) e Salvar em verde (confirma as mudanças). Nenhuma alteração é permanente até você tocar em Salvar.",
    placement: "bottom",
  });

  steps.push({
    id: "home-widget-drag",
    kind: "narration",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeWidgetList,
    title: "Reordenar widgets — segure e arraste",
    description:
      "Em modo de edição, mantenha o dedo pressionado em qualquer widget por cerca de 0,3 segundos para começar a arrastar. Solte na nova posição. Os outros widgets se reorganizam automaticamente.",
    placement: "top",
  });

  // Spotlight the FIRST widget's ⋮ overflow button. SortableGrid wires the
  // homeWidgetMoreActions target to the first tile's dots Pressable so the
  // user can see exactly where the menu is — and the menu's three actions
  // (Configurar widget, Tamanho, Remover do painel) get described in the
  // tooltip text below.
  steps.push({
    id: "home-widget-options",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeWidgetMoreActions,
    title: "Opções por widget",
    description:
      "Em modo de edição, cada widget mostra um ícone de três pontinhos (⋮) no canto inferior direito (destacado). Toque para abrir um painel com três ações: Configurar widget, Tamanho (escolher entre as opções permitidas) e Remover do painel.",
    placement: "top",
    tooltipPinToScreenTop: true,
  });

  steps.push({
    id: "home-add-widget",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeAddWidgetButton,
    title: "Adicionar um widget",
    description:
      "Vamos adicionar um novo widget. Toque em Adicionar para abrir o catálogo.",
    placement: "top",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque em Adicionar",
  });

  steps.push({
    id: "home-widget-catalog",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.homeAddWidgetCatalogTarefas,
    title: "Escolha um widget",
    description:
      "O catálogo lista todos os widgets disponíveis para seu setor. Toque em Tarefas para adicioná-lo à dashboard.",
    placement: "top",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no widget Tarefas",
  });

  // Spotlight the newly added widget (the LAST tile in the sortable grid).
  // SortableGrid registers this tile's rect manually with the tutorial
  // engine using its computed home rect + the container's window offset,
  // avoiding the unreliable measureInWindow through transformed Animated
  // parents.
  steps.push({
    id: "home-widget-added",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeFirstWidgetTile,
    title: "Widget adicionado",
    description:
      "Pronto — o widget Tarefas (destacado) foi adicionado ao final da lista. Ainda não foi salvo: você pode arrastá-lo para outra posição ou tocar em Descartar (botão vermelho) para cancelar antes de salvar.",
    placement: "top",
    tooltipPinToScreenTop: true,
  });

  steps.push({
    id: "home-save-edit",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeSaveEditButton,
    title: "Salvar alterações",
    description:
      "Confirme as alterações tocando em Salvar (botão verde). Suas escolhas ficam guardadas na sua conta — você verá os mesmos widgets em qualquer dispositivo.",
    placement: "bottom",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque em Salvar",
  });

  steps.push({
    id: "home-save-done",
    kind: "narration",
    title: "Configuração salva",
    description:
      "Pronto! A dashboard foi atualizada. Você pode editar a qualquer momento. Lembre-se: para descartar mudanças, basta tocar em Descartar (botão vermelho) antes de salvar.",
    placement: "center",
  });

  // ═══ ACT 3 — Notificações (FIRST — bell is in the header that the menu
  // drawer would otherwise cover. Teaching the bell before the menu keeps
  // it un-dimmed and easier to find.) ═══════════════════════════════════
  steps.push({
    id: "notifications-intro",
    kind: "narration",
    title: "Central de notificações",
    description:
      "No topo direito da tela, ao lado do menu, há um sino. Ele mostra um contador vermelho quando há mensagens não lidas. Vamos abrir o painel de notificações.",
    placement: "center",
  });

  steps.push({
    id: "notifications-bell-tap",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.chromeNotificationsBell,
    title: "Toque no sino",
    description:
      "Toque no sino para abrir o painel de notificações.",
    placement: "bottom",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no sino de notificações",
  });

  // Narration (no spotlight) — the notification bell opens a side DRAWER
  // panel, not a routed screen, so the global TutorialOverlay sits behind
  // the drawer. We describe the panel instead. dimBackground:false keeps
  // the panel content clearly visible, and the tooltip auto-positions to
  // the bottom so the panel content stays readable above it.
  steps.push({
    id: "notifications-list",
    kind: "narration",
    title: "Painel de notificações",
    description:
      "Aqui você vê suas mensagens agrupadas por data (Hoje, Ontem, Últimos 7 dias e mais antigas). Toque em qualquer notificação para abrir a tela relacionada. Para marcar uma como lida sem abri-la, deslize a notificação para a esquerda.",
    placement: "center",
    dimBackground: false,
  });

  // Interactive — teach the close gesture by spotlighting the dim backdrop
  // strip to the LEFT of the panel. CombinedDrawerContent registers a
  // synthetic rect for that strip when the panel is open and this step is
  // active. When the user taps the dim area the drawer dismisses, the
  // engine's "state" listener fires `drawer-close`, and we advance.
  steps.push({
    id: "notifications-close",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.notificationsCloseBackdrop,
    title: "Feche o painel",
    description:
      "Para fechar o painel, toque na área escurecida à esquerda dele (destacada). Você também pode deslizá-lo para a direita até sair da tela.",
    placement: "bottom",
    expectedAction: "drawer-close",
    pulseTarget: true,
    hint: "Toque na área escurecida à esquerda",
    dimBackground: false,
  });

  // ═══ ACT 4 — Menu lateral (drawer) ═══════════════════════════════════════
  // closeDrawerOnEnter — the previous step left the notifications panel
  // open. Without this dismiss the header (and the menu icon we're about
  // to spotlight) is fully hidden behind the panel.
  steps.push({
    id: "drawer-intro",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.chromeDrawerToggle,
    title: "Menu lateral",
    description:
      "Agora vamos abrir o menu de navegação. O ícone com três traços no canto superior direito abre o menu lateral — é por ele que você navega entre as áreas do app. Toque para abrir.",
    placement: "bottom",
    expectedAction: "drawer-open",
    pulseTarget: true,
    hint: "Toque no ícone de menu",
    closeDrawerOnEnter: true,
  });

  steps.push({
    id: "drawer-overview",
    kind: "narration",
    title: "Estrutura do menu",
    description:
      "O menu mostra todas as áreas que seu setor pode acessar: Início, Cronograma, Recorte, Observações, Histórico, Pessoal, Meu Perfil e Configurações. Líderes de setor também veem Minha Equipe. Para fechar o menu, toque na área escurecida à esquerda dele ou deslize-o para a direita.",
    placement: "center",
    dimBackground: false,
  });

  // ═══ ACT 4 — Cronograma ═════════════════════════════════════════════════
  steps.push({
    id: "drawer-cronograma",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerCronograma,
    title: "Acesse o Cronograma",
    description:
      "O Cronograma lista todas as tarefas em produção atribuídas ao seu setor. Toque para abrir.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer item tap pushes /cronograma onto the stack.
    navigatesTo: ROUTES.cronograma,
    pulseTarget: true,
    hint: "Toque em Cronograma",
  });

  steps.push({
    id: "cronograma-list",
    kind: "showcase",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaList,
    title: "Lista de tarefas",
    description:
      "Cada linha representa uma tarefa. As colunas visíveis por padrão são: Nome, Série, Prazo e Tempo Restante. Você pode personalizar quais colunas aparecem.",
    placement: "top",
  });

  steps.push({
    id: "cronograma-search",
    kind: "showcase",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaSearch,
    title: "Busca rápida",
    description:
      "Use a busca para filtrar por nome da tarefa, cliente, número de série, placa ou setor. A busca é instantânea — começa a filtrar conforme você digita.",
    placement: "bottom",
  });

  steps.push({
    id: "cronograma-filters",
    kind: "showcase",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaFilters,
    title: "Filtros avançados",
    description:
      "Toque no ícone de funil para abrir os filtros: setor, faixa de prazo, status e atraso. O número vermelho ao lado do funil indica quantos filtros estão ativos.",
    placement: "bottom",
  });

  steps.push({
    id: "cronograma-columns",
    kind: "showcase",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaColumnVisibility,
    title: "Personalizar colunas",
    description:
      "Este ícone abre o painel de colunas. Toque para escolher quais informações aparecem na lista — Placa, Cliente, Setor, Detalhes, Comissão e mais. Sua preferência fica salva no aparelho.",
    placement: "bottom",
  });

  // dimBackground:false + placement:"bottom" so the user can see each task
  // row's actual background color while reading the legend.
  steps.push({
    id: "cronograma-status-legend",
    kind: "narration",
    screen: ROUTES.cronograma,
    title: "Cores das tarefas",
    description:
      "Repare na cor de fundo de cada linha: cinza = Aguardando Produção (não começou); verde = Em Produção com mais de 4 horas até o prazo; amarela = Em Produção com menos de 4 horas até o prazo; vermelha = Em Produção atrasada.",
    placement: "bottom",
    dimBackground: false,
  });

  steps.push({
    id: "cronograma-deadline-info",
    kind: "narration",
    screen: ROUTES.cronograma,
    title: "Prazo e Tempo Restante",
    description:
      "A coluna Prazo mostra a data limite e Tempo Restante mostra a contagem regressiva. Use as cores da linha acima para priorizar: vermelho exige ação imediata, amarelo está perto do prazo, verde tem folga.",
    placement: "bottom",
    dimBackground: false,
  });

  steps.push({
    id: "cronograma-tap-task",
    kind: "interactive",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaFirstTask,
    title: "Abra a primeira tarefa",
    description:
      "Toque na primeira tarefa da lista para ver todos os detalhes.",
    placement: "top",
    expectedAction: "tap",
    // Tapping the first mockTask row pushes the task detail route.
    // Hardcoded to mockTasks[0].id (task0 = id(1)) so the replay engine
    // can reconstruct the stack when jumping to a task-detail showcase.
    navigatesTo:
      "/(tabs)/producao/cronograma/detalhes/00000001-aaaa-4bbb-acac-000000000001",
    pulseTarget: true,
    hint: "Toque na primeira tarefa",
  });

  // ═══ ACT 5 — Detalhe da Tarefa ══════════════════════════════════════════
  // The "intro" used to be a separate narration that fired BEFORE navigation
  // settled — leaving the user staring at a dim screen with the next
  // showcase waiting for `taskHeader` to register. Folded into the header
  // showcase so the engine naturally waits for the detail screen to mount.
  steps.push({
    id: "task-header",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskHeader,
    title: "Detalhe da tarefa — cabeçalho",
    description:
      "Esta é a tela mais rica do app — aqui ficam dados do caminhão, tintas, recortes, aerografias, prazos, fotos e observações. Vamos começar pelo cabeçalho, que mostra o nome da tarefa. Vamos passar por cada cartão a seguir.",
    placement: "bottom",
  });

  steps.push({
    id: "task-info-card",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskInfoCard,
    title: "Informações Gerais",
    description:
      "Cliente, responsáveis comerciais, setor responsável, número de série e placa. Toque no telefone do responsável para ligar ou abrir o WhatsApp diretamente.",
    placement: "bottom",
  });

  steps.push({
    id: "task-commission-badge",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskCommissionBadge,
    title: "Status de Comissão",
    description:
      "Quando a tarefa tem comissão definida pela equipe comercial, aparece um badge: Sem Comissão, Parcial, Integral ou Suspensa. Serve para acompanhamento durante a execução.",
    placement: "bottom",
  });

  steps.push({
    id: "task-dates-card",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskDatesCard,
    title: "Seção de Datas",
    description:
      "Criado, Entrada na produção, Iniciado, Prazo e Finalizado. Quando o prazo passa e a tarefa ainda não foi finalizada, aparece o badge vermelho Atrasado.",
    placement: "bottom",
  });

  steps.push({
    id: "task-services-card",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskServicesCard,
    title: "Cartão de Serviços",
    description:
      "Lista todas as ordens de serviço da tarefa. Cada serviço tem tipo (Produção, Comercial, Logística, Arte) com cor distinta, descrição, responsável (se atribuído) e status colorido.",
    placement: "bottom",
  });

  steps.push({
    id: "task-service-observation",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.taskServiceObservationIndicator,
    title: "Observação em um serviço",
    description:
      "Este serviço tem uma observação — repare no '!' vermelho destacado ao lado dele. Toque no badge para abrir o alerta com a observação completa. Sempre confira antes de iniciar: pode haver instruções importantes da liderança ou do comercial.",
    placement: "top",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no badge !",
  });

  steps.push({
    id: "task-paints-general",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskPaintsCard,
    title: "Pintura Geral",
    description:
      "A tinta principal da tarefa, com a amostra de cor, código, fabricante e acabamento. Se o tipo da tinta exigir primer, aparece um aviso âmbar 'Requer primer'.",
    placement: "bottom",
  });

  // Fundos Recomendados sit right under Pintura Geral on the detail page
  // (primer is a property of the general paint, not a separate aesthetic).
  steps.push({
    id: "task-ground-paints",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskGroundPaintsCard,
    title: "Fundos Recomendados",
    description:
      "Quando a pintura principal precisa de primer ou fundo específico, eles aparecem aqui em um carrossel horizontal logo abaixo da Pintura Geral. Toque em um fundo para ver os detalhes no catálogo.",
    placement: "bottom",
  });

  steps.push({
    id: "task-logo-paints",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskLogoPaintsCard,
    title: "Tintas da Logomarca",
    description:
      "Lista de tintas usadas na logomarca, com mesmo formato visual. Quantas e quais tintas variam de tarefa para tarefa.",
    placement: "bottom",
  });

  steps.push({
    id: "task-observations-table",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskObservationsTable,
    title: "Tabela de Observações",
    description:
      "Lista os problemas e correções registrados durante a execução da tarefa — vazados na pintura, posição errada da logomarca, falhas no acabamento e outros pontos de retrabalho. Cada observação tem data, descrição e arquivos anexados.",
    placement: "top",
  });

  steps.push({
    id: "task-artworks",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskArtworksGallery,
    title: "Layouts (Artes)",
    description:
      "Artes aprovadas pelo cliente. Você pode tocar em cada arte para ampliar, e tocar em Baixar Todos para baixar todas de uma vez. O setor de produção vê apenas artes aprovadas.",
    placement: "bottom",
  });

  steps.push({
    id: "task-cuts-table",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskCutsTable,
    title: "Recortes da Tarefa",
    description:
      "Tabela de recortes (adesivos e máscaras) relacionados a esta tarefa. Mostra o nome do arquivo e o status (Pendente, Cortando, Concluído).",
    placement: "top",
  });

  steps.push({
    id: "task-airbrushings-table",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskAirbrushingsTable,
    title: "Aerografias",
    description:
      "Quando a tarefa inclui aerografias customizadas, elas aparecem nesta tabela. Toque em uma linha para ver detalhes da aerografia.",
    placement: "top",
  });

  steps.push({
    id: "task-back-to-list",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar ao cronograma",
    description:
      "Para voltar à lista de tarefas, use esta seta no canto superior esquerdo. Você pode tocar nela agora para prosseguir, ou tocar em Continuar.",
    placement: "bottom",
  });

  // ═══ ACT 6 — Líder: extras (conditional) ════════════════════════════════
  // Re-assert the route: the previous step is a back-tap and the user's
  // navigation history may pop to a stale route. Forcing /cronograma here
  // keeps the leader narrations anchored to the screen the back step
  // promised the user.
  steps.push({
    id: "leader-truck-layout",
    kind: "narration",
    screen: ROUTES.cronograma,
    title: "Medidas do Caminhão (Líder)",
    description:
      "Como líder de produção, ao abrir uma tarefa que já tem layout cadastrado, você vê uma prévia interativa do caminhão com as medidas das laterais e traseira. Use para conferir áreas antes de iniciar a aplicação.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-dossie",
    kind: "narration",
    title: "Dossiê (Líder)",
    description:
      "Líderes de produção visualizam o Dossiê: galeria de fotos de check-in (antes) e check-out (depois) de cada serviço com fotos registradas. Documenta o trabalho feito e protege a equipe em casos de questionamento.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-changelog",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskChangelog,
    title: "Histórico de Alterações (Líder)",
    description:
      "Lista cronológica de todas as alterações: mudanças de status, atualizações de prazo, edições nos serviços, etc. Quem fez, o que mudou e quando.",
    placement: "top",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-service-status-edit",
    kind: "narration",
    title: "Editar Status do Serviço (Líder)",
    description:
      "Como líder do setor responsável, você pode mudar o status de cada serviço diretamente do cartão Serviços. Toque no status colorido para ver as opções permitidas pelo fluxo (Pendente → Em Andamento → Concluído).",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-task-actions",
    kind: "narration",
    title: "Ações na lista (Líder)",
    description:
      "Na lista do Cronograma, líderes têm ações adicionais via deslize lateral em cada linha: Iniciar, Finalizar, Layout, Check-in/Check-out e Adicionar Artes. Tente deslizar uma linha para o lado.",
    placement: "center",
    condition: leaderOnly,
  });

  // ═══ ACT 7 — Histórico ══════════════════════════════════════════════════
  steps.push({
    id: "drawer-historico",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerHistorico,
    title: "Acesse Histórico",
    description:
      "O Histórico mostra suas tarefas já finalizadas. Útil para consultar trabalhos antigos. Toque para abrir.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer item tap pushes /historico onto the stack.
    navigatesTo: ROUTES.historico,
    pulseTarget: true,
    hint: "Toque em Histórico",
  });

  // Production users see only the Concluídos list (the Cancelados tab is
  // hidden by permissions), so the step talks only about that list.
  steps.push({
    id: "historico-concluidos",
    kind: "showcase",
    screen: ROUTES.historico,
    targetId: TUTORIAL_TARGETS.historicoList,
    title: "Tarefas Concluídas",
    description:
      "Mostra as tarefas finalizadas com data de conclusão, ordenadas da mais recente para a mais antiga. Use os filtros para refinar por período. Toque em qualquer linha para ver o detalhe completo da tarefa.",
    placement: "top",
  });

  // ═══ ACT 8 — Observações ════════════════════════════════════════════════
  steps.push({
    id: "drawer-observacoes",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerObservacoes,
    title: "Acesse Observações",
    description:
      "A área de Observações reúne todas as anotações feitas em todas as tarefas — útil para revisões e auditoria. Toque para abrir.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer item tap pushes /observacoes onto the stack.
    navigatesTo: ROUTES.observacoes,
    pulseTarget: true,
    hint: "Toque em Observações",
  });

  steps.push({
    id: "observacoes-list",
    kind: "showcase",
    screen: ROUTES.observacoes,
    targetId: TUTORIAL_TARGETS.observacoesList,
    title: "Lista de Observações",
    description:
      "Cada observação mostra a tarefa associada, a descrição e a data. Você pode filtrar por tarefa e por intervalo de datas usando o funil.",
    placement: "top",
  });

  // Observation detail walkthrough kept as narrations — the first-item
  // anchor isn't wired on the shared list rows, so an interactive tap
  // would trigger the 5s rescue. Narrations describe what users will see.
  steps.push({
    id: "observacao-detail-overview",
    kind: "narration",
    title: "Conteúdo de uma observação",
    description:
      "A tela de detalhes mostra a descrição completa, fotos ou PDFs anexados (toque para visualizar em tela cheia) e o registro de quando e por quem foi criada. Boas observações ajudam toda a equipe.",
    placement: "center",
  });

  // ═══ ACT 9 — Recorte ════════════════════════════════════════════════════
  steps.push({
    id: "drawer-recorte",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerRecorte,
    title: "Acesse Recorte",
    description:
      "A área de Recorte concentra todos os adesivos e máscaras cortados pela equipe de plotagem. Toque para abrir.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer item tap pushes /recorte onto the stack.
    navigatesTo: ROUTES.recorte,
    pulseTarget: true,
    hint: "Toque em Recorte",
  });

  steps.push({
    id: "recorte-list",
    kind: "showcase",
    screen: ROUTES.recorte,
    targetId: TUTORIAL_TARGETS.recorteList,
    title: "Lista de Recortes",
    description:
      "Cada linha é um recorte: prévia do arquivo, nome, status e tarefa relacionada. Você só vê os recortes do seu setor — o que mantém a tela enxuta.",
    placement: "top",
  });

  // Recorte detail walkthrough collapsed into narration steps. Targeting
  // a row inside the shared <Layout> consistently is brittle (the Layout
  // wraps the whole list, not the row); the narrations describe the
  // detail screen without forcing an interaction that could trap the user.
  steps.push({
    id: "recorte-row-overview",
    kind: "narration",
    title: "Linhas da lista de recortes",
    description:
      "Cada linha mostra prévia do arquivo, nome, status e a tarefa relacionada. Toque em qualquer linha para abrir o detalhe completo do recorte.",
    placement: "center",
  });

  steps.push({
    id: "cut-detail-overview",
    kind: "narration",
    title: "Detalhe do Recorte",
    description:
      "Ao abrir um recorte, você vê: nome do arquivo .eps, tarefa de origem, tipo (Adesivo ou Estêncil), status, datas de início e conclusão e — quando for uma solicitação (resgate de erro) — o motivo: aplicação errada, perdido ou erro de corte.",
    placement: "center",
  });

  steps.push({
    id: "cut-detail-file-overview",
    kind: "narration",
    title: "Arquivo de corte",
    description:
      "A prévia do arquivo .eps aparece na tela de detalhes. Toque para abrir em tela cheia e baixar quando precisar conferir antes do corte.",
    placement: "center",
  });

  // ═══ ACT 10 — Líder: solicitar recorte (conditional) ════════════════════
  steps.push({
    id: "leader-cut-swipe-request",
    kind: "narration",
    title: "Solicitar novo recorte (Líder)",
    description:
      "Como líder do setor da tarefa, você pode pedir um novo recorte quando um foi perdido ou aplicado errado. Na lista de recortes ou na tabela de recortes dentro de uma tarefa, deslize uma linha para o lado para acessar a ação Solicitar.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-cut-request-modal",
    kind: "narration",
    title: "Formulário de solicitação (Líder)",
    description:
      "No formulário, escolha o motivo (aplicação errada, perdido ou erro) e confirme. O pedido entra na fila do setor de plotagem e aparece como Pendente, marcado como Solicitação.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-cut-actions-tip",
    kind: "narration",
    title: "Iniciar e concluir recortes (Líder)",
    description:
      "Líderes também podem mudar o status pelo deslize: Iniciar (Pendente → Cortando) e Concluir (Cortando → Concluído). Use para manter a fila atualizada em tempo real.",
    placement: "center",
    condition: leaderOnly,
  });

  // ═══ ACT 13 — Pessoal hub ═══════════════════════════════════════════════
  steps.push({
    id: "drawer-pessoal",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerPessoal,
    title: "Acesse Pessoal",
    description:
      "A área Pessoal concentra tudo que é seu: ponto, feriados, EPIs, mensagens, advertências, empréstimos, movimentações e bônus. Toque para abrir.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer item tap pushes /pessoal onto the stack.
    navigatesTo: ROUTES.pessoal,
    pulseTarget: true,
    hint: "Toque em Pessoal",
  });

  steps.push({
    id: "pessoal-grid",
    kind: "showcase",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGrid,
    title: "Hub Pessoal",
    description:
      "Cartões para cada área pessoal. Você vai conhecer cada um deles agora.",
    placement: "top",
  });

  // --- Pontos ---
  steps.push({
    id: "pessoal-pontos-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardPontos,
    title: "Meus Pontos",
    description: "Toque em Meus Pontos para ver o seu controle de ponto.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalPontos,
    pulseTarget: true,
    hint: "Toque em Meus Pontos",
  });

  steps.push({
    id: "pessoal-pontos-overview",
    kind: "showcase",
    screen: ROUTES.pessoalPontos,
    targetId: TUTORIAL_TARGETS.pessoalPontos,
    title: "Seu ponto eletrônico",
    description:
      "Tabela com entradas, saídas e cálculos do Secullum. Você navega por mês usando o seletor superior. Os totais ficam visíveis e podem ser comparados dia a dia.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-pontos-columns",
    kind: "narration",
    title: "Colunas disponíveis",
    description:
      "Cerca de 15 colunas: Data, Entrada/Saída 1 e 2, Normais, Faltas, Extras (50%/100%/150%), DSR, Noturno, Atraso, Abonos e Ajuste. Use o seletor de colunas para mostrar apenas as que importam para você.",
    placement: "center",
  });

  // ── Justificar Ausência walkthrough — DEEP interactive flow ─────────
  // Walks the user through the entire form: tap button → tap a missing
  // day row → spotlight each field → tap Enviar (mocked submit) → return.
  steps.push({
    id: "pessoal-pontos-justify-tap",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifyButton,
    title: "Justificar ausência",
    description:
      "Quando faltou o dia inteiro (não registrou nenhuma batida), use este ícone de calendário com X. Toque nele para abrir o formulário de Justificativa de Ausência.",
    placement: "bottom",
    expectedAction: "tap",
    // Justify button pushes the missing-days list route.
    navigatesTo: ROUTES.pessoalPontosJustificar,
    pulseTarget: true,
    hint: "Toque em Justificar",
  });

  steps.push({
    id: "pessoal-pontos-justify-list",
    kind: "showcase",
    screen: ROUTES.pessoalPontosJustificar,
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifyPage,
    title: "Dias sem batida",
    description:
      "A lista mostra os dias dos últimos 90 dias em que você não bateu o ponto. Para justificar um deles, toque na linha correspondente. Vamos abrir o primeiro da lista no próximo passo.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-pontos-justify-row-tap",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifyFirstRow,
    title: "Selecione um dia",
    description:
      "Toque na primeira linha (em destaque) para abrir o formulário de justificativa daquele dia.",
    placement: "bottom",
    expectedAction: "tap",
    // Row tap pushes the dynamic justify-form route (first missing day).
    navigatesTo: justifyFormRoute(),
    pulseTarget: true,
    hint: "Toque no dia",
  });

  steps.push({
    id: "pessoal-pontos-justify-form-overview",
    kind: "showcase",
    screen: justifyFormRoute(),
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifyForm,
    title: "Formulário de Justificativa",
    description:
      "Esta é a tela para enviar a justificativa. \"Ausência em\", \"Data\" e \"Período\" são preenchidos automaticamente. Vamos olhar cada campo que você precisa preencher.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-pontos-justify-motivo",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifyMotivo,
    title: "Motivo",
    description:
      "Toque no campo Motivo para abrir o seletor e escolher o tipo da justificativa: Atestado Médico, Licença Paternidade, Falta Justificada, Compensação de Banco de Horas, etc. Alguns motivos (como Atestado Médico) exigem foto do atestado — neste caso, um campo de foto aparece logo abaixo.",
    placement: "bottom",
  });

  steps.push({
    id: "pessoal-pontos-justify-observacao",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifyObservacao,
    title: "Observação",
    description:
      "Use o campo Observação para escrever detalhes adicionais — por exemplo o nome do médico, número do atestado, ou contexto da ausência. É opcional, mas ajuda na aprovação.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-pontos-justify-submit",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalPontosJustifySubmit,
    title: "Envie a solicitação",
    description:
      "Toque em Enviar para mandar a justificativa para aprovação no Secullum. No tutorial vamos simular o envio — vai aparecer um alerta de confirmação. Toque em OK no alerta, depois siga para o próximo passo. Em produção, sua solicitação aparece com status Pendente até o líder/RH aprovar.",
    placement: "top",
    tooltipPinToScreenTop: true,
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque em Enviar",
  });

  // Two-step back: form → list, then list → meus-pontos. Each step has its
  // own interactive chromeHeaderBack target and requires the user to tap.
  steps.push({
    id: "pessoal-pontos-justify-back-from-form",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar para a lista",
    description:
      "Depois de fechar o alerta, toque na seta voltar para retornar à lista de dias sem batida.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops the form route off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  steps.push({
    id: "pessoal-pontos-justify-back-from-list",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar para Meus Pontos",
    description:
      "Toque na seta voltar de novo para retornar ao espelho de ponto. Em seguida vamos ver Ajustar Ponto.",
    placement: "bottom",
    expectedAction: "tap",
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // ── Ajustar Ponto walkthrough — DEEP interactive flow ───────────────
  // The screen field is the same safety net we use on the pessoal-grid tap
  // steps: if the justify back chain left the user on a stale route, we
  // re-assert /meus-pontos so the Ajustar Ponto shortcut is actually on
  // screen when this step activates.
  steps.push({
    id: "pessoal-pontos-adjust-tap",
    kind: "interactive",
    screen: ROUTES.pessoalPontos,
    targetId: TUTORIAL_TARGETS.pessoalPontosAdjustButton,
    title: "Ajustar ponto",
    description:
      "Quando faltou apenas uma batida (esqueceu a entrada, intervalo ou saída), use este ícone de relógio com lápis. Toque para abrir o formulário de Ajuste de Ponto.",
    placement: "bottom",
    expectedAction: "tap",
    // Adjust button pushes the ajustar-ponto form route.
    navigatesTo: ROUTES.pessoalPontosAjustar,
    pulseTarget: true,
    hint: "Toque em Ajustar",
  });

  steps.push({
    id: "pessoal-pontos-adjust-page",
    kind: "showcase",
    screen: ROUTES.pessoalPontosAjustar,
    targetId: TUTORIAL_TARGETS.pessoalPontosAdjustPage,
    title: "Formulário de Ajuste",
    description:
      "Esta é a tela para corrigir batidas faltantes. Vamos olhar cada parte: primeiro a Data, depois os horários (entrada/saída), e por fim o botão Enviar.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-pontos-adjust-date",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalPontosAdjustDate,
    title: "Escolha a Data",
    description:
      "Toque no cabeçalho Data para abrir um seletor de calendário e escolher o dia que tem batida faltante. Por padrão começa em hoje, mas você pode voltar até o limite do período aberto no Secullum.",
    placement: "bottom",
  });

  steps.push({
    id: "pessoal-pontos-adjust-slots",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalPontosAdjustFirstSlot,
    title: "Informe a batida que faltou",
    description:
      "Toque em qualquer slot (Entrada 1, Saída 1, Entrada 2…) para abrir o relógio e informar o horário correto da batida faltante. Se quiser limpar, toque no X. Quando o slot tem horário, ele aparece em destaque; vazios mostram --:--.",
    placement: "bottom",
  });

  steps.push({
    id: "pessoal-pontos-adjust-submit",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalPontosAdjustSubmit,
    title: "Envie o ajuste",
    description:
      "Toque em Enviar para mandar o ajuste para aprovação no Secullum. No tutorial vamos simular o envio — nada real será alterado. Em produção, a solicitação fica com status Pendente até o líder/RH aprovar.",
    placement: "top",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque em Enviar",
  });

  steps.push({
    id: "pessoal-pontos-adjust-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar para Meus Pontos",
    description:
      "Toque na seta voltar para retornar ao espelho de ponto.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops the ajustar-ponto route off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  steps.push({
    id: "pessoal-pontos-refresh",
    kind: "narration",
    // Re-assert the route: after the back-from-form step the user may end
    // up on a stale screen (history popping is non-deterministic when the
    // tutorial has pushed the same route multiple times). Forcing the
    // screen on this narration brings the user back to meus-pontos so the
    // refresh instructions match the page they're staring at.
    screen: ROUTES.pessoalPontos,
    title: "Atualizar dados",
    description:
      "Puxe a tabela para baixo (pull-to-refresh) para sincronizar com o Secullum. É a maneira mais rápida quando o ponto acabou de ser registrado.",
    placement: "center",
  });

  steps.push({
    id: "pessoal-pontos-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar",
    description: "Toque na seta de voltar no topo para retornar ao hub Pessoal.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops /meus-pontos off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- Feriados ---
  steps.push({
    id: "pessoal-feriados-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardFeriados,
    title: "Meus Feriados",
    description: "Toque em Meus Feriados para ver o calendário oficial.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalFeriados,
    pulseTarget: true,
    hint: "Toque em Meus Feriados",
  });

  steps.push({
    id: "pessoal-feriados-page",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalFeriados,
    title: "Feriados do ano",
    description:
      "Lista os feriados nacionais e os recessos internos da empresa. Útil para planejar férias e compensações.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-feriados-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar ao hub Pessoal",
    description: "Toque na seta voltar.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops /meus-feriados off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- EPIs ---
  steps.push({
    id: "pessoal-epis-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardEpis,
    title: "Meus EPIs",
    description: "Toque em Meus EPIs para ver suas entregas de equipamento.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalEpis,
    pulseTarget: true,
    hint: "Toque em Meus EPIs",
  });

  steps.push({
    id: "pessoal-epis-list",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalEpis,
    title: "Lista de EPIs",
    description:
      "Mostra as entregas: pendentes, aprovadas, aguardando assinatura, entregues e concluídas. Cada entrega tem item, tamanho, quantidade e data.",
    placement: "top",
  });

  // ── PPE REQUEST FLOW (interactive — actually walks the user through it) ──
  // Step 1: tap the Solicitar EPI FAB → navigates to /request
  steps.push({
    id: "pessoal-epis-request-open",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalEpisRequestButton,
    title: "Solicitar um EPI — passo 1",
    description:
      "Para pedir um EPI, toque no botão Solicitar EPI (canto inferior direito). Ele abre o formulário de solicitação.",
    placement: "top",
    expectedAction: "tap",
    // Solicitar EPI FAB pushes the /request form route.
    navigatesTo: "/(tabs)/pessoal/meus-epis/request",
    pulseTarget: true,
    hint: "Toque em Solicitar EPI",
  });

  // Step 2: spotlight the request form, describe how to fill it
  steps.push({
    id: "pessoal-epis-request-pick-item",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalEpisRequestForm,
    title: "Preencha a solicitação — passo 2",
    description:
      "No campo Item, toque para abrir o catálogo e escolha o EPI desejado (camisa, calça, calçado, luva, capacete, óculos, protetor auditivo, máscara, capa de chuva, etc.). O catálogo já mostra apenas os tamanhos cadastrados no seu Perfil — então mantenha-o atualizado. Em seguida, no campo Justificativa, escreva o motivo (EPI danificado, desgasto, perda, etc.).",
    placement: "bottom",
  });

  // Step 3: explain the submit step (without actually submitting in tutorial mode)
  steps.push({
    id: "pessoal-epis-request-confirm",
    kind: "narration",
    title: "Confirme e envie — passo 3",
    description:
      "Após preencher item e justificativa, toque em Solicitar EPI no rodapé para enviar. A solicitação aparece na sua lista com status Pendente até o líder aprovar e o almoxarifado preparar a entrega. (No tutorial não vamos enviar — basta tocar em Continuar para seguir.)",
    placement: "center",
  });

  // Step 4: go back to the EPI list
  steps.push({
    id: "pessoal-epis-back-to-list",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Volte à lista — passo 4",
    description:
      "Toque na seta voltar para retornar à lista de EPIs. Vamos seguir para o passo de assinatura de uma entrega.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops the /request form off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // ── PPE SIGN FLOW (interactive — opens detail, taps Confirmar) ─────────────
  // Step 5a: explain the post-approval workflow BEFORE jumping into the
  // signature flow. Users were confused about what triggers the signature
  // step — they thought signing happened right after requesting. This step
  // makes the approval → almoxarifado → assinatura pipeline explicit.
  steps.push({
    id: "pessoal-epis-sign-workflow",
    kind: "narration",
    title: "Depois da aprovação",
    description:
      "Depois que o líder ou o RH aprova sua solicitação, o almoxarifado prepara o EPI e a entrega volta para sua lista com o badge Assinatura pendente. A partir daí o fluxo é: 1) Toque na linha da entrega para abrir os detalhes. 2) Role a tela até o final, onde fica o cartão Confirmar Recebimento. 3) Toque em Assinar / Confirmar Recebimento para registrar o recebimento eletronicamente. Vamos passar por cada um desses passos agora.",
    placement: "center",
    navigateOnEnter: "/(tabs)/pessoal/meus-epis",
  });

  // Step 5b: explain to tap an entry with Aguardando assinatura status
  steps.push({
    id: "pessoal-epis-sign-open",
    kind: "narration",
    title: "Assinar entrega — passo 1",
    description:
      "Procure na lista uma entrega com o badge Aguardando assinatura — esse é o sinal de que o almoxarifado já preparou o EPI. Toque na linha dessa entrega para abrir a tela de detalhes. No tutorial, vamos avançar tocando em Continuar e abrir os detalhes automaticamente.",
    placement: "center",
  });

  // Step 6: spotlight the SignDelivery card on the detail page. The card
  // sits below the item / certificate cards and is below the fold on most
  // phones — the SignDeliveryButton hook passes `scrollContainer` to the
  // tutorial target so this step auto-scrolls the page when it activates.
  steps.push({
    id: "pessoal-epis-sign-card",
    kind: "showcase",
    screen: "/(tabs)/pessoal/meus-epis/detalhes/[id]",
    targetId: TUTORIAL_TARGETS.pessoalEpisDetailSign,
    title: "Confirmar Recebimento — passo 2",
    description:
      "Esta é a tela de detalhes da entrega. Role a tela para baixo até encontrar o cartão Confirmar Recebimento — ele só aparece quando o EPI está com status Aguardando assinatura ou Entregue. É aqui que você assina eletronicamente o recebimento. (No tutorial, vamos rolar a tela automaticamente até o cartão.)",
    placement: "top",
    tooltipPinToScreenTop: true,
    // Routes to the WAITING_SIGNATURE PPE delivery from mockPpeDeliveries
    // (id(130) → "00000082-aaaa-4bbb-acac-000000000082"). The detail screen
    // resolves it via the tutorial mock detail bypass.
    navigateOnEnter:
      "/(tabs)/pessoal/meus-epis/detalhes/00000082-aaaa-4bbb-acac-000000000082",
  });

  // Step 7: user actually signs (mocked biometric in tutorial mode). The
  // tooltip is pinned to the top of the screen so it can't overlap the
  // button it's pointing to — the button sits at the bottom of the sign
  // card and the default "above the target" anchor would land right on it.
  steps.push({
    id: "pessoal-epis-sign-biometric",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalEpisBiometric,
    title: "Toque para confirmar — passo 3",
    description:
      "Toque no botão Confirmar Recebimento no rodapé do cartão para registrar a assinatura. No tutorial, vamos simular a confirmação biométrica — você verá \"Verificando biometria...\" e depois \"Recebimento Confirmado!\". Em produção, o app pede Face ID ou digital, captura o dispositivo, a localização aproximada e o horário, e emite um recibo eletrônico que cumpre a NR-6 e a LGPD — sem papel.",
    placement: "top",
    tooltipPinToScreenTop: true,
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque em Confirmar Recebimento",
  });

  steps.push({
    id: "pessoal-epis-sign-receipt",
    kind: "narration",
    title: "Recibo digital — passo 4",
    description:
      "Pronto! A entrega ficou registrada com seu nome, data, hora e a confirmação biométrica anexada. Esse recibo digital cumpre as exigências da LGPD e da NR-6 — você não precisa assinar formulários em papel. Toque em Continuar para encerrar o fluxo de EPIs.",
    placement: "center",
  });

  // Two-step back: detail → list, then list → /pessoal hub. Without the
  // second back, the next step (Mensagens on /pessoal) activates while the
  // user is still on /meus-epis and the spotlight target isn't there.
  steps.push({
    id: "pessoal-epis-back-from-detail",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar para a lista",
    description: "Toque na seta voltar para retornar à lista de EPIs.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops the EPI detail off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  steps.push({
    id: "pessoal-epis-back-from-list",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar ao hub Pessoal",
    description: "Toque na seta voltar de novo para retornar ao hub Pessoal e ver Mensagens.",
    placement: "bottom",
    expectedAction: "tap",
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- Mensagens ---
  // `screen: ROUTES.pessoal` is a safety net: if the previous back step
  // didn't land the user on the hub (history quirks, drawer-sibling pop,
  // etc.), the step-entry effect navigates them back to /pessoal so the
  // grid card target can actually register. Same rationale applies to the
  // other pessoal-hub tap steps below.
  steps.push({
    id: "pessoal-mensagens-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardMensagens,
    title: "Minhas Mensagens",
    description: "Toque em Mensagens para ver os comunicados da liderança.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalMensagens,
    pulseTarget: true,
    hint: "Toque em Minhas Mensagens",
  });

  steps.push({
    id: "pessoal-mensagens-page",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalMensagens,
    title: "Comunicados",
    description:
      "Os comunicados da liderança aparecem aqui em grade. Mensagens não lidas têm o cartão destacado em verde com o badge \"Novo\".",
    placement: "top",
  });

  // Production users can't create messages — only read them. So this step
  // is about OPENING the first message: tap the card → modal opens with the
  // full content. After reading, the user closes the modal and the next
  // step (Voltar) becomes visible underneath.
  //
  // IMPORTANT: react-native `<Modal>` renders in a separate native window
  // above ALL React-rendered siblings — including the tutorial overlay —
  // and zIndex/elevation cannot reach it. So every instruction for this
  // section MUST live in this step's description (visible BEFORE the
  // tap), because once the modal is open no tooltip is readable. A
  // post-modal narration step was removed for this reason — its content
  // is folded into this description instead.
  steps.push({
    id: "pessoal-mensagens-open",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalMensagensFirstItem,
    title: "Abra um comunicado",
    description:
      "Toque no primeiro cartão (em destaque verde) para abrir o comunicado em tela cheia. Leia o conteúdo (textos, listas, citações, imagens, etc.). Quando terminar, toque no X no canto superior direito (ou toque fora) para fechar. Pronto — o cartão deixa de mostrar o badge \"Novo\" e o sistema marca a leitura para o RH / liderança. Após fechar o modal, o próximo passo aparece em destaque.",
    placement: "bottom",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no comunicado",
  });

  steps.push({
    id: "pessoal-mensagens-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar",
    description: "Volte ao hub.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops /minhas-mensagens off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- Advertências ---
  steps.push({
    id: "pessoal-advertencias-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardAdvertencias,
    title: "Minhas Advertências",
    description: "Toque para ver seu histórico disciplinar.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalAdvertencias,
    pulseTarget: true,
    hint: "Toque em Minhas Advertências",
  });

  steps.push({
    id: "pessoal-advertencias-page",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalAdvertencias,
    title: "Histórico de Advertências",
    description:
      "Registros disciplinares com data, motivo, gravidade (Verbal, Escrita, Suspensão) e descrição. Útil para acompanhar comprometimentos.",
    placement: "top",
  });

  steps.push({
    id: "pessoal-advertencias-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar",
    description: "Volte ao hub.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops /minhas-advertencias off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- Empréstimos ---
  steps.push({
    id: "pessoal-emprestimos-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardEmprestimos,
    title: "Meus Empréstimos",
    description: "Toque para ver itens emprestados da empresa.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalEmprestimos,
    pulseTarget: true,
    hint: "Toque em Meus Empréstimos",
  });

  steps.push({
    id: "pessoal-emprestimos-page",
    kind: "narration",
    title: "Itens emprestados",
    description:
      "Esta tela lista ferramentas e equipamentos que estão com você. Ao devolver, o status muda para Devolvido com a data correspondente. Mantenha a lista limpa: devolva o que não estiver usando.",
    placement: "center",
  });

  steps.push({
    id: "pessoal-emprestimos-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar",
    description: "Volte ao hub.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops /meus-emprestimos off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- Movimentações ---
  steps.push({
    id: "pessoal-movimentacoes-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardMovimentacoes,
    title: "Minhas Movimentações",
    description: "Toque para ver suas retiradas de estoque.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the subsection route.
    navigatesTo: ROUTES.pessoalMovimentacoes,
    pulseTarget: true,
    hint: "Toque em Minhas Movimentações",
  });

  steps.push({
    id: "pessoal-movimentacoes-page",
    kind: "narration",
    title: "Retiradas e ajustes",
    description:
      "Esta tela mostra seu histórico de itens retirados do estoque (lixas, fitas, máscaras, etc.) com data, quantidade e motivo (Consumo, EPI, Empréstimo). Bom para auditoria pessoal.",
    placement: "center",
  });

  steps.push({
    id: "pessoal-movimentacoes-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar",
    description: "Volte ao hub.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops /minhas-movimentacoes off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
  });

  // --- Bônus ---
  // Bonus eligibility note shown to EVERYONE so non-bonifiable users still
  // learn that the feature exists — but the walkthrough only runs for
  // users who can actually see the bonus card.
  steps.push({
    id: "pessoal-bonus-eligibility",
    kind: "narration",
    // Re-assert /pessoal: the previous step is `pessoal-movimentacoes-back`
    // and the back-tap history is non-deterministic.
    screen: ROUTES.pessoal,
    title: "Sobre o Bônus",
    description:
      "Se o seu cargo é elegível e você está em situação Efetivado, o cartão Bônus aparece no hub Pessoal. O bônus é apurado em um período de 26 a 25 e composto por valor base, performance e comissões. Quando estiver elegível, este tour ganha um trecho dedicado.",
    placement: "center",
  });

  steps.push({
    id: "pessoal-bonus-tap",
    kind: "interactive",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGridCardBonus,
    title: "Meu Bônus",
    description: "Toque para abrir seu painel de bônus.",
    placement: "top",
    expectedAction: "tap",
    // Pessoal grid card tap pushes the bonus hub route.
    navigatesTo: ROUTES.pessoalBonus,
    pulseTarget: true,
    hint: "Toque em Meu Bônus",
    condition: bonifiableOnly,
  });

  // After the user taps the Bônus card on /pessoal the engine lands on
  // /pessoal/meu-bonus (the hub) which immediately renders the live bonus.
  // The new chain spotlights each section in order so each overlay actually
  // anchors to a visible card instead of stacking centered narrations.

  steps.push({
    id: "pessoal-bonus-period-card",
    kind: "showcase",
    screen: ROUTES.pessoalBonus,
    targetId: TUTORIAL_TARGETS.pessoalBonusPeriodCard,
    title: "Período de Apuração",
    description:
      "O bônus é apurado do dia 26 ao dia 25 do mês seguinte. Os números neste tour são apenas demonstrativos — no seu app aparecem os valores reais do seu período. Você é elegível se seu cargo é bonificável e sua situação é Efetivado.",
    placement: "bottom",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-rules",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalBonusRules,
    title: "Regras do Bônus",
    description:
      "O botão Regras abre o documento detalhado: tabelas de assiduidade, política de faltas, atestado, multiplicador por cargo e critérios das comissões. Você pode tocar agora ou voltar depois.",
    placement: "bottom",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-amounts",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalBonusAmount,
    title: "Valor do Bônus",
    description:
      "O cartão mostra o cálculo em tempo real: Valor Base, somado de Extras e subtraído de Descontos, resulta no Valor Líquido. Os números no tour são apenas demonstrativos.",
    placement: "top",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-discounts-detail",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalBonusDiscounts,
    title: "Descontos por Ausência",
    description:
      "Cada desconto detalha o motivo e as datas/horários da ocorrência. Os exemplos mostrados (faltas, atrasos) reduzem um percentual do valor base. Toque na linha para abrir a regra exata aplicada.",
    placement: "top",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-performance",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalBonusPerformance,
    title: "Nível de Performance",
    description:
      "Mostra seu cargo, setor e o nível atingido no período (1 a 5). O nível depende da quantidade de tarefas que você fechou no período em relação à média do seu setor. Quanto mais entregas comparado à média, maior o nível e o multiplicador aplicado ao bônus base.",
    placement: "top",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-commission",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.pessoalBonusCommission,
    title: "Status das Comissões",
    description:
      "Os badges contam quantas tarefas tiveram Comissão Integral, Parcial, Sem Comissão ou Suspensa no período. Cada tipo entra com peso diferente no líquido. Toque em qualquer badge para ver as tarefas correspondentes.",
    placement: "top",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-historico-tap",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.pessoalBonusNavHistorico,
    title: "Histórico de Bônus",
    description:
      "Toque em Histórico para ver os bônus dos meses anteriores: períodos confirmados, pagos e detalhamentos.",
    placement: "top",
    expectedAction: "tap",
    // Bonus sub-nav tap pushes the histórico route.
    navigatesTo: ROUTES.pessoalBonusHistorico,
    pulseTarget: true,
    hint: "Toque em Histórico",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-historico-overview",
    kind: "narration",
    screen: ROUTES.pessoalBonusHistorico,
    title: "Lista de Períodos",
    description:
      "Cada linha é um período fechado: mês, status (Provisório, Confirmado ou Pago), nível atingido e valor líquido. Os registros exibidos no tour são apenas demonstrativos — no app real você vê seus períodos anteriores com descontos e assiduidade extra (quando aplicável). Toque em qualquer linha para abrir o detalhamento completo.",
    placement: "center",
    condition: bonifiableOnly,
  });

  steps.push({
    id: "pessoal-bonus-back",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeHeaderBack,
    title: "Voltar ao Hub",
    description:
      "Toque na seta voltar para retornar ao painel atual e depois ao hub Pessoal. Você pode revisitar o bônus a qualquer momento pelo cartão Meu Bônus.",
    placement: "bottom",
    expectedAction: "tap",
    // Back-button tap pops the bonus route off the stack.
    popsOnAction: true,
    pulseTarget: true,
    hint: "Toque na seta voltar",
    condition: bonifiableOnly,
  });

  // ═══ ACT 14 — Minha Equipe (conditional) ═════════════════════════════════
  // Re-assert /pessoal after `pessoal-bonus-back`: history pops are not
  // deterministic and this narration should be anchored to the hub.
  steps.push({
    id: "leader-meu-pessoal-intro",
    kind: "narration",
    screen: ROUTES.pessoal,
    title: "Minha Equipe (Líder)",
    description:
      "Como líder de setor, você tem acesso a um painel adicional: Minha Equipe. Lá você acompanha membros do setor, suas entregas de EPI, advertências, empréstimos, movimentações e cálculo de ponto.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-drawer-minha-equipe",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerMinhaEquipe,
    title: "Acesse Minha Equipe",
    description: "Toque em Minha Equipe.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer item tap pushes /meu-pessoal onto the stack.
    navigatesTo: ROUTES.meuPessoal,
    pulseTarget: true,
    hint: "Toque em Minha Equipe",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-meu-pessoal-grid",
    kind: "narration",
    screen: ROUTES.meuPessoal,
    title: "Hub do Líder",
    description:
      "Esta tela dá acesso rápido a: Usuários, EPIs, Advertências, Empréstimos, Movimentações e Cálculos da equipe.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-meu-pessoal-usuarios",
    kind: "narration",
    title: "Usuários da Equipe",
    description:
      "Lista de membros do seu setor com status, cargo, contatos. Toque em um membro para ver os detalhes individuais.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-meu-pessoal-epis",
    kind: "narration",
    title: "EPIs da Equipe",
    description:
      "Tabela com as entregas de EPI de todos os membros. Aqui o líder revisa pendências e autoriza entregas.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-meu-pessoal-calculos",
    kind: "narration",
    title: "Cálculos de Ponto da Equipe",
    description:
      "Espelho de ponto consolidado por membro, mês a mês. Use para revisar antes do fechamento da folha.",
    placement: "center",
    condition: leaderOnly,
  });

  steps.push({
    id: "leader-meu-pessoal-back",
    kind: "narration",
    title: "Voltar para o tour geral",
    description: "Vamos continuar com a parte comum do app.",
    placement: "center",
    condition: leaderOnly,
  });

  // ═══ ACT 15 — Avatar, Preferências, Notificações ═════════════════════════
  // The avatar at the top of the side drawer is the entry point for
  // Perfil / Preferências / Tema / Sair. We teach the avatar tap first so
  // the user understands where these items live, then walk through
  // Preferências → Notificações configuration → Perfil.
  steps.push({
    id: "drawer-avatar-tap",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerAvatarButton,
    title: "Menu do Usuário",
    description:
      "Toque no seu avatar (foto ou inicial do nome) no topo do menu lateral para abrir o menu pessoal com Meu Perfil, Preferências, alternar Tema e Sair.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no avatar",
  });

  steps.push({
    id: "drawer-configuracoes",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerConfiguracoes,
    title: "Acesse Preferências",
    description:
      "Com o menu do avatar aberto você vê os atalhos: Meu Perfil, Preferências, Tema e Sair. Agora toque em Preferências para configurar tema, notificações e privacidade.",
    placement: "bottom",
    openDrawerOnEnter: true,
    expectedAction: "tap",
    // Drawer submenu item tap pushes /preferencias onto the stack.
    navigatesTo: ROUTES.preferencias,
    pulseTarget: true,
    hint: "Toque em Preferências",
  });

  steps.push({
    id: "preferences-theme-card",
    kind: "showcase",
    screen: ROUTES.preferencias,
    targetId: TUTORIAL_TARGETS.preferencesThemeCard,
    title: "Tema",
    description:
      "Em Tema você escolhe entre Claro, Escuro ou Seguir o Sistema. A mudança é imediata e fica salva no seu perfil.",
    placement: "bottom",
  });

  steps.push({
    id: "preferences-notifications-tap",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.preferencesNotificationsCard,
    title: "Notificações",
    description:
      "Em Notificações você escolhe quais eventos vão te alertar e por quais canais (In-App, Push, Email, WhatsApp). Toque para abrir.",
    placement: "bottom",
    expectedAction: "tap",
    // Card tap pushes the notification-preferences route.
    navigatesTo: ROUTES.notificationPreferences,
    pulseTarget: true,
    hint: "Toque em Notificações",
  });

  steps.push({
    id: "notifications-legend",
    kind: "showcase",
    screen: ROUTES.notificationPreferences,
    targetId: TUTORIAL_TARGETS.notifPrefsLegend,
    title: "Canais de Notificação",
    description:
      "Cada evento pode ser entregue por até 4 canais: In-App (notificação dentro do app), Push (notificação no celular), Email e WhatsApp. A legenda acima mostra a cor de cada canal — você verá os mesmos ícones nos eventos abaixo.",
    placement: "bottom",
  });

  steps.push({
    id: "notifications-section",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.notifPrefsFirstSection,
    title: "Categorias",
    description:
      "Os eventos estão agrupados por categoria. Como usuário de produção, você vê Tarefas, Avisos Pessoais e Sistema (categorias administrativas como Pedidos e Estoque não aparecem). Toque no cabeçalho para expandir e ver os eventos — durante este tour já abrimos a primeira categoria para você.",
    placement: "bottom",
  });

  steps.push({
    id: "notifications-toggles",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.notifPrefsChannelToggles,
    title: "Ative ou Desative Canais",
    description:
      "Cada evento mostra os 4 ícones de canal (In-App, Push, Email, WhatsApp). Toque em um ícone para ativar (fica colorido) ou desativar (fica cinza). Alguns canais são obrigatórios e não podem ser desativados. As mudanças são salvas automaticamente — não precisa apertar botão de salvar.",
    placement: "top",
  });

  steps.push({
    id: "preferences-replay",
    kind: "showcase",
    screen: ROUTES.preferencias,
    targetId: TUTORIAL_TARGETS.preferencesReplayButton,
    title: "Refazer Tutorial",
    description:
      "Se algum dia quiser revisitar este tour, basta tocar em Refazer Tutorial nesta tela. Útil quando recursos novos chegam ao app.",
    placement: "bottom",
  });

  // ═══ ACT 16 — Perfil ════════════════════════════════════════════════════
  // Make the drawer reopen step EXPLICIT — the user needs to learn that
  // navigation back to Perfil/Preferências/Tema requires re-opening the
  // side drawer. Previous version relied on `openDrawerOnEnter: true`
  // which silently auto-opened the drawer ("by itself") without teaching
  // the action.
  steps.push({
    id: "drawer-reopen",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.chromeDrawerToggle,
    title: "Abra o Menu Lateral",
    description:
      "Para acessar Meu Perfil, vamos abrir o menu lateral novamente. Toque no ícone de menu (três linhas) no canto superior direito.",
    placement: "bottom",
    expectedAction: "tap",
    pulseTarget: true,
    hint: "Toque no ícone de menu",
  });

  steps.push({
    id: "drawer-perfil",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerPerfil,
    title: "Meu Perfil",
    description:
      "Com o menu aberto, toque no seu avatar para abrir o sub-menu (se ainda não estiver aberto) e depois em Meu Perfil para ver e editar seus dados.",
    placement: "bottom",
    expectedAction: "tap",
    // Drawer submenu item tap pushes /perfil onto the stack.
    navigatesTo: ROUTES.perfil,
    pulseTarget: true,
    hint: "Toque em Meu Perfil",
  });

  steps.push({
    id: "perfil-photo",
    kind: "showcase",
    screen: ROUTES.perfil,
    targetId: TUTORIAL_TARGETS.perfilPhoto,
    title: "Foto de Perfil",
    description:
      "Toque na sua foto para trocar ou remover. Recomendamos imagem quadrada (1:1) com seu rosto visível — facilita identificação na equipe.",
    placement: "bottom",
  });

  steps.push({
    id: "perfil-info",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.perfilAddress,
    title: "Endereço e Dados Pessoais",
    description:
      "Você pode atualizar email, telefone e endereço. Setor e cargo são definidos pela administração e aparecem apenas para conferência. Ao informar o CEP, os campos de rua, bairro e cidade são preenchidos automaticamente.",
    placement: "top",
  });

  steps.push({
    id: "perfil-sizes",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.perfilSizes,
    title: "Tamanhos para EPIs",
    description:
      "Cadastre seus tamanhos (camisa, calça, calçado, luva). Eles filtram automaticamente os EPIs que aparecem para você solicitar.",
    placement: "top",
  });

  steps.push({
    id: "perfil-save",
    kind: "narration",
    title: "Salvar mudanças",
    description:
      "Use Restaurar para descartar alterações não salvas ou Salvar para confirmar. As mudanças ficam sincronizadas em qualquer dispositivo.",
    placement: "center",
  });

  // ═══ ACT 18 — Conclusão ═════════════════════════════════════════════════
  steps.push({
    id: "completion",
    kind: "narration",
    title: "Pronto, tudo certo!",
    description:
      "Você concluiu o tour. Toque em Concluir para começar a usar o app. Se quiser refazer o tutorial mais tarde, vá em Pessoal → Preferências → Refazer Tutorial. Bons trabalhos!",
    placement: "center",
    ctaLabel: "Concluir",
    celebrate: true,
  });

  return steps;
}
