import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl , StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProductionDashboard } from '../../../hooks';
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatNumber } from '../../../utils';
import { DASHBOARD_TIME_PERIOD } from '../../../constants';

// Simple chart component using bars
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barLabelContainer}>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={StyleSheet.flatten([
                  styles.bar,
                  {
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || "#3b82f6",
                  },
                ])}
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
}> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
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
                <Text style={styles.pieLabel}>{item.label}</Text>
                <Text style={styles.pieValue}>
                  {item.value} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default function ProductionAnalyticsScreen() {
  const [timePeriod, setTimePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useProductionDashboard({
    timePeriod: timePeriod as string,
    includeServiceOrders: true,
    includeCuts: true,
    includeAirbrush: true,
    includeTrucks: true,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando análise de produção...</Text>
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

  const data = dashboard?.data;

  // Transform chart data
  const taskStatusData = data?.overview ? [
    { label: "Em Produção", value: data.overview.tasksInProduction.value, color: "#3b82f6" },
    { label: "Concluídas", value: data.overview.tasksCompleted.value, color: "#10b981" },
    { label: "Canceladas", value: data.overview.tasksCancelled.value, color: "#ef4444" },
    { label: "Em Espera", value: data.overview.tasksOnHold.value, color: "#f59e0b" },
  ] : [];

  const customerTypeData = data?.customerMetrics?.customersByType?.labels?.map((label, index) => ({
    label,
    value: data.customerMetrics.customersByType.datasets[0]?.data[index] || 0,
    color: index === 0 ? "#8b5cf6" : "#06b6d4",
  })) || [];

  const topCustomersData = data?.customerMetrics?.topCustomersByTasks?.slice(0, 5).map((customer) => ({
    label: customer.name,
    value: customer.value,
    color: "#16a34a",
  })) || [];

  const truckData = data?.truckMetrics?.trucksByManufacturer?.labels?.map((label, index) => ({
    label,
    value: data.truckMetrics.trucksByManufacturer.datasets[0]?.data[index] || 0,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5],
  })) || [];

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
          <Text style={styles.headerTitle}>Produção</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral das Tarefas</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Tarefas"
              value={data?.overview?.totalTasks?.value || 0}
              icon="clipboard"
              color="#8b5cf6"
              trend={data?.overview?.totalTasks?.trend}
              change={data?.overview?.totalTasks?.changePercent}
            />
            <DashboardCard
              title="Em Produção"
              value={data?.overview?.tasksInProduction?.value || 0}
              icon="settings"
              color="#3b82f6"
              trend={data?.overview?.tasksInProduction?.trend}
              change={data?.overview?.tasksInProduction?.changePercent}
            />
            <DashboardCard
              title="Concluídas"
              value={data?.overview?.tasksCompleted?.value || 0}
              icon="check-circle"
              color="#10b981"
              trend={data?.overview?.tasksCompleted?.trend}
              change={data?.overview?.tasksCompleted?.changePercent}
            />
            <DashboardCard
              title="Tempo Médio"
              value={`${(data?.overview?.averageCompletionTime?.value || 0).toFixed(1)}h`}
              icon="clock"
              color="#f59e0b"
              unit=""
              trend={data?.overview?.averageCompletionTime?.trend}
              change={data?.overview?.averageCompletionTime?.changePercent}
            />
          </View>
        </View>

        {/* Service Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordens de Serviço</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de OS"
              value={data?.serviceOrders?.totalServiceOrders?.value || 0}
              icon="file-text"
              color="#06b6d4"
              trend={data?.serviceOrders?.totalServiceOrders?.trend}
              change={data?.serviceOrders?.totalServiceOrders?.changePercent}
            />
            <DashboardCard
              title="OS Pendentes"
              value={data?.serviceOrders?.pendingServiceOrders?.value || 0}
              icon="clock"
              color="#f59e0b"
              trend={data?.serviceOrders?.pendingServiceOrders?.trend}
              change={data?.serviceOrders?.pendingServiceOrders?.changePercent}
            />
            <DashboardCard
              title="OS Concluídas"
              value={data?.serviceOrders?.completedServiceOrders?.value || 0}
              icon="check"
              color="#10b981"
              trend={data?.serviceOrders?.completedServiceOrders?.trend}
              change={data?.serviceOrders?.completedServiceOrders?.changePercent}
            />
            <DashboardCard
              title="Serviços/OS"
              value={data?.serviceOrders?.averageServicesPerOrder?.value || 0}
              icon="list"
              color="#8b5cf6"
              trend={data?.serviceOrders?.averageServicesPerOrder?.trend}
              change={data?.serviceOrders?.averageServicesPerOrder?.changePercent}
            />
          </View>
        </View>

        {/* Garage Utilization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilização de Garagem</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Vagas"
              value={data?.garageUtilization?.totalParkingSpots?.value || 0}
              icon="home"
              color="#6366f1"
            />
            <DashboardCard
              title="Vagas Ocupadas"
              value={data?.garageUtilization?.occupiedSpots?.value || 0}
              icon="car"
              color="#f59e0b"
            />
            <DashboardCard
              title="Taxa de Utilização"
              value={`${(data?.garageUtilization?.utilizationRate?.value || 0).toFixed(1)}%`}
              icon="activity"
              color={
                (data?.garageUtilization?.utilizationRate?.value || 0) > 80
                  ? "#ef4444"
                  : (data?.garageUtilization?.utilizationRate?.value || 0) > 60
                  ? "#f59e0b"
                  : "#10b981"
              }
              unit=""
            />
            <DashboardCard
              title="Caminhões em Produção"
              value={data?.truckMetrics?.trucksInProduction?.value || 0}
              icon="truck"
              color="#8b5cf6"
            />
          </View>

          {/* Utilization Progress */}
          <Card style={styles.cardMargin}>
            <CardHeader>
              <CardTitle>Ocupação por Garagem</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.garageUtilization?.spotsByGarage?.labels?.map((label, index) => {
                const total = data.garageUtilization.spotsByGarage.datasets[0]?.data[index] || 0;
                const occupied = Math.floor(total * ((data?.garageUtilization?.utilizationRate?.value || 0) / 100));
                const utilization = total > 0 ? (occupied / total) * 100 : 0;

                return (
                  <View key={index} style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{label}</Text>
                      <Text style={styles.progressValue}>{occupied}/{total}</Text>
                    </View>
                    <Progress value={utilization} style={styles.progress} />
                  </View>
                );
              }) || []}
            </CardContent>
          </Card>
        </View>

        {/* Revenue Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análise de Receita</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Receita Total"
              value={formatCurrency(data?.revenueAnalysis?.totalRevenue?.value || 0)}
              icon="currency-dollar"
              color="#10b981"
              unit=""
              trend={data?.revenueAnalysis?.totalRevenue?.trend}
              change={data?.revenueAnalysis?.totalRevenue?.changePercent}
            />
            <DashboardCard
              title="Valor Médio/Tarefa"
              value={formatCurrency(data?.revenueAnalysis?.averageTaskValue?.value || 0)}
              icon="receipt"
              color="#3b82f6"
              unit=""
              trend={data?.revenueAnalysis?.averageTaskValue?.trend}
              change={data?.revenueAnalysis?.averageTaskValue?.changePercent}
            />
          </View>
        </View>

        {/* Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análises Gráficas</Text>

          {taskStatusData.length > 0 && (
            <PieChart data={taskStatusData} title="Distribuição de Status das Tarefas" />
          )}

          {topCustomersData.length > 0 && (
            <BarChart data={topCustomersData} title="Top 5 Clientes por Tarefas" />
          )}

          {customerTypeData.length > 0 && (
            <PieChart data={customerTypeData} title="Clientes por Tipo" />
          )}

          {truckData.length > 0 && (
            <BarChart data={truckData} title="Caminhões por Fabricante" />
          )}
        </View>

        {/* Productivity Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas de Produtividade</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Tarefas/Dia"
              value={data?.productivityMetrics?.tasksPerDay?.value || 0}
              icon="calendar"
              color="#06b6d4"
              trend={data?.productivityMetrics?.tasksPerDay?.trend}
              change={data?.productivityMetrics?.tasksPerDay?.changePercent}
            />
            <DashboardCard
              title="Tarefas/Usuário"
              value={data?.productivityMetrics?.averageTasksPerUser?.value || 0}
              icon="user"
              color="#8b5cf6"
              trend={data?.productivityMetrics?.averageTasksPerUser?.trend}
              change={data?.productivityMetrics?.averageTasksPerUser?.changePercent}
            />
            <DashboardCard
              title="Eficiência"
              value={`${(data?.productivityMetrics?.efficiency?.value || 0).toFixed(1)}%`}
              icon="trending-up"
              color="#10b981"
              unit=""
              trend={data?.productivityMetrics?.efficiency?.trend}
              change={data?.productivityMetrics?.efficiency?.changePercent}
            />
          </View>
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
    marginTop: 16,
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
  },
  pieValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  progress: {
    height: 8,
  },
});