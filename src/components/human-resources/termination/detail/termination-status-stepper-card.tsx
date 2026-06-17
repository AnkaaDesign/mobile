import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { IconStethoscope } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import type { Termination } from "@/types";
import {
  routes,
  TERMINATION_STATUS,
  MEDICAL_EXAM_TYPE,
  MEDICAL_EXAM_STATUS,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { TERMINATION_STATUS_LABELS } from "@/constants/enum-labels";
import { TERMINATION_STATUS_ORDER } from "@/constants/sortOrders";
import { useTerminationAdvance, useTerminationRegress } from "@/hooks/useTermination";
import { useMedicalExamMutations } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { LinkedExamStatus, useLinkedMedicalExam } from "@/components/human-resources/medical-exam/detail/linked-exam-status";
import { CancelReasonModal } from "@/components/human-resources/shared/cancel-reason-modal";

interface Props {
  termination: Termination;
  /** Whether the user may advance/cancel the status machine. */
  canManage?: boolean;
}

// Ordered pipeline (CANCELLED is a side-state, not a step).
const STEPS: TERMINATION_STATUS[] = [
  TERMINATION_STATUS.INITIATED,
  TERMINATION_STATUS.NOTICE_PERIOD,
  TERMINATION_STATUS.DOCUMENTS,
  TERMINATION_STATUS.MEDICAL_EXAM,
  TERMINATION_STATUS.CALCULATION,
  TERMINATION_STATUS.PAYMENT,
  TERMINATION_STATUS.HOMOLOGATION,
  TERMINATION_STATUS.COMPLETED,
];

export function TerminationStatusStepperCard({ termination: t, canManage }: Props) {
  const { colors } = useTheme();
  const nav = useNav();
  const advance = useTerminationAdvance();
  const regress = useTerminationRegress();
  const { createAsync } = useMedicalExamMutations();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const currentOrder = TERMINATION_STATUS_ORDER[t.status] ?? 0;
  const isCancelled = t.status === TERMINATION_STATUS.CANCELLED;
  const isCompleted = t.status === TERMINATION_STATUS.COMPLETED;
  const isTerminal = isCancelled || isCompleted;

  const nextStep = STEPS.find((s) => (TERMINATION_STATUS_ORDER[s] ?? 0) > currentOrder);
  // Last step strictly before the current one (retrocede uma etapa).
  const prevStep = [...STEPS].reverse().find((s) => (TERMINATION_STATUS_ORDER[s] ?? 0) < currentOrder);

  // DISMISSAL exam linked to this termination (auto-created by the server on the
  // medical step; restricted to exams from the current process via createdAt).
  const medicalOrder = TERMINATION_STATUS_ORDER[TERMINATION_STATUS.MEDICAL_EXAM] ?? 0;
  const { exam: dismissalExam } = useLinkedMedicalExam(t.userId, MEDICAL_EXAM_TYPE.DISMISSAL, t.createdAt);
  const showExamSection = !isCancelled && (currentOrder >= medicalOrder || !!dismissalExam);

  const handleScheduleExam = () => {
    if (!t.userId) return;
    Alert.alert(
      "Agendar exame demissional",
      "Criar um exame demissional (ASO) agendado para este colaborador?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Agendar",
          onPress: async () => {
            try {
              const res = await nav.withLoading(async () =>
                createAsync({
                  userId: t.userId,
                  type: MEDICAL_EXAM_TYPE.DISMISSAL,
                  status: MEDICAL_EXAM_STATUS.SCHEDULED,
                  terminationId: t.id,
                } as any),
              );
              const newId = (res as any)?.data?.id;
              if (newId) {
                nav.push(mobileRoute(routes.humanResources.occupationalHealth.medicalExams.details(newId)));
              }
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  const handleAdvance = () => {
    if (!nextStep) return;
    Alert.alert(
      "Avançar Status",
      `Avançar para "${TERMINATION_STATUS_LABELS[nextStep]}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Avançar",
          onPress: async () => {
            try {
              await nav.withLoading(async () => advance.mutateAsync({ id: t.id }));
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  const handleRegress = () => {
    if (!prevStep) return;
    Alert.alert(
      "Voltar Etapa",
      `Retroceder para "${TERMINATION_STATUS_LABELS[prevStep]}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Voltar Etapa",
          onPress: async () => {
            try {
              await nav.withLoading(async () => regress.mutateAsync({ id: t.id }));
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  // The API hard-requires a non-empty trimmed `reason` when cancelling, so we
  // collect it via a modal instead of the previous Alert (which 400'd).
  const handleCancelConfirm = async (reason: string) => {
    try {
      await nav.withLoading(async () =>
        advance.mutateAsync({ id: t.id, data: { status: TERMINATION_STATUS.CANCELLED, reason } }),
      );
      setShowCancelModal(false);
    } catch {
      /* interceptor toasts */
    }
  };

  return (
    <DetailCard title="Andamento" icon="git-branch">
      <View style={styles.content}>
        {isCancelled ? (
          <View style={[styles.cancelledBanner, { backgroundColor: colors.destructive + "14", borderColor: colors.destructive }]}>
            <Icon name="x-circle" size={18} color={colors.destructive} />
            <ThemedText style={{ color: colors.foreground }}>Rescisão cancelada.</ThemedText>
          </View>
        ) : (
          <View style={styles.stepper}>
            {STEPS.map((step) => {
              const order = TERMINATION_STATUS_ORDER[step] ?? 0;
              const done = order < currentOrder;
              const active = step === t.status;
              const color = active ? colors.primary : done ? "#22c55e" : colors.mutedForeground;
              return (
                <View key={step} style={styles.stepRow}>
                  <View
                    style={[
                      styles.dot,
                      { borderColor: color, backgroundColor: done || active ? color : "transparent" },
                    ]}
                  >
                    {done ? <Icon name="check" size={12} color={colors.background} /> : null}
                  </View>
                  <ThemedText
                    style={{
                      color: active ? colors.foreground : colors.mutedForeground,
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {TERMINATION_STATUS_LABELS[step]}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {showExamSection ? (
          <View style={[styles.examSection, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <View style={styles.examTitleRow}>
              <IconStethoscope size={16} color={colors.mutedForeground} />
              <ThemedText style={{ color: colors.foreground, fontWeight: "600" }}>Exame Demissional (ASO)</ThemedText>
            </View>
            <LinkedExamStatus
              userId={t.userId}
              type={MEDICAL_EXAM_TYPE.DISMISSAL}
              createdAfter={t.createdAt}
              emptyText="Nenhum exame demissional encontrado."
            />
            {canManage && !dismissalExam ? (
              <Button
                variant="outline"
                size="sm"
                onPress={handleScheduleExam}
                icon={<Icon name="calendar-plus" size={16} color={colors.foreground} />}
              >
                Agendar exame
              </Button>
            ) : null}
          </View>
        ) : null}

        {canManage && !isTerminal ? (
          <View style={styles.actions}>
            {nextStep ? (
              <Button
                variant="default"
                loading={advance.isPending}
                onPress={handleAdvance}
                icon={<Icon name="arrow-right" size={16} color={colors.background} />}
              >
                {`Avançar para ${TERMINATION_STATUS_LABELS[nextStep]}`}
              </Button>
            ) : null}
            {prevStep ? (
              <Button
                variant="outline"
                loading={regress.isPending}
                disabled={advance.isPending}
                onPress={handleRegress}
                icon={<Icon name="arrow-left" size={16} color={colors.foreground} />}
              >
                {`Voltar para ${TERMINATION_STATUS_LABELS[prevStep]}`}
              </Button>
            ) : null}
            <Button variant="outline" disabled={advance.isPending || regress.isPending} onPress={() => setShowCancelModal(true)}>
              Cancelar Rescisão
            </Button>
          </View>
        ) : null}
      </View>

      <CancelReasonModal
        visible={showCancelModal}
        title="Cancelar Rescisão"
        description={`A rescisão${t.user?.name ? ` de "${t.user.name}"` : ""} será marcada como cancelada na etapa atual e não poderá mais ser avançada. Informe o motivo de não ter sido concluída.`}
        confirmLabel="Cancelar Rescisão"
        loading={advance.isPending}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  stepper: { gap: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: 10 },
  examSection: { gap: 8, borderWidth: 1, borderRadius: 8, padding: 12 },
  examTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
