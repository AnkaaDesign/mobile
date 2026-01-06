import { useState, useMemo, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMetrics, getCpuTemperature, getSsdHealth, getRaidStatus, getHealthHistory } from '../../../api-client';
import { ThemedView } from '@/components/ui/themed-view';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ErrorScreen } from '@/components/ui/error-screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { useToast } from '@/hooks/use-toast';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Types
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

interface SsdHealthData {
  device: string;
  model: string;
  capacity: string;
  health: {
    overall: 'PASSED' | 'FAILED' | 'UNKNOWN';
  };
  temperature: {
    current: number;
    unit: string;
  };
  powerOn: {
    hours: number;
  };
  wearLevel: {
    percentage: number;
  };
  errorCounts: {
    reallocatedSectors: number;
    pendingSectors: number;
    uncorrectableErrors: number;
  };
}

interface RaidArray {
  name: string;
  device: string;
  level: string;
  state: string;
  uuid: string;
  activeDevices: number;
  totalDevices: number;
  failedDevices: number;
  spareDevices: number;
  rebuildProgress?: {
    percentage: number;
    speed: string;
    timeRemaining?: string;
  };
  devices?: Array<{
    device: string;
    role: string;
    state: string;
  }>;
}

interface HistoricalDataPoint {
  timestamp: string;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  lastUpdated: string;
}

type TimeRange = '24h' | '7d' | '30d';

interface AlertThreshold {
  cpu: number;
  memory: number;
  disk: number;
  temperature: number;
}

export default function ServerMetricsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [showAlerts, setShowAlerts] = useState(true);

  // Alert thresholds
  const alertThresholds: AlertThreshold = {
    cpu: 85,
    memory: 85,
    disk: 85,
    temperature: 75,
  };

  // Convert time range to hours
  const getHoursFromTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '24h':
        return 24;
      case '7d':
        return 168; // 7 * 24
      case '30d':
        return 720; // 30 * 24
      default:
        return 24;
    }
  };

  // Query for current metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: getMetrics,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time data
  });

  // Query for CPU temperature
  const { data: temperatureData, isLoading: tempLoading, refetch: refetchTemperature } = useQuery({
    queryKey: ['cpuTemperature'],
    queryFn: getCpuTemperature,
    refetchInterval: 10000,
  });

  // Query for SSD health
  const { data: ssdData, isLoading: ssdLoading, refetch: refetchSsd } = useQuery({
    queryKey: ['ssdHealth'],
    queryFn: getSsdHealth,
    refetchInterval: 60000, // Refresh every minute
  });

  // Query for RAID status
  const { data: raidData, isLoading: raidLoading, refetch: refetchRaid } = useQuery({
    queryKey: ['raidStatus'],
    queryFn: getRaidStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query for historical data
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['systemMetricsHistory', selectedTimeRange],
    queryFn: () => getHealthHistory(getHoursFromTimeRange(selectedTimeRange)),
    refetchInterval: 60000, // Refresh every minute
  });

  const isLoading = metricsLoading || tempLoading || ssdLoading || raidLoading || historyLoading;
  const hasError = metricsError;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        refetchMetrics(),
        refetchTemperature(),
        refetchSsd(),
        refetchRaid(),
        refetchHistory(),
      ]);
      Alert.alert('Sucesso', 'Métricas atualizadas');
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      Alert.alert('Erro', 'Erro ao atualizar métricas');
    } finally {
      setRefreshing(false);
    }
  };

  // Export metrics data
  const handleExport = useCallback(async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        timeRange: selectedTimeRange,
        currentMetrics: {
          cpu: metrics?.cpu,
          memory: metrics?.memory,
          disk: metrics?.disk,
          temperature: temperatureData?.data,
          uptime: metrics?.uptime,
          hostname: metrics?.hostname,
        },
        ssdHealth: ssdData?.data,
        raidStatus: raidData?.data,
        historicalData: history.map((h) => ({
          timestamp: h.timestamp,
          cpu: h.resources?.cpu || 0,
          memory: h.resources?.memory || 0,
          disk: h.resources?.disk || 0,
        })),
        alerts: alerts,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `metricas-servidor-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Exportar Métricas do Servidor',
          });
        } else {
          Alert.alert('Arquivo salvo', `Salvo em: ${fileName}`);
        }
      }

      Alert.alert('Sucesso', 'Métricas exportadas com sucesso');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Erro', 'Erro ao exportar métricas');
    }
  }, [metrics, temperatureData, ssdData, raidData, history, alerts, selectedTimeRange]);

  // Utility functions
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 80) return '#ef4444'; // red
    if (temp >= 70) return '#f59e0b'; // amber
    if (temp >= 60) return '#fb923c'; // orange
    return '#16a34a'; // green
  };

  const getUsageVariant = (usage: number): 'default' | 'warning' | 'destructive' => {
    if (usage >= 90) return 'destructive';
    if (usage >= 75) return 'warning';
    return 'default';
  };

  const getSsdHealthPercentage = (ssd: SsdHealthData): number => {
    let healthScore = 100;

    if (ssd.health.overall === 'FAILED') {
      healthScore -= 40;
    } else if (ssd.health.overall !== 'PASSED') {
      healthScore -= 20;
    }

    if (ssd.wearLevel?.percentage !== undefined) {
      const wearPenalty = (ssd.wearLevel.percentage / 100) * 30;
      healthScore -= wearPenalty;
    }

    if (ssd.temperature?.current) {
      const temp = ssd.temperature.current;
      if (temp > 70) healthScore -= 15;
      else if (temp > 60) healthScore -= 10;
      else if (temp > 50) healthScore -= 5;
    }

    const hasErrors =
      ssd.errorCounts?.reallocatedSectors > 0 ||
      ssd.errorCounts?.pendingSectors > 0 ||
      ssd.errorCounts?.uncorrectableErrors > 0;
    if (hasErrors) healthScore -= 15;

    return Math.max(0, Math.min(100, Math.round(healthScore)));
  };

  // Get metrics with defaults
  const metrics = metricsData?.data as ResourceMetrics | undefined;
  const cpuUsage = metrics?.cpu?.usage || 0;
  const memoryUsage = metrics?.memory?.percentage || 0;
  const diskUsage = metrics?.disk?.percentage || 0;
  const temperature = temperatureData?.data?.primary?.value || metrics?.cpu?.temperature || 0;
  const load = metrics?.cpu?.loadAverage?.[0] || 0;
  const cores = metrics?.cpu?.cores || 1;
  // Convert SystemHealth[] to HistoricalDataPoint[] format
  const history: HistoricalDataPoint[] = (historyData?.data || []).map((item: any) => ({
    timestamp: item.createdAt || item.timestamp || new Date().toISOString(),
    resources: {
      cpu: item.resources?.cpu || 0,
      memory: item.resources?.memory || 0,
      disk: item.resources?.disk || 0,
    },
    lastUpdated: item.lastUpdated || item.createdAt || new Date().toISOString(),
  }));

  // Calculate alerts
  const alerts = useMemo(() => {
    const alertList: Array<{ type: string; message: string; severity: 'warning' | 'critical' }> = [];

    if (cpuUsage >= alertThresholds.cpu) {
      alertList.push({
        type: 'CPU',
        message: `Uso de CPU em ${cpuUsage.toFixed(1)}%`,
        severity: cpuUsage >= 95 ? 'critical' : 'warning',
      });
    }

    if (memoryUsage >= alertThresholds.memory) {
      alertList.push({
        type: 'Memória',
        message: `Uso de memória em ${memoryUsage.toFixed(1)}%`,
        severity: memoryUsage >= 95 ? 'critical' : 'warning',
      });
    }

    if (diskUsage >= alertThresholds.disk) {
      alertList.push({
        type: 'Disco',
        message: `Uso de disco em ${diskUsage.toFixed(1)}%`,
        severity: diskUsage >= 95 ? 'critical' : 'warning',
      });
    }

    if (temperature >= alertThresholds.temperature) {
      alertList.push({
        type: 'Temperatura',
        message: `Temperatura da CPU em ${temperature.toFixed(1)}°C`,
        severity: temperature >= 85 ? 'critical' : 'warning',
      });
    }

    // Check RAID status
    if (raidData?.data) {
      const raidOverall = raidData.data.overall;
      if (raidOverall?.failedArrays > 0) {
        alertList.push({
          type: 'RAID',
          message: `${raidOverall.failedArrays} array(s) RAID com falha`,
          severity: 'critical',
        });
      } else if (raidOverall?.degradedArrays > 0) {
        alertList.push({
          type: 'RAID',
          message: `${raidOverall.degradedArrays} array(s) RAID degradado(s)`,
          severity: 'warning',
        });
      }
    }

    // Check SSD health
    if (ssdData?.data && Array.isArray(ssdData.data)) {
      ssdData.data.forEach((ssd) => {
        const health = getSsdHealthPercentage(ssd);
        if (health < 60) {
          alertList.push({
            type: 'SSD',
            message: `${ssd.device.replace('/dev/', '')} saúde em ${health}%`,
            severity: health < 40 ? 'critical' : 'warning',
          });
        }
      });
    }

    return alertList;
  }, [cpuUsage, memoryUsage, diskUsage, temperature, raidData, ssdData]);

  // Calculate historical averages
  const historicalAverages = useMemo(() => {
    if (!history || history.length === 0) return { cpu: 0, memory: 0, disk: 0 };

    const cpuSum = history.reduce((sum, h) => {
      const value = h?.resources?.cpu;
      return sum + (typeof value === 'number' && !isNaN(value) ? value : 0);
    }, 0);
    const memorySum = history.reduce((sum, h) => {
      const value = h?.resources?.memory;
      return sum + (typeof value === 'number' && !isNaN(value) ? value : 0);
    }, 0);
    const diskSum = history.reduce((sum, h) => {
      const value = h?.resources?.disk;
      return sum + (typeof value === 'number' && !isNaN(value) ? value : 0);
    }, 0);

    return {
      cpu: cpuSum / history.length,
      memory: memorySum / history.length,
      disk: diskSum / history.length,
    };
  }, [history]);

  if (isLoading && !metricsData) {
    return <LoadingScreen message="Carregando métricas do servidor..." />;
  }

  if (hasError && !metricsData) {
    return (
      <ErrorScreen
        title="Erro ao carregar métricas"
        message="Não foi possível carregar os dados de métricas do sistema"
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header Actions */}
        <ThemedView className="flex-row justify-between items-center mb-4">
          <ThemedText className="text-2xl font-bold">Métricas do Sistema</ThemedText>
          <Button
            onPress={handleExport}
            variant="outline"
            className="px-3 py-2"
          >
            <Icon name="download" size={18} />
            <ThemedText className="ml-2 text-sm">Exportar</ThemedText>
          </Button>
        </ThemedView>

        {/* Alerts Section */}
        {showAlerts && alerts.length > 0 && (
          <Card className="mb-4 border-2 border-destructive bg-destructive/10">
            <ThemedView className="p-4">
              <ThemedView className="flex-row justify-between items-center mb-3">
                <ThemedView className="flex-row items-center">
                  <Icon name="alert-triangle" size={20} className="text-destructive mr-2" />
                  <ThemedText className="text-lg font-semibold text-destructive">
                    Alertas do Sistema ({alerts.length})
                  </ThemedText>
                </ThemedView>
                <Button
                  onPress={() => setShowAlerts(false)}
                  variant="ghost"
                  className="p-1"
                >
                  <Icon name="x" size={18} />
                </Button>
              </ThemedView>

              {alerts.map((alert, index) => (
                <ThemedView
                  key={index}
                  className={`flex-row items-center py-2 ${
                    index < alerts.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'warning'}>
                    <ThemedText className="text-xs">{alert.type}</ThemedText>
                  </Badge>
                  <ThemedText className="ml-3 flex-1">{alert.message}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </Card>
        )}

        {/* Time Range Selector */}
        <ThemedView className="flex-row justify-center mb-4 gap-1 px-2">
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <ThemedView
              key={range}
              className={`flex-1 rounded-md border ${
                selectedTimeRange === range
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
              style={{
                minHeight: 44,
                paddingVertical: 12,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onTouchEnd={() => setSelectedTimeRange(range)}
            >
              <ThemedText
                className={`font-medium ${
                  selectedTimeRange === range ? 'text-primary-foreground' : 'text-foreground'
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  fontSize: 13,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                  lineHeight: 18,
                }}
              >
                {range === '24h' ? '24h' : range === '7d' ? '7 dias' : '30 dias'}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {/* System Overview */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedText className="text-lg font-semibold mb-4">Visão Geral</ThemedText>
            <ThemedView className="flex-row flex-wrap gap-4">
              <ThemedView className="flex-1 min-w-[45%]">
                <ThemedText className="text-sm text-muted-foreground">Hostname</ThemedText>
                <ThemedText className="text-base font-medium">{metrics?.hostname || 'N/A'}</ThemedText>
              </ThemedView>
              <ThemedView className="flex-1 min-w-[45%]">
                <ThemedText className="text-sm text-muted-foreground">Uptime</ThemedText>
                <ThemedText className="text-base font-medium">
                  {formatUptime(metrics?.uptime || 0)}
                </ThemedText>
              </ThemedView>
              <ThemedView className="flex-1 min-w-[45%]">
                <ThemedText className="text-sm text-muted-foreground">Núcleos de CPU</ThemedText>
                <ThemedText className="text-base font-medium">{cores}</ThemedText>
              </ThemedView>
              <ThemedView className="flex-1 min-w-[45%]">
                <ThemedText className="text-sm text-muted-foreground">Interfaces de Rede</ThemedText>
                <ThemedText className="text-base font-medium">
                  {metrics?.network?.interfaces?.length || 0}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* CPU Details */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedView className="flex-row items-center">
                <Icon name="cpu" size={20} className="text-primary mr-2" />
                <ThemedText className="text-lg font-semibold">CPU</ThemedText>
              </ThemedView>
              <Badge variant={getUsageVariant(cpuUsage)} size="md">
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    lineHeight: 18,
                  }}
                >
                  {Math.round(cpuUsage)}%
                </ThemedText>
              </Badge>
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm">Uso atual</ThemedText>
                <ThemedText className="text-sm font-medium">{cpuUsage.toFixed(1)}%</ThemedText>
              </ThemedView>
              <Progress value={cpuUsage} style={{ height: 12 }} />
            </ThemedView>

            <ThemedView className="space-y-2">
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Núcleos</ThemedText>
                <ThemedText className="text-sm font-medium">{cores}</ThemedText>
              </ThemedView>
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Carga média (1m)</ThemedText>
                <ThemedText className="text-sm font-medium">{load.toFixed(2)}</ThemedText>
              </ThemedView>
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Carga média (5m)</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {(metrics?.cpu?.loadAverage?.[1] || 0).toFixed(2)}
                </ThemedText>
              </ThemedView>
              {temperature > 0 && (
                <ThemedView className="flex-row justify-between">
                  <ThemedText className="text-sm text-muted-foreground">Temperatura</ThemedText>
                  <ThemedText
                    className="text-sm font-medium"
                    style={{ color: getTemperatureColor(temperature) }}
                  >
                    {temperature.toFixed(1)}°C
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
              <ThemedView className="flex-row items-center">
                <Icon name="hard-drive" size={20} className="text-success mr-2" />
                <ThemedText className="text-lg font-semibold">Memória</ThemedText>
              </ThemedView>
              <Badge variant={getUsageVariant(memoryUsage)} size="md">
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    lineHeight: 18,
                  }}
                >
                  {Math.round(memoryUsage)}%
                </ThemedText>
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

            <ThemedView className="space-y-2">
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Total</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.memory?.total || 0)}
                </ThemedText>
              </ThemedView>
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Usada</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.memory?.used || 0)}
                </ThemedText>
              </ThemedView>
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Disponível</ThemedText>
                <ThemedText className="text-sm font-medium">
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
              <ThemedView className="flex-row items-center">
                <Icon name="database" size={20} className="text-purple-500 mr-2" />
                <ThemedText className="text-lg font-semibold">Armazenamento</ThemedText>
              </ThemedView>
              <Badge variant={getUsageVariant(diskUsage)} size="md">
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    lineHeight: 18,
                  }}
                >
                  {Math.round(diskUsage)}%
                </ThemedText>
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

            <ThemedView className="space-y-2">
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Total</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.disk?.total || 0)}
                </ThemedText>
              </ThemedView>
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Usado</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.disk?.used || 0)}
                </ThemedText>
              </ThemedView>
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Disponível</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {formatBytes(metrics?.disk?.available || 0)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* SSD Health */}
        {ssdData?.data && Array.isArray(ssdData.data) && ssdData.data.length > 0 && (
          <Card className="mb-4">
            <ThemedView className="p-4">
              <ThemedView className="flex-row items-center mb-4">
                <Icon name="hard-drive" size={20} className="text-indigo-500 mr-2" />
                <ThemedText className="text-lg font-semibold">Saúde dos SSDs</ThemedText>
              </ThemedView>

              {ssdData.data.map((ssd, index) => {
                const healthPercentage = getSsdHealthPercentage(ssd);
                return (
                  <ThemedView
                    key={index}
                    className={`${index > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}
                  >
                    <ThemedView className="flex-row justify-between items-center mb-2">
                      <ThemedText className="text-sm font-semibold">
                        {ssd.device.replace('/dev/', '')}
                      </ThemedText>
                      <Badge
                        variant={
                          ssd.health.overall === 'PASSED'
                            ? 'default'
                            : ssd.health.overall === 'FAILED'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        <ThemedText className="text-xs">{ssd.health.overall}</ThemedText>
                      </Badge>
                    </ThemedView>

                    <ThemedText className="text-xs text-muted-foreground mb-3">
                      {ssd.model} - {ssd.capacity}
                    </ThemedText>

                    <ThemedView className="mb-3">
                      <ThemedView className="flex-row justify-between items-center mb-2">
                        <ThemedText className="text-xs text-muted-foreground">Saúde Geral</ThemedText>
                        <ThemedText
                          className="text-sm font-bold"
                          style={{
                            color:
                              healthPercentage >= 80
                                ? '#16a34a'
                                : healthPercentage >= 60
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        >
                          {healthPercentage}%
                        </ThemedText>
                      </ThemedView>
                      <Progress value={healthPercentage} style={{ height: 8 }} />
                    </ThemedView>

                    <ThemedView className="space-y-1">
                      {ssd.temperature?.current && (
                        <ThemedView className="flex-row justify-between">
                          <ThemedText className="text-xs text-muted-foreground">Temperatura</ThemedText>
                          <ThemedText
                            className="text-xs font-medium"
                            style={{ color: getTemperatureColor(ssd.temperature.current) }}
                          >
                            {ssd.temperature.current}°{ssd.temperature.unit}
                          </ThemedText>
                        </ThemedView>
                      )}
                      {ssd.powerOn?.hours && (
                        <ThemedView className="flex-row justify-between">
                          <ThemedText className="text-xs text-muted-foreground">Power On</ThemedText>
                          <ThemedText className="text-xs font-medium">
                            {Math.floor(ssd.powerOn.hours / 24).toLocaleString()}d
                          </ThemedText>
                        </ThemedView>
                      )}
                      {ssd.wearLevel?.percentage !== undefined && (
                        <ThemedView className="flex-row justify-between">
                          <ThemedText className="text-xs text-muted-foreground">Desgaste</ThemedText>
                          <ThemedText
                            className="text-xs font-medium"
                            style={{
                              color:
                                ssd.wearLevel.percentage > 80
                                  ? '#ef4444'
                                  : ssd.wearLevel.percentage > 60
                                  ? '#f59e0b'
                                  : '#16a34a',
                            }}
                          >
                            {ssd.wearLevel.percentage}%
                          </ThemedText>
                        </ThemedView>
                      )}
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          </Card>
        )}

        {/* RAID Status */}
        {raidData?.data?.arrays && raidData.data.arrays.length > 0 && (
          <Card className="mb-4">
            <ThemedView className="p-4">
              <ThemedView className="flex-row items-center mb-4">
                <Icon name="shield" size={20} className="text-red-500 mr-2" />
                <ThemedText className="text-lg font-semibold">Status RAID</ThemedText>
              </ThemedView>

              {/* Overall Status */}
              {raidData.data.overall && (
                <ThemedView className="flex-row flex-wrap gap-3 mb-4 p-3 bg-muted rounded-lg">
                  <ThemedView className="flex-1 min-w-[45%] items-center">
                    <ThemedText className="text-2xl font-bold">{raidData.data.overall.totalArrays}</ThemedText>
                    <ThemedText className="text-xs text-muted-foreground">Total</ThemedText>
                  </ThemedView>
                  <ThemedView className="flex-1 min-w-[45%] items-center">
                    <ThemedText className="text-2xl font-bold text-success">
                      {raidData.data.overall.healthyArrays}
                    </ThemedText>
                    <ThemedText className="text-xs text-muted-foreground">Saudáveis</ThemedText>
                  </ThemedView>
                  <ThemedView className="flex-1 min-w-[45%] items-center">
                    <ThemedText className="text-2xl font-bold text-warning">
                      {raidData.data.overall.degradedArrays + raidData.data.overall.rebuildingArrays}
                    </ThemedText>
                    <ThemedText className="text-xs text-muted-foreground">Problemas</ThemedText>
                  </ThemedView>
                  <ThemedView className="flex-1 min-w-[45%] items-center">
                    <ThemedText className="text-2xl font-bold text-destructive">
                      {raidData.data.overall.failedArrays}
                    </ThemedText>
                    <ThemedText className="text-xs text-muted-foreground">Falhas</ThemedText>
                  </ThemedView>
                </ThemedView>
              )}

              {/* Individual Arrays */}
              {raidData.data.arrays.map((array: RaidArray, index: number) => (
                <ThemedView
                  key={index}
                  className={`${index > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}
                >
                  <ThemedView className="flex-row justify-between items-start mb-2">
                    <ThemedView>
                      <ThemedText className="text-sm font-semibold">{array.name || array.device}</ThemedText>
                      <ThemedText className="text-xs text-muted-foreground">
                        Nível: {array.level}
                      </ThemedText>
                    </ThemedView>
                    <Badge
                      variant={
                        array.state.toLowerCase() === 'clean' ||
                        array.state.toLowerCase() === 'active'
                          ? 'default'
                          : array.state.toLowerCase() === 'failed'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      <ThemedText className="text-xs">{array.state.toUpperCase()}</ThemedText>
                    </Badge>
                  </ThemedView>

                  <ThemedView className="flex-row justify-between mt-2">
                    <ThemedText className="text-xs text-muted-foreground">Dispositivos</ThemedText>
                    <ThemedText className="text-xs font-medium">
                      {array.activeDevices}/{array.totalDevices}
                    </ThemedText>
                  </ThemedView>

                  {array.rebuildProgress && (
                    <ThemedView className="mt-3 p-2 bg-primary/10 rounded-md">
                      <ThemedText className="text-xs font-medium text-primary mb-2">
                        Reconstrução: {array.rebuildProgress.percentage}%
                      </ThemedText>
                      <Progress value={array.rebuildProgress.percentage} style={{ height: 6 }} />
                    </ThemedView>
                  )}
                </ThemedView>
              ))}
            </ThemedView>
          </Card>
        )}

        {/* Historical Data Summary */}
        {history.length > 0 && (
          <Card className="mb-4">
            <ThemedView className="p-4">
              <ThemedView className="flex-row items-center mb-4">
                <Icon name="trending-up" size={20} className="text-primary mr-2" />
                <ThemedText className="text-lg font-semibold">
                  Histórico ({selectedTimeRange})
                </ThemedText>
              </ThemedView>

              <ThemedView className="space-y-3">
                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm text-muted-foreground">Amostras coletadas</ThemedText>
                  <ThemedText className="text-sm font-medium">{history.length}</ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm text-muted-foreground">CPU média</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {!isNaN(historicalAverages.cpu) ? historicalAverages.cpu.toFixed(1) : '0.0'}%
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm text-muted-foreground">Memória média</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {!isNaN(historicalAverages.memory) ? historicalAverages.memory.toFixed(1) : '0.0'}%
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm text-muted-foreground">Disco médio</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {!isNaN(historicalAverages.disk) ? historicalAverages.disk.toFixed(1) : '0.0'}%
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row justify-between items-center">
                  <ThemedText className="text-sm text-muted-foreground">Última atualização</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {new Date(history[0]?.lastUpdated || Date.now()).toLocaleTimeString('pt-BR')}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </Card>
        )}

        {/* Network Details */}
        {metrics?.network?.interfaces && metrics.network.interfaces.length > 0 && (
          <Card className="mb-4">
            <ThemedView className="p-4">
              <ThemedView className="flex-row items-center mb-4">
                <Icon name="wifi" size={20} className="text-orange-500 mr-2" />
                <ThemedText className="text-lg font-semibold">Interfaces de Rede</ThemedText>
              </ThemedView>

              {metrics.network.interfaces.map((iface, index) => (
                <ThemedView
                  key={index}
                  className={`${index > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}
                >
                  <ThemedText className="text-sm font-semibold mb-1">{iface.name}</ThemedText>
                  <ThemedText className="text-xs text-muted-foreground mb-2">
                    IP: {iface.ip}
                    {iface.mac && ` • MAC: ${iface.mac}`}
                  </ThemedText>

                  <ThemedView className="flex-row gap-2">
                    <ThemedView className="flex-1 bg-success/10 rounded-md" style={{ padding: 14 }}>
                      <ThemedView className="flex-row items-center justify-center" style={{ marginBottom: 8 }}>
                        <Icon name="download" size={14} className="text-success mr-1" />
                        <ThemedText
                          className="text-muted-foreground"
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            includeFontPadding: false,
                            textAlignVertical: 'center',
                            lineHeight: 16,
                          }}
                        >
                          RX
                        </ThemedText>
                      </ThemedView>
                      <ThemedText
                        className="font-medium text-center"
                        style={{
                          fontSize: 13,
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                          lineHeight: 18,
                        }}
                      >
                        {formatBytes(iface.rx)}
                      </ThemedText>
                    </ThemedView>

                    <ThemedView className="flex-1 bg-primary/10 rounded-md" style={{ padding: 14 }}>
                      <ThemedView className="flex-row items-center justify-center" style={{ marginBottom: 8 }}>
                        <Icon name="upload" size={14} className="text-primary mr-1" />
                        <ThemedText
                          className="text-muted-foreground"
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            includeFontPadding: false,
                            textAlignVertical: 'center',
                            lineHeight: 16,
                          }}
                        >
                          TX
                        </ThemedText>
                      </ThemedView>
                      <ThemedText
                        className="font-medium text-center"
                        style={{
                          fontSize: 13,
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                          lineHeight: 18,
                        }}
                      >
                        {formatBytes(iface.tx)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}
