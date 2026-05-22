import type { TutorialStep } from "../engine-types";

export const feriadosSteps: TutorialStep[] = [
  {
    id: "pessoal-feriados-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardFeriados",
    title: "Meus Feriados",
    description: "Toque para ver feriados do mês e do ano.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-feriados-page",
    kind: "showcase",
    scene: "meus-feriados",
    highlight: "pessoalFeriados",
    title: "Feriados",
    description: "Feriados nacionais e da empresa, com tipo destacado.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
];
