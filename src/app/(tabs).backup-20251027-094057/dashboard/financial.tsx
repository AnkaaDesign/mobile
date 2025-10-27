import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl , StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePayrolls, useBonuses, useTasks, usePrivileges } from '../../../hooks';
import { DashboardCard, QuickActionCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from '../../../utils';
import { DASHBOARD_TIME_PERIOD, SECTOR_PRIVILEGES } from '../../../constants';
import { router } from 'expo-router';

// Helper function to convert Decimal to number
const toNumber = (value: number | { toNumber: () => number } | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return 0;
};

// Simple chart component using bars
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  valueFormatter?: (value: number) => string;
}> = ({ data, title, valueFormatter = (value) => formatCurrency(value) }) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card style={styles.chartCard}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barLabelContainer}>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.barValue}>{valueFormatter(item.value)}</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    backgroundColor: item.color || "#3b82f6",
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </CardContent>
    </Card>
  );
};

// Simple pie chart component
const PieChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
  valueFormatter?: (value: number) => string;
}> = ({ data, title, valueFormatter = formatCurrency }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card style={styles.chartCard}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <View key={index} style={styles.pieItem}>
              <View style={StyleSheet.flatten([styles.colorBox, { backgroundColor: item.color }])} />
              <View style={styles.pieItemContent}>
                <Text style={styles.pieLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.pieValue}>
                  {valueFormatter(item.value)} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default function FinancialAnalyticsScreen() {
  const [timePeriod, setTimePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin, canViewStatistics } = usePrivileges();

  // Get date filter for current time period
  const dateFilters = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timePeriod) {
      case DASHBOARD_TIME_PERIOD.TODAY:
        return {
          // For payroll: current month/year only (can't filter by day)
          payroll: { year: currentYear, month: currentMonth },
          // For bonus: current month/year only (can't filter by day)
          bonus: { year: currentYear, month: currentMonth },
          // For tasks: use createdAt for day filtering
          task: {
            gte: today,
            lte: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          },
        };
      case DASHBOARD_TIME_PERIOD.THIS_WEEK:
        return {
          // For payroll: current month/year only (can't filter by week)
          payroll: { year: currentYear, month: currentMonth },
          // For bonus: current month/year only (can't filter by week)
          bonus: { year: currentYear, month: currentMonth },
          // For tasks: use createdAt for week filtering
          task: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: now,
          },
        };
      case DASHBOARD_TIME_PERIOD.THIS_MONTH:
        return {
          // For payroll: current month/year
          payroll: { year: currentYear, month: currentMonth },
          // For bonus: current month/year
          bonus: { year: currentYear, month: currentMonth },
          // For tasks: use createdAt for month filtering
          task: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lte: now,
          },
        };
      case DASHBOARD_TIME_PERIOD.THIS_YEAR:
        return {
          // For payroll: current year
          payroll: { year: currentYear },
          // For bonus: current year
          bonus: { year: currentYear },
          // For tasks: use createdAt for year filtering
          task: {
            gte: new Date(currentYear, 0, 1),
            lte: now,
          },
        };
      default:
        return {
          payroll: undefined,
          bonus: undefined,
          task: undefined,
        };
    }
  }, [timePeriod]);

  // Fetch data with time filters
  const { data: payrolls, isLoading: payrollsLoading, error: payrollsError, refetch: refetchPayrolls } = usePayrolls({
    where: dateFilters.payroll,
    include: { user: true },
  });

  const { data: bonuses, isLoading: bonusesLoading, error: bonusesError, refetch: refetchBonuses } = useBonuses({
    where: dateFilters.bonus,
    include: { user: true },
  });

  const { data: tasks, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks({
    where: {
      ...(dateFilters.task && { createdAt: dateFilters.task }),
    },
    include: { createdBy: true, customer: true, budget: true },
  });

  const isLoading = payrollsLoading || bonusesLoading || tasksLoading;
  const error = payrollsError || bonusesError || tasksError;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPayrolls(), refetchBonuses(), refetchTasks()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Privilege guard
  if (!isAdmin && !canViewStatistics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorMessage}>
            Você não tem permissão para acessar o dashboard financeiro.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando análise financeira...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Erro ao carregar dados</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate metrics
  const payrollData = payrolls?.data || [];
  const bonusData = bonuses?.data || [];
  const taskData = tasks?.data || [];

  // Helper to get task price from budget
  const getTaskPrice = (task: typeof taskData[0]): number => {
    if (task.budget && Array.isArray(task.budget) && task.budget.length > 0) {
      return task.budget.reduce((sum, b) => sum + toNumber(b.valor), 0);
    }
    return 0;
  };

  // Total values
  const totalPayroll = payrollData.reduce((sum, payroll) => sum + toNumber(payroll.baseRemuneration), 0);
  const totalBonuses = bonusData.reduce((sum, bonus) => sum + toNumber(bonus.baseBonus), 0);
  const totalRevenue = taskData.reduce((sum, task) => sum + getTaskPrice(task), 0);
  const totalCommissions = bonusData.reduce((sum, bonus) => sum + toNumber(bonus.baseBonus), 0);

  // Average values
  const averagePayroll = payrollData.length > 0 ? totalPayroll / payrollData.length : 0;
  const averageBonus = bonusData.length > 0 ? totalBonuses / bonusData.length : 0;
  const averageTaskValue = taskData.length > 0 ? totalRevenue / taskData.length : 0;

  // Top earners by payroll
  const topPayrollEarners = payrollData
    .sort((a, b) => toNumber(b.baseRemuneration) - toNumber(a.baseRemuneration))
    .slice(0, 5)
    .map(payroll => ({
      label: payroll.user?.name || "Funcionário",
      value: toNumber(payroll.baseRemuneration),
      color: "#10b981",
    }));

  // Top bonus earners
  const topBonusEarners = bonusData
    .sort((a, b) => toNumber(b.baseBonus) - toNumber(a.baseBonus))
    .slice(0, 5)
    .map(bonus => ({
      label: bonus.user?.name || "Funcionário",
      value: toNumber(bonus.baseBonus),
      color: "#3b82f6",
    }));

  // Revenue by customer
  const revenueByCustomer = taskData
    .reduce((acc, task) => {
      const customerName = task.customer?.fantasyName || "Cliente não identificado";
      if (!acc[customerName]) {
        acc[customerName] = 0;
      }
      acc[customerName] += getTaskPrice(task);
      return acc;
    }, {} as Record<string, number>);

  const topCustomers = Object.entries(revenueByCustomer)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({
      label: name,
      value,
      color: "#8b5cf6",
    }));

  // Bonus breakdown - simplified since we don't have type classification
  const bonusTypeData = bonusData.length > 0 ? [{
    label: "Bônus Totais",
    value: totalBonuses,
    color: "#3b82f6",
  }] : [];

  // Financial distribution
  const financialDistribution = [
    { label: "Folha de Pagamento", value: totalPayroll, color: "#10b981" },
    { label: "Bônus e Comissões", value: totalBonuses, color: "#3b82f6" },
    { label: "Receita de Tarefas", value: totalRevenue, color: "#8b5cf6" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financeiro</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Folha de Pagamento"
              icon="file-text"
              color="#10b981"
              onPress={() => router.push('/human-resources/payroll/list' as any)}
            />
            <QuickActionCard
              title="Comissões"
              icon="dollar-sign"
              color="#3b82f6"
              onPress={() => router.push('/administration/commissions/list' as any)}
            />
            <QuickActionCard
              title="Tarefas"
              icon="clipboard"
              color="#8b5cf6"
              onPress={() => router.push('/production/schedule/list' as any)}
            />
            <QuickActionCard
              title="Relatórios"
              icon="bar-chart"
              color="#f59e0b"
              onPress={() => router.push('/statistics' as any)}
            />
          </View>
        </View>

        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral Financeira</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total Folha"
              value={formatCurrency(totalPayroll)}
              icon="currency-dollar"
              color="#10b981"
              unit=""
            />
            <DashboardCard
              title="Total Bônus"
              value={formatCurrency(totalBonuses)}
              icon="gift"
              color="#3b82f6"
              unit=""
            />
            <DashboardCard
              title="Receita Tarefas"
              value={formatCurrency(totalRevenue)}
              icon="trending-up"
              color="#8b5cf6"
              unit=""
            />
            <DashboardCard
              title="Total Comissões"
              value={formatCurrency(totalCommissions)}
              icon="percent"
              color="#f59e0b"
              unit=""
            />
          </View>
        </View>

        {/* Average Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas Médias</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Salário Médio"
              value={formatCurrency(averagePayroll)}
              icon="user-dollar"
              color="#06b6d4"
              unit=""
            />
            <DashboardCard
              title="Bônus Médio"
              value={formatCurrency(averageBonus)}
              icon="award"
              color="#84cc16"
              unit=""
            />
            <DashboardCard
              title="Valor Médio/Tarefa"
              value={formatCurrency(averageTaskValue)}
              icon="receipt"
              color="#f97316"
              unit=""
            />
          </View>
        </View>

        {/* Counts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contadores</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Folhas Processadas"
              value={payrollData.length}
              icon="file-text"
              color="#6366f1"
            />
            <DashboardCard
              title="Bônus Pagos"
              value={bonusData.length}
              icon="gift"
              color="#ec4899"
            />
            <DashboardCard
              title="Tarefas Faturadas"
              value={taskData.length}
              icon="clipboard-check"
              color="#14b8a6"
            />
          </View>
        </View>

        {/* Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análises Gráficas</Text>

          {financialDistribution.length > 0 && (
            <PieChart data={financialDistribution} title="Distribuição Financeira" />
          )}

          {bonusTypeData.length > 0 && (
            <PieChart data={bonusTypeData} title="Bônus por Tipo" />
          )}

          {topPayrollEarners.length > 0 && (
            <BarChart data={topPayrollEarners} title="Top 5 Maiores Salários" />
          )}

          {topBonusEarners.length > 0 && (
            <BarChart data={topBonusEarners} title="Top 5 Maiores Bônus" />
          )}

          {topCustomers.length > 0 && (
            <BarChart data={topCustomers} title="Top 5 Clientes por Receita" />
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>

          {/* Recent Payrolls */}
          {payrollData.length > 0 && (
            <Card style={styles.cardMargin}>
              <CardHeader>
                <CardTitle>Folhas de Pagamento Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {payrollData.slice(0, 5).map((payroll, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Icon name="currency-dollar" size={16} color="#10b981" />
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionTitle}>
                        {payroll.user?.name || "Funcionário"}
                      </Text>
                      <Text style={styles.transactionDescription}>
                        Remuneração base • {new Date(payroll.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <Text style={styles.transactionValue}>
                      {formatCurrency(toNumber(payroll.baseRemuneration))}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Bonuses */}
          {bonusData.length > 0 && (
            <Card style={styles.cardMargin}>
              <CardHeader>
                <CardTitle>Bônus e Comissões Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {bonusData.slice(0, 5).map((bonus, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Icon
                        name="gift"
                        size={16}
                        color="#3b82f6"
                      />
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionTitle}>
                        {bonus.user?.name || "Funcionário"}
                      </Text>
                      <Text style={styles.transactionDescription}>
                        Bônus • {new Date(bonus.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <Text style={styles.transactionValue}>
                      {formatCurrency(toNumber(bonus.baseBonus))}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Revenue Tasks */}
          {taskData.length > 0 && (
            <Card style={styles.cardMargin}>
              <CardHeader>
                <CardTitle>Tarefas Faturadas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {taskData.slice(0, 5).map((task, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Icon name="clipboard-check" size={16} color="#8b5cf6" />
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionTitle}>
                        {task.customer?.fantasyName || "Cliente"}
                      </Text>
                      <Text style={styles.transactionDescription}>
                        Tarefa • {task.createdBy?.name || "Sistema"}
                      </Text>
                    </View>
                    <Text style={styles.transactionValue}>
                      {formatCurrency(getTaskPrice(task))}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  cardMargin: {
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  barItem: {
    marginBottom: 16,
  },
  barLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  barValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  barContainer: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  pieItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: 12,
  },
  pieItemContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pieLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  pieValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    gap: 8,
  },
});