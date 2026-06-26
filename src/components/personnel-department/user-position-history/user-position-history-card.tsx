import React from "react";
import { View, StyleSheet } from "react-native";
import { IconTimeline, IconAlertTriangle } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils/formatters";
import { POSITION_CHANGE_REASON_LABELS } from "@/constants/enum-labels";
import { useUserPositionHistories } from "@/hooks/useUserPositionHistory";
import type { UserPositionHistory } from "@/types";
import { PositionChangeSummary, reasonBadgeVariant } from "./position-change-summary";

interface Props {
  userId: string;
}

/**
 * "Histórico de Cargos" — self-contained timeline card for the collaborator
 * detail screen. Mirrors web's UserPositionHistoryCard: fetches its own data by
 * userId and renders a vertical timeline (position change, reason, dates,
 * changed-by, note). The open row (endedAt = null) is the current position.
 */
export function UserPositionHistoryCard({ userId }: Props) {
  const { colors } = useTheme();

  const { data, isLoading, error } = useUserPositionHistories(
    {
      userIds: [userId],
      orderBy: { startedAt: "desc" },
      limit: 100,
      include: { position: true, previousPosition: true, changedBy: true },
    },
    { enabled: !!userId },
  );

  const records: UserPositionHistory[] = data?.data ?? [];

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconTimeline size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Histórico de Cargos</ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <IconAlertTriangle size={28} color={colors.destructive} />
          <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
            Não foi possível carregar o histórico de cargos
          </ThemedText>
        </View>
      ) : records.length === 0 ? (
        <ThemedText style={[styles.empty, { color: colors.mutedForeground }]}>
          Nenhum registro de cargo para este colaborador.
        </ThemedText>
      ) : (
        <View style={styles.timeline}>
          {records.map((record) => {
            const isCurrent = !record.endedAt;
            return (
              <View key={record.id} style={styles.timelineRow}>
                <View style={styles.timelineMarkerCol}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isCurrent ? "#15803d" : colors.mutedForeground, borderColor: colors.background },
                    ]}
                  />
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.badgeRow}>
                    <PositionChangeSummary history={record} />
                    <Badge variant={reasonBadgeVariant(record.reason) as any}>
                      {POSITION_CHANGE_REASON_LABELS[record.reason] || record.reason}
                    </Badge>
                    {isCurrent ? <Badge variant="active">Atual</Badge> : null}
                  </View>
                  <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
                    {record.startedAt ? formatDate(record.startedAt) : "-"}
                    {isCurrent ? " — presente" : ` — ${record.endedAt ? formatDate(record.endedAt) : "-"}`}
                    {" · por "}
                    {record.changedBy?.name || "Sistema"}
                  </ThemedText>
                  {record.note ? <ThemedText style={styles.note}>{record.note}</ThemedText> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.medium },
  loading: { gap: spacing.sm },
  skeleton: { height: 56, borderRadius: 8 },
  center: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  errorText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, textAlign: "center" },
  empty: { fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing.md },
  timeline: { gap: spacing.sm },
  timelineRow: { flexDirection: "row", gap: spacing.sm },
  timelineMarkerCol: { alignItems: "center", width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 3 },
  line: { width: 1, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1, gap: spacing.xs, paddingBottom: spacing.md },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  meta: { fontSize: fontSize.xs },
  note: { fontSize: fontSize.xs },
});
