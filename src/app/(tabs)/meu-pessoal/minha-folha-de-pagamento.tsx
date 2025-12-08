import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ThemedView, ThemedText, Card, CardHeader, CardTitle, CardContent, ErrorScreen, EmptyState, Badge } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatCurrency, getCurrentPayrollPeriod } from '@/utils';
import { apiClient } from '@/api-client';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconCoins, IconTrendingUp, IconTrendingDown, IconWallet } from '@tabler/icons-react-native';

interface PayrollData {
  payroll: {
    id: string;
    baseRemuneration: number;
    year: number;
    month: number;
    user: {
      name: string;
      position?: { name: string };
    };
    discounts?: Array<{ reference: string; value: number; percentage: number }>;
    isLive?: boolean;
  };
  bonus: {
    baseBonus: number;
    performanceLevel: number;
    tasks?: Array<any>;
    isLive?: boolean;
  } | null;
  calculations: {
    baseRemuneration: number;
    bonusAmount: number;
    grossAmount: number;
    totalDiscounts: number;
    netSalary: number;
    discountDetails: Array<{
      order: number;
      type: 'percentage' | 'fixed';
      rate: number;
      amount: number;
      remainingAfterDiscount: number;
    }>;
  };
}

export default function MinhaFolhaDePagamentoScreen() {
//   const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Get current period as default
  const currentPeriod = getCurrentPayrollPeriod();
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch payroll data for selected period
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-payroll', selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await apiClient.get(`/payroll/me/${selectedYear}/${selectedMonth}`);
      return response.data as { success: boolean; data: PayrollData; message: string };
    },
  });

  const payrollData = data?.data;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Navigate to previous month
  const handlePreviousMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Format month name
  const monthName = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long' });
  }, [selectedYear, selectedMonth]);

  const periodLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${selectedYear}`;

  // Check if it's current period
  const isCurrentPeriod = selectedYear === currentPeriod.year && selectedMonth === currentPeriod.month;

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando folha de pagamento...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar folha de pagamento"
          detail={(error as Error).message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasData = payrollData && payrollData.payroll;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Header with navigation */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handlePreviousMonth} style={styles.navButton}>
          <IconChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <IconCalendar size={20} color={colors.primary} style={styles.headerIcon} />
          <ThemedText style={styles.headerTitle}>{periodLabel}</ThemedText>
          {isCurrentPeriod && payrollData?.payroll?.isLive && (
            <Badge variant="success" style={styles.liveBadge}>AO VIVO</Badge>
          )}
        </View>
        <Pressable onPress={handleNextMonth} style={styles.navButton}>
          <IconChevronRight size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {hasData ? (
          <>
            {/* Net Salary Card - Highlight */}
            <Card style={[styles.netSalaryCard, { backgroundColor: colors.primary }]}>
              <CardContent>
                <View style={styles.netSalaryContent}>
                  <IconWallet size={32} color="#fff" />
                  <View style={styles.netSalaryTextContainer}>
                    <ThemedText style={styles.netSalaryLabel}>Salário Líquido</ThemedText>
                    <ThemedText style={styles.netSalaryValue}>
                      {formatCurrency(payrollData.calculations.netSalary)}
                    </ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Salary Breakdown */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Composição Salarial</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Base Remuneration */}
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconCoins size={20} color={colors.foreground} />
                    <ThemedText style={styles.breakdownLabel}>Salário Base</ThemedText>
                  </View>
                  <ThemedText style={styles.breakdownValue}>
                    {formatCurrency(payrollData.calculations.baseRemuneration)}
                  </ThemedText>
                </View>

                {/* Bonus */}
                {payrollData.bonus && payrollData.calculations.bonusAmount > 0 && (
                  <View style={[styles.breakdownRow, styles.breakdownPositive]}>
                    <View style={styles.breakdownLeft}>
                      <IconTrendingUp size={20} color={colors.primary} />
                      <ThemedText style={[styles.breakdownLabel, { color: colors.primary }]}>
                        Bônus {payrollData.bonus.isLive && '(ao vivo)'}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.breakdownValue, { color: colors.primary }]}>
                      +{formatCurrency(payrollData.calculations.bonusAmount)}
                    </ThemedText>
                  </View>
                )}

                {/* Gross Amount */}
                <View style={[styles.breakdownRow, styles.breakdownSeparator, { borderTopColor: colors.border }]}>
                  <ThemedText style={styles.breakdownLabelBold}>Total Bruto</ThemedText>
                  <ThemedText style={styles.breakdownValueBold}>
                    {formatCurrency(payrollData.calculations.grossAmount)}
                  </ThemedText>
                </View>

                {/* Total Discounts */}
                {payrollData.calculations.totalDiscounts > 0 && (
                  <View style={[styles.breakdownRow, styles.breakdownNegative]}>
                    <View style={styles.breakdownLeft}>
                      <IconTrendingDown size={20} color={colors.destructive} />
                      <ThemedText style={[styles.breakdownLabel, { color: colors.destructive }]}>
                        Descontos
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.breakdownValue, { color: colors.destructive }]}>
                      -{formatCurrency(payrollData.calculations.totalDiscounts)}
                    </ThemedText>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Discounts Detail */}
            {payrollData.payroll.discounts && payrollData.payroll.discounts.length > 0 && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Detalhamento de Descontos</CardTitle>
                </CardHeader>
                <CardContent>
                  {payrollData.payroll.discounts.map((discount, index) => (
                    <View key={index} style={[styles.discountRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <ThemedText style={styles.discountLabel}>{discount.reference}</ThemedText>
                      <ThemedText style={[styles.discountValue, { color: colors.destructive }]}>
                        {discount.percentage
                          ? `${discount.percentage}%`
                          : formatCurrency(discount.value)}
                      </ThemedText>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Bonus Tasks */}
            {payrollData.bonus && payrollData.bonus.tasks && payrollData.bonus.tasks.length > 0 && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Tarefas do Bônus ({payrollData.bonus.tasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ThemedText style={styles.tasksInfo}>
                    Nível de Desempenho: {payrollData.bonus.performanceLevel}
                  </ThemedText>
                  <ThemedText style={styles.tasksInfo}>
                    Valor do Bônus: {formatCurrency(payrollData.bonus.baseBonus)}
                  </ThemedText>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            {isCurrentPeriod && payrollData.payroll.isLive && (
              <Card style={[styles.infoCard, { backgroundColor: colors.secondary + '20' }]}>
                <CardContent>
                  <ThemedText style={styles.infoText}>
                    ℹ️ Esta folha está sendo calculada ao vivo e pode mudar conforme novas tarefas são concluídas.
                    Os valores serão finalizados no dia 25 à meia-noite.
                  </ThemedText>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="file-text"
              title="Nenhuma folha de pagamento"
              description={`Nenhuma folha encontrada para ${periodLabel}`}
            />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  liveBadge: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  netSalaryCard: {
    marginBottom: 16,
  },
  netSalaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  netSalaryTextContainer: {
    flex: 1,
  },
  netSalaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  netSalaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
  },
  card: {
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  breakdownLabelBold: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownValueBold: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  breakdownPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  breakdownNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  breakdownSeparator: {
    borderTopWidth: 2,
    marginTop: 8,
    paddingTop: 16,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  discountLabel: {
    fontSize: 13,
  },
  discountValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  tasksInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});
