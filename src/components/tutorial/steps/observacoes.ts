import type { TutorialStep } from "../engine-types";

export const observacoesSteps: TutorialStep[] = [
  {
    id: "drawer-observacoes",
    kind: "interactive",
    scene: "historico",
    sceneState: { drawer: "menu" },
    highlight: "drawerObservacoes",
    title: "Observações",
    description: "Toque em \"Observações\" para acessar a lista.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "observacoes-list",
    kind: "showcase",
    scene: "observacoes",
    highlight: "observacoesList",
    title: "Lista de observações",
    description: "Observações abertas ou resolvidas das suas tarefas.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
  {
    id: "observacao-detail-overview",
    kind: "narration",
    scene: "observacoes",
    title: "Detalhe da observação",
    description: "Tocando em uma observação você vê o texto completo e fotos anexas.",
    placement: "center",
  },
];
