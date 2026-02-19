import { useState } from "react";
import { ScrollView, RefreshControl, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useServerMetrics, useServerStatus } from "@/hooks/useServer";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { Skeleton } from "@/components/ui/skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";


const quickAccessItems = [
  { title: "Serviços", icon: "settings", route: routes.server.services, color: "#3b82f6" },
  { title: "Usuários", icon: "user-cog", route: routes.server.users.root, color: "#16a34a" },
  { title: "Pastas", icon: "folder-share", route: routes.server.sharedFolders, color: "#a855f7" },
  { title: "Métricas", icon: "chart-line", route: routes.server.metrics, color: "#f97316" },
  { title: "Logs", icon: "file-text", route: routes.server.logs, color: "#ef4444" },
  { title: "Sync BD", icon: "database-import", route: routes.server.databaseSync, color: "#14b8a6" },
  { title: "Backups", icon: "archive", route: routes.server.backup, color: "#06b6d4" },
  { title: "Rate Limit", icon: "shield", route: routes.server.throttler.root, color: "#8b5cf6" },
];

export default function ServidorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: metricsData,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useServerMetrics();

  const {
    data: statusData,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useServerStatus();

  const isLoading = metricsLoading && statusLoading;

  useScreenReady(!isLoading);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMetrics(), refetchStatus()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && !metricsData && !statusData) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {/* System status skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
              <Skeleton height={20} width={160} />
              <Skeleton height={24} width={80} borderRadius={borderRadius.full} />
            </View>
            <Skeleton height={14} width={120} style={{ marginBottom: spacing.sm }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Skeleton height={14} width={100} />
              <Skeleton height={14} width={50} />
            </View>
          </View>

          {/* Resource usage skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md }}>
            <Skeleton height={20} width={140} style={{ marginBottom: spacing.md }} />
            {["CPU", "Memória", "Disco"].map((label) => (
              <View key={label} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs }}>
                  <Skeleton height={14} width={60} />
                  <Skeleton height={14} width={40} />
                </View>
                <Skeleton height={8} width="100%" borderRadius={4} />
              </View>
            ))}
          </View>

          {/* Quick access skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md }}>
            <Skeleton height={20} width={100} style={{ marginBottom: spacing.md }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} height={80} width="30%" borderRadius={borderRadius.md} />
              ))}
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  const metrics = metricsData?.data;
  const status = statusData?.data;

  const cpuUsage = metrics?.cpu?.usage ?? 0;
  const memoryUsage = metrics?.memory?.percentage ?? 0;
  const diskUsage = metrics?.disk?.percentage ?? 0;

  const getHealthColor = (health?: string) => {
    switch (health) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getHealthLabel = (health?: string) => {
    switch (health) {
      case "healthy":
        return "Saudável";
      case "warning":
        return "Atenção";
      case "critical":
        return "Crítico";
      default:
        return "Desconhecido";
    }
  };

  const getUsageColor = (value: number) => {
    if (value > 90) return "#ef4444";
    if (value > 75) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* System Status */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedView className="flex-row items-center gap-2">
                <Icon name="server" size={20} variant="primary" />
                <ThemedText className="text-lg font-semibold">
                  Status do Sistema
                </ThemedText>
              </ThemedView>
              <Badge variant={getHealthColor(status?.overall)}>
                <ThemedText className="text-xs">
                  {getHealthLabel(status?.overall)}
                </ThemedText>
              </Badge>
            </ThemedView>

            {status?.hostname && (
              <ThemedText className="text-sm text-muted-foreground mb-3">
                {status.hostname}
              </ThemedText>
            )}

            {/* Services summary */}
            {status?.services && (
              <ThemedView className="flex-row items-center justify-between">
                <ThemedText className="text-sm text-muted-foreground">
                  Serviços Ativos
                </ThemedText>
                <ThemedText className="text-sm font-semibold">
                  {status.services.healthy}/{status.services.total}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Card>

        {/* Resource Usage */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center gap-2 mb-4">
              <Icon name="activity" size={20} variant="primary" />
              <ThemedText className="text-lg font-semibold">
                Uso de Recursos
              </ThemedText>
            </ThemedView>

            {/* CPU */}
            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedView className="flex-row items-center gap-2">
                  <Icon name="cpu" size={16} variant="muted" />
                  <ThemedText className="text-sm font-medium">CPU</ThemedText>
                </ThemedView>
                <ThemedText
                  className="text-sm font-bold"
                  style={{ color: getUsageColor(cpuUsage) }}
                >
                  {Math.round(cpuUsage)}%
                </ThemedText>
              </ThemedView>
              <Progress value={cpuUsage} style={{ height: 8 }} />
              {metrics?.cpu?.cores && (
                <ThemedText className="text-xs text-muted-foreground mt-1">
                  {metrics.cpu.cores} núcleos
                </ThemedText>
              )}
            </ThemedView>

            {/* Memory */}
            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedView className="flex-row items-center gap-2">
                  <Icon name="server" size={16} variant="muted" />
                  <ThemedText className="text-sm font-medium">
                    Memória
                  </ThemedText>
                </ThemedView>
                <ThemedText
                  className="text-sm font-bold"
                  style={{ color: getUsageColor(memoryUsage) }}
                >
                  {Math.round(memoryUsage)}%
                </ThemedText>
              </ThemedView>
              <Progress value={memoryUsage} style={{ height: 8 }} />
              {metrics?.memory && (
                <ThemedText className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.memory.used)} /{" "}
                  {formatBytes(metrics.memory.total)}
                </ThemedText>
              )}
            </ThemedView>

            {/* Disk */}
            <ThemedView>
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedView className="flex-row items-center gap-2">
                  <Icon name="hard-drive" size={16} variant="muted" />
                  <ThemedText className="text-sm font-medium">Disco</ThemedText>
                </ThemedView>
                <ThemedText
                  className="text-sm font-bold"
                  style={{ color: getUsageColor(diskUsage) }}
                >
                  {Math.round(diskUsage)}%
                </ThemedText>
              </ThemedView>
              <Progress value={diskUsage} style={{ height: 8 }} />
              {metrics?.disk && (
                <ThemedText className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.disk.used)} /{" "}
                  {formatBytes(metrics.disk.total)}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Quick Access Grid */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center gap-2 mb-4">
              <Icon name="dashboard" size={20} variant="primary" />
              <ThemedText className="text-lg font-semibold">
                Ferramentas
              </ThemedText>
            </ThemedView>

            <ThemedView className="flex-row flex-wrap gap-3">
              {quickAccessItems.map((item) => (
                <TouchableOpacity
                  key={item.route}
                  onPress={() =>
                    router.push(routeToMobilePath(item.route) as any)
                  }
                  className="basis-[30%] flex-grow"
                  style={{ minWidth: "30%" }}
                >
                  <Card className="p-3 items-center">
                    <ThemedView
                      className="rounded-lg p-2 mb-2"
                      style={{ backgroundColor: item.color + "20" }}
                    >
                      <Icon name={item.icon} size={24} color={item.color} />
                    </ThemedView>
                    <ThemedText
                      className="text-xs font-medium text-center"
                      numberOfLines={1}
                    >
                      {item.title}
                    </ThemedText>
                  </Card>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
