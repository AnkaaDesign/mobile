import type { TutorialStep } from "../engine-types";

export const pessoalSteps: TutorialStep[] = [
  {
    id: "drawer-pessoal",
    kind: "interactive",
    scene: "recorte",
    sceneState: { drawer: "menu" },
    highlight: "drawerPessoal",
    title: "Seção Pessoal",
    description: "Toque em \"Pessoal\" para ver tudo sobre você.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-grid",
    kind: "showcase",
    scene: "pessoal-hub",
    highlight: "pessoalGrid",
    title: "Hub pessoal",
    description: "Aqui você acessa pontos, EPIs, holerites, bônus, mensagens, e mais.",
    placement: "center",
    autoAdvanceMs: 3000,
  },
  {
    id: "pessoal-pontos-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardPontos",
    title: "Meus Pontos",
    description: "Toque em \"Meus Pontos\" para abrir o espelho de ponto.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
