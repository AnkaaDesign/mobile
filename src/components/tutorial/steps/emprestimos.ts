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
    title: "Empréstimos",
    description: "Ferramentas e equipamentos sob sua responsabilidade.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
];
