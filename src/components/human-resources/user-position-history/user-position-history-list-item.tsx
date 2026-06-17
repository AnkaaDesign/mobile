import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { IconChevronRight } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils/formatters";
import { POSITION_CHANGE_REASON_LABELS } from "@/constants/enum-labels";
import type { UserPositionHistory } from "@/types";
import { PositionChangeSummary, reasonBadgeVariant } from "./position-change-summary";

interface Props {
  history: UserPositionHistory;
  onPress: (history: UserPositionHistory) => void;
}

export function UserPositionHistoryListItem({ history, onPress }: Props) {
  const { colors } = useTheme();
  const isCurrent = !history.endedAt;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(history)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <ThemedText style={styles.name}>{history.user?.name || "—"}</ThemedText>
            <PositionChangeSummary history={history} />
            <View style={styles.badgeRow}>
              <Badge variant={reasonBadgeVariant(history.reason) as any}>
                {POSITION_CHANGE_REASON_LABELS[history.reason] || history.reason}
              </Badge>
              {isCurrent ? <Badge variant="active">Atual</Badge> : null}
            </View>
            <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
              {history.startedAt ? formatDate(history.startedAt) : "-"}
              {isCurrent ? " — presente" : ` — ${history.endedAt ? formatDate(history.endedAt) : "-"}`}
            </ThemedText>
          </View>
          <IconChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flex: 1, gap: spacing.xs },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  meta: { fontSize: fontSize.sm },
});
