// status-card.tsx (mobile) — "Andamento da Admissão".
// Vertical stepper mirroring web's status-card steps (Cadastro → Documentação →
// Exame → Contrato → Registro → Concluída) with the current-status badge and the
// server-rule guards (blocking required docs / cancelled).

import { View, StyleSheet } from "react-native";
import { IconCheck, IconBan, IconAlertTriangle } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ADMISSION_STATUS, ADMISSION_STATUS_LABELS } from "@/constants";
import type { Admission } from "@/types/admission";
import { ADMISSION_STATUS_CHAIN, hasBlockingRequiredDocs } from "../utils";

interface StatusCardProps {
  admission: Admission;
}

const STEPPER_STEPS: { key: string; label: string }[] = [
  { key: "USER_REGISTRATION", label: "Cadastro de Colaborador" },
  { key: ADMISSION_STATUS.DOCS_PENDING, label: "Documentação" },
  { key: ADMISSION_STATUS.MEDICAL_EXAM, label: "Exame Admissional" },
  { key: ADMISSION_STATUS.CONTRACT, label: "Contrato" },
  { key: ADMISSION_STATUS.REGISTRATION, label: "Registro" },
  { key: ADMISSION_STATUS.COMPLETED, label: "Concluída" },
];

export function StatusCard({ admission }: StatusCardProps) {
  const { colors } = useTheme();
  const isCancelled = admission.status === ADMISSION_STATUS.CANCELLED;
  const currentIndex = ADMISSION_STATUS_CHAIN.indexOf(admission.status as ADMISSION_STATUS);
  const stepperIndex = currentIndex + 1; // offset by the always-done registration step
  const blockedByDocs = hasBlockingRequiredDocs(admission);

  return (
    <DetailCard
      title="Andamento da Admissão"
      icon="clipboard-check"
      badge={
        <Badge variant={getBadgeVariantFromStatus(admission.status, "ADMISSION")} size="sm">
          {ADMISSION_STATUS_LABELS[admission.status as ADMISSION_STATUS] || admission.status}
        </Badge>
      }
    >
      {isCancelled ? (
        <View style={[styles.banner, { borderColor: "#ef4444", backgroundColor: colors.muted }]}>
          <IconBan size={20} color="#ef4444" />
          <View style={styles.bannerTextWrap}>
            <ThemedText style={[styles.bannerTitle, { color: "#ef4444" }]}>Admissão cancelada</ThemedText>
            <ThemedText style={[styles.bannerBody, { color: colors.mutedForeground }]}>
              Este processo foi cancelado e não pode mais ser avançado.
            </ThemedText>
          </View>
        </View>
      ) : (
        <View style={styles.stepper}>
          {STEPPER_STEPS.map((step, index) => {
            const isDone = index < stepperIndex || admission.status === ADMISSION_STATUS.COMPLETED;
            const isCurrent = index === stepperIndex && admission.status !== ADMISSION_STATUS.COMPLETED;
            const isLast = index === STEPPER_STEPS.length - 1;
            const circleColor = isDone ? colors.primary : isCurrent ? colors.primary : colors.border;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View
                    style={[
                      styles.circle,
                      {
                        borderColor: circleColor,
                        backgroundColor: isDone ? colors.primary : colors.background,
                      },
                    ]}
                  >
                    {isDone ? (
                      <IconCheck size={14} color={colors.primaryForeground ?? "#ffffff"} />
                    ) : (
                      <ThemedText style={[styles.circleText, { color: isCurrent ? colors.primary : colors.mutedForeground }]}>
                        {index + 1}
                      </ThemedText>
                    )}
                  </View>
                  {!isLast && <View style={[styles.connector, { backgroundColor: isDone ? colors.primary : colors.border }]} />}
                </View>
                <ThemedText
                  style={[
                    styles.stepLabel,
                    { color: isCurrent ? colors.foreground : isDone ? colors.foreground : colors.mutedForeground },
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}

      {blockedByDocs && (
        <View style={[styles.banner, { borderColor: "#d97706", backgroundColor: colors.muted, marginTop: spacing.sm }]}>
          <IconAlertTriangle size={20} color="#d97706" />
          <View style={styles.bannerTextWrap}>
            <ThemedText style={[styles.bannerTitle, { color: colors.foreground }]}>Existem documentos obrigatórios pendentes</ThemedText>
            <ThemedText style={[styles.bannerBody, { color: colors.mutedForeground }]}>
              Receba, assine ou dispense os documentos obrigatórios para avançar a etapa.
            </ThemedText>
          </View>
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  stepper: { gap: 0 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  stepIndicatorColumn: { alignItems: "center", width: 28 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  circleText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  connector: { width: 2, flex: 1, minHeight: 18 },
  stepLabel: { fontSize: fontSize.sm, paddingTop: 4, paddingBottom: spacing.sm, flex: 1 },
  stepLabelCurrent: { fontWeight: fontWeight.semibold },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bannerTextWrap: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  bannerBody: { fontSize: fontSize.xs },
});
