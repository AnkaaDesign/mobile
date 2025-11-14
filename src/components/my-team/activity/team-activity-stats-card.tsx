import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ACTIVITY_OPERATION } from "@/constants";
import type { Activity } from '../../../types';
import { extendedColors } from "@/lib/theme/extended-colors";

interface TeamActivityStatsCardProps {
  activities: Activity[];
}

export const TeamActivityStatsCard = ({ activities }: TeamActivityStatsCardProps) => {
  const { isDark } = useTheme();

  const stats = useMemo(() => {
    const total = activities.length;
    const inbound = activities.filter((a) => a.operation === ACTIVITY_OPERATION.INBOUND).length;
    const outbound = activities.filter((a) => a.operation === ACTIVITY_OPERATION.OUTBOUND).length;

    // Calculate total quantity by operation
    const inboundQty = activities
      .filter((a) => a.operation === ACTIVITY_OPERATION.INBOUND)
      .reduce((sum, a) => sum + a.quantity, 0);
    const outboundQty = activities
      .filter((a) => a.operation === ACTIVITY_OPERATION.OUTBOUND)
      .reduce((sum, a) => sum + a.quantity, 0);

    return { total, inbound, outbound, inboundQty, outboundQty };
  }, [activities]);

  return (
    <Card style={styles.statsCard}>
      <ThemedText style={styles.statsTitle}>Resumo</ThemedText>
      <View style={styles.statsGrid}>
        {/* Total */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
            <Icon name="activity" size="sm" variant="muted" />
          </View>
          <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>

        {/* Inbound */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(34, 197, 94, 0.15)" }]}>
            <Icon name="arrow-down" size="sm" color="#22c55e" />
          </View>
          <ThemedText style={styles.statValue}>{stats.inbound}</ThemedText>
          <ThemedText style={styles.statLabel}>Entradas</ThemedText>
        </View>

        {/* Outbound */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
            <Icon name="arrow-up" size="sm" color="#ef4444" />
          </View>
          <ThemedText style={styles.statValue}>{stats.outbound}</ThemedText>
          <ThemedText style={styles.statLabel}>Saídas</ThemedText>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    textAlign: "center",
  },
});
