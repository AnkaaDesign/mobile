import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSystemHealth, getSystemStatus, getMetrics } from '../../../api-client';
import { ThemedView } from '@/components/ui/themed-view';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ErrorScreen } from '@/components/ui/error-screen';
import { DashboardCard } from '@/components/ui/dashboard-card';

export default function ServerStatusScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Query for system health
  const { data: healthData, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query for system status
  const { data: statusData, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: getSystemStatus,
    refetchInterval: 30000,
  });

  // Query for system metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: getMetrics,
    refetchInterval: 15000, // Refresh every 15 seconds for real-time metrics
  });

  const isLoading = healthLoading || statusLoading || metricsLoading;
  const hasError = healthError || statusError || metricsError;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchHealth(),
        refetchStatus(),
        refetchMetrics(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'running':
      case 'active':
        return 'success';
      case 'warning':
      case 'degraded':
        return 'warning';
      case 'critical':
      case 'error':
      case 'stopped':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'running':
      case 'active':
        return 'check-circle';
      case 'warning':
      case 'degraded':
        return 'alert-triangle';
      case 'critical':
      case 'error':
      case 'stopped':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  };

  if (isLoading && !healthData && !statusData && !metricsData) {
    return <LoadingScreen message="Carregando status do servidor..." />;
  }

  if (hasError && !healthData && !statusData && !metricsData) {
    return (
      <ErrorScreen
        title="Erro ao carregar status"
        message="Não foi possível carregar o status do servidor"
        onRetry={handleRefresh}
      />
    );
  }

  const systemHealth = healthData?.data;
  const systemStatus = statusData?.data;
  const metrics = metricsData?.data;

  const uptime = metrics?.uptime ? formatUptime(metrics.uptime) : 'N/A';
  const cpuUsage = metrics?.cpu?.usage || 0;
  const memoryUsage = metrics?.memory?.percentage || 0;
  const diskUsage = metrics?.disk?.percentage || 0;

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Overall System Status */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold">Status Geral do Sistema</ThemedText>
              <Badge variant={getStatusColor(systemHealth?.overall || 'unknown')}>
                <ThemedView className="flex-row items-center">
                  <Icon
                    name={getStatusIcon(systemHealth?.overall || 'unknown')}
                    size={12}
                    className="mr-1"
                  />
                  <ThemedText className="text-xs">
                    {systemHealth?.overall || 'Desconhecido'}
                  </ThemedText>
                </ThemedView>
              </Badge>
            </ThemedView>

            <ThemedView className="mb-2">
              <ThemedText className="text-sm text-muted-foreground">Tempo de atividade</ThemedText>
              <ThemedText className="text-base font-medium">{uptime}</ThemedText>
            </ThemedView>

            {systemHealth?.lastUpdated && (
              <ThemedView>
                <ThemedText className="text-sm text-muted-foreground">Última verificação</ThemedText>
                <ThemedText className="text-base font-medium">
                  {new Date(systemHealth.lastUpdated).toLocaleString('pt-BR')}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Card>

        {/* Resource Usage Overview */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedText className="text-lg font-semibold mb-4">Uso de Recursos</ThemedText>

            {/* CPU Usage */}
            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm font-medium">CPU</ThemedText>
                <ThemedText className="text-sm">{Math.round(cpuUsage)}%</ThemedText>
              </ThemedView>
              <Progress value={cpuUsage} style={{ height: 8 }} />
            </ThemedView>

            {/* Memory Usage */}
            <ThemedView className="mb-4">
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm font-medium">Memória</ThemedText>
                <ThemedText className="text-sm">{Math.round(memoryUsage)}%</ThemedText>
              </ThemedView>
              <Progress value={memoryUsage} style={{ height: 8 }} />
            </ThemedView>

            {/* Disk Usage */}
            <ThemedView>
              <ThemedView className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm font-medium">Disco</ThemedText>
                <ThemedText className="text-sm">{Math.round(diskUsage)}%</ThemedText>
              </ThemedView>
              <Progress value={diskUsage} style={{ height: 8 }} />
            </ThemedView>
          </ThemedView>
        </Card>

        {/* System Health Details */}
        {systemHealth && (
          <Card className="mb-4">
            <ThemedView className="p-4">
              <ThemedText className="text-lg font-semibold mb-4">Detalhes de Saúde</ThemedText>

              {systemHealth.services && (
                <ThemedView className="mb-3">
                  <ThemedView className="flex-row items-center justify-between">
                    <ThemedText className="text-sm font-medium">Serviços</ThemedText>
                    <Badge variant={systemHealth.services.healthy === systemHealth.services.total ? 'default' : 'warning'}>
                      <ThemedText className="text-xs">
                        {systemHealth.services.healthy}/{systemHealth.services.total}
                      </ThemedText>
                    </Badge>
                  </ThemedView>
                </ThemedView>
              )}

              {systemHealth.resources && (
                <ThemedView className="mb-3">
                  <ThemedView className="flex-row items-center justify-between">
                    <ThemedText className="text-sm font-medium">CPU</ThemedText>
                    <Badge variant={getStatusColor(systemHealth.resources.cpu > 90 ? 'critical' : systemHealth.resources.cpu > 75 ? 'warning' : 'healthy')}>
                      <ThemedText className="text-xs">{systemHealth.resources.cpu}%</ThemedText>
                    </Badge>
                  </ThemedView>
                </ThemedView>
              )}

              {systemHealth.resources && (
                <ThemedView className="mb-3">
                  <ThemedView className="flex-row items-center justify-between">
                    <ThemedText className="text-sm font-medium">Memória</ThemedText>
                    <Badge variant={getStatusColor(systemHealth.resources.memory > 90 ? 'critical' : systemHealth.resources.memory > 75 ? 'warning' : 'healthy')}>
                      <ThemedText className="text-xs">{systemHealth.resources.memory}%</ThemedText>
                    </Badge>
                  </ThemedView>
                </ThemedView>
              )}

              {systemHealth.resources && (
                <ThemedView>
                  <ThemedView className="flex-row items-center justify-between">
                    <ThemedText className="text-sm font-medium">Disco</ThemedText>
                    <Badge variant={getStatusColor(systemHealth.resources.disk > 90 ? 'critical' : systemHealth.resources.disk > 75 ? 'warning' : 'healthy')}>
                      <ThemedText className="text-xs">{systemHealth.resources.disk}%</ThemedText>
                    </Badge>
                  </ThemedView>
                </ThemedView>
              )}
            </ThemedView>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <ThemedView className="flex-row flex-wrap gap-2">
          <DashboardCard
            title="Serviços Ativos"
            value={systemHealth?.services?.healthy?.toString() || '0'}
            icon="server"
            style={{ flex: 1, minWidth: '45%' }}
          />

          <DashboardCard
            title="Interfaces Rede"
            value={metrics?.network?.interfaces?.length?.toString() || '0'}
            icon="link"
            style={{ flex: 1, minWidth: '45%' }}
          />

          <DashboardCard
            title="Carga do Sistema"
            value={metrics?.cpu?.loadAverage?.[0]?.toFixed(2) || '0.00'}
            icon="activity"
            style={{ flex: 1, minWidth: '45%' }}
          />

          <DashboardCard
            title="Temperatura CPU"
            value={metrics?.cpu?.temperature ? `${Math.round(metrics.cpu.temperature)}°C` : 'N/A'}
            icon="thermometer"
            style={{ flex: 1, minWidth: '45%' }}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function formatUptime(seconds: number): string {
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
}