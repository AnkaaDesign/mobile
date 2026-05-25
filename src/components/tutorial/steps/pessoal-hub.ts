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
  },
  // NOTE: each pessoal sub-flow is entered by tapping its OWN hub card at the
  // start of that flow's step array (e.g. feriados → pessoalGridCardFeriados,
  // pontos → pessoalGridCardPontos). The hub intro must NOT tap a card itself,
  // otherwise that flow would jump ahead of the hub card order.
];
