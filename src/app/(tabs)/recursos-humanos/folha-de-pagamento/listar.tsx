import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePayrollBonuses } from '@/hooks';
import { ThemedView, ThemedText, ErrorScreen, EmptyState, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from '@/utils';
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES } from '@/constants';
import { PrivilegeGuard } from "@/components/privilege-guard";

// Get current payroll period (26th-25th cycle)
function getCurrentPayrollPeriod() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // If we're before the 26th, the payroll period is the current month
  // If we're on or after the 26th, the payroll period is the next month
  if (currentDay < 26) {
    return { year: currentYear, month: currentMonth };
  } else {
    // Move to next month
    if (currentMonth === 12) {
      return { year: currentYear + 1, month: 1 };
    } else {
      return { year: currentYear, month: currentMonth + 1 };
    }
  }
}

interface PayrollRow {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userCpf?: string;
  payrollNumber?: string;
  position?: { id: string; name: string; remuneration?: number; bonifiable?: boolean };
  sector?: { id: string; name: string };
  performanceLevel: number;
  baseRemuneration: number;
  bonusAmount: number;
  totalDiscounts: number;
  netSalary: number;
  tasksCompleted: number;
}

export default function PayrollListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Get current period
  const { year, month } = getCurrentPayrollPeriod();

  // Fetch payroll data for current period
  const { data: payrollData, isLoading, error, refetch } = usePayrollBonuses(year, month);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handlePayrollPress = useCallback((payroll: PayrollRow) => {
    // Navigate to payroll detail
    router.push(`/(tabs)/human-resources/payroll/${payroll.userId}?year=${year}&month=${month}` as any);
  }, [router, year, month]);

  // Process payroll data
  const processedPayrolls: PayrollRow[] = useMemo(() => {
    if (!payrollData || !Array.isArray(payrollData)) return [];

    return payrollData.map((payroll: any) => {
      const user = payroll.user;
      const bonus = payroll.bonus;

      // Calculate discounts
      const totalDiscounts = payroll.discounts && Array.isArray(payroll.discounts)
        ? payroll.discounts.reduce((sum: number, discount: any) => {
            const discountValue = discount.value ? Number(discount.value) : 0;
            return sum + (isNaN(discountValue) ? 0 : discountValue);
          }, 0)
        : 0;

      const baseRemuneration = Number(payroll.baseRemuneration) || 0;
      const bonusAmount = bonus?.baseBonus ? Number(bonus.baseBonus) : 0;
      const netSalary = baseRemuneration + bonusAmount - totalDiscounts;

      const isEligibleForBonus = user?.position?.bonifiable && (user?.performanceLevel || 0) > 0;
      const tasksCompleted = isEligibleForBonus && bonus?.totalTasks ? Number(bonus.totalTasks) : 0;

      return {
        id: payroll.id || user?.id,
        userId: user?.id,
        userName: user?.name || 'Sem nome',
        userEmail: user?.email,
        userCpf: user?.cpf,
        payrollNumber: user?.payrollNumber || "-",
        position: user?.position,
        sector: user?.sector,
        performanceLevel: payroll.performanceLevel || user?.performanceLevel || 0,
        baseRemuneration,
        bonusAmount,
        totalDiscounts,
        netSalary,
        tasksCompleted,
      };
    });
  }, [payrollData]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalPayroll = processedPayrolls.reduce((sum, p) => sum + p.baseRemuneration, 0);
    const totalBonuses = processedPayrolls.reduce((sum, p) => sum + p.bonusAmount, 0);
    const totalDiscounts = processedPayrolls.reduce((sum, p) => sum + p.totalDiscounts, 0);
    const totalNet = processedPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

    return {
      totalPayroll,
      totalBonuses,
      totalDiscounts,
      totalNet,
      count: processedPayrolls.length,
    };
  }, [processedPayrolls]);

  // Get month name
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long' });
  const periodLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;

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
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasPayrolls = processedPayrolls.length > 0;

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header Card */}
          <Card style={styles.headerCard}>
            <CardHeader>
              <CardTitle>Folha de Pagamento</CardTitle>
              <ThemedText style={styles.periodText}>{periodLabel}</ThemedText>
            </CardHeader>
          </Card>

          {hasPayrolls ? (
            <>
              {/* Summary Card */}
              <Card style={styles.summaryCard}>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Funcionários:</ThemedText>
                    <ThemedText style={styles.summaryValue}>{summary.count}</ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Folha:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueCurrency]}>
                      {formatCurrency(summary.totalPayroll)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Bônus:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueCurrency, { color: colors.primary }]}>
                      {formatCurrency(summary.totalBonuses)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Descontos:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueCurrency, { color: colors.destructive }]}>
                      {formatCurrency(summary.totalDiscounts)}
                    </ThemedText>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <ThemedText style={[styles.summaryLabel, styles.summaryLabelTotal]}>Total Líquido:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueTotal]}>
                      {formatCurrency(summary.totalNet)}
                    </ThemedText>
                  </View>
                </CardContent>
              </Card>

              {/* Payroll List */}
              <View style={styles.listContainer}>
                <ThemedText style={styles.listTitle}>Colaboradores ({processedPayrolls.length})</ThemedText>
                {processedPayrolls.map((payroll) => (
                  <Pressable
                    key={payroll.id}
                    onPress={() => handlePayrollPress(payroll)}
                  >
                    <Card style={styles.payrollCard}>
                    <CardContent>
                      <View style={styles.payrollHeader}>
                        <View style={styles.payrollHeaderLeft}>
                          <ThemedText style={styles.payrollName}>{payroll.userName}</ThemedText>
                          <ThemedText style={styles.payrollPosition}>
                            {payroll.position?.name || 'Sem cargo'} • {payroll.sector?.name || 'Sem setor'}
                          </ThemedText>
                        </View>
                        <View style={styles.payrollHeaderRight}>
                          <ThemedText style={styles.payrollNetSalary}>
                            {formatCurrency(payroll.netSalary)}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.payrollDetails}>
                        <View style={styles.payrollDetailRow}>
                          <ThemedText style={styles.payrollDetailLabel}>Salário Base:</ThemedText>
                          <ThemedText style={styles.payrollDetailValue}>
                            {formatCurrency(payroll.baseRemuneration)}
                          </ThemedText>
                        </View>
                        {payroll.bonusAmount > 0 && (
                          <View style={styles.payrollDetailRow}>
                            <ThemedText style={styles.payrollDetailLabel}>Bônus:</ThemedText>
                            <ThemedText style={[styles.payrollDetailValue, { color: colors.primary }]}>
                              {formatCurrency(payroll.bonusAmount)}
                            </ThemedText>
                          </View>
                        )}
                        {payroll.totalDiscounts > 0 && (
                          <View style={styles.payrollDetailRow}>
                            <ThemedText style={styles.payrollDetailLabel}>Descontos:</ThemedText>
                            <ThemedText style={[styles.payrollDetailValue, { color: colors.destructive }]}>
                              -{formatCurrency(payroll.totalDiscounts)}
                            </ThemedText>
                          </View>
                        )}
                        {payroll.position?.bonifiable && (
                          <View style={styles.payrollDetailRow}>
                            <ThemedText style={styles.payrollDetailLabel}>Tarefas:</ThemedText>
                            <ThemedText style={styles.payrollDetailValue}>
                              {payroll.tasksCompleted.toFixed(1)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                  </Pressable>
                ))}
              </View>
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
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  periodText: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValueCurrency: {
    fontFamily: "monospace",
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  listContainer: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  payrollCard: {
    marginBottom: 12,
  },
  payrollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  payrollHeaderLeft: {
    flex: 1,
  },
  payrollHeaderRight: {
    marginLeft: 12,
  },
  payrollName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  payrollPosition: {
    fontSize: 12,
    opacity: 0.7,
  },
  payrollNetSalary: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  payrollDetails: {
    marginTop: 8,
  },
  payrollDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  payrollDetailLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  payrollDetailValue: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
});
