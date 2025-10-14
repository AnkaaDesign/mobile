import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAdministrationDashboard } from '../../../hooks';
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from '../../../utils';
import { DASHBOARD_TIME_PERIOD } from '../../../constants';
import { usePrivileges } from '../../../hooks/usePrivileges';
import { SECTOR_PRIVILEGES } from '../../../constants';
import { router } from 'expo-router';

export default function AdministrationDashboardScreen() {
  const [timePeriod, setTimePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);
  const { canViewStatistics, isLeader, isAdmin } = usePrivileges();

  const { data: dashboard, isLoading, error, refetch } = useAdministrationDashboard({
    timePeriod,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Privilege guard - Leaders and Admins can access
  if (!canViewStatistics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorMessage}>
            Você não tem permissão para acessar o dashboard de administração.
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
          <Text style={styles.loadingText}>Carregando dashboard de administração...</Text>
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
          <Text style={styles.headerTitle}>Administração</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Customer Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clientes</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Clientes"
              value={data?.customerSummary?.totalCustomers?.value || 0}
              icon="users"
              color="#6366f1"
              trend={data?.customerSummary?.totalCustomers?.trend}
              change={data?.customerSummary?.totalCustomers?.changePercent}
            />
            <DashboardCard
              title="Clientes Ativos"
              value={data?.customerSummary?.activeCustomers?.value || 0}
              icon="user-check"
              color="#10b981"
              trend={data?.customerSummary?.activeCustomers?.trend}
              change={data?.customerSummary?.activeCustomers?.changePercent}
            />
            <DashboardCard
              title="Novos Clientes"
              value={data?.customerSummary?.newCustomers?.value || 0}
              icon="user-plus"
              color="#3b82f6"
              trend={data?.customerSummary?.newCustomers?.trend}
              change={data?.customerSummary?.newCustomers?.changePercent}
            />
            <DashboardCard
              title="Taxa de Retenção"
              value={`${(data?.customerSummary?.retentionRate || 0).toFixed(1)}%`}
              icon="heart"
              color="#ec4899"
              unit=""
            />
          </View>
        </View>

        {/* Order Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Pedidos"
              value={data?.orderSummary?.totalOrders?.value || 0}
              icon="shopping-cart"
              color="#8b5cf6"
              trend={data?.orderSummary?.totalOrders?.trend}
              change={data?.orderSummary?.totalOrders?.changePercent}
            />
            <DashboardCard
              title="Pedidos Pendentes"
              value={data?.orderSummary?.pendingOrders?.value || 0}
              icon="clock"
              color="#f59e0b"
              trend={data?.orderSummary?.pendingOrders?.trend}
              change={data?.orderSummary?.pendingOrders?.changePercent}
            />
            <DashboardCard
              title="Pedidos Concluídos"
              value={data?.orderSummary?.completedOrders?.value || 0}
              icon="check-circle"
              color="#10b981"
              trend={data?.orderSummary?.completedOrders?.trend}
              change={data?.orderSummary?.completedOrders?.changePercent}
            />
            <DashboardCard
              title="Taxa de Conclusão"
              value={`${(data?.orderSummary?.completionRate || 0).toFixed(1)}%`}
              icon="trending-up"
              color="#06b6d4"
              unit=""
            />
          </View>
        </View>

        {/* Revenue Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receita</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Receita Total"
              value={formatCurrency(data?.revenue || 0)}
              icon="currency-dollar"
              color="#10b981"
              unit=""
            />
            <DashboardCard
              title="Receita Média/Pedido"
              value={formatCurrency(data?.averageOrderValue || 0)}
              icon="receipt"
              color="#3b82f6"
              unit=""
            />
          </View>
        </View>

        {/* User Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividade de Usuários</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Usuários"
              value={data?.userActivity?.totalUsers?.value || 0}
              icon="users"
              color="#8b5cf6"
              trend={data?.userActivity?.totalUsers?.trend}
              change={data?.userActivity?.totalUsers?.changePercent}
            />
            <DashboardCard
              title="Usuários Ativos"
              value={data?.userActivity?.activeUsers?.value || 0}
              icon="user-check"
              color="#10b981"
              trend={data?.userActivity?.activeUsers?.trend}
              change={data?.userActivity?.activeUsers?.changePercent}
            />
            <DashboardCard
              title="Novos Usuários"
              value={data?.userActivity?.newUsers?.value || 0}
              icon="user-plus"
              color="#3b82f6"
              trend={data?.userActivity?.newUsers?.trend}
              change={data?.userActivity?.newUsers?.changePercent}
            />
          </View>
        </View>

        {/* Top Customers */}
        {data?.topCustomers && data.topCustomers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Clientes</Text>
            <Card>
              <CardContent>
                {data.topCustomers.slice(0, 5).map((customer, index) => (
                  <View key={index} style={styles.customerItem}>
                    <View style={styles.customerRank}>
                      <Text style={styles.customerRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.customerContent}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <Text style={styles.customerMetric}>
                        {customer.value} pedidos • {formatCurrency(customer.revenue || 0)}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Customer Type Distribution */}
        {data?.customerTypeDistribution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribuição de Clientes</Text>
            <Card>
              <CardContent>
                {data.customerTypeDistribution.labels?.map((label, index) => {
                  const value = data.customerTypeDistribution.datasets[0]?.data[index] || 0;
                  const total = data.customerTypeDistribution.datasets[0]?.data.reduce((a, b) => a + b, 0) || 1;
                  const percentage = (value / total) * 100;

                  return (
                    <View key={index} style={styles.distributionItem}>
                      <View style={styles.distributionContent}>
                        <Text style={styles.distributionLabel}>{label}</Text>
                        <Text style={styles.distributionValue}>{value} clientes</Text>
                      </View>
                      <View style={styles.distributionBar}>
                        <View
                          style={[
                            styles.distributionBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: index === 0 ? "#8b5cf6" : "#06b6d4"
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.distributionPercentage}>{percentage.toFixed(1)}%</Text>
                    </View>
                  );
                })}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Recent Activity */}
        {data?.recentActivity && data.recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <Card>
              <CardContent>
                {data.recentActivity.slice(0, 8).map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Icon
                        name={activity.type === "ORDER" ? "shopping-cart" : "user"}
                        size={16}
                        color="#6b7280"
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.description}</Text>
                      <Text style={styles.activityDescription}>
                        {activity.userName || "Sistema"} • {new Date(activity.createdAt).toLocaleDateString("pt-BR")}
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

        {/* Quick Stats Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <Card>
            <CardContent>
              <View style={styles.summaryItem}>
                <Icon name="calendar" size={20} color="#6b7280" />
                <Text style={styles.summaryText}>
                  Período: {timePeriod === DASHBOARD_TIME_PERIOD.THIS_MONTH ? "Este Mês" : ""}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="trending-up" size={20} color="#10b981" />
                <Text style={styles.summaryText}>
                  Crescimento de clientes: {data?.customerSummary?.newCustomers?.changePercent || 0}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="check-circle" size={20} color="#10b981" />
                <Text style={styles.summaryText}>
                  Taxa de conclusão de pedidos: {(data?.orderSummary?.completionRate || 0).toFixed(1)}%
                </Text>
              </View>
            </CardContent>
          </Card>
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
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  customerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerRankText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  customerContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  customerMetric: {
    fontSize: 12,
    color: "#6b7280",
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  distributionLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  distributionValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  distributionBar: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  distributionBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  distributionPercentage: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
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
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  summaryText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },
});
