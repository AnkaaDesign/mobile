/**
 * Build the full step list for a user context. Each per-scene file exports
 * an array of steps; this module concatenates them into the linear sequence
 * the engine walks.
 */
import type { TutorialStep, TutorialUserContext } from "../engine-types";
import { homeSteps } from "./home";
import { cronogramaSteps } from "./cronograma";
import { taskDetailSteps } from "./task-detail";
import { historicoSteps } from "./historico";
import { observacoesSteps } from "./observacoes";
import { recorteSteps } from "./recorte";
import { pessoalSteps } from "./pessoal-hub";
import { meusPontosSteps } from "./meus-pontos";
import { justificarSteps } from "./justificar";
import { ajustarPontoSteps } from "./ajustar-ponto";
import { incluirPontoSteps } from "./incluir-ponto";
import { feriadosSteps } from "./feriados";
import { episSteps } from "./epis";
import { mensagensSteps } from "./mensagens";
import { advertenciasSteps } from "./advertencias";
import { emprestimosSteps } from "./emprestimos";
import { movimentacoesSteps } from "./movimentacoes";
import { bonusSteps } from "./bonus";
import { leaderSteps } from "./leader";
import { perfilSteps } from "./perfil";

export function buildSteps(ctx: TutorialUserContext): TutorialStep[] {
  const all: TutorialStep[] = [
    ...homeSteps,
    ...cronogramaSteps,
    ...taskDetailSteps,
    ...historicoSteps,
    ...observacoesSteps,
    ...recorteSteps,
    ...pessoalSteps,
    ...meusPontosSteps,
    ...justificarSteps,
    ...ajustarPontoSteps,
    ...incluirPontoSteps,
    ...feriadosSteps,
    ...episSteps,
    ...mensagensSteps,
    ...advertenciasSteps,
    ...emprestimosSteps,
    ...movimentacoesSteps,
    ...bonusSteps,
    ...leaderSteps,
    ...perfilSteps,
  ];
  return all.filter((s) => !s.condition || s.condition(ctx));
}
