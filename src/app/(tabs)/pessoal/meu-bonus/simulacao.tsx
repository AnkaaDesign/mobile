import { useState, useMemo, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { IconChevronDown, IconChevronUp, IconRefresh } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePositions, useTasks, useUsers } from "@/hooks";
import { formatCurrency, getBonusPeriod, getCurrentPayrollPeriod } from "@/utils";
import { calculateBonusForPosition } from "@/utils/bonus";
import { TASK_STATUS, COMMISSION_STATUS } from "@/constants";

export default function BonusSimulationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Simulation state
  const [taskQuantity, setTaskQuantity] = useState<string>("0");
  const [selectedPerformanceLevel, setSelectedPerformanceLevel] = useState<number>(3);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  // Get current user
  const { data: currentUser, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();

  // Get current bonus period
  const { year: periodYear, month: periodMonth } = getCurrentPayrollPeriod();
  const currentPeriod = getBonusPeriod(periodYear, periodMonth);

  // Prepare date range for current period
  const startDate = new Date(currentPeriod.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(currentPeriod.endDate);
  endDate.setHours(23, 59, 59, 999);

  // Fetch ALL tasks in the period (no user filter)
  const { data: currentPeriodTasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    where: {
      status: { in: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED] },
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

  // Fetch all positions to determine hierarchy
  const { data: positionsData, isLoading: positionsLoading } = usePositions({
    orderBy: { hierarchy: "asc" },
    limit: 100,
  });

  // Fetch all eligible users (for calculating average)
  const { data: eligibleUsersData } = useUsers({
    where: {
      performanceLevel: { gt: 0 },
      position: { bonifiable: true },
    },
    limit: 100,
  });

  // Calculate task counts by commission type
  const tasksByCommission = useMemo(() => {
    if (!currentPeriodTasks?.data) {
      return {
        noCommission: 0,
        partialCommission: 0,
        fullCommission: 0,
        suspendedCommission: 0,
      };
    }

    return currentPeriodTasks.data.reduce((counts, task) => {
      if (task.commission === COMMISSION_STATUS.NO_COMMISSION) {
        counts.noCommission += 1;
      } else if (task.commission === COMMISSION_STATUS.PARTIAL_COMMISSION) {
        counts.partialCommission += 1;
      } else if (task.commission === COMMISSION_STATUS.FULL_COMMISSION) {
        counts.fullCommission += 1;
      } else if (task.commission === COMMISSION_STATUS.SUSPENDED_COMMISSION) {
        counts.suspendedCommission += 1;
      }
      return counts;
    }, {
      noCommission: 0,
      partialCommission: 0,
      fullCommission: 0,
      suspendedCommission: 0,
    });
  }, [currentPeriodTasks]);

  // Calculate total weighted task count from ALL tasks
  const totalWeightedTasks = useMemo(() => {
    return tasksByCommission.fullCommission + (tasksByCommission.partialCommission * 0.5);
  }, [tasksByCommission]);

  // Calculate eligible users count
  const eligibleUsersCount = useMemo(() => {
    return eligibleUsersData?.data?.length || 0;
  }, [eligibleUsersData]);

  // Calculate maximum allowed task quantity (average must be below 6)
  const maxTaskQuantity = useMemo(() => {
    return eligibleUsersCount * 6;
  }, [eligibleUsersCount]);

  // Set initial task quantity to the current total weighted tasks
  useEffect(() => {
    if (totalWeightedTasks > 0 && taskQuantity === "0") {
      setTaskQuantity(totalWeightedTasks.toFixed(1));
    }
  }, [totalWeightedTasks, taskQuantity]);

  // Set initial performance level from user
  useEffect(() => {
    if (currentUser?.performanceLevel && selectedPerformanceLevel === 3) {
      setSelectedPerformanceLevel(currentUser.performanceLevel);
    }
  }, [currentUser?.performanceLevel, selectedPerformanceLevel]);

  // Get available positions (current + 2 above based on hierarchy)
  const availablePositions = useMemo(() => {
    if (!positionsData?.data || !currentUser?.position) return [];

    const currentPosition = currentUser.position;
    const currentHierarchy = currentPosition.hierarchy ?? 0;

    // Get positions within 2 levels above current
    return positionsData.data.filter((pos) => {
      const posHierarchy = pos.hierarchy ?? 0;
      return posHierarchy >= currentHierarchy && posHierarchy <= currentHierarchy + 2;
    });
  }, [positionsData, currentUser]);

  // Set initial position
  useEffect(() => {
    if (!selectedPositionId && currentUser?.position?.id) {
      setSelectedPositionId(currentUser.position.id);
    }
  }, [selectedPositionId, currentUser?.position?.id]);

  // Get selected position object
  const selectedPosition = useMemo(() => {
    return availablePositions.find((p) => p.id === selectedPositionId) || currentUser?.position;
  }, [availablePositions, selectedPositionId, currentUser?.position]);

  // Calculate simulated average from task quantity
  const simulatedAverage = useMemo(() => {
    if (eligibleUsersCount === 0) return 0;
    const quantity = parseFloat(taskQuantity) || 0;
    return quantity / eligibleUsersCount;
  }, [taskQuantity, eligibleUsersCount]);

  // Calculate simulated bonus (using calculated average from task quantity)
  const calculatedBonus = useMemo(() => {
    if (!selectedPosition?.name) return 0;
    return calculateBonusForPosition(selectedPosition.name, selectedPerformanceLevel, simulatedAverage);
  }, [selectedPosition, selectedPerformanceLevel, simulatedAverage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTasks(), refetchUser()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTasks, refetchUser]);

  const handlePerformanceLevelChange = useCallback((direction: "up" | "down") => {
    setSelectedPerformanceLevel((prev) => {
      if (direction === "up") return Math.min(5, prev + 1);
      return Math.max(1, prev - 1);
    });
  }, []);

  // Handle task quantity change with maximum limit
  const handleTaskQuantityChange = useCallback((value: string) => {
    // Allow empty or partial input while typing
    if (value === "" || value === "." || value.endsWith(".")) {
      setTaskQuantity(value);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setTaskQuantity(value);
      return;
    }

    // Clamp to maximum if exceeded
    if (numValue > maxTaskQuantity) {
      setTaskQuantity(maxTaskQuantity.toFixed(1));
    } else {
      setTaskQuantity(value);
    }
  }, [maxTaskQuantity]);

  const isLoading = userLoading || tasksLoading || positionsLoading;

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

  if (!currentUser) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="user" title="Usuário não encontrado" description="Não foi possível carregar seus dados" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
        {/* Simulation Controls Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Simular Bônus</ThemedText>

          {/* Task Quantity Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Tarefas Ponderadas</ThemedText>
            <View style={styles.inputWithButton}>
              <View style={{ flex: 1 }}>
                <Input
                  value={taskQuantity}
                  onChangeText={handleTaskQuantityChange}
                  keyboardType="decimal-pad"
                  style={{ borderColor: colors.border }}
                  inputStyle={{ ...styles.inputText, color: colors.foreground }}
                  placeholder="0.0"
                />
              </View>
              <TouchableOpacity
                style={[styles.resetButtonInline, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setTaskQuantity(totalWeightedTasks.toFixed(1))}
              >
                <IconRefresh size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.inputHint, { color: colors.mutedForeground }]}>
              Atual: {totalWeightedTasks.toFixed(1)} · Máximo: {maxTaskQuantity.toFixed(1)}
            </ThemedText>
          </View>

          {/* Position Selector */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Cargo</ThemedText>
            <View style={styles.positionGrid}>
              {availablePositions.map((position) => (
                <TouchableOpacity
                  key={position.id}
                  style={[
                    styles.positionButton,
                    {
                      backgroundColor: selectedPositionId === position.id ? colors.primary : colors.muted,
                      borderColor: selectedPositionId === position.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPositionId(position.id)}
                >
                  <ThemedText
                    style={[
                      styles.positionButtonText,
                      { color: selectedPositionId === position.id ? "#fff" : colors.foreground },
                    ]}
                  >
                    {position.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Performance Level Selector */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Nível de Desempenho</ThemedText>
            <View style={styles.performanceSelector}>
              <TouchableOpacity
                style={[styles.chevronButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => handlePerformanceLevelChange("down")}
                disabled={selectedPerformanceLevel <= 1}
              >
                <IconChevronDown size={24} color={selectedPerformanceLevel <= 1 ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>

              <View style={[styles.performanceDisplay, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <ThemedText style={styles.performanceDisplayText}>Nível {selectedPerformanceLevel}</ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.chevronButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => handlePerformanceLevelChange("up")}
                disabled={selectedPerformanceLevel >= 5}
              >
                <IconChevronUp size={24} color={selectedPerformanceLevel >= 5 ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Simulation Result Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Resultado da Simulação</ThemedText>
          <ThemedText style={[styles.resultAmount, { color: colors.primary }]}>
            {formatCurrency(calculatedBonus)}
          </ThemedText>
          <View style={styles.resultDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Cargo:</ThemedText>
              <ThemedText style={styles.detailValue}>{selectedPosition?.name || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Desempenho:</ThemedText>
              <ThemedText style={styles.detailValue}>Nível {selectedPerformanceLevel}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Tarefas Ponderadas:</ThemedText>
              <ThemedText style={styles.detailValue}>{taskQuantity || "0"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Colaboradores Elegíveis:</ThemedText>
              <ThemedText style={styles.detailValue}>{eligibleUsersCount}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Média por Colaborador:</ThemedText>
              <ThemedText style={styles.detailValue}>{simulatedAverage.toFixed(2)}</ThemedText>
            </View>
          </View>
        </Card>
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
  card: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputHint: {
    fontSize: 12,
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  resetButtonInline: {
    height: 48,
    width: 48,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  positionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  positionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  positionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  performanceSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chevronButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  performanceDisplay: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  performanceDisplayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  resultAmount: {
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
  },
  resultDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
