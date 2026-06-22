// Histórico de Cargos — mirrors web UserPositionHistoryCard.
// Self-hides when the collaborator has no position-history records.

import { View, StyleSheet } from "react-native";

import type { UserPositionHistory } from "@/types";
import { POSITION_CHANGE_REASON_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { useUserPositionHistories } from "@/hooks/useUserPositionHistory";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface PositionHistoryCardProps {
  userId: string;
}

export function PositionHistoryCard({ userId }: PositionHistoryCardProps) {
  const { colors } = useTheme();

  const { data, isLoading } = useUserPositionHistories(
    {
      userIds: [userId],
      orderBy: { startedAt: "desc" },
      limit: 100,
      include: { position: true, previousPosition: true },
    } as any,
    { enabled: !!userId },
  );

  const records: UserPositionHistory[] = data?.data ?? [];

  // Self-hiding: render nothing while loading or when there are no records.
  if (isLoading || records.length === 0) return null;

  return (
    <DetailCard title="Histórico de Cargos" icon="history">
      <View style={styles.timeline}>
        {records.map((record) => {
          const isCurrent = record.endedAt == null;
          const range = isCurrent
            ? `${formatDate(record.startedAt)} – atual`
            : `${formatDate(record.startedAt)} – ${formatDate(record.endedAt as Date)}`;

          return (
            <View
              key={record.id}
              style={[styles.row, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: isCurrent ? colors.primary : colors.mutedForeground },
                ]}
              />
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <ThemedText style={[styles.position, { color: colors.foreground }]}>
                    {record.position?.name ?? "—"}
                  </ThemedText>
                  <Badge variant="outline" size="sm">
                    {POSITION_CHANGE_REASON_LABELS[record.reason] ?? record.reason}
                  </Badge>
                </View>
                {record.previousPosition?.name && (
                  <ThemedText style={[styles.previous, { color: colors.mutedForeground }]}>
                    Anterior: {record.previousPosition.name}
                  </ThemedText>
                )}
                <ThemedText style={[styles.range, { color: colors.mutedForeground }]}>{range}</ThemedText>
                {record.note ? (
                  <ThemedText style={[styles.note, { color: colors.mutedForeground }]}>{record.note}</ThemedText>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  timeline: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  marker: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  content: { flex: 1, gap: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  position: { fontSize: fontSize.md, fontWeight: fontWeight.medium, flex: 1 },
  previous: { fontSize: fontSize.sm },
  range: { fontSize: fontSize.sm },
  note: { fontSize: fontSize.xs, fontStyle: "italic" },
});
