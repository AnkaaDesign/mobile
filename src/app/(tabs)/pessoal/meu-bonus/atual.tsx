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
import { bonusKeys } from "@/hooks";
import { bonusService } from "@/api-client";
import { formatCurrency, getBonusPeriod } from "@/utils";
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { TasksModal } from "@/components/bonus/TasksModal";
import type { Task, Bonus } from "@/types";

// Month names in Portuguese
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Get the current bonus period for display.
 * The bonus period runs from 26th of previous month to 25th of current month.
 *
 * Period logic:
 * - Days 1-25: Current month period (may be in progress or closed)
 * - Days 26-31: Next month period starts
 */
function getCurrentBonusPeriod(referenceDate?: Date): {
  year: number;
  month: number;
  monthName: string;
  startDate: Date;
  endDate: Date;
} {
  const date = referenceDate || new Date();
  const day = date.getDate();
  let year = date.getFullYear();
  let month = date.getMonth() + 1; // 1-based month

  // If we're on day 26+, we're in the next month's period
  if (day >= 26) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const periodData = getBonusPeriod(year, month);

  return {
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    startDate: periodData.startDate,
    endDate: periodData.endDate,
  };
}

/**
 * Create a live bonus ID for fetching current period bonus.
 * Format: live-{userId}-{year}-{month}
 * The backend's findByIdOrLive will parse this and calculate the live bonus.
 */
function createLiveBonusId(userId: string, year: number, month: number): string {
  return `live-${userId}-${year}-${month}`;
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

// Helper to get numeric value from Decimal or number
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value?.toNumber) return value.toNumber();
  return 0;
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

  // Check if user's position is bonifiable
  const isBonifiable = currentUser?.position?.bonifiable ?? false;

  // Get current bonus period
  const currentPeriod = useMemo(() => getCurrentBonusPeriod(), []);

  // Create live bonus ID for fetching
  const liveBonusId = useMemo(() => {
    if (!currentUser?.id) return null;
    return createLiveBonusId(currentUser.id, currentPeriod.year, currentPeriod.month);
  }, [currentUser?.id, currentPeriod.year, currentPeriod.month]);

  // Fetch bonus using getById - backend handles both saved and live bonuses transparently
  const {
    data: bonusResponse,
    isLoading: bonusLoading,
    error: bonusError,
    refetch: refetchBonus,
  } = useQuery({
    queryKey: [...bonusKeys.all, 'current-bonus', liveBonusId],
    queryFn: async () => {
      if (!liveBonusId) throw new Error('No bonus ID');

      // Use personal endpoint - no admin privileges required
      const response = await bonusService.getMyBonusDetail(liveBonusId, {
        include: {
          user: {
            include: {
              position: true,
              sector: true,
            },
          },
          position: true,
          tasks: {
            include: {
              customer: true,
              sector: true,
            },
          },
          bonusDiscounts: true,
          users: true,
        },
      });

      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds - fresh calculation data
    refetchInterval: 60000, // Refresh every minute for live data
    enabled: !!liveBonusId,
    retry: false, // Don't retry on error (user may not be eligible)
  });

  // Extract bonus data from response
  const bonus = useMemo((): (Bonus & { tasks?: any[]; baseBonus?: number; bonusDiscounts?: any[]; position?: any; user?: any }) | null => {
    if (!bonusResponse) return null;

    // Handle wrapped response { success, data, message } or direct bonus object
    const response = bonusResponse as any;
    if ('data' in response && response.data) {
      return response.data;
    }
    // Direct bonus object
    if ('id' in response) {
      return response;
    }
    return null;
  }, [bonusResponse]);

  // Calculate commission statistics from tasks
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
      total: bonus?.weightedTasks ? Math.round(getNumericValue(bonus.weightedTasks)) : 0,
      byStatus: statusCounts,
      hasDetails: false,
      tasks: [] as Task[],
    };
  }, [bonus?.tasks, bonus?.weightedTasks]);

  // Get tasks filtered by commission status for modal
  const filteredTasksForModal = useMemo(() => {
    if (!commissionStats.tasks || !selectedCommissionStatus) return [];
    return commissionStats.tasks.filter((task: Task) => task.commission === selectedCommissionStatus);
  }, [commissionStats.tasks, selectedCommissionStatus]);

  // Calculate final bonus amount (after discounts)
  const calculateFinalAmount = useCallback(() => {
    if (!bonus) return 0;

    const baseBonus = getNumericValue(bonus.baseBonus);

    if (!bonus.bonusDiscounts || bonus.bonusDiscounts.length === 0) {
      return baseBonus;
    }

    let finalAmount = baseBonus;

    bonus.bonusDiscounts
      .sort((a: any, b: any) => (a.calculationOrder || 0) - (b.calculationOrder || 0))
      .forEach((discount: any) => {
        if (discount.percentage) {
          finalAmount -= finalAmount * (discount.percentage / 100);
        } else if (discount.value) {
          finalAmount -= getNumericValue(discount.value);
        }
      });

    return finalAmount;
  }, [bonus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchBonus(), refetchUser()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchBonus, refetchUser]);

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

  const isLoading = userLoading || bonusLoading;

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

  // If user's position is not bonifiable, show a message and redirect option
  if (!isBonifiable) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <EmptyState
          icon="currency-dollar"
          title="Acesso não permitido"
          description="Seu cargo não é elegível para bônus. Entre em contato com o RH se acredita que isso é um erro."
        />
      </ThemedView>
    );
  }

  // If no bonus data (user not eligible or error)
  if (!bonus || bonusError) {
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
            description="Você não é elegível para bônus neste período ou o cálculo ainda não está disponível."
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

  // Display bonus data (works the same for live or saved)
  const bonusValue = calculateFinalAmount();
  const hasDiscounts = bonus.bonusDiscounts && bonus.bonusDiscounts.length > 0;
  const position = bonus.position || bonus.user?.position;

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
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Valor Base:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatBonusAmount(bonus.baseBonus)}
              </ThemedText>
            </View>
            {hasDiscounts && bonus.bonusDiscounts!.map((discount: any, index: number) => (
              <View key={discount.id || index} style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.destructive }]}>
                  {discount.reference || `Desconto ${index + 1}`}:
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: colors.destructive }]}>
                  -{discount.percentage
                    ? `${discount.percentage}%`
                    : formatCurrency(getNumericValue(discount.value))}
                </ThemedText>
              </View>
            ))}
            <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.foreground, fontWeight: '600' }]}>
                Valor Líquido:
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.success, fontWeight: '600' }]}>
                {formatCurrency(bonusValue)}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Performance Details Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Detalhes de Performance</ThemedText>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Cargo:</ThemedText>
              <ThemedText style={styles.detailValue}>{position?.name || currentUser.position?.name || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Setor:</ThemedText>
              <ThemedText style={styles.detailValue}>{bonus.user?.sector?.name || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Nível de Performance:</ThemedText>
              <ThemedText style={styles.detailValue}>Nível {bonus.performanceLevel || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Tarefas Ponderadas:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDecimal(bonus.weightedTasks)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Colaboradores Elegíveis:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.users?.length ?? '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>Média por Colaborador:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDecimal(bonus.averageTaskPerUser)}</ThemedText>
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
