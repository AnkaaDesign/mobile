import React from "react";
import { View, StyleSheet } from "react-native";
import { IconTimeline } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { POSITION_CHANGE_REASON_LABELS } from "@/constants/enum-labels";
import type { UserPositionHistory } from "@/types";
import { PositionChangeSummary, reasonBadgeVariant } from "./position-change-summary";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <ThemedText style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</ThemedText>
      <View style={styles.rowValue}>
        {typeof value === "string" || typeof value === "number" ? (
          <ThemedText style={styles.rowValueText}>{value}</ThemedText>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

export function UserPositionHistoryDetailCard({ history }: { history: UserPositionHistory }) {
  const { colors } = useTheme();
  const isCurrent = !history.endedAt;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconTimeline size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Mudança de Cargo</ThemedText>
      </View>
      <View style={styles.changeRow}>
        <PositionChangeSummary history={history} />
      </View>
      <Row label="Colaborador" value={history.user?.name || "—"} />
      <Row
        label="Motivo"
        value={
          <Badge variant={reasonBadgeVariant(history.reason) as any}>
            {POSITION_CHANGE_REASON_LABELS[history.reason] || history.reason}
          </Badge>
        }
      />
      <Row label="Início" value={history.startedAt ? formatDate(history.startedAt) : "—"} />
      <Row
        label="Fim"
        value={isCurrent ? <Badge variant="active">Atual</Badge> : history.endedAt ? formatDate(history.endedAt) : "—"}
      />
      <Row label="Alterado Por" value={history.changedBy?.name || "Sistema"} />
      <Row label="Criado Em" value={history.createdAt ? formatDateTime(history.createdAt) : "—"} />
      {history.note ? (
        <View style={styles.noteBlock}>
          <ThemedText style={[styles.rowLabel, { color: colors.mutedForeground }]}>Observação</ThemedText>
          <ThemedText style={styles.noteText}>{history.note}</ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.medium },
  changeRow: { paddingVertical: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: fontSize.sm, flexShrink: 1, marginRight: spacing.md },
  rowValue: { flexShrink: 1, alignItems: "flex-end" },
  rowValueText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: "right" },
  noteBlock: { paddingVertical: spacing.sm, gap: spacing.xs },
  noteText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
