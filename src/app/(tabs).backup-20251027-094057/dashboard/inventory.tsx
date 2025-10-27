import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl , StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInventoryDashboard } from '../../../hooks';
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
  valueFormatter?: (value: number) => string;
}> = ({ data, title, valueFormatter = (value) => value.toString() }) => {
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
}> = ({ data, title }) => {
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

export default function InventoryAnalyticsScreen() {
  const [timePeriod, setTimePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useInventoryDashboard({
    timePeriod,
    includeInactive: false,
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
          <Text style={styles.loadingText}>Carregando análise de estoque...</Text>
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
  const categoryData = data?.categoryBreakdown?.itemsByCategory?.labels?.slice(0, 5).map((label, index) => ({
    label,
    value: data.categoryBreakdown.itemsByCategory.datasets[0]?.data[index] || 0,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5],
  })) || [];

  const brandData = data?.categoryBreakdown?.itemsByBrand?.labels?.slice(0, 5).map((label, index) => ({
    label,
    value: data.categoryBreakdown.itemsByBrand.datasets[0]?.data[index] || 0,
    color: ["#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"][index % 5],
  })) || [];

  const topItemsByValueData = data?.topItems?.byValue?.slice(0, 5).map((item) => ({
    label: item.name,
    value: item.value,
    color: "#10b981",
  })) || [];

  const topItemsByActivityData = data?.topItems?.byActivityCount?.slice(0, 5).map((item) => ({
    label: item.name,
    value: item.value,
    color: "#3b82f6",
  })) || [];

  const supplierData = data?.supplierMetrics?.itemsPerSupplier?.slice(0, 5).map((supplier) => ({
    label: supplier.name,
    value: supplier.value,
    color: "#8b5cf6",
  })) || [];

  const movementsByReasonData = data?.stockMovements?.movementsByReason?.labels?.map((label, index) => ({
    label,
    value: data.stockMovements.movementsByReason.datasets[0]?.data[index] || 0,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][index % 6],
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
          <Text style={styles.headerTitle}>Estoque</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral do Estoque</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Itens"
              value={data?.overview?.totalItems?.value || 0}
              icon="package"
              color="#6366f1"
              trend={data?.overview?.totalItems?.trend}
              change={data?.overview?.totalItems?.changePercent}
            />
            <DashboardCard
              title="Valor Total"
              value={formatCurrency(data?.overview?.totalValue?.value || 0)}
              icon="currency-dollar"
              color="#10b981"
              unit=""
              trend={data?.overview?.totalValue?.trend}
              change={data?.overview?.totalValue?.changePercent}
            />
            <DashboardCard
              title="Itens Críticos"
              value={data?.overview?.criticalItems?.value || 0}
              icon="alert-triangle"
              color="#ef4444"
              trend={data?.overview?.criticalItems?.trend}
              change={data?.overview?.criticalItems?.changePercent}
              badge={
                (data?.overview?.criticalItems?.value || 0) > 0
                  ? { text: "!", variant: "destructive" as const }
                  : undefined
              }
            />
            <DashboardCard
              title="Estoque Baixo"
              value={data?.overview?.lowStockItems?.value || 0}
              icon="trending-down"
              color="#f59e0b"
              trend={data?.overview?.lowStockItems?.trend}
              change={data?.overview?.lowStockItems?.changePercent}
              badge={
                (data?.overview?.lowStockItems?.value || 0) > 0
                  ? { text: "!", variant: "outline" as const }
                  : undefined
              }
            />
          </View>
        </View>

        {/* Stock Levels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Níveis de Estoque</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Excesso"
              value={data?.overview?.overstockedItems?.value || 0}
              icon="trending-up"
              color="#3b82f6"
              trend={data?.overview?.overstockedItems?.trend}
              change={data?.overview?.overstockedItems?.changePercent}
            />
            <DashboardCard
              title="Reordenar"
              value={data?.overview?.itemsNeedingReorder?.value || 0}
              icon="refresh"
              color="#8b5cf6"
              trend={data?.overview?.itemsNeedingReorder?.trend}
              change={data?.overview?.itemsNeedingReorder?.changePercent}
            />
          </View>

          {/* Stock Level Distribution */}
          <Card style={styles.cardMargin}>
            <CardHeader>
              <CardTitle>Distribuição dos Níveis de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.stockLevelItem}>
                <View style={styles.stockLevelHeader}>
                  <View style={styles.stockLevelLabel}>
                    <View style={StyleSheet.flatten([styles.colorBox, { backgroundColor: "#ef4444" }])} />
                    <Text style={styles.stockLevelText}>Crítico</Text>
                  </View>
                  <Text style={styles.stockLevelValue}>{data?.overview?.criticalItems?.value || 0}</Text>
                </View>
                <Progress
                  value={data?.overview?.totalItems?.value ? ((data?.overview?.criticalItems?.value || 0) / data.overview.totalItems.value) * 100 : 0}
                  style={{ ...styles.progress, backgroundColor: "#fef2f2" }}
                />
              </View>

              <View style={styles.stockLevelItem}>
                <View style={styles.stockLevelHeader}>
                  <View style={styles.stockLevelLabel}>
                    <View style={StyleSheet.flatten([styles.colorBox, { backgroundColor: "#f59e0b" }])} />
                    <Text style={styles.stockLevelText}>Baixo</Text>
                  </View>
                  <Text style={styles.stockLevelValue}>{data?.overview?.lowStockItems?.value || 0}</Text>
                </View>
                <Progress
                  value={data?.overview?.totalItems?.value ? ((data?.overview?.lowStockItems?.value || 0) / data.overview.totalItems.value) * 100 : 0}
                  style={{ ...styles.progress, backgroundColor: "#fffbeb" }}
                />
              </View>

              <View style={styles.stockLevelItem}>
                <View style={styles.stockLevelHeader}>
                  <View style={styles.stockLevelLabel}>
                    <View style={StyleSheet.flatten([styles.colorBox, { backgroundColor: "#10b981" }])} />
                    <Text style={styles.stockLevelText}>Normal</Text>
                  </View>
                  <Text style={styles.stockLevelValue}>
                    {(data?.overview?.totalItems?.value || 0) -
                     (data?.overview?.criticalItems?.value || 0) -
                     (data?.overview?.lowStockItems?.value || 0) -
                     (data?.overview?.overstockedItems?.value || 0)}
                  </Text>
                </View>
                <Progress
                  value={data?.overview?.totalItems?.value ? (
                    ((data.overview.totalItems.value - (data?.overview?.criticalItems?.value || 0) - (data?.overview?.lowStockItems?.value || 0) - (data?.overview?.overstockedItems?.value || 0)) / data.overview.totalItems.value) * 100
                  ) : 0}
                  style={{ ...styles.progress, backgroundColor: "#f0fdf4" }}
                />
              </View>

              <View style={styles.stockLevelItem}>
                <View style={styles.stockLevelHeader}>
                  <View style={styles.stockLevelLabel}>
                    <View style={StyleSheet.flatten([styles.colorBox, { backgroundColor: "#3b82f6" }])} />
                    <Text style={styles.stockLevelText}>Excesso</Text>
                  </View>
                  <Text style={styles.stockLevelValue}>{data?.overview?.overstockedItems?.value || 0}</Text>
                </View>
                <Progress
                  value={data?.overview?.totalItems?.value ? ((data?.overview?.overstockedItems?.value || 0) / data.overview.totalItems.value) * 100 : 0}
                  style={{ ...styles.progress, backgroundColor: "#eff6ff" }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Stock Movements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movimentações</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Entradas"
              value={data?.stockMovements?.totalInbound?.value || 0}
              icon="arrow-down"
              color="#10b981"
              trend={data?.stockMovements?.totalInbound?.trend}
              change={data?.stockMovements?.totalInbound?.changePercent}
            />
            <DashboardCard
              title="Saídas"
              value={data?.stockMovements?.totalOutbound?.value || 0}
              icon="arrow-up"
              color="#ef4444"
              trend={data?.stockMovements?.totalOutbound?.trend}
              change={data?.stockMovements?.totalOutbound?.changePercent}
            />
          </View>
        </View>

        {/* Recent Activities */}
        {data?.stockMovements?.recentActivities && data.stockMovements.recentActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <Card>
              <CardContent>
                {data.stockMovements.recentActivities.slice(0, 5).map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Icon
                        name={activity.operation === "INBOUND" ? "arrow-down" : "arrow-up"}
                        size={16}
                        color={activity.operation === "INBOUND" ? "#10b981" : "#ef4444"}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.itemName}</Text>
                      <Text style={styles.activityDescription}>
                        {activity.userName || "Sistema"} • {activity.quantity} unidades
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {new Date(activity.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Supplier Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas de Fornecedores</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Pedidos Pendentes"
              value={data?.supplierMetrics?.pendingOrdersCount || 0}
              icon="clock"
              color="#f59e0b"
            />
            <DashboardCard
              title="Pedidos Atrasados"
              value={data?.supplierMetrics?.overdueOrdersCount || 0}
              icon="alert-circle"
              color="#ef4444"
              badge={
                (data?.supplierMetrics?.overdueOrdersCount || 0) > 0
                  ? { text: "!", variant: "destructive" as const }
                  : undefined
              }
            />
          </View>
        </View>

        {/* Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análises Gráficas</Text>

          {categoryData.length > 0 && (
            <PieChart data={categoryData} title="Top 5 Categorias" />
          )}

          {brandData.length > 0 && (
            <PieChart data={brandData} title="Top 5 Marcas" />
          )}

          {topItemsByValueData.length > 0 && (
            <BarChart
              data={topItemsByValueData}
              title="Top 5 Itens por Valor"
              valueFormatter={(value) => formatCurrency(value)}
            />
          )}

          {topItemsByActivityData.length > 0 && (
            <BarChart data={topItemsByActivityData} title="Top 5 Itens por Movimentação" />
          )}

          {supplierData.length > 0 && (
            <BarChart data={supplierData} title="Top 5 Fornecedores" />
          )}

          {movementsByReasonData.length > 0 && (
            <PieChart data={movementsByReasonData} title="Movimentações por Motivo" />
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
    marginTop: 16,
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
  stockLevelItem: {
    marginBottom: 16,
  },
  stockLevelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stockLevelLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockLevelText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 8,
  },
  stockLevelValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  progress: {
    height: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
});