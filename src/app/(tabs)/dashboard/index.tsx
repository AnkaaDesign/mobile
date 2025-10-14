import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnifiedDashboard, usePrivileges } from '../../../hooks';
import { DashboardCard, QuickActionCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from '../../../utils';
import { router } from 'expo-router';
import { SECTOR_PRIVILEGES } from '../../../constants';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: dashboard, isLoading, error, refetch } = useUnifiedDashboard();
  const {
    isAdmin,
    isLeader,
    isHR,
    isWarehouse,
    isProduction,
    canManageProduction,
    canManageWarehouse,
    canManageHR,
    canViewStatistics,
    currentPrivilege,
  } = usePrivileges();

  // Auto-redirect to sector-specific dashboard based on privileges
  useEffect(() => {
    if (!isLoading && currentPrivilege) {
      // Redirect logic based on highest privilege
      if (isAdmin) {
        // Admin sees unified dashboard - no redirect
        return;
      } else if (isLeader) {
        router.replace('/dashboard/leader' as any);
      } else if (isHR) {
        router.replace('/dashboard/human-resources' as any);
      } else if (isWarehouse) {
        router.replace('/dashboard/warehouse' as any);
      } else if (isProduction) {
        router.replace('/dashboard/production' as any);
      }
    }
  }, [isLoading, currentPrivilege, isAdmin, isLeader, isHR, isWarehouse, isProduction]);

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
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Erro ao carregar dashboard</Text>
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
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Funcionários Ativos"
              value={data?.hr?.overview?.activeEmployees?.value || 0}
              icon="users"
              color="#16a34a"
              trend={data?.hr?.overview?.activeEmployees?.trend}
              change={data?.hr?.overview?.activeEmployees?.changePercent}
            />
            <DashboardCard
              title="Tarefas em Produção"
              value={data?.production?.taskSummary?.tasksInProduction?.value || 0}
              icon="settings"
              color="#3b82f6"
              trend={data?.production?.taskSummary?.tasksInProduction?.trend}
              change={data?.production?.taskSummary?.tasksInProduction?.changePercent}
            />
            <DashboardCard
              title="Pedidos Pendentes"
              value={data?.administration?.orderSummary?.pendingOrders?.value || 0}
              icon="shopping-cart"
              color="#f59e0b"
              trend={data?.administration?.orderSummary?.pendingOrders?.trend}
              change={data?.administration?.orderSummary?.pendingOrders?.changePercent}
            />
            <DashboardCard
              title="Receita Total"
              value={formatCurrency(data?.administration?.revenue || 0)}
              icon="currency-dollar"
              color="#10b981"
              unit=""
            />
          </View>
        </View>

        {/* Production Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produção</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Tarefas"
              value={data?.production?.taskSummary?.totalTasks?.value || 0}
              icon="clipboard"
              color="#8b5cf6"
              trend={data?.production?.taskSummary?.totalTasks?.trend}
              change={data?.production?.taskSummary?.totalTasks?.changePercent}
            />
            <DashboardCard
              title="Tarefas Concluídas"
              value={data?.production?.taskSummary?.tasksCompleted?.value || 0}
              icon="check-circle"
              color="#10b981"
              trend={data?.production?.taskSummary?.tasksCompleted?.trend}
              change={data?.production?.taskSummary?.tasksCompleted?.changePercent}
            />
            <DashboardCard
              title="Utilização Garage"
              value={`${(data?.production?.garageUtilization || 0).toFixed(1)}%`}
              icon="home"
              color="#f59e0b"
              unit=""
            />
            <DashboardCard
              title="Ordens de Serviço"
              value={data?.production?.activeServiceOrders || 0}
              icon="tool"
              color="#ef4444"
            />
          </View>
        </View>

        {/* Inventory Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estoque</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total de Itens"
              value={data?.inventory?.overview?.totalItems?.value || 0}
              icon="package"
              color="#6366f1"
              trend={data?.inventory?.overview?.totalItems?.trend}
              change={data?.inventory?.overview?.totalItems?.changePercent}
            />
            <DashboardCard
              title="Itens Críticos"
              value={data?.inventory?.criticalAlerts?.filter(alert => alert.alertType === 'critical').length || 0}
              icon="alert-triangle"
              color="#ef4444"
              badge={
                (data?.inventory?.criticalAlerts?.filter(alert => alert.alertType === 'critical').length || 0) > 0
                  ? { text: "!", variant: "destructive" as const }
                  : undefined
              }
            />
            <DashboardCard
              title="Estoque Baixo"
              value={data?.inventory?.criticalAlerts?.filter(alert => alert.alertType === 'low_stock').length || 0}
              icon="trending-down"
              color="#f59e0b"
              badge={
                (data?.inventory?.criticalAlerts?.filter(alert => alert.alertType === 'low_stock').length || 0) > 0
                  ? { text: "!", variant: "outline" as const }
                  : undefined
              }
            />
            <DashboardCard
              title="Valor Total"
              value={formatCurrency(data?.inventory?.overview?.totalValue?.value || 0)}
              icon="currency-dollar"
              color="#10b981"
              unit=""
            />
          </View>
        </View>

        {/* Paint Production */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produção de Tinta</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Produções Total"
              value={data?.paint?.productionSummary?.totalProductions || 0}
              icon="droplet"
              color="#06b6d4"
            />
            <DashboardCard
              title="Volume (Litros)"
              value={formatNumber(data?.paint?.productionSummary?.totalVolumeLiters || 0)}
              icon="beaker"
              color="#8b5cf6"
              unit="L"
            />
            <DashboardCard
              title="Fórmulas Ativas"
              value={data?.paint?.activeFormulas || 0}
              icon="flask"
              color="#f59e0b"
            />
          </View>
        </View>

        {/* Quick Actions - Sector Dashboards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboards por Setor</Text>
          <View style={styles.quickActionsGrid}>
            {canManageProduction && (
              <QuickActionCard
                title="Produção"
                icon="settings"
                color="#3b82f6"
                onPress={() => router.push('/dashboard/production' as any)}
              />
            )}
            {canManageWarehouse && (
              <QuickActionCard
                title="Almoxarifado"
                icon="package"
                color="#16a34a"
                onPress={() => router.push('/dashboard/warehouse' as any)}
              />
            )}
            {(isLeader || isAdmin) && (
              <QuickActionCard
                title="Liderança"
                icon="users"
                color="#f59e0b"
                onPress={() => router.push('/dashboard/leader' as any)}
              />
            )}
            {canManageHR && (
              <QuickActionCard
                title="RH"
                icon="user-check"
                color="#8b5cf6"
                onPress={() => router.push('/dashboard/human-resources' as any)}
              />
            )}
            {canViewStatistics && (
              <QuickActionCard
                title="Finanças"
                icon="currency-dollar"
                color="#10b981"
                onPress={() => router.push('/dashboard/financial' as any)}
              />
            )}
            {isAdmin && (
              <QuickActionCard
                title="Administração"
                icon="briefcase"
                color="#ef4444"
                onPress={() => router.push('/dashboard/administration' as any)}
              />
            )}
          </View>
        </View>

        {/* Critical Alerts */}
        {data?.inventory?.criticalAlerts && data.inventory.criticalAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas Críticos</Text>
            <Card>
              <CardHeader>
                <CardTitle>Itens que Precisam de Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                {data.inventory.criticalAlerts.slice(0, 5).map((alert, index) => (
                  <View key={index} style={styles.alertItem}>
                    <View style={styles.alertIcon}>
                      <Icon
                        name={alert.alertType === 'critical' ? 'alert-circle' : 'alert-triangle'}
                        size={20}
                        color={alert.alertType === 'critical' ? '#ef4444' : '#f59e0b'}
                      />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>{alert.itemName}</Text>
                      <Text style={styles.alertDescription}>
                        Estoque: {alert.currentQuantity} / Mínimo: {alert.threshold}
                      </Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}
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
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
});