import { TUTORIAL_TARGETS } from "./target-ids";
import type { TutorialStep } from "./types";

/**
 * The full game-tutorial script for PRODUCTION sector users.
 *
 * Three step kinds:
 *   - "narration" : full-screen tooltip, no target, advance with CTA button.
 *   - "showcase"  : spotlight + tooltip, auto-advance after `autoAdvanceMs` OR
 *                   the user taps "Continuar".
 *   - "interactive": spotlight + tooltip, *blocks* until the user performs the
 *                   `expectedAction`. No auto-advance.
 *
 * Coverage scope: only routes a base PRODUCTION user can actually reach.
 * Aerografia and Garagens are EXCLUDED — `privilege-optimized-full-fixed.tsx`
 * blocks `producao/aerografia/*` and `producao/garagens/*` for PRODUCTION.
 */

const ROUTES = {
  inicio: "/(tabs)/inicio",
  cronograma: "/(tabs)/producao/cronograma/listar",
  // Unified task detail route. Dynamic [id] route — used as a destination
  // reached via user navigation, never via auto-navigate.
  recorte: "/(tabs)/producao/recorte/listar",
  historico: "/(tabs)/producao/historico",
  observacoes: "/(tabs)/producao/observacoes/listar",
  observacoesNova: "/(tabs)/producao/observacoes/cadastrar",
  ordens: "/(tabs)/producao/ordens-de-servico/listar",
  notifications: "/(tabs)/notifications",
  pessoal: "/(tabs)/pessoal",
  pessoalPontos: "/(tabs)/pessoal/meus-pontos",
  pessoalFeriados: "/(tabs)/pessoal/meus-feriados",
  pessoalEpis: "/(tabs)/pessoal/meus-epis",
  configuracoes: "/(tabs)/configuracoes",
  preferencias: "/(tabs)/pessoal/preferencias",
  perfil: "/(tabs)/perfil",
} as const;

const SHOWCASE_DURATION = 4500;

export function buildTutorialSteps(): TutorialStep[] {
  const steps: TutorialStep[] = [];

  // ============================================================
  // ACT 1 — Welcome (Início)
  // ============================================================
  steps.push({
    id: "welcome",
    kind: "narration",
    title: "Bem-vindo à Ankaa! 👋",
    description:
      "Vamos fazer um tour rápido pelo aplicativo para você aprender a usá-lo. Você pode refazer este tutorial a qualquer momento na página de Preferências.",
    placement: "center",
    ctaLabel: "Começar",
    expectedAction: "continue",
  });

  steps.push({
    id: "home-greeting",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeGreeting,
    title: "Tela Inicial",
    description:
      "Esta é sua tela de início. No topo ficam o seu cumprimento e a hora atual.",
    placement: "bottom",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  // ─── Widget panel walkthrough ────────────────────────────────────────────
  steps.push({
    id: "home-widgets-intro",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeWidgetList,
    title: "Painel de Widgets",
    description:
      "Abaixo do cumprimento fica o seu painel de widgets — blocos com seus pontos, tarefas, mensagens, favoritos e mais. Você escolhe quais aparecem.",
    placement: "top",
    autoAdvanceMs: SHOWCASE_DURATION + 1500,
  });

  steps.push({
    id: "home-edit-panel",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeEditPanelButton,
    title: "Personalizar o Painel",
    description:
      "Toque em 'Editar' para personalizar seu painel — adicionar, remover ou reordenar widgets.",
    placement: "bottom",
    ctaLabel: "Toque em Editar",
    expectedAction: "tap",
    pulseTarget: true,
  });

  steps.push({
    id: "home-edit-toolbar",
    kind: "showcase",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeEditToolbar,
    title: "Modo Edição",
    description:
      "Agora você está no modo edição. 'Salvar' confirma suas mudanças e 'Cancelar' descarta. Em cada widget, use a alça (≡) para arrastar e o ícone de lixeira para remover.",
    placement: "bottom",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "home-add-widget",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeAddWidgetButton,
    title: "Adicionar Widget",
    description:
      "Toque em 'Adicionar widget' para abrir o catálogo de widgets disponíveis.",
    placement: "top",
    ctaLabel: "Toque em + Adicionar widget",
    expectedAction: "tap",
    pulseTarget: true,
  });

  steps.push({
    id: "home-widget-catalog",
    kind: "narration",
    title: "Catálogo de Widgets 📦",
    description:
      "Este é o catálogo: tarefas, ponto diário, favoritos, mensagens recentes, EPIs, empréstimos, parcelas, anotações rápidas e mais. Toque em qualquer um para adicionar ao seu painel — você pode experimentar depois.",
    placement: "center",
    ctaLabel: "Continuar",
    expectedAction: "continue",
  });

  steps.push({
    id: "home-cancel-edit",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.homeCancelEditButton,
    title: "Sair sem Salvar",
    description:
      "Para sair do modo edição sem fazer alterações, toque em 'Cancelar'.",
    placement: "bottom",
    ctaLabel: "Toque em Cancelar",
    expectedAction: "tap",
    pulseTarget: true,
  });

  // ============================================================
  // ACT 2 — Drawer Tour
  // ============================================================
  steps.push({
    id: "drawer-intro",
    kind: "interactive",
    screen: ROUTES.inicio,
    targetId: TUTORIAL_TARGETS.chromeDrawerToggle,
    title: "Menu Principal",
    description:
      "Toque no ícone de menu (≡) para abrir a navegação. É daqui que você acessa todos os módulos disponíveis.",
    placement: "bottom",
    ctaLabel: "Toque no menu",
    expectedAction: "drawer-open",
    pulseTarget: true,
  });

  steps.push({
    id: "drawer-cronograma",
    kind: "interactive",
    targetId: TUTORIAL_TARGETS.drawerCronograma,
    title: "Cronograma",
    description:
      "Aqui está o item de Cronograma — sua lista diária de tarefas. Toque para abrir.",
    placement: "top",
    ctaLabel: "Toque em Cronograma",
    expectedAction: "tap",
    pulseTarget: true,
  });

  // ============================================================
  // ACT 3 — Cronograma (the daily home)
  // ============================================================
  steps.push({
    id: "cronograma-list",
    kind: "showcase",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaList,
    title: "Sua Lista de Tarefas",
    description:
      "Aqui ficam todas as suas tarefas do dia, agrupadas por status: em produção, aguardando, concluídas. Cada cartão mostra o caminhão, cliente e prazo.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION + 1000,
  });

  steps.push({
    id: "cronograma-tap-task",
    kind: "interactive",
    screen: ROUTES.cronograma,
    targetId: TUTORIAL_TARGETS.cronogramaFirstTask,
    title: "Abra uma Tarefa",
    description:
      "Toque em uma tarefa para ver todos os detalhes: cliente, caminhão, datas, fotos, ordens de serviço.",
    placement: "bottom",
    ctaLabel: "Toque em uma tarefa",
    expectedAction: "tap",
    pulseTarget: true,
  });

  steps.push({
    id: "task-info",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskInfoCard,
    title: "Informações da Tarefa",
    description:
      "Aqui você vê o cliente, a placa do caminhão, o número de série e o setor. Identifique sempre o veículo antes de começar o trabalho.",
    placement: "bottom",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "task-dates",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskDatesCard,
    title: "Datas e Prazos",
    description:
      "Atenção ao prazo de entrega! Tarefas atrasadas ficam destacadas em vermelho.",
    placement: "bottom",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "task-services",
    kind: "showcase",
    targetId: TUTORIAL_TARGETS.taskServicesCard,
    title: "Ordens de Serviço",
    description:
      "Cada tarefa contém uma ou mais ordens de serviço (pintura, recorte, aerografia). O status colorido indica o progresso de cada uma.",
    placement: "top",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "task-checkin-explain",
    kind: "narration",
    title: "Check-in & Check-out 📸",
    description:
      "Ao começar e terminar um trabalho, você fotografa o caminhão. Isso comprova o serviço — é como um 'antes e depois' obrigatório. O botão de check-in/check-out fica na própria tela da tarefa.",
    placement: "center",
    ctaLabel: "Entendi",
    expectedAction: "continue",
  });

  // ============================================================
  // ACT 4 — Recorte
  // ============================================================
  steps.push({
    id: "recorte-intro",
    kind: "narration",
    title: "Fila de Recorte ✂️",
    description:
      "Recorte é a fila dos vinis e adesivos a serem cortados antes da aplicação. Cada item pode estar pendente, em corte ou concluído.",
    placement: "center",
    ctaLabel: "Continuar",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.recorte,
  });

  steps.push({
    id: "recorte-list",
    kind: "showcase",
    screen: ROUTES.recorte,
    targetId: TUTORIAL_TARGETS.recorteList,
    title: "Recortes",
    description:
      "Use os botões de ação (Iniciar, Concluir) na lista para mover um recorte pelo fluxo. Líderes podem solicitar novos recortes.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  // ============================================================
  // ACT 5 — Histórico
  // ============================================================
  steps.push({
    id: "historico-intro",
    kind: "narration",
    title: "Histórico de Tarefas 📚",
    description:
      "Aqui ficam as tarefas concluídas e canceladas — seu arquivo do que já passou pela produção.",
    placement: "center",
    ctaLabel: "Ver o histórico",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.historico,
  });

  steps.push({
    id: "historico-list",
    kind: "showcase",
    screen: ROUTES.historico,
    targetId: TUTORIAL_TARGETS.historicoList,
    title: "Tarefas Concluídas",
    description:
      "Use as abas para alternar entre concluídas e canceladas. Toque em uma tarefa para revisar o que foi feito.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  // ============================================================
  // ACT 6 — Observações (FLAGSHIP "show, demo, do")
  // ============================================================
  steps.push({
    id: "observacoes-intro",
    kind: "narration",
    title: "Observações 📝",
    description:
      "Esta é a parte mais importante: vamos criar uma observação de verdade. Observações são anotações sobre tarefas — problemas, ajustes solicitados pelo cliente, alertas. É como você comunica com a equipe.",
    placement: "center",
    ctaLabel: "Vamos criar uma!",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.observacoes,
  });

  steps.push({
    id: "observacoes-list",
    kind: "showcase",
    screen: ROUTES.observacoes,
    targetId: TUTORIAL_TARGETS.observacoesList,
    title: "Lista de Observações",
    description:
      "Aqui ficam todas as observações cadastradas. Você pode buscar, filtrar e abrir cada uma para detalhes.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "observacoes-tap-fab",
    kind: "interactive",
    screen: ROUTES.observacoes,
    targetId: TUTORIAL_TARGETS.observacoesFab,
    title: "Criar Observação",
    description: "Toque no botão + para criar uma nova observação.",
    placement: "top",
    ctaLabel: "Toque no botão +",
    expectedAction: "tap",
    pulseTarget: true,
  });

  steps.push({
    id: "observacoes-task-select",
    kind: "interactive",
    screen: ROUTES.observacoesNova,
    targetId: TUTORIAL_TARGETS.observacoesFormTaskSelect,
    title: "Escolha a Tarefa",
    description:
      "Selecione a qual tarefa esta observação se refere. Toque no campo e escolha uma da lista.",
    placement: "bottom",
    ctaLabel: "Toque para selecionar",
    expectedAction: "input",
    expectedEventId: "observacoes.taskSelected",
    pulseTarget: true,
  });

  steps.push({
    id: "observacoes-description",
    kind: "interactive",
    screen: ROUTES.observacoesNova,
    targetId: TUTORIAL_TARGETS.observacoesFormDescription,
    title: "Descreva a Observação",
    description:
      "Digite o que aconteceu. Seja específico: o que precisa ser ajustado, qual foi o problema, qual o pedido do cliente.",
    placement: "top",
    ctaLabel: "Digite no campo destacado",
    expectedAction: "input",
    expectedEventId: "observacoes.descriptionTyped",
    pulseTarget: true,
  });

  steps.push({
    id: "observacoes-save",
    kind: "interactive",
    screen: ROUTES.observacoesNova,
    targetId: TUTORIAL_TARGETS.observacoesFormSave,
    title: "Salve a Observação",
    description: "Toque no botão de salvar para registrar a observação.",
    placement: "bottom",
    ctaLabel: "Toque em Salvar",
    expectedAction: "submit",
    expectedEventId: "observacoes.saved",
    pulseTarget: true,
  });

  steps.push({
    id: "observacoes-success",
    kind: "narration",
    title: "Parabéns! 🎉",
    description:
      "Você acabou de criar sua primeira observação. Esse é o fluxo que você vai usar para tudo: tocar no +, preencher, salvar.",
    placement: "center",
    ctaLabel: "Continuar",
    expectedAction: "continue",
    celebrate: true,
  });

  // ============================================================
  // ACT 7 — Ordens de Serviço
  // ============================================================
  steps.push({
    id: "ordens-intro",
    kind: "narration",
    title: "Ordens de Serviço 🧾",
    description:
      "As Ordens de Serviço são os trabalhos individuais dentro de uma tarefa. Geralmente quem cria são os líderes, mas você as vê e acompanha o progresso.",
    placement: "center",
    ctaLabel: "Ver as Ordens",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.ordens,
  });

  steps.push({
    id: "ordens-list",
    kind: "showcase",
    screen: ROUTES.ordens,
    targetId: TUTORIAL_TARGETS.ordensList,
    title: "Lista de Ordens",
    description:
      "Cada linha é um serviço da tarefa. Toque para abrir e ver descrição, status e relação com a tarefa-mãe.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  // ============================================================
  // ACT 8 — Notificações
  // ============================================================
  steps.push({
    id: "notifications-intro",
    kind: "narration",
    title: "Notificações 🔔",
    description:
      "Vamos para as notificações — onde você fica sabendo de tudo: novas tarefas, recortes prontos, mensagens importantes.",
    placement: "center",
    ctaLabel: "Ver notificações",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.notifications,
  });

  steps.push({
    id: "notifications-list",
    kind: "showcase",
    screen: ROUTES.notifications,
    targetId: TUTORIAL_TARGETS.notificationsList,
    title: "Suas Notificações",
    description:
      "Toque em uma notificação para marcá-la como lida e abrir o que está relacionado. Use 'Marcar Todas Lidas' para limpar de uma vez.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  // ============================================================
  // ACT 9 — Pessoal (personal area)
  // ============================================================
  steps.push({
    id: "pessoal-intro",
    kind: "narration",
    title: "Sua Área Pessoal 👤",
    description:
      "Tudo o que é seu — pontos, feriados, EPIs, mensagens, advertências, bônus — fica em um único lugar. Vamos ver os principais.",
    placement: "center",
    ctaLabel: "Ver Pessoal",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.pessoal,
  });

  steps.push({
    id: "pessoal-grid",
    kind: "showcase",
    screen: ROUTES.pessoal,
    targetId: TUTORIAL_TARGETS.pessoalGrid,
    title: "Menu Pessoal",
    description:
      "Cada cartão abre uma área: Meus Pontos, Meus Feriados, Meus EPIs, Minhas Mensagens, Minhas Advertências, Meu Bônus e mais.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "pessoal-pontos",
    kind: "showcase",
    screen: ROUTES.pessoalPontos,
    targetId: TUTORIAL_TARGETS.pessoalPontos,
    title: "Meus Pontos ⏱️",
    description:
      "Veja suas batidas de ponto, horas extras e saldo do banco de horas. Você também pode justificar ausências por aqui.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
    navigateOnEnter: ROUTES.pessoalPontos,
  });

  steps.push({
    id: "pessoal-feriados",
    kind: "showcase",
    screen: ROUTES.pessoalFeriados,
    targetId: TUTORIAL_TARGETS.pessoalFeriados,
    title: "Meus Feriados 🗓️",
    description:
      "Calendário dos feriados e folgas do ano. Importante para se planejar.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
    navigateOnEnter: ROUTES.pessoalFeriados,
  });

  steps.push({
    id: "pessoal-epis",
    kind: "showcase",
    screen: ROUTES.pessoalEpis,
    targetId: TUTORIAL_TARGETS.pessoalEpis,
    title: "Meus EPIs 🦺",
    description:
      "Histórico de equipamentos de proteção que você recebeu. Use 'Solicitar EPI' quando precisar de reposição.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
    navigateOnEnter: ROUTES.pessoalEpis,
  });

  // ============================================================
  // ACT 10 — Configurações
  // ============================================================
  steps.push({
    id: "configuracoes",
    kind: "showcase",
    screen: ROUTES.configuracoes,
    targetId: TUTORIAL_TARGETS.configList,
    title: "Configurações ⚙️",
    description:
      "Atalhos rápidos para empréstimos, movimentações e EPIs. Útil para chegar direto onde você precisa.",
    placement: "center",
    autoAdvanceMs: SHOWCASE_DURATION,
    navigateOnEnter: ROUTES.configuracoes,
  });

  steps.push({
    id: "preferences-replay",
    kind: "showcase",
    screen: ROUTES.preferencias,
    targetId: TUTORIAL_TARGETS.preferencesReplayButton,
    title: "Refazer este Tutorial",
    description:
      "Sempre que quiser, volte em Preferências e toque em 'Repetir Tutorial' para refazer este passo a passo.",
    placement: "top",
    autoAdvanceMs: SHOWCASE_DURATION,
    navigateOnEnter: ROUTES.preferencias,
  });

  // ============================================================
  // ACT 11 — Perfil
  // ============================================================
  steps.push({
    id: "perfil-intro",
    kind: "narration",
    title: "Seu Perfil 👤",
    description:
      "Vamos terminar no seu perfil — onde você atualiza foto, contato, endereço e confere seus tamanhos.",
    placement: "center",
    ctaLabel: "Ir ao Perfil",
    expectedAction: "continue",
    navigateOnEnter: ROUTES.perfil,
  });

  steps.push({
    id: "perfil-photo",
    kind: "showcase",
    screen: ROUTES.perfil,
    targetId: TUTORIAL_TARGETS.perfilPhoto,
    title: "Foto de Perfil",
    description:
      "Toque em 'Alterar' para colocar uma foto sua. Ajuda os colegas a te identificar.",
    placement: "bottom",
    autoAdvanceMs: SHOWCASE_DURATION,
  });

  steps.push({
    id: "perfil-sizes",
    kind: "showcase",
    screen: ROUTES.perfil,
    targetId: TUTORIAL_TARGETS.perfilSizes,
    title: "Suas Medidas (EPIs)",
    description:
      "Camisa, calça, bota, luvas, máscara — seus tamanhos para a entrega de EPIs. Se algum estiver errado, fale com o RH para corrigir.",
    placement: "top",
    autoAdvanceMs: SHOWCASE_DURATION + 1000,
  });

  // ============================================================
  // ACT 12 — Conclusion
  // ============================================================
  steps.push({
    id: "completion",
    kind: "narration",
    title: "Você está pronto! 🚀",
    description:
      "Esses são os principais módulos que você vai usar no dia a dia: Cronograma, Recorte, Histórico, Observações, Ordens de Serviço, Notificações e sua área Pessoal. Bom trabalho!",
    placement: "center",
    ctaLabel: "Concluir",
    expectedAction: "continue",
    celebrate: true,
  });

  return steps;
}
