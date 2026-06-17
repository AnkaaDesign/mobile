import { View, StyleSheet } from "react-native";

import type { User, ContractPhaseHistory } from "@/types";
import { CONTRACT_TYPE_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface ContractPhasesCardProps {
  employee: User;
}

export function ContractPhasesCard({ employee }: ContractPhasesCardProps) {
  const { colors } = useTheme();

  // Prefer the current contract's phases; fall back to the user-level relation.
  const phases: ContractPhaseHistory[] =
    employee.currentContract?.phaseHistory ??
    employee.contractPhaseHistory ??
    [];

  if (!phases.length) return null;

  const sorted = [...phases].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <DetailCard title="Histórico de Fases do Contrato" icon="history">
      <View style={styles.timeline}>
        {sorted.map((phase) => {
          const isCurrent = phase.endDate == null;
          const range = isCurrent
            ? `${formatDate(phase.startDate)} – atual`
            : `${formatDate(phase.startDate)} – ${formatDate(phase.endDate)}`;

          return (
            <View
              key={phase.id}
              style={[
                styles.row,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: isCurrent
                      ? colors.primary
                      : colors.mutedForeground,
                  },
                ]}
              />
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <ThemedText
                    style={[styles.modality, { color: colors.foreground }]}
                  >
                    {CONTRACT_TYPE_LABELS[phase.contractType]}
                  </ThemedText>
                  {isCurrent && (
                    <Badge variant="success" size="sm">
                      Atual
                    </Badge>
                  )}
                </View>
                <ThemedText
                  style={[styles.range, { color: colors.mutedForeground }]}
                >
                  {range}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  modality: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  range: {
    fontSize: fontSize.sm,
  },
});
