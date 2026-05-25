import type { TutorialStep } from "../engine-types";

/**
 * Incluir Ponto — fully guided sub-flow that TEACHES how to register a clock-in
 * by phone (GPS capture + approval). Every transition is a tap or an explicit
 * step; nothing auto-advances mid-scene. Mirrors the real flow:
 *   list → tap "Nova Inclusão" → (navigate to) the dedicated GPS capture PAGE →
 *   capturing → GPS ready (precisão/endereço) → the user TAPS the active
 *   "Incluir Ponto" button to send → "Enviando…" → land back on "Últimos
 *   Registros" with the new Processando entry → expand a row to see the detail
 *   map → the entry later becomes Aceita (with comprovante) or Rejeitada.
 *
 * The capture page distinguishes a READY state (the "Incluir Ponto" submit
 * button is active and tappable) from the SUBMITTING state ("Enviando…"): the
 * user must actually tap the highlighted submit button to send the batida —
 * the scene only advances to "Enviando…" after that tap.
 *
 * The capture PAGE is a distinct full-screen screen (the list is hidden) so the
 * "Nova Inclusão" tap reads as NAVIGATING AWAY, not as an inline card. The
 * `incluirPontoSubmitted` flag tells the list scene to surface the fresh
 * Processando entry once the flow returns to it.
 *
 * Closes with the shared meu-ponto "Voltar" contract step, returning the user
 * to the meus-pontos hub before the next sub-flow (Justificar) begins.
 */
export const incluirPontoSteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-incluir-overview",
    kind: "showcase",
    scene: "incluir-ponto",
    highlight: "pessoalPontosIncluirPage",
    title: "Incluir Ponto",
    description:
      "Quando o relógio do escritório falha, você pode registrar a batida pelo próprio celular. A tela tem o botão Nova Inclusão e, abaixo, a lista dos seus Últimos Registros. Vamos incluir uma batida juntos.",
    placement: "center",
  },
  {
    id: "pessoal-pontos-incluir-cta",
    kind: "interactive",
    scene: "incluir-ponto",
    highlight: "pessoalPontosIncluirCta",
    title: "Toque em Nova Inclusão",
    description:
      "Toque em Nova Inclusão. Isso abre a tela de captura, que usa o GPS do celular para marcar onde você está agora.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-incluir-capturing",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoCaptureFlow: "capturing" },
    highlight: "pessoalPontosIncluirCaptureCard",
    title: "Capturando sua localização",
    description:
      "Esta é a tela de captura. O celular está lendo o GPS: o mapa centraliza na sua posição e a hora exata da batida aparece no topo. Aguarde até o ponto azul travar no lugar.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-incluir-precisao",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoCaptureFlow: "ready" },
    // Highlight the body (precisão/endereço) — not the whole card — so the page
    // scrolls the address section into view; tooltip pinned to the bottom so it
    // never covers it.
    highlight: "pessoalPontosIncluirCaptureBody",
    title: "Precisão e endereço",
    description:
      "Localização confirmada. Abaixo do mapa o app mostra a precisão do GPS em metros (quanto menor, melhor) e o endereço correspondente. Confira se faz sentido com o lugar onde você está.",
    placement: "top",
    tooltipPinToScreenBottom: true,
  },
  {
    id: "pessoal-pontos-incluir-submit",
    kind: "interactive",
    scene: "incluir-ponto",
    sceneState: { incluirPontoCaptureFlow: "ready" },
    highlight: "pessoalPontosIncluirSubmit",
    title: "Toque em Incluir Ponto",
    description:
      "Agora é com você: toque no botão Incluir Ponto para enviar a batida para aprovação do RH. Sem esse toque, nada é registrado.",
    expectedAction: "tap",
    placement: "top",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-incluir-submitting",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoCaptureFlow: "submitting" },
    highlight: "pessoalPontosIncluirCaptureCard",
    title: "Enviando a batida",
    description:
      "Pronto, você enviou! O app mostra Enviando… enquanto manda a batida para aprovação e, em seguida, te leva de volta para a lista de registros.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-incluir-processando",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoSubmitted: true },
    highlight: "pessoalPontosIncluirFirstRow",
    title: "Enviada — agora Processando",
    description:
      "Pronto! De volta em Últimos Registros, a nova batida aparece no topo com o selo Processando: ela está aguardando a aprovação. A lista atualiza sozinha enquanto isso.",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-incluir-row-expand",
    kind: "interactive",
    scene: "incluir-ponto",
    sceneState: { incluirPontoSubmitted: true },
    highlight: "pessoalPontosIncluirFirstRow",
    title: "Toque para ver os detalhes",
    description:
      "Toque nessa linha para abrir os detalhes da batida que você acabou de enviar.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-incluir-row-details",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoSubmitted: true, incluirPontoExpandedRow: 0 },
    highlight: "pessoalPontosIncluirDetail",
    title: "Detalhes do registro",
    description:
      "Aqui está o detalhe completo: o mapa marca o local exato da batida (o ponto azul é você, e o círculo azul é a margem de precisão), e logo abaixo aparecem a data e hora, a precisão em metros e o endereço.",
    // The detail block (short map + the three text rows) is scrolled into the
    // upper area of the viewport; pin the tooltip to the BOTTOM so it never
    // covers the data/hora, precisão and endereço text below the map.
    placement: "bottom",
    tooltipPinToScreenBottom: true,
  },
  {
    id: "pessoal-pontos-incluir-status-outcome",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoSubmitted: true, incluirPontoExpandedRow: 0 },
    highlight: "pessoalPontosIncluirDetail",
    title: "Aceita ou Rejeitada",
    description:
      "Depois da análise, o selo muda: vira Aceita (verde) se o ponto for aprovado, ou Rejeitada (vermelho) se algo estiver fora — por exemplo, fora do perímetro permitido —, e nesse caso o motivo aparece aqui nos detalhes.",
    placement: "bottom",
    tooltipPinToScreenBottom: true,
  },
  {
    id: "pessoal-pontos-incluir-comprovante",
    kind: "showcase",
    scene: "incluir-ponto",
    sceneState: { incluirPontoSubmitted: true },
    highlight: "pessoalPontosIncluirListCard",
    title: "Comprovante da batida aceita",
    description:
      "Quando uma batida é Aceita, um ícone de documento aparece ao lado dela na lista. Toque nesse ícone para abrir e guardar o comprovante oficial do ponto.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-incluir-voltar",
    kind: "interactive",
    scene: "incluir-ponto",
    sceneState: { incluirPontoSubmitted: true },
    highlight: "chromeHeaderBack",
    title: "Voltar",
    description:
      "É isso! Toque na seta para voltar para a tela de Meus Pontos.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
