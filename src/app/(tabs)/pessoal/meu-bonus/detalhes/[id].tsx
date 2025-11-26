import { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { bonusService } from "@/api-client";
import { bonusKeys, useTasks } from "@/hooks";
import { formatCurrency } from "@/utils";
import { TASK_STATUS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { TasksModal } from "@/components/bonus/TasksModal";
import type { Bonus, Task } from "@/types";

// Helper to get Portuguese month name
const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || '-';
};

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

// Format date as dd/mm/yy
function formatShortDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function BonusDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [selectedCommissionStatus, setSelectedCommissionStatus] = useState<string | null>(null);

  // Fetch bonus detail using personal endpoint
  const {
    data: bonusResponse,
    isLoading: bonusLoading,
    error,
    refetch: refetchBonus,
  } = useQuery({
    queryKey: [...bonusKeys.all, 'my-bonus-detail', id],
    queryFn: async () => {
      const response = await bonusService.getMyBonusDetail(id || '', {
        include: {
          user: {
            include: {
              position: true,
              sector: true,
            },
          },
          bonusDiscounts: true,
          users: true,
        } as any,
      });

      console.log('📊 Bonus Detail Response:', {
        hasUsers: !!(response.data as any)?.users,
        usersLength: (response.data as any)?.users?.length,
        eligibleUsersCount: (response.data as any)?.eligibleUsersCount,
        data: response.data,
      });

      return response.data;
    },
    enabled: !!id,
  });

  // Extract bonus from response
  let bonus: Bonus | null = null;
  if (bonusResponse) {
    if ('data' in bonusResponse && (bonusResponse as any).data) {
      bonus = (bonusResponse as any).data;
    } else {
      bonus = bonusResponse as Bonus;
    }
  }

  // Prepare date range for fetching tasks (based on bonus calculation period)
  const taskDateRange = useMemo(() => {
    if (!bonus?.calculationPeriodStart || !bonus?.calculationPeriodEnd) return null;

    const startDate = new Date(bonus.calculationPeriodStart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(bonus.calculationPeriodEnd);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }, [bonus?.calculationPeriodStart, bonus?.calculationPeriodEnd]);

  // Fetch tasks separately with proper relations (customer, sector, truck)
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    where: {
      status: { in: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED] },
      finishedAt: taskDateRange ? {
        gte: taskDateRange.startDate,
        lte: taskDateRange.endDate,
      } : undefined,
    },
    include: {
      customer: true,
      sector: true,
      truck: true,
    },
    limit: 1000,
    enabled: !!taskDateRange,
  });

  // Calculate commission statistics by task commission status
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
      total: 0,
      byStatus: statusCounts,
      hasDetails: false,
      tasks: [] as Task[],
    };
  }, [tasksData?.data]);

  // Get tasks filtered by commission status for modal
  const filteredTasksForModal = useMemo(() => {
    if (!commissionStats.tasks || !selectedCommissionStatus) return [];
    return commissionStats.tasks.filter((task: Task) => task.commission === selectedCommissionStatus);
  }, [commissionStats.tasks, selectedCommissionStatus]);

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

  const handleRefresh = async () => {
    await Promise.all([refetchBonus(), refetchTasks()]);
  };

  // Calculate final bonus amount (after discounts)
  const calculateFinalAmount = useCallback(() => {
    if (!bonus) return 0;

    if (!bonus.bonusDiscounts || bonus.bonusDiscounts.length === 0) {
      const baseBonus = typeof bonus.baseBonus === 'number'
        ? bonus.baseBonus
        : (bonus.baseBonus as any)?.toNumber?.() || 0;
      return baseBonus;
    }

    let finalAmount = typeof bonus.baseBonus === 'number'
      ? bonus.baseBonus
      : (bonus.baseBonus as any)?.toNumber?.() || 0;

    bonus.bonusDiscounts
      .sort((a: any, b: any) => a.calculationOrder - b.calculationOrder)
      .forEach((discount: any) => {
        if (discount.percentage) {
          finalAmount -= finalAmount * (discount.percentage / 100);
        } else if (discount.value) {
          finalAmount -= discount.value;
        }
      });

    return finalAmount;
  }, [bonus]);

  // Get eligible users count from various sources
  const eligibleUsersCount = useMemo(() => {
    // First try the users relation (if API returns it)
    if (bonus?.users && bonus.users.length > 0) {
      return bonus.users.length;
    }
    // Then try the stored eligibleUsersCount field
    if (bonus?.eligibleUsersCount && bonus.eligibleUsersCount > 0) {
      return bonus.eligibleUsersCount;
    }
    // Calculate from averageTasksPerUser if we have both values
    // Formula: eligibleUsers = totalPonderedTasks / averageTasksPerUser
    if (bonus?.ponderedTaskCount && bonus?.averageTasksPerUser) {
      const ponderedCount = typeof bonus.ponderedTaskCount === 'number'
        ? bonus.ponderedTaskCount
        : (bonus.ponderedTaskCount as any)?.toNumber?.() || 0;
      const avgTasks = typeof bonus.averageTasksPerUser === 'number'
        ? bonus.averageTasksPerUser
        : (bonus.averageTasksPerUser as any)?.toNumber?.() || 0;

      if (avgTasks > 0) {
        // The averageTasksPerUser is calculated as totalPonderedTasks / eligibleUsers
        // So we need to find it differently - check if we have access to total from API
        // For now, let's not calculate to avoid incorrect values
      }
    }
    // Fallback to '-'
    return null;
  }, [bonus?.users, bonus?.eligibleUsersCount, bonus?.ponderedTaskCount, bonus?.averageTasksPerUser]);

  const isLoading = bonusLoading || tasksLoading;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando detalhes...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !bonus) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="currency-dollar"
          title="Bônus não encontrado"
          description="Não foi possível carregar os detalhes do bônus"
        />
      </ThemedView>
    );
  }

  const bonusValue = calculateFinalAmount();
  const hasDiscounts = bonus.bonusDiscounts && bonus.bonusDiscounts.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Period Info Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.periodInfo}>
            <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>Período</ThemedText>
            <ThemedText style={styles.periodMonth}>{getMonthName(bonus.month)}/{bonus.year}</ThemedText>
            {bonus.calculationPeriodStart && bonus.calculationPeriodEnd && (
              <ThemedText style={[styles.periodDates, { color: colors.mutedForeground }]}>
                {formatShortDate(new Date(bonus.calculationPeriodStart))} - {formatShortDate(new Date(bonus.calculationPeriodEnd))}
              </ThemedText>
            )}
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
                  {formatBonusAmount(bonus.baseBonus)}
                </ThemedText>
              </View>
              {bonus.bonusDiscounts!.map((discount: any, index: number) => (
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
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Cargo:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.user?.position?.name || '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Setor:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.user?.sector?.name || '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Nível de Performance:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                Nível {bonus.performanceLevel || '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Tarefas Ponderadas:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus.ponderedTaskCount)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Colaboradores Elegíveis:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {eligibleUsersCount ?? '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Média por Colaborador:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus.averageTasksPerUser)}
              </ThemedText>
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
                {bonus.calculationPeriodStart
                  ? new Date(bonus.calculationPeriodStart).toLocaleDateString('pt-BR')
                  : '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Fim:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.calculationPeriodEnd
                  ? new Date(bonus.calculationPeriodEnd).toLocaleDateString('pt-BR')
                  : '-'}
              </ThemedText>
            </View>
          </View>
        </Card>
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
});
