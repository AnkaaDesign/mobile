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
              value={data?.customerAnalysis?.totalCustomers?.value || 0}
              icon="users"
              color="#6366f1"
              trend={data?.customerAnalysis?.totalCustomers?.trend}
              change={data?.customerAnalysis?.totalCustomers?.changePercent}
            />
            <DashboardCard
              title="Clientes com Tags"
              value={data?.customerAnalysis?.customersWithTags?.value || 0}
              icon="tag"
              color="#10b981"
              trend={data?.customerAnalysis?.customersWithTags?.trend}
              change={data?.customerAnalysis?.customersWithTags?.changePercent}
            />
            <DashboardCard
              title="Top Clientes"
              value={data?.customerAnalysis?.topCustomersByTasks?.length || 0}
              icon="star"
              color="#3b82f6"
            />
          </View>
        </View>

        {/* Order Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Pedidos"
              value={data?.orderOverview?.totalOrders?.value || 0}
              icon="shopping-cart"
              color="#8b5cf6"
              trend={data?.orderOverview?.totalOrders?.trend}
              change={data?.orderOverview?.totalOrders?.changePercent}
            />
            <DashboardCard
              title="Pedidos Pendentes"
              value={data?.orderOverview?.pendingOrders?.value || 0}
              icon="clock"
              color="#f59e0b"
              trend={data?.orderOverview?.pendingOrders?.trend}
              change={data?.orderOverview?.pendingOrders?.changePercent}
            />
            <DashboardCard
              title="Pedidos Atrasados"
              value={data?.orderOverview?.overdueOrders?.value || 0}
              icon="alert-circle"
              color="#ef4444"
              trend={data?.orderOverview?.overdueOrders?.trend}
              change={data?.orderOverview?.overdueOrders?.changePercent}
            />
            <DashboardCard
              title="Com Agendamento"
              value={data?.orderOverview?.ordersWithSchedule?.value || 0}
              icon="calendar-check"
              color="#06b6d4"
              trend={data?.orderOverview?.ordersWithSchedule?.trend}
              change={data?.orderOverview?.ordersWithSchedule?.changePercent}
            />
          </View>
        </View>

        {/* Task Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarefas</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Tarefas"
              value={data?.taskOverview?.totalTasks?.value || 0}
              icon="clipboard"
              color="#8b5cf6"
              trend={data?.taskOverview?.totalTasks?.trend}
              change={data?.taskOverview?.totalTasks?.changePercent}
            />
          </View>
        </View>

        {/* User Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuários</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Usuários"
              value={data?.userMetrics?.totalUsers?.value || 0}
              icon="users"
              color="#6366f1"
              trend={data?.userMetrics?.totalUsers?.trend}
              change={data?.userMetrics?.totalUsers?.changePercent}
            />
            <DashboardCard
              title="Usuários Ativos"
              value={data?.userMetrics?.activeUsers?.value || 0}
              icon="user-check"
              color="#10b981"
              trend={data?.userMetrics?.activeUsers?.trend}
              change={data?.userMetrics?.activeUsers?.changePercent}
            />
            <DashboardCard
              title="Novos Usuários"
              value={data?.userMetrics?.newUsersThisWeek?.value || 0}
              icon="user-plus"
              color="#3b82f6"
              trend={data?.userMetrics?.newUsersThisWeek?.trend}
              change={data?.userMetrics?.newUsersThisWeek?.changePercent}
            />
          </View>
        </View>

        {/* Top Customers */}
        {data?.customerAnalysis?.topCustomersByTasks && data.customerAnalysis.topCustomersByTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Clientes</Text>
            <Card>
              <CardContent>
                {data.customerAnalysis.topCustomersByTasks.slice(0, 5).map((customer, index: number) => (
                  <View key={index} style={styles.customerItem}>
                    <View style={styles.customerRank}>
                      <Text style={styles.customerRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.customerContent}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <Text style={styles.customerMetric}>
                        {customer.value} tarefas • {customer.percentage?.toFixed(1)}%
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
        {data?.customerAnalysis?.customersByType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribuição de Clientes</Text>
            <Card>
              <CardContent>
                {data.customerAnalysis.customersByType.labels?.map((label: string, index: number) => {
                  const value = data.customerAnalysis.customersByType.datasets[0]?.data[index] || 0;
                  const total = data.customerAnalysis.customersByType.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 1;
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

        {/* Recent Activities */}
        {data?.recentActivities && data.recentActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <Card>
              <CardContent>
                {data.recentActivities.slice(0, 8).map((activity, index: number) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Icon
                        name={activity.type === "ORDER" ? "shopping-cart" : "file-text"}
                        size={16}
                        color="#6b7280"
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDescription}>
                        {activity.description}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleTimeString("pt-BR", {
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
                  Total de Clientes: {data?.customerAnalysis?.totalCustomers?.value || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="shopping-cart" size={20} color="#8b5cf6" />
                <Text style={styles.summaryText}>
                  Total de Pedidos: {data?.orderOverview?.totalOrders?.value || 0}
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
