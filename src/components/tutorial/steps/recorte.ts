import type { TutorialStep } from "../engine-types";

export const recorteSteps: TutorialStep[] = [
  {
    id: "drawer-recorte",
    kind: "interactive",
    scene: "observacoes",
    sceneState: { drawer: "menu" },
    highlight: "drawerRecorte",
    title: "Recorte",
    description: "Toque em \"Recorte\" para ver os recortes disponíveis.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "recorte-list",
    kind: "showcase",
    scene: "recorte",
    highlight: "recorteList",
    title: "Lista de recortes",
    description: "Vinis e stencils das tarefas em produção.",
    placement: "center",
  },
  {
    id: "recorte-row-overview",
    kind: "narration",
    scene: "recorte",
    title: "Detalhes do recorte",
    description: "Cada linha mostra o nome, tipo (vinil ou stencil), origem e status.",
    placement: "center",
  },
];
