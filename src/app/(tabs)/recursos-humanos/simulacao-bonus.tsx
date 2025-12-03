import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { IconFileExport, IconCalculator, IconChevronUp, IconChevronDown } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState, Badge } from "@/components/ui";
import { exportToPDF } from "@/lib/pdf-export";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { useUsers, useTasks } from "@/hooks";
import { formatCurrency, getBonusPeriod, getCurrentPayrollPeriod } from "@/utils";
import { calculateBonusForPosition } from "@/utils/bonus";
import { TASK_STATUS, COMMISSION_STATUS, USER_STATUS } from "@/constants";
import { SECTOR_PRIVILEGES } from "@/constants";
import { PrivilegeGuard } from "@/components/privilege-guard";

interface SimulatedUser {
  id: string;
  name: string;
  payrollNumber: number | null;
  sectorName: string | null;
  position: string;
  originalPerformanceLevel: number;
  performanceLevel: number;
  bonusAmount: number;
}

type SortField = 'name' | 'bonusAmount' | 'performanceLevel';
type SortDirection = 'asc' | 'desc';

export default function BonusSimulationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [taskQuantity, setTaskQuantity] = useState<number>(0);
  const [taskInput, setTaskInput] = useState<string>("0");
  const [originalTaskQuantity, setOriginalTaskQuantity] = useState<number>(0);
  const [simulatedUsers, setSimulatedUsers] = useState<SimulatedUser[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get current bonus period
  const { year: periodYear, month: periodMonth } = getCurrentPayrollPeriod();
  const currentPeriod = getBonusPeriod(periodYear, periodMonth);

  // Prepare date range for current period
  const startDate = new Date(currentPeriod.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(currentPeriod.endDate);
  endDate.setHours(23, 59, 59, 999);

  // Fetch current period tasks (completed, invoiced, or settled with commission)
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

  // Fetch contracted users with bonifiable positions
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    where: {
      status: USER_STATUS.EFFECTED,
    },
    include: {
      position: true,
      sector: true,
    },
    orderBy: { name: "asc" },
    limit: 100,
  });

  // Calculate weighted task count from API (full = 1.0, partial = 0.5) - matching desktop
  const taskCountStats = useMemo(() => {
    if (!currentPeriodTasks?.data) return { weighted: 0, full: 0, partial: 0 };

    let fullCount = 0;
    let partialCount = 0;

    currentPeriodTasks.data.forEach((task) => {
      if (task.commission === COMMISSION_STATUS.FULL_COMMISSION) {
        fullCount++;
      } else if (task.commission === COMMISSION_STATUS.PARTIAL_COMMISSION) {
        partialCount++;
      }
    });

    return {
      weighted: fullCount + (partialCount * 0.5),
      full: fullCount,
      partial: partialCount,
    };
  }, [currentPeriodTasks]);

  // Set initial task quantity from current period
  useEffect(() => {
    if (taskCountStats.weighted > 0 && taskQuantity === 0) {
      setTaskQuantity(taskCountStats.weighted);
      setOriginalTaskQuantity(taskCountStats.weighted);
      setTaskInput(taskCountStats.weighted.toFixed(1).replace('.', ','));
    }
  }, [taskCountStats.weighted]);

  // Filter to only eligible users (bonifiable position and performance level > 0)
  const eligibleUsers = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.filter(user =>
      user.position?.bonifiable === true && (user.performanceLevel || 0) > 0
    );
  }, [usersData]);

  // Initialize simulated users from eligible users
  useEffect(() => {
    if (eligibleUsers.length > 0 && simulatedUsers.length === 0) {
      const users = eligibleUsers.map((user) => ({
        id: user.id,
        name: user.name,
        payrollNumber: user.payrollNumber || null,
        sectorName: user.sector?.name || null,
        position: user.position?.name || "Pleno I",
        originalPerformanceLevel: user.performanceLevel || 3,
        performanceLevel: user.performanceLevel || 3,
        bonusAmount: 0,
      }));
      setSimulatedUsers(users);
    }
  }, [eligibleUsers]);

  // Recalculate bonuses when task quantity or users change
  useEffect(() => {
    if (simulatedUsers.length === 0) return;

    const eligibleCount = simulatedUsers.length;
    const averagePerUser = eligibleCount > 0 ? taskQuantity / eligibleCount : 0;

    setSimulatedUsers(prev => prev.map(user => ({
      ...user,
      bonusAmount: calculateBonusForPosition(user.position, user.performanceLevel, averagePerUser),
    })));
  }, [taskQuantity, simulatedUsers.length]);

  // Handle task input change (Brazilian format with comma)
  const handleTaskInputChange = useCallback((value: string) => {
    // Replace period with comma for Brazilian format
    value = value.replace('.', ',');

    // Allow empty, comma, or valid decimal number
    if (value === '' || value === ',' || /^\d*,?\d*$/.test(value)) {
      setTaskInput(value);

      if (value !== '' && value !== ',') {
        const num = parseFloat(value.replace(',', '.'));
        if (!isNaN(num) && num >= 0) {
          setTaskQuantity(num);
        }
      } else if (value === '') {
        setTaskQuantity(0);
      }
    }
  }, []);

  // Handle performance level change for a user
  const handlePerformanceLevelChange = useCallback((userId: string, delta: number) => {
    const eligibleCount = simulatedUsers.length;
    const averagePerUser = eligibleCount > 0 ? taskQuantity / eligibleCount : 0;

    setSimulatedUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;

      const newLevel = Math.max(0, Math.min(5, user.performanceLevel + delta));
      return {
        ...user,
        performanceLevel: newLevel,
        bonusAmount: calculateBonusForPosition(user.position, newLevel, averagePerUser),
      };
    }));
  }, [taskQuantity, simulatedUsers.length]);

  // Restore original task quantity
  const handleRestoreTaskQuantity = useCallback(() => {
    setTaskQuantity(originalTaskQuantity);
    setTaskInput(originalTaskQuantity.toFixed(1).replace('.', ','));
  }, [originalTaskQuantity]);

  // Sort users
  const sortedUsers = useMemo(() => {
    return [...simulatedUsers].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'bonusAmount':
          aVal = a.bonusAmount;
          bVal = b.bonusAmount;
          break;
        case 'performanceLevel':
          aVal = a.performanceLevel;
          bVal = b.performanceLevel;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [simulatedUsers, sortField, sortDirection]);

  // Toggle sort
  const _handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Calculate totals
  const totalBonusAmount = useMemo(() => simulatedUsers.reduce((sum, user) => sum + user.bonusAmount, 0), [simulatedUsers]);

  const eligibleUserCount = simulatedUsers.length;
  const averageTasksPerUser = eligibleUserCount > 0 ? taskQuantity / eligibleUserCount : 0;
  const isTaskQuantityModified = taskQuantity !== originalTaskQuantity && originalTaskQuantity > 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTasks(), refetchUsers()]);
      // Reset to reload users
      setSimulatedUsers([]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTasks, refetchUsers]);

  const handleExportPDF = useCallback(async () => {
    if (sortedUsers.length === 0) return;

    const headers = [
      { key: 'name', label: 'Colaborador' },
      { key: 'position', label: 'Cargo' },
      { key: 'sectorName', label: 'Setor' },
      { key: 'performanceLevel', label: 'Performance' },
      { key: 'bonusAmount', label: 'Bônus (R$)' },
    ];

    const exportData = sortedUsers.map((user) => ({
      name: user.name,
      position: user.position,
      sectorName: user.sectorName ?? '-',
      performanceLevel: user.performanceLevel,
      bonusAmount: user.bonusAmount.toFixed(2),
    }));

    await exportToPDF(
      exportData,
      headers,
      `simulacao_bonus_${new Date().toISOString().split('T')[0]}`,
      'Simulação de Bônus'
    );
  }, [sortedUsers]);

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
      <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]}>
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <EmptyState icon="users" title="Nenhum colaborador encontrado" description="Não há colaboradores elegíveis para simulação" />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]}>
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

            {/* Current period task count info (matching desktop) */}
            {taskCountStats.weighted > 0 && !isTaskQuantityModified && (
              <View style={[styles.periodTaskInfo, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <View style={styles.periodTaskInfoContent}>
                  <IconCalculator size={16} color={colors.primary} />
                  <ThemedText style={[styles.periodTaskInfoText, { color: colors.primary }]}>
                    {taskCountStats.weighted.toFixed(1)} tarefas ponderadas
                  </ThemedText>
                </View>
                <ThemedText style={[styles.periodTaskInfoSubtext, { color: colors.mutedForeground }]}>
                  ({taskCountStats.full} integral + {taskCountStats.partial} parcial)
                </ThemedText>
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Tarefas</ThemedText>
                <Input
                  value={taskInput}
                  onChangeText={handleTaskInputChange}
                  keyboardType="decimal-pad"
                  style={{ borderColor: colors.border }}
                  inputStyle={{ ...styles.inputText, color: colors.foreground }}
                  placeholder="0,0"
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
                  value={averageTasksPerUser.toFixed(2).replace('.', ',')}
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

            {/* Restore button when modified */}
            {isTaskQuantityModified && (
              <TouchableOpacity
                style={[styles.restoreButton, { borderColor: colors.border }]}
                onPress={handleRestoreTaskQuantity}
              >
                <IconCalculator size={18} color={colors.primary} />
                <ThemedText style={[styles.restoreButtonText, { color: colors.primary }]}>
                  Restaurar período atual
                </ThemedText>
              </TouchableOpacity>
            )}
          </Card>

          {/* Users List */}
          <View style={styles.usersContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Colaboradores ({sortedUsers.length})</ThemedText>
              <TouchableOpacity onPress={handleExportPDF} style={[styles.exportButton, { backgroundColor: colors.primary }]} disabled={sortedUsers.length === 0}>
                <IconFileExport size={20} color="#fff" />
                <ThemedText style={styles.exportButtonText}>Exportar</ThemedText>
              </TouchableOpacity>
            </View>

            {sortedUsers.map((user) => (
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
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Performance</ThemedText>
                    <View style={styles.performanceLevelControl}>
                      <TouchableOpacity
                        onPress={() => handlePerformanceLevelChange(user.id, -1)}
                        disabled={user.performanceLevel <= 0}
                        style={[styles.levelButton, { opacity: user.performanceLevel <= 0 ? 0.3 : 1 }]}
                      >
                        <IconChevronDown size={18} color={colors.foreground} />
                      </TouchableOpacity>
                      <ThemedText style={[
                        styles.levelValue,
                        user.performanceLevel !== user.originalPerformanceLevel && { color: colors.warning }
                      ]}>
                        {user.performanceLevel}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => handlePerformanceLevelChange(user.id, 1)}
                        disabled={user.performanceLevel >= 5}
                        style={[styles.levelButton, { opacity: user.performanceLevel >= 5 ? 0.3 : 1 }]}
                      >
                        <IconChevronUp size={18} color={colors.foreground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    </PrivilegeGuard>
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
  periodTaskInfo: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  periodTaskInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  periodTaskInfoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  periodTaskInfoSubtext: {
    fontSize: 12,
    marginLeft: 24,
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
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  usersContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  performanceLevelControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelButton: {
    padding: 4,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
});
