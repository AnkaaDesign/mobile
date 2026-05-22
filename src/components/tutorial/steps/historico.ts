import type { TutorialStep } from "../engine-types";

export const historicoSteps: TutorialStep[] = [
  {
    id: "drawer-historico",
    kind: "interactive",
    scene: "cronograma",
    sceneState: { drawer: "menu" },
    highlight: "drawerHistorico",
    title: "Histórico",
    description: "Toque em \"Histórico\" para ver tarefas concluídas.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "historico-concluidos",
    kind: "showcase",
    scene: "historico",
    highlight: "historicoList",
    title: "Tarefas concluídas",
    description: "Todas as tarefas finalizadas aparecem aqui, ordenadas por data.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
];
