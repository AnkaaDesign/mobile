import { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { bonusService } from "@/api-client";
import { bonusKeys, useScreenReady} from '@/hooks';
import { formatCurrency } from "@/utils";
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS, getBadgeVariant, SECTOR_PRIVILEGES } from "@/constants";
import { TasksModal } from "@/components/bonus/TasksModal";
import { Icon } from "@/components/ui/icon";
import { spacing, fontSize } from "@/constants/design-system";
import { PrivilegeGuard } from "@/components/privilege-guard";
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
function getBonusPeriodDates(year: number | string, month: number | string): { start: Date; end: Date } {
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  const monthNum = typeof month === 'string' ? parseInt(month, 10) : month;

  let startYear = yearNum;
  let startMonth = monthNum - 1;
  if (startMonth === 0) {
    startMonth = 12;
    startYear = yearNum - 1;
  }
  const start = new Date(startYear, startMonth - 1, 26);
  const end = new Date(yearNum, monthNum - 1, 25);

  return { start, end };
}

export default function BonusDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [selectedCommissionStatus, setSelectedCommissionStatus] = useState<string | null>(null);

  // Fetch bonus detail
  const {
    data: bonusResponse,
    isLoading,
    error,
    refetch: refetchBonus,
  } = useQuery({
    queryKey: [...bonusKeys.all, 'bonus-detail', id],
    queryFn: async () => {
      const response = await bonusService.getById(id || '', {
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

  useScreenReady(!isLoading);

  // Extract bonus from response
  let bonus: Bonus | null = null;
  if (bonusResponse) {
    let data = bonusResponse;

    if ('data' in data && (data as any).data) {
      data = (data as any).data;
    }

    if ('data' in data && (data as any).data && (data as any).success !== undefined) {
      data = (data as any).data;
    }

    bonus = data as Bonus;
  }

  // Calculate commission statistics from tasks attached to the bonus
  const commissionStats = useMemo(() => {
    const statusCounts = {
      [COMMISSION_STATUS.FULL_COMMISSION]: 0,
      [COMMISSION_STATUS.PARTIAL_COMMISSION]: 0,
      [COMMISSION_STATUS.NO_COMMISSION]: 0,
      [COMMISSION_STATUS.SUSPENDED_COMMISSION]: 0,
    };

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
        "Detalhamento Indisponivel",
        "O detalhamento das tarefas nao esta disponivel para este periodo."
      );
      return;
    }

    const count = commissionStats.byStatus[status as keyof typeof commissionStats.byStatus] || 0;
    if (count === 0) {
      Alert.alert(
        "Sem Tarefas",
        `Nao ha tarefas com status "${COMMISSION_STATUS_LABELS[status as keyof typeof COMMISSION_STATUS_LABELS]}" neste periodo.`
      );
      return;
    }

    setSelectedCommissionStatus(status);
    setTasksModalVisible(true);
  }, [commissionStats]);

  const handleRefresh = async () => {
    await refetchBonus();
  };

  // Helper to convert any value to number
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
    if (bonus?.users && bonus.users.length > 0) {
      return bonus.users.length;
    }
    if (bonus?.eligibleUsersCount && bonus.eligibleUsersCount > 0) {
      return bonus.eligibleUsersCount;
    }
    return null;
  }, [bonus?.users, bonus?.eligibleUsersCount]);

  if (isLoading) {
    return (
      <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]}>
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* User info card skeleton */}
            <View style={{ margin: spacing.md, marginBottom: 0, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: spacing.sm, alignItems: 'center' }}>
              <Skeleton style={{ height: 20, width: '60%', borderRadius: 4 }} />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
              </View>
            </View>
            {/* Period card skeleton */}
            <View style={{ margin: spacing.md, marginBottom: 0, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: spacing.sm, alignItems: 'center' }}>
              <Skeleton style={{ height: 12, width: 80, borderRadius: 4 }} />
              <Skeleton style={{ height: 28, width: 120, borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: 160, borderRadius: 4 }} />
            </View>
            {/* Bonus amount card skeleton */}
            <View style={{ margin: spacing.md, marginBottom: 0, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ height: 16, width: 120, borderRadius: 4 }} />
              </View>
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton style={{ height: 14, width: '40%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 14, width: '30%', borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton style={{ height: 14, width: '50%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 14, width: '25%', borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Skeleton style={{ height: 16, width: '35%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 16, width: '30%', borderRadius: 4 }} />
                </View>
              </View>
            </View>
            {/* Performance details card skeleton */}
            <View style={{ margin: spacing.md, marginBottom: 0, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ height: 16, width: 160, borderRadius: 4 }} />
              </View>
              <View style={{ gap: spacing.md }}>
                {[0.55, 0.4, 0.65, 0.5, 0.45].map((w, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton style={{ height: 14, width: `${Math.round(w * 100)}%` as any, borderRadius: 4 }} />
                    <Skeleton style={{ height: 14, width: 40, borderRadius: 4 }} />
                  </View>
                ))}
              </View>
            </View>
            {/* Commission card skeleton */}
            <View style={{ margin: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ height: 16, width: 140, borderRadius: 4 }} />
              </View>
              <View style={{ gap: spacing.md }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton style={{ height: 24, width: 120, borderRadius: 12 }} />
                    <Skeleton style={{ height: 24, width: 40, borderRadius: 12 }} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (error || !bonus) {
    return (
      <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]}>
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <EmptyState
            icon="currency-dollar"
            title="Bonus nao encontrado"
            description="Nao foi possivel carregar os detalhes do bonus"
          />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  const bonusValue = calculateFinalAmount();
  const hasExtras = bonus.bonusExtras && bonus.bonusExtras.length > 0;
  const hasDiscounts = bonus.bonusDiscounts && bonus.bonusDiscounts.length > 0;

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
        >
          {/* User Info Card */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>{bonus.user?.name || '-'}</ThemedText>
              <View style={styles.userDetails}>
                <ThemedText style={[styles.userDetail, { color: colors.mutedForeground }]}>
                  {bonus.user?.position?.name || '-'}
                </ThemedText>
                <ThemedText style={[styles.userDetailSeparator, { color: colors.mutedForeground }]}>•</ThemedText>
                <ThemedText style={[styles.userDetail, { color: colors.mutedForeground }]}>
                  {bonus.user?.sector?.name || '-'}
                </ThemedText>
              </View>
            </View>
          </Card>

          {/* Period Info Card */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.periodInfo}>
              <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>Periodo</ThemedText>
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
                <ThemedText style={styles.title}>Valor do Bonus</ThemedText>
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
                          ? `${percentageValue}%`
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
                          ? `${percentageValue}%`
                          : formatCurrency(toNumber(discount.value))}
                      </ThemedText>
                    </View>
                  );
                })}
                <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <ThemedText style={[styles.detailLabel, { color: colors.foreground, fontWeight: '600' }]}>
                    Valor Liquido:
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
                    Nivel de Performance:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    Nivel {bonus.performanceLevel || '-'}
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
                    Colaboradores Elegiveis:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {eligibleUsersCount ?? '-'}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Media por Colaborador:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {formatDecimal(bonus.averageTaskPerUser)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>

          {/* Commission Status Section */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="IconCheckbox" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Status das Comissoes</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              {commissionStats.hasDetails ? (
                <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                  Toque para ver as tarefas
                </ThemedText>
              ) : (
                <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground, fontStyle: 'italic' }]}>
                  Detalhamento nao disponivel para este periodo
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
  card: {
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    alignItems: "center",
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userDetail: {
    fontSize: 14,
  },
  userDetailSeparator: {
    fontSize: 14,
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
  sectionHint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
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
