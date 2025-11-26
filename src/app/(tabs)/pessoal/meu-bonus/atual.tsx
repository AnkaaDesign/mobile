import { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { IconCalculator, IconHistory } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ThemedView, ThemedText, EmptyState } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useAuth";
import { bonusKeys, useTasks } from "@/hooks";
import { bonusService } from "@/api-client";
import { formatCurrency, getBonusPeriod } from "@/utils";
import { TASK_STATUS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { TasksModal } from "@/components/bonus/TasksModal";
import type { Bonus, Task } from "@/types";

// Month names in Portuguese
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Get the current bonus period for display, considering the payment window.
 * - From day 6 to day 25: Show current month period (LIVE - in progress)
 * - From day 26 to day 5 of next month: Show previous month period (CLOSED - saved)
 */
function getCurrentBonusPeriodForDisplay(referenceDate?: Date): {
  year: number;
  month: number;
  monthName: string;
  startDate: Date;
  endDate: Date;
  isPeriodClosed: boolean;
} {
  const date = referenceDate || new Date();
  const day = date.getDate();
  let year = date.getFullYear();
  let month = date.getMonth() + 1; // 1-based month
  let isPeriodClosed = false;

  if (day >= 26) {
    // Day 26+: Period just closed, show current month (closed)
    isPeriodClosed = true;
  } else if (day <= 5) {
    // Days 1-5: Still showing previous month (closed, awaiting payment)
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    isPeriodClosed = true;
  }
  // Days 6-25: Period is open/in progress

  const periodData = getBonusPeriod(year, month);

  return {
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    startDate: periodData.startDate,
    endDate: periodData.endDate,
    isPeriodClosed,
  };
}

// Format date as dd/mm/yy
function formatShortDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// Helper to format decimal values
const formatDecimal = (value: any): string => {
  if (value === null || value === undefined) return '0.00';
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'string') return parseFloat(value).toFixed(2);
  if (value?.toNumber) return value.toNumber().toFixed(2);
  return '0.00';
};

// Helper to format bonus amount
const formatBonusAmount = (amount: any): string => {
  if (amount === null || amount === undefined) return formatCurrency(0);
  if (typeof amount === 'number') return formatCurrency(amount);
  if (typeof amount === 'string') return formatCurrency(parseFloat(amount) || 0);
  if (amount?.toNumber) return formatCurrency(amount.toNumber());
  return formatCurrency(0);
};

export default function CurrentBonusScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [selectedCommissionStatus, setSelectedCommissionStatus] = useState<string | null>(null);

  // Get current user
  const { data: currentUser, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();

  // Get current bonus period with payment window logic
  const currentPeriod = useMemo(() => getCurrentBonusPeriodForDisplay(), []);

  // Fetch saved bonus for the current display period
  const {
    data: savedBonusResponse,
    isLoading: savedBonusLoading,
    refetch: refetchSavedBonus,
  } = useQuery({
    queryKey: [...bonusKeys.all, 'my-current-period-bonus', currentPeriod.year, currentPeriod.month],
    queryFn: async () => {
      const response = await bonusService.getMyBonuses({
        where: {
          year: currentPeriod.year,
          month: currentPeriod.month,
        },
        include: {
          user: {
            include: {
              position: true,
              sector: true,
            },
          },
          users: true,
          bonusDiscounts: true,
          tasks: true,
        },
        take: 1,
      });
      return response.data;
    },
    enabled: !!currentUser?.id,
  });

  // Extract saved bonus from response
  const savedBonus: Bonus | null = useMemo(() => {
    if (!savedBonusResponse?.data || savedBonusResponse.data.length === 0) return null;
    return savedBonusResponse.data[0];
  }, [savedBonusResponse]);

  // Determine if we have a saved bonus to display
  const hasSavedBonus = !!savedBonus;

  // Prepare date range for fetching tasks (based on bonus calculation period or current period)
  const taskDateRange = useMemo(() => {
    // Use bonus calculation period if available
    if (savedBonus?.calculationPeriodStart && savedBonus?.calculationPeriodEnd) {
      const startDate = new Date(savedBonus.calculationPeriodStart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(savedBonus.calculationPeriodEnd);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
    // Fallback to current period dates
    const startDate = new Date(currentPeriod.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(currentPeriod.endDate);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }, [savedBonus?.calculationPeriodStart, savedBonus?.calculationPeriodEnd, currentPeriod]);

  // Fetch tasks separately with proper relations (customer, sector, truck)
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    where: {
      status: { in: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED] },
      finishedAt: {
        gte: taskDateRange.startDate,
        lte: taskDateRange.endDate,
      },
    },
    include: {
      customer: true,
      sector: true,
      truck: true,
    },
    limit: 1000,
    enabled: hasSavedBonus,
  });

  // Calculate commission statistics from separately fetched tasks
  const commissionStats = useMemo(() => {
    const statusCounts = {
      [COMMISSION_STATUS.FULL_COMMISSION]: 0,
      [COMMISSION_STATUS.PARTIAL_COMMISSION]: 0,
      [COMMISSION_STATUS.NO_COMMISSION]: 0,
      [COMMISSION_STATUS.SUSPENDED_COMMISSION]: 0,
    };

    const tasks = tasksData?.data || [];

    if (tasks.length > 0) {
      tasks.forEach((task: Task) => {
        const commissionStatus = task.commission || COMMISSION_STATUS.NO_COMMISSION;
        if (statusCounts.hasOwnProperty(commissionStatus)) {
          statusCounts[commissionStatus as keyof typeof statusCounts]++;
        }
      });

      return {
        total: tasks.length,
        byStatus: statusCounts,
        hasDetails: true,
        tasks: tasks,
      };
    }

    return {
      total: savedBonus?.ponderedTaskCount ? Math.round(Number(savedBonus.ponderedTaskCount)) : 0,
      byStatus: statusCounts,
      hasDetails: false,
      tasks: [] as Task[],
    };
  }, [tasksData?.data, savedBonus?.ponderedTaskCount]);

  // Get tasks filtered by commission status for modal
  const filteredTasksForModal = useMemo(() => {
    if (!commissionStats.tasks || !selectedCommissionStatus) return [];
    return commissionStats.tasks.filter((task: Task) => task.commission === selectedCommissionStatus);
  }, [commissionStats.tasks, selectedCommissionStatus]);

  // Calculate final bonus amount (after discounts)
  const calculateFinalAmount = useCallback(() => {
    if (!savedBonus) return 0;

    if (!savedBonus.bonusDiscounts || savedBonus.bonusDiscounts.length === 0) {
      const baseBonus = typeof savedBonus.baseBonus === 'number'
        ? savedBonus.baseBonus
        : (savedBonus.baseBonus as any)?.toNumber?.() || 0;
      return baseBonus;
    }

    let finalAmount = typeof savedBonus.baseBonus === 'number'
      ? savedBonus.baseBonus
      : (savedBonus.baseBonus as any)?.toNumber?.() || 0;

    savedBonus.bonusDiscounts
      .sort((a: any, b: any) => a.calculationOrder - b.calculationOrder)
      .forEach((discount: any) => {
        if (discount.percentage) {
          finalAmount -= finalAmount * (discount.percentage / 100);
        } else if (discount.value) {
          finalAmount -= discount.value;
        }
      });

    return finalAmount;
  }, [savedBonus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSavedBonus(), refetchUser(), refetchTasks()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSavedBonus, refetchUser, refetchTasks]);

  const handleCommissionStatusPress = useCallback((status: string) => {
    if (!commissionStats.hasDetails) {
      Alert.alert(
        "Detalhamento Indisponível",
        "O detalhamento das tarefas não está disponível para este período."
      );
      return;
    }

    const count = commissionStats.byStatus[status as keyof typeof commissionStats.byStatus] || 0;
    if (count === 0) {
      Alert.alert(
        "Sem Tarefas",
        `Não há tarefas com status "${COMMISSION_STATUS_LABELS[status as keyof typeof COMMISSION_STATUS_LABELS]}" neste período.`
      );
      return;
    }

    setSelectedCommissionStatus(status);
    setTasksModalVisible(true);
  }, [commissionStats]);

  const isLoading = userLoading || savedBonusLoading || (hasSavedBonus && tasksLoading);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando bônus...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!currentUser) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="user" title="Colaborador não encontrado" description="Não foi possível carregar seus dados" />
      </ThemedView>
    );
  }

  // If no saved bonus found for this period
  if (!hasSavedBonus) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
          {/* Period Info Card */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.periodInfo}>
              <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>Período</ThemedText>
              <ThemedText style={styles.periodMonth}>{currentPeriod.monthName}/{currentPeriod.year}</ThemedText>
              <ThemedText style={[styles.periodDates, { color: colors.mutedForeground }]}>
                {formatShortDate(currentPeriod.startDate)} - {formatShortDate(currentPeriod.endDate)}
              </ThemedText>
            </View>
          </Card>

          <EmptyState
            icon="currency-dollar"
            title="Bônus não disponível"
            description={currentPeriod.isPeriodClosed
              ? "O bônus para este período ainda não foi calculado."
              : "O período atual ainda está em andamento. O bônus será calculado após o fechamento."
            }
          />

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/pessoal/meu-bonus/simulacao' as any)}
            >
              <IconCalculator size={24} color={colors.primary} />
              <ThemedText style={[styles.navButtonText, { color: colors.foreground }]}>
                Simulação
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/pessoal/meu-bonus/historico' as any)}
            >
              <IconHistory size={24} color={colors.primary} />
              <ThemedText style={[styles.navButtonText, { color: colors.foreground }]}>
                Histórico
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Display saved bonus
  const bonusValue = calculateFinalAmount();
  const hasDiscounts = savedBonus.bonusDiscounts && savedBonus.bonusDiscounts.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
        {/* Period Info Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.periodInfo}>
            <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>Período</ThemedText>
            <ThemedText style={styles.periodMonth}>{currentPeriod.monthName}/{currentPeriod.year}</ThemedText>
            <ThemedText style={[styles.periodDates, { color: colors.mutedForeground }]}>
              {formatShortDate(currentPeriod.startDate)} - {formatShortDate(currentPeriod.endDate)}
            </ThemedText>
          </View>
        </Card>

        {/* Bonus Amount Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Valor do Bônus</ThemedText>
          <ThemedText style={[styles.bonusAmount, { color: colors.success }]}>
            {formatCurrency(bonusValue)}
          </ThemedText>

          {hasDiscounts && (
            <View style={[styles.discountInfo, { borderTopColor: colors.border }]}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Valor Base:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatBonusAmount(savedBonus.baseBonus)}
                </ThemedText>
              </View>
              {savedBonus.bonusDiscounts!.map((discount: any, index: number) => (
                <View key={discount.id} style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: colors.destructive }]}>
                    Desconto {index + 1} ({discount.reference}):
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.destructive }]}>
                    {discount.percentage
                      ? `${discount.percentage}%`
                      : formatCurrency(discount.value || 0)}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Performance Details Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Detalhes de Performance</ThemedText>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Cargo:</ThemedText>
              <ThemedText style={styles.detailValue}>{savedBonus.user?.position?.name || currentUser.position?.name || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Setor:</ThemedText>
              <ThemedText style={styles.detailValue}>{savedBonus.user?.sector?.name || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Nível de Performance:</ThemedText>
              <ThemedText style={styles.detailValue}>Nível {savedBonus.performanceLevel || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Tarefas Ponderadas:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDecimal(savedBonus.ponderedTaskCount)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Colaboradores Elegíveis:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {savedBonus.users?.length ?? savedBonus.eligibleUsersCount ?? '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Média por Colaborador:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDecimal(savedBonus.averageTasksPerUser)}</ThemedText>
            </View>
          </View>
        </Card>

        {/* Commission Status Section - Clickable badges */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Status das Comissões</ThemedText>
          {commissionStats.hasDetails ? (
            <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Toque para ver as tarefas
            </ThemedText>
          ) : (
            <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground, fontStyle: 'italic' }]}>
              Detalhamento não disponível para este período
            </ThemedText>
          )}
          <View style={styles.commissionList}>
            <TouchableOpacity
              style={styles.commissionRow}
              onPress={() => handleCommissionStatusPress(COMMISSION_STATUS.FULL_COMMISSION)}
              disabled={!commissionStats.hasDetails}
            >
              <Badge variant={getBadgeVariant(COMMISSION_STATUS.FULL_COMMISSION, 'COMMISSION_STATUS')} size="sm">
                {COMMISSION_STATUS_LABELS[COMMISSION_STATUS.FULL_COMMISSION]}
              </Badge>
              <Badge variant="default" size="sm">
                {commissionStats.byStatus[COMMISSION_STATUS.FULL_COMMISSION]}
              </Badge>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commissionRow}
              onPress={() => handleCommissionStatusPress(COMMISSION_STATUS.PARTIAL_COMMISSION)}
              disabled={!commissionStats.hasDetails}
            >
              <Badge variant={getBadgeVariant(COMMISSION_STATUS.PARTIAL_COMMISSION, 'COMMISSION_STATUS')} size="sm">
                {COMMISSION_STATUS_LABELS[COMMISSION_STATUS.PARTIAL_COMMISSION]}
              </Badge>
              <Badge variant="default" size="sm">
                {commissionStats.byStatus[COMMISSION_STATUS.PARTIAL_COMMISSION]}
              </Badge>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commissionRow}
              onPress={() => handleCommissionStatusPress(COMMISSION_STATUS.NO_COMMISSION)}
              disabled={!commissionStats.hasDetails}
            >
              <Badge variant={getBadgeVariant(COMMISSION_STATUS.NO_COMMISSION, 'COMMISSION_STATUS')} size="sm">
                {COMMISSION_STATUS_LABELS[COMMISSION_STATUS.NO_COMMISSION]}
              </Badge>
              <Badge variant="default" size="sm">
                {commissionStats.byStatus[COMMISSION_STATUS.NO_COMMISSION]}
              </Badge>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commissionRow}
              onPress={() => handleCommissionStatusPress(COMMISSION_STATUS.SUSPENDED_COMMISSION)}
              disabled={!commissionStats.hasDetails}
            >
              <Badge variant={getBadgeVariant(COMMISSION_STATUS.SUSPENDED_COMMISSION, 'COMMISSION_STATUS')} size="sm">
                {COMMISSION_STATUS_LABELS[COMMISSION_STATUS.SUSPENDED_COMMISSION]}
              </Badge>
              <Badge variant="default" size="sm">
                {commissionStats.byStatus[COMMISSION_STATUS.SUSPENDED_COMMISSION]}
              </Badge>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Calculation Period Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Período de Cálculo</ThemedText>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Início:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {savedBonus.calculationPeriodStart
                  ? new Date(savedBonus.calculationPeriodStart).toLocaleDateString('pt-BR')
                  : currentPeriod.startDate.toLocaleDateString('pt-BR')}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Fim:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {savedBonus.calculationPeriodEnd
                  ? new Date(savedBonus.calculationPeriodEnd).toLocaleDateString('pt-BR')
                  : currentPeriod.endDate.toLocaleDateString('pt-BR')}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Navigation Buttons - Side by side */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/pessoal/meu-bonus/simulacao' as any)}
          >
            <IconCalculator size={24} color={colors.primary} />
            <ThemedText style={[styles.navButtonText, { color: colors.foreground }]}>
              Simulação
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/pessoal/meu-bonus/historico' as any)}
          >
            <IconHistory size={24} color={colors.primary} />
            <ThemedText style={[styles.navButtonText, { color: colors.foreground }]}>
              Histórico
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Tasks Modal */}
      <TasksModal
        visible={tasksModalVisible}
        onClose={() => {
          setTasksModalVisible(false);
          setSelectedCommissionStatus(null);
        }}
        tasks={filteredTasksForModal}
        title={selectedCommissionStatus ? COMMISSION_STATUS_LABELS[selectedCommissionStatus as keyof typeof COMMISSION_STATUS_LABELS] || 'Tarefas' : 'Tarefas'}
      />
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
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodInfo: {
    alignItems: "center",
    gap: 4,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodMonth: {
    fontSize: 24,
    fontWeight: "700",
  },
  periodDates: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  bonusAmount: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
  },
  discountInfo: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  commissionList: {
    gap: 12,
  },
  commissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navigationButtons: {
    flexDirection: "row",
    margin: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
