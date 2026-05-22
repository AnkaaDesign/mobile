import type { TutorialStep } from "../engine-types";

export const mensagensSteps: TutorialStep[] = [
  {
    id: "pessoal-mensagens-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardMensagens",
    title: "Mensagens",
    description: "Toque para ver os comunicados da empresa.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-mensagens-page",
    kind: "showcase",
    scene: "minhas-mensagens",
    highlight: "pessoalMensagens",
    title: "Comunicados",
    description: "Mensagens não lidas ficam destacadas com borda colorida.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
  {
    id: "pessoal-mensagens-open",
    kind: "showcase",
    scene: "minhas-mensagens",
    sceneState: { mensagensModalOpen: true },
    title: "Detalhe da mensagem",
    description: "Toque numa mensagem para ler o conteúdo completo.",
    placement: "center",
    autoAdvanceMs: 3500,
  },
];
