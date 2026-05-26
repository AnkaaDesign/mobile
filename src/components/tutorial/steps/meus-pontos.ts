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
    description: "As colunas Entrada 1 / Saída 1 / Entrada 2 / Saída 2 mostram os horários que você registrou no relógio de ponto. É a partir delas que o sistema calcula tudo o que vem a seguir: quanto você trabalhou, faltou ou fez de hora extra. Se uma batida estiver faltando, ela aparece em branco ('-') e pode gerar pendência.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-normais",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColNormais",
    title: "Horas normais",
    description: "A coluna Normais é o total de horas da sua jornada contratual cumpridas no dia (por exemplo, 8:00 num dia comum). São as horas pagas no salário-base, sem nenhum adicional. É o ponto de partida do cálculo.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-faltas",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColFaltas",
    title: "Faltas (e a diferença para Atraso)",
    description: "Faltas conta as horas que você deveria ter trabalhado e não trabalhou sem justificativa — um dia inteiro ausente aparece como 8:00 aqui. Isso desconta do salário e pode derrubar o DSR da semana. Não confunda com Atraso: atraso é um pequeno atrasinho no início/fim de um dia que você trabalhou; falta é a ausência da jornada. Para apagar uma falta, use 'Justificar Ausência'.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-extras",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColExtras",
    title: "Horas extras: 50%, 100% e 150%",
    description: "Tudo que você trabalha além da jornada vira hora extra, paga com adicional sobre a hora normal. As faixas indicam quando cada uma se aplica: Ex 50% é a extra comum em dia útil; Ex 100% é em domingos e feriados (ou conforme a convenção); Ex 150% é a faixa mais alta usada em casos especiais previstos no acordo coletivo. Quanto maior o percentual, mais cada hora vale na folha.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-dsr-noturno",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColDsrNoturno",
    title: "DSR e adicional noturno",
    description: "DSR é o Descanso Semanal Remunerado: o dia de folga (geralmente domingo) que é pago desde que a semana esteja em dia — por isso faltas podem fazer você 'perder o DSR', e a coluna DSR Déb mostra esse débito. Noturno é o adicional pago por horas trabalhadas no período noturno (em regra das 22h às 5h), e Ex Not. é a hora extra feita nesse período, que acumula os dois adicionais.",
    placement: "top",
  },
  {
    id: "pessoal-pontos-col-abonos-atraso",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColAbonosAtraso",
    title: "Abonos, Atraso e Ajuste",
    description: "Abono é uma ausência que foi justificada e por isso é paga normalmente (atestado médico, licença etc.) — em vez de virar falta, ela entra como abono. Atraso são os minutos perdidos no começo ou fim de um dia trabalhado. Ajuste é uma correção manual lançada pelo RH para acertar o saldo do dia. Juntas, essas colunas explicam por que o total do dia pode diferir da sua jornada padrão.",
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

// Final hub step, after all sub-flows return: column visibility.
export const meusPontosOutroSteps: TutorialStep[] = [
  {
    id: "pessoal-pontos-column-toggle",
    kind: "showcase",
    scene: "meus-pontos",
    highlight: "pessoalPontosColumnToggle",
    title: "Visibilidade de colunas",
    description: "Escolha quais colunas exibir na tabela. O número indica quantas estão visíveis.",
    placement: "bottom",
  },
];
