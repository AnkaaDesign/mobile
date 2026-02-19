import { useState, useMemo, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { IconCalculator, IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState, Combobox } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { useUsers, useTasks, usePositions, useScreenReady} from '@/hooks';
import { formatCurrency, getBonusPeriod, getCurrentPayrollPeriod } from "@/utils";
import { calculateBonusForPosition } from "@/utils/bonus";
import { TASK_STATUS, COMMISSION_STATUS, USER_STATUS } from "@/constants";
import { SECTOR_PRIVILEGES } from "@/constants";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { Skeleton } from "@/components/ui/skeleton";

// Standard position names for simulation
const POSITION_OPTIONS = [
  { value: "Junior I", label: "Junior I" },
  { value: "Junior II", label: "Junior II" },
  { value: "Junior III", label: "Junior III" },
  { value: "Junior IV", label: "Junior IV" },
  { value: "Pleno I", label: "Pleno I" },
  { value: "Pleno II", label: "Pleno II" },
  { value: "Pleno III", label: "Pleno III" },
  { value: "Pleno IV", label: "Pleno IV" },
  { value: "Senior I", label: "Senior I" },
  { value: "Senior II", label: "Senior II" },
  { value: "Senior III", label: "Senior III" },
  { value: "Senior IV", label: "Senior IV" },
];

interface SimulatedUser {
  id: string;
  name: string;
  payrollNumber: number | null;
  originalPosition: string;
  position: string;
  originalPerformanceLevel: number;
  performanceLevel: number;
  bonusAmount: number;
}

export default function BonusSimulationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [taskQuantity, setTaskQuantity] = useState<number>(0);
  const [taskInput, setTaskInput] = useState<string>("");
  const [originalTaskQuantity, setOriginalTaskQuantity] = useState<number>(0);
  const [simulatedUsers, setSimulatedUsers] = useState<SimulatedUser[]>([]);
  const [hasUserModified, setHasUserModified] = useState(false);

  // Get current bonus period
  const { year: periodYear, month: periodMonth } = getCurrentPayrollPeriod();
  const currentPeriod = getBonusPeriod(periodYear, periodMonth);

  // Prepare date range for current period
  const startDate = new Date(currentPeriod.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(currentPeriod.endDate);
  endDate.setHours(23, 59, 59, 999);

  // Fetch current period tasks (completed with commission)
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

  // Calculate weighted task count from API (full = 1.0, partial = 0.5)
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

  // Set initial task quantity from current period (only once on load)
  useEffect(() => {
    if (taskCountStats.weighted > 0 && !hasUserModified && taskInput === "") {
      setTaskQuantity(taskCountStats.weighted);
      setOriginalTaskQuantity(taskCountStats.weighted);
      setTaskInput(taskCountStats.weighted.toFixed(1).replace('.', ','));
    }
  }, [taskCountStats.weighted, hasUserModified, taskInput]);

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
        originalPosition: user.position?.name || "Pleno I",
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
  const handleTaskInputChange = useCallback((value: string | number | null) => {
    // Mark as user modified
    setHasUserModified(true);

    // Handle null or undefined value
    if (value == null) {
      setTaskInput("");
      return;
    }

    // Convert to string for processing
    let strValue = String(value);

    // Replace period with comma for Brazilian format
    strValue = strValue.replace('.', ',');

    // Allow empty, comma, or valid decimal number pattern
    if (strValue === "" || strValue === "," || /^\d*,?\d*$/.test(strValue)) {
      setTaskInput(strValue);

      // Update numeric value
      if (strValue !== "" && strValue !== ",") {
        const num = parseFloat(strValue.replace(',', '.'));
        if (!isNaN(num) && num >= 0) {
          setTaskQuantity(num);
        }
      } else if (strValue === "") {
        setTaskQuantity(0);
      }
    }
  }, []);

  // Handle position change for a user
  const handlePositionChange = useCallback((userId: string, newPosition: string) => {
    const eligibleCount = simulatedUsers.length;
    const averagePerUser = eligibleCount > 0 ? taskQuantity / eligibleCount : 0;

    setSimulatedUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      return {
        ...user,
        position: newPosition,
        bonusAmount: calculateBonusForPosition(newPosition, user.performanceLevel, averagePerUser),
      };
    }));
  }, [taskQuantity, simulatedUsers.length]);

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
    setHasUserModified(false);
  }, [originalTaskQuantity]);

  // Calculate totals
  const totalBonusAmount = useMemo(() => simulatedUsers.reduce((sum, user) => sum + user.bonusAmount, 0), [simulatedUsers]);
  const eligibleUserCount = simulatedUsers.length;
  const averageTasksPerUser = eligibleUserCount > 0 ? taskQuantity / eligibleUserCount : 0;
  const isTaskQuantityModified = taskQuantity !== originalTaskQuantity && originalTaskQuantity > 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTasks(), refetchUsers()]);
      setSimulatedUsers([]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTasks, refetchUsers]);

  const isLoading = tasksLoading || usersLoading;
  useScreenReady(!isLoading);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header card skeleton: period + inputs */}
          <View style={{ margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Skeleton style={{ height: 12, width: 100, borderRadius: 4 }} />
              <Skeleton style={{ height: 16, width: '70%', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 12, width: 50, borderRadius: 4 }} />
                <Skeleton style={{ height: 42, borderRadius: 8 }} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 12, width: 90, borderRadius: 4 }} />
                <Skeleton style={{ height: 42, borderRadius: 8 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 12, width: 50, borderRadius: 4 }} />
                <Skeleton style={{ height: 42, borderRadius: 8 }} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 12, width: 45, borderRadius: 4 }} />
                <Skeleton style={{ height: 42, borderRadius: 8 }} />
              </View>
            </View>
          </View>
          {/* Users list skeleton */}
          <View style={{ paddingHorizontal: 16, paddingTop: 0, gap: 12 }}>
            <Skeleton style={{ height: 22, width: 150, borderRadius: 4 }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton style={{ height: 18, width: '50%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 22, width: 80, borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton style={{ height: 11, width: 40, borderRadius: 4 }} />
                    <Skeleton style={{ height: 42, borderRadius: 8 }} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton style={{ height: 11, width: 70, borderRadius: 4 }} />
                    <Skeleton style={{ height: 42, borderRadius: 8 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
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

            {/* Current period task count info */}
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
            <ThemedText style={styles.sectionTitle}>Colaboradores ({simulatedUsers.length})</ThemedText>

            {simulatedUsers.map((user) => (
              <Card
                key={user.id}
                style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.userHeader}>
                  <ThemedText style={styles.userName}>{user.name}</ThemedText>
                  <ThemedText style={[styles.bonusAmount, { color: colors.success }]}>{formatCurrency(user.bonusAmount)}</ThemedText>
                </View>

                {/* Position and Performance in same row */}
                <View style={styles.userDetailsRow}>
                  {/* Position Combobox */}
                  <View style={styles.positionContainer}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Cargo</ThemedText>
                    <Combobox
                      options={POSITION_OPTIONS}
                      value={user.position}
                      onValueChange={(value) => {
                        if (value && typeof value === 'string') {
                          handlePositionChange(user.id, value);
                        }
                      }}
                      placeholder={user.position}
                      searchable={false}
                      clearable={false}
                    />
                  </View>

                  {/* Performance Level Selector (Numeric 0-5) */}
                  <View style={styles.performanceContainer}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Performance</ThemedText>
                    <View style={[styles.performanceLevelControl, { borderColor: colors.border, backgroundColor: colors.input }]}>
                      <TouchableOpacity
                        onPress={() => handlePerformanceLevelChange(user.id, -1)}
                        disabled={user.performanceLevel <= 0}
                        style={[styles.levelButton, { opacity: user.performanceLevel <= 0 ? 0.3 : 1, backgroundColor: colors.muted }]}
                      >
                        <IconChevronLeft size={18} color={colors.foreground} />
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
                        style={[styles.levelButton, { opacity: user.performanceLevel >= 5 ? 0.3 : 1, backgroundColor: colors.muted }]}
                      >
                        <IconChevronRight size={18} color={colors.foreground} />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  bonusAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  userDetailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  positionContainer: {
    flex: 1,
    gap: 4,
  },
  performanceContainer: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  performanceLevelControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  levelButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  levelValue: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
});
