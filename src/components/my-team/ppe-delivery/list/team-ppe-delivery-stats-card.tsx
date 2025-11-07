import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { IconPackage, IconClock, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { PpeDelivery } from '@/types';
import { PPE_DELIVERY_STATUS } from '@/constants';

interface TeamPpeDeliveryStatsCardProps {
  deliveries: PpeDelivery[];
}

export function TeamPpeDeliveryStatsCard({ deliveries }: TeamPpeDeliveryStatsCardProps) {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const pending = deliveries.filter(d => d.status === PPE_DELIVERY_STATUS.PENDING).length;
    const approved = deliveries.filter(d => d.status === PPE_DELIVERY_STATUS.APPROVED).length;
    const delivered = deliveries.filter(d => d.status === PPE_DELIVERY_STATUS.DELIVERED).length;
    const needsAttention = deliveries.filter(d =>
      d.status === PPE_DELIVERY_STATUS.REPROVED || d.status === PPE_DELIVERY_STATUS.CANCELLED
    ).length;

    return {
      total: deliveries.length,
      pending,
      approved,
      delivered,
      needsAttention,
    };
  }, [deliveries]);

  const statItems = [
    {
      label: "Pendentes",
      value: stats.pending,
      icon: IconClock,
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
    {
      label: "Aprovadas",
      value: stats.approved,
      icon: IconCircleCheck,
      color: "#3b82f6",
      bgColor: "#dbeafe",
    },
    {
      label: "Entregues",
      value: stats.delivered,
      icon: IconPackage,
      color: "#10b981",
      bgColor: "#d1fae5",
    },
    {
      label: "Atenção",
      value: stats.needsAttention,
      icon: IconAlertCircle,
      color: "#ef4444",
      bgColor: "#fee2e2",
    },
  ];

  return (
    <Card style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Estatísticas
        </ThemedText>
        <ThemedText style={[styles.totalText, { color: colors.mutedForeground }]}>
          Total: {stats.total}
        </ThemedText>
      </View>

      <View style={styles.statsGrid}>
        {statItems.map((item) => (
          <View key={item.label} style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {item.value}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {item.label}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  totalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: "45%",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xl * 1.2,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
});
