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
import {
  meusPontosIntroSteps,
  meusPontosJustifyEntrySteps,
  meusPontosAjustarEntrySteps,
  meusPontosOutroSteps,
} from "./meus-pontos";
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
    // Pessoal sub-flows follow the hub card order (src/app/(tabs)/pessoal):
    // Feriados → EPIs → Empréstimos → Movimentações → Bônus → Pontos →
    // Mensagens → Advertências.
    ...feriadosSteps,
    ...episSteps,
    ...emprestimosSteps,
    ...movimentacoesSteps,
    ...bonusSteps,
    // Meus Pontos (hub card #6) — hub interleaved with its sub-flows. The user
    // taps a toolbar button to enter each sub-flow; the sub-flow's closing
    // "Voltar" step returns to the hub before the next entry step.
    ...meusPontosIntroSteps,
    ...incluirPontoSteps,
    ...meusPontosJustifyEntrySteps,
    ...justificarSteps,
    ...meusPontosAjustarEntrySteps,
    ...ajustarPontoSteps,
    ...meusPontosOutroSteps,
    ...mensagensSteps,
    ...advertenciasSteps,
    ...leaderSteps,
    ...perfilSteps,
  ];
  return all.filter((s) => !s.condition || s.condition(ctx));
}
