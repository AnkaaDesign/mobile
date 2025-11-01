import { useState } from 'react';
import { ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMetrics, getHealthHistory } from '../../../api-client';
import { ThemedView } from '@/components/ui/themed-view';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ErrorScreen } from '@/components/ui/error-screen';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { Badge } from '@/components/ui/badge';

Dimensions.get('window');

interface ResourceMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  network: {
    interfaces: Array<{
      name: string;
      ip: string;
      mac?: string;
      rx: number;
      tx: number;
    }>;
  };
  uptime: number;
  hostname: string;
}

export default function ServerResourcesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  // Query for current metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: getMetrics,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time data
  });

  // Query for historical data
  const { data: historyData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['systemMetricsHistory', selectedTimeRange],
    queryFn: () => {
      const hours = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '6h' ? 6 : 24;
      return getHealthHistory(hours);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isLoading = metricsLoading || historyLoading;
  const hasError = metricsError || historyError;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchMetrics(),
        refetchHistory(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex as keyof typeof units]}`;
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return '#ef4444'; // red
    if (usage >= 75) return '#f59e0b'; // amber
    return '#16a34a'; // green
  };

  const getLoadColor = (load: number, cores: number) => {
    const normalized = load / cores;
    if (normalized >= 1.5) return '#ef4444'; // red
    if (normalized >= 1.0) return '#f59e0b'; // amber
    return '#16a34a'; // green
  };

  const getUsageVariant = (usage: number) => {
    if (usage >= 90) return 'destructive';
    if (usage >= 75) return 'warning';
    return 'default';
  };

  if (isLoading && !metricsData && !historyData) {
    return <LoadingScreen message="Carregando recursos do sistema..." />;
  }

  if (hasError && !metricsData && !historyData) {
    return (
      <ErrorScreen
        title="Erro ao carregar recursos"
        message="Não foi possível carregar os dados de recursos do sistema"
        onRetry={handleRefresh}
      />
    );
  }

  const metrics = metricsData?.data as ResourceMetrics | undefined;
  const history = historyData?.data || [];

  const cpuUsage = metrics?.cpu?.usage || 0;
  const memoryUsage = metrics?.memory?.percentage || 0;
  const diskUsage = metrics?.disk?.percentage || 0;
  const load = metrics?.cpu?.loadAverage?.[0] || 0;
  const cores = metrics?.cpu?.cores || 1;

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Time Range Selector */}
        <ThemedView className="flex-row justify-center mb-4 gap-2">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <ThemedView
              key={range}
              className={`px-4 py-2 rounded-md border ${
                selectedTimeRange === range
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
              onTouchEnd={() => setSelectedTimeRange(range)}
            >
              <ThemedText
                className={`text-sm ${
                  selectedTimeRange === range ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {range}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {/* Resource Overview Cards */}
        <ThemedView className="flex-row flex-wrap gap-2 mb-4">
          <DashboardCard
            title="CPU"
            value={`${Math.round(cpuUsage)}%`}
            icon="cpu"
            color={getUsageColor(cpuUsage)}
            style={{ flex: 1, minWidth: '45%' }}
          />

          <DashboardCard
            title="Memória"
            value={`${Math.round(memoryUsage)}%`}
            icon="hard-drive"
            color={getUsageColor(memoryUsage)}
            style={{ flex: 1, minWidth: '45%' }}
          />

          <DashboardCard
            title="Disco"
            value={`${Math.round(diskUsage)}%`}
            icon="database"
            color={getUsageColor(diskUsage)}
            style={{ flex: 1, minWidth: '45%' }}
          />

          <DashboardCard
            title="Carga"
            value={load.toFixed(2)}
            icon="activity"
            color={getLoadColor(load, cores)}
            style={{ flex: 1, minWidth: '45%' }}
          />
        </ThemedView>

        {/* CPU Details */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold">CPU</ThemedText>
              <Badge variant={getUsageVariant(cpuUsage)}>
                <ThemedText className="text-xs">{Math.round(cpuUsage)}%</ThemedText>
              </Badge>
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm">Uso atual</ThemedText>
                <ThemedText className="text-sm font-medium">{cpuUsage.toFixed(1)}%</ThemedText>
              </ThemedView>
              <Progress value={cpuUsage} style={{ height: 12 }} />
            </ThemedView>

            <ThemedView className="flex-row justify-between">
              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Núcleos</ThemedText>
                <ThemedText className="text-base font-medium">{cores}</ThemedText>
              </ThemedView>

              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Carga média</ThemedText>
                <ThemedText className="text-base font-medium">{load.toFixed(2)}</ThemedText>
              </ThemedView>

              {metrics?.cpu?.temperature && (
                <ThemedView>
                  <ThemedText className="text-sm text-muted-foreground">Temperatura</ThemedText>
                  <ThemedText className="text-base font-medium">
                    {Math.round(metrics?.cpu.temperature)}°C
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Memory Details */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold">Memória</ThemedText>
              <Badge variant={getUsageVariant(memoryUsage)}>
                <ThemedText className="text-xs">{Math.round(memoryUsage)}%</ThemedText>
              </Badge>
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm">Uso atual</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.memory?.used || 0)} / {formatBytes(metrics?.memory?.total || 0)}
                </ThemedText>
              </ThemedView>
              <Progress value={memoryUsage} style={{ height: 12 }} />
            </ThemedView>

            <ThemedView className="flex-row justify-between">
              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Total</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatBytes(metrics?.memory?.total || 0)}
                </ThemedText>
              </ThemedView>

              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Usada</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatBytes(metrics?.memory?.used || 0)}
                </ThemedText>
              </ThemedView>

              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Disponível</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatBytes(metrics?.memory?.available || 0)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Disk Details */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold">Armazenamento</ThemedText>
              <Badge variant={getUsageVariant(diskUsage)}>
                <ThemedText className="text-xs">{Math.round(diskUsage)}%</ThemedText>
              </Badge>
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm">Uso atual</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.disk?.used || 0)} / {formatBytes(metrics?.disk?.total || 0)}
                </ThemedText>
              </ThemedView>
              <Progress value={diskUsage} style={{ height: 12 }} />
            </ThemedView>

            <ThemedView className="flex-row justify-between">
              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Total</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatBytes(metrics?.disk?.total || 0)}
                </ThemedText>
              </ThemedView>

              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Usado</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatBytes(metrics?.disk?.used || 0)}
                </ThemedText>
              </ThemedView>

              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Disponível</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatBytes(metrics?.disk?.available || 0)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Network Details */}
        {metrics?.network?.interfaces && metrics.network.interfaces.length > 0 && (
          <Card className="mb-4">
            <ThemedView className="p-4">
              <ThemedText className="text-lg font-semibold mb-4">Rede</ThemedText>

              {metrics.network.interfaces.map((interface_, index) => (
                <ThemedView key={interface_.name || index} className={index > 0 ? "mt-4" : ""}>
                  <ThemedText className="text-sm font-medium mb-2">
                    {interface_.name} ({interface_.ip})
                  </ThemedText>

                  <ThemedView className="flex-row justify-between">
                    <ThemedView className="flex-1 mr-2">
                      <ThemedView className="items-center p-3 bg-success/10 rounded-md">
                        <Icon name="download" size={24} className="text-success mb-1" />
                        <ThemedText className="text-sm text-muted-foreground">RX</ThemedText>
                        <ThemedText className="text-base font-medium">
                          {formatBytes(interface_.rx)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>

                    <ThemedView className="flex-1 ml-2">
                      <ThemedView className="items-center p-3 bg-primary/10 rounded-md">
                        <Icon name="upload" size={24} className="text-primary mb-1" />
                        <ThemedText className="text-sm text-muted-foreground">TX</ThemedText>
                        <ThemedText className="text-base font-medium">
                          {formatBytes(interface_.tx)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>
          </Card>
        )}

        {/* Historical Data Summary */}
        {history.length > 0 && (
          <Card>
            <ThemedView className="p-4">
              <ThemedText className="text-lg font-semibold mb-4">
                Histórico ({selectedTimeRange})
              </ThemedText>

              <ThemedView className="space-y-3">
                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm">Amostras coletadas</ThemedText>
                  <ThemedText className="text-sm font-medium">{history.length}</ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm">CPU médio</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {(history.reduce((sum, h) => sum + (h.resources?.cpu || 0), 0) / history.length).toFixed(1)}%
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm">Memória média</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {(history.reduce((sum, h) => sum + (h.resources?.memory || 0), 0) / history.length).toFixed(1)}%
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm">Última atualização</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {new Date(history[0]?.lastUpdated || Date.now()).toLocaleTimeString('pt-BR')}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}