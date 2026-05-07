import type { TourStep } from "./types";

export const TOUR_TARGET_IDS = {
  homeWelcomeCard: "home-welcome-card",
  homeQuickActions: "home-quick-actions",
  homeTimeCard: "home-time-card",
  drawerToggle: "drawer-toggle",
  cronogramaList: "cronograma-list",
  cronogramaFirstTask: "cronograma-first-task",
  recorteList: "recorte-list",
  aerografiaList: "aerografia-list",
  garagensGrid: "garagens-grid",
  historicoTabs: "historico-tabs",
  observacoesList: "observacoes-list",
  catalogoList: "catalogo-list",
  estoqueList: "estoque-list",
  notificationsBell: "notifications-bell",
  notificationsList: "notifications-list",
  perfilPhoto: "perfil-photo",
  perfilSizes: "perfil-sizes",
  perfilReplayButton: "perfil-replay-button",
  meuPessoalHub: "meu-pessoal-hub",
  meuPessoalUsers: "meu-pessoal-users",
  meuPessoalMovements: "meu-pessoal-movements",
  meuPessoalEpis: "meu-pessoal-epis",
} as const;

const ROUTES = {
  inicio: "/(tabs)/inicio",
  cronograma: "/(tabs)/producao/cronograma/listar",
  recorte: "/(tabs)/producao/recorte/listar",
  aerografia: "/(tabs)/producao/aerografia/listar",
  garagens: "/(tabs)/producao/garagens",
  historico: "/(tabs)/producao/historico",
  observacoes: "/(tabs)/producao/observacoes/listar",
  catalogo: "/(tabs)/pintura/catalogo-basico/listar",
  estoque: "/(tabs)/estoque/produtos/listar",
  notifications: "/(tabs)/notifications",
  perfil: "/(tabs)/perfil",
  meuPessoal: "/(tabs)/meu-pessoal",
  meuPessoalUsuarios: "/(tabs)/meu-pessoal/usuarios",
  meuPessoalMovimentacoes: "/(tabs)/meu-pessoal/movimentacoes",
  meuPessoalEpis: "/(tabs)/meu-pessoal/epis",
} as const;

const DEFAULT_AUTO_MS = 4500;

const productionSteps: TourStep[] = [
  {
    id: "welcome",
    screen: ROUTES.inicio,
    title: "Bem-vindo à Ankaa! 👋",
    description:
      "Vamos fazer um tour rápido pelo aplicativo. Você pode pular a qualquer momento, ou alternar entre o modo automático (eu te guio) e o modo manual (você avança quando quiser). Este tour usa dados de demonstração — nada do que você vê aqui é real.",
    placement: "center",
    autoAdvanceMs: 6000,
  },
  {
    id: "home-overview",
    screen: ROUTES.inicio,
    targetId: TOUR_TARGET_IDS.homeWelcomeCard,
    title: "Tela Inicial",
    description:
      "Esta é sua tela inicial. Aqui aparecem suas tarefas em destaque, mensagens recentes e atalhos para as áreas que você usa todo dia.",
    placement: "bottom",
  },
  {
    id: "home-quick-actions",
    screen: ROUTES.inicio,
    targetId: TOUR_TARGET_IDS.homeQuickActions,
    title: "Atalhos Rápidos",
    description:
      "Estes cartões levam direto para Cronograma, Recorte e Aerografia — as três áreas onde você passa a maior parte do dia.",
    placement: "top",
  },
  {
    id: "home-time-card",
    screen: ROUTES.inicio,
    targetId: TOUR_TARGET_IDS.homeTimeCard,
    title: "Ponto e Horários",
    description:
      "Acompanhe suas batidas de ponto, horas trabalhadas e saldo do banco de horas direto daqui. As informações vêm do Secullum.",
    placement: "top",
  },
  {
    id: "drawer-intro",
    screen: ROUTES.inicio,
    targetId: TOUR_TARGET_IDS.drawerToggle,
    title: "Menu Principal",
    description:
      "Toque no ícone de menu para abrir a navegação completa. Você só verá os módulos que tem permissão para acessar.",
    placement: "bottom",
    mode: "interactive",
    ctaLabel: "Toque no menu",
  },
  {
    id: "cronograma-intro",
    screen: ROUTES.cronograma,
    title: "Cronograma de Produção",
    description:
      "Aqui ficam todas as tarefas atribuídas ao seu setor. É a sua fila de trabalho do dia.",
    placement: "center",
  },
  {
    id: "cronograma-list",
    screen: ROUTES.cronograma,
    targetId: TOUR_TARGET_IDS.cronogramaList,
    title: "Lista de Tarefas",
    description:
      "Cada cartão mostra o caminhão, o cliente e o status. Cores indicam: amarelo = aguardando, azul = em produção, verde = concluído.",
    placement: "top",
  },
  {
    id: "cronograma-tap-task",
    screen: ROUTES.cronograma,
    targetId: TOUR_TARGET_IDS.cronogramaFirstTask,
    title: "Abra uma Tarefa",
    description:
      "Toque em uma tarefa para ver detalhes: peças, recortes, aerografia, fotos de referência e arte.",
    placement: "bottom",
    mode: "interactive",
    ctaLabel: "Toque na tarefa de demonstração",
  },
  {
    id: "recorte-intro",
    screen: ROUTES.recorte,
    targetId: TOUR_TARGET_IDS.recorteList,
    title: "Recorte",
    description:
      "Acompanhe os recortes de vinil. Você pode iniciar um recorte, marcar como concluído e ver as artes de cada peça.",
    placement: "top",
  },
  {
    id: "aerografia-intro",
    screen: ROUTES.aerografia,
    targetId: TOUR_TARGET_IDS.aerografiaList,
    title: "Aerografia",
    description:
      "Lista de trabalhos de aerografia. Igual ao Recorte: você inicia, finaliza e visualiza referências de cada job.",
    placement: "top",
  },
  {
    id: "garagens-intro",
    screen: ROUTES.garagens,
    targetId: TOUR_TARGET_IDS.garagensGrid,
    title: "Garagens",
    description:
      "Mapa visual das garagens e vagas. Veja quais caminhões estão em cada vaga e em qual etapa da produção.",
    placement: "top",
  },
  {
    id: "historico-intro",
    screen: ROUTES.historico,
    targetId: TOUR_TARGET_IDS.historicoTabs,
    title: "Histórico",
    description:
      "Tarefas concluídas e canceladas ficam aqui. Use para consultar o que já foi feito antes.",
    placement: "bottom",
  },
  {
    id: "observacoes-intro",
    screen: ROUTES.observacoes,
    targetId: TOUR_TARGET_IDS.observacoesList,
    title: "Observações",
    description:
      "Anotações da produção. Registre problemas, ajustes ou pedidos especiais que precisam ficar documentados.",
    placement: "top",
  },
  {
    id: "catalogo-intro",
    screen: ROUTES.catalogo,
    targetId: TOUR_TARGET_IDS.catalogoList,
    title: "Catálogo de Tintas",
    description:
      "Consulta de tintas, marcas e acabamentos. Você verá fórmulas se for líder de equipe.",
    placement: "top",
  },
  {
    id: "estoque-intro",
    screen: ROUTES.estoque,
    targetId: TOUR_TARGET_IDS.estoqueList,
    title: "Estoque",
    description:
      "Consulta de itens e materiais. Você pode ver quantidades, mas a edição é restrita ao Almoxarifado.",
    placement: "top",
  },
  {
    id: "notifications-intro",
    screen: ROUTES.notifications,
    targetId: TOUR_TARGET_IDS.notificationsList,
    title: "Notificações",
    description:
      "Tudo que acontece com você aparece aqui: novas tarefas, recortes prontos, mensagens do líder.",
    placement: "top",
  },
  {
    id: "perfil-intro",
    screen: ROUTES.perfil,
    targetId: TOUR_TARGET_IDS.perfilPhoto,
    title: "Seu Perfil",
    description:
      "Atualize foto, contato e endereço. Mantenha seus dados sempre em dia.",
    placement: "bottom",
  },
  {
    id: "perfil-sizes",
    screen: ROUTES.perfil,
    targetId: TOUR_TARGET_IDS.perfilSizes,
    title: "Tamanhos de EPI",
    description:
      "Informe seus tamanhos de camisa, calça e bota. O RH usa esses dados para entregar EPIs do tamanho certo.",
    placement: "top",
  },
];

const leaderSteps: TourStep[] = [
  {
    id: "leader-intro",
    screen: ROUTES.perfil,
    title: "Você é Líder de Equipe 🎯",
    description:
      "Como líder, você tem acesso a recursos extras de gestão. Vamos passar por eles agora.",
    placement: "center",
    leaderOnly: true,
    autoAdvanceMs: 5000,
  },
  {
    id: "leader-meu-pessoal",
    screen: ROUTES.meuPessoal,
    targetId: TOUR_TARGET_IDS.meuPessoalHub,
    title: "Minha Equipe",
    description:
      "Painel de gestão da sua equipe. A partir daqui você acompanha tudo que envolve as pessoas que você lidera.",
    placement: "center",
    leaderOnly: true,
  },
  {
    id: "leader-users",
    screen: ROUTES.meuPessoalUsuarios,
    targetId: TOUR_TARGET_IDS.meuPessoalUsers,
    title: "Membros da Equipe",
    description:
      "Lista completa dos colaboradores do seu setor. Toque em qualquer um para ver detalhes, advertências e EPIs entregues.",
    placement: "top",
    leaderOnly: true,
  },
  {
    id: "leader-movements",
    screen: ROUTES.meuPessoalMovimentacoes,
    targetId: TOUR_TARGET_IDS.meuPessoalMovements,
    title: "Movimentações",
    description:
      "Histórico de tudo que entrou e saiu do estoque pela mão da sua equipe. Filtre por pessoa, item ou período.",
    placement: "top",
    leaderOnly: true,
  },
  {
    id: "leader-epis",
    screen: ROUTES.meuPessoalEpis,
    targetId: TOUR_TARGET_IDS.meuPessoalEpis,
    title: "EPIs da Equipe",
    description:
      "Acompanhe entregas de EPI: pendentes, agendadas, entregues. Você é responsável por aprovar e revisar.",
    placement: "top",
    leaderOnly: true,
  },
];

const finalStep: TourStep = {
  id: "complete",
  screen: ROUTES.inicio,
  title: "Tudo pronto! 🎉",
  description:
    "Você concluiu o tour. Agora é só começar. Se quiser rever, abra o seu Perfil e toque em \"Repetir Tour\". Bom trabalho!",
  placement: "center",
  autoAdvanceMs: 6000,
};

export function buildTourSteps(opts: { isLeader: boolean }): TourStep[] {
  const steps: TourStep[] = [...productionSteps];
  if (opts.isLeader) steps.push(...leaderSteps);
  steps.push(finalStep);
  return steps.map((s) => ({
    mode: s.mode ?? "narrate",
    autoAdvanceMs: s.autoAdvanceMs ?? DEFAULT_AUTO_MS,
    placement: s.placement ?? "bottom",
    ...s,
  }));
}
