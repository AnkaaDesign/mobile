import type { TutorialStep } from "../engine-types";

/**
 * The "Meus Pontos" (espelho de ponto) hub is the launchpad for three guided
 * sub-flows: Incluir Ponto, Ajustar Ponto and Justificar Ausência. The steps
 * here are split into four arrays so steps/index.ts can interleave the hub
 * tour with each sub-flow: the user always TAPS a toolbar button to leave the
 * hub, the sub-flow runs, and its closing "Voltar" step brings them back here
 * before the next entry step nudges them to the following button.
 *
 * Toolbar order, left-to-right: month selector → Incluir Ponto →
 * Ajustar Ponto → Justificar Ausência → Visibilidade de colunas.
 */

// Hub intro + the first sub-flow entry (Incluir Ponto).
export const meusPontosIntroSteps: TutorialStep[] = [
  {
    // Entered from the Pessoal hub by tapping the "Meus Pontos" card — this is
    // hub card #6, so the block sits after Bônus in steps/index.ts.
    id: "pessoal-pontos-tap",
    kind: "interactive",
    scene: "pessoal-hub",
    highlight: "pessoalGridCardPontos",
    title: "Meus Pontos",
    description: "Toque em \"Meus Pontos\" para abrir o espelho de ponto.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-pontos-overview",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontos",
    title: "Espelho de ponto",
    description: "Aqui você acompanha todas as batidas do mês em uma tabela, com entradas, saídas, horas extras e faltas.",
    placement: "center",
  },
  {
    id: "pessoal-pontos-month-selector",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosMonthSelector",
    title: "Seletor de mês",
    description: "Use as setas para navegar entre os meses. O período vai do dia 25 ao dia 25.",
    placement: "bottom",
  },

  // ─── Entendendo as colunas do espelho de ponto ──────────────────────────
  // A tabela é o coração do cálculo do salário: cada coluna é uma grandeza em
  // horas (hh:mm) que entra na folha. Estes passos destacam cada grupo de
  // colunas (a tabela rola na horizontal para trazer o grupo destacado à
  // vista) e explicam, em linguagem simples, como cada um afeta o pagamento.
  {
    id: "pessoal-pontos-col-batidas",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColBatidas",
    title: "Batidas: entradas e saídas",
    description: "As colunas Entrada 1-3 e Saída 1-3 mostram os horários registrados no relógio de ponto (até três pares por dia, para quem tem mais de um intervalo). É a partir delas que o sistema calcula tudo: quanto você trabalhou, faltou ou fez de hora extra. Batida faltando aparece como '-' e pode gerar pendência.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-atraso-faltas",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColAtrasoFaltas",
    title: "Atraso, Faltas e Ajuste",
    description: "Estas três colunas ficam logo após as batidas por serem as mais críticas para o seu salário. Atraso registra os minutos perdidos no começo ou fim de um dia trabalhado. Faltas conta as horas de jornada não cumpridas sem justificativa — um dia ausente completo aparece como 8:00, desconta do salário e pode derrubar o DSR. Ajuste é uma correção manual do RH para acertar o saldo do dia.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-extras",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColExtras",
    title: "Horas extras: 50%, 100% e 150%",
    description: "Tudo que você trabalha além da jornada vira hora extra, paga com adicional sobre a hora normal. Ex 50% é a extra comum em dia útil; Ex 100% é em domingos e feriados; Ex 150% é a faixa mais alta, usada em casos especiais do acordo coletivo. Quanto maior o percentual, mais cada hora vale na folha.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-dsr-noturno",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColDsrNoturno",
    title: "DSR e adicional noturno",
    description: "DSR é o Descanso Semanal Remunerado: o dia de folga (geralmente domingo) que é pago desde que a semana esteja em dia — faltas podem fazer você perder o DSR, e a coluna DSR Déb mostra esse débito. Noturno é o adicional por horas trabalhadas entre 22h e 5h, e Ex Not. é a hora extra feita nesse período, que acumula os dois adicionais.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-abonos",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColAbonos",
    title: "Normais e Abonos",
    description: "Normais é o total de horas da jornada contratual cumpridas no dia (8:00 num dia comum) — as horas pagas no salário-base. Abonos são ausências justificadas e por isso pagas normalmente: em vez de virar falta, a hora entra como abono (atestado médico, licença etc.).",
    placement: "top",
  },

  {
    id: "pessoal-pontos-incluir-entry",
    kind: "interactive",
    scene: "meus-pontos",
    highlight: "pessoalPontosIncluirButton",
    title: "Incluir ponto",
    description: "Toque em \"Incluir Ponto\" para registrar uma batida pelo celular quando o relógio do escritório falha.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];

// Back on the hub after Incluir Ponto — tap to open Ajustar Ponto.
export const meusPontosAjustarEntrySteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-ajustar-entry",
    kind: "interactive",
    scene: "meus-pontos",
    highlight: "pessoalPontosAdjustButton",
    title: "Ajustar ponto",
    description: "Toque em \"Ajustar Ponto\" para solicitar correções nas batidas de um dia.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];

// Back on the hub after Ajustar Ponto — tap to open Justificar Ausência.
export const meusPontosJustifyEntrySteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-justify-entry",
    kind: "interactive",
    scene: "meus-pontos",
    highlight: "pessoalPontosJustifyButton",
    title: "Justificar ausência",
    description: "Toque em \"Justificar Ausência\" para registrar uma justificativa de um dia ou período de falta.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];

// Hub step after Justificar sub-flow: entry to Assinatura de Ponto.
export const meusPontosAssinaturaEntrySteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-assinatura-entry",
    kind: "interactive",
    scene: "meus-pontos",
    highlight: "pessoalPontosAssinaturaButton",
    title: "Assinatura de Ponto",
    description: "Toque em \"Assinatura de Ponto\" para ver os fechamentos de ponto aguardando sua aprovação ou reprovação.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
