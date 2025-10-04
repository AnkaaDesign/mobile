import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { Task } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { COMMISSION_STATUS } from '../../../constants';
import { formatCurrency } from '../../../utils';
import { IconCurrencyDollar, IconPercentage, IconUsers } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface TeamCommissionStatsCardProps {
  tasks: Task[];
}

export function TeamCommissionStatsCard({ tasks }: TeamCommissionStatsCardProps) {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const fullCommissionTasks = tasks.filter((t) => t.commission === COMMISSION_STATUS.FULL_COMMISSION);
    const partialCommissionTasks = tasks.filter((t) => t.commission === COMMISSION_STATUS.PARTIAL_COMMISSION);
    const noCommissionTasks = tasks.filter((t) => t.commission === COMMISSION_STATUS.NO_COMMISSION);
    const suspendedCommissionTasks = tasks.filter((t) => t.commission === COMMISSION_STATUS.SUSPENDED_COMMISSION);

    // Calculate total earnings (tasks with price)
    const totalEarned = fullCommissionTasks.reduce((sum, task) => sum + (task.price || 0), 0);
    const partialEarned = partialCommissionTasks.reduce((sum, task) => sum + (task.price || 0) * 0.5, 0); // Assuming 50% for partial

    // Get unique team members
    const teamMembers = new Set(tasks.map((t) => t.createdBy?.id).filter(Boolean));

    return {
      totalEarnings: totalEarned + partialEarned,
      fullCommission: {
        count: fullCommissionTasks.length,
        value: totalEarned,
      },
      partialCommission: {
        count: partialCommissionTasks.length,
        value: partialEarned,
      },
      noCommission: {
        count: noCommissionTasks.length,
      },
      suspendedCommission: {
        count: suspendedCommissionTasks.length,
      },
      teamMemberCount: teamMembers.size,
    };
  }, [tasks]);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <IconCurrencyDollar size={24} color={colors.primary} />
        <ThemedText style={styles.title}>Estatísticas da Equipe</ThemedText>
      </View>

      {/* Total Earnings */}
      <View style={[styles.statRow, styles.totalRow]}>
        <ThemedText style={styles.statLabel}>Total em Comissões</ThemedText>
        <ThemedText style={[styles.statValue, styles.totalValue]}>
          {formatCurrency(stats.totalEarnings)}
        </ThemedText>
      </View>

      {/* Team Members */}
      <View style={styles.statRow}>
        <View style={styles.statLabelContainer}>
          <IconUsers size={16} color={colors.text} style={styles.statIcon} />
          <ThemedText style={styles.statLabel}>Membros da Equipe</ThemedText>
        </View>
        <ThemedText style={styles.statValue}>{stats.teamMemberCount}</ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Breakdown by Status */}
      <ThemedText style={styles.sectionTitle}>Distribuição por Status</ThemedText>

      <View style={styles.breakdownContainer}>
        {/* Full Commission */}
        <View style={styles.breakdownRow}>
          <View style={[styles.statusIndicator, { backgroundColor: "#10b981" }]} />
          <View style={styles.breakdownContent}>
            <ThemedText style={styles.breakdownLabel}>Comissão Integral</ThemedText>
            <ThemedText style={styles.breakdownCount}>{stats.fullCommission.count} serviços</ThemedText>
          </View>
          <ThemedText style={styles.breakdownValue}>
            {formatCurrency(stats.fullCommission.value)}
          </ThemedText>
        </View>

        {/* Partial Commission */}
        <View style={styles.breakdownRow}>
          <View style={[styles.statusIndicator, { backgroundColor: "#f59e0b" }]} />
          <View style={styles.breakdownContent}>
            <ThemedText style={styles.breakdownLabel}>Comissão Parcial</ThemedText>
            <ThemedText style={styles.breakdownCount}>{stats.partialCommission.count} serviços</ThemedText>
          </View>
          <ThemedText style={styles.breakdownValue}>
            {formatCurrency(stats.partialCommission.value)}
          </ThemedText>
        </View>

        {/* No Commission */}
        <View style={styles.breakdownRow}>
          <View style={[styles.statusIndicator, { backgroundColor: "#6b7280" }]} />
          <View style={styles.breakdownContent}>
            <ThemedText style={styles.breakdownLabel}>Sem Comissão</ThemedText>
            <ThemedText style={styles.breakdownCount}>{stats.noCommission.count} serviços</ThemedText>
          </View>
          <ThemedText style={styles.breakdownValue}>R$ 0,00</ThemedText>
        </View>

        {/* Suspended Commission */}
        {stats.suspendedCommission.count > 0 && (
          <View style={styles.breakdownRow}>
            <View style={[styles.statusIndicator, { backgroundColor: "#ef4444" }]} />
            <View style={styles.breakdownContent}>
              <ThemedText style={styles.breakdownLabel}>Comissão Suspensa</ThemedText>
              <ThemedText style={styles.breakdownCount}>{stats.suspendedCommission.count} serviços</ThemedText>
            </View>
            <ThemedText style={styles.breakdownValue}>R$ 0,00</ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalRow: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  statLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    marginRight: 6,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.8,
  },
  breakdownContainer: {
    gap: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  breakdownCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
});
