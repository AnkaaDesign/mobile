/**
 * Scene registry. The Stage uses this map to resolve `step.scene` (id) into
 * the component to mount. Every new scene must be registered here.
 */
import type { ComponentType } from "react";
import type { SceneId, TutorialSceneState } from "../engine-types";

export interface SceneProps {
  state: TutorialSceneState;
}

export type SceneComponent = ComponentType<SceneProps>;

import { HomeScene } from "./home";
import { CronogramaScene } from "./cronograma";
import { TaskDetailScene } from "./task-detail";
import { HistoricoScene } from "./historico";
import { ObservacoesScene } from "./observacoes";
import { RecorteScene } from "./recorte";
import { CutDetailScene } from "./cut-detail";
import { PessoalHubScene } from "./pessoal-hub";
import { MeusPontosScene } from "./meus-pontos";
import { JustificarListScene } from "./justificar-list";
import { JustificarFormScene } from "./justificar-form";
import { AjustarPontoScene } from "./ajustar-ponto";
import { IncluirPontoScene } from "./incluir-ponto";
import { AssinaturasScene } from "./assinaturas";
import { AssinaturaDetailScene } from "./assinatura-detail";
import { MeusFeriadosScene } from "./meus-feriados";
import { MeusEpisScene } from "./meus-epis";
import { EpisRequestScene } from "./epis-request";
import { EpisDetailScene } from "./epis-detail";
import { MinhasMensagensScene } from "./minhas-mensagens";
import { MinhasAdvertenciasScene } from "./minhas-advertencias";
import { MeusEmprestimosScene } from "./meus-emprestimos";
import { MinhasMovimentacoesScene } from "./minhas-movimentacoes";
import { MeuBonusScene } from "./meu-bonus";
import { MeuBonusHistoricoScene } from "./meu-bonus-historico";
import { MeuBonusSimulacaoScene } from "./meu-bonus-simulacao";
import { MeuPessoalScene } from "./meu-pessoal";
import { PreferenciasScene } from "./preferencias";
import { NotifPrefsScene } from "./notif-prefs";
import { PerfilScene } from "./perfil";

export const SCENES: Record<SceneId, SceneComponent> = {
  home: HomeScene,
  cronograma: CronogramaScene,
  "task-detail": TaskDetailScene,
  historico: HistoricoScene,
  observacoes: ObservacoesScene,
  recorte: RecorteScene,
  "cut-detail": CutDetailScene,
  "pessoal-hub": PessoalHubScene,
  "meus-pontos": MeusPontosScene,
  "justificar-list": JustificarListScene,
  "justificar-form": JustificarFormScene,
  "ajustar-ponto": AjustarPontoScene,
  "incluir-ponto": IncluirPontoScene,
  "assinaturas": AssinaturasScene,
  "assinatura-detail": AssinaturaDetailScene,
  "meus-feriados": MeusFeriadosScene,
  "meus-epis": MeusEpisScene,
  "epis-request": EpisRequestScene,
  "epis-detail": EpisDetailScene,
  "minhas-mensagens": MinhasMensagensScene,
  "minhas-advertencias": MinhasAdvertenciasScene,
  "meus-emprestimos": MeusEmprestimosScene,
  "minhas-movimentacoes": MinhasMovimentacoesScene,
  "meu-bonus": MeuBonusScene,
  "meu-bonus-historico": MeuBonusHistoricoScene,
  "meu-bonus-simulacao": MeuBonusSimulacaoScene,
  "meu-pessoal": MeuPessoalScene,
  preferencias: PreferenciasScene,
  "notif-prefs": NotifPrefsScene,
  perfil: PerfilScene,
};

/**
 * Maps each scene to the tab it conceptually lives under, so the FakeTabBar
 * can highlight the right tab. Drawer-only routes return null.
 */
export const SCENE_TAB: Record<SceneId, "inicio" | "pessoal" | "estoque" | "producao" | "rh" | null> = {
  home: "inicio",
  cronograma: "producao",
  "task-detail": "producao",
  historico: "producao",
  observacoes: "producao",
  recorte: "producao",
  "cut-detail": "producao",
  "pessoal-hub": "pessoal",
  "meus-pontos": "pessoal",
  "justificar-list": "pessoal",
  "justificar-form": "pessoal",
  "ajustar-ponto": "pessoal",
  "incluir-ponto": "pessoal",
  "assinaturas": "pessoal",
  "assinatura-detail": "pessoal",
  "meus-feriados": "pessoal",
  "meus-epis": "pessoal",
  "epis-request": "pessoal",
  "epis-detail": "pessoal",
  "minhas-mensagens": "pessoal",
  "minhas-advertencias": "pessoal",
  "meus-emprestimos": "pessoal",
  "minhas-movimentacoes": "pessoal",
  "meu-bonus": "pessoal",
  "meu-bonus-historico": "pessoal",
  "meu-bonus-simulacao": "pessoal",
  "meu-pessoal": null,
  preferencias: "pessoal",
  "notif-prefs": null,
  perfil: null,
};

/**
 * The header title to display per scene. Some scenes have back buttons
 * (detail views, sub-routes); others show the section name.
 */
export const SCENE_HEADER: Record<SceneId, { title: string; showBack: boolean }> = {
  home: { title: "Início", showBack: false },
  cronograma: { title: "Cronograma", showBack: false },
  "task-detail": { title: "Tarefa", showBack: true },
  historico: { title: "Histórico", showBack: false },
  observacoes: { title: "Observações", showBack: false },
  recorte: { title: "Recorte", showBack: false },
  "cut-detail": { title: "Recorte", showBack: true },
  "pessoal-hub": { title: "Pessoal", showBack: false },
  "meus-pontos": { title: "Meus Pontos", showBack: true },
  "justificar-list": { title: "Justificar Ausência", showBack: true },
  "justificar-form": { title: "Justificar Ausência", showBack: true },
  "ajustar-ponto": { title: "Ajustar Ponto", showBack: true },
  "incluir-ponto": { title: "Incluir Ponto", showBack: true },
  "assinaturas": { title: "Assinatura de Ponto", showBack: true },
  "assinatura-detail": { title: "Detalhes", showBack: true },
  "meus-feriados": { title: "Meus Feriados", showBack: true },
  "meus-epis": { title: "Meus EPIs", showBack: true },
  "epis-request": { title: "Solicitar EPI", showBack: true },
  "epis-detail": { title: "Entrega de EPI", showBack: true },
  "minhas-mensagens": { title: "Minhas Mensagens", showBack: true },
  "minhas-advertencias": { title: "Minhas Advertências", showBack: true },
  "meus-emprestimos": { title: "Meus Empréstimos", showBack: true },
  "minhas-movimentacoes": { title: "Minhas Movimentações", showBack: true },
  "meu-bonus": { title: "Meu Bônus", showBack: true },
  "meu-bonus-historico": { title: "Histórico de Bônus", showBack: true },
  "meu-bonus-simulacao": { title: "Simulação", showBack: true },
  "meu-pessoal": { title: "Meu Pessoal", showBack: false },
  preferencias: { title: "Preferências", showBack: true },
  "notif-prefs": { title: "Notificações", showBack: true },
  perfil: { title: "Meu Perfil", showBack: true },
};
