import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, EmptyState } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { bonusService } from "@/api-client";
import { bonusKeys } from "@/hooks";
import { formatCurrency } from "@/utils";
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS, getBadgeVariant } from "@/constants";

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

export default function BonusDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch bonus detail using personal endpoint
  const {
    data: bonusResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...bonusKeys.all, 'my-bonus-detail', id],
    queryFn: async () => {
      console.log('🔍 [Detail QueryFn] Fetching bonus with id:', id);

      // Use the personal detail endpoint
      const response = await bonusService.getMyBonusDetail(id || '', {
        include: {
          user: {
            include: {
              position: true,
              sector: true,
            },
          },
          bonusDiscounts: true,
          tasks: true, // Tasks include commission field by default
        } as any, // Type assertion to allow nested include
      });

      console.log('🔍 [Detail QueryFn] Raw axios response:', {
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response.data) : [],
        fullData: response?.data,
      });

      return response.data;
    },
    enabled: !!id,
  });

  console.log('🔍 [Detail] bonusResponse from useQuery:', {
    hasResponse: !!bonusResponse,
    responseType: typeof bonusResponse,
    responseKeys: bonusResponse ? Object.keys(bonusResponse) : [],
    hasDataProperty: bonusResponse ? 'data' in bonusResponse : false,
    fullResponse: JSON.stringify(bonusResponse, null, 2),
  });

  // Extract bonus from response - handle both { data: Bonus } and Bonus directly
  let bonus = null;
  if (bonusResponse) {
    // Check if response has a 'data' property (wrapped response)
    if ('data' in bonusResponse && bonusResponse.data) {
      console.log('🔍 [Detail] Response is wrapped, extracting bonus from .data property');
      bonus = bonusResponse.data;
    } else {
      console.log('🔍 [Detail] Response is not wrapped, using directly');
      bonus = bonusResponse;
    }
  }

  console.log('🔍 [Detail] Extracted bonus object:', {
    hasBonus: !!bonus,
    bonusType: typeof bonus,
    bonusKeys: bonus ? Object.keys(bonus) : [],
    baseBonus: bonus?.baseBonus,
    baseBonusType: typeof bonus?.baseBonus,
    year: bonus?.year,
    month: bonus?.month,
    userId: bonus?.userId,
    performanceLevel: bonus?.performanceLevel,
    hasUser: !!bonus?.user,
    userName: bonus?.user?.name,
    userKeys: bonus?.user ? Object.keys(bonus.user) : [],
    hasPosition: !!bonus?.user?.position,
    positionName: bonus?.user?.position?.name,
    sectorName: bonus?.user?.sector?.name,
    discountsCount: bonus?.bonusDiscounts?.length || 0,
    tasksCount: bonus?.tasks?.length || 0,
    firstTaskKeys: bonus?.tasks?.[0] ? Object.keys(bonus.tasks[0]) : [],
    firstTaskCommission: bonus?.tasks?.[0]?.commission,
    sampleTasks: bonus?.tasks?.slice(0, 3).map(t => ({
      id: t.id,
      commission: t.commission,
      name: t.name
    })),
  });

  // Calculate commission statistics by task commission status
  const commissionStats = useMemo(() => {
    // If we have actual tasks with commission data, calculate from them
    if (bonus?.tasks && bonus.tasks.length > 0) {
      const statusCounts = {
        [COMMISSION_STATUS.FULL_COMMISSION]: 0,
        [COMMISSION_STATUS.PARTIAL_COMMISSION]: 0,
        [COMMISSION_STATUS.NO_COMMISSION]: 0,
        [COMMISSION_STATUS.SUSPENDED_COMMISSION]: 0,
      };

      bonus.tasks.forEach(task => {
        const commissionStatus = task.commission || COMMISSION_STATUS.NO_COMMISSION;
        if (statusCounts.hasOwnProperty(commissionStatus)) {
          statusCounts[commissionStatus]++;
        }
      });

      return {
        total: bonus.tasks.length,
        byStatus: statusCounts,
        hasDetails: true,
      };
    }

    // Fallback: If tasks couldn't be loaded but we have pondered task count
    // Show at least the total count from the bonus calculation
    if (bonus?.ponderedTaskCount && bonus.ponderedTaskCount > 0) {
      console.log('🔍 [Detail] Using fallback - showing pondered task count without breakdown');
      return {
        total: Math.round(bonus.ponderedTaskCount),
        byStatus: {
          [COMMISSION_STATUS.FULL_COMMISSION]: 0,
          [COMMISSION_STATUS.PARTIAL_COMMISSION]: 0,
          [COMMISSION_STATUS.NO_COMMISSION]: 0,
          [COMMISSION_STATUS.SUSPENDED_COMMISSION]: 0,
        },
        hasDetails: false, // Flag to show we don't have breakdown
      };
    }

    return null;
  }, [bonus?.tasks, bonus?.ponderedTaskCount]);

  console.log('🔍 [Detail] Commission stats:', commissionStats);

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando bônus...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !bonus) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alertCircle"
          title="Erro ao carregar bônus"
          description={error?.message || "Não foi possível carregar os detalhes do bônus"}
        />
        <View style={styles.retryButtonContainer}>
          <Button onPress={handleRefresh} variant="outline">
            Tentar Novamente
          </Button>
        </View>
      </ThemedView>
    );
  }

  // Calculate final bonus amount (after discounts)
  const calculateFinalAmount = () => {
    if (!bonus.bonusDiscounts || bonus.bonusDiscounts.length === 0) {
      return formatBonusAmount(bonus.baseBonus);
    }

    let finalAmount = typeof bonus.baseBonus === 'number'
      ? bonus.baseBonus
      : bonus.baseBonus?.toNumber?.() || 0;

    // Apply discounts in order
    bonus.bonusDiscounts
      .sort((a, b) => a.calculationOrder - b.calculationOrder)
      .forEach((discount) => {
        if (discount.percentage) {
          finalAmount -= finalAmount * (discount.percentage / 100);
        } else if (discount.value) {
          finalAmount -= discount.value;
        }
      });

    return formatCurrency(finalAmount);
  };

  const periodLabel = `${getMonthName(bonus.month)}/${bonus.year}`;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Period Header Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.periodInfo}>
            <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
              Período
            </ThemedText>
            <ThemedText style={styles.periodValue}>{periodLabel}</ThemedText>
          </View>
        </Card>

        {/* Bonus Amount Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Valor do Bônus</ThemedText>
          <ThemedText style={[styles.bonusAmount, { color: colors.success }]}>
            {calculateFinalAmount()}
          </ThemedText>

          {bonus.bonusDiscounts && bonus.bonusDiscounts.length > 0 && (
            <View style={styles.discountInfo}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Valor Base:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatBonusAmount(bonus.baseBonus)}
                </ThemedText>
              </View>
              {bonus.bonusDiscounts.map((discount, index) => (
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
                {bonus?.user?.position?.name || "-"}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Setor:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus?.user?.sector?.name || "-"}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Nível de Performance:
              </ThemedText>
              <Badge variant="primary" size="sm">
                {`Nível ${bonus?.performanceLevel || '-'}`}
              </Badge>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Tarefas Ponderadas:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus?.ponderedTaskCount)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Média por Usuário:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus?.averageTasksPerUser)}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Commissions Card */}
        {commissionStats && (
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.sectionTitle}>Status das Tarefas</ThemedText>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Total de Tarefas Ponderadas:
                </ThemedText>
                <Badge variant="default" size="sm">
                  {commissionStats.total}
                </Badge>
              </View>

              {!commissionStats.hasDetails && (
                <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground, fontSize: 12, fontStyle: 'italic', marginTop: 8 }]}>
                  Detalhamento por status de comissão não disponível para este período
                </ThemedText>
              )}

              {commissionStats.hasDetails && commissionStats.byStatus[COMMISSION_STATUS.SUSPENDED_COMMISSION] > 0 && (
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Comissão Suspensa:
                  </ThemedText>
                  <Badge variant={getBadgeVariant('COMMISSION_STATUS', COMMISSION_STATUS.SUSPENDED_COMMISSION)} size="sm">
                    {commissionStats.byStatus[COMMISSION_STATUS.SUSPENDED_COMMISSION]}
                  </Badge>
                </View>
              )}

              {commissionStats.hasDetails && commissionStats.byStatus[COMMISSION_STATUS.NO_COMMISSION] > 0 && (
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Não Comissionadas:
                  </ThemedText>
                  <Badge variant={getBadgeVariant('COMMISSION_STATUS', COMMISSION_STATUS.NO_COMMISSION)} size="sm">
                    {commissionStats.byStatus[COMMISSION_STATUS.NO_COMMISSION]}
                  </Badge>
                </View>
              )}

              {commissionStats.hasDetails && commissionStats.byStatus[COMMISSION_STATUS.PARTIAL_COMMISSION] > 0 && (
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Parcialmente Comissionadas:
                  </ThemedText>
                  <Badge variant={getBadgeVariant('COMMISSION_STATUS', COMMISSION_STATUS.PARTIAL_COMMISSION)} size="sm">
                    {commissionStats.byStatus[COMMISSION_STATUS.PARTIAL_COMMISSION]}
                  </Badge>
                </View>
              )}

              {commissionStats.hasDetails && commissionStats.byStatus[COMMISSION_STATUS.FULL_COMMISSION] > 0 && (
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Totalmente Comissionadas:
                  </ThemedText>
                  <Badge variant={getBadgeVariant('COMMISSION_STATUS', COMMISSION_STATUS.FULL_COMMISSION)} size="sm">
                    {commissionStats.byStatus[COMMISSION_STATUS.FULL_COMMISSION]}
                  </Badge>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Calculation Period Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Período de Cálculo</ThemedText>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Início:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.calculationPeriodStart
                  ? new Date(bonus.calculationPeriodStart).toLocaleDateString('pt-BR')
                  : '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Fim:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {bonus.calculationPeriodEnd
                  ? new Date(bonus.calculationPeriodEnd).toLocaleDateString('pt-BR')
                  : '-'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Criado em:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {new Date(bonus.createdAt).toLocaleDateString('pt-BR')}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Action Button */}
        <View style={styles.actionButtonContainer}>
          <Button
            onPress={() => router.push('/(tabs)/pessoal/simulacao-bonus' as any)}
            variant="outline"
          >
            Simular Novo Bônus
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  retryButtonContainer: {
    padding: 24,
    alignItems: "center",
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
  periodValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  bonusAmount: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
  },
  discountInfo: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
  actionButtonContainer: {
    margin: 16,
    marginTop: 8,
  },
});
