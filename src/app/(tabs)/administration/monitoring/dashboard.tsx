import React, { useCallback, useState } from "react";
import { View, ScrollView, RefreshControl, Pressable , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconServer,
  IconCpu,
  IconActivity,
  IconDatabase,
  IconShield,
  IconCloudUpload,
  IconWifi,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
} from "@tabler/icons-react-native";
import {
  ThemedView,
  ThemedText,
  Card,
  Badge,
  ErrorScreen,
  DashboardCard
} from "@/components/ui";
import { useMonitoringDashboard } from "@/hooks/monitoring";
import { useTheme } from "@/lib/theme";
import { formatRelativeTime, formatCurrency } from '../../../../utils';

export default function MonitoringDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    systemHealth,
    systemMetrics,
    systemServices,
    ssdHealth,
    raidStatus,
    isLoading,
    isError,
    error,
  } = useMonitoringDashboard();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        systemHealth.refetch(),
        systemMetrics.refetch(),
        systemServices.refetch(),
        ssdHealth.refetch(),
        raidStatus.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [systemHealth, systemMetrics, systemServices, ssdHealth, raidStatus]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'good':
      case 'active':
      case 'running':
        return colors.success;
      case 'warning':
      case 'degraded':
        return colors.warning;
      case 'critical':
      case 'error':
      case 'failed':
      case 'inactive':
        return colors.destructive;
      default:
        return colors.muted;
    }
  };

  const getStatusIcon = (status: string, size: number = 20) => {
    const color = getStatusColor(status);
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'good':
      case 'active':
      case 'running':
        return <IconCircleCheck size={size} color={color} />;
      case 'warning':
      case 'degraded':
        return <IconAlertTriangle size={size} color={color} />;
      case 'critical':
      case 'error':
      case 'failed':
      case 'inactive':
        return <IconCircleX size={size} color={color} />;
      default:
        return <IconClock size={size} color={color} />;
    }
  };

  if (isError) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
        <ErrorScreen
          message="Erro ao carregar dados de monitoramento"
          detail={error?.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const healthData = systemHealth.data?.data;
  const metricsData = systemMetrics.data?.data;
  const servicesData = systemServices.data?.data;
  const ssdData = ssdHealth.data?.data;
  const raidData = raidStatus.data?.data;

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* System Health Overview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Visão Geral do Sistema</ThemedText>

          <Card style={StyleSheet.flatten([styles.overviewCard, { borderColor: colors.border }])}>
            <View style={styles.overviewHeader}>
              <IconServer size={24} color={colors.primary} />
              <ThemedText style={styles.overviewTitle}>Estado Geral</ThemedText>
              {healthData?.overall && (
                <Badge
                  style={{ backgroundColor: getStatusColor(healthData.overall) }}
                  variant="secondary"
                >
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: 'white' }])}>
                    {healthData.overall.toUpperCase()}
                  </ThemedText>
                </Badge>
              )}
            </View>

            {healthData?.lastUpdated && (
              <ThemedText style={styles.lastUpdate}>
                Última verificação: {formatRelativeTime(new Date(healthData.lastUpdated))}
              </ThemedText>
            )}
          </Card>
        </View>

        {/* System Metrics Cards */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Métricas do Sistema</ThemedText>

          <View style={styles.grid}>
            {/* CPU Usage */}
            <DashboardCard
              title="CPU"
              value={metricsData?.cpu?.usage ? `${Math.round(metricsData.cpu.usage)}%` : "N/A"}
              icon="cpu"
              trend={metricsData?.cpu?.usage ? (metricsData.cpu.usage > 80 ? "up" : "stable") : undefined}
              style={styles.metricCard}
            />

            {/* Memory Usage */}
            <DashboardCard
              title="Memória"
              value={metricsData?.memory?.percentage ? `${Math.round(metricsData.memory.percentage)}%` : "N/A"}
              icon="activity"
              trend={metricsData?.memory?.percentage ? (metricsData.memory.percentage > 85 ? "up" : "stable") : undefined}
              style={styles.metricCard}
            />

            {/* Disk Usage */}
            <DashboardCard
              title="Disco"
              value={metricsData?.disk?.percentage ? `${Math.round(metricsData.disk.percentage)}%` : "N/A"}
              icon="database"
              trend={metricsData?.disk?.percentage ? (metricsData.disk.percentage > 90 ? "up" : "stable") : undefined}
              style={styles.metricCard}
            />

            {/* System Load */}
            <DashboardCard
              title="Carga"
              value={metricsData?.cpu?.loadAverage ? metricsData.cpu.loadAverage[0]?.toFixed(2) : "N/A"}
              icon="server"
              trend={metricsData?.cpu?.loadAverage ? (metricsData.cpu.loadAverage[0] > 2 ? "up" : "stable") : undefined}
              style={styles.metricCard}
            />
          </View>
        </View>

        {/* Hardware Status */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Status do Hardware</ThemedText>

          <View style={styles.hardwareGrid}>
            {/* SSD Health */}
            <Pressable
              style={StyleSheet.flatten([styles.hardwareCard, { backgroundColor: colors.card, borderColor: colors.border }])}
              onPress={() => router.push("/administration/monitoring/hardware" as any)}
            >
              <View style={styles.hardwareHeader}>
                <IconServer size={20} color={colors.foreground} />
                <ThemedText style={styles.hardwareTitle}>SSD</ThemedText>
                {ssdData && Array.isArray(ssdData) && ssdData.length > 0 && (
                  <View style={styles.statusContainer}>
                    {getStatusIcon(ssdData[0]?.health?.overall || "unknown", 16)}
                  </View>
                )}
              </View>
              <ThemedText style={styles.hardwareSubtitle}>
                {ssdData && Array.isArray(ssdData) ? `${ssdData.length} dispositivos` : "Carregando..."}
              </ThemedText>
            </Pressable>

            {/* RAID Status */}
            <Pressable
              style={StyleSheet.flatten([styles.hardwareCard, { backgroundColor: colors.card, borderColor: colors.border }])}
              onPress={() => router.push("/administration/monitoring/hardware" as any)}
            >
              <View style={styles.hardwareHeader}>
                <IconShield size={20} color={colors.foreground} />
                <ThemedText style={styles.hardwareTitle}>RAID</ThemedText>
                {raidData && Array.isArray(raidData) && raidData.length > 0 && (
                  <View style={styles.statusContainer}>
                    {getStatusIcon(raidData[0]?.overall?.status || "unknown", 16)}
                  </View>
                )}
              </View>
              <ThemedText style={styles.hardwareSubtitle}>
                {raidData && Array.isArray(raidData) ? `${raidData.length} arrays` : "Carregando..."}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Services Overview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Serviços</ThemedText>

          <Pressable
            style={StyleSheet.flatten([styles.servicesCard, { backgroundColor: colors.card, borderColor: colors.border }])}
            onPress={() => router.push("/administration/monitoring/services" as any)}
          >
            <View style={styles.servicesHeader}>
              <IconServer size={24} color={colors.primary} />
              <View style={styles.servicesInfo}>
                <ThemedText style={styles.servicesTitle}>Status dos Serviços</ThemedText>
                {servicesData && Array.isArray(servicesData) && (
                  <ThemedText style={styles.servicesSubtitle}>
                    {servicesData.filter(s => s.status === 'active').length} de {servicesData.length} ativos
                  </ThemedText>
                )}
              </View>
              <View style={styles.servicesBadges}>
                {servicesData && Array.isArray(servicesData) && (
                  <>
                    <Badge style={{ backgroundColor: colors.success }}>
                      <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: 'white' }])}>
                        {servicesData.filter(s => s.status === 'active').length}
                      </ThemedText>
                    </Badge>
                    {servicesData.filter(s => s.status !== 'active').length > 0 && (
                      <Badge style={{ backgroundColor: colors.destructive }}>
                        <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: 'white' }])}>
                          {servicesData.filter(s => s.status !== 'active').length}
                        </ThemedText>
                      </Badge>
                    )}
                  </>
                )}
              </View>
            </View>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ações Rápidas</ThemedText>

          <View style={styles.actionsGrid}>
            <Pressable
              style={StyleSheet.flatten([styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }])}
              onPress={() => router.push("/administration/monitoring/metrics/list")}
            >
              <IconActivity size={24} color={colors.primary} />
              <ThemedText style={styles.actionTitle}>Métricas</ThemedText>
            </Pressable>

            <Pressable
              style={StyleSheet.flatten([styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }])}
              onPress={() => router.push("/administration/monitoring/alerts/list")}
            >
              <IconAlertTriangle size={24} color={colors.warning} />
              <ThemedText style={styles.actionTitle}>Alertas</ThemedText>
            </Pressable>

            <Pressable
              style={StyleSheet.flatten([styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }])}
              onPress={() => router.push("/administration/monitoring/logs/list")}
            >
              <IconDatabase size={24} color={colors.foreground} />
              <ThemedText style={styles.actionTitle}>Logs</ThemedText>
            </Pressable>

            <Pressable
              style={StyleSheet.flatten([styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }])}
              onPress={() => router.push("/administration/backups/list")}
            >
              <IconCloudUpload size={24} color={colors.primary} />
              <ThemedText style={styles.actionTitle}>Backups</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  overviewCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  lastUpdate: {
    fontSize: 14,
    opacity: 0.7,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
  },
  hardwareGrid: {
    flexDirection: "row",
    gap: 12,
  },
  hardwareCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  hardwareHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  hardwareTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  hardwareSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  servicesCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  servicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  servicesInfo: {
    flex: 1,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  servicesSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  servicesBadges: {
    flexDirection: "row",
    gap: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});