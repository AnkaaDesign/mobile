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
    title: "Comunicados da empresa",
    description: "Aqui ficam os avisos e comunicados oficiais que a empresa envia para você. É importante ler todos para se manter informado.",
    placement: "center",
  },
  {
    id: "pessoal-mensagens-unread",
    kind: "showcase",
    scene: "minhas-mensagens",
    highlight: "pessoalMensagensFirstItem",
    title: "Mensagens não lidas",
    description: "As mensagens que você ainda não abriu ficam destacadas com borda colorida e o selo \"Novo\".",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-mensagens-open",
    kind: "showcase",
    scene: "minhas-mensagens",
    sceneState: { mensagensModalOpen: true },
    title: "Detalhe da mensagem",
    description: "Toque numa mensagem para abrir e ler o conteúdo completo. Ao abrir, ela deixa de ser \"Novo\" e passa a contar como lida.",
    placement: "center",
  },
];
