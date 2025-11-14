import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BORROW_STATUS } from "@/constants";
import type { Borrow } from '../../../types';
import { extendedColors } from "@/lib/theme/extended-colors";

interface TeamBorrowStatsCardProps {
  borrows: Borrow[];
}

export const TeamBorrowStatsCard = ({ borrows }: TeamBorrowStatsCardProps) => {
  const { isDark } = useTheme();

  const stats = useMemo(() => {
    const total = borrows.length;
    const active = borrows.filter((b) => b.status === BORROW_STATUS.ACTIVE).length;
    const returned = borrows.filter((b) => b.status === BORROW_STATUS.RETURNED).length;
    const lost = borrows.filter((b) => b.status === BORROW_STATUS.LOST).length;

    return { total, active, returned, lost };
  }, [borrows]);

  return (
    <Card style={styles.statsCard}>
      <ThemedText style={styles.statsTitle}>Resumo</ThemedText>
      <View style={styles.statsGrid}>
        {/* Total */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
            <Icon name="package" size="sm" variant="muted" />
          </View>
          <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>

        {/* Active */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
            <Icon name="clock" size="sm" color="#3b82f6" />
          </View>
          <ThemedText style={styles.statValue}>{stats.active}</ThemedText>
          <ThemedText style={styles.statLabel}>Ativos</ThemedText>
        </View>

        {/* Returned */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(34, 197, 94, 0.15)" }]}>
            <Icon name="check-circle" size="sm" color="#22c55e" />
          </View>
          <ThemedText style={styles.statValue}>{stats.returned}</ThemedText>
          <ThemedText style={styles.statLabel}>Devolvidos</ThemedText>
        </View>

        {/* Lost */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
            <Icon name="alert-triangle" size="sm" color="#ef4444" />
          </View>
          <ThemedText style={styles.statValue}>{stats.lost}</ThemedText>
          <ThemedText style={styles.statLabel}>Perdidos</ThemedText>
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
