import type { TutorialStep } from "../engine-types";

/**
 * Assinatura de Ponto (fechamento de ponto) sub-flow.
 *
 * Entry: the user taps the IconWritingSign button on the Meus Pontos hub
 * (wired in steps/meus-pontos.ts as meusPontosAssinaturaEntrySteps).
 *
 * Flow: list overview → tap pending row → detail overview → status →
 *       PDF → actions (approve/reject) → voltar from detail → voltar from list.
 */

export const assinaturaSteps: TutorialStep[] = [
  // ─── Assinaturas list ───────────────────────────────────────────────────
  {
    id: "pessoal-assinaturas-overview",
    kind: "showcase",
    scene: "assinaturas",
    highlight: "pessoalAssinaturas",
    title: "Fechamentos de Ponto",
    description:
      "Aqui ficam os cartões-ponto emitidos pelo RH para sua assinatura digital. Cada linha mostra o período e o status: Pendente (ainda não respondido), Aprovado ou Rejeitado.",
    placement: "center",
  },
  {
    id: "pessoal-assinaturas-row-tap",
    kind: "interactive",
    scene: "assinaturas",
    highlight: "pessoalAssinaturasFirstRow",
    title: "Abrir fechamento",
    description: "Toque para ver os detalhes do cartão-ponto e decidir se aprova ou reprova.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },

  // ─── Assinatura detail ──────────────────────────────────────────────────
  {
    id: "pessoal-assinatura-detail-overview",
    kind: "showcase",
    scene: "assinatura-detail",
    highlight: "pessoalAssinaturaDetail",
    title: "Detalhes do cartão-ponto",
    description:
      "Aqui você vê todas as informações do fechamento de ponto: período, número de emissão e situação. Mais abaixo está o cartão-ponto em PDF para conferir antes de responder.",
    placement: "center",
  },
  {
    id: "pessoal-assinatura-detail-status",
    kind: "showcase",
    scene: "assinatura-detail",
    highlight: "pessoalAssinaturaDetailStatus",
    title: "Status da apuração",
    description:
      "O Status mostra em que fase está o fechamento. Enquanto Pendente, você ainda pode aprovar ou reprovar. Após sua resposta, muda para Aprovado ou Rejeitado.",
    placement: "bottom",
  },
  {
    id: "pessoal-assinatura-detail-pdf",
    kind: "showcase",
    scene: "assinatura-detail",
    highlight: "pessoalAssinaturaDetailPdf",
    title: "Cartão-ponto em PDF",
    description:
      "O cartão-ponto resume todas as batidas e o cálculo de horas do período. Revise com atenção antes de assinar — após a aprovação, o fechamento é registrado no sistema.",
    placement: "top",
  },
  {
    id: "pessoal-assinatura-detail-actions",
    kind: "showcase",
    scene: "assinatura-detail",
    highlight: "pessoalAssinaturaDetailActions",
    title: "Aprovar ou Reprovar",
    description:
      "Se o cartão-ponto está correto, toque em Aprovar para assinar digitalmente. Se houver erro, toque em Reprovar e informe o motivo — o RH será avisado e poderá corrigir e reemitir o cartão.",
    placement: "top",
  },

  // ─── Voltar (detail → list → hub) ───────────────────────────────────────
  {
    id: "pessoal-assinatura-detail-voltar",
    kind: "interactive",
    scene: "assinatura-detail",
    highlight: "chromeHeaderBack",
    title: "Voltar",
    description: "Toque na seta para voltar à lista de fechamentos.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
  {
    id: "pessoal-assinaturas-voltar",
    kind: "interactive",
    scene: "assinaturas",
    highlight: "chromeHeaderBack",
    title: "Voltar",
    description: "Toque na seta para voltar ao Meus Pontos.",
    expectedAction: "tap",
    placement: "bottom",
    pulseTarget: true,
  },
];
