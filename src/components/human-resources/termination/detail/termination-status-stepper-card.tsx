import { View, StyleSheet, Alert } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import type { Termination } from "@/types";
import { TERMINATION_STATUS } from "@/constants";
import { TERMINATION_STATUS_LABELS } from "@/constants/enum-labels";
import { TERMINATION_STATUS_ORDER } from "@/constants/sortOrders";
import { useTerminationAdvance } from "@/hooks/useTermination";
import { useNav } from "@/contexts/nav";

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

  const currentOrder = TERMINATION_STATUS_ORDER[t.status] ?? 0;
  const isCancelled = t.status === TERMINATION_STATUS.CANCELLED;
  const isCompleted = t.status === TERMINATION_STATUS.COMPLETED;
  const isTerminal = isCancelled || isCompleted;

  const nextStep = STEPS.find((s) => (TERMINATION_STATUS_ORDER[s] ?? 0) > currentOrder);

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

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Rescisão",
      "Tem certeza que deseja CANCELAR esta rescisão? O colaborador não será desligado.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar Rescisão",
          style: "destructive",
          onPress: async () => {
            try {
              await nav.withLoading(async () =>
                advance.mutateAsync({ id: t.id, data: { status: TERMINATION_STATUS.CANCELLED } }),
              );
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
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
            <Button variant="outline" disabled={advance.isPending} onPress={handleCancel}>
              Cancelar Rescisão
            </Button>
          </View>
        ) : null}
      </View>
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
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
