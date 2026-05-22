import type { TutorialStep } from "../engine-types";

export const advertenciasSteps: TutorialStep[] = [
  {
    id: "pessoal-advertencias-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardAdvertencias",
    title: "Advertências",
    description: "Toque para ver suas advertências (se houver).",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-advertencias-page",
    kind: "showcase",
    scene: "minhas-advertencias",
    highlight: "pessoalAdvertencias",
    title: "Advertências",
    description: "Histórico de advertências verbais e escritas.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
];
