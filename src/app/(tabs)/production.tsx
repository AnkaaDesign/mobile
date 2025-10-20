import React, { useState } from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useProductionDashboard } from '../../hooks';
import { SECTOR_PRIVILEGES } from '../../constants';
import { formatCurrency } from '../../utils';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { routes } from '../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

interface QuickAccessCardProps {
  title: string;
  icon: string;
  count?: number;
  route: string;
  color?: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, icon, count, route, color }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.primary;

  return (
    <View style={styles.quickAccessCardWrapper}>
      <TouchableOpacity
        onPress={() => router.push(route as any)}
        style={StyleSheet.flatten([
          styles.quickAccessCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ])}
      >
        <View style={styles.quickAccessIcon}>
          <Icon name={icon as any} size="lg" color={iconColor} />
        </View>
        <ThemedText style={styles.quickAccessTitle}>{title}</ThemedText>
        {count !== undefined && (
          <ThemedText style={StyleSheet.flatten([styles.quickAccessCount, { color: iconColor }])}>
            {count}
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function ProductionScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch production dashboard data
  const { data: dashboard, refetch } = useProductionDashboard({
    timePeriod: 'THIS_MONTH',
  });

  const data = dashboard?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]}>
      <SafeAreaView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.headerTitle}>Produção</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Dashboard e acesso rápido
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleRefresh}>
              <Icon name="refresh-cw" size="md" color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Quick Access */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Acesso Rápido</ThemedText>
            <View style={styles.quickAccessGrid}>
              <QuickAccessCard
                title="Cronograma"
                icon="calendar"
                count={data?.overview?.totalTasks?.value || 0}
                route={routeToMobilePath(routes.production.schedule.list)}
                color="#3b82f6"
              />
              <QuickAccessCard
                title="Cortes"
                icon="scissors"
                count={data?.cuttingOperations?.totalCuts?.value || 0}
                route="/production/cutting/list"
                color="#10b981"
              />
              <QuickAccessCard
                title="Aerografia"
                icon="droplet"
                count={data?.airbrushingMetrics?.totalAirbrushJobs?.value || 0}
                route={routeToMobilePath(routes.production.airbrushings.list)}
                color="#8b5cf6"
              />
              <QuickAccessCard
                title="Garagens"
                icon="home"
                count={data?.garageUtilization?.totalGarages?.value || 0}
                route={routeToMobilePath(routes.production.garages.list)}
                color="#f59e0b"
              />
            </View>
          </View>

          {/* Overview Metrics */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Visão Geral</ThemedText>
            <View style={styles.metricsGrid}>
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
                title="Em Espera"
                value={data?.overview?.tasksOnHold?.value || 0}
                icon="pause-circle"
                color="#f59e0b"
                trend={data?.overview?.tasksOnHold?.trend}
                change={data?.overview?.tasksOnHold?.changePercent}
              />
              <DashboardCard
                title="Total"
                value={data?.overview?.totalTasks?.value || 0}
                icon="clipboard"
                color="#8b5cf6"
                trend={data?.overview?.totalTasks?.trend}
                change={data?.overview?.totalTasks?.changePercent}
              />
            </View>
          </View>

          {/* Service Orders */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Ordens de Serviço</ThemedText>
            <View style={styles.metricsGrid}>
              <DashboardCard
                title="Total de OS"
                value={data?.serviceOrders?.totalServiceOrders?.value || 0}
                icon="file-text"
                color="#06b6d4"
              />
              <DashboardCard
                title="Pendentes"
                value={data?.serviceOrders?.pendingServiceOrders?.value || 0}
                icon="clock"
                color="#f59e0b"
              />
              <DashboardCard
                title="Concluídas"
                value={data?.serviceOrders?.completedServiceOrders?.value || 0}
                icon="check"
                color="#10b981"
              />
              <DashboardCard
                title="Serviços/OS"
                value={(data?.serviceOrders?.averageServicesPerOrder?.value || 0).toFixed(1)}
                icon="list"
                color="#8b5cf6"
                unit=""
              />
            </View>
          </View>

          {/* Garage Utilization */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Utilização de Garagens</ThemedText>
            <Card>
              <CardHeader>
                <CardTitle>Ocupação</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.utilizationRow}>
                  <View style={styles.utilizationItem}>
                    <ThemedText style={styles.utilizationLabel}>Total de Vagas</ThemedText>
                    <ThemedText style={styles.utilizationValue}>
                      {data?.garageUtilization?.totalParkingSpots?.value || 0}
                    </ThemedText>
                  </View>
                  <View style={styles.utilizationItem}>
                    <ThemedText style={styles.utilizationLabel}>Vagas Ocupadas</ThemedText>
                    <ThemedText style={styles.utilizationValue}>
                      {data?.garageUtilization?.occupiedSpots?.value || 0}
                    </ThemedText>
                  </View>
                  <View style={styles.utilizationItem}>
                    <ThemedText style={styles.utilizationLabel}>Taxa de Uso</ThemedText>
                    <ThemedText style={StyleSheet.flatten([
                      styles.utilizationValue,
                      {
                        color: (data?.garageUtilization?.utilizationRate?.value || 0) > 80
                          ? "#ef4444"
                          : (data?.garageUtilization?.utilizationRate?.value || 0) > 60
                          ? "#f59e0b"
                          : "#10b981"
                      }
                    ])}>
                      {(data?.garageUtilization?.utilizationRate?.value || 0).toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Revenue */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Receita</ThemedText>
            <View style={styles.metricsGrid}>
              <DashboardCard
                title="Receita Total"
                value={formatCurrency(data?.revenueAnalysis?.totalRevenue?.value || 0)}
                icon="dollar-sign"
                color="#10b981"
                unit=""
                trend={data?.revenueAnalysis?.totalRevenue?.trend}
                change={data?.revenueAnalysis?.totalRevenue?.changePercent}
              />
              <DashboardCard
                title="Valor Médio"
                value={formatCurrency(data?.revenueAnalysis?.averageTaskValue?.value || 0)}
                icon="receipt"
                color="#3b82f6"
                unit=""
                trend={data?.revenueAnalysis?.averageTaskValue?.trend}
                change={data?.revenueAnalysis?.averageTaskValue?.changePercent}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Mais Ações</ThemedText>
            <TouchableOpacity
              onPress={() => router.push("/dashboard/production" as any)}
              style={StyleSheet.flatten([
                styles.actionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ])}
            >
              <View style={styles.actionContent}>
                <Icon name="bar-chart-2" size="lg" color={colors.primary} />
                <View style={styles.actionText}>
                  <ThemedText style={styles.actionTitle}>
                    Análise Completa de Produção
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Ver gráficos e métricas detalhadas
                  </ThemedText>
                </View>
              </View>
              <Icon name="chevron-right" size="md" color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/production/commissions" as any)}
              style={StyleSheet.flatten([
                styles.actionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ])}
            >
              <View style={styles.actionContent}>
                <Icon name="dollar-sign" size="lg" color="#10b981" />
                <View style={styles.actionText}>
                  <ThemedText style={styles.actionTitle}>
                    Comissões
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Acompanhar comissões de produção
                  </ThemedText>
                </View>
              </View>
              <Icon name="chevron-right" size="md" color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  quickAccessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs / 2,
  },
  quickAccessCardWrapper: {
    width: "50%",
    padding: spacing.xs / 2,
  },
  quickAccessCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  quickAccessIcon: {
    marginBottom: spacing.sm,
  },
  quickAccessTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  quickAccessCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs / 2,
  },
  utilizationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  utilizationItem: {
    flex: 1,
    alignItems: "center",
  },
  utilizationLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  utilizationValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  actionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  actionSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginTop: 2,
  },
});
