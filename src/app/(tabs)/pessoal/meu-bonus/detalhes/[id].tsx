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
import { bonusKeys, useCurrentUser, useScreenReady} from '@/hooks';
import { formatCurrency, formatPercentage } from "@/utils";
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { TasksModal } from "@/components/bonus/TasksModal";
import { Icon } from "@/components/ui/icon";
import { spacing, fontSize } from "@/constants/design-system";
import type { Bonus, Task } from "@/types";


import { Skeleton } from "@/components/ui/skeleton";// Helper to get Portuguese month name
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

// Helper to get numeric value from Decimal or number
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value?.toNumber) return value.toNumber();
  return 0;
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

// Calculate bonus period dates from year and month
// Period is always from 26th of previous month to 25th of the bonus month
function getBonusPeriodDates(year: number | string, month: number | string): { start: Date; end: Date } {
  // Convert to numbers in case they come as strings from API
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  const monthNum = typeof month === 'string' ? parseInt(month, 10) : month;

  // Start: 26th of previous month
  let startYear = yearNum;
  let startMonth = monthNum - 1; // Previous month
  if (startMonth === 0) {
    startMonth = 12;
    startYear = yearNum - 1;
  }
  const start = new Date(startYear, startMonth - 1, 26); // month is 0-indexed in JS

  // End: 25th of the bonus month
  const end = new Date(yearNum, monthNum - 1, 25); // month is 0-indexed in JS

  return { start, end };
}

export default function BonusDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [selectedCommissionStatus, setSelectedCommissionStatus] = useState<string | null>(null);

  // Get current user to check bonifiable status
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const isBonifiable = currentUser?.position?.bonifiable ?? false;

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
          tasks: {
            include: {
              customer: true,
              sector: true,
            },
          },
          bonusDiscounts: true, bonusExtras: true,
          users: true,
        } as any,
      });

      return response.data;
    },
    enabled: !!id,
  });

  // Extract bonus from response - handle multiple levels of wrapping
  let bonus: Bonus | null = null;
  if (bonusResponse) {
    // Response structure: { success, data: { actualBonus }, message }
    // OR direct bonus object
    let data = bonusResponse;

    // Unwrap { success, data, message } wrapper
    if ('data' in data && (data as any).data) {
      data = (data as any).data;
    }

    // Check if still wrapped (edge case)
    if ('data' in data && (data as any).data && (data as any).success !== undefined) {
      data = (data as any).data;
    }

    bonus = data as Bonus;
  }

  // Calculate commission statistics from tasks attached to the bonus
  // The API returns tasks with the bonus response
  const commissionStats = useMemo(() => {
    const statusCounts = {
      [COMMISSION_STATUS.FULL_COMMISSION]: 0,
      [COMMISSION_STATUS.PARTIAL_COMMISSION]: 0,
      [COMMISSION_STATUS.NO_COMMISSION]: 0,
      [COMMISSION_STATUS.SUSPENDED_COMMISSION]: 0,
    };

    // Use tasks from the bonus response (not a separate query)
    const tasks = bonus?.tasks || [];

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
  }, [bonus?.tasks]);

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
    await refetchBonus();
  };

  // Helper to convert any value to number (handles strings, Decimals, etc)
  const toNumber = useCallback((value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (value?.toNumber) return value.toNumber();
    return 0;
  }, []);

  // Get final bonus amount (after discounts)
  // IMPORTANT: Use netBonus from API as the single source of truth
  // The API now correctly calculates netBonus = baseBonus - all discounts
  const calculateFinalAmount = useCallback(() => {
    if (!bonus) return 0;

    // Primary: Use netBonus directly from API (single source of truth)
    // Check raw value before conversion since toNumber returns 0 for null/undefined
    if ((bonus as any).netBonus !== null && (bonus as any).netBonus !== undefined) {
      return toNumber((bonus as any).netBonus);
    }

    // Fallback: If netBonus is not available, use baseBonus
    return toNumber(bonus.baseBonus);
  }, [bonus, toNumber]);

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
    // Calculate from averageTaskPerUser if we have both values
    // Formula: eligibleUsers = totalWeightedTasks / averageTaskPerUser
    if (bonus?.weightedTasks && bonus?.averageTaskPerUser) {
      const avgTasks = getNumericValue(bonus.averageTaskPerUser);
      if (avgTasks > 0) {
        // The averageTaskPerUser is calculated as totalWeightedTasks / eligibleUsers
        // So we need to find it differently - check if we have access to total from API
        // For now, let's not calculate to avoid incorrect values
      }
    }
    // Fallback to '-'
    return null;
  }, [bonus?.users, bonus?.eligibleUsersCount, bonus?.weightedTasks, bonus?.averageTaskPerUser]);

  const isLoading = bonusLoading || userLoading;

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} scrollEnabled={false}>
          {/* Period Info Card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, alignItems: 'center', gap: 8 }]}>
            <Skeleton style={{ height: 12, width: '25%', borderRadius: 4 }} />
            <Skeleton style={{ height: 28, width: '40%', borderRadius: 4 }} />
            <Skeleton style={{ height: 12, width: '50%', borderRadius: 4 }} />
          </View>

          {/* Bonus Amount Card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, gap: 12 }]}>
            <Skeleton style={{ height: 18, width: '40%', borderRadius: 4 }} />
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 14, width: '35%', borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: '25%', borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 14, width: '40%', borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: '30%', borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 14, width: '30%', borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: '28%', borderRadius: 4 }} />
              </View>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 14, width: '32%', borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: '30%', borderRadius: 4 }} />
              </View>
            </View>
          </View>

          {/* Performance Details Card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, gap: 12 }]}>
            <Skeleton style={{ height: 18, width: '50%', borderRadius: 4 }} />
            <View style={{ gap: 10 }}>
              {[['30%', '25%'], ['20%', '30%'], ['45%', '20%'], ['38%', '15%'], ['42%', '18%'], ['50%', '20%'], ['48%', '18%']].map(([l, r], i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width={l} height={14} borderRadius={4} />
                  <Skeleton width={r} height={14} borderRadius={4} />
                </View>
              ))}
            </View>
          </View>

          {/* Commission Status Card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, gap: 12 }]}>
            <Skeleton style={{ height: 18, width: '45%', borderRadius: 4 }} />
            <View style={{ gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton style={{ height: 24, width: '50%', borderRadius: 12 }} />
                  <Skeleton style={{ height: 24, width: '15%', borderRadius: 12 }} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // If user's position is not bonifiable, show a message
  if (!isBonifiable) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="currency-dollar"
          title="Acesso não permitido"
          description="Seu cargo não é elegível para bônus. Entre em contato com o RH se acredita que isso é um erro."
        />
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
  const hasExtras = bonus.bonusExtras && bonus.bonusExtras.length > 0;
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
            <ThemedText style={[styles.periodDates, { color: colors.mutedForeground }]}>
              {formatShortDate(getBonusPeriodDates(bonus.year, bonus.month).start)} - {formatShortDate(getBonusPeriodDates(bonus.year, bonus.month).end)}
            </ThemedText>
          </View>
        </Card>

        {/* Bonus Amount Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Icon name="IconCurrencyDollar" size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Valor do Bônus</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Valor Base:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatBonusAmount(bonus.baseBonus)}
                </ThemedText>
              </View>
              {hasExtras && bonus.bonusExtras!.map((extra: any, index: number) => {
                const percentageValue = toNumber(extra.percentage);
                const hasPercentage = percentageValue > 0;
                return (
                  <View key={extra.id || `extra-${index}`} style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: '#059669' }]}>
                      {extra.reference || `Extra ${index + 1}`}:
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: '#059669' }]}>
                      +{hasPercentage
                        ? formatPercentage(percentageValue, 2)
                        : formatCurrency(toNumber(extra.value))}
                    </ThemedText>
                  </View>
                );
              })}
              {hasDiscounts && bonus.bonusDiscounts!.map((discount: any, index: number) => {
                const percentageValue = toNumber(discount.percentage);
                const hasPercentage = percentageValue > 0;
                return (
                  <View key={discount.id || index} style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: colors.destructive }]}>
                      {discount.reference || `Desconto ${index + 1}`}:
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.destructive }]}>
                      -{hasPercentage
                        ? formatPercentage(percentageValue, 2)
                        : formatCurrency(toNumber(discount.value))}
                    </ThemedText>
                  </View>
                );
              })}
              <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
                <ThemedText style={[styles.detailLabel, { color: colors.foreground, fontWeight: '600' }]}>
                  Valor Líquido:
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: colors.success, fontWeight: '600' }]}>
                  {formatCurrency(bonusValue)}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {/* Performance Details Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Icon name="IconChartLine" size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Detalhes de Performance</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
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
                Total de Tarefas:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.tasks?.length || '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Tarefas Ponderadas:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus.weightedTasks)}
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
                {formatDecimal(bonus.averageTaskPerUser)}
              </ThemedText>
            </View>
            </View>
          </View>
        </Card>

        {/* Commission Status Section - Clickable badges */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Icon name="IconCheckbox" size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Status das Comissões</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
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
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
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
