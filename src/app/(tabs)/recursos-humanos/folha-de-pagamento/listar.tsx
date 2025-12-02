import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconClock, IconCheck } from "@tabler/icons-react-native";
import { usePayrollBonuses } from '@/hooks';
import { ThemedView, ThemedText, ErrorScreen, EmptyState, Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, getCurrentPayrollPeriod } from '@/utils';
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES } from '@/constants';
import { PrivilegeGuard } from "@/components/privilege-guard";
import { PayrollFilterDrawerContent } from "@/components/human-resources/payroll/list/payroll-filter-drawer-content";
import { PayrollColumnVisibilityDrawer } from "@/components/human-resources/payroll/list/payroll-column-visibility-drawer";

/**
 * Check if bonus period has closed (26th of month after payroll month)
 */
function isBonusPeriodClosed(payrollMonth: number, payrollYear: number, currentDate = new Date()): boolean {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  // Calculate closure date (26th of the month after payroll month)
  let closureMonth = payrollMonth + 1;
  let closureYear = payrollYear;

  if (closureMonth > 12) {
    closureMonth = 1;
    closureYear = payrollYear + 1;
  }

  if (currentYear > closureYear) return true;
  if (currentYear === closureYear) {
    if (currentMonth > closureMonth) return true;
    if (currentMonth === closureMonth && currentDay >= 26) return true;
  }

  return false;
}

/**
 * Determine if a payroll is live vs saved
 */
function isPayrollLive(payroll: any, payrollMonth: number, payrollYear: number): boolean {
  const hasRealPayrollId = payroll.id && !payroll.id.startsWith('00000000-');
  const bonusPeriodClosed = isBonusPeriodClosed(payrollMonth, payrollYear);

  if (!hasRealPayrollId) return true;
  if (!bonusPeriodClosed) return true;
  if (payroll.isLive === true || payroll.isTemporary === true) return true;

  return false;
}

interface PayrollRow {
  id: string;
  payrollId?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userCpf?: string;
  payrollNumber?: string;
  position?: { id: string; name: string; remuneration?: number; bonifiable?: boolean };
  sector?: { id: string; name: string };
  performanceLevel: number;
  baseRemuneration: number;
  bonusAmount: number;       // Gross bonus (Bônus Bruto)
  netBonus: number;          // Net bonus after discounts (Bônus Líquido)
  totalDiscounts: number;
  netSalary: number;
  tasksCompleted: number;
  totalWeightedTasks: number;
  averageTasks: number;
  isLive: boolean;           // Live calculation vs saved payroll
}

export default function PayrollListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [columnDrawerOpen, setColumnDrawerOpen] = useState(false);

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
    // Navigate to payroll detail using live-ID format (matching desktop)
    if (payroll.isLive || !payroll.payrollId) {
      // Live calculation - use live-{userId}-{year}-{month} format
      const liveId = `live-${payroll.userId}-${year}-${month}`;
      router.push(`/(tabs)/recursos-humanos/folha-de-pagamento/${liveId}` as any);
    } else {
      // Saved payroll - use payroll ID directly
      router.push(`/(tabs)/recursos-humanos/folha-de-pagamento/${payroll.payrollId}` as any);
    }
  }, [router, year, month]);

  // Process payroll data
  const processedPayrolls: PayrollRow[] = useMemo(() => {
    if (!payrollData || !Array.isArray(payrollData)) return [];

    // Calculate period-wide statistics (same as desktop)
    let totalTasksForPeriod = 0;
    let eligibleUsersCount = 0;

    payrollData.forEach((payroll: any) => {
      const user = payroll.user;
      const bonus = payroll.bonus;
      const isEligible = user?.position?.bonifiable && (user?.performanceLevel || 0) > 0;

      if (isEligible) {
        eligibleUsersCount++;
        if (bonus?.totalTasks !== undefined) {
          totalTasksForPeriod = Number(bonus.totalTasks) || 0;
        }
      }
    });

    const averageTasksPerUser = eligibleUsersCount > 0 ? totalTasksForPeriod / eligibleUsersCount : 0;

    return payrollData.map((payroll: any) => {
      const user = payroll.user;
      const bonus = payroll.bonus;

      // Calculate payroll discounts
      const totalDiscounts = payroll.discounts && Array.isArray(payroll.discounts)
        ? payroll.discounts.reduce((sum: number, discount: any) => {
            const discountValue = discount.value ? Number(discount.value) : 0;
            return sum + (isNaN(discountValue) ? 0 : discountValue);
          }, 0)
        : 0;

      const baseRemuneration = Number(payroll.baseRemuneration) || 0;
      const isEligibleForBonus = user?.position?.bonifiable;
      const bonusAmount = isEligibleForBonus && bonus?.baseBonus ? Number(bonus.baseBonus) : 0;

      // Calculate net bonus (gross bonus minus bonus discounts) - matches desktop
      let bonusDiscountsTotal = 0;
      if (isEligibleForBonus && bonus?.bonusDiscounts && Array.isArray(bonus.bonusDiscounts)) {
        bonus.bonusDiscounts.forEach((discount: any) => {
          if (discount.percentage) {
            bonusDiscountsTotal += bonusAmount * (discount.percentage / 100);
          } else if (discount.value) {
            bonusDiscountsTotal += Number(discount.value) || 0;
          }
        });
      }
      const netBonus = bonusAmount - bonusDiscountsTotal;

      const netSalary = baseRemuneration + netBonus - totalDiscounts;

      const tasksCompleted = isEligibleForBonus && bonus?.totalTasks ? Number(bonus.totalTasks) : 0;

      // Determine live vs saved status
      const isLive = isPayrollLive(payroll, month, year);

      return {
        id: `${payroll.id || user?.id}-${month}`,
        payrollId: payroll.id,
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
        netBonus,
        totalDiscounts,
        netSalary,
        tasksCompleted,
        totalWeightedTasks: totalTasksForPeriod,
        averageTasks: averageTasksPerUser,
        isLive,
      };
    });
  }, [payrollData, month, year]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalPayroll = processedPayrolls.reduce((sum, p) => sum + p.baseRemuneration, 0);
    const totalGrossBonuses = processedPayrolls.reduce((sum, p) => sum + p.bonusAmount, 0);
    const totalNetBonuses = processedPayrolls.reduce((sum, p) => sum + p.netBonus, 0);
    const totalDiscounts = processedPayrolls.reduce((sum, p) => sum + p.totalDiscounts, 0);
    const totalNet = processedPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

    return {
      totalPayroll,
      totalGrossBonuses,
      totalNetBonuses,
      totalDiscounts,
      totalNet,
      count: processedPayrolls.length,
    };
  }, [processedPayrolls]);

  // Determine if current period is live or confirmed
  const isPeriodLive = !isBonusPeriodClosed(month, year);

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
              <View style={styles.headerTitleRow}>
                <CardTitle>Folha de Pagamento</CardTitle>
                <Badge
                  variant={isPeriodLive ? "warning" : "success"}
                  size="sm"
                  style={styles.statusBadge}
                >
                  <View style={styles.statusBadgeContent}>
                    {isPeriodLive ? (
                      <IconClock size={12} color={colors.warning} />
                    ) : (
                      <IconCheck size={12} color={colors.success} />
                    )}
                    <ThemedText style={[styles.statusBadgeText, { color: isPeriodLive ? colors.warning : colors.success }]}>
                      {isPeriodLive ? "Provisório" : "Confirmado"}
                    </ThemedText>
                  </View>
                </Badge>
              </View>
              <ThemedText style={styles.periodText}>{periodLabel}</ThemedText>
            </CardHeader>
            <CardContent>
              <View style={styles.headerActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setFilterDrawerOpen(true)}
                  style={styles.headerButton}
                >
                  Filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setColumnDrawerOpen(true)}
                  style={styles.headerButton}
                >
                  Colunas
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Filter Drawer */}
          <PayrollFilterDrawerContent
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            onApply={(filters) => {
              // TODO: Apply filters to payroll query
              console.log('Filters applied:', filters);
              setFilterDrawerOpen(false);
            }}
          />

          {/* Column Visibility Drawer */}
          <PayrollColumnVisibilityDrawer
            open={columnDrawerOpen}
            onClose={() => setColumnDrawerOpen(false)}
          />

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
                    <ThemedText style={styles.summaryLabel}>Bônus Bruto:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueCurrency]}>
                      {formatCurrency(summary.totalGrossBonuses)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Bônus Líquido:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueCurrency, { color: colors.success }]}>
                      {formatCurrency(summary.totalNetBonuses)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Descontos:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueCurrency, { color: colors.destructive }]}>
                      -{formatCurrency(summary.totalDiscounts)}
                    </ThemedText>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <ThemedText style={[styles.summaryLabel, styles.summaryLabelTotal]}>Total Líquido:</ThemedText>
                    <ThemedText style={[styles.summaryValue, styles.summaryValueTotal, { color: colors.success }]}>
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
                        {payroll.position?.bonifiable ? (
                          <>
                            <View style={styles.payrollDetailRow}>
                              <ThemedText style={styles.payrollDetailLabel}>Bônus Bruto:</ThemedText>
                              <ThemedText style={styles.payrollDetailValue}>
                                {payroll.bonusAmount > 0 ? formatCurrency(payroll.bonusAmount) : "Sem bônus"}
                              </ThemedText>
                            </View>
                            {payroll.bonusAmount > 0 && (
                              <View style={styles.payrollDetailRow}>
                                <ThemedText style={styles.payrollDetailLabel}>Bônus Líquido:</ThemedText>
                                <ThemedText style={[styles.payrollDetailValue, { color: colors.success }]}>
                                  {formatCurrency(payroll.netBonus)}
                                </ThemedText>
                              </View>
                            )}
                          </>
                        ) : (
                          <View style={styles.payrollDetailRow}>
                            <ThemedText style={styles.payrollDetailLabel}>Bônus:</ThemedText>
                            <ThemedText style={[styles.payrollDetailValue, { color: colors.mutedForeground }]}>
                              Não elegível
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
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    marginLeft: 8,
  },
  statusBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  headerButton: {
    flex: 1,
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
