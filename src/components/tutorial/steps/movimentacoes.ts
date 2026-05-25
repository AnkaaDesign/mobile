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
    title: "Suas movimentações de estoque",
    description: "Aqui ficam todas as entradas e saídas de materiais do estoque atribuídas a você, com o item, a quantidade e a data.",
    placement: "center",
  },
  {
    id: "pessoal-movimentacoes-tipos",
    kind: "showcase",
    scene: "minhas-movimentacoes",
    highlight: "pessoalMovimentacoes",
    title: "Entradas e saídas",
    description: "O selo verde com seta para cima (+) é uma entrada; o vermelho com seta para baixo (−) é uma saída que você retirou.",
    placement: "center",
  },
];
