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
    title: "Calendário de feriados",
    description: "Aqui você consulta os feriados que valem para a empresa, com o nome, a data e o dia da semana de cada um.",
    placement: "center",
  },
  {
    id: "pessoal-feriados-buscar",
    kind: "showcase",
    scene: "meus-feriados",
    highlight: "pessoalFeriados",
    title: "Buscar e filtrar",
    description: "Use a busca e o filtro no topo para encontrar rapidamente um feriado específico ou ver apenas um período.",
    placement: "center",
  },
];
