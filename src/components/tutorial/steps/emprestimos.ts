import type { TutorialStep } from "../engine-types";

export const emprestimosSteps: TutorialStep[] = [
  {
    id: "pessoal-emprestimos-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardEmprestimos",
    title: "Empréstimos",
    description: "Toque para ver itens emprestados pela empresa.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-emprestimos-page",
    kind: "showcase",
    scene: "meus-emprestimos",
    highlight: "pessoalEmprestimos",
    title: "Itens sob sua responsabilidade",
    description: "Aqui você acompanha as ferramentas e equipamentos que a empresa emprestou para você, com a data do empréstimo.",
    placement: "center",
  },
  {
    id: "pessoal-emprestimos-status",
    kind: "showcase",
    scene: "meus-emprestimos",
    highlight: "pessoalEmprestimos",
    title: "Status de cada empréstimo",
    description: "O status indica a situação: Ativo (ainda com você), Devolvido (já entregue) ou Perdido (item extraviado).",
    placement: "center",
  },
];
