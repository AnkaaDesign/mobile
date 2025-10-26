import { useQuery } from "@tanstack/react-query";
import {
  systemHealthService,
  serverMonitoringService,
  ssdHealthService,
  raidStatusService,
  backupService,
  webDavService,
} from '@/api-client';
import type {
  SystemHealthGetUniqueResponse,
  SystemHealthGetManyResponse,
  SystemMetricsGetUniqueResponse,
  SystemServicesResponse,
  ServiceLogsResponse,
  SsdHealthDataGetManyResponse,
  RaidStatusGetManyResponse,
  BackupMetadataGetManyResponse,
  WebDavInfoGetManyResponse,
} from '@/types';

// Query keys for monitoring
export const monitoringKeys = {
  all: ["monitoring"] as const,
  health: () => [...monitoringKeys.all, "health"] as const,
  healthHistory: (hours: number) => [...monitoringKeys.health(), "history", hours] as const,
  metrics: () => [...monitoringKeys.all, "metrics"] as const,
  services: () => [...monitoringKeys.all, "services"] as const,
  serviceLogs: (serviceName: string, lines?: number) => [...monitoringKeys.services(), serviceName, "logs", lines] as const,
  ssdHealth: () => [...monitoringKeys.all, "ssd-health"] as const,
  raidStatus: () => [...monitoringKeys.all, "raid-status"] as const,
  backups: () => [...monitoringKeys.all, "backups"] as const,
  webdav: () => [...monitoringKeys.all, "webdav"] as const,
};

// System Health hooks
export function useSystemHealth() {
  return useQuery({
    queryKey: monitoringKeys.health(),
    queryFn: () => systemHealthService.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Data becomes stale after 20 seconds
  });
}

export function useSystemHealthHistory(hours: number = 24) {
  return useQuery({
    queryKey: monitoringKeys.healthHistory(hours),
    queryFn: () => systemHealthService.getHealthHistory(hours),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Data becomes stale after 2 minutes
  });
}

// System Metrics hooks
export function useSystemMetrics() {
  return useQuery({
    queryKey: monitoringKeys.metrics(),
    queryFn: () => serverMonitoringService.getMetrics(),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000, // Data becomes stale after 10 seconds
  });
}

// System Services hooks
export function useSystemServices() {
  return useQuery({
    queryKey: monitoringKeys.services(),
    queryFn: () => serverMonitoringService.getServices(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Data becomes stale after 20 seconds
  });
}

export function useServiceLogs(serviceName: string, lines: number = 100, enabled: boolean = true) {
  return useQuery({
    queryKey: monitoringKeys.serviceLogs(serviceName, lines),
    queryFn: () => serverMonitoringService.getServiceLogs(serviceName, lines),
    refetchInterval: 5000, // Refresh every 5 seconds for logs
    staleTime: 3000, // Data becomes stale after 3 seconds
    enabled, // Only fetch when enabled
  });
}

// Hardware Monitoring hooks
export function useSsdHealthData() {
  return useQuery({
    queryKey: monitoringKeys.ssdHealth(),
    queryFn: () => ssdHealthService.getSsdHealthData(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 45000, // Data becomes stale after 45 seconds
  });
}

export function useRaidStatus() {
  return useQuery({
    queryKey: monitoringKeys.raidStatus(),
    queryFn: () => raidStatusService.getRaidStatus(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 45000, // Data becomes stale after 45 seconds
  });
}

// Backup Monitoring hooks
export function useBackupMetadata() {
  return useQuery({
    queryKey: monitoringKeys.backups(),
    queryFn: () => backupService.getBackupMetadata(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Data becomes stale after 2 minutes
  });
}

// WebDAV Monitoring hooks
export function useWebDavInfo() {
  return useQuery({
    queryKey: monitoringKeys.webdav(),
    queryFn: () => webDavService.getWebDavInfo(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 45000, // Data becomes stale after 45 seconds
  });
}

// Combined dashboard hook that fetches multiple monitoring data
export function useMonitoringDashboard() {
  const systemHealth = useSystemHealth();
  const systemMetrics = useSystemMetrics();
  const systemServices = useSystemServices();
  const ssdHealth = useSsdHealthData();
  const raidStatus = useRaidStatus();

  return {
    systemHealth,
    systemMetrics,
    systemServices,
    ssdHealth,
    raidStatus,
    isLoading: systemHealth.isLoading || systemMetrics.isLoading || systemServices.isLoading,
    isError: systemHealth.isError || systemMetrics.isError || systemServices.isError,
    error: systemHealth.error || systemMetrics.error || systemServices.error,
  };
}