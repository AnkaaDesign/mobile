import type { TutorialStep } from "../engine-types";

/**
 * "Ajustar Ponto" sub-flow. Entered from the meus-pontos hub via the
 * "Ajustar Ponto" toolbar button. Walks the user through the correction
 * form top-to-bottom (data → batidas → observação), ends with an
 * interactive "Enviar", then a closing "Voltar" that returns to the hub.
 */
export const ajustarPontoSteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-adjust-page",
    kind: "showcase",
    scene: "ajustar-ponto",
    highlight: "pessoalPontosAdjustPage",
    title: "Ajustar ponto",
    description: "Use este formulário para corrigir as batidas de um dia em que você trabalhou, mas o registro ficou errado ou faltando.",
    placement: "center",
  },
  {
    id: "pessoal-pontos-adjust-quando",
    kind: "showcase",
    scene: "ajustar-ponto",
    highlight: "pessoalPontosAdjustInfo",
    title: "Ajustar ou Justificar?",
    description: "Use \"Ajustar\" quando você trabalhou e precisa corrigir horários (esqueceu de bater, errou o horário). Para um dia inteiro de falta (atestado, folga), use \"Justificar\".",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-adjust-date",
    kind: "showcase",
    scene: "ajustar-ponto",
    highlight: "pessoalPontosAdjustDate",
    title: "Escolha o dia",
    description: "Toque aqui para selecionar o dia que precisa de correção. As batidas já registradas nesse dia são carregadas automaticamente nos campos abaixo, prontas para edição.",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-adjust-slots",
    kind: "showcase",
    scene: "ajustar-ponto",
    sceneState: { ajustarPontoPrefilled: true },
    highlight: "pessoalPontosAdjustFirstSlot",
    title: "Entradas e saídas",
    description: "As batidas vêm em pares: cada Entrada tem sua Saída (Entrada 1 / Saída 1, Entrada 2 / Saída 2…). Toque em um campo para definir o horário correto.",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-adjust-clear",
    kind: "showcase",
    scene: "ajustar-ponto",
    sceneState: { ajustarPontoPrefilled: true },
    highlight: "pessoalPontosAdjustFirstSlot",
    title: "Limpar uma batida",
    description: "Bateu o ponto errado? Toque no X ao lado do horário para apagá-lo e deixar o campo em branco (--:--), ou toque no horário para corrigi-lo.",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-adjust-observacao",
    kind: "showcase",
    scene: "ajustar-ponto",
    sceneState: { ajustarPontoPrefilled: true },
    highlight: "pessoalPontosAdjustObservacao",
    title: "Observação (obrigatória)",
    description: "Explique o motivo do ajuste — ex.: \"Esqueci de bater a saída do almoço\". A observação é obrigatória: sem ela a solicitação não pode ser enviada, e ela ajuda o líder a entender e aprovar a correção.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-adjust-submit",
    kind: "interactive",
    scene: "ajustar-ponto",
    sceneState: { ajustarPontoPrefilled: true },
    highlight: "pessoalPontosAdjustSubmit",
    title: "Enviar",
    description: "Toque em \"Enviar\" para mandar a solicitação de ajuste ao seu líder.",
    expectedAction: "tap",
    placement: "top",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-adjust-voltar",
    kind: "interactive",
    scene: "ajustar-ponto",
    highlight: "chromeHeaderBack",
    title: "Voltar",
    description: "Toque na seta para voltar.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
