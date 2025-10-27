import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInventoryDashboard, useItems, useOrders, usePpeDeliveries, useActivities } from '../../../hooks';
import { DashboardCard, QuickActionCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from '../../../utils';
import { DASHBOARD_TIME_PERIOD, ORDER_STATUS, PPE_DELIVERY_STATUS, ACTIVITY_OPERATION } from '../../../constants';
import { usePrivileges } from '../../../hooks/usePrivileges';
import { SECTOR_PRIVILEGES } from '../../../constants';
import { router } from 'expo-router';

export default function WarehouseDashboardScreen() {
  const [timePeriod, setTimePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);
  const { canManageWarehouse, canAccess } = usePrivileges();

  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useInventoryDashboard({
    timePeriod,
    includeInactive: false,
  });

  // Fetch low stock items
  const { data: itemsData, isLoading: itemsLoading, refetch: refetchItems } = useItems({
    where: {
      OR: [
        { quantity: { lte: 0 } }
      ]
    },
    include: { category: true },
    orderBy: { quantity: 'asc' },
    take: 10,
  });

  // Fetch pending orders
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useOrders({
    where: {
      status: { in: [ORDER_STATUS.CREATED, ORDER_STATUS.PARTIALLY_FULFILLED] }
    },
    include: { supplier: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch pending PPE deliveries
  const { data: ppeData, isLoading: ppeLoading, refetch: refetchPpe } = usePpeDeliveries({
    where: {
      status: PPE_DELIVERY_STATUS.PENDING
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch recent stock movements
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useActivities({
    include: { item: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  const isLoading = dashboardLoading || itemsLoading || ordersLoading || ppeLoading || activitiesLoading;
  const error = dashboardError;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchDashboard(), refetchItems(), refetchOrders(), refetchPpe(), refetchActivities()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Privilege guard
  if (!canManageWarehouse) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorMessage}>
            Você não tem permissão para acessar o dashboard de almoxarifado.
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
          <Text style={styles.loadingText}>Carregando dashboard do almoxarifado...</Text>
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
  const items = itemsData?.data || [];
  const orders = ordersData?.data || [];
  const ppeDeliveries = ppeData?.data || [];
  const activities = activitiesData?.data || [];

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
          <Text style={styles.headerTitle}>Almoxarifado</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Nova Movimentação"
              icon="plus-circle"
              color="#3b82f6"
              onPress={() => router.push('/inventory/activities/create' as any)}
            />
            <QuickActionCard
              title="Produtos"
              icon="package"
              color="#10b981"
              onPress={() => router.push('/inventory/products/list' as any)}
            />
            <QuickActionCard
              title="Pedidos"
              icon="shopping-cart"
              color="#f59e0b"
              onPress={() => router.push('/inventory/orders/list' as any)}
              badge={orders.length > 0 ? { text: orders.length.toString(), variant: "destructive" as const } : undefined}
            />
            <QuickActionCard
              title="EPIs"
              icon="shield"
              color="#8b5cf6"
              onPress={() => router.push('/inventory/ppe/list' as any)}
              badge={ppeDeliveries.length > 0 ? { text: ppeDeliveries.length.toString(), variant: "outline" as const } : undefined}
            />
            <QuickActionCard
              title="Fornecedores"
              icon="truck"
              color="#06b6d4"
              onPress={() => router.push('/inventory/suppliers/list' as any)}
            />
            <QuickActionCard
              title="Empréstimos"
              icon="refresh-cw"
              color="#ef4444"
              onPress={() => router.push('/inventory/borrows/list' as any)}
            />
          </View>
        </View>

        {/* Low Stock Alerts */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas de Estoque Baixo</Text>
            <Card>
              <CardHeader>
                <CardTitle>Itens que Precisam de Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/inventory/products/details/${item.id}` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon
                        name={item.quantity === 0 ? "alert-circle" : "alert-triangle"}
                        size={16}
                        color={item.quantity === 0 ? "#ef4444" : "#f59e0b"}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{item.name}</Text>
                      <Text style={styles.activityDescription}>
                        Estoque: {item.quantity || 0} / Ponto de Reposição: {item.reorderPoint || 0}
                        {item.category ? ` • ${item.category.name}` : ""}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Pending Orders */}
        {orders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Pendentes</Text>
            <Card>
              <CardContent>
                {orders.map((order, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/inventory/orders/details/${order.id}` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon name="shopping-cart" size={16} color="#f59e0b" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {order.supplier?.name || "Fornecedor"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {order.status === ORDER_STATUS.CREATED && "Criado"}
                        {order.status === ORDER_STATUS.PARTIALLY_FULFILLED && "Parcialmente Atendido"}
                        {" • "}
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Pending PPE Deliveries */}
        {ppeDeliveries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entregas de EPI Pendentes</Text>
            <Card>
              <CardContent>
                {ppeDeliveries.map((delivery, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/inventory/ppe/deliveries` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon name="shield" size={16} color="#8b5cf6" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {delivery.user?.name || "Funcionário"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        Pendente • {new Date(delivery.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#fef3c7" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#92400e" }]}>
                        Pendente
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Stock Overview */}
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

        {/* Movement Analysis */}
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
            <DashboardCard
              title="Reordenar"
              value={data?.overview?.itemsNeedingReorder?.value || 0}
              icon="refresh"
              color="#8b5cf6"
              trend={data?.overview?.itemsNeedingReorder?.trend}
              change={data?.overview?.itemsNeedingReorder?.changePercent}
            />
            <DashboardCard
              title="Excesso"
              value={data?.overview?.overstockedItems?.value || 0}
              icon="trending-up"
              color="#3b82f6"
              trend={data?.overview?.overstockedItems?.trend}
              change={data?.overview?.overstockedItems?.changePercent}
            />
          </View>
        </View>

        {/* Supplier Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fornecedores e Pedidos</Text>
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

        {/* Top Categories */}
        {data?.categoryBreakdown?.itemsByCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categorias</Text>
            <Card>
              <CardContent>
                {data.categoryBreakdown.itemsByCategory.labels?.slice(0, 5).map((label, index) => {
                  const value = data.categoryBreakdown.itemsByCategory.datasets[0]?.data[index] || 0;
                  const total = data.categoryBreakdown.itemsByCategory.datasets[0]?.data.reduce((a, b) => a + b, 0) || 1;
                  const percentage = (value / total) * 100;

                  return (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryContent}>
                        <Text style={styles.categoryLabel}>{label}</Text>
                        <Text style={styles.categoryValue}>{value} itens</Text>
                      </View>
                      <View style={styles.categoryBar}>
                        <View style={[styles.categoryBarFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Recent Activities */}
        {data?.stockMovements?.recentActivities && data.stockMovements.recentActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <Card>
              <CardContent>
                {data.stockMovements.recentActivities.slice(0, 8).map((activity, index) => (
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

        {/* Critical Alerts */}
        {data?.overview && (data.overview.criticalItems.value > 0 || data.overview.lowStockItems.value > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas de Estoque</Text>
            <Card>
              <CardHeader>
                <CardTitle>Itens que Precisam de Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.alertSummary}>
                  <View style={styles.alertBadge}>
                    <Icon name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.alertBadgeText}>
                      {data.overview.criticalItems.value} Críticos
                    </Text>
                  </View>
                  <View style={[styles.alertBadge, { backgroundColor: "#fef3c7" }]}>
                    <Icon name="alert-triangle" size={20} color="#f59e0b" />
                    <Text style={[styles.alertBadgeText, { color: "#92400e" }]}>
                      {data.overview.lowStockItems.value} Baixos
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertDescription}>
                  Verifique os itens críticos e com estoque baixo para evitar rupturas.
                </Text>
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
  categoryItem: {
    marginBottom: 16,
  },
  categoryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  categoryValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  categoryBar: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 4,
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
  alertSummary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#991b1b",
  },
  alertDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
