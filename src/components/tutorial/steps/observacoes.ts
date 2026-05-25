import type { TutorialStep } from "../engine-types";

export const observacoesSteps: TutorialStep[] = [
  {
    id: "drawer-observacoes",
    kind: "interactive",
    scene: "historico",
    sceneState: { drawer: "menu" },
    highlight: "drawerObservacoes",
    title: "Observações",
    description: "Toque em \"Observações\" para ver os problemas apontados na pintura das suas tarefas.",
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
    description: "Aqui ficam os defeitos e problemas registrados na pintura das suas tarefas (vazamento de tinta, casca de laranja, adesivo torto), com status pendente ou resolvido.",
    placement: "center",
  },
  {
    id: "observacao-detail-overview",
    kind: "narration",
    scene: "observacoes",
    title: "Detalhe da observação",
    description: "Toque em uma observação para ver a descrição completa do defeito e as fotos do problema.",
    placement: "center",
  },
];
