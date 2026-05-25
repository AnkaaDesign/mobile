import type { TutorialStep } from "../engine-types";

/**
 * "Meus EPIs" full flow. Entered from the Pessoal hub, this teaches the two
 * things the worker actually does here: REQUEST a new PPE and SIGN for a
 * delivered one. Every step spells out what the screen is and what to do.
 *
 *   1. Open the section from the hub (interactive tap).
 *   2. Overview of the deliveries list + what each status means (showcase).
 *   3. Tap the "Solicitar EPI" FAB → opens the request form (interactive tap).
 *   4. Walk the request form top-to-bottom: what the form is, choosing the
 *      item, confirming the selected item (CA + estoque), justificativa
 *      (showcase). The request scene scrolls each field into view.
 *   5. Tap "Solicitar EPI" to send the request (interactive tap), which
 *      returns (guided) to the deliveries list.
 *   6. Back on the LIST, spotlight the "Aguardando Assinatura" delivery row and
 *      have the worker TAP it to sign (interactive tap, scene "meus-epis",
 *      highlight pessoalEpisAwaitingRow). The tap opens that delivery's detail.
 *   7. On the delivery DETAIL, teach the in-app signature: tap "Confirmar
 *      Recebimento" → biometric prompt (interactive tap, sceneState.epiSignStage
 *      "biometric") → "Recebimento Confirmado" (showcase, epiSignStage "done").
 *      The detail scene scrolls the sign card into view.
 *   8. Close with an interactive "Voltar", mirroring the other Pessoal flows.
 */
export const episSteps: TutorialStep[] = [
  {
    id: "pessoal-epis-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardEpis",
    title: "Meus EPIs",
    description: "Toque para acessar EPIs entregues e solicitar novos.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-epis-list",
    kind: "showcase",
    scene: "meus-epis",
    highlight: "pessoalEpis",
    title: "Suas entregas de EPI",
    description:
      "Esta é a lista das suas entregas de EPI (equipamentos de proteção). Cada linha mostra o item, a data e o status: Pendente, Aprovado, Entregue, Aguardando Assinatura ou Concluído. \"Aguardando Assinatura\" indica que o item chegou e só falta você confirmar o recebimento.",
    placement: "center",
  },
  {
    id: "pessoal-epis-request-open",
    kind: "interactive",
    scene: "meus-epis",
    highlight: "pessoalEpisRequestButton",
    title: "Solicitar um novo EPI",
    description:
      "Precisa de um equipamento novo? Toque no botão + (\"Solicitar EPI\") para abrir o formulário de pedido.",
    expectedAction: "tap",
    placement: "top",
    pulseTarget: true,
  },
  {
    id: "pessoal-epis-request-form",
    kind: "showcase",
    scene: "epis-request",
    highlight: "pessoalEpisRequestForm",
    title: "Formulário de pedido",
    description:
      "Neste formulário você pede um EPI em poucos passos: escolhe o item e justifica a solicitação. Os itens já vêm filtrados pelo seu tamanho cadastrado, então você só vê o que serve em você.",
    placement: "center",
  },
  {
    id: "pessoal-epis-request-item",
    kind: "showcase",
    scene: "epis-request",
    highlight: "pessoalEpisRequestItem",
    title: "1. Escolha o item",
    description:
      "Toque aqui para buscar e selecionar o EPI desejado. Em cada opção aparecem o número do CA (Certificado de Aprovação) e o estoque disponível, ajudando você a escolher.",
    placement: "bottom",
  },
  {
    id: "pessoal-epis-request-selected",
    kind: "showcase",
    scene: "epis-request",
    highlight: "pessoalEpisRequestSelected",
    title: "Confira o item escolhido",
    description:
      "Depois de escolher, este resumo confirma o item, o CA e a quantidade em estoque. É o pedido de 1 unidade do EPI selecionado — confira antes de continuar.",
    placement: "bottom",
  },
  {
    id: "pessoal-epis-request-reason",
    kind: "showcase",
    scene: "epis-request",
    highlight: "pessoalEpisRequestReason",
    title: "2. Justificativa",
    description:
      "Explique por que você precisa do EPI (ex.: substituição por desgaste, perda ou primeira entrega). Esse texto é obrigatório e ajuda o responsável a aprovar o pedido.",
    placement: "top",
  },
  {
    id: "pessoal-epis-request-submit",
    kind: "interactive",
    scene: "epis-request",
    highlight: "pessoalEpisRequestSubmit",
    title: "3. Enviar pedido",
    description:
      'Tudo preenchido? Toque em "Solicitar EPI" para enviar o pedido ao responsável. Ele entrará na lista com o status Pendente até ser aprovado.',
    expectedAction: "tap",
    placement: "top",
    pulseTarget: true,
  },
  {
    id: "pessoal-epis-sign-open",
    kind: "interactive",
    scene: "meus-epis",
    highlight: "pessoalEpisAwaitingRow",
    title: "Recebeu um EPI? Assine para confirmar",
    description:
      "Quando um EPI chega, ele fica \"Aguardando Assinatura\". Toque na entrega para assinar e confirmar o recebimento — essa assinatura registra que o item chegou às suas mãos e serve como comprovante para a empresa.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    // The sign card sits below the header + 3 info cards, so the EpisDetailScene
    // scrolls it into view when this step's highlight (pessoalEpisBiometric →
    // PARENT_SECTION pessoalEpisDetailSign) becomes active. The tooltip is pinned
    // to the screen bottom so it can never cover the "Confirmar Recebimento"
    // button the worker must tap (the button lands in the upper area).
    id: "pessoal-epis-sign-biometric",
    kind: "interactive",
    scene: "epis-detail",
    sceneState: { epiSignStage: "biometric" },
    highlight: "pessoalEpisBiometric",
    title: "Assine com biometria",
    description:
      'Toque em "Confirmar Recebimento" e use sua digital ou o reconhecimento facial. A biometria é sua assinatura eletrônica — é assim que você confirma, com segurança, que recebeu o EPI.',
    expectedAction: "tap",
    placement: "top",
    pulseTarget: true,
    tooltipPinToScreenBottom: true,
  },
  {
    id: "pessoal-epis-sign-receipt",
    kind: "showcase",
    scene: "epis-detail",
    sceneState: { epiSignStage: "done" },
    highlight: "pessoalEpisDetailSign",
    title: "Recebimento confirmado!",
    description:
      "Pronto! O recebimento foi registrado com sua assinatura e a entrega passa a constar como Concluída na sua lista de EPIs.",
    placement: "top",
    celebrate: true,
  },
  {
    id: "pessoal-epis-voltar",
    kind: "interactive",
    scene: "epis-detail",
    sceneState: { epiSignStage: "done" },
    highlight: "chromeHeaderBack",
    title: "Voltar",
    description: "Toque na seta para voltar.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
