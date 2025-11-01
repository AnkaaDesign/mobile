import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useUsers, useTasks } from "@/hooks";
import { formatCurrency, getBonusPeriod, getCurrentPayrollPeriod } from "@/utils";
import { calculateBonusForPosition } from "@/utils/bonus";
import { TASK_STATUS, COMMISSION_STATUS, USER_STATUS } from "@/constants";

interface SimulatedUser {
  id: string;
  name: string;
  sectorName: string | null;
  position: string;
  performanceLevel: number;
  bonusAmount: number;
}

export default function BonusSimulationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [taskQuantity, setTaskQuantity] = useState<string>("0");

  // Get current bonus period
  const { year: periodYear, month: periodMonth } = getCurrentPayrollPeriod();
  const currentPeriod = getBonusPeriod(periodYear, periodMonth);

  // Prepare date range for current period
  const startDate = new Date(currentPeriod.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(currentPeriod.endDate);
  endDate.setHours(23, 59, 59, 999);

  // Fetch current period tasks
  const { data: currentPeriodTasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    where: {
      status: TASK_STATUS.COMPLETED,
      finishedAt: {
        gte: startDate,
        lte: endDate,
      },
      commission: {
        in: [COMMISSION_STATUS.FULL_COMMISSION, COMMISSION_STATUS.PARTIAL_COMMISSION],
      },
    },
    limit: 1000,
    enabled: true,
  });

  // Fetch contracted users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    where: {
      status: USER_STATUS.CONTRACTED,
    },
    include: {
      position: true,
      sector: true,
    },
    orderBy: { name: "asc" },
    limit: 100,
  });

  // Calculate weighted task count from API
  const weightedTaskCount = useMemo(() => {
    if (!currentPeriodTasks?.data) return 0;
    return currentPeriodTasks.data.reduce((sum, task) => {
      if (task.commission === COMMISSION_STATUS.FULL_COMMISSION) {
        return sum + 1.0;
      } else if (task.commission === COMMISSION_STATUS.PARTIAL_COMMISSION) {
        return sum + 0.5;
      }
      return sum;
    }, 0);
  }, [currentPeriodTasks]);

  // Set initial task quantity from current period
  React.useEffect(() => {
    if (weightedTaskCount > 0 && taskQuantity === "0") {
      setTaskQuantity(weightedTaskCount.toFixed(1));
    }
  }, [weightedTaskCount]);

  // Prepare simulated users with bonus calculation
  const simulatedUsers: SimulatedUser[] = useMemo(() => {
    if (!usersData?.data) return [];

    const taskQty = parseFloat(taskQuantity) || 0;
    const eligibleCount = usersData.data.length;
    const averagePerUser = eligibleCount > 0 ? taskQty / eligibleCount : 0;

    return usersData.data.map((user) => {
      const position = user.position?.name || "Pleno I";
      const performanceLevel = user.performanceLevel || 3;
      const bonusAmount = calculateBonusForPosition(position, performanceLevel, averagePerUser);

      return {
        id: user.id,
        name: user.name,
        sectorName: user.sector?.name || null,
        position,
        performanceLevel,
        bonusAmount,
      };
    });
  }, [usersData, taskQuantity]);

  // Calculate totals
  const totalBonusAmount = useMemo(() => simulatedUsers.reduce((sum, user) => sum + user.bonusAmount, 0), [simulatedUsers]);

  const eligibleUserCount = simulatedUsers.length;
  const averageTasksPerUser = eligibleUserCount > 0 ? parseFloat(taskQuantity) / eligibleUserCount : 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTasks(), refetchUsers()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTasks, refetchUsers]);

  const isLoading = tasksLoading || usersLoading;

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando simulação...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!usersData?.data || usersData.data.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="users" title="Nenhum colaborador encontrado" description="Não há colaboradores elegíveis para simulação" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
        {/* Header Card with Inputs */}
        <Card style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.periodInfo}>
            <ThemedText style={styles.periodLabel}>Período Atual</ThemedText>
            <ThemedText style={styles.periodValue}>
              {currentPeriod.startDate.toLocaleDateString("pt-BR")} - {currentPeriod.endDate.toLocaleDateString("pt-BR")}
            </ThemedText>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Tarefas</ThemedText>
              <Input
                value={taskQuantity}
                onChangeText={setTaskQuantity}
                keyboardType="decimal-pad"
                style={{ borderColor: colors.border }}
                inputStyle={{ ...styles.inputText, color: colors.foreground }}
                placeholder="0.0"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Colaboradores</ThemedText>
              <Input value={String(eligibleUserCount)} editable={false} style={{ borderColor: colors.border, opacity: 0.7 }} inputStyle={{ ...styles.inputText, color: colors.mutedForeground }} />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Média</ThemedText>
              <Input
                value={averageTasksPerUser.toFixed(1)}
                editable={false}
                style={{ borderColor: colors.border, opacity: 0.7 }}
                inputStyle={{ ...styles.inputText, color: colors.mutedForeground }}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Total</ThemedText>
              <Input
                value={formatCurrency(totalBonusAmount)}
                editable={false}
                style={{ borderColor: colors.border, opacity: 0.7 }}
                inputStyle={{ ...styles.inputText, color: colors.success, fontWeight: "700" }}
              />
            </View>
          </View>
        </Card>

        {/* Users List */}
        <View style={styles.usersContainer}>
          <ThemedText style={styles.sectionTitle}>Colaboradores ({simulatedUsers.length})</ThemedText>

          {simulatedUsers.map((user, ) => (
            <Card
              key={user.id}
              style={[
                styles.userCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{user.name}</ThemedText>
                  {user.sectorName && <ThemedText style={[styles.userSector, { color: colors.mutedForeground }]}>{user.sectorName}</ThemedText>}
                </View>
                <ThemedText style={[styles.bonusAmount, { color: colors.success }]}>{formatCurrency(user.bonusAmount)}</ThemedText>
              </View>

              <View style={styles.userDetails}>
                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Cargo</ThemedText>
                  <ThemedText style={styles.detailValue}>{user.position}</ThemedText>
                </View>

                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Nível</ThemedText>
                  <Badge variant="secondary" style={styles.levelBadge}>
                    <ThemedText style={styles.levelText}>{user.performanceLevel}</ThemedText>
                  </Badge>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  periodInfo: {
    gap: 4,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  periodValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
  usersContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userSector: {
    fontSize: 13,
  },
  bonusAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  userDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
