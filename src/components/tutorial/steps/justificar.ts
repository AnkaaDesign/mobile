import type { TutorialStep } from "../engine-types";

export const justificarSteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-justify-list",
    kind: "showcase",
    scene: "justificar-list",
    highlight: "pessoalPontosJustifyPage",
    title: "Dias sem batida",
    description:
      "Aqui ficam os dias sem batida. Dias em aberto podem ser justificados; os de período encerrado aparecem esmaecidos.",
    placement: "center",
  },
  {
    id: "pessoal-pontos-justify-row-tap",
    kind: "interactive",
    scene: "justificar-list",
    highlight: "pessoalPontosJustifyFirstRow",
    title: "Justificar este dia",
    description: "Toque na linha para abrir o formulário de justificativa.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-justify-form-overview",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyForm",
    title: "Formulário de justificativa",
    description:
      "Vamos preencher cada campo, um de cada vez. No fim, você envia a justificativa ao gestor para aprovação.",
    placement: "center",
  },
  {
    id: "pessoal-pontos-justify-ausencia-em",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyAusenciaEm",
    title: "1. Ausência em",
    description:
      "Primeiro, escolha o tipo de ausência. Use \"Dia Específico\" quando faltou em um único dia (ou parte dele). Use \"Período de Afastamento\" quando ficou ausente por vários dias seguidos, como num atestado de uma semana.",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-justify-data",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyData",
    title: "2. Data",
    description:
      "Confirme aqui a data da ausência. Ela já vem preenchida com o dia que você selecionou na lista, mas você pode tocar para escolher outra. (No modo \"Período de Afastamento\" este campo vira dois: Início e Fim.)",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-justify-periodo-ausencia",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyPeriodoAusencia",
    title: "3. Período da Ausência",
    description:
      "Diga quanto do dia você faltou. \"Dia Inteiro\" cobre toda a jornada; \"Período 1, 2 ou 3\" cobre apenas um dos turnos do dia; e \"Período Específico\" permite informar um horário exato de início e fim.",
    placement: "bottom",
  },
  {
    id: "pessoal-pontos-justify-motivo",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyMotivo",
    title: "4. Motivo",
    description:
      "Selecione o motivo da ausência: atestado médico, licença paternidade, falta justificada, banco de horas, etc. Atenção: alguns motivos (como atestado) exigem o envio de uma foto do documento — o campo de foto aparece logo abaixo quando isso é necessário.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-justify-foto",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyFoto",
    title: "5. Foto do documento",
    description:
      "Quando o motivo exige comprovação, anexe aqui uma foto do documento (atestado, declaração, laudo, etc.). Toque em \"Adicionar foto\" para usar a câmera ou escolher uma imagem da galeria. Sem a foto obrigatória, a justificativa não pode ser enviada.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-justify-observacao",
    kind: "showcase",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifyObservacao",
    title: "6. Observação",
    description:
      "Por fim, use este campo (opcional) para escrever detalhes que ajudem o gestor a entender sua ausência, como o nome do médico ou o contexto da falta.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-justify-submit",
    kind: "interactive",
    scene: "justificar-form",
    highlight: "pessoalPontosJustifySubmit",
    title: "Enviar justificativa",
    description: "Tudo preenchido? Toque em Enviar para mandar a justificativa ao gestor.",
    expectedAction: "tap",
    placement: "top",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-justify-voltar",
    kind: "interactive",
    scene: "justificar-form",
    highlight: "chromeHeaderBack",
    title: "Voltar",
    description: "Toque na seta para voltar.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
