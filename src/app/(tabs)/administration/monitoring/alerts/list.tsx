import React, { useCallback, useState, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconFilter } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { useSystemHealth, useSystemHealthHistory, useSystemServices } from "@/hooks/monitoring";
import { useTheme } from "@/lib/theme";
import { NOTIFICATION_IMPORTANCE } from '../../../../../constants';
import { AlertTable } from "@/components/administration/monitoring/alert/list/alert-table";
import { AlertFilterModal, type AlertFilters } from "@/components/administration/monitoring/alert/list/alert-filter-modal";
import { AlertFilterTags } from "@/components/administration/monitoring/alert/list/alert-filter-tags";
import { AlertListSkeleton } from "@/components/administration/monitoring/alert/skeleton/alert-list-skeleton";
import type { AlertItem } from "@/components/administration/monitoring/alert/list/alert-table";

export default function AlertsListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AlertFilters>({
    showUnresolved: true, // Default to showing only unresolved
  });

  const {
    data: healthData,
    isLoading: isHealthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useSystemHealth();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useSystemHealthHistory(24);

  const {
    data: servicesData,
    isLoading: isServicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useSystemServices();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHealth(), refetchHistory(), refetchServices()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchHealth, refetchHistory, refetchServices]);

  // Generate alerts from system data
  const alerts = useMemo(() => {
    const alertsList: AlertItem[] = [];
    const now = new Date();

    // Health-based alerts
    if (healthData?.data) {
      const health = healthData.data;

      // CPU alerts
      if (health.resources?.cpu && health.resources.cpu > 90) {
        alertsList.push({
          id: "cpu-high",
          type: "SYSTEM_RESOURCE",
          severity: NOTIFICATION_IMPORTANCE.URGENT,
          title: "CPU Usage Crítico",
          description: `Uso de CPU em ${health.resources.cpu.toFixed(1)}%`,
          timestamp: new Date(health.lastUpdated || now),
          source: "Sistema",
          acknowledged: false,
          resolved: false,
        });
      } else if (health.resources?.cpu && health.resources.cpu > 80) {
        alertsList.push({
          id: "cpu-warning",
          type: "SYSTEM_RESOURCE",
          severity: NOTIFICATION_IMPORTANCE.HIGH,
          title: "CPU Usage Elevado",
          description: `Uso de CPU em ${health.resources.cpu.toFixed(1)}%`,
          timestamp: new Date(health.lastUpdated || now),
          source: "Sistema",
          acknowledged: false,
          resolved: false,
        });
      }

      // Memory alerts
      if (health.resources?.memory && health.resources.memory > 95) {
        alertsList.push({
          id: "memory-critical",
          type: "SYSTEM_RESOURCE",
          severity: NOTIFICATION_IMPORTANCE.URGENT,
          title: "Memória Crítica",
          description: `Uso de memória em ${health.resources.memory.toFixed(1)}%`,
          timestamp: new Date(health.lastUpdated || now),
          source: "Sistema",
          acknowledged: false,
          resolved: false,
        });
      } else if (health.resources?.memory && health.resources.memory > 85) {
        alertsList.push({
          id: "memory-warning",
          type: "SYSTEM_RESOURCE",
          severity: NOTIFICATION_IMPORTANCE.HIGH,
          title: "Memória Elevada",
          description: `Uso de memória em ${health.resources.memory.toFixed(1)}%`,
          timestamp: new Date(health.lastUpdated || now),
          source: "Sistema",
          acknowledged: false,
          resolved: false,
        });
      }

      // Disk alerts
      if (health.resources?.disk && health.resources.disk > 95) {
        alertsList.push({
          id: "disk-critical",
          type: "SYSTEM_RESOURCE",
          severity: NOTIFICATION_IMPORTANCE.URGENT,
          title: "Espaço em Disco Crítico",
          description: `Uso de disco em ${health.resources.disk.toFixed(1)}%`,
          timestamp: new Date(health.lastUpdated || now),
          source: "Sistema",
          acknowledged: false,
          resolved: false,
        });
      } else if (health.resources?.disk && health.resources.disk > 90) {
        alertsList.push({
          id: "disk-warning",
          type: "SYSTEM_RESOURCE",
          severity: NOTIFICATION_IMPORTANCE.HIGH,
          title: "Espaço em Disco Baixo",
          description: `Uso de disco em ${health.resources.disk.toFixed(1)}%`,
          timestamp: new Date(health.lastUpdated || now),
          source: "Sistema",
          acknowledged: false,
          resolved: false,
        });
      }
    }

    // Service-based alerts
    if (servicesData?.data) {
      servicesData.data.forEach((service) => {
        if (service.status !== "active" && service.enabled) {
          alertsList.push({
            id: `service-${service.name}`,
            type: "SERVICE_DOWN",
            severity: NOTIFICATION_IMPORTANCE.URGENT,
            title: "Serviço Inativo",
            description: `${service.name} não está executando`,
            timestamp: now,
            source: "Serviços",
            acknowledged: false,
            resolved: false,
          });
        }
      });
    }

    // Add some example alerts for demonstration
    alertsList.push(
      {
        id: "backup-info",
        type: "BACKUP_SUCCESS",
        severity: NOTIFICATION_IMPORTANCE.LOW,
        title: "Backup Completo",
        description: "Backup noturno executado com sucesso",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        source: "Backup",
        acknowledged: true,
        resolved: true,
      },
      {
        id: "network-warning",
        type: "NETWORK_ISSUE",
        severity: NOTIFICATION_IMPORTANCE.HIGH,
        title: "Latência de Rede Alta",
        description: "Latência média de 250ms detectada",
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        source: "Rede",
        acknowledged: false,
        resolved: false,
      }
    );

    return alertsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [healthData, servicesData]);

  // Apply filters and search
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Filter by severity
      if (filters.severities && filters.severities.length > 0) {
        if (!filters.severities.includes(alert.severity)) return false;
      }

      // Filter by type
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(alert.type as any)) return false;
      }

      // Filter by acknowledged status
      if (filters.showAcknowledged === false && alert.acknowledged) return false;
      if (filters.showAcknowledged === true && !alert.acknowledged) {
        // Only show acknowledged if explicitly requested
      }

      // Filter by resolved status
      if (filters.showResolved === false && alert.resolved) return false;
      if (filters.showUnresolved === true && alert.resolved) return false;

      // Filter by source
      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.includes(alert.source)) return false;
      }

      // Filter by date range
      if (filters.dateRange) {
        if (filters.dateRange.start && alert.timestamp < filters.dateRange.start) return false;
        if (filters.dateRange.end && alert.timestamp > filters.dateRange.end) return false;
      }

      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          alert.title.toLowerCase().includes(searchLower) ||
          alert.description.toLowerCase().includes(searchLower) ||
          alert.source.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [alerts, filters, searchText]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: AlertFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ showUnresolved: true });
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const handleAcknowledge = useCallback((alertId: string) => {
    // In a real implementation, this would call an API
    console.log(`Acknowledged alert: ${alertId}`);
  }, []);

  const handleResolve = useCallback((alertId: string) => {
    // In a real implementation, this would call an API
    console.log(`Resolved alert: ${alertId}`);
  }, []);

  const handleDismiss = useCallback((alertId: string) => {
    // In a real implementation, this would call an API
    console.log(`Dismissed alert: ${alertId}`);
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.severities?.length) count++;
    if (filters.types?.length) count++;
    if (filters.showAcknowledged !== undefined) count++;
    if (filters.showResolved !== undefined) count++;
    if (filters.showUnresolved !== true) count++; // Count if changed from default
    if (filters.sources?.length) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  // Calculate summary counts
  const criticalCount = filteredAlerts.filter(
    (a) => a.severity === NOTIFICATION_IMPORTANCE.URGENT && !a.resolved
  ).length;
  const warningCount = filteredAlerts.filter(
    (a) => a.severity === NOTIFICATION_IMPORTANCE.HIGH && !a.resolved
  ).length;

  if (isHealthLoading && isServicesLoading && !refreshing) {
    return <AlertListSkeleton />;
  }

  if (healthError || servicesError) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <ErrorScreen
          message="Erro ao carregar alertas"
          detail={(healthError || servicesError)?.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Header with summary */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Badge style={{ backgroundColor: colors.destructive }}>
              <ThemedText style={[styles.badgeText, { color: "white" }]}>{criticalCount}</ThemedText>
            </Badge>
            <ThemedText style={styles.summaryLabel}>Críticos</ThemedText>
          </View>

          <View style={styles.summaryItem}>
            <Badge style={{ backgroundColor: colors.warning }}>
              <ThemedText style={[styles.badgeText, { color: "white" }]}>{warningCount}</ThemedText>
            </Badge>
            <ThemedText style={styles.summaryLabel}>Avisos</ThemedText>
          </View>

          <View style={styles.summaryItem}>
            <Badge style={{ backgroundColor: colors.primary }}>
              <ThemedText style={[styles.badgeText, { color: "white" }]}>{filteredAlerts.length}</ThemedText>
            </Badge>
            <ThemedText style={styles.summaryLabel}>Total</ThemedText>
          </View>
        </View>
      </View>

      {/* Search and filters */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar alertas..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            },
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <IconFilter size={24} color={colors.foreground} />
          {activeFiltersCount > 0 && (
            <Badge style={styles.actionBadge} variant="destructive" size="sm">
              <ThemedText style={[styles.actionBadgeText, { color: "white" }]}>{activeFiltersCount}</ThemedText>
            </Badge>
          )}
        </Pressable>
      </View>

      {/* Filter tags */}
      <AlertFilterTags filters={filters} onFilterChange={handleApplyFilters} onClearAll={handleClearFilters} />

      {/* Alerts list */}
      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bell"
            title={searchText ? "Nenhum alerta encontrado" : "Nenhum alerta ativo"}
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Todos os sistemas estão funcionando normalmente"
            }
          />
        </View>
      ) : (
        <AlertTable
          alerts={filteredAlerts}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          onDismiss={handleDismiss}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          loading={isHealthLoading || isServicesLoading}
        />
      )}

      {/* Filter Modal */}
      <AlertFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
