import type { TutorialStep } from "../engine-types";

export const leaderSteps: TutorialStep[] = [
  {
    id: "leader-meu-pessoal-intro",
    kind: "narration",
    scene: "pessoal-hub",
    title: "Funções de líder",
    description: "Como você é líder, tem acesso ao módulo \"Minha Equipe\".",
    placement: "center",
    condition: (ctx) => ctx.isLeader,
  },
  {
    id: "leader-meu-pessoal-grid",
    kind: "showcase",
    scene: "meu-pessoal",
    title: "Minha Equipe",
    description: "Gerencie usuários, EPIs e cálculos dos seus subordinados.",
    placement: "center",
    autoAdvanceMs: 3000,
    condition: (ctx) => ctx.isLeader,
  },
];
