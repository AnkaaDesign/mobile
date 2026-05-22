import type { TutorialStep } from "../engine-types";

export const movimentacoesSteps: TutorialStep[] = [
  {
    id: "pessoal-movimentacoes-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardMovimentacoes",
    title: "Movimentações",
    description: "Toque para ver materiais que você retirou do estoque.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-movimentacoes-page",
    kind: "showcase",
    scene: "minhas-movimentacoes",
    highlight: "pessoalMovimentacoes",
    title: "Movimentações de estoque",
    description: "Lista de retiradas com data e quantidade.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
];
