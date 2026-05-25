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
    title: "Seus registros disciplinares",
    description: "Aqui ficam as advertências que você recebeu. É um histórico só de leitura: você acompanha, mas não edita nada.",
    placement: "center",
  },
  {
    id: "pessoal-advertencias-colunas",
    kind: "showcase",
    scene: "minhas-advertencias",
    highlight: "pessoalAdvertencias",
    title: "Severidade, categoria e motivo",
    description: "Cada linha mostra a severidade (verbal, escrita, suspensão ou final), a categoria e o motivo do registro.",
    placement: "center",
  },
];
